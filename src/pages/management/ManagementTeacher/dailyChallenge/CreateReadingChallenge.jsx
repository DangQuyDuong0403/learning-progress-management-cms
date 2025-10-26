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
  Dropdown,
  Menu,
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
  DownOutlined,
  HolderOutlined,
  EditOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import { extractTextFromPDF, isValidPDF } from "../../../../utils/pdfUtils";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useSelector } from "react-redux";
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
  const { challengeId, challengeName, classId, className } = challengeInfo;
  
  // Use challenge ID from URL params if available, otherwise from state
  const currentChallengeId = id || challengeId;
  
  const [passage, setPassage] = useState({
    id: 1,
    title: "Passage",
    content: "",
    type: null,
    questions: []
  });
  const [passageContent, setPassageContent] = useState("");
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  
  // Question management state
  const [activeModal, setActiveModal] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionTypeModalVisible, setQuestionTypeModalVisible] = useState(false);
  
  // Use ref to track if we're updating from passage change to prevent infinite loop
  const isUpdatingFromPassage = useRef(false);
  const debounceTimer = useRef(null);

  // Get current passage
  const questions = passage?.questions || [];

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
    };
  }, []);

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

  const handleSave = () => {
    // Create fake data structure for passage with questions
    const fakePassageData = {
      id: `passage_${Date.now()}`,
      type: 'PASSAGE',
      content: passage.content || "This is a sample passage content for reading comprehension. Students will read this passage and answer the questions that follow.",
      questions: passage.questions || [
        {
          id: `question_${Date.now()}_1`,
          type: 'MULTIPLE_CHOICE',
          question: "What is the main topic of this passage?",
          options: [
            { key: 'A', text: 'Science and Technology', isCorrect: false },
            { key: 'B', text: 'Education and Learning', isCorrect: true },
            { key: 'C', text: 'History and Culture', isCorrect: false },
            { key: 'D', text: 'Sports and Recreation', isCorrect: false }
          ],
          points: 1,
          timeLimit: 30
        },
        {
          id: `question_${Date.now()}_2`,
          type: 'FILL_IN_THE_BLANK',
          questionText: "The passage discusses the importance of ___ in modern education.",
          content: {
            data: [
              {
                id: 'blank_1',
                value: 'technology',
                positionId: 'pos_1',
                correct: true
              }
            ]
          },
          points: 1,
          timeLimit: 60
        }
      ],
      timeLimit: 120, // 2 minutes for the passage
      points: 2
    };

    // Store the passage data in localStorage for now (fake API)
    const existingPassages = JSON.parse(localStorage.getItem('readingPassages') || '[]');
    existingPassages.push(fakePassageData);
    localStorage.setItem('readingPassages', JSON.stringify(existingPassages));

    spaceToast.success("Reading challenge saved successfully!");
    
    // Navigate back to DailyChallengeContent
    handleBack();
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
    setEditingQuestion(question);
    setActiveModal(question.type);
  };

  const handleDeleteQuestion = (questionId) => {
    setPassage(prevPassage => ({
      ...prevPassage,
      questions: prevPassage.questions.filter(q => q.id !== questionId)
    }));
    spaceToast.success("Question deleted successfully!");
  };

  const handleSaveQuestion = (questionData) => {
    setPassage(prevPassage => {
      if (editingQuestion) {
        // Update existing question
        return {
          ...prevPassage,
          questions: prevPassage.questions.map(q =>
            q.id === editingQuestion.id ? { ...questionData, id: editingQuestion.id } : q
          )
        };
      } else {
        // Add new question
        const newQuestion = {
          ...questionData,
          id: Date.now(),
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
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    // Limit to 80 characters for preview
    return text.length > 80 ? text.substring(0, 80) + '...' : text;
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
      // Sort by positionOrder to get correct order
      const sortedData = question.content.data.sort((a, b) => (a.positionOrder || 0) - (b.positionOrder || 0));
      
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
        return stripHtmlTags(question.question) || "No question text";
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
                  : 'Create Reading Challenge'
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
              {t('common.saveChanges') || 'Save Challenge'}
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
            <Col span={16} className="rc-passage-section">
              <Card 
                className={`rc-passage-card ${theme}-rc-passage-card`}
                style={{ 
                  height: "100%",
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
                  backdropFilter: 'blur(10px)'
                }}
              >
                {/* Passage Title */}
                <div className="rc-passage-tabs" style={{ marginBottom: '16px' }}>
                  <div className="rc-passage-tabs-left">
                    <Button
                      type="primary"
                      className="rc-passage-tab"
                      style={{
                        background: theme === 'sun'
                          ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                          : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                        color: '#000000',
                        borderRadius: '8px',
                        fontWeight: 500
                      }}
                    >
                      {passage.title}
                    </Button>
                  </div>
                </div>

                <Divider />

                 {/* Passage Content */}
                 <div className="rc-passage-content">
                   {passage?.type === "manual" ? (
                     /* Text Editor - Full space when manual is selected */
                     <div className="rc-text-editor-full">
                       <div className="rc-text-editor-header" style={{ marginBottom: '12px' }}>
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
                           Back to options
                         </Button>
                       </div>
                       <div 
                         className={`rc-ckeditor-wrapper ${theme}-ckeditor-wrapper`}
                         style={{
                           borderRadius: '8px',
                           border: theme === 'sun' ? '2px solid rgba(113, 179, 253, 0.3)' : '2px solid rgba(138, 122, 255, 0.3)',
                           overflow: 'hidden',
                           boxShadow: theme === 'sun' 
                             ? '0 2px 8px rgba(113, 179, 253, 0.1)' 
                             : '0 2px 8px rgba(138, 122, 255, 0.15)',
                         }}
                       >
                        <CKEditor
                          editor={ClassicEditor}
                          data={passageContent}
                          onChange={(event, editor) => {
                            const data = editor.getData();
                            handlePassageContentChange(data);
                          }}
                          config={{
                            placeholder: 'Enter your passage content here...',
                            extraPlugins: [CustomUploadAdapterPlugin],
                            toolbar: {
                              items: [
                                'heading', '|',
                                'bold', 'italic', 'underline', 'strikethrough', '|',
                                'insertTable', 'imageUpload', '|',
                                'bulletedList', 'numberedList', '|',
                                'outdent', 'indent', '|',
                                'link', 'blockQuote', '|',
                                'undo', 'redo'
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
                   ) : (
                     /* Initial Options - Show when no type selected */
                     <>
                       <Title level={3} style={{ 
                         textAlign: "center", 
                         marginBottom: 32,
                         color: theme === 'sun' ? '#1E40AF' : '#8377A0'
                       }}>
                         Add passage
                       </Title>
                       
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
                            }}>Add text & media manually</Text>
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
                                {isProcessingPDF ? `Đang xử lý "${uploadedFileName}"...` : "Upload PDF"}
                              </Text>
                            </Space>
                          </Upload>
                        </Card>

                        {/* Create by AI */}
                        <Card
                          hoverable
                          className="rc-passage-option-card"
                          onClick={() => {
                            spaceToast.info("AI generation feature is under development");
                            // TODO: Implement AI generation feature
                            // setPassage(prevPassage => ({ ...prevPassage, type: "ai" }));
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
                            }}>Generate with AI</Text>
                          </Space>
                        </Card>
                      </Space>
                     </>
                   )}
                 </div>
              </Card>
            </Col>

            {/* Questions Section - Right Side (1/3) */}
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
                    Questions ({questions.length})
                      </Title>
                    </div>

                {/* Add Question Button */}
                <div className="rc-add-question-section" style={{ marginBottom: '20px' }}>
                  <Button
                    className="rc-add-question-btn"
                    onClick={handleAddQuestion}
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      fontSize: '14px',
                      background: theme === 'sun'
                        ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                        : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                      color: '#000000',
                      border: 'none',
                      boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)'
                    }}
                  >
                    <PlusOutlined />
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
                      {questions.length === 0 ? (
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
                        questions.map((question, index) => (
                      <div 
                        key={question.id} 
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
                              const newQuestion = {
                                ...question,
                                id: Date.now(),
                                question: `${question.question} (Copy)`
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
                        ))
                      )}
                    </div>
                  </Card>
            </Col>
          </Row>
        </div>
        </div>

        {/* Question Type Selection Modal */}
        <Modal
          title={
            <div style={{
              fontSize: '22px',
              fontWeight: 700,
              color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
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

            {/* AI Generate - Featured */}
            <div className="question-type-category">
              <h3 className="category-title">AI Features</h3>
              <div className="category-grid">
                <div
                  className={`question-type-card ${theme}-question-type-card question-type-card-featured`}
                  onClick={() => {
                    spaceToast.info("AI generation feature is under development");
                    setQuestionTypeModalVisible(false);
                  }}
                >
                  <div className="question-type-icon-wrapper featured-icon">
                    <img 
                      src="/img/ai-icon.png" 
                      alt="AI" 
                      style={{ width: '44px', height: '44px', filter: theme === 'sun' ? 'none' : 'brightness(0.9)' }} 
                    />
                  </div>
                  <div className="question-type-name">AI Generate Questions</div>
                  <div className="question-type-description">
                    Generate questions automatically with AI assistance
                  </div>
                  <div className="featured-badge">✨ AI Powered</div>
                </div>
              </div>
            </div>
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
