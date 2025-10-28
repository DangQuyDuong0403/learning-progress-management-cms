import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Switch,
  DatePicker,
  Typography,
  Card,
} from "antd";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { spaceToast } from "../../../../component/SpaceToastify";
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const questionTypeOptions = [
  { value: "GV", label: "Grammar & Vocabulary" },
  { value: "RE", label: "Reading" },
  { value: "LI", label: "Listening" },
  { value: "WR", label: "Writing" },
  { value: "SP", label: "Speaking" },
];

const EditDailyChallengeModal = ({
  visible,
  onCancel,
  onUpdateSuccess,
  challengeData,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [form] = Form.useForm();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [challengeMode, setChallengeMode] = useState('normal');


  // Set form values when challengeData changes
  useEffect(() => {
    if (visible && challengeData) {
      form.setFieldsValue({
        challengeName: challengeData.title || challengeData.challengeName,
        description: challengeData.description, 
        challengeType: challengeData.type || challengeData.challengeType,
        durationMinutes: challengeData.timeLimit || challengeData.durationMinutes,
        hasAntiCheat: challengeData.hasAntiCheat || false,
        shuffleQuestion: challengeData.shuffleQuestion || false,
        translateOnScreen: challengeData.translateOnScreen || false,
        startDate: challengeData.startDate ? dayjs(challengeData.startDate) : null,
        endDate: challengeData.endDate ? dayjs(challengeData.endDate) : null,
      });
      setChallengeMode(challengeData.challengeMode || 'normal');
    }
  }, [visible, challengeData, form]);

  const handleModalOk = async () => {
    console.log('handleModalOk called - isButtonDisabled:', isButtonDisabled, 'isUpdating:', isUpdating);
    
    if (isButtonDisabled || isUpdating) {
      console.log('Button is disabled or updating, returning early');
      return;
    }
    
    console.log('Setting loading states...');
    setIsButtonDisabled(true);
    setIsUpdating(true);
    
    try {
      const values = await form.validateFields();
      
      console.log('Updating challenge with data:', values);
      
      const challengeData = {
        challengeName: values.challengeName,
        description: values.description,
        challengeType: values.challengeType,
        challengeMethod: challengeMode === 'exam' ? 'TEST' : 'NORMAL', // Map challengeMode to challengeMethod
        durationMinutes: values.durationMinutes,
        hasAntiCheat: values.hasAntiCheat || false,
        shuffleQuestion: values.shuffleQuestion || false,
        translateOnScreen: values.translateOnScreen || false,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
      };

      // Wait for the parent to handle the API call
      console.log('Calling onUpdateSuccess...');
      await onUpdateSuccess(challengeData);
      console.log('onUpdateSuccess completed');
    } catch (error) {
      console.error('Error in handleModalOk:', error);
      if (error.errorFields) {
        spaceToast.error(t('common.pleaseFillAllRequiredFields'));
      } else {
        spaceToast.error(t('dailyChallenge.updateChallengeError'));
      }
    } finally {
      console.log('Resetting loading states...');
      setIsButtonDisabled(false);
      setIsUpdating(false);
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    setIsButtonDisabled(false);
    setIsUpdating(false);
    onCancel();
  };

  return (
    <Modal
      title={
        <div
          style={{
            fontSize: '28px',
            fontWeight: '600',
            color: theme === 'sun' ? 'rgb(113, 179, 253)' : 'rgb(138, 122, 255)',
            textAlign: 'center',
            padding: '10px 0',
          }}>
          {t('dailyChallenge.editChallenge')}
        </div>
      }
      open={visible}
      onCancel={handleModalCancel}
      width={750}
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
          key="update" 
          type="primary" 
          onClick={handleModalOk}
          disabled={isButtonDisabled}
          loading={isUpdating}
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
          {t('dailyChallenge.updateChallenge')}
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
        {/* Basic Information */}
        <Card 
          title={
            <Typography.Title level={5} style={{ margin: 0, fontSize: '18px', fontWeight: 600, textAlign: 'center' }}>
              {t('dailyChallenge.basicInformation') || 'Basic Information'}
            </Typography.Title>
          }
          style={{ marginBottom: '24px' }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label={
                  <span>
                    {t('dailyChallenge.challengeName')}
                    <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                  </span>
                }
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
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    {t('dailyChallenge.questionType')}
                    <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                  </span>
                }
                name='challengeType'
                rules={[
                  {
                    required: true,
                    message: t('dailyChallenge.questionTypeRequired'),
                  },
                ]}>
                <Select 
                  placeholder={t('dailyChallenge.selectQuestionType')}
                  style={{ height: '40px' }}
                >
                  {questionTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    {t('dailyChallenge.durationMinutes')}
                    <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                  </span>
                }
                name='durationMinutes'
                rules={[
                  {
                    required: true,
                    message: t('dailyChallenge.durationMinutesRequired'),
                  },
                  {
                    validator: (_, value) => {
                      const numValue = Number(value);
                      if (isNaN(numValue)) {
                        return Promise.reject(new Error(t('dailyChallenge.durationMinutesRequired')));
                      }
                      if (numValue < 1 || numValue > 300) {
                        return Promise.reject(new Error(t('dailyChallenge.durationMinutesRange')));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}>
                <Input 
                  type="number"
                  placeholder={t('dailyChallenge.durationMinutesPlaceholder')}
                  style={{ height: '40px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label={t('dailyChallenge.description')}
                name='description'>
                <TextArea 
                  rows={4}
                  placeholder={t('dailyChallenge.descriptionPlaceholder')}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Challenge Mode Selection */}
        <Card 
          title={
            <Typography.Title level={5} style={{ margin: 0, fontSize: '18px', fontWeight: 600, textAlign: 'center' }}>
              {t('dailyChallenge.selectMode')}
            </Typography.Title>
          }
          style={{ marginBottom: '24px' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div
                onClick={() => setChallengeMode('normal')}
                style={{
                  padding: '20px',
                  border: challengeMode === 'normal' ? '3px solid rgb(113, 179, 253)' : '2px solid #d9d9d9',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s',
                  background: challengeMode === 'normal' ? 'rgba(113, 179, 253, 0.1)' : 'transparent',
                  position: 'relative'
                }}
              >
                {challengeMode === 'normal' && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    right: '8px', 
                    fontSize: '20px',
                    color: 'rgb(113, 179, 253)'
                  }}>
                    ✓
                  </div>
                )}
                <div style={{ marginBottom: '12px' }}>
                  <svg width="90" height="68" viewBox="0 0 64 48" fill="none">
                    <rect x="8" y="8" width="48" height="32" rx="4" fill="#8B5CF6"/>
                    <rect x="12" y="28" width="12" height="12" rx="2" fill="#A78BFA"/>
                    <rect x="26" y="28" width="12" height="12" rx="2" fill="#C4B5FD"/>
                    <rect x="40" y="28" width="12" height="12" rx="2" fill="#DDD6FE"/>
                    <rect x="12" y="14" width="40" height="10" rx="2" fill="#DDD6FE"/>
                  </svg>
                </div>
                <Typography.Text strong style={{ fontSize: '16px' }}>
                  {t('dailyChallenge.normalMode')}
                </Typography.Text>
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                  {t('dailyChallenge.normalModeDesc')}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div
                onClick={() => setChallengeMode('exam')}
                style={{
                  padding: '20px',
                  border: challengeMode === 'exam' ? '3px solid rgb(255, 77, 79)' : '2px solid #d9d9d9',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s',
                  background: challengeMode === 'exam' ? 'rgba(255, 77, 79, 0.1)' : 'transparent',
                  position: 'relative'
                }}
              >
                {challengeMode === 'exam' && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    right: '8px', 
                    fontSize: '20px',
                    color: 'rgb(255, 77, 79)'
                  }}>
                    ✓
                  </div>
                )}
                <div style={{ marginBottom: '12px' }}>
                  <svg width="90" height="68" viewBox="0 0 64 48" fill="none">
                    <rect x="8" y="8" width="48" height="32" rx="4" fill="#EF4444"/>
                    <path d="M28 18 L22 24 L20 22" stroke="#fff" strokeWidth="2" fill="none"/>
                    <rect x="28" y="18" width="20" height="2" rx="1" fill="#fff"/>
                    <rect x="28" y="24" width="20" height="2" rx="1" fill="#fff"/>
                    <rect x="28" y="30" width="12" height="2" rx="1" fill="#fff"/>
                  </svg>
                </div>
                <Typography.Text strong style={{ fontSize: '16px' }}>
                  {t('dailyChallenge.examMode')}
                </Typography.Text>
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                  {t('dailyChallenge.examModeDesc')}
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Challenge Settings */}
        <Card 
          title={
            <Typography.Title level={5} style={{ margin: 0, fontSize: '18px', fontWeight: 600, textAlign: 'center' }}>
              {t('dailyChallenge.challengeSettings') || 'Challenge Settings'}
            </Typography.Title>
          }
          style={{ marginBottom: '24px' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <div style={{ flex: 1, paddingRight: '8px' }}>
                  <Typography.Text strong style={{ fontSize: '13px' }}>{t('dailyChallenge.hasAntiCheat')}</Typography.Text>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                    {t('dailyChallenge.hasAntiCheatDesc') || 'Enable anti-cheat features for this challenge'}
                  </div>
                </div>
                <Form.Item name="hasAntiCheat" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <div style={{ flex: 1, paddingRight: '8px' }}>
                  <Typography.Text strong style={{ fontSize: '13px' }}>{t('dailyChallenge.shuffleQuestion')}</Typography.Text>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                    {t('dailyChallenge.shuffleQuestionDesc') || 'Randomize question order for each student'}
                  </div>
                </div>
                <Form.Item name="shuffleQuestion" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <div style={{ flex: 1, paddingRight: '8px' }}>
                  <Typography.Text strong style={{ fontSize: '13px' }}>{t('dailyChallenge.translateOnScreen')}</Typography.Text>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                    {t('dailyChallenge.translateOnScreenDesc') || 'Enable on-screen translation feature'}
                  </div>
                </div>
                <Form.Item name="translateOnScreen" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Schedule Settings */}
        <Card 
          title={
            <Typography.Title level={5} style={{ margin: 0, fontSize: '18px', fontWeight: 600, textAlign: 'center' }}>
              {t('dailyChallenge.scheduleSettings') || 'Schedule Settings'}
            </Typography.Title>
          }
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    {t('dailyChallenge.startDate')}
                    <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                  </span>
                }
                name='startDate'
                rules={[
                  {
                    required: true,
                    message: t('dailyChallenge.startDateRequired'),
                  },
                ]}>
                <DatePicker 
                  style={{ width: '100%', height: '40px' }}
                  placeholder={t('dailyChallenge.selectStartDate')}
                  format="YYYY-MM-DD HH:mm"
                  showTime
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    {t('dailyChallenge.endDate')}
                    <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                  </span>
                }
                name='endDate'
                rules={[
                  {
                    required: true,
                    message: t('dailyChallenge.endDateRequired'),
                  },
                ]}>
                <DatePicker 
                  style={{ width: '100%', height: '40px' }}
                  placeholder={t('dailyChallenge.selectEndDate')}
                  format="YYYY-MM-DD HH:mm"
                  showTime
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </Modal>
  );
};

export default EditDailyChallengeModal;
