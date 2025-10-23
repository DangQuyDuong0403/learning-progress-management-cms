import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
} from "antd";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { spaceToast } from "../../../../component/SpaceToastify";

const { TextArea } = Input;
const { Option } = Select;

const challengeTypeOptions = [
  { value: "Grammar & Vocabulary", label: "Grammar & Vocabulary" },
  { value: "Reading", label: "Reading" },
  { value: "Writing", label: "Writing" },
  { value: "Listening", label: "Listening" },
  { value: "Speaking", label: "Speaking" },
];

const SimpleDailyChallengeModal = ({
  visible,
  onCancel,
  onCreateSuccess,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [form] = Form.useForm();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const handleModalOk = async () => {
    if (isButtonDisabled) return;
    
    setIsButtonDisabled(true);
    
    try {
      const values = await form.validateFields();
      
      console.log('Creating challenge with data:', values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const challengeData = {
        title: values.challengeName,
        classLessonName: values.classLessonName,
        description: values.description,
        type: values.challengeType,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        totalQuestions: 0,
        timeLimit: 30,
      };

      spaceToast.success(t('dailyChallenge.createChallengeSuccess'));
      form.resetFields();
      onCreateSuccess(challengeData);
    } catch (error) {
      console.error('Validation error:', error);
      if (error.errorFields) {
        spaceToast.error(t('common.pleaseFillAllRequiredFields'));
      } else {
        spaceToast.error(t('dailyChallenge.createChallengeError'));
      }
    } finally {
      setIsButtonDisabled(false);
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    setIsButtonDisabled(false);
    onCancel();
  };

  return (
    <Modal
      title={
        <div
          style={{
            fontSize: '28px',
            fontWeight: '600',
            color: 'rgb(24, 144, 255)',
            textAlign: 'center',
            padding: '10px 0',
          }}>
          {t('dailyChallenge.createNewChallenge')}
        </div>
      }
      open={visible}
      onCancel={handleModalCancel}
      width={800}
      footer={[
        <Button 
          key="cancel" 
          onClick={handleModalCancel}
          style={{
            height: '32px',
            fontWeight: '500',
            fontSize: '16px',
            padding: '4px 15px',
            width: '100px'
          }}>
          {t('common.cancel')}
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          onClick={handleModalOk}
          disabled={isButtonDisabled}
          style={{
            background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
            borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
            color: theme === 'sun' ? '#000' : '#fff',
            borderRadius: '6px',
            height: '32px',
            fontWeight: '500',
            fontSize: '16px',
            padding: '4px 15px',
            width: '160px',
            transition: 'all 0.3s ease',
            boxShadow: 'none'
          }}
          onMouseEnter={(e) => {
            if (theme === 'sun') {
              e.target.style.background = 'rgb(95, 160, 240)';
              e.target.style.borderColor = 'rgb(95, 160, 240)';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(113, 179, 253, 0.4)';
            } else {
              e.target.style.background = 'linear-gradient(135deg, #5a1fb8 0%, #8a7aff 100%)';
              e.target.style.borderColor = '#5a1fb8';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(114, 40, 217, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (theme === 'sun') {
              e.target.style.background = 'rgb(113, 179, 253)';
              e.target.style.borderColor = 'rgb(113, 179, 253)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            } else {
              e.target.style.background = 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)';
              e.target.style.borderColor = '#7228d9';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }
          }}>
          {t('dailyChallenge.createChallenge')}
        </Button>,
      ]}
      centered
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: '24px' }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('dailyChallenge.challengeName')}
              name='challengeName'
              rules={[
                {
                  required: true,
                  message: t('dailyChallenge.challengeNameRequired'),
                },
              ]}>
              <Input 
                placeholder={t('dailyChallenge.challengeNamePlaceholder')}
                style={{ height: '40px' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('dailyChallenge.classLessonName')}
              name='classLessonName'
              rules={[
                {
                  required: true,
                  message: t('dailyChallenge.classLessonNameRequired'),
                },
              ]}>
              <Input 
                placeholder={t('dailyChallenge.classLessonNamePlaceholder')}
                style={{ height: '40px' }}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label={t('dailyChallenge.type')}
              name='challengeType'
              rules={[
                {
                  required: true,
                  message: t('dailyChallenge.challengeTypeRequired'),
                },
              ]}>
              <Select 
                placeholder={t('dailyChallenge.selectChallengeType')}
                style={{ height: '40px' }}
              >
                {challengeTypeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label={t('dailyChallenge.description')}
              name='description'
              rules={[
                {
                  required: true,
                  message: t('dailyChallenge.descriptionRequired'),
                },
              ]}>
              <TextArea 
                rows={4}
                placeholder={t('dailyChallenge.descriptionPlaceholder')}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default SimpleDailyChallengeModal;

