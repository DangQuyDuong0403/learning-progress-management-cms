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

const DragDropModal = ({ visible, onCancel, onSave, questionData = null }) => {
  const [form] = Form.useForm();
  const [draggableItems, setDraggableItems] = useState(
    questionData?.draggableItems || [
      { id: 1, text: "", isCorrect: false, targetPosition: 1 }
    ]
  );
  const [dropTargets, setDropTargets] = useState(
    questionData?.dropTargets || [
      { id: 1, label: "Target 1", correctItem: null }
    ]
  );
  const [points, setPoints] = useState(1);
  const [timeLimit, setTimeLimit] = useState(30);
  const [questionImage, setQuestionImage] = useState(null);
  const questionImageInputRef = useRef(null);

  const handleAddDraggableItem = () => {
    const newId = Math.max(...draggableItems.map(item => item.id)) + 1;
    setDraggableItems([...draggableItems, { 
      id: newId, 
      text: "", 
      isCorrect: false, 
      targetPosition: null 
    }]);
  };

  const handleRemoveDraggableItem = (itemId) => {
    if (draggableItems.length > 1) {
      setDraggableItems(draggableItems.filter(item => item.id !== itemId));
      // Remove from drop targets if it was assigned
      setDropTargets(dropTargets.map(target => 
        target.correctItem === itemId 
          ? { ...target, correctItem: null }
          : target
      ));
    } else {
      message.warning("Question must have at least one draggable item");
    }
  };

  const handleAddDropTarget = () => {
    const newId = Math.max(...dropTargets.map(target => target.id)) + 1;
    setDropTargets([...dropTargets, { 
      id: newId, 
      label: `Target ${newId}`, 
      correctItem: null 
    }]);
  };

  const handleRemoveDropTarget = (targetId) => {
    if (dropTargets.length > 1) {
      setDropTargets(dropTargets.filter(target => target.id !== targetId));
    } else {
      message.warning("Question must have at least one drop target");
    }
  };

  const handleDraggableItemChange = (itemId, field, value) => {
    setDraggableItems(draggableItems.map(item => 
      item.id === itemId 
        ? { ...item, [field]: value }
        : item
    ));
  };

  const handleDropTargetChange = (targetId, field, value) => {
    setDropTargets(dropTargets.map(target => 
      target.id === targetId 
        ? { ...target, [field]: value }
        : target
    ));
  };

  const handleAssignCorrectItem = (targetId, itemId) => {
    // Remove previous assignment if any
    setDropTargets(dropTargets.map(target => 
      target.correctItem === itemId 
        ? { ...target, correctItem: null }
        : target
    ));
    
    // Assign new item
    setDropTargets(dropTargets.map(target => 
      target.id === targetId 
        ? { ...target, correctItem: itemId }
        : target
    ));
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      const hasEmptyItems = draggableItems.some(item => !item.text.trim());
      if (hasEmptyItems) {
        message.error("Please fill in all draggable item texts");
        return;
      }

      const hasEmptyTargets = dropTargets.some(target => !target.label.trim());
      if (hasEmptyTargets) {
        message.error("Please fill in all drop target labels");
        return;
      }

      const hasUnassignedTargets = dropTargets.some(target => !target.correctItem);
      if (hasUnassignedTargets) {
        message.error("Please assign correct items to all drop targets");
        return;
      }

      const newQuestionData = {
        id: questionData?.id || Date.now(),
        type: "DRAG_DROP",
        title: "Drag and drop",
        question: values.question,
        draggableItems: draggableItems,
        dropTargets: dropTargets,
        correctAnswer: dropTargets.map(target => {
          const correctItem = draggableItems.find(item => item.id === target.correctItem);
          return `${target.label}: ${correctItem ? correctItem.text : ""}`;
        }).join(", "),
      };

      onSave(newQuestionData);
      form.resetFields();
      setDraggableItems([{ id: 1, text: "", isCorrect: false, targetPosition: 1 }]);
      setDropTargets([{ id: 1, label: "Target 1", correctItem: null }]);
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
    setDraggableItems([{ id: 1, text: "", isCorrect: false, targetPosition: 1 }]);
    setDropTargets([{ id: 1, label: "Target 1", correctItem: null }]);
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
      title="Create Drag and Drop Question"
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

      <div style={{ display: "flex", gap: 24 }}>
        {/* Draggable Items */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: 16 
          }}>
            <Text strong style={{ fontSize: 16 }}>Các mục có thể kéo</Text>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddDraggableItem}
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
            {draggableItems.map((item, index) => (
              <div
                key={item.id}
                style={{
                  background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                  border: "2px solid #10b981",
                  borderRadius: 12,
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  position: "relative"
                }}
              >
                <DragOutlined style={{ color: "#10b981", fontSize: 18 }} />
                <Text style={{ minWidth: 80, fontWeight: 600, color: "#10b981" }}>
                  Mục {index + 1}:
                </Text>
                <Input
                  value={item.text}
                  onChange={(e) => handleDraggableItemChange(item.id, "text", e.target.value)}
                  placeholder={`Nhập mục ${index + 1}`}
                  style={{ 
                    flex: 1, 
                    borderColor: "#10b981",
                    background: "white"
                  }}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveDraggableItem(item.id)}
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "none"
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Drop Targets */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: 16 
          }}>
            <Text strong style={{ fontSize: 16 }}>Vị trí thả</Text>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddDropTarget}
              style={{
                borderRadius: 8,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none"
              }}
            >
              Thêm vị trí
            </Button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {dropTargets.map((target, index) => (
              <div
                key={target.id}
                style={{
                  background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  border: "2px solid #f59e0b",
                  borderRadius: 12,
                  padding: 20,
                  position: "relative"
                }}
              >
                {/* Delete Target Button */}
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveDropTarget(target.id)}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "none"
                  }}
                />

                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ color: "#f59e0b", fontSize: 16 }}>
                    Vị trí {index + 1}
                  </Text>
                </div>

                <Input
                  value={target.label}
                  onChange={(e) => handleDropTargetChange(target.id, "label", e.target.value)}
                  placeholder="Nhập nhãn vị trí"
                  style={{ 
                    marginBottom: 16, 
                    borderColor: "#f59e0b",
                    background: "white"
                  }}
                />
                
                <div style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: "#f59e0b", fontWeight: 600 }}>
                    Mục đúng:
                  </Text>
                </div>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {draggableItems.map(item => (
                    <Button
                      key={item.id}
                      type={target.correctItem === item.id ? "primary" : "default"}
                      size="small"
                      onClick={() => handleAssignCorrectItem(target.id, item.id)}
                      style={{
                        background: target.correctItem === item.id 
                          ? "#f59e0b" 
                          : "white",
                        borderColor: "#f59e0b",
                        color: target.correctItem === item.id 
                          ? "white" 
                          : "#f59e0b"
                      }}
                    >
                      {item.text || `Mục ${item.id}`}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div style={{ 
        marginTop: 24,
        padding: 16, 
        backgroundColor: "#e6f7ff", 
        borderRadius: 12,
        border: "1px solid #0ea5e9"
      }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          💡 <Text strong>Hướng dẫn:</Text> Tạo các mục có thể kéo và vị trí thả. Gán mục đúng cho mỗi vị trí bằng cách click vào nút mục.
        </Text>
      </div>
    </Modal>
  );
};

export default DragDropModal;
