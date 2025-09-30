import React, { useState, useRef } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Typography,
  message,
  Space,
  Card,
  Select,
} from "antd";
import { 
  PlusOutlined, 
  DeleteOutlined, 
  DragOutlined,
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

const ReorderModal = ({ visible, onCancel, onSave, questionData = null }) => {
  const [form] = Form.useForm();
  const [items, setItems] = useState(
    questionData?.items || [
      { id: 1, text: "", order: 1 }
    ]
  );
  const [points, setPoints] = useState(1);
  const [timeLimit, setTimeLimit] = useState(30);
  const [questionImage, setQuestionImage] = useState(null);
  const questionImageInputRef = useRef(null);

  const handleAddItem = () => {
    const newId = Math.max(...items.map(item => item.id)) + 1;
    const newOrder = Math.max(...items.map(item => item.order)) + 1;
    setItems([...items, { id: newId, text: "", order: newOrder }]);
  };

  const handleRemoveItem = (itemId) => {
    if (items.length > 1) {
      const removedItem = items.find(item => item.id === itemId);
      setItems(items.filter(item => item.id !== itemId));
      
      // Reorder remaining items
      setItems(prevItems => 
        prevItems.map(item => ({
          ...item,
          order: item.order > removedItem.order ? item.order - 1 : item.order
        }))
      );
    } else {
      message.warning("Question must have at least one item");
    }
  };

  const handleItemChange = (itemId, value) => {
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, text: value }
        : item
    ));
  };

  const handleMoveUp = (itemId) => {
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex > 0) {
      const newItems = [...items];
      [newItems[itemIndex], newItems[itemIndex - 1]] = [newItems[itemIndex - 1], newItems[itemIndex]];
      
      // Update order
      newItems.forEach((item, index) => {
        item.order = index + 1;
      });
      
      setItems(newItems);
    }
  };

  const handleMoveDown = (itemId) => {
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex < items.length - 1) {
      const newItems = [...items];
      [newItems[itemIndex], newItems[itemIndex + 1]] = [newItems[itemIndex + 1], newItems[itemIndex]];
      
      // Update order
      newItems.forEach((item, index) => {
        item.order = index + 1;
      });
      
      setItems(newItems);
    }
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      const hasEmptyItems = items.some(item => !item.text.trim());
      if (hasEmptyItems) {
        message.error("Please fill in all item texts");
        return;
      }

      const newQuestionData = {
        id: questionData?.id || Date.now(),
        type: "reorder",
        title: "Reorder",
        question: values.question,
        items: items,
        correctAnswer: items.map(item => item.text).join(", "),
      };

      onSave(newQuestionData);
      form.resetFields();
      setItems([{ id: 1, text: "", order: 1 }]);
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
    setItems([{ id: 1, text: "", order: 1 }]);
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
      title="Create Reorder Question"
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

      {/* Items Management */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: 16 
        }}>
          <Text strong style={{ fontSize: 16 }}>Các mục cần sắp xếp</Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddItem}
            style={{
              borderRadius: 8,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none"
            }}
          >
            Thêm mục
          </Button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item, index) => (
            <div
              key={item.id}
              style={{
                background: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
                border: "2px solid #8b5cf6",
                borderRadius: 12,
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
                position: "relative"
              }}
            >
              {/* Drag Handle */}
              <DragOutlined style={{ color: "#8b5cf6", fontSize: 18 }} />

              {/* Order Number */}
              <div style={{
                background: "#8b5cf6",
                color: "white",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: 14
              }}>
                {item.order}
              </div>

              {/* Input Field */}
              <Input
                value={item.text}
                onChange={(e) => handleItemChange(item.id, e.target.value)}
                placeholder={`Nhập mục ${item.order}`}
                style={{ 
                  flex: 1, 
                  borderColor: "#8b5cf6",
                  background: "white"
                }}
              />

              {/* Control Buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  type="text"
                  size="small"
                  onClick={() => handleMoveUp(item.id)}
                  disabled={index === 0}
                  style={{
                    background: "rgba(139, 92, 246, 0.1)",
                    border: "1px solid #8b5cf6",
                    color: "#8b5cf6"
                  }}
                >
                  ↑
                </Button>
                <Button
                  type="text"
                  size="small"
                  onClick={() => handleMoveDown(item.id)}
                  disabled={index === items.length - 1}
                  style={{
                    background: "rgba(139, 92, 246, 0.1)",
                    border: "1px solid #8b5cf6",
                    color: "#8b5cf6"
                  }}
                >
                  ↓
                </Button>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveItem(item.id)}
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "none"
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div style={{ 
        padding: 16, 
        backgroundColor: "#f3e8ff", 
        borderRadius: 12,
        border: "1px solid #8b5cf6"
      }}>
        <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
          💡 <Text strong>Hướng dẫn:</Text> Thêm các mục và sắp xếp chúng theo thứ tự đúng bằng các nút lên/xuống. 
          Học sinh sẽ cần kéo thả các mục này theo đúng thứ tự.
        </Text>
        <Text type="secondary" style={{ fontSize: 13 }}>
          📝 <Text strong>Ví dụ:</Text> "Sắp xếp các bước theo thứ tự" → Mục: "Bước 1", "Bước 2", "Bước 3"
        </Text>
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

export default ReorderModal;
