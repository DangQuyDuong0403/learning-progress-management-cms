import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Space,
  Typography,
  message,
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EyeOutlined,
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import {
  MultipleChoiceModal,
  MultipleSelectModal,
  TrueFalseModal,
  FillBlankModal,
  DropdownModal,
  DragDropModal,
  ReorderModal,
  RewriteModal,
} from "./questionModals";
import "./CreateGrammarVocabularyChallenge1.css";

const { Title, Text } = Typography;
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
    name: "Chapter 3: Vocabulary",
    lessons: [
      { id: 7, name: "Lesson 3.1: Business Vocabulary" },
      { id: 8, name: "Lesson 3.2: Academic Vocabulary" },
      { id: 9, name: "Lesson 3.3: Daily Vocabulary" },
    ],
  },
];

const questionTypes = [
  { id: 1, name: "Multiple choice", type: "multiple-choice" },
  { id: 2, name: "Multiple select", type: "multiple-select" },
  { id: 3, name: "True or false", type: "true-false" },
  { id: 4, name: "Fill in the blank", type: "fill-blank" },
  { id: 5, name: "Dropdown", type: "dropdown" },
  { id: 6, name: "Drag and drop", type: "drag-drop" },
  { id: 7, name: "Reorder", type: "reorder" },
  { id: 8, name: "Re-write", type: "rewrite" },
];

// Move constants outside component to prevent re-creation
const QUESTION_TYPES = questionTypes;
const MOCK_CHAPTERS = mockChapters;

