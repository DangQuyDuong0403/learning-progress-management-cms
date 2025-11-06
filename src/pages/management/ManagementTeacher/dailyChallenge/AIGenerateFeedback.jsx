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

  // From navigation state or query params if provided
  const params = new URLSearchParams(location.search || '');
  const nav = location.state || {};
  const submissionId = nav.submissionId || routeSubmissionId;
  const submissionQuestionId = nav.prefill?.submissionQuestionId || routeSubmissionQuestionId;
  const sectionId = nav.sectionId || null; // Still used for display, but submissionQuestionId is primary
  const prefill = nav.prefill || {};
  
  // Read class context from state or query params
  const classIdFromState = nav.classId || null;
  const classNameFromState = nav.className || null;
  const challengeNameFromState = nav.challengeName || null;
  const classIdFromQuery = params.get('classId');
  const classNameFromQuery = params.get('className');
  const challengeNameFromQuery = params.get('challengeName');

  const primaryColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
  const primaryColorWithAlpha = theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)';

  // Prefer backend messages for notifications
  const getBackendMessage = useCallback((resOrErr) => {
    try {
      // Error object
      if (resOrErr?.response?.data) {
        return (
          resOrErr.response.data.error ||
          resOrErr.response.data.message ||
          resOrErr.response.data.data?.message ||
          null
        );
      }
      // Axios response
      if (resOrErr?.data) {
        return (
          resOrErr.data.message ||
          resOrErr.data.data?.message ||
          resOrErr.data.error ||
          null
        );
      }
      return null;
    } catch {
      return null;
    }
  }, []);

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
  
  // Header data - prioritize state over query params
  const [classId, setClassId] = useState(classIdFromState || classIdFromQuery || null);
  const [className, setClassName] = useState(classNameFromState || classNameFromQuery || null);
  const [challengeName, setChallengeName] = useState(challengeNameFromState || challengeNameFromQuery || null);
  const [studentName, setStudentName] = useState(nav.studentName || null);

  // Update class context when location.search or location.state changes
  useEffect(() => {
    const currentParams = new URLSearchParams(location.search || '');
    const newClassId = location.state?.classId || currentParams.get('classId') || classIdFromState || null;
    const newClassName = location.state?.className || currentParams.get('className') || classNameFromState || null;
    const newChallengeName = location.state?.challengeName || currentParams.get('challengeName') || challengeNameFromState || null;
    const newStudentName = location.state?.studentName || nav.studentName || null;

    setClassId(prev => prev !== newClassId ? newClassId : prev);
    setClassName(prev => prev !== newClassName ? newClassName : prev);
    setChallengeName(prev => prev !== newChallengeName ? newChallengeName : prev);
    setStudentName(prev => prev !== newStudentName ? newStudentName : prev);
  }, [location.state, location.search, classIdFromState, classNameFromState, challengeNameFromState, nav.studentName]);

  // Right side controls
  const [score, setScore] = useState(() => {
    // Priority: prefill.score (receivedWeight) > prefill từ API
    if (typeof prefill.score === 'number') return prefill.score;
    return '';
  });
  const [feedback, setFeedback] = useState(prefill.feedback || '');
  const [questionWeight, setQuestionWeight] = useState(() => {
    // Priority: prefill.questionWeight > default 10
    return prefill?.questionWeight || 10;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  // Speaking-specific controls
  const [speakingAge, setSpeakingAge] = useState('');
  const [speakingReferenceText, setSpeakingReferenceText] = useState('');
  const [speakingResult, setSpeakingResult] = useState(null);
  const [writingCriteria, setWritingCriteria] = useState(null);
  // Determine section type early (used by multiple hooks below and callbacks defined afterwards)
  const sectionType = useMemo(() => {
    const title = (section?.sectionTitle || section?.title || '').toLowerCase();
    if (/writing/.test(title)) return 'writing';
    if (/listening/.test(title)) return 'listening';
    if (/speaking/.test(title)) return 'speaking';
    return prefill.type || 'writing';
  }, [section, prefill.type]);
  const criteriaStyles = useMemo(() => {
    const light = {
      taskResponse: { bg: '#FFF7ED', border: 'rgba(245, 158, 11, 0.35)' }, // orange pastel
      cohesionCoherence: { bg: '#ECFEFF', border: 'rgba(6, 182, 212, 0.35)' }, // cyan pastel
      lexicalResource: { bg: '#F0FDF4', border: 'rgba(34, 197, 94, 0.35)' }, // green pastel
      grammaticalRangeAccuracy: { bg: '#F5F3FF', border: 'rgba(139, 92, 246, 0.35)' }, // purple pastel
    };
    const dark = {
      taskResponse: { bg: 'rgba(245, 158, 11, 0.10)', border: 'rgba(245, 158, 11, 0.35)' },
      cohesionCoherence: { bg: 'rgba(6, 182, 212, 0.10)', border: 'rgba(6, 182, 212, 0.35)' },
      lexicalResource: { bg: 'rgba(34, 197, 94, 0.10)', border: 'rgba(34, 197, 94, 0.35)' },
      grammaticalRangeAccuracy: { bg: 'rgba(139, 92, 246, 0.10)', border: 'rgba(139, 92, 246, 0.35)' },
    };
    return theme === 'sun' ? light : dark;
  }, [theme]);
  const speakingStyles = useMemo(() => {
    const light = {
      Pronunciation: { bg: '#ECFEFF', border: 'rgba(6, 182, 212, 0.35)' },
      Accuracy: { bg: '#F0FDF4', border: 'rgba(34, 197, 94, 0.35)' },
      Fluency: { bg: '#FFF7ED', border: 'rgba(245, 158, 11, 0.35)' },
      Completeness: { bg: '#FEF2F2', border: 'rgba(239, 68, 68, 0.35)' },
      Prosody: { bg: '#F5F3FF', border: 'rgba(139, 92, 246, 0.35)' },
    };
    const dark = {
      Pronunciation: { bg: 'rgba(6, 182, 212, 0.10)', border: 'rgba(6, 182, 212, 0.35)' },
      Accuracy: { bg: 'rgba(34, 197, 94, 0.10)', border: 'rgba(34, 197, 94, 0.35)' },
      Fluency: { bg: 'rgba(245, 158, 11, 0.10)', border: 'rgba(245, 158, 11, 0.35)' },
      Completeness: { bg: 'rgba(239, 68, 68, 0.10)', border: 'rgba(239, 68, 68, 0.35)' },
      Prosody: { bg: 'rgba(139, 92, 246, 0.10)', border: 'rgba(139, 92, 246, 0.35)' },
    };
    return theme === 'sun' ? light : dark;
  }, [theme]);
  const handleClear = useCallback(() => {
    try {
      // Reset common fields
      setScore('');
      setScoreError(null);
      setFeedback('');

      // For Writing: clear criteria, highlights and return panel to initial chooser
      if (sectionType === 'writing') {
        setWritingCriteria(null);
        const secId = section?.id || prefill?.section?.id;
        if (secId) {
          setWritingSectionFeedbacks(prev => ({ ...prev, [secId]: [] }));
        } else {
          setWritingSectionFeedbacks({});
        }
        setHasAIGenerated(false);
        setRightMode(null);
      } else if (sectionType === 'speaking') {
        // Speaking: clear AI metrics and inline form state, reset view
        setSpeakingResult(null);
        setSpeakingReferenceText('');
        setSpeakingAge('');
        const secId = section?.id || prefill?.section?.id;
        if (secId) {
          setWritingSectionFeedbacks(prev => ({ ...prev, [secId]: [] }));
        } else {
          setWritingSectionFeedbacks({});
        }
        setHasAIGenerated(false);
        setRightMode(null);
      } else {
        // Other sections: just clear per-section highlights if any
        const secId = section?.id || prefill?.section?.id;
        if (secId) {
          setWritingSectionFeedbacks(prev => ({ ...prev, [secId]: [] }));
        } else {
          setWritingSectionFeedbacks({});
        }
      }

      // Also reset UI selection/popovers
      setTextSelection({ visible: false, sectionId: null, startIndex: null, endIndex: null, position: { x: 0, y: 0 } });
      setSelectedComment(null);
      setShowCommentSidebar(false);
      setCommentPopover({ visible: false, x: 0, y: 0, feedback: null });

      spaceToast.success('Cleared. Click Save to apply.');
    } catch {}
  }, [sectionType, section?.id, prefill?.section?.id]);
  // Right panel mode: null (choose), 'manual', 'ai'
  const [rightMode, setRightMode] = useState(null);
  const [hasAIGenerated, setHasAIGenerated] = useState(false);
  const [hasAutoSetMode, setHasAutoSetMode] = useState(false); // Track if we've auto-set mode on mount
  const [scoreError, setScoreError] = useState(null); // Track score validation error
  const handleScoreChange = useCallback((e) => {
    const raw = Number(e?.target?.value);
    if (!Number.isFinite(raw)) { 
      setScore(''); 
      setScoreError(null);
      return; 
    }
    // Check if input exceeds questionWeight
    if (raw > questionWeight) {
      setScoreError(`Points not to exceed ${questionWeight}`);
      // Still clamp the value but show error
      const clamped = Math.max(0, Math.min(questionWeight, raw));
      setScore(clamped);
    } else {
      setScoreError(null);
      const clamped = Math.max(0, Math.min(questionWeight, raw));
      setScore(clamped);
    }
  }, [questionWeight]);

  // Map to reuse existing comment/highlight logic structure
  const studentAnswers = useMemo(() => {
    if (!section || !section?.id) return {};
    return { [section.id]: studentAnswer || {} };
  }, [section, studentAnswer]);

  

  // Build a single HTML feedback that includes all details (temporary: BE only stores one field)
  const buildCombinedFeedbackForSave = useCallback(() => {
    const baseHtml = (feedback || '').trim();
    if (sectionType === 'writing') {
      const crit = writingCriteria || {};
      const blocks = [];
      const push = (label, obj) => {
        if (!obj) return;
        const scoreStr = Number.isFinite(Number(obj?.score)) ? `${Number(obj.score)}/10` : '-';
        const fb = (obj?.feedback || '').trim();
        const body = fb ? `${fb}` : '';
        blocks.push(`<p><b>${label}${scoreStr !== '-' ? ` (${scoreStr})` : ''}:</b> ${body}</p>`);
      };
      push('Task Response', crit.taskResponse);
      push('Cohesion & Coherence', crit.cohesionCoherence);
      push('Lexical Resource', crit.lexicalResource);
      push('Grammatical Range & Accuracy', crit.grammaticalRangeAccuracy);
      if (blocks.length > 0) {
        const criteriaHtml = `<hr/><div data-kind="criteria">${blocks.join('')}</div>`;
        return [baseHtml, criteriaHtml].filter(Boolean).join('\n');
      }
      return baseHtml;
    }
    if (sectionType === 'speaking') {
      if (!speakingResult) return baseHtml;
      const sr = speakingResult || {};
      const rows = [
        ['Pronunciation', sr.pronunciationScore],
        ['Accuracy', sr.accuracyScore],
        ['Fluency', sr.fluencyScore],
        ['Completeness', sr.completenessScore],
        ['Prosody', sr.prosodyScore],
      ]
        .filter(([label, val]) => val !== undefined && val !== null)
        .map(([label, val]) => `<li>${label}: <b>${val}</b></li>`)
        .join('');
      const details = rows ? `<ul>${rows}</ul>` : '';
      const speakingHtml = `<hr/><div data-kind="speaking">${details}</div>`;
      return [baseHtml, speakingHtml].filter(Boolean).join('\n');
    }
    return baseHtml;
  }, [feedback, sectionType, writingCriteria, speakingResult]);

  // Parse combined feedback html to rebuild writing criteria for display
  const parseCriteriaFromFeedback = useCallback((html) => {
    try {
      if (!html || typeof html !== 'string') return null;
      const plain = html
        .replace(/<\s*br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const grab = (label) => {
        const regex = new RegExp(`${label}\\s*(\\((\\d+(?:\\.\\d+)?)\\/10\\))?\:`, 'i');
        const m = plain.match(regex);
        if (!m) return null;
        const after = plain.slice(m.index + m[0].length).trim();
        // Stop at next known label if exists
        const stopLabels = ['Task Response', 'Cohesion & Coherence', 'Lexical Resource', 'Grammatical Range & Accuracy'];
        const rest = stopLabels
          .filter((l) => l.toLowerCase() !== label.toLowerCase())
          .map((l) => new RegExp(`\\b${l}\\b`, 'i'));
        let end = after.length;
        for (const r of rest) {
          const mm = after.match(r);
          if (mm && mm.index < end) end = mm.index;
        }
        const chunk = after.substring(0, end).trim();
        const scoreNum = Number(m?.[2]);
        return { score: Number.isFinite(scoreNum) ? scoreNum : undefined, feedback: chunk };
      };
      const result = {
        taskResponse: grab('Task Response'),
        cohesionCoherence: grab('Cohesion & Coherence'),
        lexicalResource: grab('Lexical Resource'),
        grammaticalRangeAccuracy: grab('Grammatical Range & Accuracy'),
      };
      const hasAny = Object.values(result).some((v) => v && (v.feedback || v.score != null));
      return hasAny ? result : null;
    } catch {
      return null;
    }
  }, []);

  // Extract overall feedback (without criteria) if our combined format was used
  const extractOverallFeedback = useCallback((html) => {
    if (!html || typeof html !== 'string') return html || '';
    try {
      // Prefer our explicit marker first
      const markerIdx = html.indexOf('<div data-kind="criteria"');
      if (markerIdx > -1) {
        return html.substring(0, markerIdx).trim();
      }
      const markerSpeaking = html.indexOf('<div data-kind="speaking"');
      if (markerSpeaking > -1) {
        return html.substring(0, markerSpeaking).trim();
      }
      // Heuristic fallback: first criteria label occurrence
      const labels = [
        'Task Response',
        'Cohesion & Coherence',
        'Lexical Resource',
        'Grammatical Range & Accuracy'
      ];
      let firstIdx = -1;
      for (const l of labels) {
        const i = html.toLowerCase().indexOf(l.toLowerCase());
        if (i !== -1 && (firstIdx === -1 || i < firstIdx)) firstIdx = i;
      }
      let base = firstIdx > -1 ? html.substring(0, firstIdx) : html;
      // Clean inline speaking bullet lists if present in legacy content
      try {
        // Remove any <ul> block that contains any speaking metric label
        const speakingLabels = ['Pronunciation', 'Accuracy', 'Fluency', 'Completeness', 'Prosody'];
        speakingLabels.forEach((lbl) => {
          const regex = new RegExp(`<ul[\s\S]*?<li[\s\S]*?>[\\s\S]*?${lbl}[\s\S]*?<\\/ul>`, 'i');
          base = base.replace(regex, '');
        });
        // Also remove standalone lines like "Pronunciation: 4.2" possibly wrapped in <p> or <li>
        const lineRegex = /<(p|li)[^>]*>\s*(Pronunciation|Accuracy|Fluency|Completeness|Prosody)[^<]*<\/\1>/gi;
        base = base.replace(lineRegex, '');
      } catch {}
      return base.trim();
    } catch {
      return html;
    }
  }, []);

  // Parse speaking metrics from a combined feedback html (best-effort)
  const parseSpeakingFromFeedback = useCallback((html) => {
    if (!html || typeof html !== 'string') return null;
    try {
      const marker = '<div data-kind="speaking"';
      let speakingHtml = '';
      const idx = html.indexOf(marker);
      if (idx > -1) {
        speakingHtml = html.substring(idx);
      } else {
        speakingHtml = html;
      }
      const toPlain = speakingHtml
        .replace(/<\s*br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const pick = (label) => {
        const r = new RegExp(`${label}[^0-9]*([0-9]+(?:\\.[0-9]+)?)`, 'i');
        const m = toPlain.match(r);
        return m ? Number(m[1]) : undefined;
      };
      const result = {
        pronunciationScore: pick('Pronunciation'),
        accuracyScore: pick('Accuracy'),
        fluencyScore: pick('Fluency'),
        completenessScore: pick('Completeness'),
        prosodyScore: pick('Prosody'),
      };
      const hasAny = Object.values(result).some((v) => typeof v === 'number' && Number.isFinite(v));
      return hasAny ? result : null;
    } catch {
      return null;
    }
  }, []);

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

  const handleCommentInputChange = useCallback((event, editor) => {
    const value = editor ? editor.getData() : (event?.target?.value || '');
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

    // Calculate position relative to leftContainerRef (the main container that holds the floating toolbar)
    const rect = range.getBoundingClientRect();
    const containerRect = leftContainerRef.current?.getBoundingClientRect();
    if (!containerRect) {
      // Fallback: use textElement if leftContainerRef is not available
      const textElementRect = textElement.getBoundingClientRect();
      const relativeX = rect.right - textElementRect.left + 10;
      const relativeY = rect.top - textElementRect.top + (rect.height / 2);
      setTextSelection({
        visible: true,
        sectionId: targetSectionId,
        startIndex,
        endIndex,
        position: { x: relativeX, y: relativeY },
      });
      return;
    }
    
    // Calculate position relative to leftContainerRef
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

  

  // Do not prefill speaking reference text; let user input manually
  useEffect(() => {
    // On revisit with prefilled combined feedback, split it into overall + details
    if (typeof prefill?.feedback === 'string' && prefill.feedback) {
      if (sectionType === 'writing') {
        const parsed = parseCriteriaFromFeedback(prefill.feedback);
        if (parsed) {
          setWritingCriteria(parsed);
          setHasAIGenerated(true);
          setFeedback((prev) => {
            const overall = extractOverallFeedback(prefill.feedback);
            return prev && prev !== prefill.feedback ? prev : overall;
          });
        }
      } else if (sectionType === 'speaking') {
        const sp = parseSpeakingFromFeedback(prefill.feedback);
        if (sp) {
          setSpeakingResult(sp);
          setHasAIGenerated(true);
          setFeedback((prev) => {
            const overall = extractOverallFeedback(prefill.feedback);
            return prev && prev !== prefill.feedback ? prev : overall;
          });
        }
      }
    }
    // intentionally left blank for speaking reference text
  }, [sectionType, prefill?.feedback, parseCriteriaFromFeedback, parseSpeakingFromFeedback, extractOverallFeedback]);

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
        const questionType = q?.questionType || '';
        const isSpeaking = questionType === 'SPEAKING' || prefill?.type === 'speaking';
        
        // Set questionWeight from score field in API response (for speaking questions)
        if (typeof q?.score === 'number' && q.score > 0) {
          setQuestionWeight(q.score);
        }
        
        // Map to local section/studentAnswer so left container can render prompt (top) and student's answer (below)
        setSection(prev => ({
          ...(prev || {}),
          id: prev?.id || q?.submissionQuestionId || q?.questionId || (isSpeaking ? 'section-speaking' : 'section-writing'),
          title: prev?.title || (isSpeaking ? 'Speaking' : 'Writing'),
          sectionTitle: prev?.sectionTitle || (isSpeaking ? 'Speaking' : 'Writing'),
          prompt: questionText,
          transcript: questionText,
          sectionsContent: questionText,
          sectionsUrl: prev?.sectionsUrl || q?.sectionsUrl || null,
        }));
        if (submittedVal && typeof submittedVal === 'string') {
          if (isSpeaking) {
            // For speaking, store audio URL
            setStudentAnswer({ audioUrl: submittedVal, audio: submittedVal });
          } else {
            // For writing, store text
            setStudentAnswer({ text: submittedVal });
          }
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

  // Fetch questionWeight and receivedWeight from grading API
  useEffect(() => {
    let mounted = true;
    const fetchGrading = async () => {
      const subQid = submissionQuestionId || prefill?.submissionQuestionId;
      if (!subQid) return;
      try {
        const res = await dailyChallengeApi.getSubmissionQuestionGrading(subQid);
        const gradingData = res?.data?.data || res?.data || {};
        if (!mounted) return;
        
        // Update questionWeight (max score) - always update from API if available
        if (typeof gradingData.questionWeight === 'number' && gradingData.questionWeight > 0) {
          setQuestionWeight(gradingData.questionWeight);
        }
        
        // Update receivedWeight (current score) from API
        // Only update if we don't have a score from prefill or if API value is different
        if (typeof gradingData.receivedWeight === 'number') {
          setScore(prev => {
            // If prefill had score, keep it on first load; otherwise use API value
            if (prev === '' || prev === null || prev === undefined) {
              return gradingData.receivedWeight;
            }
            // On subsequent fetches, prefer API value
            return gradingData.receivedWeight;
          });
        }
        // Feedback: save is a single field; when fetching, set editor value and try to rebuild criteria
        if (typeof gradingData.feedback === 'string') {
          if (sectionType === 'speaking') {
            const sp = parseSpeakingFromFeedback(gradingData.feedback);
            if (sp) {
              setSpeakingResult(sp);
              setHasAIGenerated(true);
            }
            setFeedback(extractOverallFeedback(gradingData.feedback));
          } else {
            const parsed = parseCriteriaFromFeedback(gradingData.feedback);
            if (parsed) {
              setWritingCriteria(parsed);
              setHasAIGenerated(true);
            }
            setFeedback(extractOverallFeedback(gradingData.feedback));
          }
        }
      } catch (e) {
        // If grading doesn't exist yet, questionWeight will use default or prefill value
        // This is fine for new submissions
      }
    };
    fetchGrading();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Auto-set rightMode to 'manual' if there's existing score or feedback (edit mode)
  // Only auto-set once on mount when there's existing data, not when user manually changes mode
  useEffect(() => {
    // Only auto-set if we haven't done it before and there's existing data
    if (hasAutoSetMode) return;
    
    const hasExistingScore = (typeof prefill?.score === 'number' && prefill.score !== '' && prefill.score != null) ||
                            (typeof prefill?.score === 'string' && prefill.score.trim() !== '');
    const hasExistingFeedback = prefill?.feedback && String(prefill.feedback).trim().length > 0;
    const hasExistingHighlightComments = Array.isArray(prefill?.highlightComments) && prefill.highlightComments.length > 0;
    
    // If there's existing data (score, feedback, or highlight comments), automatically show manual mode
    if (hasExistingScore || hasExistingFeedback || hasExistingHighlightComments) {
      setRightMode('manual');
      setHasAutoSetMode(true); // Mark that we've auto-set, so we don't auto-set again
    }
  }, [prefill?.score, prefill?.feedback, prefill?.highlightComments, hasAutoSetMode]);

  const handleBack = useCallback(() => {
    const role = user?.role?.toLowerCase();
    const path = role === 'teaching_assistant'
      ? `/teaching-assistant/daily-challenges/detail/${challengeId}/submissions/${submissionId}`
      : `/teacher/daily-challenges/detail/${challengeId}/submissions/${submissionId}`;
    
    // Preserve class context through navigation - read from multiple sources
    const currentParams = new URLSearchParams(location.search || '');
    const preservedClassId = classId || location.state?.classId || location.state?.backState?.classId || currentParams.get('classId') || null;
    const preservedClassName = className || location.state?.className || location.state?.backState?.className || currentParams.get('className') || null;
    const preservedChallengeName = challengeName || location.state?.challengeName || location.state?.backState?.challengeName || currentParams.get('challengeName') || null;
    
    // Build query params to preserve class context
    const qs = new URLSearchParams();
    if (preservedClassId) qs.set('classId', preservedClassId);
    if (preservedClassName) qs.set('className', preservedClassName);
    if (preservedChallengeName) qs.set('challengeName', preservedChallengeName);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    
    navigate(`${path}${suffix}`, { 
      state: {
        ...location.state?.backState,
        // Preserve header information when navigating back
        classId: preservedClassId,
        className: preservedClassName,
        challengeId: challengeId,
        challengeName: preservedChallengeName,
        studentName: studentName || location.state?.studentName || location.state?.backState?.studentName,
      }
    });
  }, [navigate, user, challengeId, submissionId, location.state, location.search, classId, className, challengeName, studentName]);

  const buildPromptFromContent = useCallback(() => {
    const essay = studentAnswer?.text || studentAnswer?.essay || '';
    const transcript = section?.transcript || section?.sectionsContent || '';
    const base = sectionType === 'writing' ? essay : transcript;
    return base;
  }, [sectionType, studentAnswer, section]);

  const handleGenerateAI = useCallback(async () => {
    try {
      setIsGenerating(true);
      if (sectionType === 'writing') {
        // Writing grading via submissionQuestionId
        const writingSubmissionQuestionId = submissionQuestionId || prefill?.submissionQuestionId || null;
        if (!writingSubmissionQuestionId) {
          spaceToast.error('Không tìm thấy submissionQuestionId của section để chấm AI');
          return;
        }
        const ageInput = String(speakingAge ?? '').trim();
        const age = ageInput === '' ? undefined : (Number.isFinite(Number(ageInput)) ? Number(ageInput) : undefined);
        const payload = { submissionQuestionId: writingSubmissionQuestionId, ...(age !== undefined ? { age } : {}) };
        const res = await dailyChallengeApi.generateAIFeedback(payload);
        const raw = res?.data?.data || res?.data || {};
        const overallFeedback = raw?.overallFeedback || raw?.feedback || '';
        const suggestedScore = (() => {
          const val = raw?.suggestedScore ?? raw?.score;
          return Number.isFinite(Number(val)) ? Number(val) : '';
        })();
        const aiComments = Array.isArray(raw?.comments) ? raw.comments : [];
        // criteria feedback for writing - format and combine with overall feedback
        const criteriaFeedback = raw?.criteriaFeedback || null;
        // Store criteria separately for UI rendering
        setWritingCriteria(criteriaFeedback || null);
        if (overallFeedback) setFeedback(overallFeedback);
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
        setHasAIGenerated(true);
        spaceToast.success(getBackendMessage(res) || 'AI feedback generated');
      } else if (sectionType === 'speaking') {
        // Speaking pronunciation assessment
        const audioUrl = studentAnswer?.audioUrl || studentAnswer?.audio;
        if (!audioUrl) {
          spaceToast.error('Không tìm thấy audio của học sinh để chấm phát âm');
          return;
        }
        const refText = (speakingReferenceText && speakingReferenceText.trim()) ? speakingReferenceText.trim() : undefined;
        const ageInput = String(speakingAge ?? '').trim();
        const age = ageInput === '' ? undefined : (Number.isFinite(Number(ageInput)) ? Number(ageInput) : undefined);
        const res = await dailyChallengeApi.assessPronunciation({ audioUrl, referenceText: refText, ...(age !== undefined ? { age } : {}) });
        const data = res?.data?.data || res?.data || {};
        setSpeakingResult(data || null);
        // Map to right panel
        if (typeof data?.pronunciationScore === 'number') setScore(data.pronunciationScore);
        if (data?.feedback) setFeedback(String(data.feedback));
        setHasAIGenerated(true);
        spaceToast.success(getBackendMessage(res) || 'Pronunciation assessed');
      } else {
        spaceToast.error('AI grading hiện chỉ hỗ trợ cho Writing và Speaking');
      }
    } catch (e) {
      const beErr = getBackendMessage(e);
      spaceToast.error(beErr || e?.message || 'Failed to generate AI feedback');
    } finally {
      setIsGenerating(false);
    }
  }, [submissionId, submissionQuestionId, sectionId, sectionType, studentAnswer, section, prefill?.submissionQuestionId, prefill?.rubric, speakingReferenceText, speakingAge, stripHtmlToText]);

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
      // Keep HTML formatting from CKEditor (bold, italic, lists, etc.)
      const cleanedFeedback = buildCombinedFeedbackForSave();
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
      const beMsg = getBackendMessage(res);
      spaceToast.success(beMsg || 'Saved');
      handleBack();
    } catch (e) {
      spaceToast.error(getBackendMessage(e) || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [sectionType, submissionQuestionId, prefill?.submissionQuestionId, submission, sectionId, section, writingSectionFeedbacks, score, buildCombinedFeedbackForSave, handleBack]);

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
            max-height: none !important; 
            overflow-y: visible !important; 
            color: #000 !important; 
          }
          .feedback-editor-wrap .ck-editor__main .ck-editor__editable { 
            min-height: 300px !important; 
            max-height: none !important; 
            overflow-y: visible !important; 
            color: #000 !important; 
          }
          /* Prevent CKEditor toolbar from becoming sticky/jumping while scrolling */
          .feedback-editor-wrap .ck-sticky-panel__content { 
            position: static !important; 
            top: auto !important; 
          }
          .comment-editor-wrap .ck-editor__editable_inline { 
            min-height: 200px !important; 
            max-height: 200px !important; 
            overflow-y: auto !important; 
            color: #000 !important; 
          }
          .comment-editor-wrap .ck-editor__main .ck-editor__editable { 
            min-height: 200px !important; 
            max-height: 200px !important; 
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
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
                  {/* Prompt (top) - Pastel blue background to distinguish from student answer */}
                  <div
                    style={{
                      marginBottom: 12,
                      background: theme === 'sun' ? '#E8F4FD' : 'rgba(138, 122, 255, 0.15)',
                      borderRadius: 12,
                      border: theme === 'sun' ? '1px solid rgba(24, 144, 255, 0.2)' : '1px solid rgba(138, 122, 255, 0.3)',
                      padding: 16,
                    }}
                  >
                  
                    <div
                      className="html-content"
                      style={{ color: theme === 'sun' ? '#0f172a' : '#d1cde8', lineHeight: 1.7 }}
                      dangerouslySetInnerHTML={{ __html: (section?.prompt || section?.sectionsContent || '') }}
                    />
                  </div>
                  {/* Student's Answer (below) - Pastel yellow/cream background to distinguish from prompt */}
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                      background: theme === 'sun' ? '#FFF4E6' : 'rgba(167, 139, 250, 0.12)',
                      borderRadius: 12,
                      border: theme === 'sun' ? '1px solid rgba(255, 193, 7, 0.25)' : '1px solid rgba(167, 139, 250, 0.25)',
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
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative' }}>
                        <Typography.Text strong>Teacher Comment</Typography.Text>
                        <Button 
                          type="text" 
                          icon={<CloseCircleOutlined />} 
                          onClick={() => setCommentPopover(prev => ({ ...prev, visible: false }))} 
                          style={{ position: 'absolute', right: 0 }}
                        />
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: theme === 'sun' ? '#333' : '#1F2937', whiteSpace: 'pre-wrap' }}>
                        {stripHtmlToText(commentPopover.feedback.comment)}
                      </div>
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
                          {/* Transcript Content (with [[dur_X]] removed) - Pastel blue background for prompt */}
                          <div
                            style={{
                              whiteSpace: 'pre-wrap',
                              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                              background: theme === 'sun' ? '#E8F4FD' : 'rgba(138, 122, 255, 0.15)',
                              borderRadius: 12,
                              border: theme === 'sun' ? '1px solid rgba(24, 144, 255, 0.2)' : '1px solid rgba(138, 122, 255, 0.3)',
                              padding: 16,
                              minHeight: 240,
                              position: 'relative',
                              userSelect: 'text',
                              cursor: 'text',
                              marginBottom: 16,
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
                          
                          {/* Student's Audio Recording - Pastel yellow/cream background for student submission */}
                          <div style={{
                            background: theme === 'sun' ? '#FFF4E6' : 'rgba(167, 139, 250, 0.12)',
                            borderRadius: 12,
                            border: theme === 'sun' ? '1px solid rgba(255, 193, 7, 0.25)' : '1px solid rgba(167, 139, 250, 0.25)',
                            padding: 16,
                            marginTop: 16,
                          }}>
                            <Typography.Text style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}>
                              Student's Recording:
                            </Typography.Text>
                            {studentAnswer?.audioUrl || studentAnswer?.audio ? (
                              <div>
                                <audio controls style={{ width: '100%' }}>
                                  <source src={studentAnswer?.audioUrl || studentAnswer?.audio} type="audio/mpeg" />
                                  <source src={studentAnswer?.audioUrl || studentAnswer?.audio} type="audio/wav" />
                                  <source src={studentAnswer?.audioUrl || studentAnswer?.audio} type="audio/mp3" />
                                  Your browser does not support the audio element.
                                </audio>
                              </div>
                            ) : (
                              <Typography.Text type="secondary" style={{ fontSize: '14px', fontStyle: 'italic' }}>
                                No recording submitted
                              </Typography.Text>
                            )}
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
                    {/* Listening/Other section content - Pastel blue background for prompt */}
                    <div
                      className="html-content"
                      style={{
                        background: theme === 'sun' ? '#E8F4FD' : 'rgba(138, 122, 255, 0.15)',
                        borderRadius: 12,
                        border: theme === 'sun' ? '1px solid rgba(24, 144, 255, 0.2)' : '1px solid rgba(138, 122, 255, 0.3)',
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
              bodyStyle={{ maxHeight: 750, overflowY: 'auto', padding: 16 }}
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <Button
                      icon={<ArrowLeftOutlined />}
                      onClick={() => setRightMode(null)}
                      className={`class-menu-back-button ${theme}-class-menu-back-button`}
                      style={{ height: 32, borderRadius: 8, fontWeight: 500, fontSize: 14 }}
                    >
                      {t('common.back') || 'Back'}
                    </Button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text strong>Score</Text>
                      <Input
                        type="number"
                        value={score}
                        onChange={handleScoreChange}
                        min={0}
                        max={questionWeight}
                        step={0.1}
                        placeholder="0"
                        status={scoreError ? 'error' : ''}
                        style={{
                          width: 120,
                          borderRadius: 8,
                          border: scoreError 
                            ? `2px solid ${theme === 'sun' ? '#ff4d4f' : '#ff7875'}` 
                            : `2px solid ${primaryColor}40`,
                          background: theme === 'sun' ? '#fff' : 'rgba(255,255,255,0.08)',
                        }}
                      />
                      <span style={{ fontSize: '16px', color: theme === 'sun' ? '#666' : '#999', fontWeight: 500 }}>
                        / {questionWeight}
                      </span>
                    </div>
                  </div>
                  {scoreError && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: theme === 'sun' ? '#ff4d4f' : '#ff7875',
                      marginLeft: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <span>⚠️</span>
                      <span>{scoreError}</span>
                    </div>
                  )}
                  {sectionType === 'speaking' && speakingResult && (
                    <div style={{ marginTop: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: theme === 'sun' ? '#1E40AF' : '#8377A0'
                      }}>
                        <Text strong>Pronunciation result</Text>
                      </div>
                      <div style={{
                        marginTop: 8,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: 12
                      }}>
                        {[{
                          label: 'Pronunciation',
                          value: Number.isFinite(Number(speakingResult?.pronunciationScore)) ? speakingResult.pronunciationScore : '-'
                        },{
                          label: 'Accuracy',
                          value: Number.isFinite(Number(speakingResult?.accuracyScore)) ? speakingResult.accuracyScore : '-'
                        },{
                          label: 'Fluency',
                          value: Number.isFinite(Number(speakingResult?.fluencyScore)) ? speakingResult.fluencyScore : '-'
                        },{
                          label: 'Completeness',
                          value: Number.isFinite(Number(speakingResult?.completenessScore)) ? speakingResult.completenessScore : '-'
                        },{
                          label: 'Prosody',
                          value: Number.isFinite(Number(speakingResult?.prosodyScore)) ? speakingResult.prosodyScore : '-'
                        }].map((item, idx) => {
                          const ss = speakingStyles[item.label] || { bg: theme === 'sun' ? 'rgba(24,144,255,0.06)' : 'rgba(244,240,255,0.10)', border: theme === 'sun' ? 'rgba(24,144,255,0.25)' : 'rgba(138,122,255,0.25)' };
                          return (
                          <div
                            key={`manual-speaking-top-${item.label}-${idx}`}
                            style={{
                              borderRadius: 12,
                              padding: '12px 14px',
                              background: ss.bg,
                              border: `1px solid ${ss.border}`
                            }}
                          >
                            <div style={{ fontSize: 12, color: theme === 'sun' ? '#1E40AF' : '#8377A0', fontWeight: 600 }}>{item.label}</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: theme === 'sun' ? '#0f172a' : '#1F2937', marginTop: 2 }}>{item.value}</div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div>
                    <Text strong>Feedback</Text>
                    <div className="feedback-editor-wrap" style={{ marginTop: 6, borderRadius: 12, border: `2px solid ${primaryColor}80`, background: theme === 'sun' ? primaryColorWithAlpha : 'rgba(244, 240, 255, 0.15)' }}>
                      <CKEditor
                        editor={ClassicEditor}
                        data={feedback}
                        onChange={(event, editor) => setFeedback(editor.getData())}
                        config={{
                          toolbar: { items: ['undo', 'redo', '|', 'paragraph', '|', 'bold', 'italic', '|', 'bulletedList', 'numberedList', '|', 'imageUpload'] },
                          removePlugins: ['StickyToolbar']
                        }}
                        onReady={(editor) => {
                          try {
                            const el = editor.ui?.getEditableElement?.();
                            if (el) {
                              el.style.minHeight = '300px';
                              el.style.color = '#000';
                            }
                          } catch {}
                        }}
                      />
                    </div>
                  </div>
                  {/* Criteria feedback cards also visible in Manual mode (no Generate button) */}
                  {sectionType === 'writing' && writingCriteria && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { key: 'taskResponse', label: 'Task Response' },
                        { key: 'cohesionCoherence', label: 'Cohesion & Coherence' },
                        { key: 'lexicalResource', label: 'Lexical Resource' },
                        { key: 'grammaticalRangeAccuracy', label: 'Grammatical Range & Accuracy' }
                      ].map((it) => {
                        const data = writingCriteria?.[it.key];
                        if (!data) return null;
                        const scoreNum = Number.isFinite(Number(data?.score)) ? Number(data.score) : null;
                        const scoreVal = scoreNum != null ? `${scoreNum}/10` : '-';
                        const fb = (data?.feedback || '').trim();
                        const percent = scoreNum != null ? Math.max(0, Math.min(100, (scoreNum / 10) * 100)) : 0;
                        const level = scoreNum == null ? 'neutral' : (scoreNum < 4 ? 'low' : (scoreNum < 7 ? 'mid' : 'high'));
                        const barColor = level === 'low' ? '#EF4444' : level === 'mid' ? '#F59E0B' : '#22C55E';
                        const badgeBg = level === 'low' ? '#FEE2E2' : level === 'mid' ? '#FEF3C7' : '#DCFCE7';
                        const badgeText = level === 'low' ? 'Needs Work' : level === 'mid' ? 'Fair' : 'Good';
                        const cs = criteriaStyles[it.key] || { bg: theme === 'sun' ? 'rgba(113,179,253,0.08)' : 'rgba(167,139,250,0.10)', border: `${primaryColor}40` };
                        return (
                          <Card
                            key={`manual-${it.key}`}
                            style={{
                              borderRadius: 12,
                              border: `2px solid ${cs.border}`,
                              background: cs.bg
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                              <Typography.Text strong style={{ color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>{it.label}</Typography.Text>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ fontWeight: 700, color: theme === 'sun' ? '#0f172a' : '#1F2937' }}>{scoreVal}</div>
                                {scoreNum != null && (
                                  <span style={{ background: badgeBg, color: theme === 'sun' ? '#111827' : '#111827', borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{badgeText}</span>
                                )}
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div style={{ marginTop: 10, height: 8, borderRadius: 8, background: 'rgba(0,0,0,0.08)' }}>
                              <div style={{ width: `${percent}%`, height: '100%', borderRadius: 8, background: barColor }} />
                            </div>
                            {fb && (
                              <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.7, color: theme === 'sun' ? '#333' : '#1F2937', whiteSpace: 'pre-wrap' }}>
                                <b>{it.label.split(' & ').join(' and ')}:</b> {stripHtmlToText(fb)}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* AI mode: show button first; after success show fields */}
              {rightMode === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex' }}>
                      <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => { setRightMode(null); }}
                        className={`class-menu-back-button ${theme}-class-menu-back-button`}
                        style={{ height: 32, borderRadius: 8, fontWeight: 500, fontSize: 14 }}
                      >
                        {t('common.back') || 'Back'}
                      </Button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {hasAIGenerated && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong>Score</Text>
                          <Input
                            type="number"
                            value={score}
                            onChange={handleScoreChange}
                            min={0}
                            max={questionWeight}
                            step={0.1}
                            placeholder="0"
                            status={scoreError ? 'error' : ''}
                            style={{
                              width: 120,
                              borderRadius: 8,
                              border: scoreError 
                                ? `2px solid ${theme === 'sun' ? '#ff4d4f' : '#ff7875'}` 
                                : `2px solid ${primaryColor}40`,
                              background: theme === 'sun' ? '#fff' : 'rgba(255,255,255,0.08)',
                            }}
                          />
                          <span style={{ fontSize: '16px', color: theme === 'sun' ? '#666' : '#999', fontWeight: 500 }}>
                            / {questionWeight}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {sectionType === 'speaking' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Inline form row (top before generation) */}
                      {!hasAIGenerated && (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 180px',
                            gap: 12,
                            background: theme === 'sun' ? 'rgba(24,144,255,0.06)' : 'rgba(167,139,250,0.10)',
                            border: `2px solid ${primaryColor}40`,
                            borderRadius: 12,
                            padding: 12
                          }}
                        >
                          {/* Reference Text */}
                          <div>
                            <Text strong>Reference text</Text>
                            <div style={{ marginTop: 6 }}>
                              <Input.TextArea
                                rows={3}
                                value={speakingReferenceText}
                                onChange={(e) => setSpeakingReferenceText(e.target.value)}
                                placeholder="Enter text if students were asked to read a passage"
                                style={{ borderRadius: 8, background: '#fff' }}
                              />
                            </div>
                          </div>
                          {/* Age */}
                          <div>
                            <Text strong>Age</Text>
                            <div style={{ marginTop: 6 }}>
                              <Input
                                type="number"
                                min={1}
                                max={100}
                                value={speakingAge}
                                onChange={(e) => setSpeakingAge(e.target.value)}
                                style={{ width: '100%', borderRadius: 8, background: '#fff' }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Speaking pre-generation hero panel */}
                      {!hasAIGenerated && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: 24,
                            borderRadius: 16,
                            border: `2px dashed ${primaryColor}40`,
                            background: theme === 'sun' ? 'rgba(113,179,253,0.06)' : 'rgba(167,139,250,0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: 12
                          }}
                        >
                          <div
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: theme === 'sun'
                                ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                                : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                              boxShadow: theme === 'sun' ? '0 6px 18px rgba(60,153,255,0.25)' : '0 6px 18px rgba(131,119,160,0.25)'
                            }}
                          >
                            <span style={{ fontSize: 28, color: '#fff' }}>✨</span>
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>AI Speaking Assistant</div>
                          <div style={{ maxWidth: 520, fontSize: 15, color: theme === 'sun' ? '#334155' : '#1F2937' }}>
                            Assess pronunciation accuracy and fluency from the student's recording
                          </div>
                          <div>
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
                                boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)'
                              }}
                            >
                              Generate with AI
                            </Button>
                          </div>
                        </div>
                      )}
                      {hasAIGenerated && speakingResult && (
                        <div style={{ marginTop: 0 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            color: theme === 'sun' ? '#1E40AF' : '#8377A0'
                          }}>
                            <Text strong>Pronunciation result</Text>
                          </div>
                          <div style={{
                            marginTop: 8,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                            gap: 12
                          }}>
                            {[{
                              label: 'Pronunciation',
                              value: Number.isFinite(Number(speakingResult?.pronunciationScore)) ? speakingResult.pronunciationScore : '-'
                            },{
                              label: 'Accuracy',
                              value: Number.isFinite(Number(speakingResult?.accuracyScore)) ? speakingResult.accuracyScore : '-'
                            },{
                              label: 'Fluency',
                              value: Number.isFinite(Number(speakingResult?.fluencyScore)) ? speakingResult.fluencyScore : '-'
                            },{
                              label: 'Completeness',
                              value: Number.isFinite(Number(speakingResult?.completenessScore)) ? speakingResult.completenessScore : '-'
                            },{
                              label: 'Prosody',
                              value: Number.isFinite(Number(speakingResult?.prosodyScore)) ? speakingResult.prosodyScore : '-'
                            }].map((item, idx) => {
                              const ss = speakingStyles[item.label] || { bg: theme === 'sun' ? 'rgba(24,144,255,0.06)' : 'rgba(244,240,255,0.10)', border: theme === 'sun' ? 'rgba(24,144,255,0.25)' : 'rgba(138,122,255,0.25)' };
                              return (
                              <div
                                key={`${item.label}-${idx}`}
                                style={{
                                  borderRadius: 12,
                                  padding: '12px 14px',
                                  background: ss.bg,
                                  border: `1px solid ${ss.border}`
                                }}
                              >
                                <div style={{ fontSize: 12, color: theme === 'sun' ? '#1E40AF' : '#8377A0', fontWeight: 600 }}>{item.label}</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: theme === 'sun' ? '#0f172a' : '#1F2937', marginTop: 2 }}>{item.value}</div>
                              </div>
                              );
                            })}
                          </div>
                          {Array.isArray(speakingResult?.words) && speakingResult.words.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <Text strong>Word details</Text>
                              <div style={{ marginTop: 6, maxHeight: 200, overflow: 'auto', border: `1px solid ${primaryColor}30`, borderRadius: 8, padding: 8 }}>
                                {speakingResult.words.map((w, idx) => (
                                  <div key={`${w?.word || 'w'}-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, fontSize: 13, padding: '6px 4px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                                    <div><b>{w?.word}</b></div>
                                    <div>Acc: {w?.accuracyScore ?? '-'}</div>
                                    <div>Err: {w?.errorType || '-'}</div>
                                    <div>Pos: {w?.position ?? '-'} / Dur: {w?.duration ?? '-'}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Score moved to header row next to Back button */}
                          <div style={{ marginTop: 4 }}>
                            <Text strong>Feedback</Text>
                            <div className="feedback-editor-wrap" style={{ marginTop: 6, borderRadius: 12, border: `2px solid ${primaryColor}80`, background: theme === 'sun' ? primaryColorWithAlpha : 'rgba(244, 240, 255, 0.15)' }}>
                              <CKEditor
                                editor={ClassicEditor}
                                data={feedback}
                                onChange={(event, editor) => setFeedback(editor.getData())}
                                config={{
                                  toolbar: { items: ['undo', 'redo', '|', 'paragraph', '|', 'bold', 'italic', '|', 'bulletedList', 'numberedList', '|', 'imageUpload'] },
                                  removePlugins: ['StickyToolbar']
                                }}
                                onReady={(editor) => {
                                  try {
                                    const el = editor.ui?.getEditableElement?.();
                                    if (el) {
                                      el.style.minHeight = '300px';
                                      el.style.color = '#000';
                                    }
                                  } catch {}
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Writing: pre-generation hero panel */}
                  {sectionType === 'writing' && !hasAIGenerated && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 24,
                        borderRadius: 16,
                        border: `2px dashed ${primaryColor}40`,
                        background: theme === 'sun' ? 'rgba(113,179,253,0.06)' : 'rgba(167,139,250,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 12
                      }}
                    >
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: theme === 'sun'
                            ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                            : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                          boxShadow: theme === 'sun' ? '0 6px 18px rgba(60,153,255,0.25)' : '0 6px 18px rgba(131,119,160,0.25)'
                        }}
                      >
                        <span style={{ fontSize: 28, color: '#fff' }}>✨</span>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>AI Writing Assistant</div>
                      <div style={{ maxWidth: 520, fontSize: 15, color: theme === 'sun' ? '#334155' : '#1F2937' }}>
                        Get comprehensive feedback on your writing with detailed analysis and suggestions
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong>Age</Text>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={speakingAge}
                            onChange={(e) => setSpeakingAge(e.target.value)}
                            placeholder="e.g. 12"
                            style={{ width: 100, borderRadius: 8, background: '#fff' }}
                          />
                        </div>
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
                            boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)'
                          }}
                        >
                          Generate with AI
                        </Button>
                      </div>
                    </div>
                  )}
                  {hasAIGenerated && sectionType !== 'speaking' && (
                    <>
                      {/* Feedback first */}
                      <div>
                        <Text strong>Feedback</Text>
                        <div className="feedback-editor-wrap" style={{ marginTop: 6, borderRadius: 12, border: `2px solid ${primaryColor}80`, background: theme === 'sun' ? primaryColorWithAlpha : 'rgba(244, 240, 255, 0.15)' }}>
                          <CKEditor
                            editor={ClassicEditor}
                            data={feedback}
                            onChange={(event, editor) => setFeedback(editor.getData())}
                            config={{
                              toolbar: { items: ['undo', 'redo', '|', 'paragraph', '|', 'bold', 'italic', '|', 'bulletedList', 'numberedList', '|', 'imageUpload'] },
                              removePlugins: ['StickyToolbar']
                            }}
                            onReady={(editor) => {
                              try {
                                const el = editor.ui?.getEditableElement?.();
                                if (el) {
                                  el.style.minHeight = '300px';
                                  el.style.color = '#000';
                                }
                              } catch {}
                            }}
                          />
                        </div>
                      </div>
                      {/* Criteria feedback cards (one per row) */}
                      {writingCriteria && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                      {[
                            { key: 'taskResponse', label: 'Task Response' },
                            { key: 'cohesionCoherence', label: 'Cohesion & Coherence' },
                            { key: 'lexicalResource', label: 'Lexical Resource' },
                            { key: 'grammaticalRangeAccuracy', label: 'Grammatical Range & Accuracy' }
                          ].map((it) => {
                            const data = writingCriteria?.[it.key];
                            if (!data) return null;
                            const scoreNum = Number.isFinite(Number(data?.score)) ? Number(data.score) : null;
                            const scoreVal = scoreNum != null ? `${scoreNum}/10` : '-';
                            const fb = (data?.feedback || '').trim();
                            const percent = scoreNum != null ? Math.max(0, Math.min(100, (scoreNum / 10) * 100)) : 0;
                            const level = scoreNum == null ? 'neutral' : (scoreNum < 4 ? 'low' : (scoreNum < 7 ? 'mid' : 'high'));
                            const barColor = level === 'low' ? '#EF4444' : level === 'mid' ? '#F59E0B' : '#22C55E';
                            const badgeBg = level === 'low' ? '#FEE2E2' : level === 'mid' ? '#FEF3C7' : '#DCFCE7';
                            const badgeText = level === 'low' ? 'Needs Work' : level === 'mid' ? 'Fair' : 'Good';
                            const cs = criteriaStyles[it.key] || { bg: theme === 'sun' ? 'rgba(113,179,253,0.08)' : 'rgba(167,139,250,0.10)', border: `${primaryColor}40` };
                            return (
                              <Card
                                key={it.key}
                                style={{
                                  borderRadius: 12,
                                  border: `2px solid ${cs.border}`,
                                  background: cs.bg
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                  <Typography.Text strong style={{ color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>{it.label}</Typography.Text>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ fontWeight: 700, color: theme === 'sun' ? '#0f172a' : '#1F2937' }}>{scoreVal}</div>
                                    {scoreNum != null && (
                                      <span style={{ background: badgeBg, color: theme === 'sun' ? '#111827' : '#111827', borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{badgeText}</span>
                                    )}
                                  </div>
                                </div>
                                {/* Progress bar */}
                                <div style={{ marginTop: 10, height: 8, borderRadius: 8, background: 'rgba(0,0,0,0.08)' }}>
                                  <div style={{ width: `${percent}%`, height: '100%', borderRadius: 8, background: barColor }} />
                                </div>
                                {fb && (
                                  <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.7, color: theme === 'sun' ? '#333' : '#1F2937', whiteSpace: 'pre-wrap' }}>
                                    <b>{it.label.split(' & ').join(' and ')}:</b> {stripHtmlToText(fb)}
                                  </div>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {/* Bottom area: after generation, move inputs above the button */}
                  {sectionType === 'speaking' && hasAIGenerated && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 180px',
                        gap: 12,
                        background: theme === 'sun' ? 'rgba(24,144,255,0.06)' : 'rgba(167,139,250,0.10)',
                        border: `2px solid ${primaryColor}40`,
                        borderRadius: 12,
                        padding: 12,
                        marginTop: 8
                      }}
                    >
                      <div>
                        <Text strong>Reference text</Text>
                        <div style={{ marginTop: 6 }}>
                          <Input.TextArea
                            rows={3}
                            value={speakingReferenceText}
                            onChange={(e) => setSpeakingReferenceText(e.target.value)}
                            placeholder="Enter text if students were asked to read a passage"
                            style={{ borderRadius: 8, background: '#fff' }}
                          />
                        </div>
                      </div>
                      <div>
                        <Text strong>Age</Text>
                        <div style={{ marginTop: 6 }}>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={speakingAge}
                            onChange={(e) => setSpeakingAge(e.target.value)}
                            style={{ width: '100%', borderRadius: 8, background: '#fff' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {sectionType === 'speaking' && hasAIGenerated && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 24,
                        borderRadius: 16,
                        border: `2px dashed ${primaryColor}40`,
                        background: theme === 'sun' ? 'rgba(113,179,253,0.06)' : 'rgba(167,139,250,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 12
                      }}
                    >
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: theme === 'sun'
                            ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                            : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                          boxShadow: theme === 'sun' ? '0 6px 18px rgba(60,153,255,0.25)' : '0 6px 18px rgba(131,119,160,0.25)'
                        }}
                      >
                        <span style={{ fontSize: 28, color: '#fff' }}>✨</span>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>AI Speaking Assistant</div>
                      <div style={{ maxWidth: 520, fontSize: 15, color: theme === 'sun' ? '#334155' : '#1F2937' }}>
                        Regenerate pronunciation analysis for another take
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                       
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
                            boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)'
                          }}
                        >
                          Regenerate with AI
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* Button stays at very bottom (speaking handled by hero panels) */}
                  {sectionType === 'writing' ? (
                    hasAIGenerated ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 24,
                        borderRadius: 16,
                        border: `2px dashed ${primaryColor}40`,
                        background: theme === 'sun' ? 'rgba(113,179,253,0.06)' : 'rgba(167,139,250,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 12
                      }}
                    >
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: theme === 'sun'
                            ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                            : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                          boxShadow: theme === 'sun' ? '0 6px 18px rgba(60,153,255,0.25)' : '0 6px 18px rgba(131,119,160,0.25)'
                        }}
                      >
                        <span style={{ fontSize: 28, color: '#fff' }}>✨</span>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>AI Writing Assistant</div>
                      <div style={{ maxWidth: 520, fontSize: 15, color: theme === 'sun' ? '#334155' : '#1F2937' }}>
                        You can regenerate suggestions if you want a different take.
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong>Age</Text>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={speakingAge}
                            onChange={(e) => setSpeakingAge(e.target.value)}
                            placeholder="e.g. 12"
                            style={{ width: 100, borderRadius: 8, background: '#fff' }}
                          />
                        </div>
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
                              : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #6D5F8F 100%)',
                            border: 'none',
                            color: '#000',
                            boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)'
                          }}
                        >
                          Regenerate with AI
                        </Button>
                      </div>
                    </div>
                    ) : null
                  ) : (
                    sectionType === 'speaking' ? null :
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
                          boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)'
                        }}
                      >
                        {hasAIGenerated ? 'Regenerate with AI' : 'Generate with AI'}
                      </Button>
                    </div>
                  )}
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
        width={700}
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
          <div className="comment-editor-wrap" style={{ borderRadius: 12, border: `2px solid ${primaryColor}80`, background: theme === 'sun' ? primaryColorWithAlpha : 'rgba(244, 240, 255, 0.15)' }}>
            <CKEditor
              editor={ClassicEditor}
              data={commentModal.comment}
              onChange={handleCommentInputChange}
              config={{
                              toolbar: { items: ['undo', 'redo', '|', 'paragraph', '|', 'bold', 'italic', '|', 'bulletedList', 'numberedList'] },
                              removePlugins: ['StickyToolbar']
              }}
              onReady={(editor) => {
                try {
                  const el = editor.ui?.getEditableElement?.();
                  if (el) {
                    el.style.minHeight = '200px';
                    el.style.maxHeight = '200px';
                    el.style.overflowY = 'auto';
                    el.style.color = '#000';
                  }
                } catch {}
              }}
            />
          </div>
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
            {stripHtmlToText(selectedComment.comment) || 'No comment provided.'}
          </div>

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


