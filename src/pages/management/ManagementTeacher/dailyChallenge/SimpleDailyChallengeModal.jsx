import React, { useState, useEffect, useCallback } from "react";
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
import { useParams } from "react-router-dom";
import teacherManagementApi from "../../../../apis/backend/teacherManagement";

const { TextArea } = Input;
const { Option } = Select;

const questionTypeOptions = [
  { value: "GV", label: "Grammar & Vocabulary" },
  { value: "RE", label: "Reading" },
  { value: "LI", label: "Listening" },
  { value: "WR", label: "Writing" },
  { value: "SP", label: "Speaking" },
];

const SimpleDailyChallengeModal = ({
  visible,
  onCancel,
  onCreateSuccess,
  lessonData,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { classId } = useParams();
  const [form] = Form.useForm();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  
  // Check if challengeType is already set from modal
  const challengeTypeAlreadySet = !!lessonData?.challengeType;

  const fetchLessons = useCallback(async () => {
    if (!classId) return;
    
    setLoadingLessons(true);
    try {
      // First, get all chapters of the class
      const chaptersResponse = await teacherManagementApi.getClassChapters(classId, {
        page: 0,
        size: 100
      });
      
      console.log('Class Chapters API Response:', chaptersResponse.data);
      
      let allLessons = [];
      
      if (chaptersResponse.data && chaptersResponse.data.content) {
        const chapters = chaptersResponse.data.content;
        
        // Get lessons for each chapter
        for (const chapter of chapters) {
          try {
            const lessonsResponse = await teacherManagementApi.getClassLessons({
              classChapterId: chapter.id,
              page: 0,
              size: 100
            });
            
            if (lessonsResponse.data && lessonsResponse.data.content) {
              allLessons = allLessons.concat(lessonsResponse.data.content);
            } else if (lessonsResponse.data && Array.isArray(lessonsResponse.data)) {
              allLessons = allLessons.concat(lessonsResponse.data);
            }
          } catch (error) {
            console.error(`Error fetching lessons for chapter ${chapter.id}:`, error);
          }
        }
      } else if (chaptersResponse.data && Array.isArray(chaptersResponse.data)) {
        const chapters = chaptersResponse.data;
        
        // Get lessons for each chapter
        for (const chapter of chapters) {
          try {
            const lessonsResponse = await teacherManagementApi.getClassLessons({
              classChapterId: chapter.id,
              page: 0,
              size: 100
            });
            
            if (lessonsResponse.data && lessonsResponse.data.content) {
              allLessons = allLessons.concat(lessonsResponse.data.content);
            } else if (lessonsResponse.data && Array.isArray(lessonsResponse.data)) {
              allLessons = allLessons.concat(lessonsResponse.data);
            }
          } catch (error) {
            console.error(`Error fetching lessons for chapter ${chapter.id}:`, error);
          }
        }
      }
      
      console.log('All Class Lessons:', allLessons);
      
      const mappedLessons = allLessons.map((lesson) => {
        // Try to get lesson name from various possible fields
        const lessonName = lesson.classLessonName || 
                          lesson.name || 
                          lesson.title || 
                          lesson.lessonTitle ||
                          lesson.chapterName ||
                          `Lesson ${lesson.id}`;
        
        return {
          id: lesson.id,
          name: lessonName,
          lessonName: lessonName,
          content: lesson.content || '',
        };
      });
      
      console.log('Raw Lesson Data:', allLessons);
      console.log('Mapped Lessons:', mappedLessons);
      setLessons(mappedLessons);
    } catch (error) {
      console.error('Error fetching class lessons:', error);
      spaceToast.error(t('lessonManagement.loadLessonsError'));
    } finally {
      setLoadingLessons(false);
    }
  }, [classId, t]);

  // Fetch lessons when modal opens
  useEffect(() => {
    if (visible && classId) {
      fetchLessons();
    }
  }, [visible, classId, fetchLessons]);

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
      }
      
      form.setFieldsValue(fieldsToSet);
    }
  }, [visible, lessonData, form]);

  const handleModalOk = async () => {
    if (isButtonDisabled) return;
    
    setIsButtonDisabled(true);
    
    try {
      const values = await form.validateFields();
      
      console.log('Creating challenge with data:', values);
      console.log('Form values:', form.getFieldsValue());
      console.log('lessonData:', lessonData);
      
      // Ensure challengeType is set - use from lessonData if not in form values
      const challengeType = values.challengeType || lessonData?.challengeType;
      
      console.log('Final challengeType:', challengeType);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const challengeData = {
        challengeName: values.challengeName,
        classLessonId: values.classLessonId,
        description: values.description,
        challengeType: challengeType,
      };

      console.log('Challenge data to send:', challengeData);

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
                loading={loadingLessons}
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
                label={<span>Challenge Type</span>}>
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
                    Challenge Type
                    <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                  </span>
                }
                name='challengeType'
                rules={[
                  {
                    required: true,
                    message: 'Please select challenge type',
                  },
                ]}>
                <Select 
                  placeholder="Select challenge type"
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

