import React, { useState, useCallback, useRef } from "react";
import {
  Button,
  Card,
  Row,
  Col,
  Space,
  Typography,
  Upload,
  Divider,
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  PlusOutlined,
  FileTextOutlined,
  UploadOutlined,
  DeleteOutlined,
  LoadingOutlined,
  HolderOutlined,
  EditOutlined,
  CopyOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import { extractTextFromPDF, isValidPDF } from "../../../../utils/pdfUtils";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useSelector } from "react-redux";
import dailyChallengeApi from "../../../../apis/backend/dailyChallengeManagement";
import {
  MultipleChoiceModal,
  MultipleSelectModal,
  TrueFalseModal,
  FillBlankModal,
  DropdownModal,
  DragDropModal,
  ReorderModal,
} from "./questionModals";
import "./CreateReadingChallenge.css";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const { Title, Text } = Typography;

const CreateReadingChallenge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // Get challenge ID from URL
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useSelector((state) => state.auth);
  
  // Add CSS to fix CKEditor overflow
  React.useEffect(() => {
    const editorStyles = `
      .rc-ckeditor-wrapper .ck-editor__editable {
        min-height: 300px !important;
        max-height: calc(100vh - 300px) !important;
        overflow-y: auto !important;
      }
      .rc-ckeditor-wrapper .ck-editor {
        height: 100% !important;
      }
      .rc-ckeditor-wrapper .ck-editor__main {
        height: calc(100% - 40px) !important;
      }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = editorStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);
  
  // Custom upload adapter for CKEditor to convert images to base64
  function CustomUploadAdapterPlugin(editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
      return {
        upload: () => {
          return loader.file.then(file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({ default: reader.result });
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
          }));
        },
        abort: () => {}
      };
    };
  }
  
  // Get challenge info from navigation state or URL params
  const challengeInfo = location.state || {};
  const { challengeId, challengeName, classId, className, editingPassage } = challengeInfo;
  
  // Use challenge ID from URL params if available, otherwise from state
  const currentChallengeId = id || challengeId;
  
  // Determine challenge type from URL path
  const isListeningChallenge = location.pathname.includes('/listening/');
  const isWritingChallenge = location.pathname.includes('/writing/');
  const isSpeakingChallenge = location.pathname.includes('/speaking/');
  
  // Initialize passage with editingPassage if provided
  const [passage, setPassage] = useState(() => {
    if (editingPassage) {
      // Log the editingPassage to debug
      console.log('Loading editingPassage:', editingPassage);
      console.log('Questions in editingPassage:', editingPassage.questions);
      
      // For Speaking challenge, remove [[dur_3]] from content to avoid duplicate when saving
      let content = editingPassage.content || "";
      if (isSpeakingChallenge) {
        // Remove [[dur_3]] if it exists (may have trailing/leading whitespace)
        content = content.replace(/\s*\[\[dur_3\]\]\s*/g, ' ').trim();
        console.log('Removed [[dur_3]] from editing content:', content);
      }
      
      // Editing mode - use existing passage data
      return {
        id: editingPassage.id,
        title: editingPassage.title || (isWritingChallenge ? "Writing Prompt" : "Passage"),
        content: content,
        type: editingPassage.content ? "manual" : null,
        // Mark backend questions so we know to send their ids on save
        questions: (editingPassage.questions || []).map(q => ({ ...q, isFromBackend: true })),
        audioFile: editingPassage.audioFile || null,
        audioUrl: editingPassage.audioUrl || null,
        sectionId: editingPassage.sectionId
      };
    } else {
      // New mode - start with empty passage
      return {
        id: 1,
        title: isWritingChallenge ? "Writing Prompt" : "Passage",
        content: "",
        type: null,
        questions: [],
        audioFile: null,
        audioUrl: null
      };
    }
  });
  const [passageContent, setPassageContent] = useState("");
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [uploadedAudioFileName, setUploadedAudioFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Question management state
  const [activeModal, setActiveModal] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionTypeModalVisible, setQuestionTypeModalVisible] = useState(false);
  
  // Speaking recording time setting - Fixed at 3 minutes (180 seconds)
  // eslint-disable-next-line no-unused-vars
  const recordingTimeSeconds = 180; // Fixed at 3 minutes as per requirements (used in UI display)
  
  // Use ref to track if we're updating from passage change to prevent infinite loop
  const isUpdatingFromPassage = useRef(false);
  const debounceTimer = useRef(null);

  // Get current passage
  const questions = passage?.questions || [];
  // Only show questions that are not marked for deletion
  const visibleQuestions = questions.filter(q => q?.toBeDeleted !== true);

  // Update passageContent when passage changes
  React.useEffect(() => {
    // Clear any pending debounce timer to prevent old content from being applied
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    isUpdatingFromPassage.current = true;
    setPassageContent(passage.content || "");
    // Reset flag after a tick
    setTimeout(() => {
      isUpdatingFromPassage.current = false;
    }, 0);
  }, [passage.content]);

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      // Cleanup audio preview URL
      if (passage?.audioPreviewUrl) {
        URL.revokeObjectURL(passage.audioPreviewUrl);
      }
    };
  }, [passage?.audioPreviewUrl]);

  const handleBack = () => {
    // Navigate back to DailyChallengeContent with proper path based on user role
    const userRole = user?.role?.toLowerCase();
    const basePath = userRole === 'teaching_assistant' 
      ? '/teaching-assistant/daily-challenges/detail'
      : '/teacher/daily-challenges/detail';
    
    navigate(`${basePath}/${currentChallengeId}/content`, {
      state: {
        challengeId: currentChallengeId,
        challengeName,
        classId,
        className
      }
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate required data
      if (!currentChallengeId) {
        spaceToast.warning("Challenge ID is required");
        setIsSaving(false);
        return;
      }

      if (!passage.content || passage.content.trim() === '') {
        spaceToast.warning("Please add passage content before saving");
        setIsSaving(false);
        return;
      }

      // For listening challenges only, audio file is required
      if (isListeningChallenge && !passage.audioUrl) {
        spaceToast.warning("Please upload audio file before saving");
        setIsSaving(false);
        return;
      }

      // Map question types to API format
      const mapQuestionType = (type) => {
        const typeMap = {
          'multiple-choice': 'MULTIPLE_CHOICE',
          'multiple-select': 'MULTIPLE_SELECT',
          'true-false': 'TRUE_OR_FALSE',
          'TRUE_OR_FALSE': 'TRUE_OR_FALSE', // Handle both formats
          'fill-blank': 'FILL_IN_THE_BLANK',
          'dropdown': 'DROPDOWN',
          'drag-drop': 'DRAG_AND_DROP',
          'reorder': 'REARRANGE',
          'WRITING': 'WRITING', // Add writing type
          'SPEAKING': 'SPEAKING' // Add speaking type
        };
        return typeMap[type] || type.toUpperCase();
      };

      // For Writing and Speaking Challenge, create a simple question with passage content as questionText
      let transformedQuestions;
      
      if (isWritingChallenge) {
        // Writing Challenge: Create a single question with passage content as questionText
        // When editing (passage.questions exists and has id), include the id
        const existingQuestion = passage.questions && passage.questions.length > 0 ? passage.questions[0] : null;
        
        transformedQuestions = [{
          // Include id if editing existing passage
          ...(existingQuestion?.id && { id: existingQuestion.id }),
          questionText: passage.content || '',
          orderNumber: 1,
          score: 1,
          questionType: 'WRITING', // Custom type for writing
          toBeDeleted: false,
          content: {
            data: [] // Empty data array as requested
          }
        }];
        
        console.log('Writing question created:', {
          hasId: !!transformedQuestions[0].id,
          id: transformedQuestions[0].id,
          questionText: transformedQuestions[0].questionText.substring(0, 50) + '...'
        });
      } else if (isSpeakingChallenge) {
        // Speaking Challenge: Create a single question with passage content as questionText
        // The content will contain [[dur_3]] placeholder injected earlier
        // When editing (passage.questions exists and has id), include the id
        const existingQuestion = passage.questions && passage.questions.length > 0 ? passage.questions[0] : null;
        
        transformedQuestions = [{
          // Include id if editing existing passage
          ...(existingQuestion?.id && { id: existingQuestion.id }),
          questionText: passage.content || '',
          orderNumber: 1,
          score: 1,
          questionType: 'SPEAKING', // Custom type for speaking
          toBeDeleted: false,
          content: {
            data: [] // Empty data array as requested
          }
        }];
        
        console.log('Speaking question created:', {
          hasId: !!transformedQuestions[0].id,
          id: transformedQuestions[0].id,
          questionText: transformedQuestions[0].questionText.substring(0, 50) + '...'
        });
      } else {
        // Other challenges: Transform questions normally
        let activeOrderCounter = 0;
        transformedQuestions = (passage.questions || []).map((question, index) => {
        console.log('Transforming question:', index, {
          id: question.id,
          isFromBackend: question.isFromBackend,
          hasId: !!question.id,
          shouldIncludeId: question.isFromBackend && question.id
        });
        
        const baseQuestion = {
          // Only include id for questions that originated from backend
          ...(question.isFromBackend && question.id ? { id: question.id } : {}),
          questionText: question.question || question.questionText || '',
          // Assign sequential order only for active questions; deleted ones get 0
          orderNumber: question.toBeDeleted ? 0 : (++activeOrderCounter),
          score: question.points || 1,
          questionType: mapQuestionType(question.type),
          toBeDeleted: question.toBeDeleted === true
        };
        
        console.log('Transformed question:', baseQuestion);

        // Handle different question types
        switch (question.type) {
          case 'MULTIPLE_CHOICE':
          case 'multiple-choice':
            return {
              ...baseQuestion,
              content: {
                data: (question.options || []).map((option, optIndex) => ({
                  id: option.key || `option_${optIndex}`,
                  value: option.text || option.value || '',
                  positionId: `pos_${optIndex}`,
                  correct: option.isCorrect || false
                }))
              }
            };

          case 'MULTIPLE_SELECT':
          case 'multiple-select':
            return {
              ...baseQuestion,
              content: {
                data: (question.options || []).map((option, optIndex) => ({
                  id: option.key || `option_${optIndex}`,
                  value: option.text || option.value || '',
                  positionId: `pos_${optIndex}`,
                  correct: option.isCorrect || false
                }))
              }
            };

          case 'TRUE_OR_FALSE':
          case 'true-false':
            // Use existing content.data if available (for editing), otherwise create new
            if (question.content && question.content.data && question.content.data.length > 0) {
              return {
                ...baseQuestion,
                content: question.content
              };
            } else {
              // Create new content for new questions
              return {
                ...baseQuestion,
                content: {
                  data: [
                    {
                      id: 'true_option',
                      value: 'True',
                      positionId: 'pos_true',
                      correct: question.correctAnswer === true || question.correctAnswer === 'True'
                    },
                    {
                      id: 'false_option',
                      value: 'False',
                      positionId: 'pos_false',
                      correct: question.correctAnswer === false || question.correctAnswer === 'False'
                    }
                  ]
                }
              };
            }

          case 'FILL_IN_THE_BLANK':
          case 'fill-blank':
            return {
              ...baseQuestion,
              content: question.content || {
                data: []
              }
            };

          case 'DROPDOWN':
          case 'dropdown':
            return {
              ...baseQuestion,
              content: question.content || {
                data: []
              }
            };

          case 'DRAG_AND_DROP':
          case 'drag-drop':
            return {
              ...baseQuestion,
              content: question.content || {
                data: []
              }
            };

          case 'REARRANGE':
          case 'reorder':
            return {
              ...baseQuestion,
              content: question.content || {
                data: []
              }
            };

          default:
            return {
              ...baseQuestion,
              content: {
                data: []
              }
            };
        }
      });
      }

      // For speaking challenges, inject [[dur_3]] placeholder into the content
      // This needs to be done for both section content and question text
      let finalContent = passage.content;
      let finalQuestionText = passage.content;
      
      if (isSpeakingChallenge) {
        // If content doesn't already contain [[dur_3]], append it
        if (!finalContent.includes('[[dur_3]]')) {
          finalContent = `${finalContent} [[dur_3]]`;
          finalQuestionText = finalContent; // Use the same content with [[dur_3]] for questionText
        }
      }

      // Update transformedQuestions for speaking to use content with [[dur_3]]
      // Preserve id when updating (don't overwrite existing transformed question)
      if (isSpeakingChallenge && transformedQuestions && transformedQuestions.length > 0) {
        const existingId = transformedQuestions[0].id;
        transformedQuestions[0].questionText = finalQuestionText;
        // Restore id if it was there (for editing)
        if (existingId && !transformedQuestions[0].id) {
          transformedQuestions[0].id = existingId;
        }
        console.log('Updated speaking question with [[dur_3]], id preserved:', transformedQuestions[0].id);
      }

      // Use questions as is
      const sanitizedQuestions = transformedQuestions || [];

      // Create section data similar to Grammar & Vocabulary but with multiple questions in one section
      // Include sectionId if editing existing passage (especially for WR writing challenges)
      // Include audioUrl if listening/speaking challenge has audio
      const sectionData = {
        section: {
          // Always include id when editing (has sectionId), null for new sections
          ...(passage.sectionId && { id: passage.sectionId }),
          sectionTitle: isWritingChallenge ? "Writing Section" : 
                        isListeningChallenge ? "Listening Section" : 
                        isSpeakingChallenge ? "Speaking Section" : 
                        "Reading Section",
          sectionsUrl: (isListeningChallenge || isSpeakingChallenge) && passage.audioUrl ? passage.audioUrl : "", // Audio URL for listening/speaking
          sectionsContent: finalContent,
          orderNumber: 1, // First section
          resourceType: (isListeningChallenge || isSpeakingChallenge) ? "FILE" : "DOCUMENT" // FILE for listening/speaking, DOCUMENT for reading/writing
        },
        questions: sanitizedQuestions
      };

      console.log('Saving section with questions:', sectionData);
      console.log('Challenge ID:', currentChallengeId);
      console.log('Section ID:', passage.sectionId);
      console.log('Is Speaking Challenge:', isSpeakingChallenge);
      console.log('Is Listening Challenge:', isListeningChallenge);
      console.log('Is Writing Challenge:', isWritingChallenge);
      console.log('Resource Type:', sectionData.section.resourceType);
      console.log('Audio URL:', sectionData.section.sectionsUrl);
      console.log('Recording Time (fixed):', isSpeakingChallenge ? '3 minutes ([[dur_3]])' : 'N/A');
      console.log('Section Content:', sectionData.section.sectionsContent);
      console.log('Questions count:', sanitizedQuestions.length);
      if (isSpeakingChallenge && sanitizedQuestions.length > 0) {
        console.log('Speaking Question:', {
          questionText: sanitizedQuestions[0].questionText,
          questionType: sanitizedQuestions[0].questionType
        });
      }

      // Try using the same API as DailyChallengeContent but with multiple questions
      const response = await dailyChallengeApi.saveSectionWithQuestions(currentChallengeId, sectionData);
      
      if (response.message) {
        spaceToast.success(response.data?.message || response.message || "Challenge saved successfully!");
        
        // Navigate back to DailyChallengeContent with proper path based on user role
        const userRole = user?.role?.toLowerCase();
        const basePath = userRole === 'teaching_assistant' 
          ? '/teaching-assistant/daily-challenges/detail'
          : '/teacher/daily-challenges/detail';
        
        navigate(`${basePath}/${currentChallengeId}/content`, {
          state: {
            challengeId: currentChallengeId,
            challengeName,
            classId,
            className
          }
        });
        return; // Exit function after successful navigation
      }

    } catch (error) {
      console.error('Error saving challenge:', error);
      spaceToast.error(error.response?.data?.error || error.response?.data?.message || "Failed to save challenge. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // No need for add/discard passage functions since we only have one passage

  // Debounced editor change handler (same as MultipleChoiceModal)
  const handlePassageContentChange = useCallback((content) => {
    // Only update if not currently updating from passage change
    if (isUpdatingFromPassage.current) {
      return;
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer - update after 150ms of no typing (same as MultipleChoiceModal)
    debounceTimer.current = setTimeout(() => {
      setPassageContent(prevContent => {
        // Only update if content actually changed
        if (prevContent !== content) {
          // Also update passage state
          setPassage(prevPassage => ({ ...prevPassage, content }));
          return content;
        }
        return prevContent;
      });
    }, 150);
  }, []);

  const handleUploadPDF = async (file) => {
    try {
      // Kiểm tra file có hợp lệ không
      if (!isValidPDF(file)) {
        spaceToast.error("Vui lòng chọn file PDF hợp lệ (tối đa 10MB)");
        return false;
      }

      setIsProcessingPDF(true);
      setUploadedFileName(file.name);

      // Trích xuất text từ PDF
      const extractedText = await extractTextFromPDF(file);
      
      if (!extractedText || extractedText.trim().length === 0) {
        spaceToast.warning("Không thể trích xuất text từ file PDF này. File có thể bị mã hóa hoặc không chứa text.");
        return false;
      }

      // Cập nhật passage content với text đã trích xuất
      handlePassageContentChange(extractedText);

      // Chuyển sang chế độ manual để hiển thị text
      setPassage(prevPassage => ({ ...prevPassage, type: "manual", content: extractedText }));

      spaceToast.success(`Đã trích xuất text từ file "${file.name}" thành công!`);
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      spaceToast.error(error.message || "Có lỗi xảy ra khi xử lý file PDF");
    } finally {
      setIsProcessingPDF(false);
    }

    return false; // Prevent default upload
  };

  const handleUploadAudio = async (file) => {
    try {
      // Validate audio file
      const allowedTypes = ['audio/mp3', 'audio/mpeg'];
      if (!allowedTypes.includes(file.type)) {
        spaceToast.error("Vui lòng chọn file audio hợp lệ (MP3)");
        return false;
      }

      // Check file size (max 10MB for audio)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        spaceToast.error("File size must be less than 10MB");
        return false;
      }

      setIsProcessingAudio(true);
      setUploadedAudioFileName(file.name);

      // Upload file directly to server (as multipart/form-data)
      const response = await dailyChallengeApi.uploadFile(file);
      
      console.log('Audio upload response:', response);
      
      // Get URL from response - handle different response formats
      let audioUrl = null;
      if (response?.data?.url) {
        audioUrl = response.data.url;
      } else if (response?.data) {
        audioUrl = response.data;
      } else if (typeof response === 'string') {
        audioUrl = response;
      }
      
      if (!audioUrl) {
        console.error('Upload response structure:', response);
        throw new Error("Upload failed: No URL returned from server");
      }
      
      console.log('Extracted audio URL:', audioUrl);

      // Create local preview URL for immediate feedback
      const previewUrl = URL.createObjectURL(file);

      // Update passage with audio file and URL from server
      setPassage(prevPassage => ({ 
        ...prevPassage, 
        audioFile: file,
        audioUrl: audioUrl, // Server URL for saving
        audioPreviewUrl: previewUrl // Local preview URL
      }));

      spaceToast.success(`Audio file "${file.name}" uploaded successfully!`);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || "Có lỗi xảy ra khi xử lý file audio");
    } finally {
      setIsProcessingAudio(false);
    }

    return false; // Prevent default upload
  };

  // Question management handlers
  const handleAddQuestion = () => {
    setQuestionTypeModalVisible(true);
  };

  const handleQuestionTypeClick = (questionType) => {
    setActiveModal(questionType.type);
    setEditingQuestion(null);
    setQuestionTypeModalVisible(false);
  };

  const handleQuestionTypeModalCancel = () => {
    setQuestionTypeModalVisible(false);
  };

  const handleEditQuestion = (question) => {
    console.log('Editing question:', question);
    
    // Normalize backend enum types to modal keys
    const modalTypeMap = {
      MULTIPLE_CHOICE: 'multiple-choice',
      MULTIPLE_SELECT: 'multiple-select',
      TRUE_OR_FALSE: 'true-false',
      FILL_IN_THE_BLANK: 'fill-blank',
      DROPDOWN: 'dropdown',
      DRAG_AND_DROP: 'drag-drop',
      REARRANGE: 'reorder'
    };
    const normalizedType = modalTypeMap[question.type] || question.type;
    
    // Transform question data to match modal expectations
    const transformedQuestion = {
      ...question,
      // Ensure question text is available
      question: question.question || question.questionText || '',
      // Ensure type is normalized
      type: normalizedType,
      // Ensure options are properly formatted for multiple choice/select
      options: question.options || (question.content?.data ? question.content.data.map((item, index) => ({
        key: item.id || `option_${index}`,
        text: item.value || item.text || '',
        isCorrect: item.correct || false
      })) : []),
      // Ensure points/score is available
      points: question.points || question.score || 1,
      // Ensure correct answer for true/false - check options array first, then content.data
      correctAnswer: question.correctAnswer !== undefined ? question.correctAnswer : 
                    (question.options?.find(option => option.isCorrect)?.text || 
                     question.content?.data?.find(item => item.correct)?.value || 'False')
    };
    
    console.log('Transformed question for modal:', transformedQuestion);
    console.log('Original question options:', question.options);
    console.log('Original question content.data:', question.content?.data);
    
    setEditingQuestion(transformedQuestion);
    setActiveModal(normalizedType);
  };

  const handleDeleteQuestion = (questionId) => {
    setPassage(prevPassage => {
      const updatedQuestions = prevPassage.questions
        .map(q => {
          if (q.id === questionId) {
            if (q.isFromBackend) {
              return { ...q, toBeDeleted: true };
            }
            return null;
          }
          return q;
        })
        .filter(Boolean);

      return { ...prevPassage, questions: updatedQuestions };
    });
    spaceToast.success("Question marked for deletion");
  };

  const handleSaveQuestion = (questionData) => {
    setPassage(prevPassage => {
      if (editingQuestion) {
        // Update existing question
        return {
          ...prevPassage,
          questions: prevPassage.questions.map(q =>
            q.id === editingQuestion.id 
              ? { 
                  ...q,
                  ...questionData, 
                  id: editingQuestion.id,
                  isFromBackend: q.isFromBackend === true || editingQuestion.isFromBackend === true
                } 
              : q
          )
        };
      } else {
        // Add new question - don't assign id, let backend generate it
          const newQuestion = {
            ...questionData,
            // No id field - backend will generate it
            isFromBackend: false,
          };
        return {
          ...prevPassage,
          questions: [...prevPassage.questions, newQuestion]
        };
      }
    });

    spaceToast.success(editingQuestion ? "Question updated successfully!" : "Question added successfully!");
    setActiveModal(null);
    setEditingQuestion(null);
  };

  const handleCancelModal = () => {
    setActiveModal(null);
    setEditingQuestion(null);
  };

  const getQuestionTypeLabel = (type) => {
    const typeMap = {
      'multiple-choice': 'MCQ',
      'multiple-select': 'MULTISELECT',
      'true-false': 'TRUE/FALSE',
      'fill-blank': 'FILLBLANK',
      'dropdown': 'DROPDOWN',
      'drag-drop': 'DRAGNDROP',
      'reorder': 'REORDER',
    };
    return typeMap[type] || type.toUpperCase();
  };

  // Helper function to strip HTML tags and get plain text
  const stripHtmlTags = (html) => {
    if (!html) return '';
    try {
      const tmp = document.createElement('DIV');
      tmp.innerHTML = html;
      const text = tmp.textContent || tmp.innerText || '';
      // Limit to 80 characters for preview
      return text.length > 80 ? text.substring(0, 80) + '...' : text;
    } catch (error) {
      console.error('Error stripping HTML tags:', error, 'HTML:', html);
      return String(html).substring(0, 80) + '...';
    }
  };

  // Helper function to format fill-in-the-blank questions
  const formatFillBlankQuestion = (question) => {
    if (question.type !== 'fill-blank' && question.type !== 'FILL_IN_THE_BLANK') {
      return stripHtmlTags(question.question) || "No question text";
    }

    // Parse questionText and replace [[pos_xxx]] with (1)____, (2)____, etc.
    let displayText = question.questionText || question.question;
    
    if (question.content && question.content.data) {
      question.content.data.forEach((item, idx) => {
        const number = idx + 1; // 1, 2, 3, 4...
        const pattern = `[[pos_${item.positionId}]]`;
        
        // Replace pattern with (1)____ format
        displayText = displayText.replace(
          pattern,
          `(${number})____`
        );
      });
    }

    // Strip HTML tags and limit length for preview
    const tmp = document.createElement('DIV');
    tmp.innerHTML = displayText;
    const text = tmp.textContent || tmp.innerText || '';
    return text.length > 80 ? text.substring(0, 80) + '...' : text;
  };

  // Helper function to format dropdown questions
  const formatDropdownQuestion = (question) => {
    if (question.type !== 'DROPDOWN' && question.type !== 'dropdown') {
      return stripHtmlTags(question.question) || "No question text";
    }

    // Parse questionText and replace [[pos_xxx]] with (1)▼, (2)▼, etc.
    let displayText = question.questionText || question.question;
    
    if (question.content && question.content.data) {
      // Group options by positionId
      const positionGroups = {};
      question.content.data.forEach((item) => {
        if (!positionGroups[item.positionId]) {
          positionGroups[item.positionId] = [];
        }
        positionGroups[item.positionId].push(item);
      });
      
      // Process each position group
      Object.keys(positionGroups).forEach((positionId, idx) => {
        const number = idx + 1; // 1, 2, 3, 4...
        const pattern = `[[pos_${positionId}]]`;
        
        // Replace pattern with (1)▼ format
        displayText = displayText.replace(
          pattern,
          `(${number})▼`
        );
      });
    }

    // Strip HTML tags and limit length for preview
    const tmp = document.createElement('DIV');
    tmp.innerHTML = displayText;
    const text = tmp.textContent || tmp.innerText || '';
    return text.length > 80 ? text.substring(0, 80) + '...' : text;
  };

  // Helper function to format drag and drop questions
  const formatDragDropQuestion = (question) => {
    if (question.type !== 'DRAG_AND_DROP' && question.type !== 'drag-drop') {
      return stripHtmlTags(question.question) || "No question text";
    }

    // Parse questionText and replace [[pos_xxx]] with (1)____, (2)____, etc.
    let displayText = question.questionText || question.question;
    
    if (question.content && question.content.data) {
      // Filter correct options (those with positionId and correct: true)
      const correctOptions = question.content.data.filter(item => 
        item.positionId && item.correct === true
      );
      
      correctOptions.forEach((item, idx) => {
        const number = idx + 1; // 1, 2, 3, 4...
        const pattern = `[[pos_${item.positionId}]]`;
        
        // Replace pattern with (1)____ format
        displayText = displayText.replace(
          pattern,
          `(${number})____`
        );
      });
    }

    // Strip HTML tags and limit length for preview
    const tmp = document.createElement('DIV');
    tmp.innerHTML = displayText;
    const text = tmp.textContent || tmp.innerText || '';
    return text.length > 80 ? text.substring(0, 80) + '...' : text;
  };

  // Helper function to format reorder questions
  const formatReorderQuestion = (question) => {
    if (question.type !== 'REARRANGE' && question.type !== 'reorder') {
      return stripHtmlTags(question.question) || "No question text";
    }

    // Parse questionText and replace [[pos_xxx]] with (1)____, (2)____, etc.
    let displayText = question.questionText || question.question;
    
    if (question.content && question.content.data) {
      // Use data as is
      const sortedData = question.content.data;
      
      sortedData.forEach((item, idx) => {
        const number = idx + 1; // 1, 2, 3, 4...
        const pattern = `[[pos_${item.positionId}]]`;
        
        // Replace pattern with (1)____ format
        displayText = displayText.replace(
          pattern,
          `(${number})____`
        );
      });
    }

    // Strip HTML tags and limit length for preview
    const tmp = document.createElement('DIV');
    tmp.innerHTML = displayText;
    const text = tmp.textContent || tmp.innerText || '';
    return text.length > 80 ? text.substring(0, 80) + '...' : text;
  };

  // General helper function to format questions based on type
  const formatQuestionText = (question) => {
    // Get question text from various possible fields
    const questionText = question.question || question.questionText || '';
    
    switch (question.type) {
      case 'fill-blank':
      case 'FILL_IN_THE_BLANK':
        return formatFillBlankQuestion(question);
      case 'DROPDOWN':
      case 'dropdown':
        return formatDropdownQuestion(question);
      case 'DRAG_AND_DROP':
      case 'drag-drop':
        return formatDragDropQuestion(question);
      case 'REARRANGE':
      case 'reorder':
        return formatReorderQuestion(question);
      default:
        return stripHtmlTags(questionText) || "No question text";
    }
  };
  // Custom Header Component
  const customHeader = (
    <header className={`themed-header ${theme}-header`}>
      <nav className="themed-navbar">
        <div className="themed-navbar-content" style={{ justifyContent: 'space-between', width: '100%' }}>
          {/* Left: Back Button + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={handleBack}
              className={`class-menu-back-button ${theme}-class-menu-back-button`}
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
            >
              {t('common.back') || 'Back'}
                </Button>
            <div style={{
              fontSize: '18px',
              fontWeight: 600,
              color: theme === 'sun' ? '#1E40AF' : '#FFFFFF',
              textShadow: theme === 'sun' ? 'none' : '0 0 10px rgba(134, 134, 134, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ 
                fontSize: '24px',
                fontWeight: 300,
                opacity: 0.5
              }}>|</span>
              <span>
                {className && challengeName 
                  ? `${className} / ${challengeName}` 
                  : challengeName 
                  ? challengeName
                  : className
                  ? className
                  : 'Daily Challenge'
                }
              </span>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Save Challenge */}
                <Button 
                  icon={<SaveOutlined />} 
              className={`create-button ${theme}-create-button`}
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={isSaving}
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
              {isSaving 
                ? (isWritingChallenge ? 'Saving Writing Prompt...' : 'Saving Challenge...')
                : (isWritingChallenge ? (t('common.saveChanges') || 'Save Writing Prompt') : (t('common.saveChanges') || 'Save Challenge'))
              }
                </Button>
          </div>
        </div>
      </nav>
    </header>
  );

  return (
    <ThemedLayout customHeader={customHeader}>
      <div className={`daily-challenge-content-wrapper ${theme}-daily-challenge-content-wrapper`}>
        <div style={{ padding: '24px' }}>

        {/* Main Content */}
        <Row gutter={24} style={{ minHeight: "calc(100vh - 280px)" }}>
            {/* Passage Creation - Left Side (2/3) */}
            <Col span={isWritingChallenge ? 24 : 16} className="rc-passage-section">
              <Card 
                className={`rc-passage-card ${theme}-rc-passage-card`}
                style={{ 
                  height: "calc(100vh - 50px)",
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
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
                bodyStyle={{ 
                  padding: '20px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >


                 {/* Audio File Section - Only for Listening and Speaking Challenges (Inside Passage Card) */}
                 {(isListeningChallenge || isSpeakingChallenge) && !isWritingChallenge && (
                   <div style={{ marginBottom: '12px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginBottom: '8px',
                        position: 'relative'
                      }}>
                      <Title level={4} style={{ 
                        margin: 0,
                        color: theme === 'sun' ? '#1E40AF' : '#8377A0',
                        fontSize: '20px',
                        fontWeight: '600'
                      }}>
                        Audio File
                      </Title>
                       {passage.audioUrl && (
                         <Button
                           type="text"
                           danger
                           size="small"
                           style={{ 
                             fontSize: '12px', 
                             padding: '0 8px',
                             position: 'absolute',
                             right: 0,
                             top: '50%',
                             transform: 'translateY(-50%)'
                           }}
                           onClick={() => {
                             // Revoke preview URL if exists
                             if (passage.audioPreviewUrl) {
                               URL.revokeObjectURL(passage.audioPreviewUrl);
                             }
                             setPassage(prevPassage => ({ ...prevPassage, audioFile: null, audioUrl: null, audioPreviewUrl: null }));
                             setUploadedAudioFileName("");
                           }}
                         >
                           Remove
                         </Button>
                       )}
                      </div>
                     
                     {passage.audioUrl ? (
                       <div style={{
                         padding: '8px',
                         background: theme === 'sun' 
                           ? 'rgba(240, 249, 255, 0.5)' 
                           : 'rgba(244, 240, 255, 0.3)',
                         borderRadius: '6px',
                         border: theme === 'sun' 
                           ? '1px solid rgba(113, 179, 253, 0.3)' 
                           : '1px solid rgba(138, 122, 255, 0.3)',
                         marginBottom: '8px'
                       }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                           <span style={{ fontSize: '12px', fontWeight: 500, color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>
                             {uploadedAudioFileName || 'Audio file uploaded'}
                           </span>
                         </div>
                         <audio 
                           controls 
                           style={{ width: '100%', height: '32px' }}
                           volume={1.0}
                           onLoadedMetadata={(e) => {
                             // Set volume to maximum (1.0) when audio loads
                             e.target.volume = 1.0;
                           }}
                         >
                           <source src={passage.audioPreviewUrl || passage.audioUrl} type="audio/mpeg" />
                           Your browser does not support the audio element.
                         </audio>
                       </div>
                     ) : (
                       <Card 
                         hoverable 
                         className="rc-audio-upload-card"
                         style={{ 
                           opacity: isProcessingAudio ? 0.6 : 1,
                           borderRadius: '6px',
                           border: theme === 'sun' 
                             ? '1px dashed rgba(113, 179, 253, 0.3)' 
                             : '1px dashed rgba(138, 122, 255, 0.3)',
                           background: theme === 'sun'
                             ? 'linear-gradient(135deg, rgba(230, 245, 255, 0.3) 0%, rgba(186, 231, 255, 0.2) 100%)'
                             : 'rgba(255, 255, 255, 0.3)',
                           cursor: isProcessingAudio ? 'not-allowed' : 'pointer',
                           textAlign: 'center',
                           padding: '12px'
                         }}
                       >
                         <Upload
                           accept=".mp3,.mp4"
                           beforeUpload={handleUploadAudio}
                           showUploadList={false}
                           disabled={isProcessingAudio}
                         >
                           <Space direction="vertical" size="small">
                             {isProcessingAudio ? (
                               <LoadingOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                             ) : (
                               <span style={{ fontSize: 20 }}>🎵</span>
                             )}
                             <div>
                               <Text strong style={{ 
                                 color: theme === 'sun' ? '#1E40AF' : '#8377A0',
                                 fontSize: '13px'
                               }}>
                                 {isProcessingAudio ? `Processing "${uploadedAudioFileName}"...` : (isSpeakingChallenge ? "Upload Speaking Audio" : "Upload Audio File")}
                               </Text>
                               <br />
                               <Text style={{ 
                                 color: '#999',
                                 fontSize: '11px'
                               }}>
                                MP3 (max 10MB)
                               </Text>
                             </div>
                           </Space>
                         </Upload>
                       </Card>
                     )}
                   </div>
                 )}
                 {/* Title - Always show at top */}
                 <div style={{ marginBottom: '32px' }}>
                   <Title level={3} style={{ 
                     textAlign: "center", 
                     color: theme === 'sun' ? '#1E40AF' : '#8377A0'
                   }}>
                     {editingPassage 
                       ? (isWritingChallenge ? 'Edit writing topic' : 'Edit passage')
                       : (isWritingChallenge ? 'Add writing topic' : 'Add passage')
                     }
                   </Title>
                 </div>

                 {/* Passage Content */}
                 <div className="rc-passage-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                   {passage?.type === "manual" ? (
                     /* Text Editor - Full space when manual is selected */
                     <div className="rc-text-editor-full" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                       <div className="rc-text-editor-header" style={{ marginBottom: '12px', flexShrink: 0 }}>
                        <Button
                           type="text"
                           icon={<ArrowLeftOutlined />}
                           onClick={() => {
                             setPassage(prevPassage => ({ ...prevPassage, type: null }));
                           }}
                           className="rc-back-to-options-btn"
                           style={{
                             color: theme === 'sun' ? '#1E40AF' : '#8377A0',
                             fontWeight: 500
                           }}
                         >
                           {isWritingChallenge ? 'Back to topic options' : 'Back to options'}
                         </Button>
                       </div>
                       <div 
                         className={`rc-ckeditor-wrapper ${theme}-ckeditor-wrapper`}
                         style={{
                           flex: 1,
                           display: 'flex',
                           flexDirection: 'column',
                           position: 'relative',
                           zIndex: 1,
                           overflow: 'hidden',
                           minHeight: 0
                         }}
                       >
                         <div style={{
                           flex: 1,
                           borderRadius: '12px',
                           border: '2px solid rgba(24, 144, 255, 0.2)',
                           overflow: 'hidden',
                           background: 'rgba(240, 247, 255, 0.5)',
                           position: 'relative',
                           display: 'flex',
                           flexDirection: 'column',
                           color: '#000000',
                           maxHeight: '100%'
                         }}>
                           <div style={{ height: '100%', overflow: 'hidden' }}>
                             <CKEditor
                               key="passage-editor"
                               editor={ClassicEditor}
                               data={passageContent}
                               onChange={(event, editor) => {
                                 const data = editor.getData();
                                 handlePassageContentChange(data);
                               }}
                               config={{
                                 placeholder: isWritingChallenge ? 'Enter your writing topic here...' : 
                                             isSpeakingChallenge ? 'Enter your speaking topic here...' : 
                                             'Enter your passage content here...',
                                 extraPlugins: [CustomUploadAdapterPlugin],
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
                                     'blockQuote',
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
                                 table: {
                                   contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
                                 },
                                 image: {
                                   toolbar: [
                                     'imageTextAlternative',
                                     '|',
                                     'imageStyle:alignLeft',
                                     'imageStyle:full',
                                     'imageStyle:alignRight'
                                   ],
                                   styles: [
                                     'full',
                                     'alignLeft',
                                     'alignRight'
                                   ]
                                 },
                                 language: 'en',
                               }}
                             />
                           </div>
                         </div>
                       </div>
                     </div>
                   ) : (
                     /* Initial Options - Show when no type selected */
                     <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                       <Space direction="vertical" size="large" style={{ width: "100%" }}>
                         {/* Manual Text & Media */}
                        <Card
                          hoverable
                          className="rc-passage-option-card"
                          onClick={() => {
                            setPassage(prevPassage => ({ ...prevPassage, type: "manual" }));
                          }}
                          style={{
                            borderRadius: '12px',
                            border: theme === 'sun'
                              ? '2px solid rgba(113, 179, 253, 0.3)'
                              : '2px solid rgba(138, 122, 255, 0.3)',
                            background: theme === 'sun'
                              ? 'linear-gradient(135deg, rgba(230, 245, 255, 0.5) 0%, rgba(186, 231, 255, 0.4) 100%)'
                              : 'rgba(255, 255, 255, 0.5)',
                            cursor: 'pointer'
                          }}
                        >
                          <Space>
                            <FileTextOutlined style={{ 
                              fontSize: 24, 
                              color: "#000000" 
                            }} />
                            <Text strong style={{ 
                              color: theme === 'sun' ? '#1E40AF' : '#8377A0' 
                            }}>
                              {isWritingChallenge ? 'Add writing topic manually' : 
                               isSpeakingChallenge ? 'Add speaking topic manually' : 
                               'Add text & media manually'}
                            </Text>
                          </Space>
                        </Card>

                        {/* PDF Upload */}
                        <Card 
                          hoverable 
                          className="rc-passage-option-card"
                          style={{ 
                            opacity: isProcessingPDF ? 0.6 : 1,
                            borderRadius: '12px',
                            border: theme === 'sun' 
                              ? '2px solid rgba(82, 196, 26, 0.3)' 
                              : '2px solid rgba(138, 122, 255, 0.3)',
                            background: theme === 'sun'
                              ? 'linear-gradient(135deg, rgba(237, 250, 230, 0.5) 0%, rgba(207, 244, 192, 0.4) 100%)'
                              : 'rgba(255, 255, 255, 0.5)',
                            cursor: isProcessingPDF ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <Upload
                            accept=".pdf"
                            beforeUpload={handleUploadPDF}
                            showUploadList={false}
                            disabled={isProcessingPDF}
                          >
                            <Space>
                              {isProcessingPDF ? (
                                <LoadingOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                              ) : (
                                <UploadOutlined style={{ fontSize: 24, color: "#000000" }} />
                              )}
                              <Text strong style={{ 
                                color: theme === 'sun' ? '#1E40AF' : '#8377A0' 
                              }}>
                                {isProcessingPDF ? `Đang xử lý "${uploadedFileName}"...` : 
                                 (isWritingChallenge ? "Upload PDF writing topic" : 
                                  isSpeakingChallenge ? "Upload PDF speaking topic" : 
                                  "Upload PDF")}
                              </Text>
                            </Space>
                          </Upload>
                        </Card>

                        {/* Create by AI */}
                        <Card
                          hoverable
                          className="rc-passage-option-card"
                          onClick={() => {
                            const userRole = user?.role?.toLowerCase();
                            const path = (isListeningChallenge ? (
                              userRole === 'teaching_assistant'
                                ? `/teaching-assistant/daily-challenges/create/ai-listening/${currentChallengeId}`
                                : `/teacher/daily-challenges/create/ai-listening/${currentChallengeId}`
                            ) : (
                              userRole === 'teaching_assistant'
                                ? `/teaching-assistant/daily-challenges/create/ai-reading/${currentChallengeId}`
                                : `/teacher/daily-challenges/create/ai-reading/${currentChallengeId}`
                            ));
                            navigate(path, {
                              state: {
                                challengeId: currentChallengeId,
                                challengeName,
                                classId,
                                className,
                                challengeType: isListeningChallenge ? 'LISTENING' : 'READING'
                              }
                            });
                          }}
                          style={{
                            borderRadius: '12px',
                            border: theme === 'sun'
                              ? '2px solid rgba(250, 173, 20, 0.3)'
                              : '2px solid rgba(138, 122, 255, 0.3)',
                            background: theme === 'sun'
                              ? 'linear-gradient(135deg, rgba(255, 251, 230, 0.5) 0%, rgba(255, 236, 179, 0.4) 100%)'
                              : 'rgba(255, 255, 255, 0.5)',
                            cursor: 'pointer'
                          }}
                        >
                          <Space>
                            <img 
                              src="/img/ai-icon.png" 
                              alt="AI" 
                              style={{ 
                                width: 24, 
                                height: 24,
                                filter: theme === 'sun' ? 'none' : 'brightness(0.8)'
                              }} 
                            />
                             <Text strong style={{ 
                               color: theme === 'sun' ? '#1E40AF' : '#8377A0' 
                             }}>
                               {isWritingChallenge ? 'Generate writing topic with AI' : 
                                isSpeakingChallenge ? 'Generate speaking topic with AI' : 
                                'Generate with AI'}
                             </Text>
                          </Space>
                         </Card>
                       </Space>
                     </div>
                   )}
                 </div>
              </Card>
            </Col>

            {/* Questions Section - Right Side (1/3) - Hidden for Writing and Speaking Challenges */}
            {!isWritingChallenge && !isSpeakingChallenge && (
            <Col span={8} className="rc-questions-section">
              <Card 
                className={`rc-questions-card ${theme}-rc-questions-card`}
                style={{
                  height: '100%',
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
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Questions Header */}
                <div className="rc-questions-header" style={{ marginBottom: '20px' }}>
                  <Title level={4} style={{ 
                    margin: 0, 
                    color: theme === 'sun' ? '#1E40AF' : '#8377A0',
                    textAlign: 'center'
                  }}>
                    Questions ({visibleQuestions.length})
                      </Title>
                    </div>

                {/* Add Question Button */}
                <div className="rc-add-question-section" style={{ marginBottom: '20px' }}>
                  <Button
                    icon={<PlusOutlined />}
                    className={`create-button ${theme}-create-button`}
                    onClick={handleAddQuestion}
                    style={{
                      height: '40px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      fontSize: '16px',
                      padding: '0 24px',
                      border: 'none',
                      transition: 'all 0.3s ease',
                      background: theme === 'sun' 
                        ? 'linear-gradient(135deg, rgba(102, 174, 255, 0.6), rgba(60, 153, 255, 0.6))'
                        : 'linear-gradient(135deg, rgba(181, 176, 192, 0.7), rgba(163, 158, 187, 0.7), rgba(131, 119, 160, 0.7), rgba(172, 165, 192, 0.7), rgba(109, 95, 143, 0.7))',
                      color: theme === 'sun' ? '#000000' : '#000000',
                      boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.2)' : '0 2px 8px rgba(131, 119, 160, 0.3)',
                      opacity: 0.9
                    }}
                  >
                    Add a Question
                  </Button>
                </div>

                <Divider style={{ margin: '0 0 20px 0' }} />
                
                {/* Questions List */}
                <div className="rc-questions-list" style={{ 
                  maxHeight: '500px', 
                  overflowY: 'auto',
                  overflowX: 'hidden'
                }}>
                      {visibleQuestions.length === 0 ? (
                    <div className="rc-empty-questions" style={{ 
                      padding: '40px 20px',
                      textAlign: 'center'
                    }}>
                      <div className="rc-empty-text" style={{ 
                        fontSize: '16px',
                        fontWeight: 500,
                        color: theme === 'sun' ? '#1E40AF' : '#8377A0',
                        marginBottom: '8px'
                      }}>No questions added yet</div>
                      <div className="rc-empty-subtext" style={{ 
                        fontSize: '14px',
                        color: '#999'
                      }}>Click "Add a Question" above to get started</div>
                        </div>
                      ) : (
                        visibleQuestions.map((question, index) => {
                          console.log(`Question ${index + 1}:`, question);
                          return (
                      <div 
                        key={question.id || index} 
                        className={`rc-question-item ${theme}-rc-question-item`}
                        style={{
                          padding: '16px',
                          marginBottom: '12px',
                          borderRadius: '12px',
                          border: theme === 'sun' 
                            ? '2px solid rgba(113, 179, 253, 0.2)' 
                            : '2px solid rgba(138, 122, 255, 0.2)',
                          background: theme === 'sun'
                            ? 'linear-gradient(135deg, rgba(230, 245, 255, 0.3) 0%, rgba(186, 231, 255, 0.2) 100%)'
                            : 'rgba(255, 255, 255, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.3s ease'
                        }}
                      >
                            <div className="rc-question-handle">
                          <HolderOutlined style={{ 
                            color: theme === 'sun' ? '#66AEFF' : '#8377A0',
                            cursor: "grab",
                            fontSize: '16px'
                          }} />
                            </div>
                            <div onClick={() => handleEditQuestion(question)} style={{ flex: 1, cursor: "pointer" }}>
                          <div className="rc-question-type" style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: theme === 'sun' ? '#1890ff' : '#8377A0',
                            marginBottom: '4px'
                          }}>
                                Q{index + 1}: {getQuestionTypeLabel(question.type)}
                              </div>
                          <div className="rc-question-text" style={{
                            fontSize: '14px',
                            color: theme === 'sun' ? '#1E40AF' : '#333'
                          }}>
                                 {formatQuestionText(question)}
                              </div>
                            </div>
                        <div className="rc-question-actions" style={{ display: 'flex', gap: '4px' }}>
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEditQuestion(question)}
                            size="small"
                            style={{ 
                              color: theme === 'sun' ? '#1890ff' : '#8377A0'
                            }}
                          />
                          <Button
                            type="text"
                            icon={<CopyOutlined />}
                            onClick={() => {
                              const { id, ...rest } = question;
                              const newQuestion = {
                                ...rest,
                                question: `${question.question} (Copy)`,
                                isFromBackend: false
                              };
                              setPassage(prevPassage => ({
                                ...prevPassage,
                                questions: [...prevPassage.questions, newQuestion]
                              }));
                              spaceToast.success("Question duplicated!");
                            }}
                            size="small"
                            style={{
                              color: theme === 'sun' ? '#1890ff' : '#8377A0'
                            }}
                          />
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteQuestion(question.id)}
                            size="small"
                                style={{ color: "#ff6b6b" }}
                              />
                            </div>
                          </div>
                        );
                        })
                      )}
                    </div>
                  </Card>
            </Col>
            )}

            {/* Speaking Recording Settings - Right Side (1/3) - Only for Speaking Challenges */}
            {isSpeakingChallenge && (
            <Col span={8} className="rc-questions-section">
              <Card 
                className={`rc-questions-card ${theme}-rc-questions-card`}
                style={{
                  height: '100%',
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
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Settings Header */}
                <div style={{ marginBottom: '20px', marginTop: '16px', textAlign: 'center' }}>
                  <Space direction="vertical" size="small" align="center">
                    <ClockCircleOutlined style={{ 
                      fontSize: '48px', 
                      color: theme === 'sun' ? '#1890ff' : '#8377A0',
                      marginTop: '8px'
                    }} />
                    <Title level={4} style={{ 
                      margin: 0, 
                      color: theme === 'sun' ? '#1E40AF' : '#8377A0'
                    }}>
                      Recording Time 
                    </Title>
                  </Space>
                </div>

                <Divider />

                {/* Recording Time Display - Fixed at 3 minutes */}
                <div style={{ padding: '20px' }}>
                
                
                  {/* Current Selection Display */}
                  <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: theme === 'sun' 
                      ? 'rgba(24, 144, 255, 0.1)' 
                      : 'rgba(139, 92, 246, 0.15)',
                    border: theme === 'sun' 
                      ? '2px solid rgba(24, 144, 255, 0.3)' 
                      : '2px solid rgba(139, 92, 246, 0.4)',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <Text style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '8px' }}>
                      Recording time:
                    </Text>
                    <Text strong style={{ 
                      fontSize: '24px', 
                      color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                      fontWeight: 700
                    }}>
                      3 minutes
                    </Text>
                  </div>

                  {/* Info Section */}
                  <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: theme === 'sun' 
                      ? 'rgba(250, 173, 20, 0.1)' 
                      : 'rgba(250, 173, 20, 0.15)',
                    border: '2px solid rgba(250, 173, 20, 0.3)',
                    borderRadius: '12px'
                  }}>
                    <Space direction="vertical" size="small">
                      <Text strong style={{ fontSize: '14px', color: '#faad14', display: 'block' }}>
                        💡 Information
                      </Text>
                      <Text style={{ fontSize: '13px', color: '#666', display: 'block' }}>
                        Students will have 3 minutes to record their speaking response. The timer will start automatically when they begin recording.
                      </Text>
                    </Space>
                  </div>
                </div>
              </Card>
            </Col>
            )}
          </Row>
        </div>
        </div>

        {/* Question Type Selection Modal */}
        <Modal
          title={
            <div style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'rgb(24, 144, 255)',
              display: 'block',
              textAlign: 'center',
              marginBottom: '4px'
            }}>
              Choose a question type
            </div>
          }
          open={questionTypeModalVisible}
          onCancel={handleQuestionTypeModalCancel}
          footer={null}
          width={720}
          className={`gvc-question-type-modal ${theme}-question-type-modal`}
        >
          <div className="question-type-modal-container">
            {/* Question Types */}
            <div className="question-type-category">
              <div className="category-grid">
                {[
                  { id: 1, name: "Multiple choice", type: "multiple-choice" },
                  { id: 2, name: "Multiple select", type: "multiple-select" },
                  { id: 3, name: "True or false", type: "true-false" },
                  { id: 4, name: "Fill in the blank", type: "fill-blank" },
                  { id: 5, name: "Dropdown", type: "dropdown" },
                  { id: 6, name: "Drag and drop", type: "drag-drop" },
                  { id: 7, name: "Reorder", type: "reorder" },
                ].map((questionType) => (
                  <div
                    key={questionType.id}
                    className={`question-type-card ${theme}-question-type-card`}
                    onClick={() => handleQuestionTypeClick(questionType)}
                  >
                    <div className="question-type-icon-wrapper">
                      {questionType.type === "multiple-choice" && "📝"}
                      {questionType.type === "multiple-select" && "☑️"}
                      {questionType.type === "true-false" && "✅"}
                      {questionType.type === "fill-blank" && "✏️"}
                      {questionType.type === "dropdown" && "📋"}
                      {questionType.type === "drag-drop" && "🔄"}
                      {questionType.type === "reorder" && "🔀"}
                    </div>
                    <div className="question-type-name">{questionType.name}</div>
                    <div className="question-type-description">
                      {questionType.type === "multiple-choice" && "Choose one correct answer"}
                      {questionType.type === "multiple-select" && "Choose multiple correct answers"}
                      {questionType.type === "true-false" && "True or False question"}
                      {questionType.type === "fill-blank" && "Fill in the blank spaces"}
                      {questionType.type === "dropdown" && "Select the correct option from dropdown"}
                      {questionType.type === "drag-drop" && "Drag and drop items to arrange"}
                      {questionType.type === "reorder" && "Reorder words or items"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          {/* Removed AI Generate section per requirement */}
          </div>
        </Modal>

        {/* Question Modals */}
        <MultipleChoiceModal
          visible={activeModal === 'multiple-choice'}
          onCancel={handleCancelModal}
          onSave={handleSaveQuestion}
          questionData={editingQuestion}
        />

        <MultipleSelectModal
          visible={activeModal === 'multiple-select'}
          onCancel={handleCancelModal}
          onSave={handleSaveQuestion}
          questionData={editingQuestion}
        />

        <TrueFalseModal
          visible={activeModal === 'true-false'}
          onCancel={handleCancelModal}
          onSave={handleSaveQuestion}
          questionData={editingQuestion}
        />

        <FillBlankModal
          visible={activeModal === 'fill-blank'}
          onCancel={handleCancelModal}
          onSave={handleSaveQuestion}
          questionData={editingQuestion}
        />

        <DropdownModal
          visible={activeModal === 'dropdown'}
          onCancel={handleCancelModal}
          onSave={handleSaveQuestion}
          questionData={editingQuestion}
        />

        <DragDropModal
          visible={activeModal === 'drag-drop'}
          onCancel={handleCancelModal}
          onSave={handleSaveQuestion}
          questionData={editingQuestion}
        />

        <ReorderModal
          visible={activeModal === 'reorder'}
          onCancel={handleCancelModal}
          onSave={handleSaveQuestion}
          questionData={editingQuestion}
        />
    </ThemedLayout>
  );
};

export default CreateReadingChallenge;
