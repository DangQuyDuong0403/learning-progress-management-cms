import React, { useState, useRef } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Typography,
  message,
  Radio,
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

const DropdownModal = ({ visible, onCancel, onSave, questionData = null }) => {
  const [form] = Form.useForm();
  const [dropdowns, setDropdowns] = useState(
    questionData?.dropdowns || [{ id: 1, options: [], correctOption: null }]
  );
  const [points, setPoints] = useState(1);
  const [timeLimit, setTimeLimit] = useState(30);
  const [questionImage, setQuestionImage] = useState(null);
  const questionImageInputRef = useRef(null);

  const handleAddDropdown = () => {
    const newId = Math.max(...dropdowns.map(dd => dd.id)) + 1;
    setDropdowns([...dropdowns, { id: newId, options: [], correctOption: null }]);
  };

  const handleRemoveDropdown = (dropdownId) => {
    if (dropdowns.length > 1) {
      setDropdowns(dropdowns.filter(dd => dd.id !== dropdownId));
    } else {
      message.warning("Question must have at least one dropdown");
    }
  };

  const handleAddOption = (dropdownId) => {
    setDropdowns(dropdowns.map(dd => 
      dd.id === dropdownId 
        ? { ...dd, options: [...dd.options, { id: Date.now(), text: "" }] }
        : dd
    ));
  };

  const handleRemoveOption = (dropdownId, optionId) => {
    setDropdowns(dropdowns.map(dd => 
      dd.id === dropdownId 
        ? { 
            ...dd, 
            options: dd.options.filter(opt => opt.id !== optionId),
            correctOption: dd.correctOption === optionId ? null : dd.correctOption
          }
        : dd
    ));
  };

  const handleOptionChange = (dropdownId, optionId, value) => {
    setDropdowns(dropdowns.map(dd => 
      dd.id === dropdownId 
        ? { 
            ...dd, 
            options: dd.options.map(opt => 
              opt.id === optionId ? { ...opt, text: value } : opt
            )
          }
        : dd
    ));
  };

  const handleCorrectOptionChange = (dropdownId, optionId) => {
    setDropdowns(dropdowns.map(dd => 
      dd.id === dropdownId 
        ? { ...dd, correctOption: optionId }
        : dd
    ));
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      const hasEmptyDropdowns = dropdowns.some(dd => dd.options.length === 0);
      if (hasEmptyDropdowns) {
        message.error("Please add at least one option to each dropdown");
        return;
      }

      const hasEmptyOptions = dropdowns.some(dd => 
        dd.options.some(opt => !opt.text.trim())
      );
      if (hasEmptyOptions) {
        message.error("Please fill in all option texts");
        return;
      }

      const hasNoCorrectOptions = dropdowns.some(dd => !dd.correctOption);
      if (hasNoCorrectOptions) {
        message.error("Please select correct option for each dropdown");
        return;
      }

      const newQuestionData = {
        id: questionData?.id || Date.now(),
        type: "DROPDOWN",
        title: "Dropdown",
        question: values.question,
        dropdowns: dropdowns,
        correctAnswer: dropdowns.map(dd => {
          const correctOpt = dd.options.find(opt => opt.id === dd.correctOption);
          return correctOpt ? correctOpt.text : "";
        }).join(", "),
      };

      onSave(newQuestionData);
      form.resetFields();
      setDropdowns([{ id: 1, options: [], correctOption: null }]);
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
    setDropdowns([{ id: 1, options: [], correctOption: null }]);
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
      title="Create Dropdown Question"
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
                    placeholder='Nhập câu hỏi vào đây (sử dụng [dropdown] để tạo dropdown)'
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

      {/* Dropdown Management */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: 16 
        }}>
          <Text strong style={{ fontSize: 16 }}>Quản lý Dropdown</Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddDropdown}
            style={{
              borderRadius: 8,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none"
            }}
          >
            Thêm Dropdown
          </Button>
        </div>

        {dropdowns.map((dropdown, index) => (
          <div
            key={dropdown.id}
            style={{
              background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
              border: "2px solid #f59e0b",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              position: "relative"
            }}
          >
            {/* Delete Dropdown Button */}
            {dropdowns.length > 1 && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveDropdown(dropdown.id)}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "none"
                }}
              />
            )}

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ color: "#f59e0b", fontSize: 16 }}>
                Dropdown {index + 1}
              </Text>
            </div>

            {/* Add Option Button */}
            <div style={{ marginBottom: 16 }}>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => handleAddOption(dropdown.id)}
                style={{
                  borderColor: "#f59e0b",
                  color: "#f59e0b",
                  background: "rgba(245, 158, 11, 0.1)"
                }}
              >
                Thêm tùy chọn
              </Button>
            </div>

            {/* Options List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {dropdown.options.map((option, optIndex) => (
                <div
                  key={option.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    backgroundColor: "white",
                    borderRadius: 8,
                    border: "1px solid #f59e0b",
                  }}
                >
                  <Radio
                    checked={dropdown.correctOption === option.id}
                    onChange={() => handleCorrectOptionChange(dropdown.id, option.id)}
                    style={{ color: "#f59e0b" }}
                  />
                  <Text style={{ minWidth: 80, fontWeight: 600, color: "#f59e0b" }}>
                    Tùy chọn {optIndex + 1}:
                  </Text>
                  <Input
                    value={option.text}
                    onChange={(e) => handleOptionChange(dropdown.id, option.id, e.target.value)}
                    placeholder={`Nhập tùy chọn ${optIndex + 1}`}
                    style={{ flex: 1, borderColor: "#f59e0b" }}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveOption(dropdown.id, option.id)}
                    size="small"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
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
    </Modal>
  );
};

export default DropdownModal;
