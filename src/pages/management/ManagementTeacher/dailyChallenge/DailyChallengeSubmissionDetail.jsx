import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Space,
  Typography,
  Avatar,
  Tag,
  Progress,
  Modal,
  Input,
} from "antd";
import {
  ClockCircleOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  MessageOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./DailyChallengeSubmissionDetail.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useDailyChallengeMenu } from "../../../../contexts/DailyChallengeMenuContext";
import usePageTitle from "../../../../hooks/usePageTitle";
import { generateFakeDataByType } from "../../../../constants/fakeData";

const DailyChallengeSubmissionDetail = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { id, submissionId } = useParams();
  const { enterDailyChallengeMenu, exitDailyChallengeMenu } = useDailyChallengeMenu();
  
  // Set page title
  usePageTitle('Daily Challenge - Submission Detail');
  
  const [loading, setLoading] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, correct, incorrect, unanswered
  const [challengeType, setChallengeType] = useState('GV'); // GV, RE, LI, WR, SP

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
    isEdit: false,
  });
  
  // Store feedbacks for questions and sections
  const [feedbacks, setFeedbacks] = useState({});
  
  // Handlers for feedback modal
  const handleOpenAddFeedback = (id, type = 'question') => {
    setFeedbackModal({
      visible: true,
      id,
      type,
      feedback: '',
      isEdit: false,
    });
  };
  
  const handleOpenEditFeedback = (id, type = 'question') => {
    const key = `${type}-${id}`;
    const existingFeedback = feedbacks[key] || '';
    setFeedbackModal({
      visible: true,
      id,
      type,
      feedback: existingFeedback,
      isEdit: true,
    });
  };
  
  const handleCloseFeedbackModal = () => {
    setFeedbackModal({
      visible: false,
      id: null,
      type: null,
      feedback: '',
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
      spaceToast.success(feedbackModal.isEdit ? 'Feedback updated successfully' : 'Feedback added successfully');
      handleCloseFeedbackModal();
    }
  };
  
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
    const selectedText = selection.toString().trim();
    
    if (!selectedText) {
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
    
    // Get all text nodes in the container to calculate accurate indices
    // This works even when text has highlights (spans)
    const getAllTextNodes = (element) => {
      const textNodes = [];
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );
      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node);
      }
      return textNodes;
    };
    
    const textNodes = getAllTextNodes(textElement);
    let startIndex = 0;
    let endIndex = 0;
    let foundStart = false;
    let foundEnd = false;
    
    for (let i = 0; i < textNodes.length; i++) {
      const textNode = textNodes[i];
      const nodeText = textNode.textContent;
      
      if (!foundStart) {
        if (range.startContainer === textNode || textNode.contains(range.startContainer)) {
          if (range.startContainer === textNode) {
            startIndex += range.startOffset;
          } else {
            // Find position within this node
            const tempRange = document.createRange();
            tempRange.setStart(textNode, 0);
            tempRange.setEnd(range.startContainer, range.startOffset);
            startIndex += tempRange.toString().length;
          }
          foundStart = true;
        } else {
          startIndex += nodeText.length;
        }
      }
      
      if (!foundEnd) {
        if (range.endContainer === textNode || textNode.contains(range.endContainer)) {
          if (range.endContainer === textNode) {
            endIndex += range.endOffset;
          } else {
            // Find position within this node
            const tempRange = document.createRange();
            tempRange.setStart(textNode, 0);
            tempRange.setEnd(range.endContainer, range.endOffset);
            endIndex += tempRange.toString().length;
          }
          foundEnd = true;
          break;
        } else {
          endIndex += nodeText.length;
        }
      } else {
        break;
      }
    }
    
    // Fallback: use simple calculation
    if (!foundStart || !foundEnd) {
      const startRange = document.createRange();
      startRange.setStart(textElement, 0);
      startRange.setEnd(range.startContainer, range.startOffset);
      startIndex = startRange.toString().length;
      endIndex = startIndex + selectedText.length;
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
      
      spaceToast.success(commentModal.isEdit ? 'Comment updated successfully' : 'Comment added successfully');
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
    
    const parts = [];
    let lastIndex = 0;
    
    sortedFeedbacks.forEach((feedback, idx) => {
      // Add text before highlight
      if (feedback.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {text.substring(lastIndex, feedback.startIndex)}
          </span>
        );
      }
      
      // Add highlighted text
      const highlightedText = text.substring(feedback.startIndex, feedback.endIndex);
      parts.push(
        <span
          key={`highlight-${idx}`}
          onClick={() => handleHighlightClick(feedback)}
          style={{
            backgroundColor: '#FFEB3B',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '3px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            display: 'inline',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#FFD700';
            e.target.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#FFEB3B';
            e.target.style.transform = 'scale(1)';
          }}
        >
          {highlightedText}
        </span>
      );
      
      lastIndex = feedback.endIndex;
    });
    
    // Add remaining text after last highlight
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-final">
          {text.substring(lastIndex)}
        </span>
      );
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

  useEffect(() => {
    // Generate fake data for all types to show all question types
    const gvData = generateFakeDataByType('GV');
    const reData = generateFakeDataByType('RE');
    const liData = generateFakeDataByType('LI');
    const wrData = generateFakeDataByType('WR');
    const spData = generateFakeDataByType('SP');

    // Combine all questions
    const allQuestions = [
      ...gvData.questions,
      ...reData.questions,
      ...reData.readingSections.flatMap(s => s.questions || []),
      ...liData.listeningSections.flatMap(s => s.questions || []),
      ...wrData.writingSections,
      ...spData.speakingSections,
    ];

    setFakeData({
      questions: gvData.questions,
      readingSections: reData.readingSections,
      listeningSections: liData.listeningSections,
      writingSections: wrData.writingSections,
      speakingSections: spData.speakingSections,
    });

    // Generate mock student answers similar to StudentDailyChallengeResult
    const mockAnswers = {};
    
    // Generate answers for GV questions
    gvData.questions.forEach(q => {
      if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE') {
        const correctOption = q.options?.find(opt => opt.isCorrect);
        const wrongOption = q.options?.find(opt => !opt.isCorrect);
        if (q.id.endsWith('b')) {
          mockAnswers[q.id] = q.type === 'TRUE_OR_FALSE' ? (wrongOption?.text || wrongOption?.key) : wrongOption?.key;
        } else {
          mockAnswers[q.id] = q.type === 'TRUE_OR_FALSE' ? (correctOption?.text || correctOption?.key) : correctOption?.key;
        }
      } else if (q.type === 'MULTIPLE_SELECT') {
        const correctKeys = q.options?.filter(opt => opt.isCorrect).map(opt => opt.key) || [];
        mockAnswers[q.id] = q.id.endsWith('b') ? [correctKeys[0]] : correctKeys;
      } else if (q.type === 'FILL_IN_THE_BLANK') {
        const contentData = q.content?.data || [];
        const fillBlankAnswers = {};
        contentData.forEach(item => {
          if (item.positionId && item.correct) {
            fillBlankAnswers[item.positionId] = q.id === 'gv-4' ? item.value : 'wrong';
          }
        });
        mockAnswers[q.id] = fillBlankAnswers;
      } else if (q.type === 'DROPDOWN') {
        const contentData = q.content?.data || [];
        const dropdownAnswers = {};
        contentData.forEach(item => {
          if (item.positionId && item.correct) {
            dropdownAnswers[item.positionId] = q.id === 'gv-5' ? item.value : 'wrong';
          }
        });
        mockAnswers[q.id] = dropdownAnswers;
      } else if (q.type === 'DRAG_AND_DROP') {
        const contentData = q.content?.data || [];
        const dragDropAnswers = {};
        contentData.forEach(item => {
          if (item.positionId && item.correct) {
            dragDropAnswers[item.positionId] = q.id === 'gv-6' ? item.value : 'wrong';
          }
        });
        mockAnswers[q.id] = dragDropAnswers;
      } else if (q.type === 'REARRANGE') {
        const contentData = q.content?.data || [];
        const correctOrder = contentData
          .slice()
          .sort((a, b) => {
            const posA = parseInt((a.positionId || '').replace('pos_', ''));
            const posB = parseInt((b.positionId || '').replace('pos_', ''));
            return posA - posB;
          })
          .map(item => item.value)
          .filter(Boolean);
        mockAnswers[q.id] = q.id === 'gv-7' ? correctOrder : [...correctOrder].reverse();
      } else if (q.type === 'REWRITE') {
        const contentData = q.content?.data || [];
        const correctAnswer = contentData[0]?.value || '';
        mockAnswers[q.id] = q.id === 'gv-8' ? correctAnswer : 'Wrong answer';
      }
    });

    // Generate answers for Reading sections
    reData.readingSections.forEach(section => {
      section.questions?.forEach(q => {
        if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE') {
          const correctOption = q.options?.find(opt => opt.isCorrect);
          mockAnswers[q.id] = q.type === 'TRUE_OR_FALSE' ? (correctOption?.text || correctOption?.key) : correctOption?.key;
        } else if (q.type === 'MULTIPLE_SELECT') {
          const correctKeys = q.options?.filter(opt => opt.isCorrect).map(opt => opt.key) || [];
          mockAnswers[q.id] = correctKeys;
        } else if (q.type === 'FILL_IN_THE_BLANK') {
          const contentData = q.content?.data || [];
          const fillBlankAnswers = {};
          contentData.forEach(item => {
            if (item.positionId && item.correct) {
              fillBlankAnswers[item.positionId] = item.value;
            }
          });
          mockAnswers[q.id] = fillBlankAnswers;
        } else if (q.type === 'DROPDOWN') {
          const contentData = q.content?.data || [];
          const dropdownAnswers = {};
          contentData.forEach(item => {
            if (item.positionId && item.correct) {
              dropdownAnswers[item.positionId] = item.value;
            }
          });
          mockAnswers[q.id] = dropdownAnswers;
        } else if (q.type === 'DRAG_AND_DROP') {
          const contentData = q.content?.data || [];
          const dragDropAnswers = {};
          contentData.forEach(item => {
            if (item.positionId && item.correct) {
              dragDropAnswers[item.positionId] = item.value;
            }
          });
          mockAnswers[q.id] = dragDropAnswers;
        } else if (q.type === 'REARRANGE') {
          const contentData = q.content?.data || [];
          const correctOrder = contentData
            .slice()
            .sort((a, b) => {
              const posA = parseInt((a.positionId || '').replace('pos_', ''));
              const posB = parseInt((b.positionId || '').replace('pos_', ''));
              return posA - posB;
            })
            .map(item => item.value)
            .filter(Boolean);
          mockAnswers[q.id] = correctOrder;
        }
      });
    });

    // Generate answers for Listening sections
    liData.listeningSections.forEach(section => {
      section.questions?.forEach(q => {
        if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE') {
          const correctOption = q.options?.find(opt => opt.isCorrect);
          mockAnswers[q.id] = q.type === 'TRUE_OR_FALSE' ? (correctOption?.text || correctOption?.key) : correctOption?.key;
        } else if (q.type === 'MULTIPLE_SELECT') {
          const correctKeys = q.options?.filter(opt => opt.isCorrect).map(opt => opt.key) || [];
          mockAnswers[q.id] = correctKeys;
        } else if (q.type === 'FILL_IN_THE_BLANK') {
          const contentData = q.content?.data || [];
          const fillBlankAnswers = {};
          contentData.forEach(item => {
            if (item.positionId && item.correct) {
              fillBlankAnswers[item.positionId] = item.value;
            }
          });
          mockAnswers[q.id] = fillBlankAnswers;
        } else if (q.type === 'DROPDOWN') {
          const contentData = q.content?.data || [];
          const dropdownAnswers = {};
          contentData.forEach(item => {
            if (item.positionId && item.correct) {
              dropdownAnswers[item.positionId] = item.value;
            }
          });
          mockAnswers[q.id] = dropdownAnswers;
        } else if (q.type === 'DRAG_AND_DROP') {
          const contentData = q.content?.data || [];
          const dragDropAnswers = {};
          contentData.forEach(item => {
            if (item.positionId && item.correct) {
              dragDropAnswers[item.positionId] = item.value;
            }
          });
          mockAnswers[q.id] = dragDropAnswers;
        } else if (q.type === 'REARRANGE') {
          const contentData = q.content?.data || [];
          const correctOrder = contentData
            .slice()
            .sort((a, b) => {
              const posA = parseInt((a.positionId || '').replace('pos_', ''));
              const posB = parseInt((b.positionId || '').replace('pos_', ''));
              return posA - posB;
            })
            .map(item => item.value)
            .filter(Boolean);
          mockAnswers[q.id] = correctOrder;
        }
      });
    });

    // Generate answers for Writing sections
    wrData.writingSections.forEach((section, sectionIdx) => {
      if (sectionIdx === 0) {
        mockAnswers[section.id] = {
          text: `Writing is an essential skill that plays a crucial role in communication, education, and professional development. Throughout my academic journey, I have come to understand the importance of effective writing and the impact it has on expressing thoughts, ideas, and arguments clearly and persuasively.

First and foremost, writing allows individuals to communicate complex ideas in a structured and coherent manner. Unlike verbal communication, which can be spontaneous and sometimes unclear, writing provides the opportunity to carefully organize thoughts, revise content, and ensure clarity. This process of drafting, editing, and refining helps writers develop critical thinking skills and enhances their ability to analyze and synthesize information.

Moreover, writing serves as a powerful tool for learning and knowledge retention. When students write about what they have learned, they engage in active processing of information, which helps solidify their understanding. Research has shown that writing promotes deeper learning and better comprehension of subject matter. Whether it's taking notes, writing essays, or creating summaries, the act of writing helps individuals internalize and remember information more effectively.

In addition to academic benefits, writing is indispensable in professional settings. From composing emails and reports to creating proposals and presentations, strong writing skills are highly valued by employers across all industries. Clear, concise, and well-structured written communication can lead to better collaboration, improved decision-making, and enhanced professional reputation.

Furthermore, writing provides a means of personal expression and creativity. Through creative writing, individuals can explore their imagination, express emotions, and share stories with others. Journaling, for instance, can be therapeutic and help individuals process their thoughts and experiences. Writing poetry, fiction, or personal narratives allows people to connect with themselves and others on a deeper level.

Despite its numerous benefits, many people find writing challenging. Common obstacles include writer's block, lack of confidence, and difficulty organizing thoughts. However, with practice, patience, and proper guidance, anyone can improve their writing skills. Regular writing practice, reading widely, and seeking feedback from peers or mentors are effective strategies for enhancing writing abilities.

In conclusion, writing is a fundamental skill that contributes significantly to personal, academic, and professional success. It enables effective communication, promotes learning, facilitates professional growth, and provides a platform for creative expression. As we continue to navigate an increasingly information-driven world, the ability to write well becomes even more important. Therefore, investing time and effort in developing strong writing skills is not just beneficial but essential for anyone seeking to succeed in today's society.`,
        };
      } else {
        // Section 2 (index 1) should have image files
        mockAnswers[section.id] = {
          files: [
            {
              name: 'banana.jpg',
              url: '/img/banana.jpg',
              imageUrl: '/img/banana.jpg',
              type: 'image/jpeg'
            }
          ],
        };
      }
    });

    // Generate answers for Speaking sections
    spData.speakingSections.forEach((section, sectionIdx) => {
      mockAnswers[section.id] = {
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
      };
    });

    setStudentAnswers(mockAnswers);

    // Mock submission data
