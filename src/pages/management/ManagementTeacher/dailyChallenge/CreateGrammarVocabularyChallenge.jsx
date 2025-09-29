import React, { useState, useEffect, useCallback, memo } from "react";
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
  Form,
  Radio,
  Checkbox,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EyeOutlined,
  PlusOutlined,
  DeleteOutlined,
  DragOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Layout from "../../../../component/Layout";
import "./CreateGrammarVocabularyChallenge.css";

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

// Memoized QuestionTypeItem component - defined outside to prevent re-creation
const QuestionTypeItem = memo(({ questionType, onDragStart }) => (
  <div
    className="question-type-item draggable"
    draggable
    onDragStart={(e) => onDragStart(e, questionType)}
  >
    <DragOutlined style={{ marginRight: 8, opacity: 0.6 }} />
    <Text className="question-type-name">{questionType.name}</Text>
  </div>
));

const CreateGrammarVocabularyChallenge = () => {
  const navigate = useNavigate();
  
  const [challengeName, setChallengeName]        = useState("");
  const [selectedChapter, setSelectedChapter]   = useState(null);
  const [selectedLesson, setSelectedLesson]     = useState(null);
  const [availableLessons, setAvailableLessons] = useState([]);
  const [questions, setQuestions]               = useState([]);
  const [currentEditingQuestion, setCurrentEditingQuestion] = useState(null);
  const [dragOverPreview, setDragOverPreview]   = useState(false);
  const [dropdowns, setDropdowns]               = useState({}); // Store dropdown data for each question

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
    message.info("Preview functionality coming soon!");
  };

  // Drag & Drop handlers - memoized to prevent re-renders
  const handleDragStart = useCallback((e, questionType) => {
    e.dataTransfer.setData("questionType", JSON.stringify(questionType));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOverPreview(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOverPreview(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOverPreview(false);
    
    try {
      const questionTypeData = JSON.parse(e.dataTransfer.getData("questionType"));
      
      if (!questionTypeData || !questionTypeData.type) {
        console.error("Invalid question type data:", questionTypeData);
        return;
      }
      
      // Tạo câu hỏi mới
      const newQuestion = {
        id: Date.now(),
        type: questionTypeData.type,
        title: questionTypeData.name,
        question: "",
        options: questionTypeData.type === "multiple-choice" || questionTypeData.type === "multiple-select" 
          ? [{ id: 1, text: "", isCorrect: false }, { id: 2, text: "", isCorrect: false }, { id: 3, text: "", isCorrect: false }, { id: 4, text: "", isCorrect: false }]
          : [],
        correctAnswer: questionTypeData.type === "true-false" ? null : "",
      };

      setQuestions(prev => [...prev, newQuestion]);
      
      // Use setTimeout to avoid potential state update conflicts
      setTimeout(() => {
        setCurrentEditingQuestion(newQuestion);
        message.success(`${questionTypeData.name} question added to preview!`);
      }, 0);
      
    } catch (error) {
      console.error("Error handling drop:", error);
      message.error("Error adding question. Please try again.");
    }
  }, []);

  // Question management - memoized to prevent re-renders
  const updateQuestion = useCallback((questionId, updates) => {
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...updates } : q));
    setCurrentEditingQuestion(prev => {
      if (prev && prev.id === questionId) {
        return { ...prev, ...updates };
      }
      return prev;
    });
  }, []);

  const deleteQuestion = useCallback((questionId) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    setCurrentEditingQuestion(prev => {
      if (prev && prev.id === questionId) {
        return null;
      }
      return prev;
    });
  }, []);

  const addOption = useCallback((questionId) => {
    setQuestions(prev => {
      return prev.map(question => {
        if (question.id === questionId) {
          const newOption = { 
            id: Math.max(...question.options.map(o => o.id), 0) + 1, 
            text: "", 
            isCorrect: false 
          };
          return { ...question, options: [...question.options, newOption] };
        }
        return question;
      });
    });
    setCurrentEditingQuestion(prev => {
      if (prev && prev.id === questionId) {
        const newOption = { 
          id: Math.max(...prev.options.map(o => o.id), 0) + 1, 
          text: "", 
          isCorrect: false 
        };
        return { ...prev, options: [...prev.options, newOption] };
      }
      return prev;
    });
  }, []);

  const removeOption = useCallback((questionId, optionId) => {
    setQuestions(prev => prev.map(question => {
      if (question.id === questionId) {
        return { ...question, options: question.options.filter(o => o.id !== optionId) };
      }
      return question;
    }));
    setCurrentEditingQuestion(prev => {
      if (prev && prev.id === questionId) {
        return { ...prev, options: prev.options.filter(o => o.id !== optionId) };
      }
      return prev;
    });
  }, []);

  const updateOption = useCallback((questionId, optionId, updates) => {
    setQuestions(prev => prev.map(question => {
      if (question.id === questionId) {
        return {
          ...question,
          options: question.options.map(o => 
            o.id === optionId ? { ...o, ...updates } : o
          )
        };
      }
      return question;
    }));
    setCurrentEditingQuestion(prev => {
      if (prev && prev.id === questionId) {
        return {
          ...prev,
          options: prev.options.map(o => 
            o.id === optionId ? { ...o, ...updates } : o
          )
        };
      }
      return prev;
    });
  }, []);

  // Dropdown management functions
  const addDropdownToQuestion = useCallback((questionId) => {
    const dropdownId = `dropdown_${Date.now()}`;
    const newDropdown = {
      id: dropdownId,
      options: ['Option 1', 'Option 2', 'Option 3'],
      correctAnswer: 0, // Index of correct option
      placeholder: 'Select option'
    };
    
    setDropdowns(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [dropdownId]: newDropdown
      }
    }));

    // Insert dropdown placeholder into question text
    const currentQuestion = questions.find(q => q.id === questionId);
    if (currentQuestion) {
      const updatedQuestion = currentQuestion.question + ` {${dropdownId}}`;
      updateQuestion(questionId, { question: updatedQuestion });
    }
  }, [questions, updateQuestion]);

  const updateDropdownOption = useCallback((questionId, dropdownId, optionIndex, value) => {
    setDropdowns(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [dropdownId]: {
          ...prev[questionId][dropdownId],
          options: prev[questionId][dropdownId].options.map((opt, idx) => 
            idx === optionIndex ? value : opt
          )
        }
      }
    }));
  }, []);

  const addDropdownOption = useCallback((questionId, dropdownId) => {
    setDropdowns(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [dropdownId]: {
          ...prev[questionId][dropdownId],
          options: [...prev[questionId][dropdownId].options, `Option ${prev[questionId][dropdownId].options.length + 1}`]
        }
      }
    }));
  }, []);

  const removeDropdownOption = useCallback((questionId, dropdownId, optionIndex) => {
    setDropdowns(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [dropdownId]: {
          ...prev[questionId][dropdownId],
          options: prev[questionId][dropdownId].options.filter((_, idx) => idx !== optionIndex),
          correctAnswer: prev[questionId][dropdownId].correctAnswer >= optionIndex 
            ? Math.max(0, prev[questionId][dropdownId].correctAnswer - 1)
            : prev[questionId][dropdownId].correctAnswer
        }
      }
    }));
  }, []);

  const setDropdownCorrectAnswer = useCallback((questionId, dropdownId, correctIndex) => {
    setDropdowns(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [dropdownId]: {
          ...prev[questionId][dropdownId],
          correctAnswer: correctIndex
        }
      }
    }));
  }, []);

  // Function to render question text with dropdowns
  const renderQuestionWithDropdowns = (question) => {
    if (!question.question || !dropdowns[question.id]) {
      return question.question;
    }

    let questionText = question.question;
    const questionDropdowns = dropdowns[question.id];

    // Replace dropdown placeholders with dropdown components
    Object.keys(questionDropdowns).forEach(dropdownId => {
      const dropdown = questionDropdowns[dropdownId];
      const dropdownPattern = new RegExp(`\\{${dropdownId}\\}`, 'g');
      const dropdownText = `dropdown(${dropdown.options.join(', ')})`;
      questionText = questionText.replace(dropdownPattern, dropdownText);
    });

    return questionText;
  };

  return (
    <Layout>
      <div className="create-challenge-container">
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
                   {MOCK_CHAPTERS.map((chapter) => (
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
          <Row gutter={24} style={{ height: "calc(100vh - 300px)" }}>
            {/* Preview Panel (Left) */}
            <Col span={8}>
              <Card 
                title="Preview" 
                className="preview-card"
                style={{ height: "100%" }}
              >
                <div 
                  className={`preview-content ${dragOverPreview ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {questions.length > 0 ? (
                    <div className="questions-list">
                      {questions.map((question, index) => (
                        <div key={question.id} className="question-preview-item">
                          <div className="question-header">
                            <Text strong>Question {index + 1}: {question.title}</Text>
                            <Space>
                               <Button 
                                 type="text" 
                                 size="small"
                                 onClick={() => setCurrentEditingQuestion(question)}
                               >
                                 Edit
                               </Button>
                              <Button 
                                type="text" 
                                danger 
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => deleteQuestion(question.id)}
                              >
                                Delete
                              </Button>
                            </Space>
                          </div>
                          <div className="question-content">
                             <div className="question-text">
                               {question.question ? (
                                 <div className="question-display">
                                   {question.type === "fill-blank" ? (
                                     <div className="fill-blank-preview-container">
                                       <div className="question-content">
                                         <Text strong style={{ display: "block", marginBottom: 16, fontSize: 16 }}>
                                           {question.question}
                                         </Text>
                                       </div>
                                       
                                       {/* Student Input Section */}
                                       <div className="student-input-section">
                                         <div className="input-label">
                                           <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                                             Student view: Type your answer
                                           </Text>
                                         </div>
                                         <Input 
                                           placeholder="Enter answer"
                                           size="large"
                                         />
                                       </div>
                                     </div>
                                   ) : (
                                     <div className="question-content">
                                       <Text strong style={{ display: "block", marginBottom: 12 }}>
                                         {renderQuestionWithDropdowns(question)}
                                       </Text>
                                     </div>
                                   )}
                                 </div>
                               ) : (
                                 <Text type="secondary">Click Edit to add question content</Text>
                               )}
                             </div>
                            
                            {/* Display answer options for multiple choice questions */}
                            {(question.type === "multiple-choice" || question.type === "multiple-select") && question.options.length > 0 && (
                              <div className="answer-options-preview">
                                {question.options.map((option, index) => (
                                  <div key={option.id} className="option-preview-row">
                                    <div className={`option-preview ${option.isCorrect ? 'correct-option' : ''}`}>
                                      <span className="option-label">{String.fromCharCode(65 + index)}.</span>
                                      <span className="option-text">{option.text || `Option ${String.fromCharCode(65 + index)}`}</span>
                                      {option.isCorrect && (
                                        <span className="correct-indicator">✓</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Display correct answer for other question types */}
                            {question.type === "true-false" && question.correctAnswer && (
                              <div className="correct-answer-preview">
                                <Text>Correct Answer: <Text strong>{question.correctAnswer}</Text></Text>
                              </div>
                            )}
                            
                            {(question.type === "fill-blank" || question.type === "rewrite" || question.type === "free-input") && question.correctAnswer && (
                              <div className="correct-answer-preview">
                                <Text>Correct Answer: <Text strong>{question.correctAnswer}</Text></Text>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="preview-placeholder">
                      <Text type="secondary">
                        Drag question types here to add questions. Current questions will appear below.
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            {/* Question Types Panel (Center) */}
            <Col span={8}>
              <Card 
                title="Question Types" 
                className="question-types-card"
                style={{ height: "100%" }}
              >
                 <div className="question-types-list">
                   {QUESTION_TYPES.map((questionType) => (
                     <QuestionTypeItem
                       key={`question-type-${questionType.id}`}
                       questionType={questionType}
                       onDragStart={handleDragStart}
                     />
                   ))}
                 </div>
              </Card>
            </Col>

            {/* Question Editor Panel (Right) */}
            <Col span={8}>
              <Card 
                title="Question Editor" 
                className="draw-card"
                style={{ height: "100%" }}
              >
                <div className="draw-container">
                  {currentEditingQuestion ? (
                    <div className="question-editor">
                      <div className="editor-header">
                        <Text strong>Editing: {currentEditingQuestion.title}</Text>
                        <Button 
                          type="text" 
                          onClick={() => setCurrentEditingQuestion(null)}
                        >
                          Close
                        </Button>
                      </div>
                      
                       <Form layout="vertical" className="question-form">
                         <Form.Item label="Question Text">
                           <Input.TextArea
                             placeholder={currentEditingQuestion.type === "fill-blank" ? "Enter your question (e.g., The apple is ____)" : "Enter your question here..."}
                             value={currentEditingQuestion.question}
                             onChange={(e) => updateQuestion(currentEditingQuestion.id, { question: e.target.value })}
                             rows={3}
                           />
                           {currentEditingQuestion.type === "dropdown" && (
                             <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                               <Button 
                                 type="dashed" 
                                 size="small"
                                 onClick={() => addDropdownToQuestion(currentEditingQuestion.id)}
                                 style={{ fontSize: '12px' }}
                               >
                                 + Add Dropdown
                               </Button>
                             </div>
                           )}
                         </Form.Item>

                        {(currentEditingQuestion.type === "multiple-choice" || 
                          currentEditingQuestion.type === "multiple-select") && (
                          <>
                            <Form.Item label="Answer Options">
                              {currentEditingQuestion.options.map((option, index) => (
                                <div key={option.id} className="option-row">
                                  <Input
                                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                    value={option.text}
                                    onChange={(e) => updateOption(currentEditingQuestion.id, option.id, { text: e.target.value })}
                                    style={{ flex: 1 }}
                                  />
                                  {currentEditingQuestion.type === "multiple-choice" ? (
                                    <Radio
                                      checked={option.isCorrect}
                                      onChange={() => {
                                        // Uncheck all others first
                                        const updatedOptions = currentEditingQuestion.options.map(o => ({
                                          ...o,
                                          isCorrect: false
                                        }));
                                        // Check current option
                                        const finalOptions = updatedOptions.map(o => 
                                          o.id === option.id ? { ...o, isCorrect: true } : o
                                        );
                                        updateQuestion(currentEditingQuestion.id, { options: finalOptions });
                                      }}
                                      value={option.id}
                                    >
                                      Correct
                                    </Radio>
                                  ) : (
                                    <Checkbox
                                      checked={option.isCorrect}
                                      onChange={(e) => updateOption(currentEditingQuestion.id, option.id, { isCorrect: e.target.checked })}
                                    >
                                      Correct
                                    </Checkbox>
                                  )}
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => removeOption(currentEditingQuestion.id, option.id)}
                                    disabled={currentEditingQuestion.options.length <= 2}
                                  />
                                </div>
                              ))}
                            </Form.Item>
                            <Button 
                              type="dashed" 
                              onClick={() => addOption(currentEditingQuestion.id)}
                              icon={<PlusOutlined />}
                              style={{ width: "100%" }}
                            >
                              Add Option
                            </Button>
                          </>
                        )}

                        {currentEditingQuestion.type === "true-false" && (
                          <Form.Item label="Correct Answer">
                            <Radio.Group
                              value={currentEditingQuestion.correctAnswer}
                              onChange={(e) => updateQuestion(currentEditingQuestion.id, { correctAnswer: e.target.value })}
                            >
                              <Radio value="true">True</Radio>
                              <Radio value="false">False</Radio>
                            </Radio.Group>
                          </Form.Item>
                        )}

                         {currentEditingQuestion.type === "fill-blank" && (
                           <Form.Item label="Correct Answer">
                             <Input
                               placeholder="Enter the correct answer (e.g., red)"
                               value={currentEditingQuestion.correctAnswer}
                               onChange={(e) => updateQuestion(currentEditingQuestion.id, { correctAnswer: e.target.value })}
                               maxLength={50}
                             />
                           </Form.Item>
                         )}
                         
                         {(currentEditingQuestion.type === "rewrite" || 
                           currentEditingQuestion.type === "free-input") && (
                           <Form.Item label="Correct Answer">
                             <Input.TextArea
                               placeholder="Enter the correct answer..."
                               value={currentEditingQuestion.correctAnswer}
                               onChange={(e) => updateQuestion(currentEditingQuestion.id, { correctAnswer: e.target.value })}
                               rows={2}
                             />
                           </Form.Item>
                         )}

                         {/* Dropdown Management Section */}
                         {dropdowns[currentEditingQuestion.id] && Object.keys(dropdowns[currentEditingQuestion.id]).length > 0 && (
                           <Form.Item label="Dropdown Options">
                             {Object.entries(dropdowns[currentEditingQuestion.id]).map(([dropdownId, dropdown]) => (
                               <div key={dropdownId} className="dropdown-manager">
                                 <div className="dropdown-header">
                                   <Text strong>Dropdown: {dropdownId}</Text>
                                 </div>
                                 <div className="dropdown-options">
                                   {dropdown.options.map((option, index) => (
                                     <div key={index} className="dropdown-option-row">
                                       <Input
                                         placeholder={`Option ${index + 1}`}
                                         value={option}
                                         onChange={(e) => updateDropdownOption(currentEditingQuestion.id, dropdownId, index, e.target.value)}
                                         style={{ flex: 1 }}
                                       />
                                       <Radio
                                         checked={dropdown.correctAnswer === index}
                                         onChange={() => setDropdownCorrectAnswer(currentEditingQuestion.id, dropdownId, index)}
                                         style={{ marginLeft: 8 }}
                                       >
                                         Correct
                                       </Radio>
                                       <Button
                                         type="text"
                                         danger
                                         icon={<DeleteOutlined />}
                                         onClick={() => removeDropdownOption(currentEditingQuestion.id, dropdownId, index)}
                                         disabled={dropdown.options.length <= 2}
                                       />
                                     </div>
                                   ))}
                                   <Button 
                                     type="dashed" 
                                     onClick={() => addDropdownOption(currentEditingQuestion.id, dropdownId)}
                                     icon={<PlusOutlined />}
                                     style={{ width: "100%", marginTop: 8 }}
                                   >
                                     Add Option
                                   </Button>
                                 </div>
                               </div>
                             ))}
                           </Form.Item>
                         )}
                      </Form>
                    </div>
                  ) : (
                    <div className="draw-placeholder">
                      <Text type="secondary">
                        Select a question from Preview to edit its details here.
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </Layout>
  );
};

export default CreateGrammarVocabularyChallenge;
