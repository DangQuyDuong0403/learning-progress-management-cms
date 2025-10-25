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


  // Set form values when challengeData changes
  useEffect(() => {
    if (visible && challengeData) {
      form.setFieldsValue({
        challengeName: challengeData.title || challengeData.challengeName,
        classLessonId: challengeData.lessonId || challengeData.classLessonId,
        description: challengeData.description, 
        challengeType: challengeData.type || challengeData.challengeType,
        durationMinutes: challengeData.timeLimit || challengeData.durationMinutes,
        hasAntiCheat: challengeData.hasAntiCheat || false,
        shuffleAnswers: challengeData.shuffleAnswers || false,
        translateOnScreen: challengeData.translateOnScreen || false,
        aiFeedbackEnabled: challengeData.aiFeedbackEnabled || false,
        startDate: challengeData.startDate ? dayjs(challengeData.startDate) : null,
        endDate: challengeData.endDate ? dayjs(challengeData.endDate) : null,
      });
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
        classLessonId: values.classLessonId,
        description: values.description,
        challengeType: values.challengeType,
        durationMinutes: values.durationMinutes,
        hasAntiCheat: values.hasAntiCheat || false,
        shuffleAnswers: values.shuffleAnswers || false,
        translateOnScreen: values.translateOnScreen || false,
        aiFeedbackEnabled: values.aiFeedbackEnabled || false,
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
            color: 'rgb(24, 144, 255)',
            textAlign: 'center',
            padding: '10px 0',
          }}>
          {t('dailyChallenge.editChallenge')}
        </div>
      }
      open={visible}
      onCancel={handleModalCancel}
      width={900}
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
        <Row gutter={16}>
          <Col span={12}>
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
          <Col span={12}>
            <Form.Item
              label={t('dailyChallenge.classLesson')}
              name='classLessonId'>
              <Select 
                placeholder={t('dailyChallenge.selectClassLesson')}
                style={{ height: '40px' }}
                disabled={true}
                value={challengeData?.lessonId || challengeData?.classLessonId}
              >
                <Option value={challengeData?.lessonId || challengeData?.classLessonId}>
                  {challengeData?.lessonName || 'Selected Lesson'}
                </Option>
              </Select>
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

        {/* Advanced Settings */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('dailyChallenge.hasAntiCheat')}
              name='hasAntiCheat'
              valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('dailyChallenge.shuffleAnswers')}
              name='shuffleAnswers'
              valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('dailyChallenge.translateOnScreen')}
              name='translateOnScreen'
              valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('dailyChallenge.aiFeedbackEnabled')}
              name='aiFeedbackEnabled'
              valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

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
      </Form>
    </Modal>
  );
};

export default EditDailyChallengeModal;
