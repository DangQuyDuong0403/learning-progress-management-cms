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
  Checkbox,
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

const stripHtmlSimple = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const escapeHtmlSimple = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const WritingHighlight = React.memo(({ isActive, onClick, children }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const backgroundColor = isActive
    ? '#FFD700'
    : isHovered
      ? '#FFE066'
      : '#FFEB3B';
  const fontWeight = (isActive || isHovered) ? '600' : '500';
  const boxShadow = (isActive || isHovered) ? '0 2px 4px rgba(0, 0, 0, 0.2)' : 'none';

  return (
    <span
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      {children}
    </span>
  );
});

const DailyChallengeSubmissionDetail = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { id, submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { enterDailyChallengeMenu, exitDailyChallengeMenu, dailyChallengeData } = useDailyChallengeMenu();
  
  // Get user role from Redux
  const userRole = useSelector((state) => state.auth?.user?.role);
  const normalizedRole = (userRole || '').toString().toLowerCase();
  const isStudent = normalizedRole === 'student' || normalizedRole === 'test_taker';
  const isManager = normalizedRole === 'manager';
  const getSubmissionRoutePrefix = useCallback(() => {
    if (isStudent) {
      return normalizedRole === 'test_taker' ? '/test-taker' : '/student';
    }
    if (normalizedRole === 'teaching_assistant') {
      return '/teaching-assistant';
    }
    if (isManager) {
      return '/manager';
    }
    return '/teacher';
  }, [isStudent, isManager, normalizedRole]);
  const getFeedbackRouteBase = useCallback(() => {
    if (isStudent) {
      return normalizedRole === 'test_taker' ? '/test-taker' : '/student';
    }
    if (normalizedRole === 'teaching_assistant') {
      return '/teaching-assistant';
    }
    return '/teacher';
  }, [isStudent, normalizedRole]);
  
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
  const [finalScoreDraft, setFinalScoreDraft] = useState('');
  const [penaltyAppliedDraft, setPenaltyAppliedDraft] = useState('');
  const [isPenaltyEnabled, setIsPenaltyEnabled] = useState(false);
  const [savingGrading, setSavingGrading] = useState(false);
  const [antiCheatModalVisible, setAntiCheatModalVisible] = useState(false);
  const [antiCheatExpanded, setAntiCheatExpanded] = useState({});
  
  
  // Performance collapse state
  const [isPerformanceCollapsed, setIsPerformanceCollapsed] = useState(false);
  
  // Other sections collapse states (default collapsed)
  const [isTeacherFeedbackCollapsed, setIsTeacherFeedbackCollapsed] = useState(false);
  // Teacher feedback detail modal
  const [teacherFeedbackDetailVisible, setTeacherFeedbackDetailVisible] = useState(false);
  
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
    // Check feedback: can be string or object (with overallFeedback, criteriaFeedback, etc.)
    let hasFb = false;
    if (typeof g.feedback === 'string') {
      hasFb = g.feedback.trim() !== '';
    } else if (typeof g.feedback === 'object' && g.feedback !== null) {
      // Check if object has overallFeedback or criteriaFeedback with actual content
      const overallFb = g.feedback.overallFeedback;
      const criteriaFb = g.feedback.criteriaFeedback;
      
      // Check overallFeedback
      const hasOverallFb = typeof overallFb === 'string' && overallFb.trim() !== '';
      
      // Check criteriaFeedback: must have at least one field with score or feedback
      let hasCriteriaFb = false;
      if (typeof criteriaFb === 'object' && criteriaFb !== null) {
        const criteriaKeys = Object.keys(criteriaFb);
        hasCriteriaFb = criteriaKeys.some(key => {
          const item = criteriaFb[key];
          if (!item || typeof item !== 'object') return false;
          const hasScore = item.score !== null && item.score !== undefined && Number.isFinite(Number(item.score));
          const hasFeedback = typeof item.feedback === 'string' && item.feedback.trim() !== '';
          return hasScore || hasFeedback;
        });
      }
      
      hasFb = hasOverallFb || hasCriteriaFb;
    }
    const hasHighlights = Array.isArray(g.highlightComments) && g.highlightComments.length > 0;
    return !!(hasScore || hasFb || hasHighlights);
  };

  const handleOpenAddFeedback = (sectionId, type = 'question') => {
    // Navigate to AI feedback grading page for section type
    if (type === 'section') {
      const base = getFeedbackRouteBase();
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
        spaceToast.error(t('dailyChallenge.submissionQuestionIdNotFound', 'Submission question ID not found for this section'));
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
      if (isStudent) qs.set('viewOnly', 'true');
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
          viewOnly: isStudent,
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
      const base = getFeedbackRouteBase();
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
        spaceToast.error(t('dailyChallenge.submissionQuestionIdNotFound', 'Submission question ID not found for this section'));
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
      if (isStudent) qs.set('viewOnly', 'true');
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
          viewOnly: isStudent,
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
  
  // Helper function to parse text and convert image URLs to images
  const parseTextWithImages = (text) => {
    if (!text) return text;
    
    // Regex to match URLs (including image URLs)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?|$)/i;
    
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = urlRegex.exec(text)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      const url = match[0];
      // Check if it's an image URL (check if URL contains image extension before query params or at end)
      if (imageExtensions.test(url)) {
        parts.push(
          <img 
            key={`img-${match.index}`}
            src={url} 
            alt="Student uploaded image"
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block',
              margin: '12px 0',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
            onError={(e) => {
              // If image fails to load, show the URL as text
              e.target.style.display = 'none';
              const urlText = document.createTextNode(url);
              e.target.parentNode.appendChild(urlText);
            }}
          />
        );
      } else {
        // Regular URL - keep as text or make it a link
        parts.push(
          <a 
            key={`url-${match.index}`}
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: theme === 'sun' ? '#1890ff' : '#8B5CF6', wordBreak: 'break-all' }}
          >
            {url}
          </a>
        );
      }
      
      lastIndex = match.index + url.length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    // If no URLs found, return original text
    return parts.length > 0 ? parts : text;
  };

  // Render essay with highlights
  const renderEssayWithHighlights = (text, sectionId) => {
    if (!text) return text;
    
    const sectionFeedbacks = writingSectionFeedbacks[sectionId] || [];
    if (sectionFeedbacks.length === 0) {
      return parseTextWithImages(text);
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
          const parsedPlainText = parseTextWithImages(plainText);
          parts.push(
            <span key={`text-${currentIndex}-${interval.start}`}>
              {parsedPlainText}
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
      
      // Create click handler that handles all covering feedbacks
      const handleClick = (e) => {
        // If multiple feedbacks cover this text, prioritize the active one or the first one
        if (displayFeedback) {
          handleHighlightClick(displayFeedback);
        }
      };
      
      // Parse interval text for images (but keep highlighting for non-image parts)
      const parsedIntervalText = parseTextWithImages(intervalText);
      parts.push(
        <WritingHighlight
          key={`highlight-${interval.start}-${interval.end}-${idx}`}
          isActive={isActive}
          onClick={handleClick}
        >
          {parsedIntervalText}
        </WritingHighlight>
      );
      
      currentIndex = interval.end;
    });
    
    // Add remaining text after last interval
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      if (remainingText) {
        const parsedRemainingText = parseTextWithImages(remainingText);
        parts.push(
          <span key={`text-final-${currentIndex}`}>
            {parsedRemainingText}
          </span>
        );
      }
    }
    
    return parts;
  };

  // Hide  toolbar when clicking outside
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
      spaceToast.error(t('dailyChallenge.submissionIdRequired', 'Submission ID is required'));
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

      const hasSubmittedData = (questionType, submittedContentRaw) => {
        if (!submittedContentRaw) return false;
        const entries = Array.isArray(submittedContentRaw) ? submittedContentRaw : [submittedContentRaw];
        return entries.some((entry) => {
          if (!entry) return false;
          const rawId = entry.id;
          const rawValue = entry.value;
          const rawText = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
          const idText = typeof rawId === 'string' ? rawId.trim() : rawId;
          switch (questionType) {
            case 'MULTIPLE_CHOICE':
            case 'TRUE_OR_FALSE':
            case 'MULTIPLE_SELECT':
            case 'DROPDOWN':
            case 'DRAG_AND_DROP':
            case 'REARRANGE':
              return Boolean(idText) || Boolean(rawText);
            case 'FILL_IN_THE_BLANK':
            case 'REWRITE':
              return Boolean(rawText);
            default:
              return Boolean(idText) || Boolean(rawText);
          }
        });
      };

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
          const submittedContentRaw = q.submittedContent?.data;
          const questionHasSubmission = hasSubmittedData(q.questionType, submittedContentRaw);

          if (q.receivedScore > 0) {
            correctCount++;
          } else if (questionHasSubmission) {
            incorrectCount++;
          } else {
            unansweredCount++;
          }

          const questionContent = q.questionContent?.data || [];
          const submittedContent = Array.isArray(submittedContentRaw)
            ? submittedContentRaw
            : (submittedContentRaw ? [submittedContentRaw] : []);

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
            submittedItems.forEach((submitted) => {
              if (!submitted) return;
              const submittedPosId = submitted.positionId || '';
              const submittedValueRaw = typeof submitted.value === 'string' ? submitted.value : '';
              const submittedValue = submittedValueRaw ? submittedValueRaw.trim() : '';
              const submittedIdRaw = submitted.id != null ? String(submitted.id) : '';
              const submittedId = submittedIdRaw ? submittedIdRaw.trim() : '';
              
              // Prefer the text the student actually saw
              let selectedValue = submittedValue;
              
              const findMatchedItem = () => {
                if (!questionContent || questionContent.length === 0) return null;
                // Try by id first
                if (submittedId) {
                  const byId = questionContent.find(item => item.id === submittedId);
                  if (byId) return byId;
                }
                // Then by value text
                if (submittedValue) {
                  const byValue = questionContent.find(item => (item.value || '').trim() === submittedValue);
                  if (byValue) return byValue;
                }
                // Finally by positionId
                if (submittedPosId) {
                  return questionContent.find(item => {
                    const itemPosId = String(item.positionId || '').replace(/^pos_/, '');
                    const cleanSubmittedPos = String(submittedPosId).replace(/^pos_/, '');
                    return itemPosId === cleanSubmittedPos;
                  });
                }
                return null;
              };
              
              const matchedItem = findMatchedItem();
              
              if (!selectedValue) {
                if (matchedItem?.value) {
                  selectedValue = matchedItem.value;
                } else if (submittedId) {
                  selectedValue = submittedId;
                }
              }
              
              if (!selectedValue) return;
              
              const assignForPosition = (posId) => {
                if (!posId) return;
                const cleanPos = String(posId).replace(/^pos_/, '');
                dropdownAnswers[`pos_${cleanPos}`] = selectedValue;
                dropdownAnswers[cleanPos] = selectedValue;
              };
              
              if (submittedPosId) {
                assignForPosition(submittedPosId);
              } else if (matchedItem?.positionId) {
                assignForPosition(matchedItem.positionId);
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
                
                if (submittedPosId) {
                  // Find matching item in questionContent by positionId and submitted value/id
                  let matchedItem = questionContent.find(item => {
                    const itemPosId = String(item.positionId || '').trim();
                    const itemPosIdNoPrefix = itemPosId.replace(/^pos_/, '');
                    const submittedPosIdNoPrefix = String(submittedPosId).replace(/^pos_/, '');
                    
                    // Match by positionId
                    return itemPosId === submittedPosId || 
                           itemPosId === `pos_${submittedPosId}` ||
                           itemPosIdNoPrefix === submittedPosId ||
                           itemPosIdNoPrefix === submittedPosIdNoPrefix;
                  });
                  
                  // If not found by positionId, try to find by value or id
                  if (!matchedItem && submittedValue) {
                    matchedItem = questionContent.find(item => 
                      item.value === submittedValue || item.id === submittedValue
                    );
                  }
                  
                  // Use matched item's value, or fallback to submittedValue
                  const finalValue = matchedItem?.value || submittedValue;
                  
                  if (finalValue) {
                    // Map with "pos_" prefix (as used in questionText like [[pos_autu87]])
                    const posIdKey = String(submittedPosId).replace(/^pos_/, '');
                    dragDropAnswers[`pos_${posIdKey}`] = finalValue;
                    dragDropAnswers[posIdKey] = finalValue;
                    // Also map with original submittedPosId format
                    dragDropAnswers[submittedPosId] = finalValue;
                    if (submittedPosId !== `pos_${posIdKey}`) {
                      dragDropAnswers[`pos_${submittedPosId}`] = finalValue;
                    }
                  }
                } else if (submittedValue) {
                  // Fallback: Try to find matching option in questionContent by value
                  const matchedItem = questionContent.find(item => 
                    item.value === submittedValue || item.id === submittedValue
                  );
                  
                  if (matchedItem?.positionId) {
                    const posId = String(matchedItem.positionId).replace(/^pos_/, '');
                    const value = matchedItem.value || submittedValue;
                    dragDropAnswers[`pos_${posId}`] = value;
                    dragDropAnswers[posId] = value;
                  }
                }
              }
            });
            studentAnswersMap[q.questionId] = dragDropAnswers;
          } else if (q.questionType === 'REARRANGE') {
            const submittedSequence = (submittedContent || [])
              .map((entry) => {
                if (!entry) return '';
                const rawPos = String(entry.positionId || '').replace(/^pos_/, '');
                const valueFromEntry = typeof entry.value === 'string' ? entry.value.trim() : entry.value;
                const idFromEntry = typeof entry.id === 'string' ? entry.id.trim() : entry.id;
                const lookupToken = valueFromEntry || idFromEntry || '';
                if (!lookupToken && !rawPos) return '';
                const matchedItem = questionContent.find((item) => {
                  const itemPosId = String(item.positionId || '').replace(/^pos_/, '');
                  const itemValue = typeof item.value === 'string' ? item.value.trim() : item.value;
                  return (
                    (rawPos && itemPosId === rawPos) ||
                    (itemValue && typeof lookupToken === 'string' && itemValue.toLowerCase() === lookupToken.toLowerCase()) ||
                    (idFromEntry && item.id === idFromEntry)
                  );
                });
                const finalValue = (() => {
                  if (typeof valueFromEntry === 'string' && valueFromEntry.length > 0) {
                    return valueFromEntry;
                  }
                  if (matchedItem?.value) {
                    return matchedItem.value;
                  }
                  return idFromEntry || lookupToken;
                })();
                return typeof finalValue === 'string' ? finalValue.trim() : finalValue;
              })
              .filter((value) => {
                if (value === null || value === undefined) return false;
                if (typeof value === 'string') return value.trim().length > 0;
                return true;
              });

            studentAnswersMap[q.questionId] = submittedSequence;
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
            hasSubmissionData: questionHasSubmission,
            submittedContentCount: questionHasSubmission ? submittedContent.length : 0,
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
          const hasFinalScoreField = Object.prototype.hasOwnProperty.call(gradingData, 'finalScore');
          const hasTotalScoreField = Object.prototype.hasOwnProperty.call(gradingData, 'totalScore');
          const scoreProvided = hasFinalScoreField || hasTotalScoreField;
          const score = hasFinalScoreField ? gradingData.finalScore : gradingData.totalScore;
          const maxPointsFromGrading = gradingData.maxPossibleWeight ?? gradingData.maxPossibleScore;
          const accuracyPct = gradingData.scorePercentage != null ? Math.round(gradingData.scorePercentage) : undefined;
          const correct = gradingData.correctAnswers;
          const incorrect = gradingData.wrongAnswers;
          const unanswered = (gradingData.skipped || 0) + (gradingData.empty || 0);
          const penaltyApplied = gradingData.penaltyApplied ?? 0;
          const rawScore = gradingData.rawScore ?? score;

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
              score: scoreProvided ? (score ?? null) : prev.submission?.score,
              totalPoints: scoreProvided ? (score ?? null) : prev.submission?.totalPoints,
              maxPoints: maxPointsFromGrading ?? prev.submission?.maxPoints,
              correctCount: correct ?? prev.submission?.correctCount,
              incorrectCount: incorrect ?? prev.submission?.incorrectCount,
              unansweredCount: unanswered ?? prev.submission?.unansweredCount,
              accuracy: accuracyPct ?? prev.submission?.accuracy,
              penaltyApplied: penaltyApplied,
              rawScore: rawScore,
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
                // Check feedback: can be string or object (with overallFeedback, criteriaFeedback, etc.)
                let hasFb = false;
                if (typeof data.feedback === 'string') {
                  hasFb = data.feedback.trim() !== '';
                } else if (typeof data.feedback === 'object' && data.feedback !== null) {
                  // Check if object has overallFeedback or criteriaFeedback with actual content
                  const overallFb = data.feedback.overallFeedback;
                  const criteriaFb = data.feedback.criteriaFeedback;
                  
                  // Check overallFeedback
                  const hasOverallFb = typeof overallFb === 'string' && overallFb.trim() !== '';
                  
                  // Check criteriaFeedback: must have at least one field with score or feedback
                  let hasCriteriaFb = false;
                  if (typeof criteriaFb === 'object' && criteriaFb !== null) {
                    const criteriaKeys = Object.keys(criteriaFb);
                    hasCriteriaFb = criteriaKeys.some(key => {
                      const item = criteriaFb[key];
                      if (!item || typeof item !== 'object') return false;
                      const hasScore = item.score !== null && item.score !== undefined && Number.isFinite(Number(item.score));
                      const hasFeedback = typeof item.feedback === 'string' && item.feedback.trim() !== '';
                      return hasScore || hasFeedback;
                    });
                  }
                  
                  hasFb = hasOverallFb || hasCriteriaFb;
                }
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
        // Count DEVICE_MISMATCH occurrences if provided
        const deviceMismatchCount = (logsData?.eventCounts?.DEVICE_MISMATCH) != null
          ? (logsData.eventCounts.DEVICE_MISMATCH || 0)
          : mappedEvents.filter(e => e.event === 'DEVICE_MISMATCH').length;
        // Count SESSION START occurrences (api may use START or SESSION_START)
        const sessionStartCount = (eventCounts?.START != null ? eventCounts.START : 0)
          + (eventCounts?.SESSION_START != null ? eventCounts.SESSION_START : 0)
          || mappedEvents.filter(e => e.event === 'START' || e.event === 'SESSION_START').length;

        setAntiCheatData({
          totalViolations: visibleViolationCount,
          tabBlurCount: (eventCounts.TAB_SWITCH || eventCounts.TAB_BLUR || 0),
          copyCount: (eventCounts.COPY_ATTEMPT || eventCounts.COPY || 0),
          pasteCount: (eventCounts.PASTE_ATTEMPT || eventCounts.PASTE || 0),
          totalTabBlurDuration: 0,
          deviceMismatchCount,
          sessionStartCount,
          events: mappedEvents,
        });
      } catch (e) {
        console.warn('Failed to load anti-cheat logs. Sidebar will hide logs summary.', e);
        setAntiCheatData({ totalViolations: 0, tabBlurCount: 0, copyCount: 0, pasteCount: 0, totalTabBlurDuration: 0, events: [] });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching submission detail:', error);
      spaceToast.error(error.response?.data?.error || error.response?.data?.message || t('dailyChallenge.errorLoadingSubmissionDetail', 'Error loading submission detail'));
      setLoading(false);
    }
  }, [submissionId, id, t]);

  useEffect(() => {
    fetchSubmissionDetail();
  }, [fetchSubmissionDetail]);