const mockSubmissionDetail = {
  id: 1,
  student: {
    id: "SE12345",
    name: "Nguyễn Văn A",
    email: "anvn@example.com",
    avatar: null,
    class: "SE1801",
    level: "Basic",
  },
  challenge: {
    id: 1,
        title: "Daily Challenge - All Question Types",
        totalQuestions: allQuestions.length,
        totalPoints: 100,
        timeLimit: 60,
  },
  submission: {
    score: 8.5,
        totalPoints: 85,
        maxPoints: 100,
        correctCount: 25,
        incorrectCount: 5,
        unansweredCount: 2,
        accuracy: 85,
        timeSpent: 45,
    submittedAt: "2024-01-15 10:30:00",
    status: "completed",
  },
    };

    setSubmissionData(mockSubmissionDetail);
    setLoading(false);
  }, []);

  const fetchSubmissionDetail = useCallback(async () => {
    setLoading(true);
    try {
      // Data is already loaded in useEffect
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      spaceToast.error('Error loading submission detail');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissionDetail();
  }, [fetchSubmissionDetail]);

  // Enter/exit daily challenge menu mode
  useEffect(() => {
    const backPath = `/teacher/daily-challenges/detail/${id}/submissions`;
    enterDailyChallengeMenu(0, null, backPath);
    
    return () => {
      exitDailyChallengeMenu();
    };
  }, [enterDailyChallengeMenu, exitDailyChallengeMenu, id]);

  if (loading || !submissionData || !fakeData) {
    return (
      <ThemedLayout>
        <LoadingWithEffect loading={loading} message="Loading submission details..." />
      </ThemedLayout>
    );
  }

  const { student, submission } = submissionData;
  const { questions, readingSections, listeningSections, writingSections, speakingSections } = fakeData;

  // Helper function to render section questions (used in Reading/Listening sections)
  const renderSectionQuestion = (q, qIndex, sectionType = 'reading') => {
    const questionText = q.questionText || q.question || '';
    const studentAnswer = studentAnswers?.[q.id];

    if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE' || q.type === 'MULTIPLE_SELECT') {
      const options = q.options || [];
      const isMulti = q.type === 'MULTIPLE_SELECT';
      const correctOption = options.find(opt => opt.isCorrect);
      const correctKey = correctOption?.key;
      const correctKeys = isMulti ? options.filter(opt => opt.isCorrect).map(opt => opt.key) : [];
      
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
              
              return (
                <div key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  background: isCorrectAnswer || isCorrectMissing
                    ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)')
                    : isSelectedWrong
                      ? (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)')
                    : (theme === 'sun' ? '#fff' : 'rgba(255,255,255,0.03)'),
                  border: `2px solid ${isCorrectAnswer || isCorrectMissing ? 'rgb(82, 196, 26)' : isSelectedWrong ? 'rgb(255, 77, 79)' : (theme === 'sun' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)')}`,
                  borderRadius: '12px',
                  cursor: 'default',
                  minHeight: '50px',
                  boxSizing: 'border-box',
                }}>
                  <input type={isMulti ? 'checkbox' : 'radio'} checked={isSelected || (!isSelected && isCorrectAnswer)} disabled style={{ width: '18px', height: '18px', accentColor: isCorrectAnswer || isCorrectMissing ? '#52c41a' : (isSelectedWrong ? '#ff4d4f' : (theme === 'sun' ? '#1890ff' : '#8B5CF6')), cursor: 'not-allowed', opacity: 1 }} />
                  <span style={{ fontWeight: 600, color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', fontSize: '16px' }}>
                    {q.type === 'TRUE_OR_FALSE' ? (opt === 'True' ? 'A' : 'B') : key}.
                  </span>
                  <span className="option-text" style={{ flex: 1, lineHeight: '1.6', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', fontWeight: '350' }} dangerouslySetInnerHTML={{ __html: q.type === 'TRUE_OR_FALSE' ? opt : text }} />
                  {isSelectedWrong && <CloseCircleOutlined style={{ fontSize: '22px', color: '#ff4d4f', marginLeft: 'auto', fontWeight: 'bold' }} />}
                  {(isCorrectAnswer || isCorrectMissing) && !isSelectedWrong && <CheckCircleOutlined style={{ fontSize: '20px', color: '#52c41a', marginLeft: 'auto' }} />}
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
          const correctItem = contentData.find(item => item.positionId === positionId && item.correct);
          const correctAnswer = correctItem?.value || '';
          let studentAnswer = '';
          if (typeof studentAnswerObj === 'object' && studentAnswerObj !== null) {
            studentAnswer = studentAnswerObj[positionId] || studentAnswerObj[match[2]] || '';
          } else if (typeof studentAnswerObj === 'string') {
            studentAnswer = studentAnswerObj;
          }
          const isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
          
          parts.push(
            <input key={`fill_blank_input_${inputIndex}`} type="text" value={studentAnswer} readOnly disabled style={{ display: 'inline-block', minWidth: '120px', maxWidth: '200px', minHeight: '32px', padding: '4px 12px', margin: '0 8px', background: isCorrect ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)') : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'), border: `2px solid ${isCorrect ? 'rgb(82, 196, 26)' : 'rgb(255, 77, 79)'}`, borderRadius: '8px', cursor: 'not-allowed', outline: 'none', lineHeight: '1.4', fontSize: '14px', boxSizing: 'border-box', textAlign: 'center', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', fontWeight: '400', verticalAlign: 'middle' }} />
          );
          
          if (!isCorrect && studentAnswer) {
            parts.push(
              <span key={`answer_${inputIndex}`} style={{ fontSize: '15px', color: '#52c41a', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px' }}>
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
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Question {qIndex + 1}:</div>
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
          const optionsForPosition = contentData.filter(opt => {
            const optPosId = String(opt.positionId || '');
            const matchPosId = String(positionId);
            return optPosId === matchPosId;
  }) || [];
          const correctItem = optionsForPosition.find(it => it.correct);
          const correctAnswer = correctItem?.value || '';
          const studentAnswer = studentAnswerObj[positionId] || studentAnswerObj[match[1]] || '';
          const isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
          const optionValues = optionsForPosition.map(it => it.value).filter(Boolean);
          
          parts.push(
            <select key={`dd_${q.id}_${idx++}`} value={studentAnswer || ''} disabled style={{ display: 'inline-block', minWidth: '120px', height: '32px', padding: '4px 12px', margin: '0 8px', background: isCorrect ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)') : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'), border: `2px solid ${isCorrect ? 'rgb(82, 196, 26)' : 'rgb(255, 77, 79)'}`, borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: isCorrect ? '#52c41a' : '#ff4d4f', cursor: 'not-allowed', outline: 'none', verticalAlign: 'middle', textAlign: 'center', textAlignLast: 'center' }}>
              <option value="" disabled hidden style={{ textAlign: 'center' }}>Select</option>
              {optionValues.map((opt, optIdx) => (
                <option key={optIdx} value={opt}>{opt}</option>
              ))}
            </select>
          );
          
          if (!isCorrect && studentAnswer) {
            parts.push(
              <span key={`answer_${idx++}`} style={{ fontSize: '15px', color: '#52c41a', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px' }}>
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
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Question {qIndex + 1}:</div>
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
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Question {qIndex + 1}:</div>
          <div style={{ display: 'flex', gap: '24px', minHeight: '300px' }}>
            <div style={{ flex: '1', padding: '20px', background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}` }}>
              <div style={{ fontSize: '15px', fontWeight: 350, lineHeight: '1.8', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                {parts.map((part, pIdx) => {
                  if (part.type === 'text') {
                    return <span key={pIdx} dangerouslySetInnerHTML={{ __html: part.content || '' }} />;
                  }
                  const studentAnswer = studentAnswerObj[part.positionId] || '';
                  const correctItem = contentData.find(item => {
                    const itemPosId = String(item.positionId || '');
                    const matchPosId = String(part.positionId);
                    return itemPosId === matchPosId && item.correct;
                  });
                  const correctAnswer = correctItem?.value || '';
                  const isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
                  
                  return (
                    <React.Fragment key={pIdx}>
                      {studentAnswer ? (
                        <div style={{ minWidth: '120px', height: '32px', margin: '0 8px', background: isCorrect ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)') : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'), border: `2px solid ${isCorrect ? 'rgb(82, 196, 26)' : 'rgb(255, 77, 79)'}`, borderRadius: '8px', display: 'inline-block', padding: '4px 12px', fontSize: '15px', fontWeight: '350', color: isCorrect ? '#52c41a' : '#ff4d4f', cursor: 'not-allowed', verticalAlign: 'middle', lineHeight: '1.4', boxSizing: 'border-box', textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: studentAnswer || '' }} />
                      ) : (
                        <div style={{ minWidth: '120px', height: '32px', margin: '0 8px', background: '#ffffff', border: '2px dashed rgba(0, 0, 0, 0.3)', borderRadius: '8px', display: 'inline-block', padding: '4px 12px', fontSize: '15px', color: 'rgba(0, 0, 0, 0.5)', cursor: 'not-allowed', verticalAlign: 'middle', lineHeight: '1.4', boxSizing: 'border-box', textAlign: 'center' }}>Empty</div>
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
      
      const correctOrder = contentData.slice().sort((a, b) => {
        const posA = parseInt((a.positionId || '').replace('pos_', ''));
        const posB = parseInt((b.positionId || '').replace('pos_', ''));
        return posA - posB;
      }).map(item => item.value).filter(Boolean);
      
      const studentOrder = Array.isArray(studentAnswer) ? studentAnswer : (typeof studentAnswer === 'object' && studentAnswer !== null ? Object.keys(studentAnswer).sort((a, b) => parseInt(a) - parseInt(b)).map(key => studentAnswer[key]).filter(Boolean) : []);
      const isCorrect = studentOrder.length === correctOrder.length && studentOrder.every((word, idx) => word.trim().toLowerCase() === correctOrder[idx].trim().toLowerCase());
      const displayText = ((questionText).replace(/\[\[pos_.*?\]\]/g, '')).trim();

      return (
        <div key={q.id} style={{ padding: '16px', background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}` }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Question {qIndex + 1}:</div>
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
                <Typography.Text style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.5)', fontStyle: 'italic' }}>No answer provided</Typography.Text>
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

  // Render Reading Section
  const renderReadingSection = (section, index) => {
    return (
      <div key={section.id || index} className={`question-item ${theme}-question-item`} style={{ marginBottom: '24px', borderRadius: '16px', padding: '24px', border: '2px solid', borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)' }}>
        <div className="question-header" style={{ paddingBottom: '14px', marginBottom: '16px', borderBottom: '2px solid', borderBottomColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Text strong style={{ fontSize: '20px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
              {index + 1}. Reading Section
            </Typography.Text>
            <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
              ({section.points} {section.points > 1 ? 'points' : 'point'})
            </Typography.Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!getFeedback(section.id, 'section') ? (
              <Button
                size="small"
                onClick={() => handleOpenAddFeedback(section.id, 'section')}
                style={{
                  fontSize: '13px',
                  height: '28px',
                  padding: '0 12px'
                }}
              >
                Add Feedback
              </Button>
            ) : (
              <Button
                size="small"
                onClick={() => handleOpenEditFeedback(section.id, 'section')}
                style={{
                  fontSize: '13px',
                  height: '28px',
                  padding: '0 12px'
                }}
              >
                Edit Feedback
              </Button>
            )}
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
    return (
      <div key={section.id || index} className={`question-item ${theme}-question-item`} style={{ marginBottom: '24px', borderRadius: '16px', padding: '24px', border: '2px solid', borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)' }}>
        <div className="question-header" style={{ paddingBottom: '14px', marginBottom: '16px', borderBottom: '2px solid', borderBottomColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Text strong style={{ fontSize: '20px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
              {index + 1}. Listening Section
            </Typography.Text>
            <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
              ({section.points} {section.points > 1 ? 'points' : 'point'})
            </Typography.Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!getFeedback(section.id, 'section') ? (
              <Button
                size="small"
                onClick={() => handleOpenAddFeedback(section.id, 'section')}
                style={{
                  fontSize: '13px',
                  height: '28px',
                  padding: '0 12px'
                }}
              >
                Add Feedback
              </Button>
            ) : (
              <Button
                size="small"
                onClick={() => handleOpenEditFeedback(section.id, 'section')}
                style={{
                  fontSize: '13px',
                  height: '28px',
                  padding: '0 12px'
                }}
              >
                Edit Feedback
              </Button>
            )}
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
    const studentAnswer = studentAnswers?.[section.id] || {};
    const studentEssayText = studentAnswer?.text || studentAnswer?.essay || '';
    const studentFiles = Array.isArray(studentAnswer?.files) ? studentAnswer.files : [];

    return (
      <div key={section.id || index} className={`question-item ${theme}-question-item`} style={{ marginBottom: '24px', borderRadius: '16px', padding: '24px', border: '2px solid', borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)' }}>
        <div className="question-header" style={{ paddingBottom: '14px', marginBottom: '16px', borderBottom: '2px solid', borderBottomColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', position: 'relative' }}>
          <Typography.Text strong style={{ fontSize: '16px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
            {index + 1}. Writing Section
          </Typography.Text>
          <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
            ({section.points} {section.points > 1 ? 'points' : 'point'})
          </Typography.Text>
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
                      if (index === 0) {
                        handleTextSelection(section.id, e.currentTarget);
                      }
                    }}
                    onMouseDown={(e) => {
                      if (index === 0) {
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
                      userSelect: index === 0 ? 'text' : 'none',
                      cursor: index === 0 ? 'text' : 'default',
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
                  {index === 0 && textSelection.visible && textSelection.sectionId === section.id && (
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
                          fontSize: '18px', 
                          color: theme === 'sun' ? '#1890ff' : '#8B5CF6' 
                        }} />
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
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
              ({section.points} {section.points > 1 ? 'points' : 'point'})
            </Typography.Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!getFeedback(section.id, 'section') ? (
              <Button
                size="small"
                onClick={() => handleOpenAddFeedback(section.id, 'section')}
                style={{
                  fontSize: '13px',
                  height: '28px',
                  padding: '0 12px'
                }}
              >
                Add Feedback
              </Button>
            ) : (
              <Button
                size="small"
                onClick={() => handleOpenEditFeedback(section.id, 'section')}
                style={{
                  fontSize: '13px',
                  height: '28px',
                  padding: '0 12px'
                }}
              >
                Edit Feedback
              </Button>
            )}
          </div>
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
                {/* Maximum Recording Time */}
                <div style={{
                  marginBottom: '16px',
                  fontWeight: '600',
                  fontSize: '20px',
                  color: theme === 'sun' ? '#1E40AF' : '#1F2937',
                  textAlign: 'left'
                }}>
                  🎤 Maximum limit 3 minutes
                </div>

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

                {/* Transcript Content */}
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
                    <div dangerouslySetInnerHTML={{ __html: section.transcript }} />
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
      const correctKey = correctOption?.key;
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {!getFeedback(q.id, 'question') ? (
                <Button
                  size="small"
                  onClick={() => handleOpenAddFeedback(q.id, 'question')}
                  style={{
                    fontSize: '13px',
                    height: '28px',
                    padding: '0 12px'
                  }}
                >
                  Add Feedback
                </Button>
              ) : (
                <Button
                  size="small"
                  onClick={() => handleOpenEditFeedback(q.id, 'question')}
                  style={{
                    fontSize: '13px',
                    height: '28px',
                    padding: '0 12px'
                  }}
                >
                  Edit Feedback
                </Button>
              )}
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
                
                return (
                  <div key={key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 18px',
                    background: isCorrectAnswer || isCorrectMissing
                      ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)')
                      : isSelectedWrong
                        ? (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)')
                      : (theme === 'sun' ? '#fff' : 'rgba(255,255,255,0.03)'),
                    border: `2px solid ${
                      isCorrectAnswer || isCorrectMissing
                        ? 'rgb(82, 196, 26)'
                        : isSelectedWrong
                          ? 'rgb(255, 77, 79)'
                        : (theme === 'sun' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)')
                    }`,
                    borderRadius: '12px',
                  }}>
                    <input 
                      type={isMulti ? 'checkbox' : 'radio'}
                      checked={isSelected || (!isSelected && isCorrectAnswer)}
                      disabled
                      style={{ 
                        width: '18px',
                        height: '18px',
                        accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
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
                      }} />
                    )}
                    {!isSelected && isCorrectAnswer && (
                      <CheckCircleOutlined style={{
                        fontSize: '22px',
                        color: '#52c41a',
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
          const correctItem = contentData.find(item => item.positionId === positionId && item.correct);
          const correctAnswer = correctItem?.value || '';
          
          let studentAnswer = '';
          if (typeof studentAnswerObj === 'object' && studentAnswerObj !== null) {
            studentAnswer = studentAnswerObj[positionId] || studentAnswerObj[match[2]] || '';
          } else if (typeof studentAnswerObj === 'string') {
            studentAnswer = studentAnswerObj;
          }
          
          const isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
          
          elements.push(
            <input
              key={`fill_blank_input_${inputIndex}`}
              type="text"
              value={studentAnswer}
              readOnly
              disabled
              style={{
                display: 'inline-block',
                minWidth: '120px',
                maxWidth: '200px',
                minHeight: '32px',
                padding: '4px 12px',
                margin: '0 8px',
                background: isCorrect 
                  ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
                  : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'),
                border: `2px solid ${isCorrect ? 'rgb(82, 196, 26)' : 'rgb(255, 77, 79)'}`,
                borderRadius: '8px',
                cursor: 'not-allowed',
                outline: 'none',
                lineHeight: '1.4',
                fontSize: '14px',
                boxSizing: 'border-box',
                textAlign: 'center',
                color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                fontWeight: '400',
                verticalAlign: 'middle'
              }}
            />
          );
          
          if (!isCorrect && studentAnswer) {
            elements.push(
              <span 
                key={`answer_${inputIndex}`}
                style={{ 
                  fontSize: '15px',
                  color: '#52c41a',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  marginLeft: '8px'
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
            <Typography.Text style={{ 
              fontSize: '14px', 
              color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic'
            }}>
              Fill in the Blank
            </Typography.Text>
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
          const optionsForPosition = contentData.filter(opt => {
            const optPosId = String(opt.positionId || '');
            const matchPosId = String(positionId);
            return optPosId === matchPosId;
          }) || [];
          
          const correctItem = optionsForPosition.find(it => it.correct);
          const correctAnswer = correctItem?.value || '';
          const studentAnswer = studentAnswerObj[positionId] || studentAnswerObj[match[1]] || '';
          const isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
          const optionValues = optionsForPosition.map(it => it.value).filter(Boolean);
          
          parts.push(
            <select
              key={`dd_${q.id}_${idx++}`}
              value={studentAnswer || ''}
              disabled
              style={{
                display: 'inline-block',
                minWidth: '120px',
                height: '32px',
                padding: '4px 12px',
                margin: '0 8px',
                background: isCorrect 
                  ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
                  : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'),
                border: `2px solid ${isCorrect ? 'rgb(82, 196, 26)' : 'rgb(255, 77, 79)'}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: isCorrect ? '#52c41a' : '#ff4d4f',
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
          
          if (!isCorrect && studentAnswer) {
            parts.push(
              <span 
                key={`answer_${idx++}`}
                style={{ 
                  fontSize: '15px',
                  color: '#52c41a',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  marginLeft: '8px'
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
            <Typography.Text style={{ 
              fontSize: '14px', 
              color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic'
            }}>
              Dropdown
            </Typography.Text>
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
            <Typography.Text style={{ 
              fontSize: '14px', 
              color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic'
            }}>
              Drag and Drop
            </Typography.Text>
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
                    const studentAnswer = studentAnswerObj[part.positionId] || '';
                    const correctItem = contentData.find(item => {
                      const itemPosId = String(item.positionId || '');
                      const matchPosId = String(part.positionId);
                      return itemPosId === matchPosId && item.correct;
                    });
                    const correctAnswer = correctItem?.value || '';
                    const isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
                    
                    return (
                      <React.Fragment key={pIdx}>
                        {studentAnswer ? (
                          <div style={{
                            minWidth: '120px',
                            height: '32px',
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
                            textAlign: 'center'
                          }} dangerouslySetInnerHTML={{ __html: studentAnswer || '' }} />
                        ) : (
                          <div style={{
                            minWidth: '120px',
                            height: '32px',
                            margin: '0 8px',
                            background: '#ffffff',
                            border: '2px dashed rgba(0, 0, 0, 0.3)',
                            borderRadius: '8px',
                            display: 'inline-block',
                            padding: '4px 12px',
                            fontSize: '15px',
                            color: 'rgba(0, 0, 0, 0.5)',
                            cursor: 'not-allowed',
                            verticalAlign: 'middle',
                            lineHeight: '1.4',
                            boxSizing: 'border-box',
                            textAlign: 'center'
                          }}>Empty</div>
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
      
      const correctOrder = contentData
        .slice()
        .sort((a, b) => {
          const posA = parseInt((a.positionId || '').replace('pos_', ''));
          const posB = parseInt((b.positionId || '').replace('pos_', ''));
          return posA - posB;
        })
        .map(item => item.value)
        .filter(Boolean);
      
      const studentOrder = Array.isArray(studentAnswer) 
        ? studentAnswer 
        : (typeof studentAnswer === 'object' && studentAnswer !== null
            ? Object.keys(studentAnswer).sort((a, b) => parseInt(a) - parseInt(b)).map(key => studentAnswer[key]).filter(Boolean)
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
            <Typography.Text style={{ 
              fontSize: '14px', 
              color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic'
            }}>
              Rearrange
            </Typography.Text>
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
                  <Typography.Text style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.5)', fontStyle: 'italic' }}>
                    No answer provided
                  </Typography.Text>
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
      
      const correctAnswers = contentData.map(item => item?.value || '').filter(Boolean);
      const isCorrect = (() => {
        if (!studentAnswer || correctAnswers.length === 0) return false;
        const normalizedStudent = studentAnswer.trim().toLowerCase();
        return correctAnswers.some(correct => 
          correct.trim().toLowerCase() === normalizedStudent
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
            <Typography.Text style={{ 
              fontSize: '14px', 
              color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic'
            }}>
              Rewrite
            </Typography.Text>
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
                border: `2px solid ${studentAnswer ? (isCorrect ? '#52c41a' : '#ff4d4f') : (theme === 'sun' ? '#1890ff' : '#8B5CF6')}`,
                borderRadius: '8px',
                backgroundColor: studentAnswer
                  ? (isCorrect ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)') : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'))
                  : (theme === 'sun' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.85)'),
                color: studentAnswer ? (isCorrect ? '#52c41a' : '#ff4d4f') : (theme === 'sun' ? '#000000' : '#FFFFFF'),
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                cursor: 'not-allowed'
              }}>
                {studentAnswer || 'No answer provided'}
              </div>
            </div>
            {correctAnswers.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '8px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                  Correct answer{correctAnswers.length > 1 ? 's' : ''}:
                </Typography.Text>
                {correctAnswers.map((correctAnswer, idx) => (
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
                    marginBottom: idx < correctAnswers.length - 1 ? '8px' : '0',
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
          <Typography.Text style={{ 
            fontSize: '14px', 
            color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
            fontStyle: 'italic'
          }}>
            {q.type.replace('_', ' ')}
          </Typography.Text>
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

  return (
    <ThemedLayout>
      <div className={`sdc-wrapper ${theme}-sdc-wrapper`}>
        {/* Student Info Card */}
        <div className="sdc-student-info-section" style={{ padding: '24px' }}>
          <div className={`sdc-student-info-card ${theme}-sdc-student-info-card`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div className="sdc-student-avatar-section">
                <Avatar
                  size={80}
                  src={student.avatar}
                  style={{
                    backgroundColor: theme === 'sun' ? '#1890ff' : '#722ed1',
                    fontSize: '32px',
                    fontWeight: 'bold',
                  }}
                >
                  {student.name.charAt(0)}
                </Avatar>
              </div>
              <div className="sdc-student-details">
                <Typography.Title level={3} style={{ margin: 0, marginBottom: '4px' }}>
                  {student.name}
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                  {student.id} • {student.email}
                </Typography.Text>
                <Space size="middle">
                  <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                    {student.class}
                  </Tag>
                  <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
                    {student.level}
                  </Tag>
                </Space>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                className={`tab-button ${theme}-tab-button`}
                onClick={() => {
                  spaceToast.info('Add score feature coming soon');
                }}
              >
                Add Score
              </Button>
              <Button
                className={`tab-button ${theme}-tab-button`}
                onClick={() => {
                  spaceToast.info('Edit score feature coming soon');
                }}
              >
                Edit Score
              </Button>
            </div>
          </div>
        </div>

        {/* Performance Summary Cards */}
        <div className="sdc-performance-cards-section" style={{ padding: '0 24px 24px 24px' }}>
          <div className="sdc-performance-cards-grid">
            <div className={`sdc-performance-card ${theme}-sdc-performance-card`}>
              <div className="sdc-card-icon" style={{ color: '#1890ff' }}>
                <TrophyOutlined style={{ fontSize: '32px' }} />
              </div>
              <div className="sdc-card-content">
                <Typography.Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                  {submission.score}/10
                </Typography.Title>
                <Typography.Text type="secondary">Score</Typography.Text>
              </div>
            </div>

            <div className={`sdc-performance-card ${theme}-sdc-performance-card`}>
              <div className="sdc-card-icon" style={{ color: '#52c41a' }}>
                <CheckCircleOutlined style={{ fontSize: '32px' }} />
              </div>
              <div className="sdc-card-content">
                <Typography.Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                  {submission.totalPoints}/{submission.maxPoints}
                </Typography.Title>
                <Typography.Text type="secondary">Points</Typography.Text>
              </div>
            </div>

            <div className={`sdc-performance-card ${theme}-sdc-performance-card`}>
              <div className="sdc-card-icon" style={{ color: '#faad14' }}>
                <ClockCircleOutlined style={{ fontSize: '32px' }} />
              </div>
              <div className="sdc-card-content">
                <Typography.Title level={2} style={{ margin: 0, color: '#faad14' }}>
                  {submission.timeSpent}
                </Typography.Title>
                <Typography.Text type="secondary">Minutes</Typography.Text>
              </div>
            </div>

            <div className={`sdc-performance-card ${theme}-sdc-performance-card`}>
              <div className="sdc-card-content" style={{ width: '100%' }}>
                <Typography.Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
                  {submission.accuracy}%
                </Typography.Title>
                <Progress
                  percent={submission.accuracy}
                  strokeColor={{
                    '0%': '#52c41a',
                    '100%': '#1890ff',
                  }}
                  showInfo={false}
                />
                <Typography.Text type="secondary">Accuracy</Typography.Text>
              </div>
            </div>

            <div className={`sdc-performance-card ${theme}-sdc-performance-card sdc-summary-card`}>
              <div className="sdc-card-content" style={{ width: '100%' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                      <Typography.Text>Correct</Typography.Text>
                    </Space>
                    <Typography.Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                      {submission.correctCount}
                    </Typography.Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '18px' }} />
                      <Typography.Text>Incorrect</Typography.Text>
                    </Space>
                    <Typography.Text strong style={{ fontSize: '18px', color: '#ff4d4f' }}>
                      {submission.incorrectCount}
                    </Typography.Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <MinusCircleOutlined style={{ color: '#8c8c8c', fontSize: '18px' }} />
                      <Typography.Text>Unanswered</Typography.Text>
                    </Space>
                    <Typography.Text strong style={{ fontSize: '18px', color: '#8c8c8c' }}>
                      {submission.unansweredCount}
                    </Typography.Text>
                  </div>
                </Space>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Review - New structure using fakeData */}
        <div className="sdc-questions-review-section" style={{ padding: '0 24px 24px 24px' }}>
          {/* Grammar & Vocabulary Questions */}
          {questions.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <Typography.Title level={3} style={{ marginBottom: '24px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                Grammar & Vocabulary
              </Typography.Title>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {questions.map((q, idx) => renderQuestion(q, idx))}
          </Space>
        </div>
          )}

          {/* Reading Sections */}
          {readingSections.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <Typography.Title level={3} style={{ marginBottom: '24px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                Reading
                    </Typography.Title>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {readingSections.map((section, idx) => renderReadingSection(section, idx))}
              </Space>
                  </div>
          )}

          {/* Listening Sections */}
          {listeningSections.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <Typography.Title level={3} style={{ marginBottom: '24px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                Listening
                    </Typography.Title>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {listeningSections.map((section, idx) => renderListeningSection(section, idx))}
              </Space>
                  </div>
          )}

          {/* Writing Sections */}
          {writingSections.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <Typography.Title level={3} style={{ marginBottom: '24px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                Writing
              </Typography.Title>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {writingSections.map((section, idx) => renderWritingSection(section, idx))}
              </Space>
                        </div>
                  )}

          {/* Speaking Sections */}
          {speakingSections.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <Typography.Title level={3} style={{ marginBottom: '24px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                Speaking
              </Typography.Title>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {speakingSections.map((section, idx) => renderSpeakingSection(section, idx))}
              </Space>
                    </div>
                  )}
                  </div>
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
            {feedbackModal.isEdit ? 'Edit Feedback' : 'Add Feedback'}
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
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
              color: theme === 'sun' ? '#000' : '#fff',
              borderRadius: '6px',
              height: '32px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '4px 15px',
              width: '100px',
              transition: 'all 0.3s ease',
              boxShadow: 'none'
            }}
            onMouseEnter={(e) => {
              if (theme === 'sun') {
                e.target.style.background = 'rgb(95, 160, 240)';
                e.target.style.borderColor = 'rgb(95, 160, 240)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(113, 179, 253, 0.4)';
              } else {
                e.target.style.background = 'linear-gradient(135deg, #5a1fb8 0%, #8a7aff 100%)';
                e.target.style.borderColor = '#5a1fb8';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(114, 40, 217, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (theme === 'sun') {
                e.target.style.background = 'rgb(113, 179, 253)';
                e.target.style.borderColor = 'rgb(113, 179, 253)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              } else {
                e.target.style.background = 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)';
                e.target.style.borderColor = '#7228d9';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}>
            {feedbackModal.isEdit ? 'Update' : 'Add'}
          </Button>
        ]}>
        <div style={{ padding: '20px 0' }}>
          <Input.TextArea
            rows={6}
            value={feedbackModal.feedback}
            onChange={(e) => setFeedbackModal(prev => ({ ...prev, feedback: e.target.value }))}
            placeholder="Enter your feedback for this question..."
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
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
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
              color: theme === 'sun' ? '#000' : '#fff',
              borderRadius: '6px',
              height: '32px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '4px 15px',
              width: '100px',
              transition: 'all 0.3s ease',
              boxShadow: 'none'
            }}
            onMouseEnter={(e) => {
              if (theme === 'sun') {
                e.target.style.background = 'rgb(95, 160, 240)';
                e.target.style.borderColor = 'rgb(95, 160, 240)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(113, 179, 253, 0.4)';
              } else {
                e.target.style.background = 'linear-gradient(135deg, #5a1fb8 0%, #8a7aff 100%)';
                e.target.style.borderColor = '#5a1fb8';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(114, 40, 217, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (theme === 'sun') {
                e.target.style.background = 'rgb(113, 179, 253)';
                e.target.style.borderColor = 'rgb(113, 179, 253)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              } else {
                e.target.style.background = 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)';
                e.target.style.borderColor = '#7228d9';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}>
            {commentModal.isEdit ? 'Update' : 'Add'}
          </Button>
        ]}>
        <div style={{ padding: '20px 0' }}>
          <Input.TextArea
            rows={6}
            value={commentModal.comment}
            onChange={(e) => setCommentModal(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Enter your comment for the selected text..."
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

          {/* Edit Button */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
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
        </div>
      )}
    </ThemedLayout>
  );
};

export default DailyChallengeSubmissionDetail;
