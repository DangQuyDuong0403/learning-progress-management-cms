import React, { useState, useEffect } from "react";
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
// API fetching removed; lessons are supplied by parent
import { dailyChallengeApi } from "../../../../apis/apis";

const { TextArea } = Input;
const { Option } = Select;

const questionTypeOptions = [
  { value: "GV" },
  { value: "RE" },
  { value: "LI" },
  { value: "WR" },
  { value: "SP" },
];

const SimpleDailyChallengeModal = ({
  visible,
  onCancel,
  onCreateSuccess,
  lessonData,
  lessonsFromList = [],
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [form] = Form.useForm();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [namePrefix, setNamePrefix] = useState('');
  
  // Check if challengeType is already set from modal
  const challengeTypeAlreadySet = !!lessonData?.challengeType;
  
  // Prefix options based on challenge types
  const prefixOptions = [
    { value: '[Grammar&Vocabulary]', label: t('dailyChallenge.typeNames.GV', 'Grammar & Vocabulary') },
    { value: '[Speaking]', label: t('dailyChallenge.typeNames.SP', 'Speaking') },
    { value: '[Writing]', label: t('dailyChallenge.typeNames.WR', 'Writing') },
    { value: '[Reading]', label: t('dailyChallenge.typeNames.RE', 'Reading') },
    { value: '[Listening]', label: t('dailyChallenge.typeNames.LI', 'Listening') },
  ];
  // Populate lessons from parent list when available
  useEffect(() => {
    if (visible) {
      if (lessonsFromList && lessonsFromList.length > 0) {
        setLessons(lessonsFromList.map(l => ({ id: l.id, lessonName: l.lessonName, name: l.lessonName, content: '' })));
      } else {
        setLessons([]);
      }
    }
  }, [visible, lessonsFromList]);

  // Auto-populate lesson and challengeType when lessonData is provided
  useEffect(() => {
    if (visible && lessonData) {
      const fieldsToSet = {};
      
      // Only set classLessonId if it exists (when coming from table row)
      if (lessonData.classLessonId) {
        fieldsToSet.classLessonId = lessonData.classLessonId;
      }
      
      // Set challengeType if it exists (when coming from type selection modal)
      if (lessonData.challengeType) {
        fieldsToSet.challengeType = lessonData.challengeType;
        // Auto-set prefix based on challenge type
        const prefixMap = {
          'GV': '[Grammar&Vocabulary]',
          'SP': '[Speaking]',
          'WR': '[Writing]',
          'RE': '[Reading]',
          'LI': '[Listening]',
        };
        const autoPrefix = prefixMap[lessonData.challengeType];
        if (autoPrefix) {
          setNamePrefix(autoPrefix);
        }
      }
      
      form.setFieldsValue(fieldsToSet);
    } else if (!visible) {
      // Reset prefix when modal closes
      setNamePrefix('');
    }
  }, [visible, lessonData, form]);

  const handleModalOk = async () => {
    if (isButtonDisabled) return;
    
    setIsButtonDisabled(true);
    
    try {
      const values = await form.validateFields();
      
      // Ensure challengeType is set - use from lessonData if not in form values
      const challengeType = values.challengeType || lessonData?.challengeType;
      
      // Combine prefix with challenge name
      const finalChallengeName = namePrefix 
        ? `${namePrefix} ${values.challengeName}`.trim()
        : values.challengeName;
      
      const challengeData = {
        challengeName: finalChallengeName,
        classLessonId: values.classLessonId,
        description: values.description,
        challengeType: challengeType,
      };

      // Call the actual API
      const response = await dailyChallengeApi.createDailyChallenge(challengeData);
      
      // Extract challenge ID and other data from response
      let createdChallenge = challengeData;
      if (response?.data?.data) {
        createdChallenge = { ...challengeData, ...response.data.data };
      } else if (response?.data) {
        createdChallenge = { ...challengeData, ...response.data };
      }

      spaceToast.success(t('dailyChallenge.createChallengeSuccess'));
      form.resetFields();
      onCreateSuccess(createdChallenge);
    } catch (error) {
      console.error('Error creating challenge:', error);
      if (error.errorFields) {
        spaceToast.error(t('common.pleaseFillAllRequiredFields'));
      } else {
        const errorMessage = error.response?.data?.error || error.message || t('dailyChallenge.createChallengeError');
        spaceToast.error(errorMessage);
      }
    } finally {
      setIsButtonDisabled(false);
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    setNamePrefix('');
    setIsButtonDisabled(false);
    onCancel();
  };
  
  // Auto-update prefix when challengeType changes in form
  const challengeTypeValue = Form.useWatch('challengeType', form);
  useEffect(() => {
    const challengeType = challengeTypeValue || lessonData?.challengeType;
    if (challengeType) {
      const prefixMap = {
        'GV': '[Grammar&Vocabulary]',
        'SP': '[Speaking]',
        'WR': '[Writing]',
        'RE': '[Reading]',
        'LI': '[Listening]',
      };
      const autoPrefix = prefixMap[challengeType];
      if (autoPrefix) {
        setNamePrefix(autoPrefix);
      }
    }
  }, [challengeTypeValue, lessonData?.challengeType]);

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
          loading={isButtonDisabled}
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
              <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
                <Select
                  value={namePrefix}
                  onChange={setNamePrefix}
                  style={{ 
                    width: '40%', 
                    height: '40px',
                    borderRadius: '6px 0 0 6px',
                    borderRight: 'none',
                    marginRight: '-3px'
                  }}
                  placeholder={t('dailyChallenge.selectPrefix', 'Select prefix')}
                  allowClear
                >
                  {prefixOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.value}
                    </Option>
                  ))}
                </Select>
                <Input 
                  placeholder={t('dailyChallenge.challengeNamePlaceholder')}
                  style={{ 
                    width: '60%', 
                    height: '40px', 
                    borderRadius: '0 6px 6px 0',
                  }}
                />
              </div>
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label={
                <span>
                  {t('dailyChallenge.classLesson')}
                  <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                </span>
              }
              name='classLessonId'
              rules={[
                {
                  required: true,
                  message: t('dailyChallenge.classLessonRequired'),
                },
              ]}>
              <Select 
                placeholder={t('dailyChallenge.selectClassLesson')}
                style={{ height: '40px' }}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                disabled={!!lessonData?.classLessonId}
              >
                {lessons.map(lesson => (
                  <Option key={lesson.id} value={lesson.id}>
                    {lesson.lessonName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        {/* Show Question Type field or display selected type */}
        {challengeTypeAlreadySet ? (
          <Row gutter={16}>
            <Col span={24}>
              {/* Hidden field to keep challengeType value in form */}
              <Form.Item name='challengeType' hidden noStyle>
                <Input />
              </Form.Item>
              
              {/* Display field */}
              <Form.Item
                label={<span>{t('dailyChallenge.questionType')}</span>}>
                <div style={{
                  padding: '8px 12px',
                  background: theme === 'sun' 
                    ? 'rgba(24, 144, 255, 0.08)' 
                    : 'rgba(138, 122, 255, 0.08)',
                  border: `1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.3)' : 'rgba(138, 122, 255, 0.3)'}`,
                  borderRadius: '6px',
                  color: theme === 'sun' ? 'rgba(24, 144, 255, 0.9)' : 'rgba(138, 122, 255, 0.9)',
                  fontWeight: '500',
                  fontSize: '14px'
                }}>
                  {lessonData?.challengeTypeName || lessonData?.challengeType}
                </div>
              </Form.Item>
            </Col>
          </Row>
        ) : (
          <Row gutter={16}>
            <Col span={24}>
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
                      {t(`dailyChallenge.typeNames.${option.value}`)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label={
                <span>
                  {t('dailyChallenge.description')}
                </span>
              }
              name='description'>
              <TextArea 
                rows={4}
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

