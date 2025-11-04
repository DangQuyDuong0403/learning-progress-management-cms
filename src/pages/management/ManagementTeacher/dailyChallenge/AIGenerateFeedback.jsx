import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Typography, Modal } from 'antd';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { ArrowLeftOutlined, SaveOutlined, ThunderboltOutlined, CloseCircleOutlined, DeleteOutlined, CommentOutlined } from '@ant-design/icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import ThemedLayout from '../../../../component/teacherlayout/ThemedLayout';
import { useTheme } from '../../../../contexts/ThemeContext';
import dailyChallengeApi from '../../../../apis/backend/dailyChallengeManagement';
import { spaceToast } from '../../../../component/SpaceToastify';

const { Title, Text } = Typography;

// A grading/feedback screen mirroring the layout of AIGenerateQuestions but with
// left = student's submission (writing/listening) and right = score + feedback (with AI assist)
const AIGenerateFeedback = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { id: challengeId, submissionId: routeSubmissionId, submissionQuestionId: routeSubmissionQuestionId } = useParams();
  const { user } = useSelector((state) => state.auth);

  // From navigation state if provided
  const nav = location.state || {};
  const submissionId = nav.submissionId || routeSubmissionId;
  const submissionQuestionId = nav.prefill?.submissionQuestionId || routeSubmissionQuestionId;
  const sectionId = nav.sectionId || null; // Still used for display, but submissionQuestionId is primary
  const prefill = nav.prefill || {};

  const primaryColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
  const primaryColorWithAlpha = theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)';

  // Helper: strip html to plain text for speaking transcripts coming from rich editors
  const stripHtmlToText = React.useCallback((html) => {
    if (!html || typeof html !== 'string') return '';
    try {
      const withoutTags = html.replace(/<[^>]*>/g, ' ');
      const normalizedSpaces = withoutTags.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      return normalizedSpaces;
    } catch {
      return html;
    }
  }, []);

  // Helper: extract image srcs from html (data URLs or http urls)
  const extractImageSources = React.useCallback((html) => {
    if (!html || typeof html !== 'string') return [];
    try {
      const results = [];
      const regex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
      let match;
      while ((match = regex.exec(html)) !== null) {
        if (match[1]) results.push(match[1]);
      }
      return results;
    } catch {
      return [];
    }
  }, []);

  // Helper: extract duration marker from content (e.g., [[dur_3]] -> { minutes: 3, found: true })
  const extractDurationMarker = React.useCallback((html) => {
    if (!html || typeof html !== 'string') return { found: false, minutes: null, cleanedContent: html };
    const durPattern = /\[\[dur_(\d+)\]\]/g;
    let match = durPattern.exec(html);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const cleanedContent = html.replace(durPattern, '').trim();
      return { found: true, minutes, cleanedContent };
    }
    return { found: false, minutes: null, cleanedContent: html };
  }, []);

  // Helper: render HTML as ordered plain-text chunks + inline images (preserve order)
  const renderHtmlAsOrderedTextAndImages = React.useCallback((html) => {
    if (!html || typeof html !== 'string') return null;
    try {
      const container = document.createElement('div');
      container.innerHTML = html;
      const elements = [];
      const normalizeText = (t) => (t || '')
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const walk = (node, keyPrefix = 'n') => {
        if (!node) return;
        if (node.nodeType === Node.TEXT_NODE) {
          const text = normalizeText(node.nodeValue || '');
          if (text) elements.push(<span key={`${keyPrefix}-${elements.length}`}>{text}</span>);
          return;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'IMG') {
            const src = node.getAttribute('src');
            if (src) {
              elements.push(
                <img
                  key={`${keyPrefix}-img-${elements.length}`}
                  src={src}
                  alt="speaking-img"
                  style={{ maxWidth: '100%', width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)', margin: '6px 8px' }}
                />
              );
            }
            return;
          }
          // For other elements, recurse through children in order
          node.childNodes.forEach((child, idx) => walk(child, `${keyPrefix}-${idx}`));
        }
      };
      container.childNodes.forEach((child, idx) => walk(child, `root-${idx}`));
      return elements;
    } catch {
      return stripHtmlToText(html);
    }
  }, [stripHtmlToText]);

  // Content on the left
  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [section, setSection] = useState(prefill.section || null);
  const [studentAnswer, setStudentAnswer] = useState(prefill.studentAnswer || null);
  
  // Header data
  const [className, setClassName] = useState(nav.className || null);
  const [challengeName, setChallengeName] = useState(nav.challengeName || null);
  const [studentName, setStudentName] = useState(nav.studentName || null);

  // Right side controls
  const [score, setScore] = useState(typeof prefill.score === 'number' ? prefill.score : '');
  const [feedback, setFeedback] = useState(prefill.feedback || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const handleClear = useCallback(() => {
    try {
      setScore('');
      setFeedback('');
      const secId = section?.id || prefill?.section?.id;
      if (secId) {
        setWritingSectionFeedbacks(prev => ({ ...prev, [secId]: [] }));
      } else {
        setWritingSectionFeedbacks({});
      }
      spaceToast.success('Cleared. Click Save to apply.');
    } catch {}
  }, [section?.id, prefill?.section?.id]);
  // Right panel mode: null (choose), 'manual', 'ai'
  const [rightMode, setRightMode] = useState(null);
  const [hasAIGenerated, setHasAIGenerated] = useState(false);
  const handleScoreChange = useCallback((e) => {
    const raw = Number(e?.target?.value);
    if (!Number.isFinite(raw)) { setScore(''); return; }
    const clamped = Math.max(0, Math.min(10, raw));
    setScore(clamped);
  }, []);

  // Map to reuse existing comment/highlight logic structure
  const studentAnswers = useMemo(() => {
    if (!section || !section?.id) return {};
    return { [section.id]: studentAnswer || {} };
  }, [section, studentAnswer]);

  // Comment-on-highlight states (replicated behavior)
  const [writingSectionFeedbacks, setWritingSectionFeedbacks] = useState({});
  const [textSelection, setTextSelection] = useState({
    visible: false,
    sectionId: null,
    startIndex: null,
    endIndex: null,
    position: { x: 0, y: 0 },
  });
  const [selectedComment, setSelectedComment] = useState(null);
  const [showCommentSidebar, setShowCommentSidebar] = useState(false);
  const [hoveredHighlightId, setHoveredHighlightId] = useState(null);
  const [commentModal, setCommentModal] = useState({
    visible: false,
    sectionId: null,
    startIndex: null,
    endIndex: null,
    comment: '',
    isEdit: false,
    feedbackId: null,
  });
  // Floating comment popover near selected highlight
  const leftContainerRef = React.useRef(null);
  const popoverRef = React.useRef(null);
  const [commentPopover, setCommentPopover] = useState({ visible: false, x: 0, y: 0, feedback: null });

  const handleCommentInputChange = useCallback((e) => {
    const value = e.target.value;
    setCommentModal(prev => ({ ...prev, comment: value }));
  }, []);

  // Handle text selection in Writing/Speaking text
  const handleTextSelection = useCallback((targetSectionId, textElement) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setTextSelection({ visible: false, sectionId: null, startIndex: null, endIndex: null, position: { x: 0, y: 0 } });
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();

    if (!selectedText || selectedText.trim().length === 0) {
      setTextSelection({ visible: false, sectionId: null, startIndex: null, endIndex: null, position: { x: 0, y: 0 } });
      return;
    }

    if (!textElement.contains(range.commonAncestorContainer)) {
      setTextSelection({ visible: false, sectionId: null, startIndex: null, endIndex: null, position: { x: 0, y: 0 } });
      return;
    }

    const studentAns = studentAnswers?.[targetSectionId] || {};
    const essayText = studentAns?.text || studentAns?.essay || '';
    if (!essayText) return;

    const startRange = document.createRange();
    startRange.setStart(textElement, 0);
    startRange.setEnd(range.startContainer, range.startOffset);
    let startIndex = startRange.toString().length;

    const endRange = document.createRange();
    endRange.setStart(textElement, 0);
    endRange.setEnd(range.endContainer, range.endOffset);
    let endIndex = endRange.toString().length;

    const calculatedText = essayText.substring(startIndex, endIndex);
    if (
      calculatedText.trim() !== selectedText.trim() &&
      !calculatedText.includes(selectedText.trim()) &&
      !selectedText.trim().includes(calculatedText)
    ) {
      const trimmedSelected = selectedText.trim();
      const foundIndex = essayText.indexOf(trimmedSelected);
      if (foundIndex !== -1) {
        startIndex = foundIndex;
        endIndex = foundIndex + trimmedSelected.length;
      }
    }

    const rect = range.getBoundingClientRect();
    const containerRect = textElement.getBoundingClientRect();
    const relativeX = rect.right - containerRect.left + 10;
    const relativeY = rect.top - containerRect.top + (rect.height / 2);

    setTextSelection({
      visible: true,
      sectionId: targetSectionId,
      startIndex,
      endIndex,
      position: { x: relativeX, y: relativeY },
    });
  }, [studentAnswers]);

  const handleAddComment = useCallback(() => {
    if (textSelection.sectionId !== null && textSelection.startIndex !== null && textSelection.endIndex !== null) {
      setCommentModal({
        visible: true,
        sectionId: textSelection.sectionId,
        startIndex: textSelection.startIndex,
        endIndex: textSelection.endIndex,
        comment: '',
        isEdit: false,
        feedbackId: null,
      });
      setTextSelection({ visible: false, sectionId: null, startIndex: null, endIndex: null, position: { x: 0, y: 0 } });
      window.getSelection()?.removeAllRanges();
    }
  }, [textSelection]);

  const handleSaveComment = useCallback(() => {
    if (commentModal.sectionId && commentModal.startIndex !== null && commentModal.endIndex !== null) {
      const sectionIdToUse = commentModal.sectionId;
      const feedbackId = commentModal.feedbackId || `feedback-${Date.now()}-${Math.random()}`;

      const newFeedback = {
        id: feedbackId,
        startIndex: commentModal.startIndex,
        endIndex: commentModal.endIndex,
        comment: commentModal.comment,
        timestamp: new Date().toISOString(),
      };

      setWritingSectionFeedbacks(prev => {
        const sectionFeedbacks = prev[sectionIdToUse] || [];
        if (commentModal.isEdit) {
          const updated = sectionFeedbacks.map(fb => fb.id === feedbackId ? newFeedback : fb);
          return { ...prev, [sectionIdToUse]: updated };
        } else {
          return { ...prev, [sectionIdToUse]: [...sectionFeedbacks, newFeedback] };
        }
      });

      setCommentModal({
        visible: false,
        sectionId: null,
        startIndex: null,
        endIndex: null,
        comment: '',
        isEdit: false,
        feedbackId: null,
      });
    }
  }, [commentModal]);

  const handleDeleteComment = useCallback(() => {
    const targetId = selectedComment?.id || commentPopover?.feedback?.id;
    if (!targetId) return;

    let sectionKey = null;
    if (section?.id && Array.isArray(writingSectionFeedbacks?.[section.id]) &&
        writingSectionFeedbacks[section.id].some(fb => fb.id === targetId)) {
      sectionKey = String(section.id);
    } else {
      sectionKey = Object.keys(writingSectionFeedbacks).find(id =>
        writingSectionFeedbacks[id]?.some(fb => fb.id === targetId)
      ) || null;
    }

    if (sectionKey) {
      setWritingSectionFeedbacks(prev => {
        const sectionFeedbacks = prev[sectionKey] || [];
        const updated = sectionFeedbacks.filter(fb => fb.id !== targetId);
        return { ...prev, [sectionKey]: updated };
      });
      setShowCommentSidebar(false);
      setCommentPopover(prev => ({ ...prev, visible: false, feedback: null }));
      setHoveredHighlightId(null);
      setSelectedComment(null);
    }
  }, [selectedComment, commentPopover?.feedback, writingSectionFeedbacks, section?.id]);

  const handleHighlightClick = useCallback((feedbackObj, event) => {
    try {
      const containerRect = leftContainerRef.current?.getBoundingClientRect();
      const targetRect = event?.currentTarget?.getBoundingClientRect();
      if (containerRect && targetRect) {
        const x = Math.min(Math.max(targetRect.left - containerRect.left, 8), Math.max(8, (containerRect.width - 360)));
        const y = Math.min(targetRect.bottom - containerRect.top + 8, containerRect.height - 20);
        setSelectedComment(feedbackObj);
        setShowCommentSidebar(false);
        setCommentPopover({ visible: true, x, y, feedback: feedbackObj });
        return;
      }
    } catch {}
    setSelectedComment(feedbackObj);
    setShowCommentSidebar(true);
  }, []);

  const handleEditCommentFromSidebar = useCallback(() => {
    if (selectedComment) {
      const sectionKey = Object.keys(writingSectionFeedbacks).find(id =>
        writingSectionFeedbacks[id]?.some(fb => fb.id === selectedComment.id)
      );
      if (sectionKey) {
        setCommentModal({
          visible: true,
          sectionId: sectionKey,
          startIndex: selectedComment.startIndex,
          endIndex: selectedComment.endIndex,
          comment: selectedComment.comment,
          isEdit: true,
          feedbackId: selectedComment.id,
        });
        setShowCommentSidebar(false);
        setSelectedComment(null);
      }
    }
  }, [selectedComment, writingSectionFeedbacks]);

  // Render essay with highlights (replicated)
  const renderEssayWithHighlights = useCallback((text, sectionKey) => {
    if (!text) return text;
    const sectionFeedbacks = writingSectionFeedbacks[sectionKey] || [];
    if (sectionFeedbacks.length === 0) return text;

    const sortedFeedbacks = [...sectionFeedbacks].sort((a, b) => a.startIndex - b.startIndex);
    const isActiveHighlight = selectedComment && selectedComment.id;

    const intervals = [];
    const breakpoints = new Set();
    sortedFeedbacks.forEach(feedback => {
      breakpoints.add(feedback.startIndex);
      breakpoints.add(feedback.endIndex);
    });
    const sortedBreakpoints = Array.from(breakpoints).sort((a, b) => a - b);
    for (let i = 0; i < sortedBreakpoints.length - 1; i++) {
      const start = sortedBreakpoints[i];
      const end = sortedBreakpoints[i + 1];
      const coveringFeedbacks = sortedFeedbacks.filter(fb => fb.startIndex <= start && fb.endIndex >= end);
      if (coveringFeedbacks.length > 0) {
        intervals.push({ start, end, feedbacks: coveringFeedbacks });
      }
    }

    const parts = [];
    let currentIndex = 0;
    intervals.forEach((interval, idx) => {
      if (interval.start > currentIndex) {
        const plainText = text.substring(currentIndex, interval.start);
        if (plainText) parts.push(<span key={`text-${currentIndex}-${interval.start}`}>{plainText}</span>);
      }
      const intervalText = text.substring(interval.start, interval.end);
      const activeFeedback = interval.feedbacks.find(fb => fb.id === isActiveHighlight);
      const displayFeedback = activeFeedback || interval.feedbacks[0];
      const isActive = activeFeedback !== undefined;
      const isHovered = interval.feedbacks.some(fb => fb.id === hoveredHighlightId);
      const backgroundColor = isActive ? '#FFD700' : (isHovered ? '#FFD700' : '#FFEB3B');
      const fontWeight = (isActive || isHovered) ? '600' : '500';
      const boxShadow = (isActive || isHovered) ? '0 2px 4px rgba(0, 0, 0, 0.2)' : 'none';

      const handleClick = (e) => { if (displayFeedback) handleHighlightClick(displayFeedback, e); };
      const handleMouseEnter = () => { if (interval.feedbacks.length > 0) setHoveredHighlightId(displayFeedback.id); };
      const handleMouseLeave = () => { setHoveredHighlightId(null); };

      parts.push(
        <span
          key={`highlight-${interval.start}-${interval.end}-${idx}`}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundColor,
            cursor: 'pointer',
            padding: '2px 0',
            borderRadius: '3px',
            fontWeight,
            transition: 'all 0.2s ease',
            display: 'inline',
            boxShadow,
          }}
        >
          {intervalText}
        </span>
      );
      currentIndex = interval.end;
    });
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      if (remainingText) parts.push(<span key={`text-final-${currentIndex}`}>{remainingText}</span>);
    }
    return parts;
  }, [hoveredHighlightId, selectedComment, writingSectionFeedbacks, handleHighlightClick]);

  // Hide floating toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (textSelection.visible) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount === 0) {
          setTextSelection({ visible: false, sectionId: null, startIndex: null, endIndex: null, position: { x: 0, y: 0 } });
        }
      }
      if (commentPopover.visible) {
        try {
          if (popoverRef.current && popoverRef.current.contains(event.target)) {
            return; // click inside popover -> do not close
          }
        } catch {}
        setCommentPopover(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [textSelection.visible, commentPopover.visible]);

  const sectionType = useMemo(() => {
    const title = (section?.sectionTitle || section?.title || '').toLowerCase();
    if (/writing/.test(title)) return 'writing';
    if (/listening/.test(title)) return 'listening';
    return prefill.type || 'writing';
  }, [section, prefill.type]);

  // Fetch submission result if not fully provided
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      if (!submissionId) return;
      try {
        setLoading(true);
        const res = await dailyChallengeApi.getSubmissionResult(submissionId);
        const data = res?.data?.data || res?.data || null;
        if (!mounted || !data) return;
        setSubmission(data);
        
        // Extract header data
        if (data.student?.name && !studentName) {
          setStudentName(data.student.name);
        }
        if (data.className && !className) {
          setClassName(data.className);
        }
        if (data.dailyChallenge?.name && !challengeName) {
          setChallengeName(data.dailyChallenge.name);
        }
        if (data.challengeName && !challengeName) {
          setChallengeName(data.challengeName);
        }
        
        if (!section) {
          const allSections = [].concat(
            data.readingSections || [],
            data.listeningSections || [],
            data.writingSections || [],
            data.speakingSections || []
          );
          const found = allSections.find((s) => String(s?.id) === String(sectionId)) || allSections[0] || null;
          setSection(found);
        }
        if (!studentAnswer) {
          // For writing, find first answer text for this section
          const answers = data.studentAnswersMap || {};
          const key = sectionId && answers[sectionId] ? sectionId : Object.keys(answers)[0];
          setStudentAnswer(answers[key] || null);
        }
      } catch (e) {
        // Non-blocking
      } finally {
        setLoading(false);
      }
    };
    if (!prefill.section) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId, sectionId]);

  // Fetch prompt + student's answer by submissionQuestionId (writing/speaking) when provided
  useEffect(() => {
    let mounted = true;
    const fetchSubmissionQuestion = async () => {
      const subQid = submissionQuestionId || prefill?.submissionQuestionId;
      if (!subQid) return;
      try {
        setLoading(true);
        const res = await dailyChallengeApi.getSubmissionQuestion(subQid);
        const q = res?.data?.data || res?.data || {};
        if (!mounted) return;
        const questionText = q?.questionText || '';
        const submittedVal = q?.submittedContent?.data?.[0]?.value || '';
        // Map to local section/studentAnswer so left container can render prompt (top) and student's answer (below)
        setSection(prev => ({
          ...(prev || {}),
          id: prev?.id || q?.submissionQuestionId || q?.questionId || 'section-writing',
          title: prev?.title || 'Writing',
          sectionTitle: prev?.sectionTitle || 'Writing',
          prompt: questionText,
          transcript: questionText,
          sectionsContent: questionText,
        }));
        if (submittedVal && typeof submittedVal === 'string') {
          setStudentAnswer({ text: submittedVal });
        }
      } catch (e) {
        // ignore silently, will fallback to existing data
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissionQuestion();
    return () => { mounted = false; };
  }, [submissionQuestionId, prefill?.submissionQuestionId]);

  // Prefill highlight comments (if navigated from Edit with existing grading)
  useEffect(() => {
    const highlights = Array.isArray(prefill?.highlightComments) ? prefill.highlightComments : [];
    const secId = (section && section.id) || (prefill?.section && prefill.section.id);
    if (secId && highlights.length > 0) {
      const mapped = highlights
        .map((c) => ({
          id: String(c?.id || `feedback-${Date.now()}-${Math.random()}`),
          startIndex: Number(c?.startIndex ?? 0),
          endIndex: Number(c?.endIndex ?? 0),
          comment: String(c?.comment || ''),
          timestamp: c?.timestamp || new Date().toISOString(),
        }))
        .filter((fb) => fb.endIndex > fb.startIndex && fb.comment);
      if (mapped.length > 0) {
        setWritingSectionFeedbacks((prev) => ({ ...prev, [secId]: mapped }));
      }
    }
    // run once when section id becomes available or prefill changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section?.id, prefill?.highlightComments]);

  const handleBack = useCallback(() => {
    const role = user?.role?.toLowerCase();
    const path = role === 'teaching_assistant'
      ? `/teaching-assistant/daily-challenges/detail/${challengeId}/submission/${submissionId}`
      : `/teacher/daily-challenges/detail/${challengeId}/submission/${submissionId}`;
    navigate(path, { state: location.state?.backState });
  }, [navigate, user, challengeId, submissionId, location.state]);

  const buildPromptFromContent = useCallback(() => {
    const essay = studentAnswer?.text || studentAnswer?.essay || '';
    const transcript = section?.transcript || section?.sectionsContent || '';
    const base = sectionType === 'writing' ? essay : transcript;
    return base;
  }, [sectionType, studentAnswer, section]);

  const handleGenerateAI = useCallback(async () => {
    try {
      setIsGenerating(true);
      // Only support writing grading via submissionQuestionId
      if (sectionType !== 'writing') {
        spaceToast.error('AI grading hiện chỉ hỗ trợ cho bài Writing');
        return;
      }
      // Use submissionQuestionId from URL or prefill
      const writingSubmissionQuestionId = submissionQuestionId || prefill?.submissionQuestionId || null;

      if (!writingSubmissionQuestionId) {
        spaceToast.error('Không tìm thấy submissionQuestionId của section để chấm AI');
        return;
      }

      const payload = { submissionQuestionId: writingSubmissionQuestionId };

      const res = await dailyChallengeApi.generateAIFeedback(payload);
      const raw = res?.data?.data || res?.data || {};

      // Map standardized fields from API
      const overallFeedback = raw?.overallFeedback || raw?.feedback || '';
      const suggestedScore = (() => {
        const val = raw?.suggestedScore ?? raw?.score;
        return Number.isFinite(Number(val)) ? Number(val) : '';
      })();
      const aiComments = Array.isArray(raw?.comments) ? raw.comments : [];

      // Apply to UI: right panel can be edited after generation
      if (overallFeedback) setFeedback(String(overallFeedback));
      if (suggestedScore !== '') setScore(suggestedScore);

      if (section?.id && aiComments.length > 0) {
        const mapped = aiComments
          .map((c) => ({
            id: c?.id || `feedback-${Date.now()}-${Math.random()}`,
            startIndex: Number(c?.startIndex ?? 0),
            endIndex: Number(c?.endIndex ?? 0),
            comment: String(c?.comment || ''),
            timestamp: c?.timestamp || new Date().toISOString(),
          }))
          .filter(fb => fb.endIndex > fb.startIndex && fb.comment);

        if (mapped.length > 0) {
          setWritingSectionFeedbacks(prev => ({ ...prev, [section.id]: mapped }));
        }
      }

      // Mark AI generated so that score/feedback fields appear in AI mode
      setHasAIGenerated(true);
      spaceToast.success('AI feedback generated');
    } catch (e) {
      spaceToast.error(e?.response?.data?.message || e?.message || 'Failed to generate AI feedback');
    } finally {
      setIsGenerating(false);
    }
  }, [submissionId, submissionQuestionId, sectionId, sectionType, studentAnswer, section, prefill?.submissionQuestionId, prefill?.rubric]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      // Use submissionQuestionId from URL or prefill (works for both writing and speaking)
      const writingSubmissionQuestionId = submissionQuestionId || prefill?.submissionQuestionId || null;

      if (!writingSubmissionQuestionId) {
        spaceToast.error('Không tìm thấy submissionQuestionId của section để lưu chấm điểm');
        return;
      }

      // Build payload (BE updated)
      const cleanedFeedback = (feedback || '').replace(/<[^>]*>/g, '').trim();
      const numericScore = Number(score);
      const sectionKey = section?.id;
      const highlightComments = sectionKey && Array.isArray(writingSectionFeedbacks?.[sectionKey])
        ? writingSectionFeedbacks[sectionKey].map(fb => ({
            startIndex: Number(fb.startIndex ?? 0),
            endIndex: Number(fb.endIndex ?? 0),
            comment: String(fb.comment || ''),
            id: String(fb.id || ''),
            timestamp: fb.timestamp || new Date().toISOString(),
          }))
        : [];

      const payload = {
        receivedWeight: Number.isFinite(numericScore) ? numericScore : 0,
        feedback: cleanedFeedback,
        highlightComments,
      };

      const res = await dailyChallengeApi.gradeSubmissionQuestion(writingSubmissionQuestionId, payload);
      const beMsg = res?.data?.message || res?.data?.data?.message;
      spaceToast.success(beMsg || 'Saved');
      handleBack();
    } catch (e) {
      spaceToast.error(e?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [sectionType, submissionQuestionId, prefill?.submissionQuestionId, submission, sectionId, section, writingSectionFeedbacks, score, feedback, handleBack]);

  return (
    <ThemedLayout
      customHeader={(
        <header className={`themed-header ${theme}-header`}>
          <nav className="themed-navbar">
            <div className="themed-navbar-content">
              <div className="themed-navbar-brand" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flex: 1
              }}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBack}
                  className={`daily-challenge-menu-back-button ${theme}-daily-challenge-menu-back-button`}
                  style={{
                    height: '32px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    background: '#ffffff',
                    color: '#000000',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                    e.target.style.filter = 'brightness(0.95)';
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.filter = 'none';
                    e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {t('common.back')}
                </Button>
                <div style={{
                  height: '24px',
                  width: '1px',
                  backgroundColor: theme === 'sun' ? 'rgba(30, 64, 175, 0.3)' : 'rgba(255, 255, 255, 0.3)'
                }} />
                <h2 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  color: theme === 'sun' ? '#1e40af' : '#fff',
                  textShadow: theme === 'sun' ? '0 0 5px rgba(30, 64, 175, 0.3)' : '0 0 15px rgba(134, 134, 134, 0.8)'
                }}>
                  {(() => {
                    const parts = [];
                    if (className) parts.push(className);
                    if (challengeName) parts.push(challengeName);
                    if (studentName) parts.push(studentName);
                    return parts.length > 0 ? parts.join(' / ') : (t('dailyChallenge.feedbackAndGrading') || 'Feedback & Grading');
                  })()}
                </h2>
              </div>
              {/* Right actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                <Button onClick={handleClear} icon={<CloseCircleOutlined />} style={{ height: 40, borderRadius: 8 }}>
                  Clear
                </Button>
                <Button icon={<SaveOutlined />} onClick={handleSave} loading={saving} style={{ height: 40, borderRadius: 8, padding: '0 24px', border: 'none', background: theme === 'sun' ? 'linear-gradient(135deg, #66AEFF, #3C99FF)' : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)', color: '#000' }}>
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </nav>
        </header>
      )}
    >
      <div style={{ padding: 24, maxWidth: 1500, margin: '0 auto' }}>
        {/* Editor sizing and text color (strong override) */}
        <style>{`
          .feedback-editor-wrap .ck-editor__editable_inline { 
            min-height: 300px !important; 
            max-height: 300px !important; 
            overflow-y: auto !important; 
            color: #000 !important; 
          }
          .feedback-editor-wrap .ck-editor__main .ck-editor__editable { 
            min-height: 300px !important; 
            max-height: 300px !important; 
            overflow-y: auto !important; 
            color: #000 !important; 
          }
        `}</style>
        <Card
          style={{
            borderRadius: 20,
            border: theme === 'sun'
              ? '2px solid rgba(24, 144, 255, 0.35)'
              : '2px solid rgba(139, 92, 246, 0.35)',
            background: theme === 'sun'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.60) 0%, rgba(240,249,255,0.55) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.50) 0%, rgba(244,240,255,0.45) 100%)',
            boxShadow: theme === 'sun'
              ? '0 8px 24px rgba(24, 144, 255, 0.12)'
              : '0 8px 24px rgba(139, 92, 246, 0.12)',
            padding: 16,
          }}
          bodyStyle={{ padding: 16 }}
        >
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            {/* Left: Student submission */}
            <Card
              style={{
                borderRadius: 16,
                border: theme === 'sun'
                  ? '2px solid rgba(113, 179, 253, 0.25)'
                  : '2px solid rgba(138, 122, 255, 0.2)',
                boxShadow: theme === 'sun'
                  ? '0 4px 16px rgba(113, 179, 253, 0.1)'
                  : '0 4px 16px rgba(138, 122, 255, 0.12)',
                background: theme === 'sun'
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
                backdropFilter: 'blur(10px)',
                minHeight: 540,
              }}
            >
              <Title level={3} style={{ textAlign: 'center', color: primaryColor, marginTop: 0 }}>Student Submission</Title>
              <div ref={leftContainerRef} style={{ marginTop: 12, fontSize: 15, lineHeight: 1.8, position: 'relative' }}>
                {sectionType === 'writing' ? (
                  <>
                  {/* Prompt (top) */}
                  <div
                    style={{
                      marginBottom: 12,
                      background: theme === 'sun' ? '#ffffff' : 'rgba(255,255,255,0.04)',
                      borderRadius: 12,
                      border: theme === 'sun' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.08)',
                      padding: 16,
                    }}
                  >
                    <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Prompt</Typography.Text>
                    <div
                      className="html-content"
                      style={{ color: theme === 'sun' ? '#0f172a' : '#d1cde8', lineHeight: 1.7 }}
                      dangerouslySetInnerHTML={{ __html: (section?.prompt || section?.sectionsContent || '') }}
                    />
                  </div>
                  {/* Student's Answer (below) */}
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                      background: theme === 'sun' ? '#ffffff' : 'rgba(255,255,255,0.04)',
                      borderRadius: 12,
                      border: theme === 'sun' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.08)',
                      padding: 16,
                      minHeight: 120,
                      maxHeight: 420,
                      overflowY: 'auto',
                      position: 'relative',
                      userSelect: 'text',
                      cursor: 'text',
                    }}
                    onMouseUp={(e) => {
                      if (section?.id) {
                        handleTextSelection(section.id, e.currentTarget);
                      }
                    }}
                    onMouseDown={() => {
                      setTimeout(() => {
                        setTextSelection({ visible: false, sectionId: null, startIndex: null, endIndex: null, position: { x: 0, y: 0 } });
                      }, 0);
                    }}
                  >
                    {section?.id && (writingSectionFeedbacks[section.id]?.length > 0) ? (
                      renderEssayWithHighlights(
                        (studentAnswer?.text || studentAnswer?.essay || buildPromptFromContent() || ''),
                        section.id
                      )
                    ) : (
                      (studentAnswer?.text || studentAnswer?.essay || buildPromptFromContent() || '').trim() || '—'
                    )}
                  </div>
                  
                  {/* Floating Toolbar for text selection (same as DailyChallengeSubmissionDetail) */}
                  {textSelection.visible && textSelection.sectionId === section?.id && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${textSelection.position.x}px`,
                        top: `${textSelection.position.y}px`,
                        transform: 'translateY(-50%)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={handleAddComment}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          border: 'none',
                          background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.95)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          padding: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                        }}
                        title="Add Comment"
                      >
                        <CommentOutlined style={{ fontSize: '16px', color: theme === 'sun' ? '#1890ff' : '#8B5CF6' }} />
                      </button>
                    </div>
                  )}
                  {/* Floating Teacher Comment popover near selected highlight */}
                  {commentPopover.visible && commentPopover.feedback && (
                    <div
                      ref={popoverRef}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        left: `${commentPopover.x}px`,
                        top: `${commentPopover.y}px`,
                        zIndex: 1100,
                        width: 360,
                        maxWidth: 'calc(100% - 16px)',
                        background: theme === 'sun' ? '#ffffff' : 'rgba(255,255,255,0.95)',
                        border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: 12,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        padding: 16
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Typography.Text strong>Teacher Comment</Typography.Text>
                        <Button type="text" icon={<CloseCircleOutlined />} onClick={() => setCommentPopover(prev => ({ ...prev, visible: false }))} />
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: theme === 'sun' ? '#333' : '#1F2937', whiteSpace: 'pre-wrap' }}>
                        {commentPopover.feedback.comment}
                      </div>
                      {(() => {
                        const studentAns = studentAnswers?.[section?.id] || {};
                        const essayText = studentAns?.text || studentAns?.essay || '';
                        if (essayText) {
                          const { startIndex, endIndex } = commentPopover.feedback;
                          const highlightedText = essayText.substring(startIndex, endIndex);
                          return (
                            <div style={{ marginTop: 8, padding: 8, background: theme === 'sun' ? '#fff9c4' : 'rgba(255,235,59,0.2)', borderRadius: 8, border: `1px solid ${theme === 'sun' ? '#ffeb3b' : 'rgba(255,235,59,0.5)'}` }}>
                              <Typography.Text style={{ fontSize: 12, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Highlighted text:</Typography.Text>
                              <Typography.Text style={{ fontSize: 13, fontStyle: 'italic', color: theme === 'sun' ? '#333' : '#1F2937' }}>
                                "{highlightedText}"
                              </Typography.Text>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button danger icon={<DeleteOutlined />} onClick={handleDeleteComment}>Delete</Button>
                        <Button onClick={handleEditCommentFromSidebar}>Edit Comment</Button>
                      </div>
                    </div>
                  )}
                  </>
                ) : sectionType === 'speaking' ? (
                  <>
                    {(() => {
                      const rawContent = section?.transcript || section?.sectionsContent || '';
                      const durationInfo = extractDurationMarker(rawContent);
                      return (
                        <>
                          {/* Voice Recording Badge - extracted from [[dur_3]] */}
                          {durationInfo.found && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 12px',
                              marginBottom: '12px',
                              borderRadius: '10px',
                              background: theme === 'sun'
                                ? 'rgba(24, 144, 255, 0.08)'
                                : 'rgba(139, 92, 246, 0.15)',
                              border: `2px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.4)' : 'rgba(139, 92, 246, 0.4)'}`,
                              color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                              fontSize: '14px',
                              fontWeight: 600,
                              boxShadow: theme === 'sun'
                                ? '0 2px 6px rgba(24, 144, 255, 0.12)'
                                : '0 2px 6px rgba(139, 92, 246, 0.12)'
                            }}>
                              <span style={{ fontSize: '16px' }}>🎤</span>
                              <span>Voice Recording {durationInfo.minutes} {durationInfo.minutes === 1 ? 'minute' : 'minutes'}</span>
                            </div>
                          )}
                          {/* Audio File Player */}
                          {section?.sectionsUrl ? (
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 18, color: theme === 'sun' ? '#8B5CF6' : '#A78BFA' }}>🎵</span>
                                <Typography.Text strong style={{ color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>
                                  Audio File
                                </Typography.Text>
                              </div>
                              <audio controls src={section.sectionsUrl} style={{ width: '100%' }} />
                            </div>
                          ) : null}
                          {/* Transcript Content (with [[dur_X]] removed) */}
                          <div
                            style={{
                              whiteSpace: 'pre-wrap',
                              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                              background: theme === 'sun' ? '#ffffff' : 'rgba(255,255,255,0.04)',
                              borderRadius: 12,
                              border: theme === 'sun' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.08)',
                              padding: 16,
                              minHeight: 240,
                              position: 'relative',
                              userSelect: 'text',
                              cursor: 'text',
                            }}
                            onMouseUp={(e) => {
                              if (section?.id) {
                                handleTextSelection(section.id, e.currentTarget);
                              }
                            }}
                            onMouseDown={() => {
                              setTimeout(() => {
                                setTextSelection({ visible: false, sectionId: null, startIndex: null, endIndex: null, position: { x: 0, y: 0 } });
                              }, 0);
                            }}
                          >
                            {renderHtmlAsOrderedTextAndImages(durationInfo.cleanedContent)}
                          </div>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    {section?.sectionsUrl ? (
                      <audio controls src={section.sectionsUrl} style={{ width: '100%', marginBottom: 16 }} />
                    ) : null}
                    <div
                      className="html-content"
                      style={{
                        background: theme === 'sun' ? '#ffffff' : 'rgba(255,255,255,0.04)',
                        borderRadius: 12,
                        border: theme === 'sun' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.08)',
                        padding: 16,
                        color: theme === 'sun' ? '#0f172a' : '#d1cde8',
                      }}
                      dangerouslySetInnerHTML={{ __html: section?.transcript || section?.sectionsContent || '' }}
                    />
                    {/* Floating Toolbar for text selection */}
                    {textSelection.visible && textSelection.sectionId === section?.id && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${textSelection.position.x}px`,
                          top: `${textSelection.position.y}px`,
                          transform: 'translateY(-50%)',
                          zIndex: 1000,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={handleAddComment}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: 'none',
                            background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.95)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            padding: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                          }}
                          title="Add Comment"
                        >
                          <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* Right: Score + Feedback with AI assist */}
            <Card
              style={{
                borderRadius: 16,
                border: theme === 'sun' ? '2px solid rgba(113, 179, 253, 0.25)' : '2px solid rgba(138, 122, 255, 0.2)',
                boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)',
                background: theme === 'sun'
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
                backdropFilter: 'blur(10px)',
                minHeight: 540,
              }}
            >

              {/* Mode chooser */}
              {rightMode === null && (
                <div style={{ padding: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 420 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 520 }}>
                    <Card
                      hoverable
                      onClick={() => setRightMode('manual')}
                      style={{
                        borderRadius: 12,
                        border: `2px solid ${primaryColor}40`,
                        background: theme === 'sun' ? 'rgba(24,144,255,0.06)' : 'rgba(139,92,246,0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 22 }}>✍️</span>
                        <Typography.Text strong style={{ color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>Add feedback manually</Typography.Text>
                      </div>
                    </Card>
                    <Card
                      hoverable
                      onClick={() => setRightMode('ai')}
                      style={{
                        borderRadius: 12,
                        border: `2px solid ${primaryColor}40`,
                        background: theme === 'sun' ? 'rgba(113,179,253,0.08)' : 'rgba(167,139,250,0.10)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ThunderboltOutlined style={{ fontSize: 22, color: primaryColor }} />
                        <Typography.Text strong style={{ color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>Generate with AI</Typography.Text>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* Manual mode: show fields only */}
              {rightMode === 'manual' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Button
                      icon={<ArrowLeftOutlined />}
                      onClick={() => setRightMode(null)}
                      className={`class-menu-back-button ${theme}-class-menu-back-button`}
                      style={{ height: 32, borderRadius: 8, fontWeight: 500, fontSize: 14 }}
                    >
                      {t('common.back') || 'Back'}
                    </Button>
                  </div>
                  <div>
                    <Text strong>Score</Text>
                    <Input
                      type="number"
                      value={score}
                      onChange={handleScoreChange}
                      min={0}
                      max={10}
                      step={0.1}
                      style={{
                        marginTop: 6,
                        borderRadius: 8,
                        border: `2px solid ${primaryColor}40`,
                        background: theme === 'sun' ? '#fff' : 'rgba(255,255,255,0.08)',
                      }}
                    />
                  </div>
                  <div>
                    <Text strong>Feedback</Text>
                    <div className="feedback-editor-wrap" style={{ marginTop: 6, borderRadius: 12, border: `2px solid ${primaryColor}80`, background: theme === 'sun' ? primaryColorWithAlpha : 'rgba(244, 240, 255, 0.15)' }}>
                      <CKEditor
                        editor={ClassicEditor}
                        data={feedback}
                        onChange={(event, editor) => setFeedback(editor.getData())}
                        config={{
                          toolbar: { items: ['undo', 'redo', '|', 'paragraph', '|', 'bold', 'italic', '|', 'bulletedList', 'numberedList', '|', 'imageUpload'] }
                        }}
                        onReady={(editor) => {
                          try {
                            const el = editor.ui?.getEditableElement?.();
                            if (el) {
                              el.style.minHeight = '300px';
                              el.style.maxHeight = '300px';
                              el.style.overflowY = 'auto';
                              el.style.color = '#000';
                            }
                          } catch {}
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* AI mode: show button first; after success show fields */}
              {rightMode === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Button
                      icon={<ArrowLeftOutlined />}
                      onClick={() => { setRightMode(null); setHasAIGenerated(false); }}
                      className={`class-menu-back-button ${theme}-class-menu-back-button`}
                      style={{ height: 32, borderRadius: 8, fontWeight: 500, fontSize: 14 }}
                    >
                      {t('common.back') || 'Back'}
                    </Button>
                  </div>
                  {hasAIGenerated && (
                    <>
                      <div>
                        <Text strong>Score</Text>
                        <Input
                          type="number"
                          value={score}
                          onChange={handleScoreChange}
                          min={0}
                          max={10}
                          step={0.1}
                          style={{
                            marginTop: 6,
                            borderRadius: 8,
                            border: `2px solid ${primaryColor}40`,
                            background: theme === 'sun' ? '#fff' : 'rgba(255,255,255,0.08)',
                          }}
                        />
                      </div>
                      <div>
                        <Text strong>Feedback</Text>
                        <div className="feedback-editor-wrap" style={{ marginTop: 6, borderRadius: 12, border: `2px solid ${primaryColor}80`, background: theme === 'sun' ? primaryColorWithAlpha : 'rgba(244, 240, 255, 0.15)' }}>
                          <CKEditor
                            editor={ClassicEditor}
                            data={feedback}
                            onChange={(event, editor) => setFeedback(editor.getData())}
                            config={{
                              toolbar: { items: ['undo', 'redo', '|', 'paragraph', '|', 'bold', 'italic', '|', 'bulletedList', 'numberedList', '|', 'imageUpload'] }
                            }}
                            onReady={(editor) => {
                              try {
                                const el = editor.ui?.getEditableElement?.();
                                if (el) {
                                  el.style.minHeight = '300px';
                                  el.style.maxHeight = '300px';
                                  el.style.overflowY = 'auto';
                                  el.style.color = '#000';
                                }
                              } catch {}
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Button stays at bottom */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      loading={isGenerating}
                      onClick={handleGenerateAI}
                      style={{
                        height: 40,
                        borderRadius: 8,
                        padding: '0 16px',
                        background: theme === 'sun'
                          ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                          : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                        border: 'none',
                        color: '#000',
                        boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)',
                      }}
                    >
                      {hasAIGenerated ? 'Regenerate with AI' : 'Generate with AI'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </Card>
      </div>
      {/* Comment Modal for Writing/Speaking */}
      <Modal
        title={
          <div style={{ fontSize: '28px', fontWeight: '600', color: 'rgb(24, 144, 255)', textAlign: 'center', padding: '10px 0' }}>
            {commentModal.isEdit ? 'Edit Comment' : 'Add Comment'}
          </div>
        }
        open={commentModal.visible}
        onCancel={() => setCommentModal({ visible: false, sectionId: null, startIndex: null, endIndex: null, comment: '', isEdit: false, feedbackId: null })}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setCommentModal({ visible: false, sectionId: null, startIndex: null, endIndex: null, comment: '', isEdit: false, feedbackId: null })} style={{ height: '32px', fontWeight: '500', fontSize: '16px', padding: '4px 15px', width: '100px' }}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSaveComment}
            style={{
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
              color: '#000',
              borderRadius: '6px',
              height: '32px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '4px 15px',
              width: '100px',
              transition: 'all 0.3s ease',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              if (theme === 'sun') { e.currentTarget.style.background = 'rgb(93, 159, 233)'; }
              else { e.currentTarget.style.background = 'linear-gradient(135deg, #9C8FB0 19%, #9588AB 64%, #726795 75%, #9A95B0 97%, #5D4F7F 100%)'; }
            }}
            onMouseLeave={(e) => {
              if (theme === 'sun') { e.currentTarget.style.background = 'rgb(113, 179, 253)'; }
              else { e.currentTarget.style.background = 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)'; }
            }}
          >
            {commentModal.isEdit ? 'Update' : 'Add'}
          </Button>
        ]}
      >
        <div style={{ padding: '20px 0' }}>
          <Input.TextArea
            rows={6}
            value={commentModal.comment}
            onChange={handleCommentInputChange}
            placeholder="Enter your comment for the selected text..."
            maxLength={2000}
            showCount
            autoSize={{ minRows: 6, maxRows: 10 }}
            style={{ fontSize: '14px', lineHeight: '1.6' }}
          />
        </div>
      </Modal>

      {/* Comment Sidebar */}
      {showCommentSidebar && selectedComment && (
        <div style={{
          position: 'fixed', right: '24px', top: '50%', transform: 'translateY(-50%)', width: '350px', maxWidth: 'calc(100vw - 48px)', maxHeight: '80vh',
          background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.2)'}`,
          padding: '20px', overflowY: 'auto', boxShadow: theme === 'sun' ? '0 4px 16px rgba(0, 0, 0, 0.15)' : '0 4px 16px rgba(0, 0, 0, 0.3)', zIndex: 1000,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(0, 0, 0, 0.1)'}` }}>
            <div>
              <Typography.Text strong style={{ fontSize: '16px', color: theme === 'sun' ? '#333' : '#1F2937' }}>Teacher Comment</Typography.Text>
              <div style={{ fontSize: '12px', color: theme === 'sun' ? '#999' : '#777', marginTop: '4px' }}>
                {selectedComment.timestamp ? new Date(selectedComment.timestamp).toLocaleDateString() : new Date().toLocaleDateString()} {new Date(selectedComment.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <Button type="text" icon={<CloseCircleOutlined />} onClick={() => { setShowCommentSidebar(false); setSelectedComment(null); }} style={{ minWidth: 'auto', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
          </div>

          <div style={{ fontSize: '14px', lineHeight: '1.8', color: theme === 'sun' ? '#333' : '#1F2937', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '16px' }}>
            {selectedComment.comment || 'No comment provided.'}
          </div>

          {(() => {
            const secId = Object.keys(writingSectionFeedbacks).find(id => writingSectionFeedbacks[id]?.some(fb => fb.id === selectedComment.id));
            if (secId) {
              const ans = studentAnswers?.[secId] || {};
              const essayText = ans?.text || ans?.essay || (section?.transcript || section?.sectionsContent || '');
              if (essayText && selectedComment.startIndex !== undefined) {
                const highlightedText = essayText.substring(selectedComment.startIndex, selectedComment.endIndex);
                return (
                  <div style={{ marginTop: '16px', padding: '12px', background: theme === 'sun' ? '#fff9c4' : 'rgba(255, 235, 59, 0.2)', borderRadius: '8px', border: `1px solid ${theme === 'sun' ? '#ffeb3b' : 'rgba(255, 235, 59, 0.5)'}` }}>
                    <Typography.Text style={{ fontSize: '12px', fontWeight: '600', color: theme === 'sun' ? '#666' : '#999', display: 'block', marginBottom: '6px' }}>Highlighted text:</Typography.Text>
                    <Typography.Text style={{ fontSize: '13px', color: theme === 'sun' ? '#333' : '#1F2937', fontStyle: 'italic' }}>
                      "{highlightedText}"
                    </Typography.Text>
                  </div>
                );
              }
            }
            return null;
          })()}

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button danger icon={<DeleteOutlined />} onClick={handleDeleteComment} style={{ borderRadius: '8px', fontWeight: 500, fontSize: '14px', height: '36px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Delete
            </Button>
            <Button type="default" onClick={handleEditCommentFromSidebar} style={{ borderRadius: '8px', fontWeight: 500, fontSize: '14px', height: '36px', display: 'flex', alignItems: 'center', gap: '8px', border: `2px solid ${theme === 'sun' ? 'rgba(113, 179, 253, 0.4)' : 'rgba(138, 122, 255, 0.4)'}`, background: theme === 'sun' ? 'rgba(113, 179, 253, 0.1)' : 'rgba(138, 122, 255, 0.1)', color: theme === 'sun' ? '#1890ff' : '#8B5CF6' }}>
              Edit Comment
            </Button>
          </div>
        </div>
      )}
    </ThemedLayout>
  );
};

export default AIGenerateFeedback;