useEffect(() => {
  const sections = fakeData?.speakingSections || [];
  if (!sections.length) return;

  setAudioStates(prev => {
    let hasUpdates = false;
    const nextState = { ...prev };

    sections.forEach((section, idx) => {
      const sectionId = section.id || `speaking-${idx}`;
      const studentSectionAnswer = studentAnswers?.[sectionId] || {};
      const questionAnswer = section.questions?.length
        ? (studentAnswers?.[section.questions[0]?.id] || {})
        : {};
      const hasAudio =
        section.audioUrl ||
        studentSectionAnswer.audio ||
        studentSectionAnswer.audioUrl ||
        questionAnswer.audio ||
        questionAnswer.audioUrl;

      if (hasAudio && !nextState[sectionId]) {
        hasUpdates = true;
        nextState[sectionId] = { isPlaying: false, currentTime: 0, duration: 0, volume: 1 };
      }
    });

    return hasUpdates ? nextState : prev;
  });
}, [fakeData?.speakingSections, studentAnswers]);

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
    const backPath = `${getSubmissionRoutePrefix()}/daily-challenges/detail/${id}/submissions${suffix}`;
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
      exitDailyChallengeMenu();
    };
  }, [enterDailyChallengeMenu, exitDailyChallengeMenu, getSubmissionRoutePrefix, id, dailyChallengeData?.subtitle, dailyChallengeData?.className, location?.state?.className, location?.state?.challengeName, location?.state?.classId, location.search]);

  // Build question navigation list (must be before early return)
  const getQuestionNavigation = useCallback(() => {
    if (!fakeData) return [];
    const { questions, readingSections, listeningSections, writingSections, speakingSections } = fakeData;
    const navigation = [];
    let questionNumber = 1;

    // Grammar & Vocabulary questions
    if (questions.length > 0) {
      const start = questionNumber;
      const end = start + questions.length - 1;
      // Add individual questions directly (no header)
      questions.forEach((q, qIdx) => {
        navigation.push({ 
          id: `gv-${q.id}`, 
          type: 'question', 
          title: `Question ${start + qIdx}`,
          questionNumber: start + qIdx,
          points: q.points || 0,
          receivedScore: q.receivedScore || 0
        });
      });
      questionNumber = end + 1;
    }

    // Reading sections
    if (readingSections.length > 0) {
      readingSections.forEach((s, idx) => {
        const count = s.questions?.length || 0;
        const start = questionNumber;
        const end = count > 0 ? start + count - 1 : start;
        // Add section header
        navigation.push({ 
          id: `reading-${idx + 1}`, 
          type: 'section-header', 
          title: `Reading ${idx + 1}`,
          sectionIndex: idx,
          sectionType: 'reading'
        });
        // Add individual questions
        if (s.questions && s.questions.length > 0) {
          s.questions.forEach((q, qIdx) => {
            navigation.push({ 
              id: `reading-${idx + 1}-q-${q.id || qIdx}`, 
              type: 'question', 
              title: `Question ${start + qIdx}`,
              parentSection: `reading-${idx + 1}`,
              questionNumber: start + qIdx,
              points: q.points || 0,
              receivedScore: q.receivedScore || 0
            });
        });
        }
        questionNumber = end + 1;
      });
    }

    // Listening sections
    if (listeningSections.length > 0) {
      listeningSections.forEach((s, idx) => {
        const count = s.questions?.length || 0;
        const start = questionNumber;
        const end = count > 0 ? start + count - 1 : start;
        // Add section header
        navigation.push({ 
          id: `listening-${idx + 1}`, 
          type: 'section-header', 
          title: `Listening ${idx + 1}`,
          sectionIndex: idx,
          sectionType: 'listening'
        });
        // Add individual questions
        if (s.questions && s.questions.length > 0) {
          s.questions.forEach((q, qIdx) => {
            navigation.push({ 
              id: `listening-${idx + 1}-q-${q.id || qIdx}`, 
              type: 'question', 
              title: `Question ${start + qIdx}`,
              parentSection: `listening-${idx + 1}`,
              questionNumber: start + qIdx,
              points: q.points || 0,
              receivedScore: q.receivedScore || 0
            });
        });
        }
        questionNumber = end + 1;
      });
    }

    // Writing sections
    if (writingSections.length > 0) {
      writingSections.forEach((s, idx) => {
        const received = (s.questions || []).reduce((sum, q) => sum + (q.receivedScore || 0), 0);
        const total = (s.questions || []).reduce((sum, q) => sum + (q.points || 0), 0);
        // Add section header with question-like style
        navigation.push({ 
          id: `writing-${idx + 1}`, 
          type: 'question', 
          title: `Writing ${idx + 1}`,
          sectionIndex: idx,
          sectionType: 'writing',
          points: total,
          receivedScore: received
        });
      });
    }

    // Speaking sections
    if (speakingSections.length > 0) {
      speakingSections.forEach((s, idx) => {
        const received = (s.questions || []).reduce((sum, q) => sum + (q.receivedScore || 0), 0);
        const total = (s.questions || []).reduce((sum, q) => sum + (q.points || 0), 0);
        // Add section header with question-like style
        navigation.push({ 
          id: `speaking-${idx + 1}`, 
          type: 'question', 
          title: `Speaking ${idx + 1}`,
          sectionIndex: idx,
          sectionType: 'speaking',
          points: total,
          receivedScore: received
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
        <LoadingWithEffect loading={loading} message={t('dailyChallenge.loadingSubmissionDetails', 'Loading submission details...')} />
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
      spaceToast.error(t('dailyChallenge.missingSubmissionId', 'Missing submission ID'));
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
      spaceToast.error(err?.response?.data?.error || err?.response?.data?.message || t('dailyChallenge.failedToSaveGrading', 'Failed to save grading'));
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
      spaceToast.error(t('dailyChallenge.scoreMustBeBetween0And10', 'Score must be between 0 and 10'));
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
      spaceToast.error(error.response?.data?.error || error.response?.data?.message || t('dailyChallenge.failedToSaveTeacherFeedback', 'Failed to save teacher feedback'));
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
      spaceToast.error(t('dailyChallenge.missingSubmissionId', 'Missing submission ID'));
      return;
    }
    try {
      setSavingFeedback(true);
      const stripHtml = (html) => (html || '').replace(/<[^>]*>/g, '').trim();
      
      // Validate Raw Score (0-10)
      const rawScoreValue = finalScoreDraft ? parseFloat(finalScoreDraft) : 0;
      if (isNaN(rawScoreValue) || rawScoreValue < 0 || rawScoreValue > 10) {
        spaceToast.error(t('dailyChallenge.rawScoreMustBeBetween0And10', 'Raw score must be between 0 and 10'));
        setSavingFeedback(false);
        return;
      }
      
      // Validate Penalty Applied (0.0-1.0)
      let penaltyValue = 0;
      if (isPenaltyEnabled) {
        const penaltyPercent = penaltyAppliedDraft ? parseFloat(penaltyAppliedDraft) : 0;
        if (isNaN(penaltyPercent) || penaltyPercent < 0 || penaltyPercent > 100) {
          spaceToast.error(t('dailyChallenge.penaltyPercentageMustBeBetween0And100', 'Penalty percentage must be between 0 and 100'));
        setSavingFeedback(false);
        return;
        }
        penaltyValue = penaltyPercent / 100;
      }

      const payload = {
        rawScore: rawScoreValue,
        penaltyApplied: penaltyValue,
        overallFeedback: stripHtml(overallFeedbackDraft)
      };
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
      spaceToast.error(err?.response?.data?.error || err?.response?.data?.message || t('dailyChallenge.failedToSaveFeedback', 'Failed to save feedback'));
    } finally {
      setSavingFeedback(false);
    }
  };

  

  // Scroll to question function
  const scrollToQuestion = (questionId) => {
    const element = questionRefs.current[questionId];
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Helper function to render section questions (used in Reading/Listening sections)
  const renderSectionQuestion = (q, qIndex, sectionType = 'reading', sectionIndex = null) => {
    const questionText = q.questionText || q.question || '';
    const studentAnswer = studentAnswers?.[q.id];
    const questionRefId = sectionIndex !== null ? `${sectionType}-${sectionIndex + 1}-q-${q.id || qIndex}` : null;

    if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE' || q.type === 'MULTIPLE_SELECT') {
      const options = q.options || [];
      const isMulti = q.type === 'MULTIPLE_SELECT';
      const correctOption = options.find(opt => opt.isCorrect);
      const correctKey = q.type === 'TRUE_OR_FALSE' ? (correctOption?.text) : correctOption?.key;
      const correctKeys = isMulti ? options.filter(opt => opt.isCorrect).map(opt => opt.key) : [];
      
      return (
        <div 
          key={q.id} 
          ref={questionRefId ? (el => { if (el) questionRefs.current[questionRefId] = el; }) : null}
          style={{
          padding: '16px',
          background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`
        }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', position: 'relative' }}>
            {t('dailyChallenge.question')} {qIndex + 1}:
            <span style={{ position: 'absolute', right: 0, top: 0, fontSize: '16px', fontWeight: 600, opacity: 0.7 }}>
              {(q.receivedScore || 0)} / {(q.points || 0)} {t('dailyChallenge.points')}
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
              const isUnanswered = isMulti ? (Array.isArray(studentAnswer) && studentAnswer.length === 0) : (!isSelected && studentAnswer == null);
              // MULTIPLE_SELECT: only show yellow when no option was selected at all
              const isCorrectMissing = isMulti ? (isUnanswered && isCorrectAnswer) : false;
              
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
                    {q.type === 'TRUE_OR_FALSE' ? (opt === 'True' || opt === t('dailyChallenge.true') ? 'A' : 'B') : key}.
                  </span>
                  <span className="option-text" style={{ flex: 1, lineHeight: '1.6', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', fontWeight: '350' }} dangerouslySetInnerHTML={{ __html: q.type === 'TRUE_OR_FALSE' ? (opt === 'True' ? t('dailyChallenge.true') : opt === 'False' ? t('dailyChallenge.false') : opt) : text }} />
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
        <div 
          key={q.id} 
          ref={questionRefId ? (el => { if (el) questionRefs.current[questionRefId] = el; }) : null}
          style={{ padding: '16px', background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}` }}>
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
        const regex = /\[\[pos_(.*?)\]\]/g;
        let slotCounter = 0;
        const baseStyles = [
          'display:inline-block',
          'min-width:120px',
          'max-width:200px',
          'min-height:32px',
          'padding:4px 12px',
          'margin:0 8px',
          'border-radius:8px',
          'box-sizing:border-box',
          'text-align:center',
          'vertical-align:middle',
          'line-height:1.4',
          'font-size:14px',
          'font-weight:600',
          'word-wrap:break-word',
          'overflow-wrap:break-word',
          'word-break:break-word',
          'white-space:normal',
          'overflow:hidden'
        ].join(';');

        const hasPositionIds = contentData.some(item => {
          const pos = String(item?.positionId ?? '');
          return pos.length > 0;
        });

        const groupKeyFromId = (id) => {
          if (!id || typeof id !== 'string') return id;
          const match = id.match(/^([^_]+?\d+)/);
          return (match && match[1]) || id.split('_')[0] || id;
        };

        const extractNumber = (key) => {
          if (!key) return 0;
          const match = key.match(/(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        };

        const groupKeysInOrder = (() => {
          if (hasPositionIds) return [];
          const seen = new Set();
          const order = [];
          contentData.forEach((item, idx) => {
            if (!item || !item.id) return;
            const key = groupKeyFromId(item.id);
            if (key && !seen.has(key)) {
              seen.add(key);
              order.push({ key, idx });
            }
          });
          order.sort((a, b) => {
            const numA = extractNumber(a.key);
            const numB = extractNumber(b.key);
            if (numA !== numB) return numA - numB;
            return a.idx - b.idx;
          });
          return order.map(entry => entry.key);
        })();

        const getOptionsForSlot = (slotIndex, rawToken) => {
          if (hasPositionIds) {
            return contentData.filter(opt => {
              const optPosId = String(opt.positionId || '');
              return optPosId === `pos_${rawToken}` || optPosId === rawToken;
            });
          }
          const groupKey = groupKeysInOrder[slotIndex];
          if (!groupKey) return contentData;
          return contentData.filter(opt => groupKeyFromId(opt?.id) === groupKey);
        };

        return String(questionText || '').replace(regex, (_match, rawId) => {
          const slotIndex = slotCounter++;
          const positionId = `pos_${rawId}`;
          const rawPositionId = rawId;
          const optionsForPosition = getOptionsForSlot(slotIndex, rawId);

          const correctItem =
            optionsForPosition.find(it => it.correct) ||
            (optionsForPosition.length > 0 ? optionsForPosition[0] : null);
          const correctAnswerText = stripHtmlSimple(correctItem?.value || '');

          const optionValues = optionsForPosition
            .map(it => stripHtmlSimple(it?.value || ''))
            .filter(Boolean);

          const studentAnswerRaw =
            studentAnswerObj[positionId] ||
            studentAnswerObj[rawPositionId] ||
            studentAnswerObj[rawId] ||
            '';
          const studentAnswerText = stripHtmlSimple(studentAnswerRaw);

          const isCorrect =
            correctAnswerText &&
            studentAnswerText &&
            studentAnswerText.toLowerCase() === correctAnswerText.toLowerCase();
          const isUnanswered = !studentAnswerText;
          const displayValue = isUnanswered ? (correctAnswerText || '—') : studentAnswerText;

          const ddBg = isCorrect
            ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
            : isUnanswered
              ? (theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)')
              : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)');
          const ddBorder = isCorrect ? 'rgb(82, 196, 26)' : (isUnanswered ? '#faad14' : 'rgb(255, 77, 79)');
          const ddColor = isUnanswered ? '#faad14' : (isCorrect ? '#52c41a' : '#ff4d4f');

          let replacement = `<span style="${baseStyles};background:${ddBg};border:2px solid ${ddBorder};color:${ddColor};">${escapeHtmlSimple(displayValue)}</span>`;

          if (!isCorrect && !isUnanswered && correctAnswerText) {
            const extraStyle = [
              'font-size:15px',
              'color:#52c41a',
              'font-weight:600',
              'white-space:nowrap',
              'margin-left:8px',
              'margin-right:8px',
              'display:inline-block'
            ].join(';');
            replacement += `<span style="${extraStyle}">${escapeHtmlSimple(correctAnswerText)}</span>`;
          }

          if (optionValues.length) {
            const listStyle = [
              'display:inline-flex',
              'gap:4px',
              'margin-left:8px',
              'font-size:12px',
              'color:#999999',
              'vertical-align:middle'
            ].join(';');
            const optionsHtml = optionValues
              .map(opt => `<span style="padding:2px 6px;border:1px solid rgba(0,0,0,0.15);border-radius:4px;display:inline-block;">${escapeHtmlSimple(opt)}</span>`)
              .join('');
            replacement += `<span style="${listStyle}">${optionsHtml}</span>`;
          }

          return replacement;
        });
      };

      const dropdownHtml = renderDropdownForSection();

      return (
        <div 
          key={q.id} 
          ref={questionRefId ? (el => { if (el) questionRefs.current[questionRefId] = el; }) : null}
          style={{ padding: '16px', background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}` }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', position: 'relative' }}>
            Question {qIndex + 1}:
            <span style={{ position: 'absolute', right: 0, top: 0, fontSize: '16px', fontWeight: 600, opacity: 0.7 }}>
              {(q.receivedScore || 0)} / {(q.points || 0)} points
            </span>
          </div>
          <div
            style={{ 
              fontSize: '15px', 
              fontWeight: 350, 
              lineHeight: '1.8', 
              color: '#000000',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              overflow: 'hidden',
              width: '100%'
            }}
            dangerouslySetInnerHTML={{ __html: dropdownHtml }}
          />
        </div>
      );
    }

    // DRAG_AND_DROP for sections
    if (q.type === 'DRAG_AND_DROP') {
      const contentData = q.content?.data || [];
      const studentAnswerObj = studentAnswers?.[q.id] || {};
      
      const renderDragDropForSection = () => {
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
          const correctAnswerText = stripHtmlSimple(correctItem?.value || '');
          
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
          const isCorrect = correctAnswerText && studentAnswer.trim().toLowerCase() === correctAnswerText.trim().toLowerCase();
          const isUnanswered = !studentAnswer || studentAnswer.trim().length === 0;
          const displayValue = isUnanswered ? (correctAnswerText || '—') : studentAnswer;
          const bgColor = isCorrect
            ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
            : isUnanswered
              ? (theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)')
              : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)');
          const borderColor = isCorrect ? 'rgb(82, 196, 26)' : (isUnanswered ? '#faad14' : 'rgb(255, 77, 79)');
          const textColor = isCorrect ? '#52c41a' : (isUnanswered ? '#faad14' : '#ff4d4f');
          
          parts.push(
            <span
              key={`drag_${inputIndex}`}
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
                boxSizing: 'border-box',
                textAlign: 'center',
                verticalAlign: 'middle',
                lineHeight: '1.4',
                fontSize: '15px',
                fontWeight: 350,
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                overflow: 'hidden',
                color: textColor
              }}
            >
              {displayValue}
            </span>
          );
          
          // Show correct answer only when answered wrong (not for unanswered since shown inside span)
          if (!isCorrect && correctAnswerText && !(isUnanswered)) {
            parts.push(
              <span key={`answer_${inputIndex}`} style={{ fontSize: '15px', color: '#52c41a', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px', marginRight: '8px', display: 'inline-block' }}>
                {correctAnswerText}
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
        <div 
          key={q.id} 
          ref={questionRefId ? (el => { if (el) questionRefs.current[questionRefId] = el; }) : null}
          style={{ padding: '16px', background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}` }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', position: 'relative' }}>
            Question {qIndex + 1}:
            <span style={{ position: 'absolute', right: 0, top: 0, fontSize: '16px', fontWeight: 600, opacity: 0.7 }}>
              {(q.receivedScore || 0)} / {(q.points || 0)} points
            </span>
          </div>
          <div style={{ display: 'flex', gap: '24px', minHeight: '300px' }}>
            <div style={{ flex: '1', padding: '20px', background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, overflow: 'auto' }}>
              <div style={{ fontSize: '15px', fontWeight: 350, lineHeight: '1.8', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                {renderDragDropForSection()}
              </div>
            </div>
            <div style={{ flex: '1', padding: '20px', background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}` }}>
              <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '16px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>Available words:</Typography.Text>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
                {contentData.map((item, idx) => {
                  const itemValue = item?.value || '';
                  const isCorrectWord = item?.correct === true;
                  return (
                      <div key={idx} style={{ padding: '12px 20px', background: isCorrectWord ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)') : (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)'), border: `2px solid ${isCorrectWord ? '#52c41a' : '#ff4d4f'}`, borderRadius: '12px', fontSize: '16px', fontWeight: '600', color: isCorrectWord ? '#52c41a' : '#ff4d4f', cursor: 'default', userSelect: 'none', minWidth: '80px', maxWidth: '200px', textAlign: 'center', wordBreak: 'break-word', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: itemValue }} />
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
      const normalizeWord = (word) => stripHtmlSimple(typeof word === 'string' ? word : String(word || '')).toLowerCase();
      const normalizeDisplay = (word) => {
        if (word === null || word === undefined) return '';
        if (typeof word === 'string') return word;
        return String(word);
      };
      
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
      const studentOrderRaw = Array.isArray(studentAnswer) 
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
      const studentOrder = studentOrderRaw
        .map((word) => normalizeDisplay(word))
        .filter((word) => word && word.toString().trim().length > 0);

      const normalizedStudent = studentOrder.map(normalizeWord);
      const normalizedCorrect = correctOrder.map((word) => normalizeWord(word));

      const isCorrect = normalizedStudent.length === normalizedCorrect.length &&
        normalizedStudent.every((word, idx) => word === normalizedCorrect[idx]);
      const displayText = ((questionText).replace(/\[\[pos_.*?\]\]/g, '')).trim();

      return (
        <div 
          key={q.id} 
          ref={questionRefId ? (el => { if (el) questionRefs.current[questionRefId] = el; }) : null}
          style={{ padding: '16px', background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}` }}>
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
            <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '16px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>Student answer:</Typography.Text>
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
      <div key={section.id || index} className={`question-item ${theme}-question-item`} style={{ marginBottom: '24px', borderRadius: '16px', padding: '24px', border: '2px solid', borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)', contentVisibility: 'auto', containIntrinsicSize: '1000px 400px' }}>
        <div className="question-header" style={{ paddingBottom: '14px', marginBottom: '16px', borderBottom: '2px solid', borderBottomColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Text strong style={{ fontSize: '20px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
              {index + 1}. {t('dailyChallenge.readingSection')}
            </Typography.Text>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: theme === 'sun' ? '#1890ff' : '#8B5CF6' }}>
            {sectionTotals.received} / {sectionTotals.total} {t('dailyChallenge.points')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', minHeight: '500px' }}>
          <div className="reading-passage-scrollbar" style={{ flex: '1', padding: '20px', background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, overflowY: 'auto', maxHeight: '600px', scrollbarWidth: 'thin', scrollbarColor: theme === 'sun' ? '#1890ff rgba(24, 144, 255, 0.2)' : '#8B5CF6 rgba(138, 122, 255, 0.2)' }}>
            <div className="passage-text-content" style={{ fontSize: '15px', lineHeight: '1.8', color: theme === 'sun' ? '#333' : '#1F2937', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: section.passage || '' }} />
          </div>
          <div style={{ flex: '1', background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, overflowY: 'auto', maxHeight: '600px' }}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {section.questions?.map((q, qIndex) => renderSectionQuestion(q, qIndex, 'reading', index))}
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
      <div key={section.id || index} className={`question-item ${theme}-question-item`} style={{ marginBottom: '24px', borderRadius: '16px', padding: '24px', border: '2px solid', borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)', contentVisibility: 'auto', containIntrinsicSize: '1000px 400px' }}>
        <div className="question-header" style={{ paddingBottom: '14px', marginBottom: '16px', borderBottom: '2px solid', borderBottomColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Text strong style={{ fontSize: '20px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
              {index + 1}. {t('dailyChallenge.listeningSection')}
            </Typography.Text>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: theme === 'sun' ? '#1890ff' : '#8B5CF6' }}>
            {sectionTotals.received} / {sectionTotals.total} {t('dailyChallenge.points')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', minHeight: '500px' }}>
          <div className="listening-passage-scrollbar" style={{ flex: '1', padding: '20px', background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, overflowY: 'auto', maxHeight: '600px', scrollbarWidth: 'thin', scrollbarColor: theme === 'sun' ? '#1890ff rgba(24, 144, 255, 0.2)' : '#8B5CF6 rgba(138, 122, 255, 0.2)' }}>
            <div style={{ background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, boxShadow: theme === 'sun' ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.2)' }}>
              <Typography.Text style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', display: 'block' }}>{t('dailyChallenge.audioTranscript')}</Typography.Text>
              <audio controls style={{ width: '100%', marginBottom: '16px' }}>
                <source src={section.audioUrl} type="audio/wav" />
                {t('dailyChallenge.browserNotSupportAudio')}
              </audio>
              <div className="passage-text-content" style={{ fontSize: '15px', lineHeight: '1.8', color: theme === 'sun' ? '#333' : '#1F2937', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: section.transcript || '' }} />
            </div>
          </div>
          <div style={{ flex: '1', background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, overflowY: 'auto', maxHeight: '600px' }}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {section.questions?.map((q, qIndex) => renderSectionQuestion(q, qIndex, 'listening', index))}
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
              {index + 1}. {t('dailyChallenge.writingSection')}
            </Typography.Text>
          </div>
          {!isStudent && !isManager ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {!hasExistingGradingForSection(section.id) ? (
                <>
                  <Button
                    size="small"
                    onClick={() => handleOpenAddFeedback(section.id, 'section')}
                    style={{ fontSize: '13px', height: '28px', padding: '0 12px' }}
                  >
                    {t('dailyChallenge.addScoreFeedback', 'Add Score/Feedback')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="small"
                    onClick={() => handleOpenEditFeedback(section.id, 'section')}
                    style={{ fontSize: '13px', height: '28px', padding: '0 12px' }}
                  >
                    {t('dailyChallenge.editScoreFeedback')}
                  </Button>
                </>
              )}
            </div>
          ) : (
            hasExistingGradingForSection(section.id) && (
              <Button
                size="small"
                onClick={() => handleOpenEditFeedback(section.id, 'section')}
                style={{ fontSize: '13px', height: '28px', padding: '0 12px' }}
              >
                {t('dailyChallenge.viewFeedback')}
              </Button>
            )
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
                  <Typography.Text style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'block' }}>{t('dailyChallenge.studentsEssay')}</Typography.Text>
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
                      parseTextWithImages(studentEssayText)
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
    // Try to get audioUrl from section-level answer first, then from first question if available
    let audioUrl = studentAnswer?.audioUrl || studentAnswer?.audio || null;
    // Fallback: check if any question in this section has audioUrl
    if (!audioUrl && section.questions && section.questions.length > 0) {
      const firstQuestion = section.questions[0];
      const questionAnswer = studentAnswers?.[firstQuestion.id] || {};
      audioUrl = questionAnswer?.audioUrl || questionAnswer?.audio || null;
    }
    const sectionId = section.id || `speaking-${index}`;
    const audioState = audioStates[sectionId] || { isPlaying: false, currentTime: 0, duration: 0, volume: 1 };
    
    // Get or create audio ref for this section
    if (!audioRefs.current[sectionId]) {
      audioRefs.current[sectionId] = React.createRef();
    }
    const audioRef = audioRefs.current[sectionId];

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
              {index + 1}. {hasAudio ? t('dailyChallenge.speakingWithAudioSection') : t('dailyChallenge.speakingSection')}
            </Typography.Text>
          </div>
          {!isStudent && !isManager ? (
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
                    {t('dailyChallenge.addScoreFeedback', 'Add Score/Feedback')}
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
                    {t('dailyChallenge.editScoreFeedback')}
                  </Button>
                </>
              )}
            </div>
          ) : (
            hasExistingGradingForSection(section.id) && (
              <Button
                size="small"
                onClick={() => handleOpenEditFeedback(section.id, 'section')}
                style={{
                  fontSize: '13px',
                  height: '28px',
                  padding: '0 12px'
                }}
              >
                {t('dailyChallenge.viewFeedback')}
              </Button>
            )
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
                    {t('dailyChallenge.browserNotSupportAudio')}
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
              <div className="passage-text-content" style={{ fontSize: '15px', lineHeight: '1.8', color: theme === 'sun' ? '#333' : '#1F2937', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: extractDurationMarker(section.transcript || section.prompt || '').cleanedContent }} />
            )}
          </div>
          
          {/* Right Section - Recording Area */}
          <div style={{ flex: '1', background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, padding: hasAudio ? '24px' : '20px', textAlign: hasAudio ? 'center' : 'left' }}>
            <Typography.Text style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'block' }}>
              {hasAudio ? (audioUrl ? t('dailyChallenge.studentRecordedAudio', 'Student Recorded Audio:') : t('dailyChallenge.recordYourResponse', 'Record Your Response:')) : t('dailyChallenge.studentsRecording', "Student's Recording:")}
            </Typography.Text>
            {audioUrl ? (
              <div>
                {(() => {
                  // Check if URL is a video format
                  const isVideo = /\.(webm|mp4|ogg|mov)$/i.test(audioUrl) || audioUrl.includes('.webm') || audioUrl.includes('.mp4');
                  if (isVideo) {
                    return (
                      <video controls style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' }}>
                        <source src={audioUrl} type="video/webm" />
                        <source src={audioUrl} type="video/mp4" />
                        <source src={audioUrl} type="video/ogg" />
                        {t('dailyChallenge.browserNotSupportVideo')}
                      </video>
                    );
                  } else {
                    return (
                      <audio controls style={{ width: '100%', height: hasAudio ? '40px' : 'auto' }}>
                        <source src={audioUrl} type="audio/webm" />
                        <source src={audioUrl} type="audio/mpeg" />
                        <source src={audioUrl} type="audio/wav" />
                        <source src={audioUrl} type="audio/mp3" />
                        {t('dailyChallenge.browserNotSupportAudio')}
                      </audio>
                    );
                  }
                })()}
              </div>
            ) : (
              <Typography.Text type="secondary" style={{ fontSize: '14px', fontStyle: 'italic' }}>
                {t('dailyChallenge.noRecordingSubmitted')}
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
    const hasSubmissionData = Boolean(q.hasSubmissionData);
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
              {t('dailyChallenge.question')} {questionNumber}
            </Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}>
                {(q.receivedScore || 0)} / {(q.points || 0)} {t('dailyChallenge.points')}
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
              {(q.type === 'TRUE_OR_FALSE' ? [t('dailyChallenge.true'), t('dailyChallenge.false')] : options).map((opt, idx) => {
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
                const isQuestionUnanswered = !hasSubmissionData;
                const shouldShowCorrectWarning = isCorrectAnswer && isQuestionUnanswered;
                const shouldShowCorrectSuccess = isCorrectAnswer && !isQuestionUnanswered;
                
                const optionBackground = shouldShowCorrectWarning
                  ? (theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)')
                  : shouldShowCorrectSuccess
                    ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)')
                    : isSelectedWrong
                      ? (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)')
                      : (theme === 'sun' ? '#fff' : 'rgba(255,255,255,0.03)');
                
                const optionBorder = shouldShowCorrectWarning
                  ? '#faad14'
                  : shouldShowCorrectSuccess
                    ? 'rgb(82, 196, 26)'
                    : (isSelectedWrong ? 'rgb(255, 77, 79)' : (theme === 'sun' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'));
                
                return (
                  <div key={key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 18px',
                    background: optionBackground,
                    border: `2px solid ${optionBorder}`,
                    borderRadius: '12px',
                  }}>
                    <input 
                      type={isMulti ? 'checkbox' : 'radio'}
                      checked={isSelected || isCorrectMissing}
                      disabled
                      style={{ 
                        width: '18px',
                        height: '18px',
                        accentColor: shouldShowCorrectWarning
                          ? '#faad14'
                          : (isCorrectAnswer
                            ? '#52c41a'
                            : (isSelectedWrong ? '#ff4d4f' : (theme === 'sun' ? '#1890ff' : '#8B5CF6'))),
                      }} 
                    />
                    <span style={{ 
                      flexShrink: 0, 
                      color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                      fontWeight: '600',
                      fontSize: '16px'
                    }}>
                      {q.type === 'TRUE_OR_FALSE' ? (opt === 'True' || opt === t('dailyChallenge.true') ? 'A' : 'B') : key}.
                    </span>
                    <span 
                      className="option-text"
                      style={{ 
                        flex: 1, 
                        lineHeight: '1.6',
                        color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                        fontWeight: '350'
                      }}
                      dangerouslySetInnerHTML={{ __html: q.type === 'TRUE_OR_FALSE' ? (opt === 'True' ? t('dailyChallenge.true') : opt === 'False' ? t('dailyChallenge.false') : opt) : text }}
                    />
                    {isSelectedWrong && (
                      <CloseCircleOutlined style={{
                        fontSize: '22px',
                        color: '#ff4d4f',
                        marginLeft: 'auto',
                      }} />
                    )}
                    {(isQuestionUnanswered && isCorrectAnswer) && !isSelectedWrong && (
                      <CheckCircleOutlined style={{
                        fontSize: '20px',
                        color: '#faad14',
                        marginLeft: 'auto',
                      }} />
                    )}
                    {(!isQuestionUnanswered) && isCorrectAnswer && !isSelectedWrong && (
                      <CheckCircleOutlined style={{
                        fontSize: '20px',
                        color: '#52c41a',
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
        const regex = /\[\[pos_(.*?)\]\]/g;
        const baseStyles = [
          'display:inline-block',
          'min-width:120px',
          'max-width:200px',
          'min-height:32px',
          'padding:4px 12px',
          'margin:0 8px',
          'border-radius:8px',
          'box-sizing:border-box',
          'text-align:center',
          'vertical-align:middle',
          'line-height:1.4',
          'font-size:14px'
        ].join(';');

        const questionHasSubmission = hasSubmissionData;

        return String(questionText || '').replace(regex, (_match, rawId) => {
          const positionId = `pos_${rawId}`;
          const rawPositionId = rawId;

          let correctItem = contentData.find(item =>
            (String(item.positionId || '') === positionId || String(item.positionId || '') === rawPositionId) && item.correct
          );
          if (!correctItem) {
            correctItem = contentData.find(item =>
              String(item.positionId || '') === positionId || String(item.positionId || '') === rawPositionId
            );
          }

          const correctAnswerText = stripHtmlSimple(correctItem?.value || '');

          let studentAnswerRaw = '';
          if (typeof studentAnswerObj === 'object' && studentAnswerObj !== null) {
            studentAnswerRaw =
              studentAnswerObj[positionId] ||
              studentAnswerObj[rawPositionId] ||
              studentAnswerObj[rawId] ||
              '';
          } else if (typeof studentAnswerObj === 'string') {
            studentAnswerRaw = studentAnswerObj;
          }
          const studentAnswerText = stripHtmlSimple(studentAnswerRaw);

          const isCorrect =
            correctAnswerText &&
            studentAnswerText &&
            studentAnswerText.toLowerCase() === correctAnswerText.toLowerCase();
          const hasSlotSubmission = Boolean(studentAnswerText);

          let displayValue = hasSlotSubmission ? studentAnswerText : '—';

          let bgColor;
          let borderColor;
          let textColor;
          let fontWeight = hasSlotSubmission ? '400' : '600';

          if (isCorrect && hasSlotSubmission) {
            bgColor = theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)';
            borderColor = 'rgb(82, 196, 26)';
            textColor = theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)';
          } else {
            bgColor = theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)';
            borderColor = 'rgb(255, 77, 79)';
            textColor = '#ff4d4f';
            if (!hasSlotSubmission && correctAnswerText) {
              displayValue = '—';
            }
          }

          let replacement = `<span style="${baseStyles};background:${bgColor};border:2px solid ${borderColor};color:${textColor};font-weight:${fontWeight};">${escapeHtmlSimple(displayValue)}</span>`;

          const shouldShowCorrectAnswerHint = Boolean(correctAnswerText) && (!isCorrect || !hasSlotSubmission || !questionHasSubmission);

          if (shouldShowCorrectAnswerHint) {
            const extraStyle = [
              'font-size:15px',
              'color:#52c41a',
              'font-weight:600',
              'white-space:nowrap',
              'margin-left:8px',
              'margin-right:8px',
              'display:inline-block'
            ].join(';');
            replacement += `<span style="${extraStyle}">${escapeHtmlSimple(correctAnswerText)}</span>`;
          }

          return replacement;
        });
      };

      const fillHtml = renderFillBlankInputs();

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
              {t('dailyChallenge.question')} {questionNumber}
            </Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}>
                {(q.receivedScore || 0)} / {(q.points || 0)} {t('dailyChallenge.points')}
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
            <div
              style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 350, lineHeight: '1.8', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}
              dangerouslySetInnerHTML={{ __html: fillHtml }}
            />
          </div>
        </div>
      );
    }

    // DROPDOWN
    if (q.type === 'DROPDOWN') {
      const contentData = q.content?.data || [];
      const studentAnswerObj = studentAnswers?.[q.id] || {};
      
      const renderDropdownSelects = () => {
        const regex = /\[\[pos_(.*?)\]\]/g;
        const baseStyles = [
          'display:inline-block',
          'min-width:120px',
          'max-width:200px',
          'height:32px',
          'padding:4px 12px',
          'margin:0 8px',
          'border-radius:8px',
          'box-sizing:border-box',
          'font-size:14px',
          'font-weight:600',
          'cursor:not-allowed',
          'outline:none',
          'vertical-align:middle',
          'text-align:center',
          'text-align-last:center',
          'word-wrap:break-word',
          'overflow-wrap:break-word',
          'word-break:break-word',
          'white-space:normal',
          'overflow:hidden'
        ].join(';');

        return String(questionText || '').replace(regex, (_match, rawId) => {
          const positionId = `pos_${rawId}`;
          const rawPositionId = rawId;
          
          const optionsForPosition = contentData.filter(opt => {
            const optPosId = String(opt.positionId || '');
            return optPosId === positionId || optPosId === rawPositionId;
          }) || [];
          
          const correctItem = optionsForPosition.find(it => it.correct) || 
                             (optionsForPosition.length > 0 ? optionsForPosition[0] : null);
          const correctAnswer = correctItem?.value || '';
          
          // Get student answer - check multiple possible keys
          let studentAnswerRaw = '';
          if (typeof studentAnswerObj === 'object' && studentAnswerObj !== null) {
            studentAnswerRaw = studentAnswerObj[positionId] || 
                            studentAnswerObj[rawPositionId] || 
                            studentAnswerObj[rawId] || 
                            '';
          } else if (typeof studentAnswerObj === 'string') {
            studentAnswerRaw = studentAnswerObj;
          }
          const studentAnswer = stripHtmlSimple(studentAnswerRaw);
          
          const isCorrect = correctAnswer && studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
          const isUnanswered = !studentAnswer || studentAnswer.trim().length === 0;
          const displayedValue = isUnanswered ? correctAnswer : studentAnswer;
          const optionValues = optionsForPosition.map(it => stripHtmlSimple(it.value)).filter(Boolean);
          
          const ddBg = isCorrect
            ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
            : isUnanswered
              ? (theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)')
              : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)');
          const ddBorder = isCorrect ? 'rgb(82, 196, 26)' : (isUnanswered ? '#faad14' : 'rgb(255, 77, 79)');
          const ddColor = isUnanswered ? '#faad14' : (isCorrect ? '#52c41a' : '#ff4d4f');

          const optionsHtml = optionValues.map(opt => 
            `<option value="${escapeHtmlSimple(opt)}" ${opt === displayedValue ? 'selected' : ''}>${escapeHtmlSimple(opt)}</option>`
          ).join('');

          let replacement = `<select disabled style="${baseStyles};background:${ddBg};border:2px solid ${ddBorder};color:${ddColor};">${optionsHtml}</select>`;

          // Only show side answer when answered wrong; for unanswered it's inside select
          // Also check questionHasSubmission to determine if we should show hint
          const shouldShowCorrectAnswerHint = Boolean(correctAnswer) && !isCorrect && !isUnanswered;
          if (shouldShowCorrectAnswerHint) {
            const extraStyle = [
              'font-size:15px',
              'color:#52c41a',
              'font-weight:600',
              'white-space:nowrap',
              'margin-left:8px',
              'margin-right:8px',
              'display:inline-block'
            ].join(';');
            replacement += `<span style="${extraStyle}">${escapeHtmlSimple(correctAnswer)}</span>`;
          }

          return replacement;
        });
      };

      const dropdownHtml = renderDropdownSelects();

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
              {t('dailyChallenge.question')} {questionNumber}
            </Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}>
                {(q.receivedScore || 0)} / {(q.points || 0)} {t('dailyChallenge.points')}
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
            <div
              style={{ 
                fontSize: '15px', 
                fontWeight: 350,
                lineHeight: '1.8',
                color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                marginBottom: '16px',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                overflow: 'hidden',
                width: '100%'
              }}
              dangerouslySetInnerHTML={{ __html: dropdownHtml }}
            />
          </div>
        </div>
      );
    }

    // DRAG_AND_DROP
    if (q.type === 'DRAG_AND_DROP') {
      const contentData = q.content?.data || [];
      const studentAnswerObj = studentAnswers?.[q.id] || {};
      
      const renderDragDropInputs = () => {
        const regex = /\[\[pos_(.*?)\]\]/g;
        const baseStyles = [
          'display:inline-block',
          'min-width:120px',
          'max-width:200px',
          'min-height:32px',
          'padding:4px 12px',
          'margin:0 8px',
          'border-radius:8px',
          'box-sizing:border-box',
          'text-align:center',
          'vertical-align:middle',
          'line-height:1.4',
          'font-size:15px',
          'font-weight:350',
          'word-wrap:break-word',
          'overflow-wrap:break-word',
          'word-break:break-word',
          'white-space:normal',
          'overflow:hidden'
        ].join(';');

        return String(questionText || '').replace(regex, (_match, rawId) => {
          const positionId = `pos_${rawId}`;
          const rawPositionId = rawId;

          let correctItem = contentData.find(item =>
            (String(item.positionId || '') === positionId || String(item.positionId || '') === rawPositionId) && item.correct
          );
          if (!correctItem) {
            correctItem = contentData.find(item =>
              String(item.positionId || '') === positionId || String(item.positionId || '') === rawPositionId
            );
          }

          const correctAnswerText = stripHtmlSimple(correctItem?.value || '');

          let studentAnswerRaw = '';
          if (typeof studentAnswerObj === 'object' && studentAnswerObj !== null) {
            studentAnswerRaw =
              studentAnswerObj[positionId] ||
              studentAnswerObj[rawPositionId] ||
              studentAnswerObj[rawId] ||
              '';
          } else if (typeof studentAnswerObj === 'string') {
            studentAnswerRaw = studentAnswerObj;
          }
          const studentAnswerText = stripHtmlSimple(studentAnswerRaw);

          const isCorrect =
            correctAnswerText &&
            studentAnswerText &&
            studentAnswerText.toLowerCase() === correctAnswerText.toLowerCase();
          const isUnanswered = !studentAnswerText;
          const displayValue = isUnanswered ? (correctAnswerText || '—') : studentAnswerText;

          const bgColor = isCorrect
            ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
            : isUnanswered
              ? (theme === 'sun' ? 'rgba(250, 173, 20, 0.12)' : 'rgba(250, 173, 20, 0.2)')
              : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)');
          const borderColor = isCorrect ? 'rgb(82, 196, 26)' : (isUnanswered ? '#faad14' : 'rgb(255, 77, 79)');
          const textColor = isCorrect ? '#52c41a' : (isUnanswered ? '#faad14' : '#ff4d4f');

          let replacement = `<span style="${baseStyles};background:${bgColor};border:2px solid ${borderColor};color:${textColor};">${escapeHtmlSimple(displayValue)}</span>`;

          if (!isCorrect && !isUnanswered && correctAnswerText) {
            const extraStyle = [
              'font-size:15px',
              'color:#52c41a',
              'font-weight:600',
              'white-space:nowrap',
              'margin-left:8px',
              'margin-right:8px',
              'display:inline-block'
            ].join(';');
            replacement += `<span style="${extraStyle}">${escapeHtmlSimple(correctAnswerText)}</span>`;
          }

          return replacement;
        });
      };

      const dragDropHtml = renderDragDropInputs();

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
              {t('dailyChallenge.question')} {questionNumber}
            </Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}>
                {(q.receivedScore || 0)} / {(q.points || 0)} {t('dailyChallenge.points')}
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
                <div
                  style={{ fontSize: '15px', fontWeight: 350, lineHeight: '1.8', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}
                  dangerouslySetInnerHTML={{ __html: dragDropHtml }}
                />
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
                        maxWidth: '200px',
                        textAlign: 'center',
                        wordBreak: 'break-word',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal',
                        overflow: 'hidden'
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
      const normalizeWord = (word) => stripHtmlSimple(typeof word === 'string' ? word : String(word || '')).toLowerCase();
      const normalizeDisplay = (word) => {
        if (word === null || word === undefined) return '';
        if (typeof word === 'string') return word;
        return String(word);
      };
      
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
      const studentOrderRaw = Array.isArray(studentAnswer) 
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
      const studentOrder = studentOrderRaw
        .map((word) => normalizeDisplay(word))
        .filter((word) => word && word.toString().trim().length > 0);
      
      const normalizedStudent = studentOrder.map(normalizeWord);
      const normalizedCorrect = correctOrder.map((word) => normalizeWord(word));
      
      const isCorrect = normalizedStudent.length === normalizedCorrect.length && 
        normalizedStudent.every((word, idx) => word === normalizedCorrect[idx]);
      
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
              {t('dailyChallenge.question')} {questionNumber}
            </Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}>
                {(q.receivedScore || 0)} / {(q.points || 0)} {t('dailyChallenge.points')}
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
              {t('dailyChallenge.question')} {questionNumber}
            </Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500
              }}>
                {(q.receivedScore || 0)} / {(q.points || 0)} {t('dailyChallenge.points')}
              </Typography.Text>
              <Typography.Text style={{ 
                fontSize: '14px', 
                color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                fontStyle: 'italic'
              }}>
                {t('dailyChallenge.rewrite')}
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
                {studentAnswerText || t('dailyChallenge.noAnswerProvided')}
              </div>
            </div>
            {correctAnswersDisplay.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '8px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                  {correctAnswersDisplay.length > 1 ? t('dailyChallenge.correctAnswers') : t('dailyChallenge.correctAnswer')}
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
                {(q.receivedScore || 0)} / {(q.points || 0)} {t('dailyChallenge.points')}
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
            {!isStudent && !isManager && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                <Button
                  icon={<FileTextOutlined />}
                  loading={savingFeedback}
                  onClick={() => { 
                    const existingPenalty = submissionData?.submission?.penaltyApplied ?? 0;
                    setOverallFeedbackDraft(teacherFeedback || ''); 
                    setFinalScoreDraft(submissionData?.submission?.rawScore?.toString() || '');
                    setIsPenaltyEnabled(existingPenalty > 0);
                    setPenaltyAppliedDraft(
                      existingPenalty > 0
                        ? parseFloat((existingPenalty * 100).toFixed(2)).toString()
                        : ''
                    );
                    setOverallFeedbackModalVisible(true); 
                  }}
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
                {t('dailyChallenge.finalizeGrading', 'Finalize Grading')}
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
              overflowY: 'visible',
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
                          {t('dailyChallenge.info')}
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
                          {t('dailyChallenge.questions')}
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
                        {t('dailyChallenge.performance', 'Performance')}
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
                          <div style={{ position: 'relative', display: 'inline-block', paddingTop: '12px' }}>
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
                                // Show score if available (no longer require feedback for writing/speaking)
                                const hasScore = submission.score != null && submission.score !== undefined;
                                const shouldShowScore = hasScore;
                                
                                // Format score display with penalty
                                let scoreDisplay = '-';
                                if (hasScore) {
                                  const finalScore = submission.score;
                                  const penaltyApplied = submission.penaltyApplied ?? 0;
                                  // Display only the numeric score without unit or penalty percentage
                                  const formattedScore = Number.isFinite(Number(finalScore))
                                    ? Number(finalScore).toFixed(2).replace(/\.?0+$/, '')
                                    : finalScore;
                                  scoreDisplay = `${formattedScore}`;
                                }
                                
                                const dynamicFontSize = scoreDisplay.length > 8 ? 24 : scoreDisplay.length > 5 ? 28 : 36; // prevent wrapping for long scores
                                
                                return shouldShowScore ? (
                                  <>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                                      <Typography.Text
                                        strong
                                        style={{
                                          fontSize: `${dynamicFontSize}px`,
                                          fontWeight: 700,
                                          color: '#4CAF50',
                                          lineHeight: '1',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        {scoreDisplay}
                                      </Typography.Text>
                                      <Typography.Text
                                        strong
                                        style={{
                                          fontSize: '18px',
                                          fontWeight: 600,
                                          color: theme === 'sun' ? '#4a5568' : '#CBD5F5',
                                          lineHeight: '1'
                                        }}
                                      >
                                        /10
                                      </Typography.Text>
                                    </div>
                                    <Typography.Text
                                      style={{
                                        fontSize: '12px',
                                        color: theme === 'sun' ? '#666' : '#999',
                                        fontWeight: 400
                                      }}
                                    >
                                      {t('dailyChallenge.score', 'Score')}
                                    </Typography.Text>
                                  </>
                                ) : (
                                  <>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                                      <Typography.Text
                                        strong
                                        style={{
                                          fontSize: '36px',
                                          fontWeight: 700,
                                          color: theme === 'sun' ? '#999' : '#666',
                                          lineHeight: '1',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        -
                                      </Typography.Text>
                                      <Typography.Text
                                        strong
                                        style={{
                                          fontSize: '18px',
                                          fontWeight: 600,
                                          color: theme === 'sun' ? '#4a5568' : '#CBD5F5',
                                          lineHeight: '1'
                                        }}
                                      >
                                        /10
                                      </Typography.Text>
                                    </div>
                                    <Typography.Text
                                      style={{
                                        fontSize: '12px',
                                        color: theme === 'sun' ? '#666' : '#999',
                                        fontWeight: 400
                                      }}
                                    >
                                      {t('dailyChallenge.score', 'Score')}
                                    </Typography.Text>
                                  </>
                                );
                              })()}
                            </div>
                            {(() => {
                              const penaltyApplied = submission.penaltyApplied ?? 0;
                              if (penaltyApplied > 0) {
                                return (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: '24px',
                                      right: '13px',
                                      background: theme === 'sun' ? '#FFE0E0' : 'rgba(255, 224, 224, 0.9)',
                                      color: '#c53030',
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      boxShadow: theme === 'sun'
                                        ? '0 2px 6px rgba(229, 62, 62, 0.25)'
                                        : '0 2px 6px rgba(229, 62, 62, 0.35)'
                                    }}
                                  >
                                    -{Math.round(penaltyApplied * 100)}%
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            {/* Edit score button removed as requested */}
                          </div>
                        </div>

                        {/* Question Breakdown Grid */}
                        {(
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            {/* Total Weight - separated from other items */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <Typography.Text style={{ fontSize: '16px', fontWeight: 600, color: '#2563EB' }}>
                                {t('dailyChallenge.totalWeight', 'Total Weight')}
                              </Typography.Text>
                              <Typography.Text style={{ fontSize: '16px', fontWeight: 600, color: theme === 'sun' ? '#111827' : '#e2e8f0' }}>
                                {(() => {
                                  const totalWeight = submissionData.challenge?.totalWeight != null ? submissionData.challenge.totalWeight : '-';
                                  const maxPossibleWeight = submissionData.challenge?.maxPossibleWeight != null ? submissionData.challenge.maxPossibleWeight : '-';
                                  return `${totalWeight} / ${maxPossibleWeight}`;
                                })()}
                              </Typography.Text>
                            </div>
                            
                            {/* Other items grouped together */}
                            {(() => {
                              // For writing & speaking: show only Total Questions + Unanswered
                              // For other challenge types: show full breakdown
                              const baseItems = [
                                {
                                  label: t('dailyChallenge.totalQuestions', 'Total Questions'),
                                  value: submissionData.challenge?.totalQuestions != null ? submissionData.challenge.totalQuestions : '-',
                                  color: '#f97316'
                                },
                                {
                                  label: t('dailyChallenge.correct', 'Correct'),
                                  value: submission.correctCount != null ? submission.correctCount : '-',
                                  color: '#22c55e'
                                },
                                {
                                  label: t('dailyChallenge.incorrect', 'Incorrect'),
                                  value: submission.incorrectCount != null ? submission.incorrectCount : '-',
                                  color: '#ef4444'
                                },
                                {
                                  label: t('dailyChallenge.unanswered', 'Unanswered'),
                                  value: submission.unansweredCount != null ? submission.unansweredCount : '-',
                                  color: '#9ca3af'
                                }
                              ];

                              const items = hasWritingOrSpeaking
                                ? baseItems.filter((it) =>
                                    it.label === t('dailyChallenge.totalQuestions', 'Total Questions') || it.label === t('dailyChallenge.unanswered', 'Unanswered')
                                  )
                                : baseItems;

                              return items.map((item) => (
                              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography.Text style={{ fontSize: '14px', fontWeight: 600, color: item.color }}>
                                  {item.label}
                                </Typography.Text>
                                <Typography.Text style={{ fontSize: '14px', fontWeight: 600, color: theme === 'sun' ? '#111827' : '#e2e8f0' }}>
                                  {item.value}
                                </Typography.Text>
                              </div>
                              ));
                            })()}
                          </div>
                        )}
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
                        {t('dailyChallenge.teacherFeedback', 'Teacher Feedback')}
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
                      const plainText = (displayFeedback || '').replace(/<[^>]*>/g, '').trim();
                      const isLong = plainText.length > 200;
                      return (
                        <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '16px', background: theme === 'sun' ? '#ffffff' : 'rgba(255,255,255,0.03)' }}>
                          {plainText ? (
                            <>
                              <div
                                style={{
                                  fontSize: '15px',
                                  lineHeight: '1.8',
                                  color: theme === 'sun' ? '#333' : '#e2e8f0',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  wordBreak: 'break-word'
                                }}
                              >
                                {plainText}
                              </div>
                              {isLong && (
                                <div style={{ marginTop: 12, textAlign: 'center' }}>
                                  <Button
                                    onClick={() => setTeacherFeedbackDetailVisible(true)}
                                    className={`create-button ${theme}-create-button`}
                                    style={{
                                      height: '32px',
                                      borderRadius: '8px',
                                      fontWeight: 500,
                                      fontSize: '14px',
                                      padding: '0 18px',
                                      border: 'none',
                                      background: theme === 'sun'
                                        ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                                        : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                                      color: '#000000',
                                      boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)'
                                    }}
                                  >
                                    {t('dailyChallenge.viewDetails', 'View details')}
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div style={{ fontSize: '14px', color: theme === 'sun' ? '#666' : '#999', fontStyle: 'italic' }}>
                              {t('dailyChallenge.noFeedbackYet', 'No feedback yet')}
                            </div>
                          )}
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
                          {t('dailyChallenge.antiCheat', 'Anti-Cheat')}
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
                              <span style={{ fontSize: '12px' }}>{t('dailyChallenge.tabSwitch', 'Tab switch')}</span>
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
                              <span style={{ fontSize: '12px' }}>{t('dailyChallenge.copy', 'Copy')}</span>
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
                              <span style={{ fontSize: '12px' }}>{t('dailyChallenge.paste', 'Paste')}</span>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#000' }}>{antiCheatData.pasteCount}</div>
                          </div>

                          {/* Device Mismatch Card */}
                          <div style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            background: theme === 'sun' ? '#FFEDED' : 'rgba(255,77,79,0.08)',
                            border: `1px solid ${theme === 'sun' ? 'rgba(255,77,79,0.25)' : 'rgba(255,77,79,0.25)'}`
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff4d4f', marginBottom: '4px' }}>
                              <CloseCircleOutlined />
                              <span style={{ fontSize: '12px' }}>{t('dailyChallenge.deviceMismatch', 'Device mismatch')}</span>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#000' }}>{antiCheatData.deviceMismatchCount || 0}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                          {/* Session Start Card */}
                          <div style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            background: theme === 'sun' ? '#E9FBF0' : 'rgba(82,196,26,0.08)',
                            border: `1px solid ${theme === 'sun' ? 'rgba(82,196,26,0.25)' : 'rgba(82,196,26,0.25)'}`
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#52c41a', marginBottom: '4px' }}>
                              <PlayCircleOutlined />
                              <span style={{ fontSize: '12px' }}>{t('dailyChallenge.sessionStart', 'Session start')}</span>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#000' }}>{antiCheatData.sessionStartCount || 0}</div>
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
                              <span style={{ fontSize: '12px' }}>{t('dailyChallenge.totalViolations', 'Total violations')}</span>
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
                            {t('dailyChallenge.viewDetail', 'View detail')}
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
                        <h3 style={{ fontSize: '20px', fontWeight: 700, textAlign: 'center', color: 'rgb(24, 144, 255)', margin: 0 }}>{t('dailyChallenge.questions')}</h3>
                      </div>
                      <div style={{ 
                        maxHeight: 'calc(100vh - 280px)', 
                        overflowY: 'auto',
                        paddingRight: '8px'
                      }}>
                        <div className="question-sidebar-list">
                          {getQuestionNavigation().map((item) => {
                            const isSectionHeader = item.type === 'section-header';
                            const isNestedQuestion = item.type === 'question' && item.parentSection;
                            const isWritingOrSpeaking = item.type === 'question' && (item.sectionType === 'writing' || item.sectionType === 'speaking');
                            const isGrammarQuestion = item.type === 'question' && item.id?.startsWith('gv-');
                            const shouldHaveQuestionStyle = isNestedQuestion || isWritingOrSpeaking || isGrammarQuestion;
                            
                            // Calculate points color and badge style
                            const points = item.points || 0;
                            const receivedScore = item.receivedScore || 0;
                            let badgeConfig = {
                              color: '#999999',
                              bgColor: theme === 'sun' ? 'rgba(153, 153, 153, 0.1)' : 'rgba(153, 153, 153, 0.2)',
                              borderColor: '#999999'
                            }; // Default: xám (chưa làm)
                            
                            if (points > 0) {
                              if (receivedScore === points) {
                                // Xanh lá (đúng)
                                badgeConfig = {
                                  color: '#52c41a',
                                  bgColor: theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.25)',
                                  borderColor: '#52c41a'
                                };
                              } else if (receivedScore > 0 && receivedScore < points) {
                                // Cam vàng (đúng 1 nửa)
                                badgeConfig = {
                                  color: '#faad14',
                                  bgColor: theme === 'sun' ? 'rgba(250, 173, 20, 0.15)' : 'rgba(250, 173, 20, 0.25)',
                                  borderColor: '#faad14'
                                };
                              } else if (receivedScore === 0) {
                                // Xám (chưa làm)
                                badgeConfig = {
                                  color: '#999999',
                                  bgColor: theme === 'sun' ? 'rgba(153, 153, 153, 0.1)' : 'rgba(153, 153, 153, 0.2)',
                                  borderColor: '#999999'
                                };
                              } else {
                                // Đỏ (sai)
                                badgeConfig = {
                                  color: '#ff4d4f',
                                  bgColor: theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.25)',
                                  borderColor: '#ff4d4f'
                                };
                              }
                            }
                            
                            return (
                            <div
                              key={item.id}
                                className={`question-sidebar-item ${item.type === 'section' || item.type === 'section-header' ? 'question-sidebar-section' : ''}`}
                                onClick={() => {
                                  if (isNestedQuestion && item.parentSection) {
                                    // For nested questions, try to scroll to the question directly first
                                    const questionElement = questionRefs.current[item.id];
                                    if (questionElement) {
                                      questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    } else {
                                      // Fallback: scroll to section if question ref not found
                                      scrollToQuestion(item.parentSection);
                                    }
                                  } else {
                                    scrollToQuestion(item.id);
                                  }
                                }}
                              style={{ 
                                  fontWeight: isSectionHeader ? 600 : 'normal', 
                                  textAlign: shouldHaveQuestionStyle ? 'left' : 'center', 
                                color: theme === 'sun' ? '#000000' : '#FFFFFF',
                                  padding: shouldHaveQuestionStyle ? '8px 10px 8px 24px' : '10px',
                                marginBottom: '4px',
                                cursor: 'pointer',
                                  borderRadius: '6px',
                                  transition: 'all 0.2s ease',
                                transform: 'none',
                                  fontSize: isSectionHeader ? '15px' : '14px',
                                  backgroundColor: isSectionHeader 
                                    ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.12)' : 'rgba(138, 122, 255, 0.25)')
                                    : 'transparent',
                                  boxShadow: isSectionHeader 
                                    ? (theme === 'sun' ? '0 2px 4px rgba(24, 144, 255, 0.1)' : '0 2px 4px rgba(138, 122, 255, 0.2)')
                                    : 'none',
                                  borderLeft: shouldHaveQuestionStyle ? `3px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}` : 'none',
                                  display: 'flex',
                                  justifyContent: shouldHaveQuestionStyle ? 'space-between' : 'center',
                                  alignItems: 'center',
                                  position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                  if (isSectionHeader) {
                                    e.currentTarget.style.backgroundColor = theme === 'sun' 
                                      ? 'rgba(24, 144, 255, 0.18)' 
                                      : 'rgba(138, 122, 255, 0.35)';
                                    e.currentTarget.style.boxShadow = theme === 'sun' 
                                      ? '0 3px 6px rgba(24, 144, 255, 0.15)' 
                                      : '0 3px 6px rgba(138, 122, 255, 0.3)';
                                  } else {
                                    e.currentTarget.style.backgroundColor = theme === 'sun' 
                                      ? 'rgba(24, 144, 255, 0.08)' 
                                      : 'rgba(138, 122, 255, 0.15)';
                                    e.currentTarget.style.transform = 'translateX(2px)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (isSectionHeader) {
                                    e.currentTarget.style.backgroundColor = theme === 'sun' 
                                      ? 'rgba(24, 144, 255, 0.12)' 
                                      : 'rgba(138, 122, 255, 0.25)';
                                    e.currentTarget.style.boxShadow = theme === 'sun' 
                                      ? '0 2px 4px rgba(24, 144, 255, 0.1)' 
                                      : '0 2px 4px rgba(138, 122, 255, 0.2)';
                                  } else {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.transform = 'translateX(0)';
                                  }
                                }}
                              >
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                                {shouldHaveQuestionStyle && points > 0 && (
                                  <span 
                                    className="points-badge"
                                    style={{ 
                                      color: badgeConfig.color,
                                      fontWeight: 600,
                                      fontSize: '12px',
                                      marginLeft: '8px',
                                      padding: '4px 10px',
                                      borderRadius: '14px',
                                      backgroundColor: badgeConfig.bgColor,
                                      border: `1.5px solid ${badgeConfig.borderColor}`,
                                      minWidth: '50px',
                                      textAlign: 'center',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      boxShadow: theme === 'sun' 
                                        ? `0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 1px ${badgeConfig.borderColor}20` 
                                        : `0 2px 4px rgba(0, 0, 0, 0.3), 0 0 0 1px ${badgeConfig.borderColor}30`,
                                      transition: 'all 0.2s ease',
                                      flexShrink: 0,
                                      letterSpacing: '0.3px',
                                      lineHeight: '1.2'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'scale(1.05)';
                                      e.currentTarget.style.boxShadow = theme === 'sun' 
                                        ? `0 3px 6px rgba(0, 0, 0, 0.15), 0 0 0 2px ${badgeConfig.borderColor}30` 
                                        : `0 3px 6px rgba(0, 0, 0, 0.4), 0 0 0 2px ${badgeConfig.borderColor}40`;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                      e.currentTarget.style.boxShadow = theme === 'sun' 
                                        ? `0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 1px ${badgeConfig.borderColor}20` 
                                        : `0 2px 4px rgba(0, 0, 0, 0.3), 0 0 0 1px ${badgeConfig.borderColor}30`;
                                    }}
                                  >
                                    {receivedScore}/{points}
                                  </span>
                                )}
                            </div>
                            );
                          })}
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
            <div style={{ marginBottom: '24px' }}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    ref={el => questionRefs.current[`gv-${q.id}`] = el}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '800px 200px' }}
                  >
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
            {feedbackModal.isEdit ? t('dailyChallenge.editScoreFeedback', 'Edit Score/Feedback') : t('dailyChallenge.addScoreFeedback', 'Add Score/Feedback')}
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
            {t('common.cancel', 'Cancel')}
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            disabled={isManager}
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
            {feedbackModal.isEdit ? t('dailyChallenge.update', 'Update') : t('dailyChallenge.add', 'Add')}
          </Button>
        ]}>
        <div style={{ padding: '20px 0' }}>
          {feedbackModal.type === 'section' && (
            <div style={{ marginBottom: '12px' }}>
              <Typography.Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '6px' }}>{t('dailyChallenge.score', 'Score')}</Typography.Text>
              <Input
                type="number"
                min="0"
                value={feedbackModal.score}
                onChange={(e) => setFeedbackModal(prev => ({ ...prev, score: e.target.value }))}
                placeholder={t('dailyChallenge.enterScoreForThisQuestion', 'Enter score for this question')}
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

      {/* Teacher Feedback Detail Modal */}
      <Modal
        title={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '8px 0'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background:
                  theme === 'sun'
                    ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                    : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                boxShadow:
                  theme === 'sun'
                    ? '0 4px 10px rgba(60,153,255,0.35)'
                    : '0 4px 10px rgba(131,119,160,0.35)'
              }}
            >
              <FileTextOutlined style={{ color: '#000', fontSize: 18 }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: theme === 'sun' ? '#1E40AF' : '#E2E8F0',
                  marginBottom: 2
                }}
              >
                Teacher Feedback
              </div>
            </div>
          </div>
        }
        open={teacherFeedbackDetailVisible}
        centered
        onCancel={() => setTeacherFeedbackDetailVisible(false)}
        width={560}
        footer={[
          <Button
            key="close"
            onClick={() => setTeacherFeedbackDetailVisible(false)}
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
            Close
          </Button>
        ]}
      >
        <div
          style={{
            borderRadius: 12,
            padding: 16,
            border:
              theme === 'sun'
                ? '1px solid rgba(24, 144, 255, 0.25)'
                : '1px solid rgba(139, 92, 246, 0.25)',
            background:
              theme === 'sun'
                ? 'linear-gradient(180deg, rgba(102,174,255,0.08), rgba(60,153,255,0.04))'
                : 'linear-gradient(180deg, rgba(139,92,246,0.12), rgba(96,78,196,0.06))',
            boxShadow:
              theme === 'sun'
                ? '0 6px 18px rgba(60,153,255,0.15)'
                : '0 6px 18px rgba(131,119,160,0.18)'
          }}
        >
          <div
            style={{
              maxHeight: 380,
              overflowY: 'auto',
              paddingRight: 8
            }}
          >
            <div
              style={{
                fontSize: 15,
                lineHeight: 1.9,
                color: theme === 'sun' ? '#0F172A' : '#E2E8F0',
                wordBreak: 'break-word'
              }}
              dangerouslySetInnerHTML={{
                __html:
                  (teacherFeedback ||
                    submissionData?.submission?.teacherFeedback ||
                    submissionData?.teacherFeedback ||
                    '<i>No feedback yet</i>')
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
            {t('dailyChallenge.antiCheatLog', 'Anti-Cheat Log')}
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
          const totalDeviceMismatch = filteredEvents.filter(e => e.event === 'DEVICE_MISMATCH').length;
          const totalSessionStart = filteredEvents.filter(e => e.event === 'START' || e.event === 'SESSION_START').length;
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
                return { icon: <PlayCircleOutlined />, color: '#52c41a', label: t('dailyChallenge.startedTest', 'Started test') };
              case 'TAB_SWITCH':
              case 'TAB_BLUR': // unify as Tab switch (data source only uses TAB_SWITCH)
                return { icon: <SwapOutlined />, color: '#ff9800', label: t('dailyChallenge.tabSwitch', 'Tab switch') };
              case 'COPY':
              case 'COPY_ATTEMPT':
                return { icon: <CopyOutlined />, color: '#f44336', label: t('dailyChallenge.copyAttempt', 'Copy attempt') };
              case 'PASTE':
              case 'PASTE_ATTEMPT':
                return { icon: <FileTextOutlined />, color: '#9c27b0', label: t('dailyChallenge.pasteAttempt', 'Paste attempt') };
              case 'DEVICE_MISMATCH':
                return { icon: <CloseCircleOutlined />, color: '#ff4d4f', label: t('dailyChallenge.deviceMismatch', 'Device mismatch') };
              case 'ANSWER_CHANGE':
                return { icon: <EditOutlined />, color: '#1890ff', label: t('dailyChallenge.answerChanged', 'Answer changed') };
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
              case 'DEVICE_MISMATCH':
                return 'DEVICE MISMATCH';
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
                  {(() => {
                    const renderStatCard = (label, value, icon, styles) => (
                      <div
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          background: theme === 'sun' ? styles.bgSun : styles.bgMoon,
                          border: `1px solid ${theme === 'sun' ? styles.borderSun : styles.borderMoon}`,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: theme === 'sun' ? styles.textSun : styles.textMoon,
                            marginBottom: '4px',
                          }}
                        >
                          {icon}
                          <span style={{ fontSize: '12px' }}>{label}</span>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: theme === 'sun' ? '#000' : '#fff' }}>
                          {value ?? 0}
                        </div>
                      </div>
                    );

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {renderStatCard(t('dailyChallenge.tabSwitches', 'Tab switches'), totalTabSwitch, <SwapOutlined />, {
                            bgSun: '#FFFBEA',
                            bgMoon: 'rgba(251,140,0,0.08)',
                            borderSun: 'rgba(251,140,0,0.25)',
                            borderMoon: 'rgba(251,140,0,0.25)',
                            textSun: '#ff9800',
                            textMoon: '#ffb74d',
                          })}
                          {renderStatCard(t('dailyChallenge.copyAttempts', 'Copy attempts'), totalCopy, <CopyOutlined />, {
                            bgSun: '#F3F8FF',
                            bgMoon: 'rgba(24,144,255,0.08)',
                            borderSun: 'rgba(24,144,255,0.25)',
                            borderMoon: 'rgba(24,144,255,0.25)',
                            textSun: '#1e40af',
                            textMoon: '#aab',
                          })}
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {renderStatCard(t('dailyChallenge.pasteAttempts', 'Paste attempts'), totalPaste, <FileTextOutlined />, {
                            bgSun: '#F7ECFF',
                            bgMoon: 'rgba(142,36,170,0.08)',
                            borderSun: 'rgba(142,36,170,0.25)',
                            borderMoon: 'rgba(142,36,170,0.25)',
                            textSun: '#6A1B9A',
                            textMoon: '#cbb',
                          })}
                          {renderStatCard(t('dailyChallenge.deviceMismatch', 'Device mismatch'), totalDeviceMismatch, <CloseCircleOutlined />, {
                            bgSun: '#FFEDED',
                            bgMoon: 'rgba(255,77,79,0.08)',
                            borderSun: 'rgba(255,77,79,0.25)',
                            borderMoon: 'rgba(255,77,79,0.25)',
                            textSun: '#ff4d4f',
                            textMoon: '#ff7a7c',
                          })}
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {renderStatCard(t('dailyChallenge.sessionStart', 'Session start'), totalSessionStart, <PlayCircleOutlined />, {
                            bgSun: '#E9FBF0',
                            bgMoon: 'rgba(82,196,26,0.08)',
                            borderSun: 'rgba(82,196,26,0.25)',
                            borderMoon: 'rgba(82,196,26,0.25)',
                            textSun: '#52c41a',
                            textMoon: '#81c784',
                          })}
                          {renderStatCard(t('dailyChallenge.totalViolations', 'Total violations'), totalViolations, <ClockCircleOutlined />, {
                            bgSun: '#F5F9FF',
                            bgMoon: 'rgba(24,144,255,0.08)',
                            borderSun: 'rgba(24,144,255,0.2)',
                            borderMoon: 'rgba(24,144,255,0.2)',
                            textSun: '#1e40af',
                            textMoon: '#aab',
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Right: Activity log with pagination */}
                <div>
                  <div style={{
                    maxHeight: 'calc(70vh - 100px)', overflowY: 'auto', overflowX: 'hidden', padding: '10px', paddingBottom: '24px', boxSizing: 'border-box',
                    background: theme === 'sun' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px', border: `1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)'}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    {pagedEvents.length === 0 ? (
                      <Typography.Text style={{ fontStyle: 'italic', fontSize: '14px' }}>{t('dailyChallenge.noAntiCheatEventsRecorded', 'No anti-cheat events recorded.')}</Typography.Text>
                    ) : (
                      pagedEvents.map((ev, idx) => {
                        const meta = getEventMeta(ev.event);
                        const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, '').trim();
                        const desc = stripHtml(ev.content) || meta.label;
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
            {t('common.cancel', 'Cancel')}
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            disabled={isManager}
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
            {scoreModal.isEdit ? t('dailyChallenge.update', 'Update') : t('dailyChallenge.add', 'Add')}
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
              {t('dailyChallenge.score0To10', 'Score (0-10):')}
            </Typography.Text>
            <Input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={scoreModal.score}
              onChange={handleScoreInputChange}
              placeholder={t('dailyChallenge.enterScore0To10', 'Enter score (0-10)')}
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
            {t('dailyChallenge.finalizeGrading', 'Finalize Grading')}
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
            {t('common.cancel', 'Cancel')}
          </Button>,
          <Button key="clear" onClick={() => { 
            setOverallFeedbackDraft(''); 
            setFinalScoreDraft(''); 
            setPenaltyAppliedDraft(''); 
            setIsPenaltyEnabled(false);
          }}
            style={{ height: '36px', borderRadius: '6px', padding: '0 22px' }}
          >
            {t('dailyChallenge.clear', 'Clear')}
          </Button>,
          <Button key="save" type="primary" loading={savingFeedback} disabled={isManager} onClick={handleSaveOverallFeedback}
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
            {t('dailyChallenge.save', 'Save')}
          </Button>
        ]}
      >
        {/* Force CKEditor sizing like AIGenerateFeedback to avoid global CSS overrides */}
        <style>{`
          .feedback-editor-wrap .ck-editor__editable_inline { 
            min-height: 200px !important; 
            max-height: 200px !important; 
            overflow-y: auto !important; 
            color: #000 !important; 
          }
          .feedback-editor-wrap .ck-editor__main .ck-editor__editable { 
            min-height: 200px !important; 
            max-height: 200px !important; 
            overflow-y: auto !important; 
            color: #000 !important; 
          }
        `}</style>
        <div style={{ marginBottom: 14 }}>
          <style>{`
            .grading-score-circle-input::-webkit-outer-spin-button,
            .grading-score-circle-input::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            .grading-score-circle-input {
              -moz-appearance: textfield;
            }
          `}</style>
          <div
            style={{
              padding: '12px',
              borderRadius: 16,
              background: theme === 'sun'
                ? 'linear-gradient(140deg, rgba(238,246,255,1) 0%, rgba(197,227,255,0.82) 100%)'
                : 'linear-gradient(140deg, rgba(30,28,46,0.95) 0%, rgba(74,58,104,0.7) 100%)',
              border: `1px solid ${theme === 'sun' ? 'rgba(59,130,246,0.25)' : 'rgba(139,92,246,0.35)'}`,
              boxShadow: theme === 'sun'
                ? '0 12px 30px rgba(59,130,246,0.25)'
                : '0 12px 30px rgba(0,0,0,0.55)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 1.2,
                  color: theme === 'sun' ? '#1E3A8A' : '#E0E7FF',
                  textTransform: 'uppercase'
                }}
              >
            {t('dailyChallenge.rawScore', 'Raw Score')}
              </span>
              <div style={{ position: 'relative', width: 140, height: 140 }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: '10px',
                    borderRadius: '50%',
                    background: theme === 'sun'
                      ? 'linear-gradient(180deg, #ffffff 0%, #dceeff 100%)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(108,84,150,0.4) 100%)',
                    border: `5px solid ${theme === 'sun' ? '#5AA0FF' : '#B7A3FF'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 14px',
                    textAlign: 'center',
                    boxShadow: theme === 'sun'
                      ? '0 10px 25px rgba(90,160,255,0.35)'
                      : '0 10px 25px rgba(0,0,0,0.55)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}>
          <Input
                      className="grading-score-circle-input"
            type="number"
            value={finalScoreDraft}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || value === '-') {
                setFinalScoreDraft(value);
                return;
              }
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                if (numValue >= 0 && numValue <= 10) {
                  setFinalScoreDraft(value);
                } else if (numValue > 10) {
                  setFinalScoreDraft('10');
                } else if (numValue < 0) {
                  setFinalScoreDraft('0');
                }
              }
            }}
                      placeholder="0.0"
            min={0}
            max={10}
            step={0.1}
                      bordered={false}
                      inputMode="decimal"
            style={{
                        width: '60%',
                        textAlign: 'right',
                        fontSize: '20px',
                        fontWeight: 600,
                        background: 'transparent',
                        boxShadow: 'none',
                        color: theme === 'sun' ? '#0F172A' : '#F5F3FF',
                        margin: 0,
                        lineHeight: '1',
                        padding: 0,
                      }}
                    />
                    <span style={{ fontSize: 20, fontWeight: 500, color: theme === 'sun' ? '#2563EB' : '#D1C4F9' }}>
                      /10
                    </span>
        </div>
                </div>
              </div>
            </div>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: theme === 'sun' ? '#FFFFFF' : 'rgba(255,255,255,0.05)',
                border: `1px dashed ${theme === 'sun' ? 'rgba(37, 99, 235, 0.4)' : 'rgba(203, 213, 225, 0.3)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              <Checkbox
                checked={isPenaltyEnabled}
                onChange={(e) => {
                  setIsPenaltyEnabled(e.target.checked);
                  if (!e.target.checked) {
                    setPenaltyAppliedDraft('');
                  }
                }}
                style={{
                  fontWeight: 600,
                  color: theme === 'sun' ? '#1E3A8A' : '#E9D5FF'
                }}
              >
                {t('dailyChallenge.applyPenaltyScore', 'Apply penalty score?')}
              </Checkbox>
              {isPenaltyEnabled && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 10,
                    border: `2px solid ${theme === 'sun' ? 'rgba(37, 99, 235, 0.4)' : 'rgba(203, 213, 225, 0.3)'}`,
                    height: 42,
                    overflow: 'hidden',
                    width: 150,
                    maxWidth: '100%'
                  }}
                >
                  <Input
                    type="number"
                    value={penaltyAppliedDraft}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === '-') {
                        setPenaltyAppliedDraft(value);
                        return;
                      }
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue)) {
                        if (numValue >= 0 && numValue <= 100) {
                          setPenaltyAppliedDraft(value);
                        } else if (numValue > 100) {
                          setPenaltyAppliedDraft('100');
                        } else if (numValue < 0) {
                          setPenaltyAppliedDraft('0');
                        }
                      }
                    }}
                 
                    min={0}
                    max={100}
                    step={1}
                    bordered={false}
                    style={{
                      flex: 1,
                      height: '100%',
                      fontSize: 16,
                      fontWeight: 600,
                      padding: '0 14px',
                      boxShadow: 'none'
                    }}
                  />
                  <span
                    style={{
                      padding: '0 14px',
                      fontSize: 16,
                      fontWeight: 600,
                      color: theme === 'sun' ? '#2563EB' : '#E0E7FF'
                    }}
                  >
                    %
                  </span>
                </div>
              )}
              {!isPenaltyEnabled && (
                <div style={{ fontSize: 13, color: theme === 'sun' ? '#475569' : '#CBD5F5' }}>
                  {t('dailyChallenge.enablePenaltyToDeductPercentage', 'Enable penalty to deduct a percentage from the final score.')}
        </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: theme === 'sun' ? '#1E40AF' : '#E9D5FF', fontSize: 14 }}>
            {t('dailyChallenge.overallFeedback', 'Overall Feedback')}
          </label>
        </div>
        <div className="feedback-editor-wrap" style={{ borderRadius: 12, border: `2px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.5)' : 'rgba(139, 92, 246, 0.5)'}`, background: theme === 'sun' ? 'rgba(24,144,255,0.08)' : 'rgba(139,92,246,0.12)' }}>
          <CKEditor
            editor={ClassicEditor}
            data={overallFeedbackDraft}
            onChange={(event, editor) => setOverallFeedbackDraft(editor.getData())}
            config={{
              extraPlugins: [CustomUploadAdapterPlugin],
              placeholder: t('dailyChallenge.enterOverallFeedback', 'Enter overall feedback...'),
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
                  el.style.minHeight = '200px';
                  el.style.maxHeight = '200px';
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
            {commentModal.isEdit ? t('dailyChallenge.editComment', 'Edit Comment') : t('dailyChallenge.addComment', 'Add Comment')}
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
            {t('common.cancel', 'Cancel')}
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            disabled={isManager}
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
            {commentModal.isEdit ? t('dailyChallenge.update', 'Update') : t('dailyChallenge.add', 'Add')}
          </Button>
        ]}>
        <div style={{ padding: '20px 0' }}>
          <Input.TextArea
            rows={6}
            value={commentModal.comment}
            onChange={handleCommentInputChange}
            placeholder={t('dailyChallenge.enterYourCommentForSelectedText', 'Enter your comment for the selected text...')}
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

