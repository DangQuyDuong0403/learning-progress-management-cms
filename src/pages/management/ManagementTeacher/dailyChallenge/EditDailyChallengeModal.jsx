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
import { dailyChallengeApi } from "../../../../apis/apis";

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
  const [examConfirmVisible, setExamConfirmVisible] = useState(false);
  const [examCheck, setExamCheck] = useState({
    shuffleQuestion: false,
    hasAntiCheat: false,
    translateOnScreen: false,
  });
  const [challengeStatus, setChallengeStatus] = useState(null);


  
  // Fetch latest detail by id when modal opens; fallback to incoming data
  useEffect(() => {
    const loadDetail = async () => {
      try {
        const id = challengeData?.id;
        if (!id) return;
        const res = await dailyChallengeApi.getDailyChallengeById(id);
        const data = res?.data?.data ?? res?.data ?? res;
        if (data) {
          form.setFieldsValue({
            challengeName: data.challengeName,
            description: data.description,
            challengeType: data.challengeType,
            durationMinutes: data.durationMinutes,
            hasAntiCheat: data.hasAntiCheat || data.antiCheatModeEnabled || false,
            shuffleQuestion: data.shuffleQuestion || data.shuffleAnswers || false,
            translateOnScreen: data.translateOnScreen || false,
            startDate: data.startDate ? dayjs(data.startDate) : null,
            endDate: data.endDate ? dayjs(data.endDate) : null,
          });
          setChallengeMode(data.challengeMethod === 'TEST' ? 'exam' : (data.challengeMode || 'normal'));
          setChallengeStatus(data.challengeStatus || data.status || null);
          return;
        }
      } catch (e) {
        // fall back to incoming data
      }

      if (challengeData) {
        form.setFieldsValue({
          challengeName: challengeData.challengeName,
          description: challengeData.description,
          challengeType: challengeData.challengeType,
          durationMinutes: challengeData.durationMinutes,
          hasAntiCheat: challengeData.hasAntiCheat || challengeData.antiCheatModeEnabled || false,
          shuffleQuestion: challengeData.shuffleQuestion || challengeData.shuffleAnswers || false,
          translateOnScreen: challengeData.translateOnScreen || false,
          startDate: challengeData.startDate ? dayjs(challengeData.startDate) : null,
          endDate: challengeData.endDate ? dayjs(challengeData.endDate) : null,
        });
        setChallengeMode(challengeData.challengeMethod === 'TEST' ? 'exam' : (challengeData.challengeMode || 'normal'));
        setChallengeStatus(challengeData.challengeStatus || challengeData.status || null);
      }
    };

    if (visible) {
      loadDetail();
    }
  }, [visible, challengeData, form]);

  const isInProgress = (challengeStatus || '').toUpperCase() === 'IN_PROGRESS';
  const isClosed = (challengeStatus || '').toUpperCase() === 'CLOSED';

  const performSave = async (values) => {
    try {
      const challengeData = {
        challengeName: values.challengeName,
        description: values.description,
        challengeType: values.challengeType,
        challengeMethod: challengeMode === 'exam' ? 'TEST' : 'NORMAL',
        durationMinutes: values.durationMinutes,
        hasAntiCheat: values.hasAntiCheat || false,
        shuffleQuestion: values.shuffleQuestion || false,
        translateOnScreen: values.translateOnScreen || false,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
      };

      // Wait for the parent to handle the API call
      await onUpdateSuccess(challengeData);
    } finally {
      setIsButtonDisabled(false);
      setIsUpdating(false);
    }
  };

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
      // Validate required fields depending on mode
      const fieldsToValidate = ['startDate', 'endDate'];
      if (challengeMode === 'exam') {
        fieldsToValidate.push('durationMinutes', 'shuffleQuestion', 'hasAntiCheat');
      }
      await form.validateFields(fieldsToValidate);

      if (challengeMode === 'exam') {
        const current = form.getFieldsValue();
        setExamCheck({
          shuffleQuestion: !!current.shuffleQuestion,
          hasAntiCheat: !!current.hasAntiCheat,
          translateOnScreen: !!current.translateOnScreen,
        });
        setExamConfirmVisible(true);
        return; // wait for confirmation modal
      }

      await performSave(form.getFieldsValue());
    } catch (error) {
      console.error('Error in handleModalOk:', error);
      if (error.errorFields) {
        spaceToast.error(t('common.pleaseFillAllRequiredFields'));
      } else {
        spaceToast.error(t('dailyChallenge.updateChallengeError'));
      }
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
                  disabled
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
                    {challengeMode === 'exam' && (
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    )}
                  </span>
                }
                name='durationMinutes'
                rules={[
                  {
                    required: challengeMode === 'exam',
                    message: t('dailyChallenge.durationMinutesRequired'),
                  },
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === null || value === '') return Promise.resolve();
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
                  disabled={isInProgress || isClosed}
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
                dependencies={['startDate']}
                rules={[
                  {
                    required: true,
                    message: t('dailyChallenge.endDateRequired'),
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startDate = getFieldValue('startDate');
                      if (!value || !startDate || !value.isBefore(startDate)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('dailyChallenge.endDateMustBeAfterStartDate') || 'End date must be on or after start date'));
                    },
                  }),
                ]}>
                <DatePicker 
                  style={{ width: '100%', height: '40px' }}
                  placeholder={t('dailyChallenge.selectEndDate')}
                  format="YYYY-MM-DD HH:mm"
                  showTime
                  disabled={isClosed}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
      {/* Exam Mode Confirmation Modal */}
      <Modal
        title={
          <div style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: theme === 'sun' ? 'rgb(113, 179, 253)' : 'rgb(138, 122, 255)',
            textAlign: 'center',
            padding: '10px 0'
          }}>
            {t('dailyChallenge.confirmExamMode') || 'Confirm Exam Mode Settings'}
          </div>
        }
        open={examConfirmVisible}
        onOk={async () => {
          setExamConfirmVisible(false);
          await performSave(form.getFieldsValue());
        }}
        onCancel={() => {
          setExamConfirmVisible(false);
          setIsButtonDisabled(false);
          setIsUpdating(false);
        }}
        okText={t('common.confirm') || 'Confirm'}
        cancelText={t('common.cancel') || 'Cancel'}
        width={560}
        centered
      >
        <div style={{ padding: '8px 4px' }}>
          <Typography.Paragraph style={{ marginBottom: 12, textAlign: 'center' }}>
            {t('dailyChallenge.examWarning') || 'You selected Exam Mode. Please verify the following settings:'}
          </Typography.Paragraph>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Card size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Text strong>{t('dailyChallenge.shuffleQuestion') || 'Shuffle Questions'}</Typography.Text>
                <span style={{ fontWeight: 700, color: examCheck.shuffleQuestion ? '#52c41a' : '#ff4d4f' }}>
                  {examCheck.shuffleQuestion ? (t('common.on') || 'ON') : (t('common.off') || 'OFF')}
                </span>
              </div>
            </Card>
            <Card size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Text strong>{t('dailyChallenge.hasAntiCheat') || 'Anti-Cheat Screen'}</Typography.Text>
                <span style={{ fontWeight: 700, color: examCheck.hasAntiCheat ? '#52c41a' : '#ff4d4f' }}>
                  {examCheck.hasAntiCheat ? (t('common.on') || 'ON') : (t('common.off') || 'OFF')}
                </span>
              </div>
            </Card>
            <Card size="small" style={{ gridColumn: '1 / span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Text strong>{t('dailyChallenge.translateOnScreen') || 'Translate On Screen'}</Typography.Text>
                <span style={{ fontWeight: 700, color: !examCheck.translateOnScreen ? '#52c41a' : '#ff4d4f' }}>
                  {!examCheck.translateOnScreen ? (t('common.off') || 'OFF') : (t('common.on') || 'ON')}
                </span>
              </div>
            </Card>
          </div>
          <Typography.Paragraph style={{ marginTop: 12, color: '#faad14', fontWeight: 600, textAlign: 'center' }}>
            {t('dailyChallenge.examHint') || 'For exam mode, it is recommended: Shuffle ON, Anti-cheat ON, Translate OFF.'}
          </Typography.Paragraph>
        </div>
      </Modal>
    </Modal>
  );
};

export default EditDailyChallengeModal;
