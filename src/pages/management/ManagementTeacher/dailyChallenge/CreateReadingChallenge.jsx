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
import { useNavigate, useLocation } from "react-router-dom";
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
  
  // Get challenge info from navigation state
  const challengeInfo = location.state || {};
  const { challengeId, challengeName, classId, className } = challengeInfo;
  
  const [passages, setPassages] = useState([
    { id: 1, title: "Passage 1", content: "", type: null, questions: [] }
  ]);
  const [activePassage, setActivePassage] = useState(1);
  const [passageContent, setPassageContent] = useState("");
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  
  // Question management state
  const [activeModal, setActiveModal] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  
  // Use ref to track if we're updating from passage change to prevent infinite loop
  const isUpdatingFromPassage = useRef(false);
  const prevActivePassage = useRef(activePassage);
  const debounceTimer = useRef(null);
  
  // Get current passage
  const currentPassage = passages.find(p => p.id === activePassage);
  const questions = currentPassage?.questions || [];

  // Update passageContent ONLY when switching between passages
  React.useEffect(() => {
    // Only sync when actually switching passages, not when passages array updates
    if (prevActivePassage.current !== activePassage) {
      // Clear any pending debounce timer to prevent old content from being applied
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }

      const passage = passages.find(p => p.id === activePassage);
      if (passage) {
        isUpdatingFromPassage.current = true;
        setPassageContent(passage.content || "");
        // Reset flag after a tick
        setTimeout(() => {
          isUpdatingFromPassage.current = false;
        }, 0);
      }
      prevActivePassage.current = activePassage;
    }
  }, [activePassage, passages]);

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
    
    navigate(`${basePath}/${challengeId}/content`, {
      state: {
        challengeId,
        challengeName,
        classId,
        className
      }
    });
  };

  const handleSave = () => {
    spaceToast.success("Reading challenge saved successfully!");
  };

  const handleAddPassage = () => {
    const newPassageId = Math.max(...passages.map(p => p.id)) + 1;
    const newPassage = {
      id: newPassageId,
      title: `Passage ${newPassageId}`,
      content: "",
      type: null,
      questions: []
    };
    setPassages([...passages, newPassage]);
    setActivePassage(newPassageId);
    setPassageContent(""); // Reset content khi chuyển passage
  };

  const handleDiscardPassage = () => {
    if (passages.length <= 1) {
      spaceToast.warning("Không thể xóa passage cuối cùng!");
      return;
    }

    // Xóa passage hiện tại
    const updatedPassages = passages.filter(p => p.id !== activePassage);
    setPassages(updatedPassages);
    
    // Chuyển sang passage đầu tiên còn lại
    setActivePassage(updatedPassages[0].id);
    
    // Reset passage content nếu đang hiển thị passage bị xóa
    if (currentPassage?.id === activePassage) {
      setPassageContent(updatedPassages[0].content || "");
    }
    
    spaceToast.success("Đã xóa passage thành công!");
  };

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
          // Also update passages state
          setPassages(prevPassages => prevPassages.map(p => 
            p.id === activePassage ? { ...p, content } : p
          ));
          return content;
        }
        return prevContent;
      });
    }, 150);
  }, [activePassage]);

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
      setPassages(passages.map(p => 
        p.id === activePassage ? { ...p, type: "manual", content: extractedText } : p
      ));

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
  const handleAddQuestion = (questionType) => {
    setActiveModal(questionType);
    setEditingQuestion(null);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setActiveModal(question.type);
  };

  const handleDeleteQuestion = (questionId) => {
    setPassages(passages.map(p => 
      p.id === activePassage 
        ? { ...p, questions: p.questions.filter(q => q.id !== questionId) }
        : p
    ));
    spaceToast.success("Question deleted successfully!");
  };

  const handleSaveQuestion = (questionData) => {
    setPassages(passages.map(p => {
      if (p.id === activePassage) {
        if (editingQuestion) {
          // Update existing question
          return {
            ...p,
            questions: p.questions.map(q => 
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
            ...p,
            questions: [...p.questions, newQuestion]
          };
        }
      }
      return p;
    }));
    
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
                {/* Passage Tabs with Discard Button */}
                <div className="rc-passage-tabs" style={{ marginBottom: '16px' }}>
                  <div className="rc-passage-tabs-left">
                    {passages.map((passage) => (
                      <Button
                        key={passage.id}
                        type={activePassage === passage.id ? "primary" : "text"}
                        onClick={() => setActivePassage(passage.id)}
                        className="rc-passage-tab"
                        style={activePassage === passage.id ? {
                          background: theme === 'sun' 
                            ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                            : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                          color: '#000000',
                          borderRadius: '8px',
                          fontWeight: 500
                        } : {
                          color: theme === 'sun' ? '#1E40AF' : '#8377A0'
                        }}
                      >
                        {passage.title}
                      </Button>
                    ))}
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={handleAddPassage}
                      className="rc-add-passage-btn"
                      style={{
                        borderColor: theme === 'sun' ? '#66AEFF' : '#8377A0',
                        color: theme === 'sun' ? '#1E40AF' : '#8377A0',
                        borderRadius: '8px'
                      }}
                    >
                      Add passage set
                    </Button>
                  </div>
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    className="rc-discard-btn"
                    onClick={handleDiscardPassage}
                    disabled={passages.length <= 1}
                    style={{
                      borderRadius: '8px'
                    }}
                  >
                    Discard passage
                  </Button>
                </div>

                <Divider />

                 {/* Passage Content */}
                 <div className="rc-passage-content">
                   {currentPassage?.type === "manual" ? (
                     /* Text Editor - Full space when manual is selected */
                     <div className="rc-text-editor-full">
                       <div className="rc-text-editor-header" style={{ marginBottom: '12px' }}>
                         <Button 
                           type="text" 
                           icon={<ArrowLeftOutlined />}
                           onClick={() => {
                             setPassages(passages.map(p => 
                               p.id === activePassage ? { ...p, type: null } : p
                             ));
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
                            setPassages(passages.map(p => 
                              p.id === activePassage ? { ...p, type: "manual" } : p
                            ));
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
                            // setPassages(passages.map(p => 
                            //   p.id === activePassage ? { ...p, type: "ai" } : p
                            // ));
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
                      <Dropdown
                        overlay={
                      <Menu 
                        className="rc-question-type-menu"
                        style={{
                          background: '#ffffff',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                      >
                        <Menu.Item 
                          key="multiple-choice" 
                          onClick={() => handleAddQuestion('multiple-choice')}
                          style={{ color: '#000000' }}
                        >
                          <span style={{ color: '#000000' }}>Multiple Choice</span>
                            </Menu.Item>
                        <Menu.Item 
                          key="multiple-select" 
                          onClick={() => handleAddQuestion('multiple-select')}
                          style={{ color: '#000000' }}
                        >
                          <span style={{ color: '#000000' }}>Multiple Select</span>
                            </Menu.Item>
                        <Menu.Item 
                          key="true-false" 
                          onClick={() => handleAddQuestion('true-false')}
                          style={{ color: '#000000' }}
                        >
                          <span style={{ color: '#000000' }}>True or False</span>
                            </Menu.Item>
                        <Menu.Item 
                          key="fill-blank" 
                          onClick={() => handleAddQuestion('fill-blank')}
                          style={{ color: '#000000' }}
                        >
                          <span style={{ color: '#000000' }}>Fill in the Blank</span>
                            </Menu.Item>
                        <Menu.Item 
                          key="dropdown" 
                          onClick={() => handleAddQuestion('dropdown')}
                          style={{ color: '#000000' }}
                        >
                          <span style={{ color: '#000000' }}>Dropdown</span>
                            </Menu.Item>
                        <Menu.Item 
                          key="drag-drop" 
                          onClick={() => handleAddQuestion('drag-drop')}
                          style={{ color: '#000000' }}
                        >
                          <span style={{ color: '#000000' }}>Drag and Drop</span>
                            </Menu.Item>
                        <Menu.Item 
                          key="reorder" 
                          onClick={() => handleAddQuestion('reorder')}
                          style={{ color: '#000000' }}
                        >
                          <span style={{ color: '#000000' }}>Reorder</span>
                            </Menu.Item>
                          </Menu>
                        }
                        trigger={['click']}
                      >
                    <Button 
                      className="rc-add-question-btn"
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
                          <DownOutlined />
                        </Button>
                      </Dropdown>
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
                                {stripHtmlTags(question.question) || "No question text"}
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
                              setPassages(passages.map(p => 
                                p.id === activePassage 
                                  ? { ...p, questions: [...p.questions, newQuestion] }
                                  : p
                              ));
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
