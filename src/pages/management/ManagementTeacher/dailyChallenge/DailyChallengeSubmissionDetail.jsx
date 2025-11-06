import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Space,
  Typography,
  Modal,
  Input,
  Row,
  Col,
  Card,
  Tooltip,
  Divider,
  Pagination,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  CommentOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CloseOutlined,
  MenuOutlined,
  SwapOutlined,
  CopyOutlined,
  FileTextOutlined,
  EyeOutlined,
  EditOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  UpOutlined,
  DownOutlined,
  PlusCircleOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./DailyChallengeSubmissionDetail.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useDailyChallengeMenu } from "../../../../contexts/DailyChallengeMenuContext";
import usePageTitle from "../../../../hooks/usePageTitle";
import { dailyChallengeApi } from "../../../../apis/apis";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useSelector } from 'react-redux';

const DailyChallengeSubmissionDetail = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { id, submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { enterDailyChallengeMenu, exitDailyChallengeMenu, dailyChallengeData } = useDailyChallengeMenu();
  
  // Get user role from Redux
  const userRole = useSelector((state) => state.auth?.user?.role);
  const isStudent = userRole === 'student' || userRole === 'test_taker';
  
  // Set page title
  usePageTitle('Daily Challenge - Submission Detail');
  
  const [loading, setLoading] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, correct, incorrect, unanswered
  const [challengeType, setChallengeType] = useState('GV'); // GV, RE, LI, WR, SP
  const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar collapse state
  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'questions'
  const questionRefs = React.useRef({});

  // Generate fake data for all question types
  const [fakeData, setFakeData] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  
  // Audio state for Speaking Sections with audio
  const [audioStates, setAudioStates] = useState({});
  const audioRefs = React.useRef({});
  
  // Feedback modal state
  const [feedbackModal, setFeedbackModal] = useState({
    visible: false,
    id: null,
    type: null, // 'question' or 'section'
    feedback: '',
    score: '',
    isEdit: false,
  });
  
  // Store feedbacks for questions and sections
  const [feedbacks, setFeedbacks] = useState({});
  
  // Anti-cheat data
  const [antiCheatData, setAntiCheatData] = useState(null);
  
  // Score modal state
  const [scoreModal, setScoreModal] = useState({
    visible: false,
    score: '',
    comment: '',
    isEdit: false,
  });
  
  // Teacher feedback state
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [overallFeedbackModalVisible, setOverallFeedbackModalVisible] = useState(false);
  const [overallFeedbackDraft, setOverallFeedbackDraft] = useState('');
  const [savingGrading, setSavingGrading] = useState(false);
  const [antiCheatModalVisible, setAntiCheatModalVisible] = useState(false);
  const [antiCheatExpanded, setAntiCheatExpanded] = useState({});
  
  
  // Performance collapse state
  const [isPerformanceCollapsed, setIsPerformanceCollapsed] = useState(false);
  
  // Other sections collapse states (default collapsed)
  const [isTeacherFeedbackCollapsed, setIsTeacherFeedbackCollapsed] = useState(false);
  
  const [isAntiCheatCollapsed, setIsAntiCheatCollapsed] = useState(false);
  // Anti-cheat modal controls
  const [antiCheatSelectedDate, setAntiCheatSelectedDate] = useState(null); // JS Date or null
  const [antiCheatPage, setAntiCheatPage] = useState(1);
  const [antiCheatPageSize, setAntiCheatPageSize] = useState(20);
  
  // Cache existing grading per submissionQuestionId
  const [gradingBySubmissionQuestionId, setGradingBySubmissionQuestionId] = useState({});
  
  // Handlers for feedback modal
  // Helper to locate submissionQuestionId for a section
  const getSubmissionQuestionIdForSection = (sectionId) => {
    const findIn = (arr) => (arr || []).find((s) => s.id === sectionId);
    const sec = findIn(fakeData?.writingSections) || findIn(fakeData?.speakingSections);
    if (!sec) return null;
    const q = (sec.questions && sec.questions[0]) || null;
    return (q && (q.submissionQuestionId || q.id)) || null;
  };

  // Check if a section (writing/speaking) already has grading saved
  // Only consider it as "existing" if there's actual content (score > 0, feedback, or highlights)
  const hasExistingGradingForSection = (sectionId) => {
    const subQId = getSubmissionQuestionIdForSection(sectionId);
    if (!subQId) return false;
    const g = gradingBySubmissionQuestionId[subQId];
    if (!g) return false;
    // Only consider as existing if receivedWeight > 0 (not just 0 or empty)
    const hasScore = Number.isFinite(Number(g.receivedWeight)) && Number(g.receivedWeight) > 0;
    const hasFb = typeof g.feedback === 'string' && g.feedback.trim() !== '';
    const hasHighlights = Array.isArray(g.highlightComments) && g.highlightComments.length > 0;
    return !!(hasScore || hasFb || hasHighlights);
  };

  const handleOpenAddFeedback = (sectionId, type = 'question') => {
    // Navigate to AI feedback grading page for section type
    if (type === 'section') {
      const isTA = typeof window !== 'undefined' && window.location && /teaching-assistant/.test(window.location.pathname);
      const base = isTA ? '/teaching-assistant' : '/teacher';
      // Build prefill data from the already loaded submission (to show immediately on the left panel)
      const locateSection = (sid) => {
        const findIn = (arr) => (arr || []).find((s) => s.id === sid);
        const w = findIn(fakeData?.writingSections);
        if (w) return { ...w, __kind: 'writing' };
        const s = findIn(fakeData?.speakingSections);
        if (s) return { ...s, __kind: 'speaking' };
        return null; // Limit to writing & speaking only
      };
      const sec = locateSection(sectionId);
      const submissionQuestionId = getSubmissionQuestionIdForSection(sectionId);
      if (!submissionQuestionId) {
        spaceToast.error('Không tìm thấy submissionQuestionId cho section này');
        return;
      }
      // Use challengeId from submissionData, fallback to id from URL params
      const challengeId = submissionData?.challenge?.id || id;
      const path = `${base}/daily-challenges/detail/${challengeId}/submissions/${submissionId}/feedback/${submissionQuestionId}`;
      // Only allow writing & speaking
      if (!sec) {
        // Not a writing/speaking section → use existing modal flow
        let prefillScore = '';
        setFeedbackModal({ visible: true, id: sectionId, type, feedback: '', score: prefillScore, isEdit: false });
        return;
      }
      const sectionPayload = sec.__kind === 'writing'
        ? { id: sec.id, sectionTitle: sec.title || 'Writing', sectionsContent: sec.prompt || '' }
        : { id: sec.id, sectionTitle: sec.title || 'Speaking', sectionsContent: sec.transcript || '', sectionsUrl: sec.audioUrl || '' };
      const studentAns = studentAnswers?.[sectionId] || null;
      const derivedType = sec.__kind; // only 'writing' or 'speaking'
      const prefillScore = (() => {
        const subQId = getSubmissionQuestionIdForSection(sectionId);
        return subQId ? (questionScores[subQId] ?? '') : '';
      })();
      
      // Get questionWeight from existing grading if available, otherwise null (will be fetched in AIGenerateFeedback)
      const existingGrading = submissionQuestionId ? gradingBySubmissionQuestionId[submissionQuestionId] : null;
      const prefillQuestionWeight = existingGrading?.questionWeight || null;
      
      // Extract header data
      const params = new URLSearchParams(location.search || '');
      const classId = location.state?.classId || params.get('classId') || null;
      const className = dailyChallengeData?.className || location.state?.className || null;
      const subtitle = dailyChallengeData?.subtitle || '';
      // If className is separate, subtitle might be just challenge name, otherwise split "Class / Challenge"
      const challengeName = className 
        ? (subtitle.includes(' / ') ? subtitle.split(' / ').slice(1).join(' / ') : subtitle || null)
        : (subtitle.includes(' / ') ? subtitle.split(' / ')[1] : (subtitle || null));
      const studentName = submissionData?.student?.name || location?.state?.studentName || null;
      
      // Build query params to preserve class context
      const qs = new URLSearchParams();
      if (classId) qs.set('classId', classId);
      if (className) qs.set('className', className);
      if (challengeName) qs.set('challengeName', challengeName);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      
      navigate(`${path}${suffix}`, {
        state: {
          submissionId: submissionId,
          sectionId: sectionId,
          prefill: { score: prefillScore, questionWeight: prefillQuestionWeight, section: sectionPayload, studentAnswer: studentAns, type: derivedType, submissionQuestionId },
          backState: { from: 'submission-detail' },
          classId: classId,
          className,
          challengeName,
          studentName,
        },
      });
      return;
    }
    // Fallback to modal for question-specific feedback
    let prefillScore = '';
    setFeedbackModal({ visible: true, id, type, feedback: '', score: prefillScore, isEdit: false });
  };

  // Per-question scores for Writing and Speaking (keyed by submissionQuestionId or questionId)
  const [questionScores, setQuestionScores] = useState({});
  
  const handleOpenEditFeedback = (sectionIdParam, type = 'question') => {
    // For section (writing/speaking), navigate to grading page with existing data
    if (type === 'section') {
      const isTA = typeof window !== 'undefined' && window.location && /teaching-assistant/.test(window.location.pathname);
      const base = isTA ? '/teaching-assistant' : '/teacher';
      const findIn = (arr) => (arr || []).find((s) => s.id === sectionIdParam);
      const w = findIn(fakeData?.writingSections);
      const s = findIn(fakeData?.speakingSections);
      const sec = w ? { ...w, __kind: 'writing' } : s ? { ...s, __kind: 'speaking' } : null;
      if (!sec) {
        // fallback to modal like old behavior
        const key = `${type}-${sectionIdParam}`;
        const existingFeedback = feedbacks[key] || '';
        let prefillScore = '';
        const subQId = getSubmissionQuestionIdForSection(sectionIdParam);
        if (subQId) prefillScore = questionScores[subQId] ?? '';
        setFeedbackModal({ visible: true, id: sectionIdParam, type, feedback: existingFeedback, score: prefillScore, isEdit: true });
        return;
      }
      const submissionQuestionId = getSubmissionQuestionIdForSection(sectionIdParam);
      if (!submissionQuestionId) {
        spaceToast.error('Không tìm thấy submissionQuestionId cho section này');
        return;
      }
      // Use challengeId from submissionData, fallback to id from URL params (component-level id from useParams)
      const challengeId = submissionData?.challenge?.id || id;
      const path = `${base}/daily-challenges/detail/${challengeId}/submissions/${submissionId}/feedback/${submissionQuestionId}`;
      const sectionPayload = sec.__kind === 'writing'
        ? { id: sec.id, sectionTitle: sec.title || 'Writing', sectionsContent: sec.prompt || '' }
        : { id: sec.id, sectionTitle: sec.title || 'Speaking', sectionsContent: sec.transcript || '', sectionsUrl: sec.audioUrl || '' };
      const studentAns = studentAnswers?.[sectionIdParam] || null;
      const existing = submissionQuestionId ? gradingBySubmissionQuestionId[submissionQuestionId] : null;
      const prefillScore = (() => {
        if (existing && (existing.receivedWeight != null)) return existing.receivedWeight;
        return submissionQuestionId ? (questionScores[submissionQuestionId] ?? '') : '';
      })();
      const prefill = {
        score: prefillScore,
        questionWeight: existing?.questionWeight || null, // Pass questionWeight from existing grading
        section: sectionPayload,
        studentAnswer: studentAns,
        type: sec.__kind,
        submissionQuestionId,
        feedback: existing?.feedback || '',
        highlightComments: Array.isArray(existing?.highlightComments) ? existing.highlightComments : [],
      };
      
      // Extract header data
      const params = new URLSearchParams(location.search || '');
      const classId = location.state?.classId || params.get('classId') || null;
      const className = dailyChallengeData?.className || location.state?.className || null;
      const subtitle = dailyChallengeData?.subtitle || '';
      // If className is separate, subtitle might be just challenge name, otherwise split "Class / Challenge"
      const challengeName = className 
        ? (subtitle.includes(' / ') ? subtitle.split(' / ').slice(1).join(' / ') : subtitle || null)
        : (subtitle.includes(' / ') ? subtitle.split(' / ')[1] : (subtitle || null));
      const studentName = submissionData?.student?.name || location?.state?.studentName || null;
      
      // Build query params to preserve class context
      const qs = new URLSearchParams();
      if (classId) qs.set('classId', classId);
      if (className) qs.set('className', className);
      if (challengeName) qs.set('challengeName', challengeName);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      
      navigate(`${path}${suffix}`, { 
        state: { 
          submissionId, 
          sectionId: sectionIdParam, 
          prefill, 
          backState: { from: 'submission-detail' },
          classId: classId,
          className,
          challengeName,
          studentName,
        } 
      });
      return;
    }
    // Question-level fallback (legacy)
    const key = `${type}-${id}`;
    const existingFeedback = feedbacks[key] || '';
    setFeedbackModal({ visible: true, id, type, feedback: existingFeedback, score: '', isEdit: true });
  };
  
  const handleCloseFeedbackModal = () => {
    setFeedbackModal({
      visible: false,
      id: null,
      type: null,
      feedback: '',
      score: '',
      isEdit: false,
    });
  };
  
  const handleSaveFeedback = () => {
    if (feedbackModal.id && feedbackModal.type) {
      const key = `${feedbackModal.type}-${feedbackModal.id}`;
      setFeedbacks(prev => ({
        ...prev,
        [key]: feedbackModal.feedback,
      }));
      // Save score for section if provided
      if (feedbackModal.type === 'section') {
        const subQId = getSubmissionQuestionIdForSection(feedbackModal.id);
        if (subQId) {
          setQuestionScores(prev => ({
            ...prev,
            [subQId]: feedbackModal.score,
          }));
        }
      }
      // No toast here; header Save will show BE message
      handleCloseFeedbackModal();
    }
  };
  
  // Handle delete feedback
  const handleDeleteFeedback = () => {
    if (feedbackModal.id && feedbackModal.type) {
      const key = `${feedbackModal.type}-${feedbackModal.id}`;
      setFeedbacks(prev => {
        const newFeedbacks = { ...prev };
        delete newFeedbacks[key];
        return newFeedbacks;
      });
      // Keep delete success toast for UX
      handleCloseFeedbackModal();
    }
  };
  
  // Handle delete feedback directly (without modal)
  const handleDeleteFeedbackDirect = (id, type = 'question') => {
    const key = `${type}-${id}`;
    setFeedbacks(prev => {
      const newFeedbacks = { ...prev };
      delete newFeedbacks[key];
      return newFeedbacks;
    });
    // Keep delete success toast for UX
  };

  // Memoized handlers for feedback modal input to prevent lag
  const handleFeedbackInputChange = useCallback((e) => {
    const value = e.target.value;
    setFeedbackModal(prev => ({ ...prev, feedback: value }));
  }, []);

  // Memoized handlers for score modal inputs to prevent lag
  const handleScoreInputChange = useCallback((e) => {
    const value = e.target.value;
    setScoreModal(prev => ({ ...prev, score: value }));
  }, []);

  // Memoized handler for comment modal input to prevent lag
  const handleCommentInputChange = useCallback((e) => {
    const value = e.target.value;
    setCommentModal(prev => ({ ...prev, comment: value }));
  }, []);
  
  // Helper function to get feedback for a question or section
  const getFeedback = (id, type = 'question') => {
    const key = `${type}-${id}`;
    return feedbacks[key] || null;
  };
  
  // State for text selection and comments in Writing sections
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
  
  // Handle text selection in Writing Section
  const handleTextSelection = (sectionId, textElement) => {
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
    
    // Check if selection is within the textElement
    if (!textElement.contains(range.commonAncestorContainer)) {
      setTextSelection({ visible: false, sectionId: null, startIndex: null, endIndex: null, position: { x: 0, y: 0 } });
      return;
    }
    
    // Get the plain text of the essay
    const studentAnswer = studentAnswers?.[sectionId] || {};
    const essayText = studentAnswer?.text || studentAnswer?.essay || '';
    if (!essayText) return;
    
    // Calculate indices based on plain text
    // Create a range from the start of textElement to the start of selection
    const startRange = document.createRange();
    startRange.setStart(textElement, 0);
    startRange.setEnd(range.startContainer, range.startOffset);
    let startIndex = startRange.toString().length;
    
    // Create a range from the start of textElement to the end of selection
    const endRange = document.createRange();
    endRange.setStart(textElement, 0);
    endRange.setEnd(range.endContainer, range.endOffset);
    let endIndex = endRange.toString().length;
    
    // Verify the calculated indices match the selected text
    const calculatedText = essayText.substring(startIndex, endIndex);
    // Allow some flexibility for whitespace differences
    if (calculatedText.trim() !== selectedText.trim() && 
        !calculatedText.includes(selectedText.trim()) && 
        !selectedText.trim().includes(calculatedText)) {
      // If mismatch, try to find the text in the essay
      const trimmedSelected = selectedText.trim();
      const foundIndex = essayText.indexOf(trimmedSelected);
      if (foundIndex !== -1) {
        startIndex = foundIndex;
        endIndex = foundIndex + trimmedSelected.length;
      }
    }
    
    // Get position for floating toolbar - align with selected text, next to translate icon
    const rect = range.getBoundingClientRect();
    const containerRect = textElement.getBoundingClientRect();
    
    // Calculate position relative to container: bên cạnh text được select (sau translate icon)
    // Translate icon thường xuất hiện ở giữa dòng text (theo chiều cao)
    const relativeX = rect.right - containerRect.left + 10; // Ngay sau text được select
    const relativeY = rect.top - containerRect.top + (rect.height / 2); // Giữa dòng text để thẳng hàng với translate icon
    
    setTextSelection({
      visible: true,
      sectionId,
      startIndex,
      endIndex,
      position: {
        x: relativeX,
        y: relativeY, // Center of the selected text line
      },
    });
  };
  
  // Handle add comment button click
  const handleAddComment = () => {
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
  };
  
  // Handle save comment
  const handleSaveComment = () => {
    if (commentModal.sectionId && commentModal.startIndex !== null && commentModal.endIndex !== null) {
      const sectionId = commentModal.sectionId;
      const feedbackId = commentModal.feedbackId || `feedback-${Date.now()}-${Math.random()}`;
      
      const newFeedback = {
        id: feedbackId,
        startIndex: commentModal.startIndex,
        endIndex: commentModal.endIndex,
        comment: commentModal.comment,
        timestamp: new Date().toISOString(),
      };
      
      setWritingSectionFeedbacks(prev => {
        const sectionFeedbacks = prev[sectionId] || [];
        if (commentModal.isEdit) {
          // Update existing feedback
          const updated = sectionFeedbacks.map(fb => 
            fb.id === feedbackId ? newFeedback : fb
          );
          return { ...prev, [sectionId]: updated };
        } else {
          // Add new feedback
          return { ...prev, [sectionId]: [...sectionFeedbacks, newFeedback] };
        }
      });
      
      // Keep comment toasts for UX; unrelated to header Save
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
  };
  
  // Handle delete comment
  const handleDeleteComment = () => {
    if (selectedComment) {
      const sectionId = Object.keys(writingSectionFeedbacks).find(id => 
        writingSectionFeedbacks[id]?.some(fb => fb.id === selectedComment.id)
      );
      
      if (sectionId) {
        setWritingSectionFeedbacks(prev => {
          const sectionFeedbacks = prev[sectionId] || [];
          const updated = sectionFeedbacks.filter(fb => fb.id !== selectedComment.id);
          return { ...prev, [sectionId]: updated };
        });
        
        // Keep delete success toast for UX
        setShowCommentSidebar(false);
        setSelectedComment(null);
      }
    }
  };
  
  // Handle click on highlighted text
  const handleHighlightClick = (feedback) => {
    setSelectedComment(feedback);
    setShowCommentSidebar(true);
  };
  
  // Handle edit comment from sidebar
  const handleEditCommentFromSidebar = () => {
    if (selectedComment) {
      const sectionId = Object.keys(writingSectionFeedbacks).find(id => 
        writingSectionFeedbacks[id]?.some(fb => fb.id === selectedComment.id)
      );
      
      if (sectionId) {
        setCommentModal({
          visible: true,
          sectionId,
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
  };
  
  // Render essay with highlights
  const renderEssayWithHighlights = (text, sectionId) => {
    if (!text) return text;
    
    const sectionFeedbacks = writingSectionFeedbacks[sectionId] || [];
    if (sectionFeedbacks.length === 0) {
      return text;
    }
    
    // Sort feedbacks by start position
    const sortedFeedbacks = [...sectionFeedbacks].sort((a, b) => a.startIndex - b.startIndex);
    
    // Track which highlight is currently active (clicked)
    const isActiveHighlight = selectedComment && selectedComment.id;
    
    // Create intervals from highlights - merge overlapping intervals
    // Each interval contains: {start, end, feedbacks: [array of feedback ids]}
    const intervals = [];
    const breakpoints = new Set();
    
    // Collect all breakpoints (start and end indices)
    sortedFeedbacks.forEach(feedback => {
      breakpoints.add(feedback.startIndex);
      breakpoints.add(feedback.endIndex);
    });
    
    // Sort breakpoints
    const sortedBreakpoints = Array.from(breakpoints).sort((a, b) => a - b);
    
    // Create intervals from breakpoints
    for (let i = 0; i < sortedBreakpoints.length - 1; i++) {
      const start = sortedBreakpoints[i];
      const end = sortedBreakpoints[i + 1];
      
      // Find all feedbacks that cover this interval
      const coveringFeedbacks = sortedFeedbacks.filter(fb => 
        fb.startIndex <= start && fb.endIndex >= end
      );
      
      if (coveringFeedbacks.length > 0) {
        intervals.push({
          start,
          end,
          feedbacks: coveringFeedbacks
        });
      }
    }
    
    // Render intervals and plain text segments
    const parts = [];
    let currentIndex = 0;
    
    intervals.forEach((interval, idx) => {
      // Add plain text before this interval
      if (interval.start > currentIndex) {
        const plainText = text.substring(currentIndex, interval.start);
        if (plainText) {
          parts.push(
            <span key={`text-${currentIndex}-${interval.start}`}>
              {plainText}
            </span>
          );
        }
      }
      
      // Render the highlighted text for this interval (only once, no duplication)
      const intervalText = text.substring(interval.start, interval.end);
      
      // Determine which feedback to use for styling (prioritize active one)
      const activeFeedback = interval.feedbacks.find(fb => fb.id === isActiveHighlight);
      const displayFeedback = activeFeedback || interval.feedbacks[0];
      const isActive = activeFeedback !== undefined;
      
      // Check if any feedback in this interval is hovered
      const isHovered = interval.feedbacks.some(fb => fb.id === hoveredHighlightId);
      
      // Determine background color: active > hovered > normal
      const backgroundColor = isActive ? '#FFD700' : (isHovered ? '#FFD700' : '#FFEB3B');
      const fontWeight = (isActive || isHovered) ? '600' : '500';
      const boxShadow = (isActive || isHovered) ? '0 2px 4px rgba(0, 0, 0, 0.2)' : 'none';
      
      // Create click handler that handles all covering feedbacks
      const handleClick = (e) => {
        // If multiple feedbacks cover this text, prioritize the active one or the first one
        if (displayFeedback) {
          handleHighlightClick(displayFeedback);
        }
      };
      
      // Handle hover - set hovered state for all feedbacks in this interval
      const handleMouseEnter = () => {
        if (interval.feedbacks.length > 0) {
          // Use the display feedback ID for hover state
          setHoveredHighlightId(displayFeedback.id);
        }
      };
      
      const handleMouseLeave = () => {
        setHoveredHighlightId(null);
      };
      
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
    
    // Add remaining text after last interval
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      if (remainingText) {
        parts.push(
          <span key={`text-final-${currentIndex}`}>
            {remainingText}
          </span>
        );
      }
    }
    
    return parts;
  };

  // Hide floating toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (textSelection.visible) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount === 0) {
          setTextSelection({ visible: false, sectionId: null, startIndex: null, endIndex: null, position: { x: 0, y: 0 } });
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [textSelection.visible]);

  // Note: Fake data generation is removed - now using API data from fetchSubmissionDetail

  const fetchSubmissionDetail = useCallback(async () => {
    if (!submissionId) {
      spaceToast.error('Submission ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await dailyChallengeApi.getSubmissionResult(submissionId);
      const apiData = response?.data?.data || response?.data || {};
      
      const sectionDetails = apiData.sectionDetails || [];
      const challengeId = apiData.challengeId || id;
      const submissionChallengeId = apiData.submissionChallengeId || submissionId;

      // Map API response to component's expected format
      const readingSections = [];
      const listeningSections = [];
      const writingSections = [];
      const speakingSections = [];
      const questions = [];
      const studentAnswersMap = {};
      let totalQuestions = 0;
      let totalScore = 0;
      let receivedScore = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;

      sectionDetails.forEach((sectionDetail) => {
        const section = sectionDetail.section || {};
        const questionResults = sectionDetail.questionResults || [];
        const sectionTitle = (section.sectionTitle || '').toLowerCase();
        
        // Determine section type using multiple signals (title, content, resource, question types)
        const hasAudio = !!section.sectionsUrl;
        const hasLongPassage = !!section.sectionsContent &&
          section.sectionsContent.replace(/<[^>]*>/g, '').trim().length > 120 &&
          !/(choose|select|dropdown|drag|drop|fill|rearrange|rewrite)/i.test(section.sectionsContent || '');
        const hasRewriteQuestion = (sectionDetail.questionResults || []).some(q => q?.questionType === 'REWRITE');

        let sectionType = 'listening'; // default
        // 1) Strong signals by explicit title first
        if (sectionTitle.includes('writing')) {
          sectionType = 'writing';
        } else if (sectionTitle.includes('reading')) {
          sectionType = 'reading';
        } else if (sectionTitle.includes('speaking')) {
          sectionType = 'speaking';
        } else if (sectionTitle.includes('listening')) {
          sectionType = 'listening';
        } else {
          // 2) Heuristics as fallback
          if (hasAudio) sectionType = 'listening';
          else if (hasRewriteQuestion) sectionType = 'writing';
          else if (hasLongPassage) sectionType = 'reading';
        }

        // Map questions
        const mappedQuestions = questionResults.map((q) => {
          totalQuestions++;
          totalScore += q.score || 0;
          receivedScore += q.receivedScore || 0;
          
          // Count correct, incorrect, unanswered
          if (q.receivedScore > 0) {
            correctCount++;
          } else if (q.submittedContent && q.submittedContent.data && q.submittedContent.data.length > 0) {
            incorrectCount++;
          } else {
            unansweredCount++;
          }

          const questionContent = q.questionContent?.data || [];
          const submittedContent = q.submittedContent?.data || [];

          // Map student answers based on question type
          if (q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'TRUE_OR_FALSE') {
            const submitted = submittedContent?.[0];
            if (submitted?.id) {
              if (q.questionType === 'TRUE_OR_FALSE') {
                // Map A/B (or ids) to displayed value True/False based on questionContent
                const matched = questionContent.find(opt => opt.id === submitted.id);
                const mappedValue = matched?.value || (submitted.id === 'True' ? 'True' : submitted.id === 'False' ? 'False' : undefined);
                if (mappedValue) {
                  studentAnswersMap[q.questionId] = mappedValue; // 'True' or 'False'
                }
              } else {
                // For multiple choice, use the option id (A, B, C, etc.)
                studentAnswersMap[q.questionId] = submitted.id;
              }
            }
          } else if (q.questionType === 'MULTIPLE_SELECT') {
            const submittedKeys = submittedContent?.map(s => s.id).filter(Boolean) || [];
            studentAnswersMap[q.questionId] = submittedKeys;
          } else if (q.questionType === 'FILL_IN_THE_BLANK') {
            const submittedItems = submittedContent || [];
            const fillBlankAnswers = {};
            // For fill in the blank, need to match each submitted answer with correct positionId
            submittedItems.forEach((submitted) => {
              if (submitted && submitted.value) {
                // Use the positionId directly from submittedContent (most reliable)
                const submittedPosId = submitted.positionId;
                
                if (submittedPosId) {
                  // Map with "pos_" prefix (as used in questionText like [[pos_77vjlh]])
                  fillBlankAnswers[`pos_${submittedPosId}`] = submitted.value;
                  // Also map without prefix as fallback
                  fillBlankAnswers[submittedPosId] = submitted.value;
                }
                
                // Fallback: Try to find matching option in questionContent by positionId
                if (!submittedPosId) {
                  const matchingOption = questionContent.find(opt => 
                    opt.id === submitted.id || opt.positionId === submitted.id
                  );
                  
                  if (matchingOption?.positionId) {
                    const posId = matchingOption.positionId;
                    fillBlankAnswers[`pos_${posId}`] = submitted.value;
                    fillBlankAnswers[posId] = submitted.value;
                  }
                }
              }
            });
            studentAnswersMap[q.questionId] = fillBlankAnswers;
          } else if (q.questionType === 'DROPDOWN') {
            const submittedItems = submittedContent || [];
            const dropdownAnswers = {};
            // For dropdown, need to match each submitted answer with correct positionId
            submittedItems.forEach((submitted) => {
              if (submitted && submitted.id) {
                // Use the positionId directly from submittedContent (most reliable)
                const submittedPosId = submitted.positionId;
                
                // Try multiple ways to identify the selected option
                // 1) Match by option id
                let matchedItem = questionContent.find(item => item.id === submitted.id);
                // 2) If not found, match by value text (submitted.value or submitted.id might be the text)
                if (!matchedItem) {
                  const submittedText = (submitted.value || submitted.id || '').trim();
                  if (submittedText) {
                    matchedItem = questionContent.find(item => (item.value || '').trim() === submittedText);
                  }
                }
                
                if (matchedItem && matchedItem.value) {
                  const selectedValue = matchedItem.value;
                  
                  // Map by positionId from submittedContent if available
                  if (submittedPosId) {
                    dropdownAnswers[`pos_${submittedPosId}`] = selectedValue;
                    dropdownAnswers[submittedPosId] = selectedValue;
                  }
                  
                  // Also map by positionId from matchedItem if different
                  if (matchedItem.positionId && matchedItem.positionId !== submittedPosId) {
                    dropdownAnswers[`pos_${matchedItem.positionId}`] = selectedValue;
                    dropdownAnswers[matchedItem.positionId] = selectedValue;
                  }
                  
                  // Map all options with same positionId
                  if (matchedItem.positionId) {
                    questionContent.forEach(opt => {
                      if (opt.positionId === matchedItem.positionId && opt.positionId) {
                        dropdownAnswers[`pos_${opt.positionId}`] = selectedValue;
                        dropdownAnswers[opt.positionId] = selectedValue;
                      }
                    });
                  }
                } else if (submittedPosId) {
                  // Fallback: if still not found, try to locate by positionId AND submitted text
                  const submittedText = (submitted.value || submitted.id || '').trim();
                  const candidates = questionContent.filter(item => item.positionId === submittedPosId);
                  let byText = null;
                  if (submittedText) {
                    byText = candidates.find(item => (item.value || '').trim() === submittedText);
                  }
                  const finalItem = byText || candidates[0] || null;
                  if (finalItem && finalItem.value) {
                    dropdownAnswers[`pos_${submittedPosId}`] = finalItem.value;
                    dropdownAnswers[submittedPosId] = finalItem.value;
                  }
                }
              }
            });
            studentAnswersMap[q.questionId] = dropdownAnswers;
          } else if (q.questionType === 'DRAG_AND_DROP') {
            const dragDropAnswers = {};
            submittedContent?.forEach(submitted => {
              if (submitted) {
                // Use positionId directly from submittedContent (most reliable)
                const submittedPosId = submitted.positionId;
                const submittedValue = submitted.value || submitted.id || '';
                
                if (submittedPosId && submittedValue) {
                  // Map with "pos_" prefix (as used in questionText like [[pos_ng4ud2]])
                  dragDropAnswers[`pos_${submittedPosId}`] = submittedValue;
                  // Also map without prefix as fallback
                  dragDropAnswers[submittedPosId] = submittedValue;
                }
                
                // Fallback: Try to find matching option in questionContent by value
                if (!submittedPosId && submittedValue) {
                  const matchedItem = questionContent.find(item => 
                    item.value === submittedValue || item.id === submittedValue
                  );
                  
                  if (matchedItem?.positionId) {
                    const posId = matchedItem.positionId;
                    const value = matchedItem.value || submittedValue;
                    dragDropAnswers[`pos_${posId}`] = value;
                    dragDropAnswers[posId] = value;
                  }
                }
              }
            });
            studentAnswersMap[q.questionId] = dragDropAnswers;
          } else if (q.questionType === 'REARRANGE') {
            // For rearrange, map positionId to item value (not id) in order
            // submittedContent has positionId like "0", "1", "2" (order index)
            // and id/value like "hôm nay", "ăn", "gì" (the actual text)
            const submittedOrder = submittedContent
              ?.filter(s => s.positionId != null && (s.value || s.id))
              .sort((a, b) => {
                // Sort by positionId (numeric order: "0", "1", "2" or "pos_xxx")
                const posA = String(a.positionId || '').replace(/^pos_/, '');
                const posB = String(b.positionId || '').replace(/^pos_/, '');
                // Try numeric comparison first
                const numA = Number(posA);
                const numB = Number(posB);
                if (!isNaN(numA) && !isNaN(numB)) {
                  return numA - numB;
                }
                // Fallback to string comparison
                return posA.localeCompare(posB);
              })
              .map(s => {
                // submittedContent.id or value is the actual text (e.g., "hôm nay", "ăn", "gì")
                // Find the option in questionContent that matches by value
                const submittedValue = s.value || s.id || '';
                const matchedItem = questionContent.find(item => 
                  item.value === submittedValue || item.id === submittedValue
                );
                // Return the value from matchedItem (preferred) or use submitted value
                return matchedItem?.value || submittedValue;
              })
              .filter(Boolean) || [];
            studentAnswersMap[q.questionId] = submittedOrder;
          } else if (q.questionType === 'REWRITE') {
            // For rewrite, store student's answer text
            const submittedText = (submittedContent?.[0]?.value || submittedContent?.[0]?.id || '').trim();
            if (submittedText) {
              studentAnswersMap[q.questionId] = submittedText;
            }
          } else if (q.questionType === 'WRITING') {
            // For writing, store student's essay per section id to render on the right
            const essayText = (submittedContent?.[0]?.value || '').trim();
            if (essayText) {
              const current = studentAnswersMap[section.id] || {};
              studentAnswersMap[section.id] = { ...current, text: essayText };
            }
          } else if (q.questionType === 'SPEAKING') {
            // For speaking, store student's audio recording per section id to render on the right
            const audioUrl = submittedContent?.[0]?.value || '';
            if (audioUrl) {
              const current = studentAnswersMap[section.id] || {};
              studentAnswersMap[section.id] = { ...current, audioUrl: audioUrl, audio: audioUrl };
            }
          }

          // Map options for multiple choice/select
          const options = questionContent.map((item) => ({
            key: item.id,
            text: item.value || '',
            isCorrect: item.correct || false,
          }));

          return {
            id: q.questionId,
            submissionQuestionId: q.submissionQuestionId,
            type: q.questionType,
            question: q.questionText || '',
            options: options.length > 0 ? options : undefined,
            content: questionContent.length > 0 ? { data: questionContent } : undefined,
            points: q.score || 0,
            receivedScore: q.receivedScore || 0,
            orderNumber: q.orderNumber || 0,
          };
        });

        // Detect Grammar & Vocabulary (GV) sections and push questions directly
        const allowedGVTypes = new Set([
          'MULTIPLE_CHOICE',
          'MULTIPLE_SELECT',
          'TRUE_OR_FALSE',
          'FILL_IN_THE_BLANK',
          'DROPDOWN',
          'DRAG_AND_DROP',
          'REARRANGE',
          'REWRITE',
        ]);

        const looksLikeGV = (() => {
          const sectionTitleLower = (section.sectionTitle || '').toLowerCase();
          const hasGrammarKeyword = /(grammar|vocabulary|gv|g&v)/i.test(sectionTitleLower);
          const noMedia = !section.sectionsUrl;
          const noReadingWritingSpeakingKeyword = !/(reading|writing|speaking|listen)/i.test(sectionTitleLower);
          const onlyGVTypes = questionResults.length > 0 && questionResults.every(qr => allowedGVTypes.has(qr?.questionType));
          const resourceNone = !section.resourceType || section.resourceType === 'NONE';
          
          // Check if content is short (likely not a real listening/reading transcript)
          const contentText = (section.sectionsContent || '').replace(/<[^>]*>/g, '').trim();
          const hasShortContent = !contentText || contentText.length < 100;
          const hasOnlyTrueFalse = questionResults.length > 0 && questionResults.every(qr => qr?.questionType === 'TRUE_OR_FALSE');
          
          // Priority 1: If has grammar/vocabulary keyword, always treat as GV (even if has audio/media)
          if (hasGrammarKeyword) {
            return true;
          }
          // Priority 2: If title says "listening" but only has TRUE_OR_FALSE and short/no content, likely mislabeled Grammar
          if (sectionTitleLower.includes('listen') && hasOnlyTrueFalse && hasShortContent && onlyGVTypes) {
            return true;
          }
          // Priority 3: If section has characteristics of Grammar (no media, no resource, only GV types, no reading/writing/speaking/listening keywords)
          // then it's definitely Grammar, regardless of content
          if (noMedia && resourceNone && onlyGVTypes && noReadingWritingSpeakingKeyword) {
            return true;
          }
          // Fallback: If no reading/writing/speaking/listening keywords, only GV types, and no media/resource
          return false;
        })();

        if (looksLikeGV) {
          // Treat as Grammar & Vocabulary: flatten into questions list
          questions.push(...mappedQuestions);
        } else {
          // Create section object with fields tailored by section type
          const baseSection = {
            id: section.id,
            title: section.sectionTitle || '',
            questions: mappedQuestions,
            points: mappedQuestions.reduce((sum, q) => sum + (q.points || 0), 0),
            orderNumber: section.orderNumber || 0,
            resourceType: section.resourceType || 'FILE',
          };

          const mappedSection = (() => {
            if (sectionType === 'reading') {
              return {
                ...baseSection,
                passage: section.sectionsContent || '',
              };
            }
            if (sectionType === 'listening') {
              return {
                ...baseSection,
                transcript: section.sectionsContent || '',
                audioUrl: section.sectionsUrl || '',
              };
            }
            if (sectionType === 'writing') {
              return {
                ...baseSection,
                prompt: section.sectionsContent || '',
              };
            }
            // speaking or others
            return {
              ...baseSection,
              transcript: section.sectionsContent || '',
              audioUrl: section.sectionsUrl || '',
            };
          })();

          // Add to appropriate array
          if (sectionType === 'reading') {
            readingSections.push(mappedSection);
          } else if (sectionType === 'listening') {
            listeningSections.push(mappedSection);
          } else if (sectionType === 'writing') {
            writingSections.push(mappedSection);
          } else if (sectionType === 'speaking') {
            speakingSections.push(mappedSection);
          } else {
            // Default to listening if type is unclear
            listeningSections.push(mappedSection);
          }
        }
      });

      // Set fakeData (keeping the name for compatibility)
      setFakeData({
        questions,
        readingSections,
        listeningSections,
        writingSections,
        speakingSections,
      });

      // Set student answers
      setStudentAnswers(studentAnswersMap);

      // Set submission data
      // Check if API provides accuracy, score, or other submission data directly
      const apiSubmissionData = apiData.submission || apiData.submissionResult || {};
      
      setSubmissionData({
        id: submissionChallengeId,
        student: {
          id: apiData.studentId || null,
          name: apiData.studentName || null,
          email: apiData.studentEmail || null,
          avatar: apiData.studentAvatar || null,
          class: apiData.studentClass || null,
          level: apiData.studentLevel || null,
        },
        challenge: {
          id: challengeId,
          title: apiData.challengeTitle || null,
          totalQuestions,
          totalPoints: apiSubmissionData.totalPoints || totalScore,
          maxPoints: apiSubmissionData.maxPoints || totalScore,
          totalWeight: apiSubmissionData.totalWeight || apiData.totalWeight || null,
          maxPossibleWeight: apiSubmissionData.maxPossibleWeight || apiData.maxPossibleWeight || null,
          timeLimit: apiData.timeLimit || apiSubmissionData.timeLimit || 0,
        },
        submission: {
          score: apiSubmissionData.score != null ? apiSubmissionData.score : receivedScore,
          totalPoints: apiSubmissionData.totalPoints != null ? apiSubmissionData.totalPoints : receivedScore,
          maxPoints: apiSubmissionData.maxPoints != null ? apiSubmissionData.maxPoints : totalScore,
          correctCount: apiSubmissionData.correctCount != null ? apiSubmissionData.correctCount : correctCount,
          incorrectCount: apiSubmissionData.incorrectCount != null ? apiSubmissionData.incorrectCount : incorrectCount,
          unansweredCount: apiSubmissionData.unansweredCount != null ? apiSubmissionData.unansweredCount : unansweredCount,
          accuracy: apiSubmissionData.accuracy != null ? apiSubmissionData.accuracy : (totalScore > 0 ? Math.round((receivedScore / totalScore) * 100) : 0),
          timeSpent: apiSubmissionData.timeSpent != null ? apiSubmissionData.timeSpent : (apiSubmissionData.timeUsed || 0),
          submittedAt: apiSubmissionData.submittedAt || apiSubmissionData.submittedDate || null,
          status: apiSubmissionData.status || 'completed',
        },
      });

        // Prefill teacher feedback from primary submission result if available
        if (typeof (apiData.teacherFeedback || apiSubmissionData.teacherFeedback) === 'string') {
          setTeacherFeedback(apiData.teacherFeedback || apiSubmissionData.teacherFeedback);
        }

        // Fetch grading summary for sidebar Performance (override fake/calculated numbers)
      try {
        const gradingRes = await dailyChallengeApi.getSubmissionGradingResult(submissionChallengeId);
        const gradingData = gradingRes?.data?.data || gradingRes?.data || null;
        if (gradingData) {
          // Map grading fields to local state
          const score = gradingData.finalScore ?? gradingData.totalScore;
          const maxPointsFromGrading = gradingData.maxPossibleWeight ?? gradingData.maxPossibleScore;
          const accuracyPct = gradingData.scorePercentage != null ? Math.round(gradingData.scorePercentage) : undefined;
          const correct = gradingData.correctAnswers;
          const incorrect = gradingData.wrongAnswers;
          const unanswered = (gradingData.skipped || 0) + (gradingData.empty || 0);

          setSubmissionData(prev => ({
            ...prev,
            challenge: {
              ...prev.challenge,
              totalQuestions: gradingData.totalQuestions ?? prev.challenge?.totalQuestions,
              maxPoints: maxPointsFromGrading ?? prev.challenge?.maxPoints,
              totalWeight: gradingData.totalWeight ?? prev.challenge?.totalWeight,
              maxPossibleWeight: gradingData.maxPossibleWeight ?? prev.challenge?.maxPossibleWeight,
            },
            submission: {
              ...prev.submission,
              score: score ?? prev.submission?.score,
              totalPoints: score ?? prev.submission?.totalPoints,
              maxPoints: maxPointsFromGrading ?? prev.submission?.maxPoints,
              correctCount: correct ?? prev.submission?.correctCount,
              incorrectCount: incorrect ?? prev.submission?.incorrectCount,
              unansweredCount: unanswered ?? prev.submission?.unansweredCount,
              accuracy: accuracyPct ?? prev.submission?.accuracy,
            },
          }));

          // Prefill teacher & AI feedback from grading service if provided
          if (typeof gradingData.teacherFeedback === 'string') {
            setTeacherFeedback(gradingData.teacherFeedback);
          }
        }
      } catch (e) {
        // Non-blocking: ignore if grading summary not available
        console.warn('GetSubmissionGradingResult failed:', e?.response?.data || e?.message);
      }

      // Fetch existing grading for writing/speaking sections to toggle Add/Edit buttons
      try {
        const subQIds = [];
        writingSections.forEach((sec) => {
          const subQId = (sec?.questions && sec.questions[0]?.submissionQuestionId) || null;
          if (subQId) subQIds.push(subQId);
        });
        speakingSections.forEach((sec) => {
          const subQId = (sec?.questions && sec.questions[0]?.submissionQuestionId) || null;
          if (subQId) subQIds.push(subQId);
        });
        if (subQIds.length > 0) {
          const results = await Promise.allSettled(
            subQIds.map((sid) => dailyChallengeApi.getSubmissionQuestionGrading(sid))
          );
          const map = {};
          results.forEach((r, idx) => {
            if (r.status === 'fulfilled') {
              const data = r.value?.data?.data || r.value?.data || null;
              if (data) {
                const subQId = subQIds[idx];
                // Only store grading if it has actual content (score > 0, feedback, or highlights)
                // This ensures that after Clear + Save, the button will show "Add" instead of "Edit"
                const hasScore = Number.isFinite(Number(data.receivedWeight)) && Number(data.receivedWeight) > 0;
                const hasFb = typeof data.feedback === 'string' && data.feedback.trim() !== '';
                const hasHighlights = Array.isArray(data.highlightComments) && data.highlightComments.length > 0;
                
                if (hasScore || hasFb || hasHighlights) {
                  map[subQId] = {
                    receivedWeight: data.receivedWeight,
                    questionWeight: data.questionWeight, // Add questionWeight from API
                    feedback: data.feedback,
                    highlightComments: data.highlightComments || [],
                    graderId: data.graderId,
                    graderName: data.graderName,
                    timestamp: data.timestamp,
                  };
                }
              }
            }
          });
          setGradingBySubmissionQuestionId(map);
        }
      } catch (err) {
        // ignore grading prefetch errors
      }

      // Fetch anti-cheat logs for this submission and map to UI structure
      try {
        const logsRes = await dailyChallengeApi.getSubmissionLogs(submissionChallengeId);
        const logsData = logsRes?.data?.data || logsRes?.data || {};
        const logs = Array.isArray(logsData.logs) ? logsData.logs : [];
        const eventCounts = logsData.eventCounts || {};

        const mappedEvents = logs.map((l) => ({
          event: l.event,
          timestamp: l.timestamp,
          questionId: l.questionId || null,
          oldValue: Array.isArray(l.oldValue) ? l.oldValue : (l.oldValue != null ? [l.oldValue] : []),
          newValue: Array.isArray(l.newValue) ? l.newValue : (l.newValue != null ? [l.newValue] : []),
          durationMs: typeof l.durationMs === 'number' ? l.durationMs : null,
          content: l.content || null,
        }));

        const visibleViolationCount = mappedEvents.filter(e => e.event !== 'ANSWER_CHANGE').length;

        setAntiCheatData({
          totalViolations: visibleViolationCount,
          tabBlurCount: (eventCounts.TAB_SWITCH || eventCounts.TAB_BLUR || 0),
          copyCount: (eventCounts.COPY_ATTEMPT || eventCounts.COPY || 0),
          pasteCount: (eventCounts.PASTE_ATTEMPT || eventCounts.PASTE || 0),
          totalTabBlurDuration: 0,
          events: mappedEvents,
        });
      } catch (e) {
        console.warn('Failed to load anti-cheat logs. Sidebar will hide logs summary.', e);
        setAntiCheatData({ totalViolations: 0, tabBlurCount: 0, copyCount: 0, pasteCount: 0, totalTabBlurDuration: 0, events: [] });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching submission detail:', error);
      spaceToast.error(error.response?.data?.message || 'Error loading submission detail');
      setLoading(false);
    }
  }, [submissionId, id]);

  useEffect(() => {
    fetchSubmissionDetail();
  }, [fetchSubmissionDetail]);

  // Enter/exit daily challenge menu mode
  useEffect(() => {
    // Build back path to submissions list and preserve class/challenge info via query params
    const params = new URLSearchParams(location.search || '');
    const classId = location.state?.classId || params.get('classId') || null;
    const className = location.state?.className || params.get('className') || null;
    const challengeName = location.state?.challengeName || params.get('challengeName') || null;
    const qs = new URLSearchParams();
    if (classId) qs.set('classId', classId);
    if (className) qs.set('className', className);
    if (challengeName) qs.set('challengeName', challengeName);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const backPath = `/teacher/daily-challenges/detail/${id}/submissions${suffix}`;
    // Priority: Use location.state if available (when navigating back from AIGenerateFeedback)
    // Otherwise preserve subtitle/className from dailyChallengeData
    let preservedSubtitle = dailyChallengeData?.subtitle || null;
    let preservedClassName = dailyChallengeData?.className || null;
    
    // If location.state has header info, use it to update context
    if (location?.state?.className && location?.state?.challengeName) {
      preservedSubtitle = `${location.state.className} / ${location.state.challengeName}`;
      preservedClassName = location.state.className;
    } else if (location?.state?.challengeName) {
      preservedSubtitle = location.state.challengeName;
    } else if (location?.state?.className) {
      preservedSubtitle = location.state.className;
      preservedClassName = location.state.className;
    }
    
    enterDailyChallengeMenu(0, preservedSubtitle, backPath, preservedClassName);
    
    return () => {
      // Do not exit here to preserve header info when navigating back to list; list page will re-enter and manage state
    };
  }, [enterDailyChallengeMenu, id, dailyChallengeData?.subtitle, dailyChallengeData?.className, location?.state?.className, location?.state?.challengeName, location?.state?.classId, location.search]);

  // Build question navigation list (must be before early return)
  const getQuestionNavigation = useCallback(() => {
    if (!fakeData) return [];
    const { questions, readingSections, listeningSections, writingSections, speakingSections } = fakeData;
    const navigation = [];
    let questionNumber = 1;

    // Grammar & Vocabulary questions
    if (questions.length > 0) {
      questions.forEach((q) => {
        navigation.push({ 
          id: `gv-${q.id}`, 
          type: 'question', 
          title: `Question ${questionNumber++}` 
        });
      });
    }

    // Reading sections
    if (readingSections.length > 0) {
      readingSections.forEach((s, idx) => {
        const count = s.questions?.length || 0;
        const start = questionNumber;
        const end = count > 0 ? start + count - 1 : start;
        navigation.push({ 
          id: `reading-${idx + 1}`, 
          type: 'section', 
          title: `Reading ${idx + 1}: Question ${start}-${end}` 
        });
        questionNumber = end + 1;
      });
    }

    // Listening sections
    if (listeningSections.length > 0) {
      listeningSections.forEach((s, idx) => {
        const count = s.questions?.length || 0;
        const start = questionNumber;
        const end = count > 0 ? start + count - 1 : start;
        navigation.push({ 
          id: `listening-${idx + 1}`, 
          type: 'section', 
          title: `Listening ${idx + 1}: Question ${start}-${end}` 
        });
        questionNumber = end + 1;
      });
    }

    // Writing sections
    if (writingSections.length > 0) {
      writingSections.forEach((s, idx) => {
        navigation.push({ 
          id: `writing-${idx + 1}`, 
          type: 'section', 
          title: `Writing ${idx + 1}` 
        });
      });
    }

    // Speaking sections
    if (speakingSections.length > 0) {
      speakingSections.forEach((s, idx) => {
        navigation.push({ 
          id: `speaking-${idx + 1}`, 
          type: 'section', 
          title: `Speaking ${idx + 1}` 
        });
      });
    }

    return navigation;
  }, [fakeData]);

  if (loading || !submissionData || !fakeData) {
    // Custom header for loading state
    const loadingHeader = (
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
              onClick={() => {
                // Check if this is a student or test_taker route by checking URL path
                const isStudentRoute = location.pathname.includes('/student/daily-challenges');
                const isTestTakerRoute = location.pathname.includes('/test-taker/daily-challenges');
                
                if (isStudentRoute || isTestTakerRoute) {
                  // For student/test_taker route, navigate back to daily challenge list
                  // Try to get classId from location state or construct from submission data
                  const classId = location.state?.classId || location.search?.match(/classId=([^&]+)/)?.[1];
                  const routePrefix = isTestTakerRoute ? '/test-taker' : '/student';
                  
                  if (classId) {
                    navigate(`${routePrefix}/classes/daily-challenges/${classId}`);
                  } else {
                    // Fallback: navigate to dashboard or daily challenges list
                    navigate(`${routePrefix}/dashboard`);
                  }
                } else if (dailyChallengeData?.backPath) {
                  navigate(dailyChallengeData.backPath);
                } else {
                  navigate(-1);
                }
              }}
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
                {t('dailyChallenge.dailyChallengeManagement')}
              </h2>
            </div>
          </div>
        </nav>
      </header>
    );

    return (
      <ThemedLayout customHeader={loadingHeader}>
        <LoadingWithEffect loading={loading} message="Loading submission details..." />
      </ThemedLayout>
    );
  }

  const { student, submission } = submissionData;
  const { questions, readingSections, listeningSections, writingSections, speakingSections } = fakeData;
  const hasWritingOrSpeaking = (Array.isArray(writingSections) && writingSections.length > 0) || (Array.isArray(speakingSections) && speakingSections.length > 0);

  // Handlers for score modal
  const handleOpenAddScore = () => {
    setScoreModal({
      visible: true,
      score: '',
      comment: '',
      isEdit: false,
    });
  };

  // Build grading payload and save
  const handleSaveGrading = async () => {
    if (!submissionData?.id && !submissionId) {
      spaceToast.error('Missing submission ID');
      return;
    }
    const subId = submissionId || submissionData?.id;
    try {
      setSavingGrading(true);
      // Only summary payload per new API
      const stripHtml = (html) => (html || '').replace(/<[^>]*>/g, '').trim();
      const payload = {
        totalScore: Number(submission?.score ?? 0),
        overallFeedback: stripHtml(teacherFeedback),
      };

      const res = await dailyChallengeApi.saveGradingSummary(subId, payload);
      // axiosClient returns response.data by default; support both shapes just in case
      const beMsg = res?.message || res?.msg || res?.data?.message || res?.data?.msg ;
      spaceToast.success(beMsg);
      // Reload data to update sidebar and all related data
      await fetchSubmissionDetail();
    } catch (err) {
      console.error('Save grading failed:', err);
      spaceToast.error(err?.response?.data?.message || 'Failed to save grading');
    } finally {
      setSavingGrading(false);
    }
  };
  
  const handleOpenEditScore = () => {
    setScoreModal({
      visible: true,
      score: submission?.score || '',
      comment: '',
      isEdit: true,
    });
  };
  
  const handleCloseScoreModal = () => {
    setScoreModal({
      visible: false,
      score: '',
      comment: '',
      isEdit: false,
    });
  };
  
  const handleSaveScore = () => {
    const scoreValue = parseFloat(scoreModal.score);
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 10) {
      spaceToast.error('Score must be between 0 and 10');
      return;
    }
    
    // Update submissionData with the new score
    setSubmissionData(prev => ({
      ...prev,
      submission: {
        ...prev.submission,
        score: scoreValue,
      }
    }));
    
    // No toast here; header Save will show BE message
    handleCloseScoreModal();
  };

  // Handle save teacher feedback
  const handleSaveTeacherFeedback = async () => {
    try {
      setSavingFeedback(true);
      // TODO: Call API to save teacher feedback
      // await dailyChallengeApi.saveTeacherFeedback(submissionId, teacherFeedback);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // No toast; header Save will show BE message
    } catch (error) {
      console.error('Error saving teacher feedback:', error);
      spaceToast.error(error.response?.data?.error || 'Failed to save teacher feedback');
    } finally {
      setSavingFeedback(false);
    }
  };

  // CKEditor: custom upload adapter (base64) like MultipleChoiceModal
  function CustomUploadAdapterPlugin(editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
      return {
        upload: () => {
          return loader.file.then(file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ default: reader.result });
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          }));
        },
        abort: () => {}
      };
    };
  }

  // Header Overall Feedback modal save
  const handleSaveOverallFeedback = async () => {
    const subId = submissionId || submissionData?.id;
    if (!subId) {
      spaceToast.error('Missing submission ID');
      return;
    }
    try {
      setSavingFeedback(true);
      const stripHtml = (html) => (html || '').replace(/<[^>]*>/g, '').trim();
      const payload = { overallFeedback: stripHtml(overallFeedbackDraft) };
      const res = await dailyChallengeApi.saveGradingSummary(subId, payload);
      const beMsg = res?.message || res?.msg || res?.data?.message || res?.data?.msg || 'Saved';
      // Update local view (sidebar)
      setTeacherFeedback(overallFeedbackDraft);
      setOverallFeedbackModalVisible(false);
      spaceToast.success(beMsg);
      // Reload data to update sidebar and all related data
      await fetchSubmissionDetail();
    } catch (err) {
      console.error('Save overall feedback failed:', err);
      spaceToast.error(err?.response?.data?.message || 'Failed to save feedback');
    } finally {
      setSavingFeedback(false);
    }
  };

  

  // Scroll to question function
  const scrollToQuestion = (questionId) => {
    const element = questionRefs.current[questionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Helper function to render section questions (used in Reading/Listening sections)
  const renderSectionQuestion = (q, qIndex, sectionType = 'reading') => {
    const questionText = q.questionText || q.question || '';
    const studentAnswer = studentAnswers?.[q.id];

    if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE' || q.type === 'MULTIPLE_SELECT') {
      const options = q.options || [];
      const isMulti = q.type === 'MULTIPLE_SELECT';
      const correctOption = options.find(opt => opt.isCorrect);
      const correctKey = q.type === 'TRUE_OR_FALSE' ? (correctOption?.text) : correctOption?.key;
      const correctKeys = isMulti ? options.filter(opt => opt.isCorrect).map(opt => opt.key) : [];
      
      return (
        <div key={q.id} style={{
          padding: '16px',
          background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`
        }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', position: 'relative' }}>
            Question {qIndex + 1}:
            <span style={{ position: 'absolute', right: 0, top: 0, fontSize: '16px', fontWeight: 600, opacity: 0.7 }}>
              {(q.receivedScore || 0)} / {(q.points || 0)} points
            </span>
          </div>
          <div className="question-text-content" style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: questionText }} />
          <div className="question-options" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            {(q.type === 'TRUE_OR_FALSE' ? ['True', 'False'] : options).map((opt, idx) => {
              let key, text;
              if (q.type === 'TRUE_OR_FALSE') {
                key = opt;
                text = opt;
              } else {
                key = opt.key || String.fromCharCode(65 + idx);
                text = opt.text || '';
              }
              
              const isCorrectAnswer = isMulti ? correctKeys.includes(key) : (key === correctKey || (q.type === 'TRUE_OR_FALSE' && opt === correctKey));
              const isSelected = isMulti ? (Array.isArray(studentAnswer) && studentAnswer.includes(key)) : (studentAnswer === key || (q.type === 'TRUE_OR_FALSE' && opt === studentAnswer));
              const isSelectedWrong = isSelected && !isCorrectAnswer;
              const isCorrectMissing = !isSelected && isCorrectAnswer && isMulti;
              const isUnanswered = isMulti ? (Array.isArray(studentAnswer) && studentAnswer.length === 0) : (!isSelected && studentAnswer == null);
              
              return (
                <div key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  background: (isUnanswered && !isMulti && isCorrectAnswer)
                    ? (theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)')
                    : isCorrectMissing
                    ? (theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)')
                    : (isCorrectAnswer
                      ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)')
                      : isSelectedWrong
                        ? (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)')
                        : (theme === 'sun' ? '#fff' : 'rgba(255,255,255,0.03)')),
                  border: `2px solid ${
                    (isUnanswered && !isMulti && isCorrectAnswer)
                      ? '#faad14'
                      : isCorrectMissing
                      ? '#faad14'
                      : (isCorrectAnswer
                        ? 'rgb(82, 196, 26)'
                        : (isSelectedWrong ? 'rgb(255, 77, 79)' : (theme === 'sun' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)')))
                  }`,
                  borderRadius: '12px',
                  cursor: 'default',
                  minHeight: '50px',
                  boxSizing: 'border-box',
                }}>
                  <input type={isMulti ? 'checkbox' : 'radio'} checked={isSelected || isCorrectMissing} disabled style={{ width: '18px', height: '18px', accentColor: isCorrectMissing ? '#faad14' : (isCorrectAnswer ? '#52c41a' : (isSelectedWrong ? '#ff4d4f' : (theme === 'sun' ? '#1890ff' : '#8B5CF6'))), cursor: 'not-allowed', opacity: 1 }} />
                  <span style={{ fontWeight: 600, color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', fontSize: '16px' }}>
                    {q.type === 'TRUE_OR_FALSE' ? (opt === 'True' ? 'A' : 'B') : key}.
                  </span>
                  <span className="option-text" style={{ flex: 1, lineHeight: '1.6', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', fontWeight: '350' }} dangerouslySetInnerHTML={{ __html: q.type === 'TRUE_OR_FALSE' ? opt : text }} />
                  {isSelectedWrong && <CloseCircleOutlined style={{ fontSize: '22px', color: '#ff4d4f', marginLeft: 'auto', fontWeight: 'bold' }} />}
                  {(isUnanswered && !isMulti && isCorrectAnswer) && !isSelectedWrong && (
                    <CheckCircleOutlined style={{ fontSize: '20px', color: '#faad14', marginLeft: 'auto' }} />
                  )}
                  {(!isUnanswered || isMulti) && (isCorrectMissing || (isCorrectAnswer && !isCorrectMissing)) && !isSelectedWrong && (
                    <CheckCircleOutlined style={{ fontSize: '20px', color: isCorrectMissing ? '#faad14' : '#52c41a', marginLeft: 'auto' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // FILL_IN_THE_BLANK for sections
    if (q.type === 'FILL_IN_THE_BLANK') {
      const contentData = q.content?.data || [];
      const studentAnswerObj = studentAnswers?.[q.id] || {};
      
      const renderFillBlankForSection = () => {
        const parts = [];
        const regex = /(\[\[pos_(.*?)\]\])/g;
        let lastIndex = 0;
        let match;
        let inputIndex = 0;
        
        while ((match = regex.exec(questionText)) !== null) {
          if (match.index > lastIndex) {
            const textContent = questionText.slice(lastIndex, match.index);
            parts.push(
              <span key={`text_${inputIndex}`} className="question-text-content" dangerouslySetInnerHTML={{ __html: textContent }} />
            );
          }
          inputIndex += 1;
          const positionId = `pos_${match[2]}`;
          const rawPositionId = match[2]; // Without "pos_" prefix
          
          // Find correct item - check both with and without "pos_" prefix
          let correctItem = contentData.find(item => 
            (item.positionId === positionId || item.positionId === rawPositionId) && item.correct
          );
          // Fallback: if no correct item found, try to find any item with matching positionId
          if (!correctItem) {
            correctItem = contentData.find(item => 
              item.positionId === positionId || item.positionId === rawPositionId
            );
          }
          const correctAnswer = correctItem?.value || '';
          
          let studentAnswer = '';
          if (typeof studentAnswerObj === 'object' && studentAnswerObj !== null) {
            // Check multiple possible keys
            studentAnswer = studentAnswerObj[positionId] || 
                          studentAnswerObj[rawPositionId] || 
                          studentAnswerObj[match[2]] || 
                          '';
          } else if (typeof studentAnswerObj === 'string') {
            studentAnswer = studentAnswerObj;
          }
          const isCorrect = correctAnswer && studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
          const isUnanswered = !studentAnswer || studentAnswer.trim().length === 0;
          const displayValue = isUnanswered ? (correctAnswer || '') : studentAnswer;
          const bgColor = isCorrect
            ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
            : isUnanswered
              ? (theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)')
              : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)');
          const borderColor = isCorrect ? 'rgb(82, 196, 26)' : (isUnanswered ? '#faad14' : 'rgb(255, 77, 79)');
          const textColor = isCorrect ? (theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)') : (isUnanswered ? '#faad14' : (theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'));
          const fontWeight = isUnanswered ? 600 : 400;
          
          parts.push(
            <input key={`fill_blank_input_${inputIndex}`} type="text" value={displayValue} readOnly disabled style={{ display: 'inline-block', minWidth: '120px', maxWidth: '200px', minHeight: '32px', padding: '4px 12px', margin: '0 8px', background: bgColor, border: `2px solid ${borderColor}`, borderRadius: '8px', cursor: 'not-allowed', outline: 'none', lineHeight: '1.4', fontSize: '14px', boxSizing: 'border-box', textAlign: 'center', color: textColor, fontWeight, verticalAlign: 'middle' }} />
          );
          
          // Show correct answer only when answered wrong (not for unanswered since shown inside input)
          if (!isCorrect && correctAnswer && !(isUnanswered)) {
            const answerColor = '#52c41a';
            parts.push(
              <span key={`answer_${inputIndex}`} style={{ fontSize: '15px', color: answerColor, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px', marginRight: '8px', display: 'inline-block' }}>
                {correctAnswer}
              </span>
            );
          }
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < questionText.length) {
          parts.push(
            <span key={`text_final`} className="question-text-content" dangerouslySetInnerHTML={{ __html: questionText.slice(lastIndex) }} />
          );
        }
        return parts;
      };

      return (
        <div key={q.id} style={{ padding: '16px', background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}` }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', position: 'relative' }}>
            Question {qIndex + 1}:
            <span style={{ position: 'absolute', right: 0, top: 0, fontSize: '16px', fontWeight: 600, opacity: 0.7 }}>
              {(q.receivedScore || 0)} / {(q.points || 0)} points
            </span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 350, lineHeight: '1.8', color: '#000000' }}>{renderFillBlankForSection()}</div>
        </div>
      );
    }

    // DROPDOWN for sections
    if (q.type === 'DROPDOWN') {
      const contentData = q.content?.data || [];
      const studentAnswerObj = studentAnswers?.[q.id] || {};
      
      const renderDropdownForSection = () => {
        const parts = [];
        const regex = /\[\[pos_(.*?)\]\]/g;
        let last = 0;
        let match;
        let idx = 0;
        
        while ((match = regex.exec(questionText)) !== null) {
          if (match.index > last) {
            parts.push(<span key={`text_${idx}`} className="question-text-content" dangerouslySetInnerHTML={{ __html: questionText.slice(last, match.index) }} />);
          }
          const positionId = `pos_${match[1]}`;
          const rawPositionId = match[1]; // Without "pos_" prefix
          
          const optionsForPosition = contentData.filter(opt => {
            const optPosId = String(opt.positionId || '');
            return optPosId === positionId || optPosId === rawPositionId;
          }) || [];
          
          const correctItem = optionsForPosition.find(it => it.correct) || 
                             (optionsForPosition.length > 0 ? optionsForPosition[0] : null);
          const correctAnswer = correctItem?.value || '';
          
          // Get student answer - check multiple possible keys
          const studentAnswer = studentAnswerObj[positionId] || 
                              studentAnswerObj[rawPositionId] || 
                              studentAnswerObj[match[1]] || 
                              '';
          
          const isCorrect = correctAnswer && studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
          const isUnanswered = !studentAnswer || studentAnswer.trim().length === 0;
          const displayedValue = isUnanswered ? correctAnswer : studentAnswer;
          const optionValues = optionsForPosition.map(it => it.value).filter(Boolean);
          const ddBg = isCorrect
            ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
            : isUnanswered
              ? (theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)')
              : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)');
          const ddBorder = isCorrect ? 'rgb(82, 196, 26)' : (isUnanswered ? '#faad14' : 'rgb(255, 77, 79)');
          const ddColor = isUnanswered ? '#faad14' : (isCorrect ? '#52c41a' : '#ff4d4f');
          
          parts.push(
            <select key={`dd_${q.id}_${idx++}`} value={displayedValue || ''} disabled style={{ display: 'inline-block', minWidth: '120px', height: '32px', padding: '4px 12px', margin: '0 8px', background: ddBg, border: `2px solid ${ddBorder}`, borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: ddColor, cursor: 'not-allowed', outline: 'none', verticalAlign: 'middle', textAlign: 'center', textAlignLast: 'center' }}>
              <option value="" disabled hidden style={{ textAlign: 'center' }}>Select</option>
              {optionValues.map((opt, optIdx) => (
                <option key={optIdx} value={opt}>{opt}</option>
              ))}
            </select>
          );
          
          // Only show side correct answer when answered wrong. For unanswered, we put it inside the select.
          if (!isCorrect && correctAnswer && !isUnanswered) {
            parts.push(
              <span key={`answer_${idx++}`} style={{ fontSize: '15px', color: '#52c41a', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px', marginRight: '8px', display: 'inline-block' }}>
                {correctAnswer}
              </span>
            );
          }
          last = match.index + match[0].length;
        }
        if (last < questionText.length) {
          parts.push(<span key={`text_final_${idx}`} className="question-text-content" dangerouslySetInnerHTML={{ __html: questionText.slice(last) }} />);
        }
        return parts;
      };

      return (
        <div key={q.id} style={{ padding: '16px', background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}` }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', position: 'relative' }}>
            Question {qIndex + 1}:
            <span style={{ position: 'absolute', right: 0, top: 0, fontSize: '16px', fontWeight: 600, opacity: 0.7 }}>
              {(q.receivedScore || 0)} / {(q.points || 0)} points
            </span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 350, lineHeight: '1.8', color: '#000000' }}>{renderDropdownForSection()}</div>
        </div>
      );
    }

    // DRAG_AND_DROP for sections
    if (q.type === 'DRAG_AND_DROP') {
      const contentData = q.content?.data || [];
      const studentAnswerObj = studentAnswers?.[q.id] || {};
      const text = questionText;
      const parts = [];
      const regex = /\[\[pos_(.*?)\]\]/g;
      let last = 0;
      let match;
      let idx = 0;
      
      while ((match = regex.exec(text)) !== null) {
        if (match.index > last) parts.push({ type: 'text', content: text.slice(last, match.index) });
        const posId = match[1];
        parts.push({ type: 'position', positionId: `pos_${posId}`, index: idx++ });
        last = match.index + match[0].length;
      }
      if (last < text.length) parts.push({ type: 'text', content: text.slice(last) });

      return (
        <div key={q.id} style={{ padding: '16px', background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}` }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', position: 'relative' }}>
            Question {qIndex + 1}:
            <span style={{ position: 'absolute', right: 0, top: 0, fontSize: '16px', fontWeight: 600, opacity: 0.7 }}>
              {(q.receivedScore || 0)} / {(q.points || 0)} points
            </span>
          </div>
          <div style={{ display: 'flex', gap: '24px', minHeight: '300px' }}>
            <div style={{ flex: '1', padding: '20px', background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}` }}>
              <div style={{ fontSize: '15px', fontWeight: 350, lineHeight: '1.8', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                {parts.map((part, pIdx) => {
                  if (part.type === 'text') {
                    return <span key={pIdx} dangerouslySetInnerHTML={{ __html: part.content || '' }} />;
                  }
                  
                  // Extract raw positionId from part.positionId (e.g., "pos_dqn1x8" -> "dqn1x8")
                  const rawPositionId = part.positionId.replace(/^pos_/, '');
                  
                  // Get student answer - check multiple possible keys
                  const studentAnswer = studentAnswerObj[part.positionId] || 
                                      studentAnswerObj[rawPositionId] || 
                                      '';
                  
                  // Find correct item - check both with and without "pos_" prefix
                  let correctItem = contentData.find(item => {
                    const itemPosId = String(item.positionId || '');
                    return (itemPosId === part.positionId || itemPosId === rawPositionId) && item.correct;
                  });
                  
                  // Fallback: if no correct item found, try to find any item with matching positionId
                  if (!correctItem) {
                    correctItem = contentData.find(item => {
                      const itemPosId = String(item.positionId || '');
                      return itemPosId === part.positionId || itemPosId === rawPositionId;
                    });
                  }
                  
                  const correctAnswer = correctItem?.value || '';
                  const isCorrect = correctAnswer && studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
                  
                  return (
                    <React.Fragment key={pIdx}>
                      {studentAnswer ? (
                        <>
                          <div style={{ minWidth: '120px', minHeight: '32px', maxWidth: '200px', margin: '0 8px', background: isCorrect ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)') : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'), border: `2px solid ${isCorrect ? 'rgb(82, 196, 26)' : 'rgb(255, 77, 79)'}`, borderRadius: '8px', display: 'inline-block', padding: '4px 12px', fontSize: '15px', fontWeight: '350', color: isCorrect ? '#52c41a' : '#ff4d4f', cursor: 'not-allowed', verticalAlign: 'middle', lineHeight: '1.4', boxSizing: 'border-box', textAlign: 'center', wordBreak: 'break-word', wordWrap: 'break-word', overflow: 'hidden', whiteSpace: 'normal' }} dangerouslySetInnerHTML={{ __html: studentAnswer || '' }} />
                          {/* Show correct answer if wrong (same as Fill in the Blank) */}
                          {!isCorrect && correctAnswer && (
                            <span style={{ fontSize: '15px', color: '#52c41a', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px', marginRight: '8px', display: 'inline-block' }}>
                              {correctAnswer}
                            </span>
                          )}
                        </>
                      ) : (
                        <div style={{ minWidth: '120px', minHeight: '32px', maxWidth: '200px', margin: '0 8px', background: (theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)'), border: `2px solid #faad14`, borderRadius: '8px', display: 'inline-block', padding: '4px 12px', fontSize: '15px', fontWeight: '600', color: '#faad14', cursor: 'not-allowed', verticalAlign: 'middle', lineHeight: '1.4', boxSizing: 'border-box', textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: correctAnswer || '' }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            <div style={{ flex: '1', padding: '20px', background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}` }}>
              <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '16px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>Available words:</Typography.Text>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
                {contentData.map((item, idx) => {
                  const itemValue = item?.value || '';
                  const isCorrectWord = item?.correct === true;
                  return (
                    <div key={idx} style={{ padding: '12px 20px', background: isCorrectWord ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)') : (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)'), border: `2px solid ${isCorrectWord ? '#52c41a' : '#ff4d4f'}`, borderRadius: '12px', fontSize: '16px', fontWeight: '600', color: isCorrectWord ? '#52c41a' : '#ff4d4f', cursor: 'default', userSelect: 'none', minWidth: '80px', textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: itemValue }} />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // REARRANGE for sections
    if (q.type === 'REARRANGE') {
      const contentData = q.content?.data || [];
      const studentAnswer = studentAnswers?.[q.id] || [];
      
      // Get correct order by parsing questionText to extract positionIds in order
      // questionText format: "[[pos_u64lgh]] [[pos_22ylfg]] [[pos_mchmz2]]"
      const correctOrder = (() => {
        const positionIdsInOrder = [];
        const regex = /\[\[pos_(.*?)\]\]/g;
        let match;
        while ((match = regex.exec(questionText)) !== null) {
          positionIdsInOrder.push(match[1]); // Extract positionId without "pos_" prefix
        }
        
        // Map positionIds to values from contentData
        return positionIdsInOrder.map(posId => {
          // Try to find item with positionId matching pos_xxx or just xxx
          const item = contentData.find(item => {
            const itemPosId = (item.positionId || '').replace(/^pos_/, '');
            return itemPosId === posId;
          });
          return item?.value || '';
        }).filter(Boolean);
      })();
      
      // Student answer should be an array of values (not ids) from mapping
      const studentOrder = Array.isArray(studentAnswer) 
        ? studentAnswer 
        : (typeof studentAnswer === 'object' && studentAnswer !== null 
            ? Object.keys(studentAnswer)
                .sort((a, b) => {
                  const posA = String(a).replace(/^pos_/, '');
                  const posB = String(b).replace(/^pos_/, '');
                  return posA.localeCompare(posB);
                })
                .map(key => studentAnswer[key])
                .filter(Boolean) 
            : []);
      
      const isCorrect = studentOrder.length === correctOrder.length && 
        studentOrder.every((word, idx) => word.trim().toLowerCase() === correctOrder[idx].trim().toLowerCase());
      const displayText = ((questionText).replace(/\[\[pos_.*?\]\]/g, '')).trim();

      return (
        <div key={q.id} style={{ padding: '16px', background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}` }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', position: 'relative' }}>
            Question {qIndex + 1}:
            <span style={{ position: 'absolute', right: 0, top: 0, fontSize: '16px', fontWeight: 600, opacity: 0.7 }}>
              {(q.receivedScore || 0)} / {(q.points || 0)} points
            </span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 350, marginBottom: '16px', lineHeight: '1.8', color: '#000000' }}>
            <div className="question-text-content" dangerouslySetInnerHTML={{ __html: displayText || 'Rearrange the words to form a correct sentence:' }} />
          </div>
          <div style={{ marginBottom: '24px', padding: '20px', background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}` }}>
            <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '16px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>Your answer:</Typography.Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {studentOrder.length > 0 ? studentOrder.map((word, index) => (
                <div key={index} style={{ minWidth: '100px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${isCorrect ? '#52c41a' : '#ff4d4f'}`, borderRadius: '8px', background: isCorrect ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)') : (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)'), cursor: 'not-allowed' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: isCorrect ? '#52c41a' : '#ff4d4f', textAlign: 'center', padding: '8px 12px' }}>{word}</span>
                </div>
              )) : (
                correctOrder.map((word, index) => (
                  <div key={index} style={{ minWidth: '100px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #faad14', borderRadius: '8px', background: theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)', cursor: 'not-allowed' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#faad14', textAlign: 'center', padding: '8px 12px' }}>{word}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          {!isCorrect && studentOrder.length > 0 && (
            <div style={{ marginBottom: '24px', padding: '20px', background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}` }}>
              <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '16px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>Correct order:</Typography.Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {correctOrder.map((word, index) => (
                  <div key={index} style={{ minWidth: '100px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #52c41a', borderRadius: '8px', background: theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)', cursor: 'default' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#52c41a', textAlign: 'center', padding: '8px 12px' }}>{word}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Default placeholder for unknown types in sections
    return (
      <div key={q.id} style={{
        padding: '16px',
        background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`
      }}>
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
          Question {qIndex + 1}:
        </div>
        <div className="question-text-content" style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: questionText }} />
      </div>
    );
  };

  // Helper: extract duration marker from content (e.g., [[dur_3]] -> { minutes: 3, found: true })
  const extractDurationMarker = (html) => {
    if (!html || typeof html !== 'string') return { found: false, minutes: null, cleanedContent: html };
    const durPattern = /\[\[dur_(\d+)\]\]/g;
    let match = durPattern.exec(html);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const cleanedContent = html.replace(durPattern, '').trim();
      return { found: true, minutes, cleanedContent };
    }
    return { found: false, minutes: null, cleanedContent: html };
  };

  // Render Reading Section
  const renderReadingSection = (section, index) => {
    const sectionTotals = (() => {
      const received = (section.questions || []).reduce((sum, q) => sum + (q.receivedScore || 0), 0);
      const total = (section.questions || []).reduce((sum, q) => sum + (q.points || 0), 0);
      return { received, total };
    })();
    return (
      <div key={section.id || index} className={`question-item ${theme}-question-item`} style={{ marginBottom: '24px', borderRadius: '16px', padding: '24px', border: '2px solid', borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)' }}>
        <div className="question-header" style={{ paddingBottom: '14px', marginBottom: '16px', borderBottom: '2px solid', borderBottomColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Text strong style={{ fontSize: '20px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
              {index + 1}. Reading Section
            </Typography.Text>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: theme === 'sun' ? '#1890ff' : '#8B5CF6' }}>
            {sectionTotals.received} / {sectionTotals.total} points
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', minHeight: '500px' }}>
          <div className="reading-passage-scrollbar" style={{ flex: '1', padding: '20px', background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, overflowY: 'auto', maxHeight: '600px', scrollbarWidth: 'thin', scrollbarColor: theme === 'sun' ? '#1890ff rgba(24, 144, 255, 0.2)' : '#8B5CF6 rgba(138, 122, 255, 0.2)' }}>
            <div className="passage-text-content" style={{ fontSize: '15px', lineHeight: '1.8', color: theme === 'sun' ? '#333' : '#1F2937', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: section.passage || '' }} />
          </div>
          <div style={{ flex: '1', background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, overflowY: 'auto', maxHeight: '600px' }}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {section.questions?.map((q, qIndex) => renderSectionQuestion(q, qIndex, 'reading'))}
              </div>
            </div>
          </div>
        </div>
        <style>{`
          .reading-passage-scrollbar::-webkit-scrollbar { width: 8px; }
          .reading-passage-scrollbar::-webkit-scrollbar-track { background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'}; border-radius: 4px; }
          .reading-passage-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}; border-radius: 4px; border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'}; }
          .reading-passage-scrollbar::-webkit-scrollbar-thumb:hover { background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'}; }
        `}</style>
      </div>
    );
  };

  // Render Listening Section
  const renderListeningSection = (section, index) => {
    const sectionTotals = (() => {
      const received = (section.questions || []).reduce((sum, q) => sum + (q.receivedScore || 0), 0);
      const total = (section.questions || []).reduce((sum, q) => sum + (q.points || 0), 0);
      return { received, total };
    })();
    return (
      <div key={section.id || index} className={`question-item ${theme}-question-item`} style={{ marginBottom: '24px', borderRadius: '16px', padding: '24px', border: '2px solid', borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)' }}>
        <div className="question-header" style={{ paddingBottom: '14px', marginBottom: '16px', borderBottom: '2px solid', borderBottomColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Text strong style={{ fontSize: '20px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
              {index + 1}. Listening Section
            </Typography.Text>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: theme === 'sun' ? '#1890ff' : '#8B5CF6' }}>
            {sectionTotals.received} / {sectionTotals.total} points
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', minHeight: '500px' }}>
          <div className="listening-passage-scrollbar" style={{ flex: '1', padding: '20px', background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, overflowY: 'auto', maxHeight: '600px', scrollbarWidth: 'thin', scrollbarColor: theme === 'sun' ? '#1890ff rgba(24, 144, 255, 0.2)' : '#8B5CF6 rgba(138, 122, 255, 0.2)' }}>
            <div style={{ background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, boxShadow: theme === 'sun' ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.2)' }}>
              <Typography.Text style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', display: 'block' }}>Audio Transcript</Typography.Text>
              <audio controls style={{ width: '100%', marginBottom: '16px' }}>
                <source src={section.audioUrl} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
              <div className="passage-text-content" style={{ fontSize: '15px', lineHeight: '1.8', color: theme === 'sun' ? '#333' : '#1F2937', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: section.transcript || '' }} />
            </div>
          </div>
          <div style={{ flex: '1', background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, overflowY: 'auto', maxHeight: '600px' }}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {section.questions?.map((q, qIndex) => renderSectionQuestion(q, qIndex, 'listening'))}
              </div>
            </div>
          </div>
        </div>
        <style>{`
          .listening-passage-scrollbar::-webkit-scrollbar { width: 8px; }
          .listening-passage-scrollbar::-webkit-scrollbar-track { background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'}; border-radius: 4px; }
          .listening-passage-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}; border-radius: 4px; border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'}; }
          .listening-passage-scrollbar::-webkit-scrollbar-thumb:hover { background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'}; }
        `}</style>
      </div>
    );
  };

  // Render Writing Section
  const renderWritingSection = (section, index) => {
    const sectionTotals = (() => {
      const received = (section.questions || []).reduce((sum, q) => sum + (q.receivedScore || 0), 0);
      const total = (section.questions || []).reduce((sum, q) => sum + (q.points || 0), 0);
      return { received, total };
    })();
    const qIdForScore = (section.questions && (section.questions[0]?.submissionQuestionId || section.questions[0]?.id)) || section.id;
    const studentAnswer = studentAnswers?.[section.id] || {};
    const studentEssayText = studentAnswer?.text || studentAnswer?.essay || '';
    const studentFiles = Array.isArray(studentAnswer?.files) ? studentAnswer.files : [];

    return (
      <div key={section.id || index} className={`question-item ${theme}-question-item`} style={{ marginBottom: '24px', borderRadius: '16px', padding: '24px', border: '2px solid', borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)' }}>
        <div className="question-header" style={{ paddingBottom: '14px', marginBottom: '16px', borderBottom: '2px solid', borderBottomColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Text strong style={{ fontSize: '16px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
              {index + 1}. Writing Section
            </Typography.Text>
            <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
              ({sectionTotals.received} / {sectionTotals.total} points)
            </Typography.Text>
          </div>
          {!isStudent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {!hasExistingGradingForSection(section.id) ? (
                <>
                  <Button
                    size="small"
                    onClick={() => handleOpenAddFeedback(section.id, 'section')}
                    style={{ fontSize: '13px', height: '28px', padding: '0 12px' }}
                  >
                    Add Score/Feedback
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="small"
                    onClick={() => handleOpenEditFeedback(section.id, 'section')}
                    style={{ fontSize: '13px', height: '28px', padding: '0 12px' }}
                  >
                    Edit Score/Feedback
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '24px', minHeight: '600px', position: 'relative' }}>
          <div className="writing-prompt-scrollbar" style={{ flex: '1', padding: '20px', background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, overflowY: 'auto', maxHeight: '600px', scrollbarWidth: 'thin', scrollbarColor: theme === 'sun' ? '#1890ff rgba(24, 144, 255, 0.2)' : '#8B5CF6 rgba(138, 122, 255, 0.2)' }}>
            <div className="passage-text-content" style={{ fontSize: '15px', lineHeight: '1.8', color: theme === 'sun' ? '#333' : '#1F2937', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: section.prompt || '' }} />
          </div>
          <div style={{ flex: '1', background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, overflowY: 'auto', maxHeight: '600px', position: 'relative' }}>
            <div style={{ padding: '20px' }}>
              {studentEssayText ? (
                <div>
                  <Typography.Text style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'block' }}>Student's Essay:</Typography.Text>
                  <div 
                    id={`essay-container-${section.id}`}
                    onMouseUp={(e) => {
                      if (!isStudent && index === 0) {
                        handleTextSelection(section.id, e.currentTarget);
                      }
                    }}
                    onMouseDown={(e) => {
                      if (!isStudent && index === 0) {
                        // Clear selection when clicking
                        setTimeout(() => {
                          const selection = window.getSelection();
                          if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            if (range.collapsed) {
                              setTextSelection({ visible: false, sectionId: null, startIndex: null, endIndex: null, position: { x: 0, y: 0 } });
                            }
                          }
                        }, 0);
                      }
                    }}
                    style={{ 
                      padding: '16px', 
                      background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.05)', 
                      borderRadius: '8px', 
                      border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, 
                      whiteSpace: 'pre-wrap', 
                      wordWrap: 'break-word', 
                      lineHeight: '1.8', 
                      fontSize: '14px', 
                      color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                      userSelect: (!isStudent && index === 0) ? 'text' : 'none',
                      cursor: (!isStudent && index === 0) ? 'text' : 'default',
                      position: 'relative',
                      minHeight: '200px'
                    }}
                  >
                    {index === 0 && writingSectionFeedbacks[section.id]?.length > 0 ? (
                      renderEssayWithHighlights(studentEssayText, section.id)
                    ) : (
                      studentEssayText
                    )}
                  </div>
                  {/* Floating Toolbar for text selection */}
                  {!isStudent && index === 0 && textSelection.visible && textSelection.sectionId === section.id && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${textSelection.position.x}px`,
                        top: `${textSelection.position.y}px`,
                        transform: 'translateY(-50%)', // Center vertically with the selected line
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
                      >
                        <CommentOutlined style={{ 
                          fontSize: '16px', 
                          color: theme === 'sun' ? '#1890ff' : '#8B5CF6' 
                        }} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding: '16px',
                    background: theme === 'sun' ? '#fffbe6' : 'rgba(255, 255, 255, 0.06)',
                    border: `1px dashed ${theme === 'sun' ? '#faad14' : 'rgba(250, 173, 20, 0.6)'}`,
                    borderRadius: '8px',
                    color: theme === 'sun' ? '#ad6800' : '#eab308',
                    fontSize: '14px'
                  }}
                >
                  The student left this writing blank.
                </div>
              )}
              {studentFiles.length > 0 && (
                <div style={{ marginTop: studentEssayText ? '20px' : '0' }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    color: theme === 'sun' ? '#333' : '#1F2937'
                  }}>
                    {studentEssayText ? 'Uploaded Images:' : 'Student Uploaded Images:'}
                  </div>
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    marginTop: '12px'
                  }}>
                    {studentFiles.map((file, fileIdx) => (
                      <div
                        key={file.id || file.name || fileIdx}
                        style={{
                          position: 'relative',
                          background: theme === 'sun' 
                            ? 'linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(64, 169, 255, 0.05) 100%)'
                            : 'linear-gradient(135deg, rgba(138, 122, 255, 0.12) 0%, rgba(167, 139, 250, 0.08) 100%)',
                          border: `1px solid ${theme === 'sun' 
                            ? 'rgba(24, 144, 255, 0.2)' 
                            : 'rgba(138, 122, 255, 0.25)'}`,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                          width: '100%'
                        }}
                      >
                        {/* Show image if it's an image file */}
                        {(file.type?.startsWith('image/') || file.url || file.imageUrl) && (
                          <div style={{ 
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            background: theme === 'sun' ? '#fafafa' : 'rgba(0, 0, 0, 0.2)',
                            padding: '20px',
                            minHeight: '400px'
                          }}>
                            <img
                              src={file.url || file.imageUrl || (file instanceof File ? URL.createObjectURL(file) : '')}
                              alt={file.name || 'Uploaded image'}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '600px',
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'contain',
                                display: 'block',
                                cursor: 'pointer',
                                borderRadius: '4px'
                              }}
                              onError={(e) => {
                                // Hide image if failed to load
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div style={{
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: `1px solid ${theme === 'sun' 
                            ? 'rgba(24, 144, 255, 0.15)' 
                            : 'rgba(138, 122, 255, 0.2)'}`
                        }}>
                          <span style={{ 
                            color: theme === 'sun' ? '#333' : '#1F2937',
                            fontSize: '14px',
                            fontWeight: '500',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}>
                            {file.name || 'Image'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <style>{`
          .writing-prompt-scrollbar::-webkit-scrollbar { width: 8px; }
          .writing-prompt-scrollbar::-webkit-scrollbar-track { background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'}; border-radius: 4px; }
          .writing-prompt-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}; border-radius: 4px; border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'}; }
          .writing-prompt-scrollbar::-webkit-scrollbar-thumb:hover { background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'}; }
        `}</style>
      </div>
    );
  };

  // Render Speaking Section
  const renderSpeakingSection = (section, index) => {
    const sectionTotals = (() => {
      const received = (section.questions || []).reduce((sum, q) => sum + (q.receivedScore || 0), 0);
      const total = (section.questions || []).reduce((sum, q) => sum + (q.points || 0), 0);
      return { received, total };
    })();
    const qIdForScore = (section.questions && (section.questions[0]?.submissionQuestionId || section.questions[0]?.id)) || section.id;
    const studentAnswer = studentAnswers?.[section.id] || {};
    const audioUrl = studentAnswer?.audioUrl || studentAnswer?.audio || null;
    const sectionId = section.id || `speaking-${index}`;
    const audioState = audioStates[sectionId] || { isPlaying: false, currentTime: 0, duration: 0, volume: 1 };
    
    // Get or create audio ref for this section
    if (!audioRefs.current[sectionId]) {
      audioRefs.current[sectionId] = React.createRef();
    }
    const audioRef = audioRefs.current[sectionId];

    // Initialize audio state if not exists
    if (!audioStates[sectionId] && section.audioUrl) {
      setTimeout(() => {
        setAudioStates(prev => ({
          ...prev,
          [sectionId]: { isPlaying: false, currentTime: 0, duration: 0, volume: 1 }
        }));
      }, 0);
    }

    const togglePlayPause = () => {
      if (audioRef.current) {
        if (audioState.isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
        }
        setAudioStates(prev => ({
          ...prev,
          [sectionId]: { ...(prev[sectionId] || {}), isPlaying: !audioState.isPlaying }
        }));
      }
    };

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setAudioStates(prev => ({
          ...prev,
          [sectionId]: { ...(prev[sectionId] || {}), currentTime: audioRef.current.currentTime }
        }));
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setAudioStates(prev => ({
          ...prev,
          [sectionId]: { ...(prev[sectionId] || {}), duration: audioRef.current.duration }
        }));
      }
    };

    const handleSeek = (e) => {
      if (audioRef.current) {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const newTime = (clickX / width) * audioState.duration;
        audioRef.current.currentTime = newTime;
        setAudioStates(prev => ({
          ...prev,
          [sectionId]: { ...(prev[sectionId] || {}), currentTime: newTime }
        }));
      }
    };

    const handleVolumeChange = (e) => {
      const newVolume = parseFloat(e.target.value);
      setAudioStates(prev => ({
        ...prev,
        [sectionId]: { ...(prev[sectionId] || {}), volume: newVolume }
      }));
      if (audioRef.current) {
        audioRef.current.volume = newVolume;
      }
    };

    const formatTime = (time) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const hasAudio = section.audioUrl || section.type === 'SPEAKING_WITH_AUDIO_SECTION';

    return (
      <div key={section.id || index} className={`question-item ${theme}-question-item`} style={{ marginBottom: '24px', borderRadius: '16px', padding: '24px', border: '2px solid', borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)' }}>
        <style>{`
          .speaking-audio-prompt-scrollbar::-webkit-scrollbar { width: 8px; }
          .speaking-audio-prompt-scrollbar::-webkit-scrollbar-track { background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'}; border-radius: 4px; }
          .speaking-audio-prompt-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}; border-radius: 4px; border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'}; }
          .speaking-audio-prompt-scrollbar::-webkit-scrollbar-thumb:hover { background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'}; }
        `}</style>
        <div className="question-header" style={{ paddingBottom: '14px', marginBottom: '16px', borderBottom: '2px solid', borderBottomColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Text strong style={{ fontSize: hasAudio ? '20px' : '16px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
              {index + 1}. {hasAudio ? 'Speaking With Audio Section' : 'Speaking Section'}
            </Typography.Text>
            <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
              ({sectionTotals.received} / {sectionTotals.total} points)
            </Typography.Text>
          </div>
          {!isStudent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {!hasExistingGradingForSection(section.id) ? (
                <>
                  <Button
                    size="small"
                    onClick={() => handleOpenAddFeedback(section.id, 'section')}
                    style={{
                      fontSize: '13px',
                      height: '28px',
                      padding: '0 12px'
                    }}
                  >
                    Add Score/Feedback
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="small"
                    onClick={() => handleOpenEditFeedback(section.id, 'section')}
                    style={{
                      fontSize: '13px',
                      height: '28px',
                      padding: '0 12px'
                    }}
                  >
                    Edit Score/Feedback
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: hasAudio ? 'flex-start' : 'stretch', minHeight: hasAudio ? '500px' : '400px' }}>
          {/* Left Section - Audio Player (if has audio) or Prompt */}
          <div 
            className={hasAudio ? "speaking-audio-prompt-scrollbar" : ""}
            style={{ 
              flex: '1', 
              padding: '20px', 
              background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)', 
              borderRadius: '12px', 
              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
              overflowY: hasAudio ? 'auto' : 'visible',
              maxHeight: hasAudio ? '500px' : 'none',
              scrollbarWidth: hasAudio ? 'thin' : 'auto',
              scrollbarColor: hasAudio ? (theme === 'sun' ? '#1890ff rgba(24, 144, 255, 0.2)' : '#8B5CF6 rgba(138, 122, 255, 0.2)') : 'auto'
            }}>
            {hasAudio && section.audioUrl ? (
              <>
                {(() => {
                  const rawTranscript = section.transcript || '';
                  const durationInfo = extractDurationMarker(rawTranscript);
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
                    </>
                  );
                })()}

                {/* Audio Player */}
                <div style={{
                  background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
                  boxShadow: theme === 'sun' 
                    ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}>
                  <audio
                    ref={audioRef}
                    src={section.audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setAudioStates(prev => ({ ...prev, [sectionId]: { ...(prev[sectionId] || {}), isPlaying: false } }))}
                    style={{ display: 'none' }}
                  >
                    <source src={section.audioUrl} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>

                  {/* Audio Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    {/* Play/Pause Button */}
                    <button
                      onClick={togglePlayPause}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        border: 'none',
                        background: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                        color: 'white',
                        fontSize: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        boxShadow: theme === 'sun' 
                          ? '0 4px 12px rgba(24, 144, 255, 0.3)' 
                          : '0 4px 12px rgba(138, 122, 255, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {audioState.isPlaying ? '⏸️' : '▶️'}
                    </button>

                    {/* Time Display */}
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: theme === 'sun' ? '#333' : '#1F2937',
                      minWidth: '80px'
                    }}>
                      {formatTime(audioState.currentTime)} / {formatTime(audioState.duration)}
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        flex: 1,
                        height: '6px',
                        background: theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={handleSeek}
                    >
                      <div
                        style={{
                          width: `${audioState.duration ? (audioState.currentTime / audioState.duration) * 100 : 0}%`,
                          height: '100%',
                          background: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                          borderRadius: '3px',
                          transition: 'width 0.1s ease'
                        }}
                      />
                    </div>

                    {/* Volume Control */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '16px',
                        color: theme === 'sun' ? '#666' : '#ccc'
                      }}>🔊</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={audioState.volume}
                        onChange={handleVolumeChange}
                        style={{
                          width: '60px',
                          accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Transcript Content (with [[dur_X]] removed) */}
                {section.transcript && (
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '16px',
                    border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(138, 122, 255, 0.3)'}`,
                    fontSize: '15px',
                    lineHeight: '1.8',
                    color: '#333',
                    textAlign: 'justify',
                    boxShadow: theme === 'sun' 
                      ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                      : '0 2px 8px rgba(138, 122, 255, 0.2)'
                  }}>
                    <div dangerouslySetInnerHTML={{ __html: extractDurationMarker(section.transcript || '').cleanedContent }} />
                  </div>
                )}
              </>
            ) : (
              <div className="passage-text-content" style={{ fontSize: '15px', lineHeight: '1.8', color: theme === 'sun' ? '#333' : '#1F2937', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: section.prompt || '' }} />
            )}
          </div>
          
          {/* Right Section - Recording Area */}
          <div style={{ flex: '1', background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, padding: hasAudio ? '24px' : '20px', textAlign: hasAudio ? 'center' : 'left' }}>
            <Typography.Text style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}>
              {hasAudio ? (audioUrl ? 'Student Recorded Audio:' : 'Record Your Response:') : "Student's Recording:"}
            </Typography.Text>
            {audioUrl ? (
              <div>
                <audio controls style={{ width: '100%', height: hasAudio ? '40px' : 'auto' }}>
                  <source src={audioUrl} type="audio/mpeg" />
                  <source src={audioUrl} type="audio/wav" />
                  <source src={audioUrl} type="audio/mp3" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : (
              <Typography.Text type="secondary" style={{ fontSize: '14px', fontStyle: 'italic' }}>
                {hasAudio ? 'No recording submitted' : 'No recording submitted'}
              </Typography.Text>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Simple question renderer component (inline for simplicity)
  const renderQuestion = (q, qIndex) => {
    const questionNumber = qIndex + 1;
    const questionText = q.questionText || q.question || '';
    const studentAnswer = studentAnswers?.[q.id];

    if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE' || q.type === 'MULTIPLE_SELECT') {
      const options = q.options || [];
      const isMulti = q.type === 'MULTIPLE_SELECT';
      const correctOption = options.find(opt => opt.isCorrect);
      const correctKey = q.type === 'TRUE_OR_FALSE' ? (correctOption?.text) : correctOption?.key;
      const correctKeys = isMulti ? options.filter(opt => opt.isCorrect).map(opt => opt.key) : [];
      
      const isCorrect = isMulti 
        ? Array.isArray(studentAnswer) && correctKeys.every(k => studentAnswer.includes(k)) && studentAnswer.every(k => correctKeys.includes(k))
        : studentAnswer === correctKey;

      return (
        <div
          key={q.id}
          className={`question-item ${theme}-question-item`}
          style={{
            marginBottom: '24px',
            borderRadius: '16px',
            padding: '24px',
            border: '2px solid',
            borderColor: theme === 'sun' 
              ? 'rgba(113, 179, 253, 0.25)' 
              : 'rgba(138, 122, 255, 0.2)',
            background: theme === 'sun' 
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
            boxShadow: theme === 'sun' 
              ? '0 4px 16px rgba(113, 179, 253, 0.1)'
              : '0 4px 16px rgba(138, 122, 255, 0.12)',
          }}
        >
          <div className="question-header" style={{
            paddingBottom: '14px',
            marginBottom: '16px',
            borderBottom: '2px solid',
            borderBottomColor: theme === 'sun' 
              ? 'rgba(113, 179, 253, 0.25)' 
              : 'rgba(138, 122, 255, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography.Text strong style={{ 
              fontSize: '16px', 
              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
            }}>
              Question {questionNumber}
            </Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}>
                {(q.receivedScore || 0)} / {(q.points || 0)} points
              </Typography.Text>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                fontStyle: 'italic'
              }}>
                {q.type.replace('_', ' ')}
              </Typography.Text>
            </div>
          </div>
          <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
            <div 
              className="question-text-content"
              style={{ 
                fontSize: '15px', 
                fontWeight: 350,
                marginBottom: '12px',
                lineHeight: '1.8',
                color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
              }}
              dangerouslySetInnerHTML={{ __html: questionText }}
            />
            <div className="question-options" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '14px', 
              marginTop: '12px' 
            }}>
              {(q.type === 'TRUE_OR_FALSE' ? ['True', 'False'] : options).map((opt, idx) => {
                let key, text;
                if (q.type === 'TRUE_OR_FALSE') {
                  key = opt;
                  text = opt;
                } else {
                  key = opt.key || String.fromCharCode(65 + idx);
                  text = opt.text || '';
                }
                
                const isCorrectAnswer = isMulti 
                  ? correctKeys.includes(key)
                  : (key === correctKey || (q.type === 'TRUE_OR_FALSE' && opt === correctKey));
                
                const isSelected = isMulti 
                  ? (Array.isArray(studentAnswer) && studentAnswer.includes(key))
                  : (studentAnswer === key || (q.type === 'TRUE_OR_FALSE' && opt === studentAnswer));
                
                const isSelectedWrong = isSelected && !isCorrectAnswer;
                const isCorrectMissing = !isSelected && isCorrectAnswer && isMulti;
                const isUnanswered = isMulti ? (Array.isArray(studentAnswer) && studentAnswer.length === 0) : (!isSelected && (studentAnswer == null));
                
                return (
                  <div key={key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 18px',
                    background: (isUnanswered && !isMulti && isCorrectAnswer)
                      ? (theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)')
                      : (isCorrectMissing
                        ? (theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)')
                        : (isCorrectAnswer
                          ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)')
                          : isSelectedWrong
                            ? (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)')
                            : (theme === 'sun' ? '#fff' : 'rgba(255,255,255,0.03)'))),
                    border: `2px solid ${
                      (isUnanswered && !isMulti && isCorrectAnswer)
                        ? '#faad14'
                        : (isCorrectMissing
                          ? '#faad14'
                          : (isCorrectAnswer
                            ? 'rgb(82, 196, 26)'
                            : (isSelectedWrong ? 'rgb(255, 77, 79)' : (theme === 'sun' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'))))
                    }`,
                    borderRadius: '12px',
                  }}>
                    <input 
                      type={isMulti ? 'checkbox' : 'radio'}
                      checked={isSelected || isCorrectMissing}
                      disabled
                      style={{ 
                        width: '18px',
                        height: '18px',
                        accentColor: isCorrectMissing ? '#faad14' : (isCorrectAnswer ? '#52c41a' : (isSelectedWrong ? '#ff4d4f' : (theme === 'sun' ? '#1890ff' : '#8B5CF6'))),
                      }} 
                    />
                    <span style={{ 
                      flexShrink: 0, 
                      color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                      fontWeight: '600',
                      fontSize: '16px'
                    }}>
                      {q.type === 'TRUE_OR_FALSE' ? (opt === 'True' ? 'A' : 'B') : key}.
                    </span>
                    <span 
                      className="option-text"
                      style={{ 
                        flex: 1, 
                        lineHeight: '1.6',
                        color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                        fontWeight: '350'
                      }}
                      dangerouslySetInnerHTML={{ __html: q.type === 'TRUE_OR_FALSE' ? opt : text }}
                    />
                    {isSelectedWrong && (
                      <CloseCircleOutlined style={{
                        fontSize: '22px',
                        color: '#ff4d4f',
                        marginLeft: 'auto',
                      }} />
                    )}
                    {(isUnanswered && !isMulti && isCorrectAnswer) && !isSelectedWrong && (
                      <CheckCircleOutlined style={{
                        fontSize: '20px',
                        color: '#faad14',
                        marginLeft: 'auto',
                      }} />
                    )}
                    {(!isUnanswered || isMulti) && (isCorrectMissing || (isCorrectAnswer && !isCorrectMissing)) && !isSelectedWrong && (
                      <CheckCircleOutlined style={{
                        fontSize: '20px',
                        color: isCorrectMissing ? '#faad14' : '#52c41a',
                        marginLeft: 'auto',
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // FILL_IN_THE_BLANK
    if (q.type === 'FILL_IN_THE_BLANK') {
      const contentData = q.content?.data || [];
      const studentAnswerObj = studentAnswers?.[q.id] || {};
      
      const renderFillBlankInputs = () => {
        const elements = [];
        const regex = /(\[\[pos_(.*?)\]\])/g;
        let lastIndex = 0;
        let match;
        let inputIndex = 0;
        
        while ((match = regex.exec(questionText)) !== null) {
          if (match.index > lastIndex) {
            const textContent = questionText.slice(lastIndex, match.index);
            elements.push(
              <span 
                key={`text_${inputIndex}`}
                className="question-text-content"
                dangerouslySetInnerHTML={{ __html: textContent }}
              />
            );
          }
          inputIndex += 1;
          
          const positionId = `pos_${match[2]}`;
          const rawPositionId = match[2]; // Without "pos_" prefix
          
          // Find correct item - check both with and without "pos_" prefix
          let correctItem = contentData.find(item => 
            (item.positionId === positionId || item.positionId === rawPositionId) && item.correct
          );
          // Fallback: if no correct item found, try to find any item with matching positionId
          if (!correctItem) {
            correctItem = contentData.find(item => 
              item.positionId === positionId || item.positionId === rawPositionId
            );
          }
          const correctAnswer = correctItem?.value || '';
          
          let studentAnswer = '';
          if (typeof studentAnswerObj === 'object' && studentAnswerObj !== null) {
            // Check multiple possible keys
            studentAnswer = studentAnswerObj[positionId] || 
                          studentAnswerObj[rawPositionId] || 
                          studentAnswerObj[match[2]] || 
                          '';
          } else if (typeof studentAnswerObj === 'string') {
            studentAnswer = studentAnswerObj;
          }
          
          const isCorrect = correctAnswer && studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
          const isUnanswered = !studentAnswer || studentAnswer.trim().length === 0;
          const displayValue = isUnanswered ? (correctAnswer || '') : studentAnswer;
          const bgColor = isCorrect
            ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
            : isUnanswered
              ? (theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)')
              : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)');
          const borderColor = isCorrect ? 'rgb(82, 196, 26)' : (isUnanswered ? '#faad14' : 'rgb(255, 77, 79)');
          const textColor = isCorrect ? (theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)') : (isUnanswered ? '#faad14' : (theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'));
          const fontWeight = isUnanswered ? 600 : 400;

          elements.push(
            <input
              key={`fill_blank_input_${inputIndex}`}
              type="text"
              value={displayValue}
              readOnly
              disabled
              style={{
                display: 'inline-block',
                minWidth: '120px',
                maxWidth: '200px',
                minHeight: '32px',
                padding: '4px 12px',
                margin: '0 8px',
                background: bgColor,
                border: `2px solid ${borderColor}`,
                borderRadius: '8px',
                cursor: 'not-allowed',
                outline: 'none',
                lineHeight: '1.4',
                fontSize: '14px',
                boxSizing: 'border-box',
                textAlign: 'center',
                color: textColor,
                fontWeight,
                verticalAlign: 'middle'
              }}
            />
          );
          
          // Show correct answer only when answered wrong (not for unanswered since we show inside input)
          if (!isCorrect && correctAnswer && !(isUnanswered)) {
            const answerColor = '#52c41a';
            elements.push(
              <span 
                key={`answer_${inputIndex}`}
                style={{ 
                  fontSize: '15px',
                  color: answerColor,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  marginLeft: '8px',
                  marginRight: '8px',
                  display: 'inline-block'
                }}
              >
                {correctAnswer}
              </span>
            );
          }
          
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < questionText.length) {
          const textContent = questionText.slice(lastIndex);
          elements.push(
            <span 
              key={`text_final`}
              className="question-text-content"
              dangerouslySetInnerHTML={{ __html: textContent }}
            />
          );
        }
        
        return elements;
      };

    return (
        <div
          key={q.id}
          className={`question-item ${theme}-question-item`}
          style={{
            marginBottom: '24px',
            borderRadius: '16px',
            padding: '24px',
            border: '2px solid',
            borderColor: theme === 'sun' 
              ? 'rgba(113, 179, 253, 0.25)' 
              : 'rgba(138, 122, 255, 0.2)',
            background: theme === 'sun' 
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
            boxShadow: theme === 'sun' 
              ? '0 4px 16px rgba(113, 179, 253, 0.1)'
              : '0 4px 16px rgba(138, 122, 255, 0.12)',
          }}
        >
          <div className="question-header" style={{
            paddingBottom: '14px',
            marginBottom: '16px',
            borderBottom: '2px solid',
            borderBottomColor: theme === 'sun' 
              ? 'rgba(113, 179, 253, 0.25)' 
              : 'rgba(138, 122, 255, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography.Text strong style={{ 
              fontSize: '16px', 
              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
            }}>
              Question {questionNumber}
            </Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}>
                {(q.receivedScore || 0)} / {(q.points || 0)} points
              </Typography.Text>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                fontStyle: 'italic'
              }}>
                Fill in the Blank
              </Typography.Text>
            </div>
          </div>
          <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
            <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 350, lineHeight: '1.8', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
              {renderFillBlankInputs()}
            </div>
          </div>
        </div>
      );
    }

    // DROPDOWN
    if (q.type === 'DROPDOWN') {
      const contentData = q.content?.data || [];
      const studentAnswerObj = studentAnswers?.[q.id] || {};
      
      const renderDropdownSelects = () => {
        const parts = [];
        const regex = /\[\[pos_(.*?)\]\]/g;
        let last = 0;
        let match;
        let idx = 0;
        
        while ((match = regex.exec(questionText)) !== null) {
          if (match.index > last) {
            parts.push(
              <span 
                key={`text_${idx}`}
                className="question-text-content"
                dangerouslySetInnerHTML={{ __html: questionText.slice(last, match.index) }}
              />
            );
          }
          const positionId = `pos_${match[1]}`;
          const rawPositionId = match[1]; // Without "pos_" prefix
          
          const optionsForPosition = contentData.filter(opt => {
            const optPosId = String(opt.positionId || '');
            return optPosId === positionId || optPosId === rawPositionId;
          }) || [];
          
          const correctItem = optionsForPosition.find(it => it.correct) || 
                             (optionsForPosition.length > 0 ? optionsForPosition[0] : null);
          const correctAnswer = correctItem?.value || '';
          
          // Get student answer - check multiple possible keys
          const studentAnswer = studentAnswerObj[positionId] || 
                              studentAnswerObj[rawPositionId] || 
                              studentAnswerObj[match[1]] || 
                              '';
          
          const isCorrect = correctAnswer && studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
          const isUnanswered = !studentAnswer || studentAnswer.trim().length === 0;
          const displayedValue = isUnanswered ? correctAnswer : studentAnswer;
          const optionValues = optionsForPosition.map(it => it.value).filter(Boolean);
          const ddBg = isCorrect
            ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
            : isUnanswered
              ? (theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)')
              : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)');
          const ddBorder = isCorrect ? 'rgb(82, 196, 26)' : (isUnanswered ? '#faad14' : 'rgb(255, 77, 79)');
          const ddColor = isUnanswered ? '#faad14' : (isCorrect ? '#52c41a' : '#ff4d4f');
          
          parts.push(
            <select
              key={`dd_${q.id}_${idx++}`}
              value={displayedValue || ''}
              disabled
              style={{
                display: 'inline-block',
                minWidth: '120px',
                height: '32px',
                padding: '4px 12px',
                margin: '0 8px',
                background: ddBg,
                border: `2px solid ${ddBorder}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: ddColor,
                cursor: 'not-allowed',
                outline: 'none',
                verticalAlign: 'middle',
                textAlign: 'center',
                textAlignLast: 'center',
              }}
            >
              <option value="" disabled hidden style={{ textAlign: 'center' }}>Select</option>
              {optionValues.map((opt, optIdx) => (
                <option key={optIdx} value={opt}>{opt}</option>
              ))}
            </select>
          );
          
          // Only show side answer when answered wrong; for unanswered it's inside select
          if (!isCorrect && correctAnswer && !isUnanswered) {
            parts.push(
              <span 
                key={`answer_${idx++}`}
                style={{ 
                  fontSize: '15px',
                  color: '#52c41a',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  marginLeft: '8px',
                  marginRight: '8px',
                  display: 'inline-block'
                }}
              >
                {correctAnswer}
              </span>
            );
          }
          
          last = match.index + match[0].length;
        }
        if (last < questionText.length) {
          parts.push(
            <span 
              key={`text_final_${idx}`}
              className="question-text-content"
              dangerouslySetInnerHTML={{ __html: questionText.slice(last) }}
            />
          );
        }
        return parts;
      };

      return (
        <div
          key={q.id}
          className={`question-item ${theme}-question-item`}
          style={{
            marginBottom: '24px',
            borderRadius: '16px',
            padding: '24px',
            border: '2px solid',
            borderColor: theme === 'sun' 
              ? 'rgba(113, 179, 253, 0.25)' 
              : 'rgba(138, 122, 255, 0.2)',
            background: theme === 'sun' 
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
            boxShadow: theme === 'sun' 
              ? '0 4px 16px rgba(113, 179, 253, 0.1)'
              : '0 4px 16px rgba(138, 122, 255, 0.12)',
          }}
        >
          <div className="question-header" style={{
            paddingBottom: '14px',
            marginBottom: '16px',
            borderBottom: '2px solid',
            borderBottomColor: theme === 'sun' 
              ? 'rgba(113, 179, 253, 0.25)' 
              : 'rgba(138, 122, 255, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography.Text strong style={{ 
              fontSize: '16px', 
              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
            }}>
              Question {questionNumber}
            </Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}>
                {(q.receivedScore || 0)} / {(q.points || 0)} points
              </Typography.Text>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                fontStyle: 'italic'
              }}>
                Dropdown
              </Typography.Text>
            </div>
          </div>
          <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
            <div style={{ 
              fontSize: '15px', 
              fontWeight: 350,
              lineHeight: '1.8',
              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
              marginBottom: '16px'
            }}>
              {renderDropdownSelects()}
            </div>
          </div>
        </div>
      );
    }

    // DRAG_AND_DROP
    if (q.type === 'DRAG_AND_DROP') {
      const contentData = q.content?.data || [];
      const studentAnswerObj = studentAnswers?.[q.id] || {};
      const text = questionText;
      const parts = [];
      const regex = /\[\[pos_(.*?)\]\]/g;
      let last = 0;
      let match;
      let idx = 0;
      
      while ((match = regex.exec(text)) !== null) {
        if (match.index > last) parts.push({ type: 'text', content: text.slice(last, match.index) });
        const posId = match[1];
        parts.push({ type: 'position', positionId: `pos_${posId}`, index: idx++ });
        last = match.index + match[0].length;
      }
      if (last < text.length) parts.push({ type: 'text', content: text.slice(last) });

      return (
        <div
          key={q.id}
          className={`question-item ${theme}-question-item`}
          style={{
            marginBottom: '24px',
            borderRadius: '16px',
            padding: '24px',
            border: '2px solid',
            borderColor: theme === 'sun' 
              ? 'rgba(113, 179, 253, 0.25)' 
              : 'rgba(138, 122, 255, 0.2)',
            background: theme === 'sun' 
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
            boxShadow: theme === 'sun' 
              ? '0 4px 16px rgba(113, 179, 253, 0.1)'
              : '0 4px 16px rgba(138, 122, 255, 0.12)',
          }}
        >
          <div className="question-header" style={{
            paddingBottom: '14px',
            marginBottom: '16px',
            borderBottom: '2px solid',
            borderBottomColor: theme === 'sun' 
              ? 'rgba(113, 179, 253, 0.25)' 
              : 'rgba(138, 122, 255, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography.Text strong style={{ 
              fontSize: '16px', 
              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
            }}>
              Question {questionNumber}
            </Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}>
                {(q.receivedScore || 0)} / {(q.points || 0)} points
              </Typography.Text>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                fontStyle: 'italic'
              }}>
                Drag and Drop
              </Typography.Text>
            </div>
          </div>
          <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '24px', minHeight: '300px' }}>
              <div style={{
                flex: '1',
                padding: '20px',
                background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
              }}>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                  Question:
                </div>
                <div style={{ fontSize: '15px', fontWeight: 350, lineHeight: '1.8', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                  {parts.map((part, pIdx) => {
                    if (part.type === 'text') {
                      return <span key={pIdx} dangerouslySetInnerHTML={{ __html: part.content || '' }} />;
                    }
                    
                    // Extract raw positionId from part.positionId (e.g., "pos_dqn1x8" -> "dqn1x8")
                    const rawPositionId = part.positionId.replace(/^pos_/, '');
                    
                    // Get student answer - check multiple possible keys
                    const studentAnswer = studentAnswerObj[part.positionId] || 
                                        studentAnswerObj[rawPositionId] || 
                                        '';
                    
                    // Find correct item - check both with and without "pos_" prefix
                    let correctItem = contentData.find(item => {
                      const itemPosId = String(item.positionId || '');
                      return (itemPosId === part.positionId || itemPosId === rawPositionId) && item.correct;
                    });
                    
                    // Fallback: if no correct item found, try to find any item with matching positionId
                    if (!correctItem) {
                      correctItem = contentData.find(item => {
                        const itemPosId = String(item.positionId || '');
                        return itemPosId === part.positionId || itemPosId === rawPositionId;
                      });
                    }
                    
                    const correctAnswer = correctItem?.value || '';
                    const isCorrect = correctAnswer && studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
                    
                    return (
                      <React.Fragment key={pIdx}>
                        {studentAnswer ? (
                          <>
                            <div style={{
                              minWidth: '120px',
                              minHeight: '32px',
                              maxWidth: '200px',
                              margin: '0 8px',
                              background: isCorrect 
                                ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
                                : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'),
                              border: `2px solid ${isCorrect ? 'rgb(82, 196, 26)' : 'rgb(255, 77, 79)'}`,
                              borderRadius: '8px',
                              display: 'inline-block',
                              padding: '4px 12px',
                              fontSize: '15px',
                              fontWeight: '350',
                              color: isCorrect ? '#52c41a' : '#ff4d4f',
                              cursor: 'not-allowed',
                              verticalAlign: 'middle',
                              lineHeight: '1.4',
                              boxSizing: 'border-box',
                              textAlign: 'center',
                              wordBreak: 'break-word',
                              wordWrap: 'break-word',
                              overflow: 'hidden',
                              whiteSpace: 'normal'
                            }} dangerouslySetInnerHTML={{ __html: studentAnswer || '' }} />
                            {/* Show correct answer if wrong (same as Fill in the Blank) */}
                            {!isCorrect && correctAnswer && (
                              <span style={{ fontSize: '15px', color: '#52c41a', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px', marginRight: '8px', display: 'inline-block' }}>
                                {correctAnswer}
                              </span>
                            )}
                          </>
                        ) : (
                          <div style={{
                            minWidth: '120px',
                            minHeight: '32px',
                            maxWidth: '200px',
                            margin: '0 8px',
                            background: (theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)'),
                            border: '2px solid #faad14',
                            borderRadius: '8px',
                            display: 'inline-block',
                            padding: '4px 12px',
                            fontSize: '15px',
                            fontWeight: '600',
                            color: '#faad14',
                            cursor: 'not-allowed',
                            verticalAlign: 'middle',
                            lineHeight: '1.4',
                            boxSizing: 'border-box',
                            textAlign: 'center'
                          }} dangerouslySetInnerHTML={{ __html: correctAnswer || '' }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
              <div style={{
                flex: '1',
                padding: '20px',
                background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
              }}>
                <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '16px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                  Available words:
                </Typography.Text>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
                  {contentData.map((item, idx) => {
                    const itemValue = item?.value || '';
                    const isCorrectWord = item?.correct === true;
                    return (
                      <div key={idx} style={{
                        padding: '12px 20px',
                        background: isCorrectWord
                          ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)')
                          : (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)'),
                        border: `2px solid ${isCorrectWord ? '#52c41a' : '#ff4d4f'}`,
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: isCorrectWord ? '#52c41a' : '#ff4d4f',
                        cursor: 'default',
                        userSelect: 'none',
                        minWidth: '80px',
                        textAlign: 'center',
                      }} dangerouslySetInnerHTML={{ __html: itemValue }} />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // REARRANGE
    if (q.type === 'REARRANGE') {
      const contentData = q.content?.data || [];
      const studentAnswer = studentAnswers?.[q.id] || [];
      
      // Get correct order by parsing questionText to extract positionIds in order
      // questionText format: "[[pos_u64lgh]] [[pos_22ylfg]] [[pos_mchmz2]]"
      const correctOrder = (() => {
        const positionIdsInOrder = [];
        const regex = /\[\[pos_(.*?)\]\]/g;
        let match;
        while ((match = regex.exec(questionText)) !== null) {
          positionIdsInOrder.push(match[1]); // Extract positionId without "pos_" prefix
        }
        
        // Map positionIds to values from contentData
        return positionIdsInOrder.map(posId => {
          // Try to find item with positionId matching pos_xxx or just xxx
          const item = contentData.find(item => {
            const itemPosId = (item.positionId || '').replace(/^pos_/, '');
            return itemPosId === posId;
          });
          return item?.value || '';
        }).filter(Boolean);
      })();
      
      // Student answer should be an array of values (not ids) from mapping
      const studentOrder = Array.isArray(studentAnswer) 
        ? studentAnswer 
        : (typeof studentAnswer === 'object' && studentAnswer !== null 
            ? Object.keys(studentAnswer)
                .sort((a, b) => {
                  const posA = String(a).replace(/^pos_/, '');
                  const posB = String(b).replace(/^pos_/, '');
                  return posA.localeCompare(posB);
                })
                .map(key => studentAnswer[key])
                .filter(Boolean) 
            : []);
      
      const isCorrect = studentOrder.length === correctOrder.length && 
        studentOrder.every((word, idx) => word.trim().toLowerCase() === correctOrder[idx].trim().toLowerCase());
      
      const displayText = ((questionText).replace(/\[\[pos_.*?\]\]/g, '')).trim();

      return (
        <div
          key={q.id}
          className={`question-item ${theme}-question-item`}
          style={{
            marginBottom: '24px',
            borderRadius: '16px',
            padding: '24px',
            border: '2px solid',
            borderColor: theme === 'sun' 
              ? 'rgba(113, 179, 253, 0.25)' 
              : 'rgba(138, 122, 255, 0.2)',
            background: theme === 'sun' 
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
            boxShadow: theme === 'sun' 
              ? '0 4px 16px rgba(113, 179, 253, 0.1)'
              : '0 4px 16px rgba(138, 122, 255, 0.12)',
          }}
        >
          <div className="question-header" style={{
            paddingBottom: '14px',
            marginBottom: '16px',
            borderBottom: '2px solid',
            borderBottomColor: theme === 'sun' 
              ? 'rgba(113, 179, 253, 0.25)' 
              : 'rgba(138, 122, 255, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography.Text strong style={{ 
              fontSize: '16px', 
              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
            }}>
              Question {questionNumber}
            </Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}>
                {(q.receivedScore || 0)} / {(q.points || 0)} points
              </Typography.Text>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                fontStyle: 'italic'
              }}>
                Rearrange
              </Typography.Text>
            </div>
          </div>
          <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 350, marginBottom: '16px', lineHeight: '1.8', color: '#000000' }}>
              <div className="question-text-content" dangerouslySetInnerHTML={{ __html: displayText || 'Rearrange the words to form a correct sentence:' }} />
            </div>
            <div style={{ marginBottom: '24px', padding: '20px', background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}` }}>
              <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '16px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                Your answer:
              </Typography.Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {studentOrder.length > 0 ? studentOrder.map((word, index) => (
                  <div key={index} style={{
                    minWidth: '100px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${isCorrect ? '#52c41a' : '#ff4d4f'}`,
                    borderRadius: '8px',
                    background: isCorrect
                      ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)')
                      : (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)'),
                    cursor: 'not-allowed'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: isCorrect ? '#52c41a' : '#ff4d4f', textAlign: 'center', padding: '8px 12px' }}>
                      {word}
                    </span>
                  </div>
                )) : (
                  correctOrder.map((word, index) => (
                    <div key={index} style={{
                      minWidth: '100px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #faad14',
                      borderRadius: '8px',
                      background: theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)',
                      cursor: 'not-allowed'
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#faad14', textAlign: 'center', padding: '8px 12px' }}>
                        {word}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            {!isCorrect && studentOrder.length > 0 && (
              <div style={{ marginBottom: '24px', padding: '20px', background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}` }}>
                <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '16px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                  Correct order:
                </Typography.Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {correctOrder.map((word, index) => (
                    <div key={index} style={{
                      minWidth: '100px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #52c41a',
                      borderRadius: '8px',
                      background: theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)',
                      cursor: 'default'
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#52c41a', textAlign: 'center', padding: '8px 12px' }}>
                        {word}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // REWRITE
    if (q.type === 'REWRITE') {
      const contentData = q.content?.data || [];
      const studentAnswer = studentAnswers?.[q.id] || '';
      
      // Helper function to strip HTML tags
      const stripHtml = (html) => (html || '').replace(/<[^>]*>/g, '').trim();
      
      // Get correct answers and strip HTML from them
      const correctAnswers = contentData.map(item => {
        const rawValue = item?.value || '';
        return stripHtml(rawValue);
      }).filter(Boolean);
      
      // Also keep raw HTML values for display (with HTML stripped)
      const correctAnswersDisplay = contentData.map(item => {
        const rawValue = item?.value || '';
        return stripHtml(rawValue);
      }).filter(Boolean);
      
      // Strip HTML from student answer for comparison and display
      const studentAnswerText = stripHtml(studentAnswer);
      
      const isCorrect = (() => {
        if (!studentAnswerText || correctAnswers.length === 0) return false;
        const normalizedStudent = studentAnswerText.toLowerCase();
        return correctAnswers.some(correct => 
          correct.toLowerCase() === normalizedStudent
        );
      })();
      
      const displayQuestionText = (questionText).replace(/\[\[pos_.*?\]\]/g, '');

      return (
        <div
          key={q.id}
          className={`question-item ${theme}-question-item`}
          style={{
            marginBottom: '24px',
            borderRadius: '16px',
            padding: '24px',
            border: '2px solid',
            borderColor: theme === 'sun' 
              ? 'rgba(113, 179, 253, 0.25)' 
              : 'rgba(138, 122, 255, 0.2)',
            background: theme === 'sun' 
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
            boxShadow: theme === 'sun' 
              ? '0 4px 16px rgba(113, 179, 253, 0.1)'
              : '0 4px 16px rgba(138, 122, 255, 0.12)',
          }}
        >
          <div className="question-header" style={{
            paddingBottom: '14px',
            marginBottom: '16px',
            borderBottom: '2px solid',
            borderBottomColor: theme === 'sun' 
              ? 'rgba(113, 179, 253, 0.25)' 
              : 'rgba(138, 122, 255, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography.Text strong style={{ 
              fontSize: '16px', 
              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
            }}>
              Question {questionNumber}
            </Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}>
                {(q.receivedScore || 0)} / {(q.points || 0)} points
              </Typography.Text>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                fontStyle: 'italic'
              }}>
                Rewrite
              </Typography.Text>
            </div>
          </div>
          <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
            <div 
              className="question-text-content"
              style={{ 
                fontSize: '15px', 
                fontWeight: 350,
                marginBottom: '16px',
                lineHeight: '1.8',
                color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
              }}
              dangerouslySetInnerHTML={{ __html: displayQuestionText }}
            />
            <div style={{ marginTop: '20px' }}>
              <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '8px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                Your answer:
              </Typography.Text>
              <div style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px 16px',
                border: `2px solid ${studentAnswerText ? (isCorrect ? '#52c41a' : '#ff4d4f') : (theme === 'sun' ? '#1890ff' : '#8B5CF6')}`,
                borderRadius: '8px',
                backgroundColor: studentAnswerText
                  ? (isCorrect ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)') : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'))
                  : (theme === 'sun' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.85)'),
                color: studentAnswerText ? (isCorrect ? '#52c41a' : '#ff4d4f') : (theme === 'sun' ? '#000000' : '#FFFFFF'),
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                cursor: 'not-allowed'
              }}>
                {studentAnswerText || 'No answer provided'}
              </div>
            </div>
            {correctAnswersDisplay.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '8px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                  Correct answer{correctAnswersDisplay.length > 1 ? 's' : ''}:
                </Typography.Text>
                {correctAnswersDisplay.map((correctAnswer, idx) => (
                  <div key={idx} style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px 16px',
                    border: '2px solid #52c41a',
                    borderRadius: '8px',
                    backgroundColor: theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)',
                    color: '#52c41a',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    marginBottom: idx < correctAnswersDisplay.length - 1 ? '8px' : '0',
                    cursor: 'default'
                  }}>
                    {correctAnswer}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Default placeholder for unknown types
    return (
      <div
        key={q.id}
        className={`question-item ${theme}-question-item`}
        style={{
          marginBottom: '24px',
          borderRadius: '16px',
          padding: '24px',
          border: '2px solid',
          borderColor: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.25)' 
            : 'rgba(138, 122, 255, 0.2)',
          background: theme === 'sun' 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
        }}
      >
        <div className="question-header" style={{
          paddingBottom: '14px',
          marginBottom: '16px',
          borderBottom: '2px solid',
          borderBottomColor: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.25)' 
            : 'rgba(138, 122, 255, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography.Text strong style={{ 
            fontSize: '16px', 
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
          }}>
            Question {questionNumber}
          </Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}>
                {(q.receivedScore || 0)} / {(q.points || 0)} points
              </Typography.Text>
            <Typography.Text style={{ 
              fontSize: '14px', 
              color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic'
            }}>
              {q.type.replace('_', ' ')}
            </Typography.Text>
          </div>
        </div>
        <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
          <div 
            className="question-text-content"
            style={{ 
              fontSize: '15px', 
              fontWeight: 350,
              marginBottom: '12px',
              lineHeight: '1.8',
              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
            }}
            dangerouslySetInnerHTML={{ __html: questionText }}
          />
        </div>
      </div>
    );
  };

  // Custom header with back button, title, and score buttons (after data is loaded)
  const customHeader = (
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
              onClick={() => {
                // Check if this is a student or test_taker route by checking URL path
                const isStudentRoute = location.pathname.includes('/student/daily-challenges');
                const isTestTakerRoute = location.pathname.includes('/test-taker/daily-challenges');
                
                if (isStudentRoute || isTestTakerRoute) {
                  // For student/test_taker route, navigate back to daily challenge list
                  // Try to get classId from location state or construct from submission data
                  const classId = location.state?.classId || location.search?.match(/classId=([^&]+)/)?.[1];
                  const routePrefix = isTestTakerRoute ? '/test-taker' : '/student';
                  
                  if (classId) {
                    navigate(`${routePrefix}/classes/daily-challenges/${classId}`);
                  } else {
                    // Fallback: navigate to dashboard or daily challenges list
                    navigate(`${routePrefix}/dashboard`);
                  }
                } else if (dailyChallengeData?.backPath) {
                  navigate(dailyChallengeData.backPath);
                } else {
                  navigate(-1);
                }
              }}
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
                // Priority: Use location.state if available (when navigating back from AIGenerateFeedback)
                // Otherwise use dailyChallengeData or fallback to default
                let base;
                if (location?.state?.className && location?.state?.challengeName) {
                  // Build from location.state: "className / challengeName"
                  base = `${location.state.className} / ${location.state.challengeName}`;
                } else if (location?.state?.challengeName) {
                  // Only challengeName available
                  base = location.state.challengeName;
                } else if (location?.state?.className) {
                  // Only className available
                  base = location.state.className;
                } else {
                  // Fallback to dailyChallengeData or default
                  base = dailyChallengeData?.subtitle || t('dailyChallenge.dailyChallengeManagement');
                }
                
                const student = location?.state?.studentName || submissionData?.student?.name || '';
                return student ? `${base} / ${student}` : base;
              })()}
            </h2>
          </div>
          {/* Right actions */}
            {!isStudent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                <Button
                  icon={<FileTextOutlined />}
                  loading={savingFeedback}
                  onClick={() => { setOverallFeedbackDraft(teacherFeedback || ''); setOverallFeedbackModalVisible(true); }}
                className={`create-button ${theme}-create-button`}
              style={{
                height: '40px',
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '16px',
                padding: '0 24px',
                border: 'none',
                transition: 'all 0.3s ease',
                background: theme === 'sun'
                  ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                  : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                color: '#000000',
                boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)'
                }}
              >
                {(teacherFeedback && teacherFeedback.replace(/<[^>]*>/g,'').trim().length > 0) ? 'Edit Feedback' : 'Add Feedback'}
            </Button>
          </div>
            )}
        </div>
      </nav>
    </header>
  );

  return (
    <ThemedLayout customHeader={customHeader}>
      {/* Sidebar Toggle Button when collapsed - Show button on left edge */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          style={{
            position: 'fixed',
            left: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10001,
            background: theme === 'sun' ? 'rgba(113, 179, 253, 0.9)' : 'rgba(138, 122, 255, 0.9)',
            border: 'none',
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px',
            padding: '10px 8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <MenuOutlined />
        </button>
      )}
      <div className={`sdc-wrapper ${theme}-sdc-wrapper`} style={{ padding: '24px', position: 'relative' }}>
        <style>{`
          .ck-editor__editable_inline { min-height: 220px; }
          .ck-content { white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; color: #000 !important; }
          .ck.ck-toolbar .ck-toolbar__items { flex-wrap: wrap; }
           /* Make default AntD textareas taller by default (sidebar + modals) */
          .ant-input-textarea textarea { min-height: 160px; }
          .ant-modal .ant-input-textarea textarea { min-height: 160px; }
        `}</style>
        <Row gutter={24}>
          {/* Left Section - Student Info & Performance */}
          <Col 
            xs={24} 
            lg={isCollapsed ? 0 : 6}
            style={{ 
              transition: 'all 0.3s ease',
              overflowX: 'visible',
              overflowY: 'hidden',
              position: 'relative'
            }}
          >

            <div className="settings-scroll-container" style={{
              position: 'sticky', 
              top: '0px', 
              height: 'auto',
              maxHeight: 'calc(100vh - 40px)', 
              overflowY: 'auto', 
              overflowX: 'visible',
              paddingBottom: '80px', 
              
              paddingRight: '40px', 
              transition: 'all 0.3s ease',
              display: 'block',
              scrollbarWidth: 'none', /* Firefox */
              msOverflowStyle: 'none', /* IE and Edge */
            }}>
              <style>{`
                .settings-scroll-container::-webkit-scrollbar {
                  display: none; /* Chrome, Safari, Opera */
                }
              `}</style>
              <Card
                className={`settings-container-card ${theme}-settings-container-card`}
                style={{
                  borderRadius: '16px',
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
                  position: 'relative'
                }}
              >
                {/* Sidebar Toggle Button - Positioned at the right edge of Card */}
                <button
                  onClick={() => setIsCollapsed(true)}
                  style={{
                    position: 'absolute',
                    right: '-32px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1001,
                    background: theme === 'sun' ? 'rgba(113, 179, 253, 0.9)' : 'rgba(138, 122, 255, 0.9)',
                    border: 'none',
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px',
                    padding: '10px 8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <CloseOutlined />
                </button>

                  {/* Header with Tabs */}
                  <div style={{ 
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: theme === 'sun' 
                      ? '2px solid rgba(113, 179, 253, 0.15)' 
                      : '2px solid rgba(138, 122, 255, 0.15)'
                  }}>
                    {/* Tab Navigation */}
                    <div style={{
                      borderBottom: `1px solid ${theme === 'sun' ? '#e0e0e0' : 'rgba(255, 255, 255, 0.1)'}`,
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', gap: '0px', width: '100%' }}>
                        <button
                          onClick={() => setActiveTab('info')}
                          style={{
                            flex: 1,
                            padding: '6px 16px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === 'info' ? 500 : 400,
                            transition: 'all 0.2s ease',
                            background: activeTab === 'info'
                              ? (theme === 'sun' 
                                  ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.06) 0%, rgba(148, 163, 184, 0.03) 100%)'
                                  : 'linear-gradient(135deg, rgba(226, 232, 240, 0.08) 0%, rgba(226, 232, 240, 0.04) 100%)')
                              : 'transparent',
                            border: activeTab === 'info'
                              ? `1px solid ${theme === 'sun' ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.2)'}`
                              : 'none',
                            borderBottom: activeTab === 'info'
                              ? `2px solid ${theme === 'sun' ? '#1a73e8' : '#8B5CF6'}`
                              : '2px solid transparent',
                            borderRadius: '8px 8px 0 0',
                            color: activeTab === 'info'
                              ? (theme === 'sun' ? '#1a73e8' : '#8B5CF6')
                              : (theme === 'sun' ? '#5f6368' : 'rgba(255, 255, 255, 0.6)'),
                            marginBottom: '-1px',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            if (activeTab !== 'info') {
                              e.currentTarget.style.color = theme === 'sun' ? '#1a73e8' : '#8B5CF6';
                              e.currentTarget.style.backgroundColor = theme === 'sun' ? 'rgba(26, 115, 232, 0.04)' : 'rgba(139, 92, 246, 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeTab !== 'info') {
                              e.currentTarget.style.color = theme === 'sun' ? '#5f6368' : 'rgba(255, 255, 255, 0.6)';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          Info
                        </button>
                        <button
                          onClick={() => setActiveTab('questions')}
                          style={{
                            flex: 1,
                            padding: '6px 16px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: activeTab === 'questions' ? 500 : 400,
                            transition: 'all 0.2s ease',
                            background: activeTab === 'questions'
                              ? (theme === 'sun' 
                                  ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.06) 0%, rgba(148, 163, 184, 0.03) 100%)'
                                  : 'linear-gradient(135deg, rgba(226, 232, 240, 0.08) 0%, rgba(226, 232, 240, 0.04) 100%)')
                              : 'transparent',
                            border: activeTab === 'questions'
                              ? `1px solid ${theme === 'sun' ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.2)'}`
                              : 'none',
                            borderBottom: activeTab === 'questions'
                              ? `2px solid ${theme === 'sun' ? '#1a73e8' : '#8B5CF6'}`
                              : '2px solid transparent',
                            borderRadius: '8px 8px 0 0',
                            color: activeTab === 'questions'
                              ? (theme === 'sun' ? '#1a73e8' : '#8B5CF6')
                              : (theme === 'sun' ? '#5f6368' : 'rgba(255, 255, 255, 0.6)'),
                            marginBottom: '-1px',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            if (activeTab !== 'questions') {
                              e.currentTarget.style.color = theme === 'sun' ? '#1a73e8' : '#8B5CF6';
                              e.currentTarget.style.backgroundColor = theme === 'sun' ? 'rgba(26, 115, 232, 0.04)' : 'rgba(139, 92, 246, 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeTab !== 'questions') {
                              e.currentTarget.style.color = theme === 'sun' ? '#5f6368' : 'rgba(255, 255, 255, 0.6)';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          Questions
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'info' ? (
                    <>
                      {/* Performance & Student Information Summary */}
                      <div style={{ marginBottom: '16px' }}>
                        <div 
                          onClick={() => setIsPerformanceCollapsed(!isPerformanceCollapsed)}
                      style={{ 
                        cursor: 'pointer',
                        marginBottom: '12px',
                        padding: '3px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: theme === 'sun' 
                          ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.06) 0%, rgba(148, 163, 184, 0.03) 100%)'
                          : 'linear-gradient(135deg, rgba(226, 232, 240, 0.08) 0%, rgba(226, 232, 240, 0.04) 100%)',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'sun' ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.2)'}`,
                        transition: 'all 0.3s ease',
                        boxShadow: theme === 'sun' 
                          ? '0 1px 4px rgba(148, 163, 184, 0.05)' 
                          : '0 1px 4px rgba(226, 232, 240, 0.08)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme === 'sun' 
                          ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(148, 163, 184, 0.06) 100%)'
                          : 'linear-gradient(135deg, rgba(226, 232, 240, 0.12) 0%, rgba(226, 232, 240, 0.08) 100%)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = theme === 'sun' 
                          ? '0 2px 8px rgba(148, 163, 184, 0.1)' 
                          : '0 2px 8px rgba(226, 232, 240, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = theme === 'sun' 
                          ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.06) 0%, rgba(148, 163, 184, 0.03) 100%)'
                          : 'linear-gradient(135deg, rgba(226, 232, 240, 0.08) 0%, rgba(226, 232, 240, 0.04) 100%)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = theme === 'sun' 
                          ? '0 1px 4px rgba(148, 163, 184, 0.05)' 
                          : '0 1px 4px rgba(226, 232, 240, 0.08)';
                      }}
                    >
                      <Typography.Title 
                        level={5} 
                        style={{ 
                          margin: 0,
                          fontSize: '16px', 
                          fontWeight: 500, 
                          color: theme === 'sun' ? '#4a5568' : '#e2e8f0',
                          userSelect: 'none'
                        }}
                      >
                        Performance
                      </Typography.Title>
                      {isPerformanceCollapsed ? (
                        <DownOutlined style={{ fontSize: '14px', color: theme === 'sun' ? '#4a5568' : '#e2e8f0' }} />
                      ) : (
                        <UpOutlined style={{ fontSize: '14px', color: theme === 'sun' ? '#4a5568' : '#e2e8f0' }} />
                      )}
                    </div>
                    
                    {!isPerformanceCollapsed && (
                      <>
                        {/* Score Circle */}
                        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            {/* Circular Score Display */}
                            <div
                              style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                background: theme === 'sun' ? '#E8F5E9' : 'rgba(232, 245, 233, 0.8)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                position: 'relative',
                                border: `3px solid ${theme === 'sun' ? '#C8E6C9' : 'rgba(200, 230, 201, 0.6)'}`
                              }}
                            >
                              {(() => {
                                // For auto-graded types (grammar, reading, listening), show score if available
                                // For writing/speaking, require both score and teacherFeedback
                                const hasScore = submission.score != null && submission.score !== undefined;
                                const hasFeedback = teacherFeedback && teacherFeedback.replace(/<[^>]*>/g,'').trim().length > 0;
                                const shouldShowScore = hasWritingOrSpeaking 
                                  ? (hasScore && hasFeedback) 
                                  : hasScore;
                                const scoreDisplay = hasScore ? `${submission.score}/10` : '-';
                                const dynamicFontSize = scoreDisplay.length > 5 ? 28 : 36; // prevent wrapping for long scores
                                
                                return shouldShowScore ? (
                                  <>
                                    <Typography.Text
                                      strong
                                      style={{
                                        fontSize: `${dynamicFontSize}px`,
                                        fontWeight: 700,
                                        color: '#4CAF50',
                                        lineHeight: '1',
                                        marginBottom: '4px',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      {scoreDisplay}
                                    </Typography.Text>
                                    <Typography.Text
                                      style={{
                                        fontSize: '12px',
                                        color: theme === 'sun' ? '#666' : '#999',
                                        fontWeight: 400
                                      }}
                                    >
                                      Score
                                    </Typography.Text>
                                  </>
                                ) : (
                                  <>
                                    <Typography.Text
                                      strong
                                      style={{
                                        fontSize: '36px',
                                        fontWeight: 700,
                                        color: theme === 'sun' ? '#999' : '#666',
                                        lineHeight: '1',
                                        marginBottom: '4px',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      -
                                    </Typography.Text>
                                    <Typography.Text
                                      style={{
                                        fontSize: '12px',
                                        color: theme === 'sun' ? '#666' : '#999',
                                        fontWeight: 400
                                      }}
                                    >
                                      Score
                                    </Typography.Text>
                                  </>
                                );
                              })()}
                            </div>
                            {/* Edit score button removed as requested */}
                          </div>
                        </div>


                        {/* Question Breakdown Grid (hidden for Writing/Speaking submissions) */}
                        {!hasWritingOrSpeaking && (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '12px',
                            marginBottom: '20px'
                          }}>
                          {/* Total Card */}
                          <div style={{
                            padding: '16px',
                            background: theme === 'sun' ? '#F5F5F5' : 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',                                
                            height: '50px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${theme === 'sun' ? '#E0E0E0' : 'rgba(255, 255, 255, 0.1)'}`
                          }}>
                            <Typography.Text
                              strong
                              style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                color: '#1890ff',
                                display: 'block',
                                marginBottom: '0px',
                                lineHeight: '1'
                              }}
                            >
                              {(submission.correctCount != null && submission.incorrectCount != null && submission.unansweredCount != null) 
                                ? (submission.correctCount + submission.incorrectCount + submission.unansweredCount)
                                : '-'}
                            </Typography.Text>
                            <Typography.Text
                              style={{
                                fontSize: '12px',
                                color: theme === 'sun' ? '#666' : '#999',
                                display: 'block'
                              }}
                            >
                              Total
                            </Typography.Text>
                          </div>

                          {/* Correct Card */}
                          <div style={{
                            padding: '16px',
                            background: theme === 'sun' ? '#F5F5F5' : 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            height: '50px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${theme === 'sun' ? '#E0E0E0' : 'rgba(255, 255, 255, 0.1)'}`
                          }}>
                            <Typography.Text
                              strong
                              style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                color: '#1890ff',
                                display: 'block',
                                marginBottom: '0px',
                                lineHeight: '1'
                              }}
                            >
                              {submission.correctCount != null ? submission.correctCount : '-'}
                            </Typography.Text>
                            <Typography.Text
                              style={{
                                fontSize: '12px',
                                color: theme === 'sun' ? '#666' : '#999',
                                display: 'block'
                              }}
                            >
                              Correct
                            </Typography.Text>
                          </div>

                          {/* Incorrect Card */}
                          <div style={{
                            padding: '16px',
                            background: theme === 'sun' ? '#F5F5F5' : 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            height: '50px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${theme === 'sun' ? '#E0E0E0' : 'rgba(255, 255, 255, 0.1)'}`
                          }}>
                            <Typography.Text
                              strong
                              style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                color: '#1890ff',
                                display: 'block',
                                marginBottom: '0px',
                                lineHeight: '1'
                              }}
                            >
                              {submission.incorrectCount != null ? submission.incorrectCount : '-'}
                            </Typography.Text>
                            <Typography.Text
                              style={{
                                fontSize: '12px',
                                color: theme === 'sun' ? '#666' : '#999',
                                display: 'block'
                              }}
                            >
                              Incorrect
                            </Typography.Text>
                          </div>

                          {/* Unanswered Card */}
                          <div style={{
                            padding: '16px',
                            background: theme === 'sun' ? '#F5F5F5' : 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            height: '50px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${theme === 'sun' ? '#E0E0E0' : 'rgba(255, 255, 255, 0.1)'}`
                          }}>
                            <Typography.Text
                              strong
                              style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                color: '#1890ff',
                                display: 'block',
                                marginBottom: '0px',
                                lineHeight: '1'
                              }}
                            >
                              {submission.unansweredCount != null ? submission.unansweredCount : '-'}
                            </Typography.Text>
                            <Typography.Text
                              style={{
                                fontSize: '12px',
                                color: theme === 'sun' ? '#666' : '#999',
                                display: 'block'
                              }}
                            >
                              Unanswered
                            </Typography.Text>
                          </div>
                          </div>
                        )}

                        {/* Submission Details */}
                        <div style={{
                          padding: '12px 0',
                          borderTop: `1px solid ${theme === 'sun' ? '#E0E0E0' : 'rgba(255, 255, 255, 0.1)'}`
                        }}>
                          <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            
                            {/* New fields from grading summary */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography.Text style={{ fontSize: '12px', color: theme === 'sun' ? '#666' : '#999' }}>
                                Total Weight:
                              </Typography.Text>
                              <Typography.Text style={{ fontSize: '12px', fontWeight: 500, color: theme === 'sun' ? '#000' : '#fff' }}>
                                {submissionData.challenge?.totalWeight != null ? submissionData.challenge.totalWeight : '-'}
                              </Typography.Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography.Text style={{ fontSize: '12px', color: theme === 'sun' ? '#666' : '#999' }}>
                                Max Possible Weight:
                              </Typography.Text>
                              <Typography.Text style={{ fontSize: '12px', fontWeight: 500, color: theme === 'sun' ? '#000' : '#fff' }}>
                                {submissionData.challenge?.maxPossibleWeight != null ? submissionData.challenge.maxPossibleWeight : '-'}
                              </Typography.Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography.Text style={{ fontSize: '12px', color: theme === 'sun' ? '#666' : '#999' }}>
                                Total Questions:
                              </Typography.Text>
                              <Typography.Text style={{ fontSize: '12px', fontWeight: 500, color: theme === 'sun' ? '#000' : '#fff' }}>
                                {submissionData.challenge?.totalQuestions != null ? submissionData.challenge.totalQuestions : '-'}
                              </Typography.Text>
                            </div>
                          </Space>
                        </div>
                      </>
                      )}
                      </div>

                      <Divider style={{ margin: '16px 0' }} />

                      {/* Teacher Feedback Section */}
                      <div style={{ marginBottom: '16px' }}>
                    <div 
                      onClick={() => setIsTeacherFeedbackCollapsed(!isTeacherFeedbackCollapsed)}
                      style={{ 
                        cursor: 'pointer',
                        marginBottom: '12px',
                        padding: '3px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: theme === 'sun' 
                          ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.06) 0%, rgba(148, 163, 184, 0.03) 100%)'
                          : 'linear-gradient(135deg, rgba(226, 232, 240, 0.08) 0%, rgba(226, 232, 240, 0.04) 100%)',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'sun' ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.2)'}`,
                        transition: 'all 0.3s ease',
                        boxShadow: theme === 'sun' 
                          ? '0 1px 4px rgba(148, 163, 184, 0.05)' 
                          : '0 1px 4px rgba(226, 232, 240, 0.08)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme === 'sun' 
                          ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(148, 163, 184, 0.06) 100%)'
                          : 'linear-gradient(135deg, rgba(226, 232, 240, 0.12) 0%, rgba(226, 232, 240, 0.08) 100%)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = theme === 'sun' 
                          ? '0 2px 8px rgba(148, 163, 184, 0.1)' 
                          : '0 2px 8px rgba(226, 232, 240, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = theme === 'sun' 
                          ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.06) 0%, rgba(148, 163, 184, 0.03) 100%)'
                          : 'linear-gradient(135deg, rgba(226, 232, 240, 0.08) 0%, rgba(226, 232, 240, 0.04) 100%)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = theme === 'sun' 
                          ? '0 1px 4px rgba(148, 163, 184, 0.05)' 
                          : '0 1px 4px rgba(226, 232, 240, 0.08)';
                      }}
                    >
                      <Typography.Title 
                        level={5} 
                        style={{ 
                          margin: 0,
                          fontSize: '16px', 
                          fontWeight: 500, 
                          color: theme === 'sun' ? '#4a5568' : '#e2e8f0',
                          userSelect: 'none'
                        }}
                      >
                        Teacher Feedback
                      </Typography.Title>
                      {isTeacherFeedbackCollapsed ? (
                        <DownOutlined style={{ fontSize: '14px', color: theme === 'sun' ? '#4a5568' : '#e2e8f0' }} />
                      ) : (
                        <UpOutlined style={{ fontSize: '14px', color: theme === 'sun' ? '#4a5568' : '#e2e8f0' }} />
                      )}
                    </div>
                    {!isTeacherFeedbackCollapsed && (() => {
                      const displayFeedback = teacherFeedback 
                        || submissionData?.submission?.teacherFeedback 
                        || submissionData?.teacherFeedback 
                        || '';
                      return (
                        <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '16px', background: theme === 'sun' ? '#ffffff' : 'rgba(255,255,255,0.03)' }}>
                          <div style={{ fontSize: '15px', lineHeight: '1.8', color: theme === 'sun' ? '#333' : '#e2e8f0' }}
                            dangerouslySetInnerHTML={{ __html: displayFeedback || '<i>No feedback yet</i>' }} />
                        </div>
                      );
                    })()}
                      </div>

                      <Divider style={{ margin: '16px 0' }} />

                      {/* Anti-Cheat Summary */}
                      {antiCheatData && (
                        <div style={{ marginBottom: '16px' }}>
                          <div 
                            onClick={() => setIsAntiCheatCollapsed(!isAntiCheatCollapsed)}
                        style={{ 
                          cursor: 'pointer',
                          marginBottom: '12px',
                          padding: '3px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          background: theme === 'sun' 
                            ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.06) 0%, rgba(148, 163, 184, 0.03) 100%)'
                            : 'linear-gradient(135deg, rgba(226, 232, 240, 0.08) 0%, rgba(226, 232, 240, 0.04) 100%)',
                          borderRadius: '8px',
                          border: `1px solid ${theme === 'sun' ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.2)'}`,
                          transition: 'all 0.3s ease',
                          boxShadow: theme === 'sun' 
                            ? '0 1px 4px rgba(148, 163, 184, 0.05)' 
                            : '0 1px 4px rgba(226, 232, 240, 0.08)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = theme === 'sun' 
                            ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(148, 163, 184, 0.06) 100%)'
                            : 'linear-gradient(135deg, rgba(226, 232, 240, 0.12) 0%, rgba(226, 232, 240, 0.08) 100%)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = theme === 'sun' 
                            ? '0 2px 8px rgba(148, 163, 184, 0.1)' 
                            : '0 2px 8px rgba(226, 232, 240, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = theme === 'sun' 
                            ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.06) 0%, rgba(148, 163, 184, 0.03) 100%)'
                            : 'linear-gradient(135deg, rgba(226, 232, 240, 0.08) 0%, rgba(226, 232, 240, 0.04) 100%)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = theme === 'sun' 
                            ? '0 1px 4px rgba(148, 163, 184, 0.05)' 
                            : '0 1px 4px rgba(226, 232, 240, 0.08)';
                        }}
                      >
                        <Typography.Title 
                          level={5} 
                          style={{ 
                            margin: 0,
                            fontSize: '16px', 
                            fontWeight: 500, 
                            color: theme === 'sun' ? '#4a5568' : '#e2e8f0',
                            userSelect: 'none'
                          }}
                        >
                          Anti-Cheat
                        </Typography.Title>
                        {isAntiCheatCollapsed ? (
                          <DownOutlined style={{ fontSize: '14px', color: theme === 'sun' ? '#4a5568' : '#e2e8f0' }} />
                        ) : (
                          <UpOutlined style={{ fontSize: '14px', color: theme === 'sun' ? '#4a5568' : '#e2e8f0' }} />
                        )}
                          </div>
                          {!isAntiCheatCollapsed && (
                            <>
                              {/* Violation Cards */}
                              <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                          {/* Tab Switch Card */}
                          <div style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            background: theme === 'sun' ? '#FFFBEA' : 'rgba(251,140,0,0.08)',
                            border: `1px solid ${theme === 'sun' ? 'rgba(251,140,0,0.25)' : 'rgba(251,140,0,0.25)'}`
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff9800', marginBottom: '4px' }}>
                              <SwapOutlined />
                              <span style={{ fontSize: '12px' }}>Tab switch</span>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#000' }}>{antiCheatData.tabBlurCount}</div>
                          </div>

                          {/* Copy Card */}
                          <div style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            background: theme === 'sun' ? '#F3F8FF' : 'rgba(24,144,255,0.08)',
                            border: `1px solid ${theme === 'sun' ? 'rgba(24,144,255,0.25)' : 'rgba(24,144,255,0.25)'}`
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme === 'sun' ? '#1e40af' : '#aab', marginBottom: '4px' }}>
                              <CopyOutlined />
                              <span style={{ fontSize: '12px' }}>Copy</span>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#000' }}>{antiCheatData.copyCount}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                          {/* Paste Card */}
                          <div style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            background: theme === 'sun' ? '#F7ECFF' : 'rgba(142,36,170,0.08)',
                            border: `1px solid ${theme === 'sun' ? 'rgba(142,36,170,0.25)' : 'rgba(142,36,170,0.25)'}`
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme === 'sun' ? '#6A1B9A' : '#cbb', marginBottom: '4px' }}>
                              <FileTextOutlined />
                              <span style={{ fontSize: '12px' }}>Paste</span>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#000' }}>{antiCheatData.pasteCount}</div>
                          </div>

                          {/* Total Violations Card */}
                          <div style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            background: theme === 'sun' ? '#F5F9FF' : 'rgba(24,144,255,0.08)',
                            border: `1px solid ${theme === 'sun' ? 'rgba(24,144,255,0.2)' : 'rgba(24,144,255,0.2)'}`
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme === 'sun' ? '#1e40af' : '#aab', marginBottom: '4px' }}>
                              <ClockCircleOutlined />
                              <span style={{ fontSize: '12px' }}>Total violations</span>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#000' }}>{antiCheatData.totalViolations}</div>
                          </div>
                        </div>

                        {/* View Detail Button */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                          <Button
                            icon={<EyeOutlined />}
                            onClick={() => setAntiCheatModalVisible(true)}
                            disabled={!antiCheatData || !Array.isArray(antiCheatData.events) || antiCheatData.events.length === 0}
                            className={`create-button ${theme}-create-button`}
                            style={{
                              height: '36px',
                              borderRadius: '8px',
                              fontWeight: 500,
                              fontSize: '14px',
                              padding: '0 18px',
                              border: 'none',
                              transition: 'all 0.3s ease',
                              background: theme === 'sun'
                                ? 'linear-gradient(135deg, #FFD36E, #FFB020)'
                                : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                              color: '#000000',
                              boxShadow: theme === 'sun' ? '0 2px 8px rgba(255, 176, 32, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)'
                            }}
                          >
                            View detail
                          </Button>
                        </div>
                      </div>

                      {/* Total Tab Blur Duration (hidden per new UI) */}
                      {false && antiCheatData.totalTabBlurDuration > 0 && (
                        <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                          <Typography.Text style={{ fontSize: '12px', fontWeight: 400, color: theme === 'sun' ? '#666' : '#999', display: 'block', marginBottom: '4px' }}>
                            Total time away from tab
                          </Typography.Text>
                          <Typography.Text style={{ fontSize: '14px', color: theme === 'sun' ? '#000' : '#fff' }}>
                            {Math.floor(antiCheatData.totalTabBlurDuration / 1000)} seconds
                            {antiCheatData.totalTabBlurDuration >= 60000 && ` (${Math.floor(antiCheatData.totalTabBlurDuration / 60000)} minutes)`}
                          </Typography.Text>
                        </div>
                      )}

                      {/* Activity Log (hidden in sidebar; open via modal) */}
                      {false && antiCheatData.events && antiCheatData.events.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <Typography.Title level={5} style={{ marginTop: 0, marginBottom: '10px', fontSize: '14px', fontWeight: 600, textAlign: 'center', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                            ACTIVITY LOG
                          </Typography.Title>
                          <div 
                            className="activity-log-scrollbar"
                            style={{ 
                              maxHeight: '300px', 
                              overflowY: 'auto', 
                              padding: '8px',
                              background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.03)',
                              borderRadius: '8px',
                              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
                              scrollbarWidth: 'none', /* Firefox */
                              msOverflowStyle: 'none', /* IE and Edge */
                            }}
                          >
                            <style>{`
                              .activity-log-scrollbar::-webkit-scrollbar { 
                                display: none; /* Chrome, Safari, Opera */
                              }
                            `}</style>
                            {antiCheatData.events.map((eventItem, index) => {
                              // Get event icon and description
                              let icon, description, color;
                              switch (eventItem.event) {
                                case 'START':
                                  icon = <PlayCircleOutlined />;
                                  description = 'Started test';
                                  color = '#52c41a';
                                  break;
                                case 'TAB_BLUR':
                                  icon = <SwapOutlined />;
                                  description = eventItem.durationMs 
                                    ? `Content hidden to return (${Math.floor(eventItem.durationMs / 1000)}s)`
                                    : 'Content hidden to return';
                                  color = '#ff9800';
                                  break;
                                case 'COPY':
                                  icon = <CopyOutlined />;
                                  description = eventItem.content || 'Blocked Ctrl+C / Ctrl+Insert';
                                  color = '#f44336';
                                  break;
                                case 'PASTE':
                                  icon = <FileTextOutlined />;
                                  description = eventItem.content || 'Blocked Ctrl+V / Shift+Insert';
                                  color = '#9c27b0';
                                  break;
                                case 'ANSWER_CHANGE':
                                  icon = <EditOutlined />;
                                  description = `Answer changed: ${eventItem.oldValue?.join(', ') || 'N/A'} → ${eventItem.newValue?.join(', ') || 'N/A'}`;
                                  color = '#1890ff';
                                  break;
                                default:
                                  icon = <ClockCircleOutlined />;
                                  description = eventItem.event;
                                  color = '#666';
                              }

                              // Format timestamp
                              const formatTimestamp = (timestamp) => {
                                if (!timestamp) return '';
                                try {
                                  const date = new Date(timestamp);
                                  const hours = date.getHours().toString().padStart(2, '0');
                                  const minutes = date.getMinutes().toString().padStart(2, '0');
                                  const seconds = date.getSeconds().toString().padStart(2, '0');
                                  const day = date.getDate();
                                  const month = date.getMonth() + 1;
                                  const year = date.getFullYear();
                                  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
                                } catch {
                                  return timestamp;
                                }
                              };

                              return (
                                <div 
                                  key={index}
                                  style={{ 
                                    display: 'flex',
                                    gap: '8px',
                                    padding: '8px 10px',
                                    marginBottom: '8px',
                                    background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '6px',
                                    border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
                                    fontSize: '12px'
                                  }}
                                >
                                  <div style={{ 
                                    color, 
                                    fontSize: '14px', 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    flexShrink: 0
                                  }}>
                                    {icon}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ 
                                      fontWeight: 600,
                                      color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                      marginBottom: '2px',
                                      fontSize: '11px'
                                    }}>
                                      {eventItem.event.replace('_', ' ')}
                                      {eventItem.questionId && (
                                        <span style={{ 
                                          color: theme === 'sun' ? '#666' : '#999',
                                          marginLeft: '6px',
                                          fontWeight: 400
                                        }}>
                                          (Q{eventItem.questionId})
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ 
                                      color: theme === 'sun' ? '#666' : '#999',
                                      fontSize: '11px',
                                      lineHeight: '1.4'
                                    }}>
                                      {description}
                                    </div>
                                  </div>
                                  <div style={{ 
                                    fontSize: '10px',
                                    color: theme === 'sun' ? '#999' : '#777',
                                    flexShrink: 0,
                                    textAlign: 'right',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {formatTimestamp(eventItem.timestamp)}
                                  </div>
                                </div>
                              );
                            })}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                    </>
                  ) : (
                    /* Questions Tab */
                    <>
                      <div className="question-sidebar-header" style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: theme === 'sun' ? '2px solid rgba(113, 179, 253, 0.15)' : '2px solid rgba(138, 122, 255, 0.15)' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 700, textAlign: 'center', color: 'rgb(24, 144, 255)', margin: 0 }}>Questions</h3>
                      </div>
                      <div style={{ 
                        maxHeight: 'calc(100vh - 280px)', 
                        overflowY: 'auto',
                        paddingRight: '8px'
                      }}>
                        <div className="question-sidebar-list">
                          {getQuestionNavigation().map((item) => (
                            <div
                              key={item.id}
                              className={`question-sidebar-item ${item.type === 'section' ? 'question-sidebar-section' : ''}`}
                              onClick={() => scrollToQuestion(item.id)}
                              style={{ 
                                fontWeight: 'normal', 
                                textAlign: 'center', 
                                color: theme === 'sun' ? '#000000' : '#FFFFFF',
                                padding: '10px',
                                marginBottom: '4px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                transition: 'all 0.2s ease',
                                fontSize: '14px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = theme === 'sun' 
                                  ? 'rgba(24, 144, 255, 0.1)' 
                                  : 'rgba(138, 122, 255, 0.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              {item.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </div>
            </Col>

          {/* Right Section - Questions Review */}
          <Col 
            xs={24} 
            lg={isCollapsed ? 24 : 18}
            style={{ 
              transition: 'all 0.3s ease'
            }}
          >
            <div className="sdc-questions-review-section" style={{ padding: '0' }}>
          {/* Grammar & Vocabulary Questions */}
          {questions.length > 0 && (
            <div 
              className={`question-item ${theme}-question-item`} 
              style={{ marginBottom: '24px', borderRadius: '16px', padding: '24px', border: '2px solid', borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)' }}>
              <div className="question-header" style={{ paddingBottom: '14px', marginBottom: '16px', borderBottom: '2px solid', borderBottomColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)' }}>
              
              </div>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {questions.map((q, idx) => (
                  <div key={q.id} ref={el => questionRefs.current[`gv-${q.id}`] = el}>
                    {renderQuestion(q, idx)}
                  </div>
                ))}
          </Space>
        </div>
          )}

          {/* Reading Sections */}
          {readingSections.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
            
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {readingSections.map((section, idx) => (
                  <div key={section.id || idx} ref={el => questionRefs.current[`reading-${idx + 1}`] = el}>
                    {renderReadingSection(section, idx)}
                  </div>
                ))}
              </Space>
                  </div>
          )}

          {/* Listening Sections */}
          {listeningSections.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
             
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {listeningSections.map((section, idx) => (
                  <div key={section.id || idx} ref={el => questionRefs.current[`listening-${idx + 1}`] = el}>
                    {renderListeningSection(section, idx)}
                  </div>
                ))}
              </Space>
                  </div>
          )}

          {/* Writing Sections */}
          {writingSections.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
            
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {writingSections.map((section, idx) => (
                  <div key={section.id || idx} ref={el => questionRefs.current[`writing-${idx + 1}`] = el}>
                    {renderWritingSection(section, idx)}
                  </div>
                ))}
              </Space>
                        </div>
                  )}

          {/* Speaking Sections */}
          {speakingSections.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
            
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {speakingSections.map((section, idx) => (
                  <div key={section.id || idx} ref={el => questionRefs.current[`speaking-${idx + 1}`] = el}>
                    {renderSpeakingSection(section, idx)}
                  </div>
                ))}
              </Space>
                    </div>
                  )}
                  </div>
          </Col>
        </Row>
                </div>

      {/* Feedback Modal */}
      <Modal
        title={
          <div
            style={{
              fontSize: '28px',
              fontWeight: '600',
              color: 'rgb(24, 144, 255)',
              textAlign: 'center',
              padding: '10px 0',
            }}>
            {feedbackModal.isEdit ? 'Edit Score/Feedback' : 'Add Score/Feedback'}
            </div>
        }
        open={feedbackModal.visible}
        onCancel={handleCloseFeedbackModal}
        width={600}
        footer={[
          <Button 
            key="cancel" 
            onClick={handleCloseFeedbackModal}
            style={{
              height: '32px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '4px 15px',
              width: '100px'
            }}>
            Cancel
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            onClick={handleSaveFeedback}
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
              if (theme === 'sun') {
                e.currentTarget.style.background = 'rgb(93, 159, 233)';
              } else {
                e.currentTarget.style.background = 'linear-gradient(135deg, #9C8FB0 19%, #9588AB 64%, #726795 75%, #9A95B0 97%, #5D4F7F 100%)';
              }
            }}
            onMouseLeave={(e) => {
              if (theme === 'sun') {
                e.currentTarget.style.background = 'rgb(113, 179, 253)';
              } else {
                e.currentTarget.style.background = 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)';
              }
            }}>
            {feedbackModal.isEdit ? 'Update' : 'Add'}
          </Button>
        ]}>
        <div style={{ padding: '20px 0' }}>
          {feedbackModal.type === 'section' && (
            <div style={{ marginBottom: '12px' }}>
              <Typography.Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>Score</Typography.Text>
              <Input
                type="number"
                min="0"
                value={feedbackModal.score}
                onChange={(e) => setFeedbackModal(prev => ({ ...prev, score: e.target.value }))}
                placeholder="Enter score for this question"
              />
            </div>
          )}
          <div style={{ border: '1px solid #eee', borderRadius: '6px', overflow: 'visible' }}>
            <CKEditor
              editor={ClassicEditor}
              data={feedbackModal.feedback}
              onChange={(event, editor) => {
                const data = editor.getData();
                setFeedbackModal(prev => ({ ...prev, feedback: data }));
              }}
              config={{
                toolbar: {
                  items: ['bold','italic','underline','|','bulletedList','numberedList','|','link','undo','redo'],
                  shouldNotGroupWhenFull: true
                }
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Anti-Cheat Log Modal */}
      <Modal
        title={
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'rgb(24, 144, 255)',
              textAlign: 'center',
              padding: '6px 0'
            }}
          >
            Anti-Cheat Log
          </div>
        }
        open={antiCheatModalVisible}
        centered
        onCancel={() => setAntiCheatModalVisible(false)}
        width={860}
        style={{ maxWidth: '92vw' }}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'hidden', overflowX: 'hidden' }}
        footer={[
          <Button key="close" onClick={() => setAntiCheatModalVisible(false)}
            style={{ height: '36px', borderRadius: '6px', padding: '0 22px' }}
          >
            Close
          </Button>
        ]}
      >
        {(() => {
          // Prefer logs provided via navigation state; fallback to antiCheatData.events
          const logsFromState = Array.isArray(location?.state?.logs) ? location.state.logs : null;
          const events = logsFromState || (Array.isArray(antiCheatData?.events) ? antiCheatData.events : []);
          // Hide ANSWER_CHANGE from display and counts as requested
          const baseVisibleEvents = events.filter(e => e.event !== 'ANSWER_CHANGE');

          // No filtering – show all visible events
          const filteredEvents = baseVisibleEvents;

          // Compute totals from filtered events only
          const totalTabSwitch = filteredEvents.filter(e => e.event === 'TAB_SWITCH' || e.event === 'TAB_BLUR').length;
          const totalCopy = filteredEvents.filter(e => e.event === 'COPY' || e.event === 'COPY_ATTEMPT').length;
          const totalPaste = filteredEvents.filter(e => e.event === 'PASTE' || e.event === 'PASTE_ATTEMPT').length;
          const totalViolations = filteredEvents.length;

          // Pagination
          const startIdx = (antiCheatPage - 1) * antiCheatPageSize;
          const endIdx = startIdx + antiCheatPageSize;
          const pagedEvents = filteredEvents.slice(startIdx, endIdx);
          const formatTimestamp = (timestamp) => {
            if (!timestamp) return '';
            try {
              const date = new Date(timestamp);
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              const seconds = date.getSeconds().toString().padStart(2, '0');
              const day = date.getDate();
              const month = date.getMonth() + 1;
              const year = date.getFullYear();
              return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
            } catch {
              return String(timestamp);
            }
          };
          const getEventMeta = (evt) => {
            switch (evt) {
              case 'START':
                return { icon: <PlayCircleOutlined />, color: '#52c41a', label: 'Started test' };
              case 'TAB_SWITCH':
              case 'TAB_BLUR': // unify as Tab switch (data source only uses TAB_SWITCH)
                return { icon: <SwapOutlined />, color: '#ff9800', label: 'Tab switch' };
              case 'COPY':
              case 'COPY_ATTEMPT':
                return { icon: <CopyOutlined />, color: '#f44336', label: 'Copy attempt' };
              case 'PASTE':
              case 'PASTE_ATTEMPT':
                return { icon: <FileTextOutlined />, color: '#9c27b0', label: 'Paste attempt' };
              case 'ANSWER_CHANGE':
                return { icon: <EditOutlined />, color: '#1890ff', label: 'Answer changed' };
              default:
                return { icon: <ClockCircleOutlined />, color: '#666', label: evt };
            }
          };
          const getEventTitle = (evt) => {
            switch (evt) {
              case 'START':
                return 'START';
              case 'TAB_SWITCH':
              case 'TAB_BLUR':
                return 'TAB SWITCH';
              case 'COPY':
              case 'COPY_ATTEMPT':
                return 'COPY';
              case 'PASTE':
              case 'PASTE_ATTEMPT':
                return 'PASTE';
              case 'ANSWER_CHANGE':
                return 'ANSWER CHANGE';
              default:
                return String(evt || '').replace('_', ' ').toUpperCase();
            }
          };
          return (
            <div style={{
              background: theme === 'sun' ? 'linear-gradient(135deg, #F8FBFF 0%, #FFFFFF 100%)' : 'transparent',
              borderRadius: '12px',
              padding: '8px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '260px 1fr',
                gap: '12px',
                alignItems: 'start'
              }}>
                {/* Left: Stats */}
                <div style={{
                  background: theme === 'sun' ? '#FFFFFF' : 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  border: `1px solid ${theme === 'sun' ? 'rgba(24,144,255,0.15)' : 'rgba(255,255,255,0.1)'}`,
                  padding: '12px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    <div style={{ padding: '10px', borderRadius: '8px', background: theme === 'sun' ? '#F5F9FF' : 'rgba(24,144,255,0.08)', border: `1px solid ${theme === 'sun' ? 'rgba(24,144,255,0.2)' : 'rgba(24,144,255,0.2)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme === 'sun' ? '#1e40af' : '#aab' }}>
                        <ClockCircleOutlined />
                        <span style={{ fontSize: '12px' }}>Total events</span>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700 }}>{totalViolations}</div>
                    </div>
                    <div style={{ padding: '10px', borderRadius: '8px', background: theme === 'sun' ? '#FFFBEA' : 'rgba(251,140,0,0.08)', border: `1px solid ${theme === 'sun' ? 'rgba(251,140,0,0.25)' : 'rgba(251,140,0,0.25)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff9800' }}>
                        <SwapOutlined />
                        <span style={{ fontSize: '12px' }}>Tab switches</span>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700 }}>{totalTabSwitch}</div>
                    </div>
                    <div style={{ padding: '10px', borderRadius: '8px', background: theme === 'sun' ? '#F3F8FF' : 'rgba(24,144,255,0.08)', border: `1px solid ${theme === 'sun' ? 'rgba(24,144,255,0.25)' : 'rgba(24,144,255,0.25)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme === 'sun' ? '#1e40af' : '#aab' }}>
                        <CopyOutlined />
                        <span style={{ fontSize: '12px' }}>Copy attempts</span>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700 }}>{totalCopy}</div>
                    </div>
                    <div style={{ padding: '10px', borderRadius: '8px', background: theme === 'sun' ? '#F7ECFF' : 'rgba(142,36,170,0.08)', border: `1px solid ${theme === 'sun' ? 'rgba(142,36,170,0.25)' : 'rgba(142,36,170,0.25)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme === 'sun' ? '#6A1B9A' : '#cbb' }}>
                        <FileTextOutlined />
                        <span style={{ fontSize: '12px' }}>Paste attempts</span>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700 }}>{totalPaste}</div>
                    </div>
                  </div>
                </div>

                {/* Right: Activity log with pagination */}
                <div>
                  <div style={{
                    maxHeight: 'calc(70vh - 140px)', overflowY: 'auto', overflowX: 'hidden', padding: '10px', paddingBottom: '24px', boxSizing: 'border-box',
                    background: theme === 'sun' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px', border: `1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)'}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    {pagedEvents.length === 0 ? (
                      <Typography.Text style={{ fontStyle: 'italic', fontSize: '14px' }}>No anti-cheat events recorded.</Typography.Text>
                    ) : (
                      pagedEvents.map((ev, idx) => {
                        const meta = getEventMeta(ev.event);
                        const desc = ev.content || meta.label;
                        const questionSuffix = ev.questionId ? ` (Q${ev.questionId})` : '';
                        const isCopy = ev.event === 'COPY' || ev.event === 'COPY_ATTEMPT';
                        const isPaste = ev.event === 'PASTE' || ev.event === 'PASTE_ATTEMPT';
                        const isTabSwitchEvt = ev.event === 'TAB_SWITCH' || ev.event === 'TAB_BLUR';
                        const payloadForCopy = (() => {
                          const raw = Array.isArray(ev.oldValue)
                            ? ev.oldValue
                            : (ev.oldValue != null ? [String(ev.oldValue)] : []);
                          return (raw && raw.length > 0) ? raw : ['Ví dụ: "tả bạn môn"'];
                        })();
                        const payloadForPaste = (() => {
                          const raw = Array.isArray(ev.newValue)
                            ? ev.newValue
                            : (ev.newValue != null ? [String(ev.newValue)] : []);
                          return (raw && raw.length > 0) ? raw : ['Ví dụ: "ANSWER CHANGE (Q3)"'];
                        })();
                        return (
                          <div key={idx} style={{
                            display: 'flex', gap: '10px', padding: '10px 12px', marginBottom: '10px',
                            background: theme === 'sun' ? 'linear-gradient(135deg, #FAFDFF 0%, #FFFFFF 100%)' : 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '10px', border: `1px solid ${theme === 'sun' ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.1)'}`,
                            fontSize: '12px', position: 'relative', overflow: 'hidden'
                          }}>
                            <div style={{
                              position: 'absolute', left: 0, top: 0, bottom: 0,
                              width: '4px', background: meta.color, opacity: 0.7
                            }} />
                            <div style={{ color: meta.color, fontSize: '14px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                              {meta.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                                <div style={{ fontWeight: 700, color: theme === 'sun' ? '#1f2937' : 'rgb(45, 27, 105)', fontSize: '12px' }}>
                                  {getEventTitle(ev.event)}{questionSuffix}
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#000' }}>
                                  {formatTimestamp(ev.timestamp)}
                                </div>
                              </div>
                              <div style={{ color: theme === 'sun' ? '#4b5563' : '#999', fontSize: '12px', lineHeight: '1.6', marginTop: '2px' }}>
                                {desc}
                              </div>
                              {/* Notes removed per request */}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {/* Pagination */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <Pagination
                      total={filteredEvents.length}
                      current={antiCheatPage}
                      pageSize={antiCheatPageSize}
                      showSizeChanger
                      pageSizeOptions={[10,20,50,100]}
                      onChange={(page, size) => { setAntiCheatPage(page); setAntiCheatPageSize(size); }}
                      showTotal={(total) => `${total} events`}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Score Modal */}
      <Modal
        title={
          <div
            style={{
              fontSize: '28px',
              fontWeight: '600',
              color: 'rgb(24, 144, 255)',
              textAlign: 'center',
              padding: '10px 0',
            }}>
            {scoreModal.isEdit ? 'Edit Score' : 'Add Score'}
            </div>
        }
        open={scoreModal.visible}
        onCancel={handleCloseScoreModal}
        width={600}
        footer={[
          <Button 
            key="cancel" 
            onClick={handleCloseScoreModal}
            style={{
              height: '32px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '4px 15px',
              width: '100px'
            }}>
            Cancel
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            onClick={handleSaveScore}
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
              if (theme === 'sun') {
                e.currentTarget.style.background = 'rgb(93, 159, 233)';
              } else {
                e.currentTarget.style.background = 'linear-gradient(135deg, #9C8FB0 19%, #9588AB 64%, #726795 75%, #9A95B0 97%, #5D4F7F 100%)';
              }
            }}
            onMouseLeave={(e) => {
              if (theme === 'sun') {
                e.currentTarget.style.background = 'rgb(113, 179, 253)';
              } else {
                e.currentTarget.style.background = 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)';
              }
            }}>
            {scoreModal.isEdit ? 'Update' : 'Add'}
          </Button>
        ]}>
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: '24px' }}>
            <Typography.Text strong style={{ 
              fontSize: '16px', 
              display: 'block', 
              marginBottom: '12px',
              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
            }}>
              Score (0-10):
            </Typography.Text>
            <Input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={scoreModal.score}
              onChange={handleScoreInputChange}
              placeholder="Enter score (0-10)"
              style={{
                fontSize: '16px',
                height: '42px'
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Overall Feedback Modal (header action) - styled like AccountList add modal */}
      <Modal
        title={
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'rgb(24, 144, 255)',
              textAlign: 'center',
              padding: '6px 0'
            }}
          >
            {teacherFeedback && teacherFeedback.replace(/<[^>]*>/g,'').trim().length > 0 ? 'Edit Feedback' : 'Add Feedback'}
          </div>
        }
        open={overallFeedbackModalVisible}
        centered
        onCancel={() => setOverallFeedbackModalVisible(false)}
        width={640}
        footer={[
          <Button key="cancel" onClick={() => setOverallFeedbackModalVisible(false)}
            style={{ height: '36px', borderRadius: '6px', padding: '0 22px' }}
          >
            Cancel
          </Button>,
          <Button key="clear" onClick={() => setOverallFeedbackDraft('')}
            style={{ height: '36px', borderRadius: '6px', padding: '0 22px' }}
          >
            Clear
          </Button>,
          <Button key="save" type="primary" loading={savingFeedback} onClick={handleSaveOverallFeedback}
            style={{
              height: '36px',
              borderRadius: '6px',
              fontWeight: 500,
              padding: '0 24px',
              border: 'none',
              background: theme === 'sun' 
                ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
              color: '#000000'
            }}
          >
            Save
          </Button>
        ]}
      >
        {/* Force CKEditor sizing like AIGenerateFeedback to avoid global CSS overrides */}
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
        <div className="feedback-editor-wrap" style={{ marginTop: 6, borderRadius: 12, border: `2px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.5)' : 'rgba(139, 92, 246, 0.5)'}`, background: theme === 'sun' ? 'rgba(24,144,255,0.08)' : 'rgba(139,92,246,0.12)' }}>
          <CKEditor
            editor={ClassicEditor}
            data={overallFeedbackDraft}
            onChange={(event, editor) => setOverallFeedbackDraft(editor.getData())}
            config={{
              extraPlugins: [CustomUploadAdapterPlugin],
              placeholder: 'Enter overall feedback...',
              toolbar: {
                items: [
                  'heading',
                  '|',
                  'bold',
                  'italic',
                  'underline',
                  '|',
                  'insertTable',
                  'imageUpload',
                  '|',
                  'bulletedList',
                  'numberedList',
                  '|',
                  'link',
                  '|',
                  'undo',
                  'redo'
                ],
                shouldNotGroupWhenFull: false
              },
              heading: {
                options: [
                  { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                  { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                  { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                  { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
                ]
              },
              table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'] },
              image: {
                toolbar: ['imageTextAlternative', '|', 'imageStyle:alignLeft', 'imageStyle:full', 'imageStyle:alignRight'],
                styles: ['full', 'alignLeft', 'alignRight']
              }
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
      </Modal>

      {/* Comment Modal for Writing Section */}
      <Modal
        title={
          <div
            style={{
              fontSize: '28px',
              fontWeight: '600',
              color: 'rgb(24, 144, 255)',
              textAlign: 'center',
              padding: '10px 0',
            }}>
            {commentModal.isEdit ? 'Edit Comment' : 'Add Comment'}
                        </div>
        }
        open={commentModal.visible}
        onCancel={() => setCommentModal({
          visible: false,
          sectionId: null,
          startIndex: null,
          endIndex: null,
          comment: '',
          isEdit: false,
          feedbackId: null,
        })}
        width={600}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => setCommentModal({
              visible: false,
              sectionId: null,
              startIndex: null,
              endIndex: null,
              comment: '',
              isEdit: false,
              feedbackId: null,
            })}
            style={{
              height: '32px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '4px 15px',
              width: '100px'
            }}>
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
              if (theme === 'sun') {
                e.currentTarget.style.background = 'rgb(93, 159, 233)';
              } else {
                e.currentTarget.style.background = 'linear-gradient(135deg, #9C8FB0 19%, #9588AB 64%, #726795 75%, #9A95B0 97%, #5D4F7F 100%)';
              }
            }}
            onMouseLeave={(e) => {
              if (theme === 'sun') {
                e.currentTarget.style.background = 'rgb(113, 179, 253)';
              } else {
                e.currentTarget.style.background = 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)';
              }
            }}>
            {commentModal.isEdit ? 'Update' : 'Add'}
          </Button>
        ]}>
        <div style={{ padding: '20px 0' }}>
          <Input.TextArea
            rows={6}
            value={commentModal.comment}
            onChange={handleCommentInputChange}
            placeholder="Enter your comment for the selected text..."
            maxLength={2000}
            showCount
            autoSize={{ minRows: 6, maxRows: 10 }}
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
            }}
          />
                  </div>
      </Modal>

      {/* Comment Sidebar for viewing/editing comments */}
      {showCommentSidebar && selectedComment && (
        <div style={{
          position: 'fixed',
          right: '24px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '350px',
          maxWidth: 'calc(100vw - 48px)',
          maxHeight: '80vh',
          background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.2)'}`,
          padding: '20px',
          overflowY: 'auto',
          boxShadow: theme === 'sun' 
            ? '0 4px 16px rgba(0, 0, 0, 0.15)'
            : '0 4px 16px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
        }}>
          {/* Comment Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(0, 0, 0, 0.1)'}`
          }}>
            <div>
              <Typography.Text strong style={{
                fontSize: '16px',
                color: theme === 'sun' ? '#333' : '#1F2937'
              }}>
                Teacher Comment
                      </Typography.Text>
              <div style={{
                fontSize: '12px',
                color: theme === 'sun' ? '#999' : '#777',
                marginTop: '4px'
              }}>
                {selectedComment.timestamp ? new Date(selectedComment.timestamp).toLocaleDateString() : new Date().toLocaleDateString()} {new Date(selectedComment.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            <Button
              type="text"
              icon={<CloseCircleOutlined />}
              onClick={() => {
                setShowCommentSidebar(false);
                setSelectedComment(null);
              }}
              style={{
                minWidth: 'auto',
                width: '32px',
                height: '32px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
              </div>

          {/* Comment Content */}
          <div style={{
            fontSize: '14px',
            lineHeight: '1.8',
            color: theme === 'sun' ? '#333' : '#1F2937',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            marginBottom: '16px'
          }}>
            {selectedComment.comment || 'No comment provided.'}
            </div>

          {/* Highlighted Text Reference */}
          {(() => {
            const sectionId = Object.keys(writingSectionFeedbacks).find(id => 
              writingSectionFeedbacks[id]?.some(fb => fb.id === selectedComment.id)
            );
            if (sectionId) {
              const studentAnswer = studentAnswers?.[sectionId] || {};
              const essayText = studentAnswer?.text || studentAnswer?.essay || '';
              if (essayText && selectedComment.startIndex !== undefined) {
                const highlightedText = essayText.substring(selectedComment.startIndex, selectedComment.endIndex);
                return (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: theme === 'sun' ? '#fff9c4' : 'rgba(255, 235, 59, 0.2)',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'sun' ? '#ffeb3b' : 'rgba(255, 235, 59, 0.5)'}`
                  }}>
                    <Typography.Text style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: theme === 'sun' ? '#666' : '#999',
                      display: 'block',
                      marginBottom: '6px'
                    }}>
                      Highlighted text:
                    </Typography.Text>
                    <Typography.Text style={{
                      fontSize: '13px',
                      color: theme === 'sun' ? '#333' : '#1F2937',
                      fontStyle: 'italic'
                    }}>
                      "{highlightedText}"
                    </Typography.Text>
        </div>
                );
              }
            }
            return null;
          })()}

          {/* Edit and Delete Buttons */}
          {!isStudent && (
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDeleteComment}
                style={{
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '14px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Delete
              </Button>
              <Button
                type="default"
                onClick={handleEditCommentFromSidebar}
                style={{
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '14px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: `2px solid ${theme === 'sun' ? 'rgba(113, 179, 253, 0.4)' : 'rgba(138, 122, 255, 0.4)'}`,
                  background: theme === 'sun' 
                    ? 'rgba(113, 179, 253, 0.1)' 
                    : 'rgba(138, 122, 255, 0.1)',
                  color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                }}
              >
                Edit Comment
              </Button>
            </div>
          )}
        </div>
      )}
    </ThemedLayout>
  );
};

export default DailyChallengeSubmissionDetail;

