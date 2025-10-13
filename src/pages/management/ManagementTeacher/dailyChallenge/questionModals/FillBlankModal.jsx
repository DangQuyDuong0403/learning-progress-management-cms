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

const FillBlankModal = ({ visible, onCancel, onSave, questionData = null }) => {
  const [form] = Form.useForm();
  const [blanks, setBlanks] = useState(
    questionData?.blanks || [{ id: 1, answer: "" }]
  );
  const [points, setPoints] = useState(1);
  const [timeLimit, setTimeLimit] = useState(30);
  const [questionImage, setQuestionImage] = useState(null);
  const questionImageInputRef = useRef(null);

  const handleAddBlank = () => {
    const newId = Math.max(...blanks.map(blank => blank.id)) + 1;
    setBlanks([...blanks, { id: newId, answer: "" }]);
  };

  const handleRemoveBlank = (blankId) => {
    if (blanks.length > 1) {
      setBlanks(blanks.filter(blank => blank.id !== blankId));
    } else {
      message.warning("Question must have at least one blank");
    }
  };

  const handleBlankChange = (blankId, value) => {
    setBlanks(blanks.map(blank => 
      blank.id === blankId 
        ? { ...blank, answer: value }
        : blank
    ));
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      const hasEmptyBlanks = blanks.some(blank => !blank.answer.trim());
      if (hasEmptyBlanks) {
        message.error("Please fill in all blank answers");
        return;
      }

      const newQuestionData = {
        id: questionData?.id || Date.now(),
        type: "fill-blank",
        title: "Fill in the blank",
        question: values.question,
        blanks: blanks,
        correctAnswer: blanks.map(blank => blank.answer).join(", "),
      };

      onSave(newQuestionData);
      form.resetFields();
      setBlanks([{ id: 1, answer: "" }]);
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
    setBlanks([{ id: 1, answer: "" }]);
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
      title="Create Fill in the Blank Question"
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
                    placeholder='Nhập câu hỏi vào đây (sử dụng ___ hoặc [] để tạo chỗ trống)'
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

      {/* Blank Answers Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: 16 
        }}>
          <Text strong style={{ fontSize: 16 }}>Đáp án cho các chỗ trống</Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddBlank}
            style={{
              borderRadius: 8,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none"
            }}
          >
            Thêm chỗ trống
          </Button>
        </div>

        <div style={{ 
          display: "flex",
          flexDirection: "row",
          gap: 20,
          overflowX: "auto",
          paddingBottom: 16,
          paddingTop: 10,
          minHeight: 200,
        }}>
          {blanks.map((blank, index) => (
            <div
              key={blank.id}
              style={{
                background: "linear-gradient(135deg, #0ea5e9 0%, #0ea5e9dd 100%)",
                borderRadius: 16,
                padding: 24,
                minHeight: 200,
                minWidth: 250,
                width: 250,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                border: "2px solid rgba(255,255,255,0.2)",
                transition: "all 0.3s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
              }}
            >
              {/* Delete Button */}
              {blanks.length > 1 && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveBlank(blank.id)}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    color: "white",
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              )}

              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ color: "white", fontSize: 16 }}>
                  Chỗ trống {index + 1}
                </Text>
              </div>

              <Input
                value={blank.answer}
                onChange={(e) => handleBlankChange(blank.id, e.target.value)}
                placeholder={`Nhập đáp án cho chỗ trống ${index + 1}`}
                style={{
                  borderRadius: 12,
                  border: "2px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: 15,
                  fontWeight: "500",
                  textAlign: "center",
                  padding: "16px 20px",
                  backdropFilter: "blur(10px)",
                  height: 50,
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.2)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Additional Options */}
      <div
        style={{
          marginTop: 24,
          textAlign: 'right',
        }}>
        <Button
          type='link'
          style={{
            color: '#1890ff',
            fontSize: 12,
            padding: 0,
          }}>
          Thêm giải thích cho đáp án
        </Button>
      </div>

      {/* Bottom Action Buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: 15,
          right: 15,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          padding: '12px 16px',
        }}>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button type='primary' onClick={handleSave}>
          Save Question
        </Button>
      </div>
    </Modal>
  );
};

export default FillBlankModal;
