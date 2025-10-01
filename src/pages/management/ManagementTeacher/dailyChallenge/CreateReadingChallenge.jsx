import React, { useState } from "react";
import {
  Button,
  Card,
  Row,
  Col,
  Space,
  Typography,
  Input,
  Upload,
  Select,
  message,
  Divider,
  Dropdown,
  Menu,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EyeOutlined,
  PlusOutlined,
  FileTextOutlined,
  UploadOutlined,
  DeleteOutlined,
  LoadingOutlined,
  DownOutlined,
  HolderOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Layout from "../../../../component/Layout";
import { extractTextFromPDF, isValidPDF } from "../../../../utils/pdfUtils";
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

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;


// Mock data cho chapters và lessons
const mockChapters = [
  {
    id: 1,
    name: "Chapter 1: Basic Grammar",
    lessons: [
      { id: 1, name: "Lesson 1.1: Present Simple Tense" },
      { id: 2, name: "Lesson 1.2: Present Continuous Tense" },
      { id: 3, name: "Lesson 1.3: Past Simple Tense" },
    ],
  },
  {
    id: 2,
    name: "Chapter 2: Advanced Grammar",
    lessons: [
      { id: 4, name: "Lesson 2.1: Present Perfect Tense" },
      { id: 5, name: "Lesson 2.2: Past Perfect Tense" },
      { id: 6, name: "Lesson 2.3: Future Tense" },
    ],
  },
  {
    id: 3,
    name: "Chapter 3: Reading Comprehension",
    lessons: [
      { id: 7, name: "Lesson 3.1: Short Stories" },
      { id: 8, name: "Lesson 3.2: News Articles" },
      { id: 9, name: "Lesson 3.3: Academic Texts" },
    ],
  },
];


const CreateReadingChallenge = () => {
  const navigate = useNavigate();
  
  const [challengeName, setChallengeName] = useState("");
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [availableLessons, setAvailableLessons] = useState([]);
  const [passages, setPassages] = useState([
    { id: 1, title: "Passage 1", content: "", type: null }
  ]);
  const [activePassage, setActivePassage] = useState(1);
  const [passageContent, setPassageContent] = useState("");
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  
  // Question management state
  const [questions, setQuestions] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // useEffect để cập nhật lessons khi chapter thay đổi
  React.useEffect(() => {
    if (selectedChapter) {
      const chapter = mockChapters.find(ch => ch.id === selectedChapter);
      if (chapter) {
        setAvailableLessons(chapter.lessons);
        setSelectedLesson(null);
      }
    } else {
      setAvailableLessons([]);
      setSelectedLesson(null);
    }
  }, [selectedChapter]);

  const handleBack = () => {
    navigate("/teacher/daily-challenges");
  };

  const handleSave = () => {
    if (!challengeName || !selectedChapter || !selectedLesson) {
      message.error("Please fill in all required fields");
      return;
    }
    message.success("Reading challenge saved successfully!");
  };

  const handlePreview = () => {
    if (!challengeName || !selectedChapter || !selectedLesson) {
      message.error("Please fill in all required fields before preview");
      return;
    }
    message.info("Preview functionality coming soon!");
  };

  const handleAddPassage = () => {
    const newPassageId = Math.max(...passages.map(p => p.id)) + 1;
    const newPassage = {
      id: newPassageId,
      title: `Passage ${newPassageId}`,
      content: "",
      type: null
    };
    setPassages([...passages, newPassage]);
    setActivePassage(newPassageId);
  };

  const handleDiscardPassage = () => {
    if (passages.length <= 1) {
      message.warning("Không thể xóa passage cuối cùng!");
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
    
    message.success("Đã xóa passage thành công!");
  };

  const handlePassageContentChange = (content) => {
    setPassageContent(content);
    setPassages(passages.map(p => 
      p.id === activePassage ? { ...p, content } : p
    ));
  };

  const handleUploadPDF = async (file) => {
    try {
      // Kiểm tra file có hợp lệ không
      if (!isValidPDF(file)) {
        message.error("Vui lòng chọn file PDF hợp lệ (tối đa 10MB)");
        return false;
      }

      setIsProcessingPDF(true);
      setUploadedFileName(file.name);

      // Trích xuất text từ PDF
      const extractedText = await extractTextFromPDF(file);
      
      if (!extractedText || extractedText.trim().length === 0) {
        message.warning("Không thể trích xuất text từ file PDF này. File có thể bị mã hóa hoặc không chứa text.");
        return false;
      }

      // Cập nhật passage content với text đã trích xuất
      handlePassageContentChange(extractedText);
      
      // Chuyển sang chế độ manual để hiển thị text
      setPassages(passages.map(p => 
        p.id === activePassage ? { ...p, type: "manual", content: extractedText } : p
      ));

      message.success(`Đã trích xuất text từ file "${file.name}" thành công!`);
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      message.error(error.message || "Có lỗi xảy ra khi xử lý file PDF");
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
    setQuestions(questions.filter(q => q.id !== questionId));
    message.success("Question deleted successfully!");
  };

  const handleSaveQuestion = (questionData) => {
    if (editingQuestion) {
      // Update existing question
      setQuestions(questions.map(q => 
        q.id === editingQuestion.id ? { ...questionData, id: editingQuestion.id } : q
      ));
      message.success("Question updated successfully!");
    } else {
      // Add new question
      const newQuestion = {
        ...questionData,
        id: Date.now(),
      };
      setQuestions([...questions, newQuestion]);
      message.success("Question added successfully!");
    }
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




  const currentPassage = passages.find(p => p.id === activePassage);

  return (
    <Layout>
      <div className="create-reading-challenge-container">
        {/* Header */}
        <Card className="header-card">
          <Row justify="space-between">
            <Col>
              <Space align="center">
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={handleBack}
                  type="text"
                />
                <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
                  Create Reading Challenge
                </Title>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button icon={<EyeOutlined />} onClick={handlePreview}>
                  Preview
                </Button>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={handleSave}
                >
                  Save Challenge
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Configuration Section */}
        <Card className="config-card">
          <Row gutter={24} align="middle">
            <Col span={8}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>Challenge Name:</Text>
                <Input
                  placeholder="Enter challenge name"
                  value={challengeName}
                  onChange={(e) => setChallengeName(e.target.value)}
                  size="large"
                />
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>Chapter:</Text>
                <Select
                  placeholder="Select chapter"
                  value={selectedChapter}
                  onChange={setSelectedChapter}
                  style={{ width: "100%" }}
                  size="large"
                >
                  {mockChapters.map((chapter) => (
                    <Option key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>Lesson:</Text>
                <Select
                  placeholder="Select lesson"
                  value={selectedLesson}
                  onChange={setSelectedLesson}
                  style={{ width: "100%" }}
                  size="large"
                  disabled={!selectedChapter}
                >
                  {availableLessons.map((lesson) => (
                    <Option key={lesson.id} value={lesson.id}>
                      {lesson.name}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Main Content */}
        <div className="main-content-container">
          <Row gutter={24} style={{ height: "calc(100vh - 380px)" }}>
            {/* Passage Creation - Left Side (2/3) */}
            <Col span={16} className="passage-section">
              <Card className="passage-card" style={{ height: "100%" }}>
                {/* Passage Tabs with Discard Button */}
                <div className="passage-tabs">
                  <div className="passage-tabs-left">
                    {passages.map((passage) => (
                      <Button
                        key={passage.id}
                        type={activePassage === passage.id ? "primary" : "text"}
                        onClick={() => setActivePassage(passage.id)}
                        className="passage-tab"
                      >
                        {passage.title}
                      </Button>
                    ))}
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={handleAddPassage}
                      className="add-passage-btn"
                    >
                      Add passage set
                    </Button>
                  </div>
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    className="discard-btn"
                    onClick={handleDiscardPassage}
                    disabled={passages.length <= 1}
                  >
                    Discard passage
                  </Button>
                </div>

                <Divider />

                 {/* Passage Content */}
                 <div className="passage-content">
                   {currentPassage?.type === "manual" ? (
                     /* Text Editor - Full space when manual is selected */
                     <div className="text-editor-full">
                       <div className="text-editor-header">
                         <Button 
                           type="text" 
                           icon={<ArrowLeftOutlined />}
                           onClick={() => {
                             setPassages(passages.map(p => 
                               p.id === activePassage ? { ...p, type: null } : p
                             ));
                           }}
                           className="back-to-options-btn"
                         >
                           Back to options
                         </Button>
                       </div>
                       <TextArea
                         placeholder="Enter your passage content here..."
                         value={passageContent}
                         onChange={(e) => handlePassageContentChange(e.target.value)}
                         rows={20}
                         style={{ fontSize: 14, lineHeight: 1.6, height: "100%" }}
                       />
                     </div>
                   ) : (
                     /* Initial Options - Show when no type selected */
                     <>
                       <Title level={3} style={{ textAlign: "center", marginBottom: 32 }}>
                         Add passage
                       </Title>
                       
                       <Space direction="vertical" size="large" style={{ width: "100%" }}>
                         {/* Manual Text & Media */}
                         <Card 
                           hoverable 
                           className="passage-option-card"
                           onClick={() => {
                             setPassages(passages.map(p => 
                               p.id === activePassage ? { ...p, type: "manual" } : p
                             ));
                           }}
                         >
                           <Space>
                             <FileTextOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                             <Text strong>Add text & media manually</Text>
                           </Space>
                         </Card>

                         {/* PDF Upload */}
                         <Card 
                           hoverable 
                           className="passage-option-card"
                           style={{ opacity: isProcessingPDF ? 0.6 : 1 }}
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
                                 <UploadOutlined style={{ fontSize: 24, color: "#52c41a" }} />
                               )}
                               <Text strong>
                                 {isProcessingPDF ? `Đang xử lý "${uploadedFileName}"...` : "Upload PDF"}
                               </Text>
                             </Space>
                           </Upload>
                         </Card>
                       </Space>
                     </>
                   )}
                 </div>
              </Card>
            </Col>

            {/* Questions Section - Right Side (1/3) */}
            <Col span={8} className="questions-section">
              <div className="questions-container" style={{ height: "100%" }}>
                {/* Question Type Section - Top 1/3 */}
                <div className="question-type-section">
                  <Card className="question-type-card">
                    <div className="question-type-header">
                      <Title level={4} style={{ margin: 0, color: "#4dd0ff" }}>
                        Question Type
                      </Title>
                    </div>
                    <div className="add-question-section">
                      <Dropdown
                        overlay={
                          <Menu className="question-type-menu">
                            <Menu.Item key="multiple-choice" onClick={() => handleAddQuestion('multiple-choice')}>
                              Multiple Choice
                            </Menu.Item>
                            <Menu.Item key="multiple-select" onClick={() => handleAddQuestion('multiple-select')}>
                              Multiple Select
                            </Menu.Item>
                            <Menu.Item key="true-false" onClick={() => handleAddQuestion('true-false')}>
                              True or False
                            </Menu.Item>
                            <Menu.Item key="fill-blank" onClick={() => handleAddQuestion('fill-blank')}>
                              Fill in the Blank
                            </Menu.Item>
                            <Menu.Item key="dropdown" onClick={() => handleAddQuestion('dropdown')}>
                              Dropdown
                            </Menu.Item>
                            <Menu.Item key="drag-drop" onClick={() => handleAddQuestion('drag-drop')}>
                              Drag and Drop
                            </Menu.Item>
                            <Menu.Item key="reorder" onClick={() => handleAddQuestion('reorder')}>
                              Reorder
                            </Menu.Item>
                            
                          </Menu>
                        }
                        trigger={['click']}
                      >
                        <Button className="add-question-btn">
                          <PlusOutlined />
                          Add a Question
                          <DownOutlined />
                        </Button>
                      </Dropdown>
                    </div>
                  </Card>
                </div>

                {/* Questions List Section - Bottom 2/3 */}
                <div className="questions-list-section">
                  <Card className="questions-card">
                    <div className="questions-header">
                      <Title level={4} style={{ margin: 0, color: "#4dd0ff" }}>
                        Questions ({questions.length})
                      </Title>
                    </div>
                    
                    <div className="questions-list">
                      {questions.length === 0 ? (
                        <div className="empty-questions">
                          <div className="empty-icon">🚀</div>
                          <div className="empty-text">No questions added yet</div>
                          <div className="empty-subtext">Click "Add a Question" above to get started</div>
                        </div>
                      ) : (
                        questions.map((question, index) => (
                          <div key={question.id} className="question-item">
                            <div className="question-handle">
                              <HolderOutlined style={{ color: "#b9c6ff", cursor: "grab" }} />
                            </div>
                            <div onClick={() => handleEditQuestion(question)} style={{ flex: 1, cursor: "pointer" }}>
                              <div className="question-type">
                                Q{index + 1}: {getQuestionTypeLabel(question.type)}
                              </div>
                              <div className="question-text">
                                {question.question || "the question is"}
                              </div>
                            </div>
                            <div className="question-actions">
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteQuestion(question.id)}
                                style={{ color: "#ff6b6b" }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </Col>

          </Row>
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
        
     

      </div>
    </Layout>
  );
};

export default CreateReadingChallenge;
