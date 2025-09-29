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
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Layout from "../../../../component/Layout";
import { extractTextFromPDF, isValidPDF } from "../../../../utils/pdfUtils";
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

const questionTypes = [
  { id: 1, name: "Multiple choice", type: "multiple-choice" },
  { id: 2, name: "Multiple select", type: "multiple-select" },
  { id: 3, name: "True or false", type: "true-false" },
  { id: 4, name: "Fill in the blank", type: "fill-blank" },
  { id: 5, name: "Dropdown", type: "dropdown" },
  { id: 6, name: "Drag and drop", type: "drag-drop" },
  { id: 7, name: "Reorder", type: "reorder" },
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
  const [questions, setQuestions] = useState([]);
  const [passageContent, setPassageContent] = useState("");
  const [selectedQuestionType, setSelectedQuestionType] = useState(null);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

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


  const handleAddQuestion = () => {
    if (!selectedQuestionType) {
      message.warning("Please select a question type first");
      return;
    }

    const newQuestion = {
      id: Date.now(),
      type: selectedQuestionType.type,
      title: selectedQuestionType.name,
      question: "",
      options: selectedQuestionType.type === "multiple-choice" || selectedQuestionType.type === "multiple-select" 
        ? [
            { id: 1, text: "", isCorrect: false },
            { id: 2, text: "", isCorrect: false },
            { id: 3, text: "", isCorrect: false },
            { id: 4, text: "", isCorrect: false }
          ]
        : [],
      correctAnswer: selectedQuestionType.type === "true-false" ? null : "",
    };
    setQuestions([...questions, newQuestion]);
    message.success(`${selectedQuestionType.name} question added!`);
    setSelectedQuestionType(null); // Reset selection after adding
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
          <Row gutter={0} style={{ height: "calc(100vh - 380px)" }}>
            {/* Left Section - Passage Creation */}
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

            {/* Right Section - Question Creation */}
            <Col span={8} className="question-section">
              <Card className="question-card" style={{ height: "100%" }}>


                {/* Add Question */}
                <div className="add-question-section">
                  {/* Question Type Selection */}
                  <div className="question-type-selection">
                    <Text strong style={{ color: 'white', marginBottom: 12, display: 'block' }}>
                      Select Question Type:
                    </Text>
                    <Select
                      placeholder="Choose question type"
                      value={selectedQuestionType?.id}
                      onChange={(value) => {
                        const type = questionTypes.find(t => t.id === value);
                        setSelectedQuestionType(type);
                      }}
                      style={{ width: '100%', marginBottom: 16 }}
                      size="large"
                    >
                      {questionTypes.map((type) => (
                        <Option key={type.id} value={type.id}>
                          {type.name}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  {/* Add Question Button */}
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    size="large"
                    className="add-question-btn"
                    onClick={handleAddQuestion}
                    disabled={!selectedQuestionType}
                  >
                    Add a Question
                  </Button>
                </div>

                {/* Questions List */}
                {questions.length > 0 && (
                  <div className="questions-list">
                    <Divider />
                    <Text strong>Added Questions:</Text>
                    {questions.map((question, index) => (
                      <Card key={question.id} size="small" className="question-item">
                        <Space justify="space-between" style={{ width: "100%" }}>
                          <Text>Question {index + 1}: {question.title}</Text>
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />}
                            size="small"
                          />
                        </Space>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </Layout>
  );
};

export default CreateReadingChallenge;
