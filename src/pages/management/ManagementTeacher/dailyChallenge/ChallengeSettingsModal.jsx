import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Row,
  Col,
  Switch,
  DatePicker,
  InputNumber,
  Typography,
  Card,
} from "antd";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { spaceToast } from "../../../../component/SpaceToastify";
import { dailyChallengeApi } from "../../../../apis/apis";
import dayjs from "dayjs";

// Helper function to get full challenge type name
const getChallengeTypeName = (typeCode) => {
  const typeMap = {
    'GV': 'Grammar & Vocabulary',
    'RE': 'Reading',
    'LI': 'Listening',
    'WR': 'Writing',
    'SP': 'Speaking',
  };
  
  return typeMap[typeCode] || typeCode || 'Unknown';
};

const ChallengeSettingsModal = ({
  visible,
  onCancel,
  onSave,
  initialValues = {},
  challengeId,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [form] = Form.useForm();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [challengeMode, setChallengeMode] = useState(initialValues.challengeMode || 'normal');

  useEffect(() => {
    if (visible) {
      // Set form values when modal opens
      form.setFieldsValue({
        durationMinutes: initialValues.durationMinutes,
        startDate: initialValues.startDate ? dayjs(initialValues.startDate) : null,
        endDate: initialValues.endDate ? dayjs(initialValues.endDate) : null,
        shuffleAnswers: initialValues.shuffleAnswers || false,
        translateOnScreen: initialValues.translateOnScreen || false,
        aiFeedbackEnabled: initialValues.aiFeedbackEnabled || false,
        antiCheatModeEnabled: initialValues.antiCheatModeEnabled || false,
      });
      setChallengeMode(initialValues.challengeMode || 'normal');
    }
  }, [visible, initialValues, form]);

  const handleModalOk = async () => {
    if (isButtonDisabled || isSaving) return;
    
    setIsButtonDisabled(true);
    setIsSaving(true);
    
    try {
      const values = await form.validateFields();
      
      const updateData = {
        challengeName: initialValues.challengeName || 'Daily Challenge', // Use existing name or default
        description: initialValues.description || '', // Use existing description or empty
        challengeType: initialValues.challengeType || 'GV', // Use existing type or default
        durationMinutes: values.durationMinutes,
        hasAntiCheat: values.antiCheatModeEnabled || false,
        shuffleAnswers: values.shuffleAnswers || false,
        translateOnScreen: values.translateOnScreen || false,
        aiFeedbackEnabled: values.aiFeedbackEnabled || false,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
      };

      console.log('Updating challenge settings with data:', updateData);
      
      // Call API to update challenge settings
      const response = await dailyChallengeApi.updateDailyChallenge(challengeId, updateData);
      console.log('API response:', response);
      
      spaceToast.success(response.message);
      
      // Notify parent component
      onSave({
        challengeMode,
        durationMinutes: values.durationMinutes,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
        shuffleAnswers: values.shuffleAnswers || false,
        translateOnScreen: values.translateOnScreen || false,
        aiFeedbackEnabled: values.aiFeedbackEnabled || false,
        antiCheatModeEnabled: values.antiCheatModeEnabled || false,
      });
      
    } catch (error) {
      console.error('Error updating challenge settings:', error);
      if (error.errorFields) {
        spaceToast.error(t('common.pleaseFillAllRequiredFields') || 'Please fill all required fields');
      } else {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || t('dailyChallenge.updateSettingsError') || 'Failed to update settings';
        spaceToast.error(errorMessage);
      }
    } finally {
      setIsButtonDisabled(false);
      setIsSaving(false);
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    setIsButtonDisabled(false);
    setIsSaving(false);
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
          {t('dailyChallenge.editSettings') || 'Edit Challenge Settings'}
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
          key="save" 
          type="primary" 
          onClick={handleModalOk}
          disabled={isButtonDisabled}
          loading={isSaving}
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
          {t('common.saveChanges')}
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
         {/* Challenge Information */}
         <Card 
           title={
             <Typography.Title level={5} style={{ margin: 0, fontSize: '18px', fontWeight: 600, textAlign: 'center' }}>
               {t('dailyChallenge.challengeInformation') || 'Challenge Information'}
             </Typography.Title>
           }
           style={{ marginBottom: '24px' }}
         >
           <Row gutter={[16, 16]}>
             <Col span={12}>
               <div style={{ textAlign: 'center' }}>
                 <Typography.Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                   {t('dailyChallenge.challengeName') || 'Challenge Name'}
                 </Typography.Text>
                 <Typography.Text strong style={{ fontSize: '14px' }}>
                   {initialValues.challengeName || 'N/A'}
                 </Typography.Text>
               </div>
             </Col>
             <Col span={12}>
               <div style={{ textAlign: 'center' }}>
                 <Typography.Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                   {t('dailyChallenge.questionType') || 'Question Type'}
                 </Typography.Text>
                 <Typography.Text strong style={{ fontSize: '14px' }}>
                   {initialValues.challengeType ? getChallengeTypeName(initialValues.challengeType) : 'N/A'}
                 </Typography.Text>
               </div>
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

         {/* Challenge Configuration */}
         <Card 
           title={
             <Typography.Title level={5} style={{ margin: 0, fontSize: '18px', fontWeight: 600, textAlign: 'center' }}>
               {t('dailyChallenge.challengeConfiguration')}
             </Typography.Title>
           }
           style={{ marginBottom: '24px' }}
         >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label={t('dailyChallenge.durationMinutes')}
                name="durationMinutes"
              >
                <InputNumber
                  min={1}
                  max={999}
                  placeholder={t('dailyChallenge.enterDuration')}
                  style={{ width: '100%' }}
                  addonAfter={t('dailyChallenge.minutes')}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('dailyChallenge.startDate')}
                name="startDate"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder={t('dailyChallenge.selectStartDate')}
                  format="DD/MM/YYYY HH:mm"
                  showTime
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('dailyChallenge.endDate')}
                name="endDate"
                dependencies={['startDate']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startDate = getFieldValue('startDate');
                      if (!value || !startDate || value.isAfter(startDate)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('dailyChallenge.endDateMustBeAfterStartDate') || 'End date must be after start date!'));
                    },
                  }),
                ]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder={t('dailyChallenge.selectEndDate')}
                  format="DD/MM/YYYY HH:mm"
                  showTime
                  disabledDate={(current) => {
                    const startDate = form.getFieldValue('startDate');
                    return startDate && current && current.isBefore(startDate, 'day');
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

         {/* Learning & Security Settings */}
         <Card 
           title={
             <Typography.Title level={5} style={{ margin: 0, fontSize: '18px', fontWeight: 600, textAlign: 'center' }}>
               {t('dailyChallenge.learningSecuritySettings')}
             </Typography.Title>
           }
         >
           <Row gutter={[16, 16]}>
             <Col span={12}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                 <div style={{ flex: 1, paddingRight: '8px' }}>
                   <Typography.Text strong style={{ fontSize: '13px' }}>{t('dailyChallenge.shuffleAnswers')}</Typography.Text>
                   <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                     {t('dailyChallenge.shuffleAnswersDesc')}
                   </div>
                 </div>
                 <Form.Item name="shuffleAnswers" valuePropName="checked" noStyle>
                   <Switch />
                 </Form.Item>
               </div>
             </Col>
             <Col span={12}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                 <div style={{ flex: 1, paddingRight: '8px' }}>
                   <Typography.Text strong style={{ fontSize: '13px' }}>{t('dailyChallenge.translateOnScreen')}</Typography.Text>
                   <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                     {t('dailyChallenge.translateOnScreenDesc')}
                   </div>
                 </div>
                 <Form.Item name="translateOnScreen" valuePropName="checked" noStyle>
                   <Switch />
                 </Form.Item>
               </div>
             </Col>
             <Col span={12}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                 <div style={{ flex: 1, paddingRight: '8px' }}>
                   <Typography.Text strong style={{ fontSize: '13px' }}>{t('dailyChallenge.aiFeedback')}</Typography.Text>
                   <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                     {t('dailyChallenge.aiFeedbackDesc')}
                   </div>
                 </div>
                 <Form.Item name="aiFeedbackEnabled" valuePropName="checked" noStyle>
                   <Switch />
                 </Form.Item>
               </div>
             </Col>
             <Col span={12}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                 <div style={{ flex: 1, paddingRight: '8px' }}>
                   <Typography.Text strong style={{ fontSize: '13px' }}>{t('dailyChallenge.antiCheatMode')}</Typography.Text>
                   <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                     {t('dailyChallenge.antiCheatModeDesc')}
                   </div>
                 </div>
                 <Form.Item name="antiCheatModeEnabled" valuePropName="checked" noStyle>
                   <Switch />
                 </Form.Item>
               </div>
             </Col>
           </Row>
         </Card>
      </Form>
    </Modal>
  );
};

export default ChallengeSettingsModal;

