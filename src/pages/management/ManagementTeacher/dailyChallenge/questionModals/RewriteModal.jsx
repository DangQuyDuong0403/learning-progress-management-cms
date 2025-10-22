import React, { useState, useRef } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Typography,
  message,
  Select,
} from "antd";
import { 
  PlusOutlined, 
  DeleteOutlined,
  PictureOutlined, 
  AudioOutlined, 
  VideoCameraOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  FontSizeOutlined,
  FunctionOutlined,
} from "@ant-design/icons";
import './MultipleChoiceModal.css';

const { Text } = Typography;

const RewriteModal = ({ visible, onCancel, onSave, questionData = null }) => {
  const [form] = Form.useForm();
  const [correctAnswers, setCorrectAnswers] = useState(
    questionData?.correctAnswers || [{ id: 1, answer: "" }]
  );
  const [points, setPoints] = useState(1);
  const [timeLimit, setTimeLimit] = useState(30);
  const [questionImage, setQuestionImage] = useState(null);
  const questionImageInputRef = useRef(null);

  const handleAddAnswer = () => {
    const newId = Math.max(...correctAnswers.map(ans => ans.id)) + 1;
    setCorrectAnswers([...correctAnswers, { id: newId, answer: "" }]);
  };

  const handleRemoveAnswer = (answerId) => {
    if (correctAnswers.length > 1) {
      setCorrectAnswers(correctAnswers.filter(ans => ans.id !== answerId));
    } else {
      message.warning("Question must have at least one correct answer");
    }
  };

  const handleAnswerChange = (answerId, value) => {
    setCorrectAnswers(correctAnswers.map(ans => 
      ans.id === answerId 
        ? { ...ans, answer: value }
        : ans
    ));
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      const hasEmptyAnswers = correctAnswers.some(ans => !ans.answer.trim());
      if (hasEmptyAnswers) {
        message.error("Please fill in all correct answers");
        return;
      }

      const newQuestionData = {
        id: questionData?.id || Date.now(),
        type: "rewrite",
        title: "Re-write",
        question: values.question,
        correctAnswers: correctAnswers,
        correctAnswer: correctAnswers.map(ans => ans.answer).join(", "),
      };

      onSave(newQuestionData);
      form.resetFields();
      setCorrectAnswers([{ id: 1, answer: "" }]);
    });
  };

  const handleQuestionImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setQuestionImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeQuestionImage = () => {
    setQuestionImage(null);
  };

  const handleCancel = () => {
    form.resetFields();
    setCorrectAnswers([{ id: 1, answer: "" }]);
    setQuestionImage(null);
    onCancel();
  };

  const pointsMenu = (
    <Select
      value={points}
      onChange={setPoints}
      style={{ width: 80 }}
      options={[
        { value: 1, label: '1 điểm' },
        { value: 2, label: '2 điểm' },
        { value: 3, label: '3 điểm' },
        { value: 5, label: '5 điểm' },
      ]}
    />
  );

  const timeMenu = (
    <Select
      value={timeLimit}
      onChange={setTimeLimit}
      style={{ width: 100 }}
      options={[
        { value: 15, label: '15 giây' },
        { value: 30, label: '30 giây' },
        { value: 60, label: '1 phút' },
        { value: 120, label: '2 phút' },
        { value: 300, label: '5 phút' },
      ]}
    />
  );

  return (
    <Modal
      title="Create Re-write Question"
      open={visible}
      onCancel={handleCancel}
      width={1400}
      height={800}
      footer={null}
      style={{ top: 20 }}
      bodyStyle={{ height: '85vh', overflow: 'hidden', position: 'relative' }}
    >
      {/* Top Control Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          padding: '12px 16px',
          background: '#f5f5f5',
          borderRadius: 8,
          border: '1px solid #e0e0e0',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type='text'
            icon={<BoldOutlined />}
            style={{ color: '#666' }}
          />
          <Button
            type='text'
            icon={<ItalicOutlined />}
            style={{ color: '#666' }}
          />
          <Button
            type='text'
            icon={<UnderlineOutlined />}
            style={{ color: '#666' }}
          />
          <Button
            type='text'
            icon={<StrikethroughOutlined />}
            style={{ color: '#666' }}
          />
          <Button
            type='text'
            icon={<FontSizeOutlined />}
            style={{ color: '#666' }}
          />
          <div
            style={{
              width: 1,
              height: 20,
              background: '#e0e0e0',
              margin: '0 8px',
            }}
          />
          <Button
            type='text'
            icon={<FunctionOutlined />}
            style={{ color: '#666' }}
          />
          <span style={{ fontSize: 12, color: '#666' }}>
            Chèn kí hiệu toán học
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckOutlined style={{ color: '#52c41a' }} />
            {pointsMenu}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ClockCircleOutlined style={{ color: '#1890ff' }} />
            {timeMenu}
          </div>

          <Button
            type='primary'
            onClick={handleSave}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 6,
            }}>
            Lưu câu hỏi
          </Button>
        </div>
      </div>

      {/* Question Container - Split Layout */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          position: 'relative',
        }}>
        {/* Media Icons */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            display: 'flex',
            gap: 8,
            zIndex: 10,
          }}>
          <Button
            type='text'
            icon={<PictureOutlined />}
            onClick={() => questionImageInputRef.current?.click()}
            style={{
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              zIndex: 11,
            }}
          />
          <Button
            type='text'
            icon={<AudioOutlined />}
            style={{
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              zIndex: 11,
            }}
          />
          <Button
            type='text'
            icon={<VideoCameraOutlined />}
            style={{
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              zIndex: 11,
            }}
          />
        </div>

        {/* Question Container - Split Layout */}
        <div
          style={{
            display: 'flex',
            marginTop: 40,
            height: questionImage ? 200 : 120,
            alignItems: 'center',
            gap: 20,
            padding: 16,
          }}>
          
          {/* Left Side - Question Image */}
          {questionImage && (
            <div style={{ 
              flex: '0 0 15%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={questionImage}
                  alt="Question"
                  style={{
                    width: 180,
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: 12,
                    border: '2px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                />
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={removeQuestionImage}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    background: 'rgba(255,0,0,0.8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    minWidth: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 12,
                  }}
                />
              </div>
            </div>
          )}

          {/* Right Side - Question Input */}
          <div style={{ 
            flex: questionImage ? '0 0 85%' : '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Form
              form={form}
              layout='vertical'
              initialValues={{
                question: questionData?.question || '',
              }}
              style={{ width: '100%' }}>
              <Form.Item
                name='question'
                rules={[
                  { required: true, message: 'Please enter the question text' },
                ]}
                style={{ marginBottom: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    height: questionImage ? 175 : 135,
                    alignItems: 'center',
                    background: 'transparent',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    padding: 16,
                    zIndex: 1,
                  }}>
                  <Input.TextArea
                    placeholder='Nhập câu hỏi vào đây'
                    className='question-textarea'
                    style={{
                      textAlign: 'center',
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      fontSize: 16,
                      resize: 'none',
                      boxShadow: 'none',
                      height: '100%',
                      overflow: 'hidden',
                      width: '100%',
                    }}
                  />
                </div>
              </Form.Item>
            </Form>
          </div>
        </div>

        {/* Hidden file input for question image */}
        <input
          ref={questionImageInputRef}
          type="file"
          accept="image/*"
          onChange={handleQuestionImageUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Correct Answers Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: 16 
        }}>
          <Text strong style={{ fontSize: 16 }}>Đáp án đúng</Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddAnswer}
            style={{
              borderRadius: 8,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none"
            }}
          >
            Thêm đáp án
          </Button>
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: 16 
        }}>
          {correctAnswers.map((answer, index) => (
            <div
              key={answer.id}
              style={{
                background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                border: "2px solid #ef4444",
                borderRadius: 12,
                padding: 20,
                position: "relative"
              }}
            >
              {/* Delete Button */}
              {correctAnswers.length > 1 && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveAnswer(answer.id)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "none"
                  }}
                />
              )}

              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ color: "#ef4444", fontSize: 14 }}>
                  Đáp án {index + 1}
                </Text>
              </div>

              <Input
                value={answer.answer}
                onChange={(e) => handleAnswerChange(answer.id, e.target.value)}
                placeholder={`Nhập đáp án ${index + 1}`}
                style={{
                  borderRadius: 8,
                  border: "1px solid #ef4444",
                  background: "white"
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div style={{ 
        padding: 16, 
        backgroundColor: "#fef2f2", 
        borderRadius: 12,
        border: "1px solid #ef4444"
      }}>
        <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
          💡 <Text strong>Hướng dẫn:</Text> Thêm nhiều đáp án đúng nếu có nhiều cách diễn đạt khác nhau. 
          Học sinh sẽ cần viết lại văn bản theo hướng dẫn của bạn.
        </Text>
        <Text type="secondary" style={{ fontSize: 13 }}>
          📝 <Text strong>Ví dụ:</Text> "Viết lại câu sau ở dạng bị động: 'Con mèo đuổi con chuột.'" 
          → Đáp án: "Con chuột bị con mèo đuổi."
        </Text>
      </div>
    </Modal>
  );
};

export default RewriteModal;