// Draggable Question Item Component
const DraggableQuestionItem = ({ question, index, onDelete, onMove }) => {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e) => {
    if (e.target.closest('.question-drag-handle')) {
      setIsDragging(true);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const questionItems = document.querySelectorAll('.question-item');
    const currentRect = ref.current.getBoundingClientRect();
    const currentCenter = currentRect.top + currentRect.height / 2;
    
    let newIndex = index;
    questionItems.forEach((item, i) => {
      if (i !== index) {
        const rect = item.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        if (e.clientY < center && e.clientY > currentCenter) {
          newIndex = i;
        }
      }
    });
    
    if (newIndex !== index) {
      onMove(index, newIndex);
    }
  }, [isDragging, index, onMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={ref}
      className={`gvc-question-item ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
    >
      <div className="gvc-question-controls">
        <div className="gvc-question-drag-handle">
          <span className="gvc-drag-icon">⋮⋮</span>
        </div>
        <Select 
          value={question.type} 
          style={{ width: 150 }}
          size="small"
        >
          {QUESTION_TYPES.map(type => (
            <Option key={type.type} value={type.type}>
              ✓ {index + 1}. {type.name}
            </Option>
          ))}
        </Select>
        <Select 
          value="30" 
          style={{ width: 100 }}
          size="small"
        >
          <Option value="30">30 giây</Option>
          <Option value="60">1 phút</Option>
          <Option value="120">2 phút</Option>
        </Select>
        <Select 
          value={question.points || 1} 
          style={{ width: 100 }}
          size="small"
        >
          <Option value={1}>1 điểm</Option>
          <Option value={2}>2 điểm</Option>
          <Option value={3}>3 điểm</Option>
        </Select>
        <div className="gvc-question-actions">
          <Button 
            type="text" 
            size="small"
            icon={<PlusOutlined />}
            title="Copy"
          />
          <Button 
            type="text" 
            size="small"
            icon={<PlusOutlined />}
            title="Paste"
          />
          <Button 
            type="text" 
            size="small"
            icon={<PlusOutlined />}
          >
            Chỉnh sửa
          </Button>
          <Button 
            type="text" 
            danger 
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onDelete(question.id)}
          />
        </div>
      </div>
      
      <div className="gvc-question-content">
        <div className="gvc-question-text">
          {question.question || "aaa"}
        </div>
        
        {(question.type === "multiple-choice" || question.type === "multiple-select") && question.options && (
          <div className="gvc-answer-options">
            <Text strong style={{ display: "block", marginBottom: 8 }}>Lựa chọn trả lời:</Text>
            {question.options.map((option, optIndex) => (
              <div key={option.id} className={`gvc-option-item ${option.isCorrect ? 'correct' : 'incorrect'}`}>
                <span className="gvc-option-indicator">
                  {option.isCorrect ? '✓' : 'x'}
                </span>
                <span className="gvc-option-label">{String.fromCharCode(65 + optIndex)}.</span>
                <span className="gvc-option-text">{option.text || 'aa'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


const CreateGrammarVocabularyChallenge = () => {
  const navigate = useNavigate();
  
  const [challengeName, setChallengeName]        = useState("");
  const [selectedChapter, setSelectedChapter]   = useState(null);
  const [selectedLesson, setSelectedLesson]     = useState(null);
  const [availableLessons, setAvailableLessons] = useState([]);
  const [questions, setQuestions]               = useState([]);
  
  // Modal states
  const [modalVisible, setModalVisible]         = useState(false);
  const [currentModalType, setCurrentModalType] = useState(null);
  const [questionTypeModalVisible, setQuestionTypeModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible]     = useState(false);

  useEffect(() => {
    if (selectedChapter) {
      const chapter = MOCK_CHAPTERS.find(ch => ch.id === selectedChapter);
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
    message.success("Challenge saved successfully!");
  };

  const handlePreview = () => {
    if (!challengeName || !selectedChapter || !selectedLesson) {
      message.error("Please fill in all required fields before preview");
      return;
    }
    if (questions.length === 0) {
      message.error("Please add at least one question before preview");
      return;
    }
    setPreviewVisible(true);
  };

  // Modal handlers
  const handleQuestionTypeClick = useCallback((questionType) => {
    setCurrentModalType(questionType.type);
    setModalVisible(true);
    setQuestionTypeModalVisible(false);
  }, []);

  const handleAddQuestionClick = useCallback(() => {
    setQuestionTypeModalVisible(true);
  }, []);

  const handleModalSave = useCallback((questionData) => {
    setQuestions(prev => [...prev, questionData]);
    setModalVisible(false);
    setCurrentModalType(null);
    message.success(`${questionData.title} question added successfully!`);
  }, []);

  const handleModalCancel = useCallback(() => {
    setModalVisible(false);
    setCurrentModalType(null);
  }, []);

  const handleQuestionTypeModalCancel = useCallback(() => {
    setQuestionTypeModalVisible(false);
  }, []);

  // Question management
  const deleteQuestion = useCallback((questionId) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  }, []);

  // Drag and drop functionality
  const moveQuestion = useCallback((dragIndex, hoverIndex) => {
    setQuestions(prev => {
      const draggedQuestion = prev[dragIndex];
      const newQuestions = [...prev];
      newQuestions.splice(dragIndex, 1);
      newQuestions.splice(hoverIndex, 0, draggedQuestion);
      return newQuestions;
    });
  }, []);

  // Preview handlers
  const handlePreviewCancel = useCallback(() => {
    setPreviewVisible(false);
  }, []);

  return (
    <ThemedLayout>
      <div className="gvc-create-challenge-container">
        {/* Header */}
        <Card className="gvc-header-card">
          <Row justify="space-between">
            <Col>
              <Space align="center">
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={handleBack}
                  type="text"
                />
                <Title level={2} style={{ margin: 0, color: "#7228d9" }}>
                  Create Grammar & Vocabulary Challenge
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
        <Card className="gvc-config-card">
          <Row gutter={24} align="middle">
            <Col span={6}>
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
            <Col span={6}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>Chapter:</Text>
                <Select
                  placeholder="Select chapter"
                  value={selectedChapter}
                  onChange={setSelectedChapter}
                  style={{ width: "100%" }}
                  size="large"
                 >
                   {MOCK_CHAPTERS.map((chapter) => (
                     <Option key={chapter.id} value={chapter.id}>
                       {chapter.name}
                     </Option>
                   ))}
                 </Select>
              </Space>
            </Col>
            <Col span={6}>
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
            <Col span={6}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>Time Limit (minutes):</Text>
                <Input
                  placeholder="30"
                  type="number"
                  size="large"
                />
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Search Existing Questions Section */}
        <Card className="gvc-search-card">
          <Row gutter={24} align="middle">
            <Col span={12}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>Tìm kiếm câu hỏi đã tạo:</Text>
                <Input
                  placeholder="Nhập tên chủ đề hoặc nội dung câu hỏi"
                  size="large"
                  suffix={
                    <Button type="primary" icon={<SearchOutlined />}>
                      Tìm kiếm
                    </Button>
                  }
                />
              </Space>
            </Col>
            <Col span={12}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>Cài đặt đề thi:</Text>
                <Space>
                  {/* <Button type="default" size="large">
                    Cài đặt thời gian
                  </Button>
                  <Button type="default" size="large">
                    Cài đặt điểm số
                  </Button> */}
                  <Button type="default" size="large">
                    Cài đặt khác
                  </Button>
                </Space>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Questions Section */}
        <Card className="gvc-questions-card">
          <div className="gvc-questions-header">
            <div className="gvc-questions-title">
              <Text strong style={{ fontSize: 18 }}>
                {questions.length} câu hỏi ({questions.reduce((total, q) => total + (q.points || 1), 0)} điểm)
              </Text>
            </div>
            <div className="gvc-questions-actions">
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddQuestionClick}
                size="large"
              >
                 Thêm câu hỏi
              </Button>
            </div>
          </div>
          
          <div className="gvc-questions-list">
            {questions.length > 0 ? (
              questions.map((question, index) => (
                <DraggableQuestionItem
                  key={question.id}
                  question={question}
                  index={index}
                  onDelete={deleteQuestion}
                  onMove={moveQuestion}
                />
              ))
            ) : (
              <div className="gvc-empty-questions">
                <Text type="secondary">Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.</Text>
              </div>
            )}
          </div>
          
          {questions.length > 0 && (
            <div className="gvc-questions-footer">
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddQuestionClick}
                size="large"
              >
                 Thêm câu hỏi
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Question Type Selection Modal */}
      <Modal
        title="Chọn loại câu hỏi"
        open={questionTypeModalVisible}
        onCancel={handleQuestionTypeModalCancel}
        footer={null}
        width={800}
        className="gvc-question-type-modal"
      >
        <div className="gvc-question-types-grid">
          {QUESTION_TYPES.map((questionType) => (
            <div
              key={questionType.id}
              className="gvc-question-type-card"
              onClick={() => handleQuestionTypeClick(questionType)}
            >
              <div className="gvc-question-type-icon">
                {questionType.type === "multiple-choice" && "📝"}
                {questionType.type === "multiple-select" && "☑️"}
                {questionType.type === "true-false" && "✅"}
                {questionType.type === "fill-blank" && "✏️"}
                {questionType.type === "dropdown" && "📋"}
                {questionType.type === "drag-drop" && "🔄"}
                {questionType.type === "reorder" && "🔀"}
                {questionType.type === "rewrite" && "✍️"}
              </div>
              <div className="gvc-question-type-name">{questionType.name}</div>
              <div className="gvc-question-type-description">
                {questionType.type === "multiple-choice" && "Chọn một đáp án đúng"}
                {questionType.type === "multiple-select" && "Chọn nhiều đáp án đúng"}
                {questionType.type === "true-false" && "Đúng hoặc Sai"}
                {questionType.type === "fill-blank" && "Điền vào chỗ trống"}
                {questionType.type === "dropdown" && "Chọn từ danh sách"}
                {questionType.type === "drag-drop" && "Kéo thả để sắp xếp"}
                {questionType.type === "reorder" && "Sắp xếp lại thứ tự"}
                {questionType.type === "rewrite" && "Viết lại câu"}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Question Modals */}
      <MultipleChoiceModal
        visible={modalVisible && currentModalType === "multiple-choice"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
      />
      
      <MultipleSelectModal
        visible={modalVisible && currentModalType === "multiple-select"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
      />
      
      <TrueFalseModal
        visible={modalVisible && currentModalType === "true-false"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
      />
      
      <FillBlankModal
        visible={modalVisible && currentModalType === "fill-blank"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
      />
      
      <DropdownModal
        visible={modalVisible && currentModalType === "dropdown"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
      />
      
      <DragDropModal
        visible={modalVisible && currentModalType === "drag-drop"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
      />
      
      <ReorderModal
        visible={modalVisible && currentModalType === "reorder"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
      />
      
      <RewriteModal
        visible={modalVisible && currentModalType === "rewrite"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
      />

      {/* Preview Modal */}
      <Modal
        title="Preview Challenge"
        open={previewVisible}
        onCancel={handlePreviewCancel}
        footer={[
          <Button key="close" onClick={handlePreviewCancel}>
            Close
          </Button>
        ]}
        width={800}
        className="gvc-preview-modal"
      >
        <div className="gvc-preview-content">
          <div className="gvc-preview-header">
            <Title level={3} style={{ margin: 0, color: "#7228d9" }}>
              {challengeName}
            </Title>
            <Text type="secondary">
              {MOCK_CHAPTERS.find(ch => ch.id === selectedChapter)?.name} - 
              {availableLessons.find(lesson => lesson.id === selectedLesson)?.name}
            </Text>
          </div>
          
          <div className="gvc-preview-questions">
            {questions.map((question, index) => (
              <div key={question.id} className="gvc-preview-question">
                <div className="gvc-preview-question-header">
                  <Text strong style={{ fontSize: 16 }}>
                    Câu hỏi {index + 1}: {question.title || question.type}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ({question.points || 1} điểm)
                  </Text>
                </div>
                
                <div className="gvc-preview-question-content">
                  <div className="gvc-preview-question-text">
                    {question.question || "Câu hỏi mẫu"}
                  </div>
                  
                  {question.type === "multiple-choice" && question.options && (
                    <div className="gvc-preview-options">
                      {question.options.map((option, optIndex) => (
                        <div key={option.id} className="gvc-preview-option">
                          <span className="gvc-option-letter">{String.fromCharCode(65 + optIndex)}.</span>
                          <span className="gvc-option-text">{option.text || `Option ${optIndex + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.type === "multiple-select" && question.options && (
                    <div className="gvc-preview-options">
                      {question.options.map((option, optIndex) => (
                        <div key={option.id} className="gvc-preview-option">
                          <span className="gvc-option-checkbox">☐</span>
                          <span className="gvc-option-text">{option.text || `Option ${optIndex + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.type === "true-false" && (
                    <div className="gvc-preview-options">
                      <div className="gvc-preview-option">
                        <span className="gvc-option-radio">○</span>
                        <span className="gvc-option-text">True</span>
                      </div>
                      <div className="gvc-preview-option">
                        <span className="gvc-option-radio">○</span>
                        <span className="gvc-option-text">False</span>
                      </div>
                    </div>
                  )}
                  
                  {question.type === "fill-blank" && (
                    <div className="gvc-preview-fill-blank">
                      <Input placeholder="Nhập câu trả lời..." style={{ width: 200 }} />
                    </div>
                  )}
                  
                  {(question.type === "rewrite" || question.type === "free-input") && (
                    <div className="gvc-preview-text-area">
                      <Input.TextArea 
                        placeholder="Nhập câu trả lời..." 
                        rows={3}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </ThemedLayout>
  );
};

export default CreateGrammarVocabularyChallenge;
