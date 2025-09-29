import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Card,
  Row,
  Col,
  Space,
  Typography,
  Divider,
} from "antd";
import {
  BookOutlined,
  FileTextOutlined,
  EditOutlined,
  SoundOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { spaceToast } from "../../../../component/SpaceToastify";
import ROUTER_PAGE from "../../../../constants/router";

const { Title, Text } = Typography;


const challengeTypes = [
  {
    id: 1,
    type: "Grammar & Vocabulary",
    icon: <BookOutlined style={{ fontSize: 24 }} />,
    color: "#7228d9",
    description: "Grammar rules and vocabulary exercises",
  },
  {
    id: 2,
    type: "Reading",
    icon: <FileTextOutlined style={{ fontSize: 24 }} />,
    color: "#1890ff",
    description: "Reading comprehension and analysis",
  },
  {
    id: 3,
    type: "Writing",
    icon: <EditOutlined style={{ fontSize: 24 }} />,
    color: "#52c41a",
    description: "Writing exercises and essay composition",
  },
  {
    id: 4,
    type: "Listening",
    icon: <SoundOutlined style={{ fontSize: 24 }} />,
    color: "#fa8c16",
    description: "Listening comprehension and audio exercises",
  },
  {
    id: 5,
    type: "Speaking",
    icon: <MessageOutlined style={{ fontSize: 24 }} />,
    color: "#f5222d",
    description: "Oral communication and presentation skills",
  },
];

const CreateDailyChallengeModal = ({
  visible,
  onCancel,
  onCreateSuccess,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedChallengeType, setSelectedChallengeType] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

  useEffect(() => {
    if (selectedChapter) {
      setSelectedLesson(null); // Reset lesson selection
      form.setFieldsValue({ lessonId: null });
    } else {
      setSelectedLesson(null);
    }
  }, [selectedChapter, form]);

  const handleSubmit = async (values) => {
    if (!selectedChallengeType) {
      spaceToast.error(t('dailyChallenge.selectChallengeType'));
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const challengeData = {
        ...values,
        type: selectedChallengeType.type,
        chapterId: selectedChapter,
        lessonId: selectedLesson,
        status: 'draft',
        createdAt: new Date().toISOString().split('T')[0],
      };

      spaceToast.success(t('dailyChallenge.createChallengeSuccess'));
      form.resetFields();
      setSelectedChallengeType(null);
      setSelectedChapter(null);
      setSelectedLesson(null);
      onCreateSuccess(challengeData);
    } catch (error) {
      spaceToast.error(t('dailyChallenge.createChallengeError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeTypeSelect = (typeId) => {
    const type = challengeTypes.find(t => t.id === typeId);
    
    // If Grammar & Vocabulary is selected, navigate to the specialized page
    if (typeId === 1 || type.type === "Grammar & Vocabulary") {
      onCancel(); // Close the modal first
      navigate(ROUTER_PAGE.TEACHER_CREATE_GRAMMAR_VOCAB_CHALLENGE);
      return;
    }
    
    // If Reading is selected, navigate to the reading challenge page
    if (typeId === 2 || type.type === "Reading") {
      onCancel(); // Close the modal first
      navigate(ROUTER_PAGE.TEACHER_CREATE_READING_CHALLENGE);
      return;
    }
    
    setSelectedChallengeType(type);
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedChallengeType(null);
    setSelectedChapter(null);
    setSelectedLesson(null);
    onCancel();
  };

  const ChallengeTypeCard = ({ challengeType, isSelected, onClick }) => (
    <Card
      hoverable
      className={`challenge-type-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(challengeType.id)}
      style={{
        border: isSelected ? `2px solid ${challengeType.color}` : '1px solid #d9d9d9',
        background: isSelected ? `${challengeType.color}10` : '#fff',
      }}
    >
      <Row align="middle" gutter={[12, 0]}>
        <Col>
          <div style={{ color: challengeType.color }}>
            {challengeType.icon}
          </div>
        </Col>
        <Col flex={1}>
          <Title level={5} style={{ 
            margin: 0,
            color: challengeType.color,
            fontSize: '16px',
            fontWeight: isSelected ? 600 : 400,
          }}>
            {challengeType.type}
          </Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {challengeType.description}
          </Text>
        </Col>
      </Row>
    </Card>
  );

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>
            {t('dailyChallenge.createNewChallenge')}
          </Title>
          <Text type="secondary">
            {t('dailyChallenge.selectChallengeTypeAndConfigure')}
          </Text>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={1000}
      footer={null}
      centered
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="create-challenge-form"
      >
        {/* Challenge Type Selection */}
        <div style={{ marginBottom: 32 }}>
          <Title level={4} style={{ marginBottom: 16 }}>
            {t('dailyChallenge.selectChallengeType')}
          </Title>
          <Row gutter={[16, 16]}>
            {challengeTypes.map((challengeType) => (
              <Col xs={24} sm={12} md={8} lg={8} key={challengeType.id}>
                <ChallengeTypeCard
                  challengeType={challengeType}
                  isSelected={selectedChallengeType?.id === challengeType.id}
                  onClick={handleChallengeTypeSelect}
                />
              </Col>
            ))}
          </Row>
        </div>

        <Divider />

      

        {/* Action Buttons */}
        <div style={{ textAlign: 'right', paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
          <Space>
            <Button onClick={handleCancel}>
              {t('dailyChallenge.cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!selectedChallengeType}
            >
              {t('dailyChallenge.createChallenge')}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateDailyChallengeModal;
