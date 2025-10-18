import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  message, 
  Space,
  Row,
  Col,
  InputNumber
} from 'antd';
import { spaceToast } from '../../../../component/SpaceToastify';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import levelManagementApi from '../../../../apis/backend/levelManagement';

const { TextArea } = Input;

const LevelForm = ({ level, onClose, shouldCallApi = true, showPrerequisiteAndCode = true }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!level;
  const isPublished = level?.status === 'PUBLISHED';

  useEffect(() => {
    if (level) {
      // Map API data to form fields
      form.setFieldsValue({
        levelName: level.levelName,
        levelCode: level.levelCode,
        description: level.description,
        prerequisite: level.prerequisite?.levelName || level.prerequisite || '',
        estimatedDurationWeeks: level.estimatedDurationWeeks, // Direct value in weeks
        status: level.status,
        orderNumber: level.orderNumber,
        promotionCriteria: level.promotionCriteria,
        learningObjectives: level.learningObjectives,
      });
    }
  }, [level, form]);

  const onFinish = async (values) => {
    setIsSubmitting(true);
    try {
      // Map form values to API format
      const apiData = {
        levelName: values.levelName,
        levelCode: values.levelCode,
        description: values.description || '',
        promotionCriteria: values.promotionCriteria || '',
        learningObjectives: values.learningObjectives || '',
        estimatedDurationWeeks: values.estimatedDurationWeeks, // Direct value in weeks
        orderNumber: values.orderNumber || 0,
      };

      console.log('LevelForm onFinish:', { isEdit, level, apiData, shouldCallApi });

      if (shouldCallApi) {
        // Call API (for LevelList usage)
        let response;
        if (isEdit) {
          // Update existing level
          console.log('Updating level with ID:', level.id);
          response = await levelManagementApi.updateLevel(level.id, apiData);
        } else {
          // Create new level
          console.log('Creating new level');
          response = await levelManagementApi.createLevel(apiData);
        }
        
        // Use backend message if available, otherwise fallback to translation
        const successMessage = response.message || response.data?.message ;
       
        onClose(true, successMessage); // Tell parent to refresh data and show success message
      } else {
        // Don't call API (for LevelDragEdit usage)
        console.log('Not calling API, returning data to parent');
        const successMessage = isEdit ? t('levelManagement.updateLevelSuccess') : t('levelManagement.addLevelSuccess');
        onClose(true, apiData, successMessage); // Pass data and message to parent
      }
    } catch (error) {
      console.error('Error saving level:', error);
      
      // Handle API errors with backend messages
      let errorMessage;
      if (error.response) {
        errorMessage = error.response.data.error || error.response.data?.message || error.message;
      } else {
        errorMessage = error.message;
      }
      
      console.log('Final error message:', errorMessage);
      spaceToast.error(errorMessage);
      
      // Don't close modal on error - let user retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCancel = () => {
    form.resetFields();
    onClose(false); // Pass false to indicate no refresh needed
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        status: 'active',
        estimatedDurationWeeks: 12,
        ...level
      }}
    >
      <Row gutter={16}>
        <Col span={showPrerequisiteAndCode ? 12 : 12}>
          <Form.Item
            name="levelName"
            label={<span>{t('levelManagement.levelName')} <span style={{ color: 'red' }}>*</span></span>}
            required
            rules={[{ required: true, message: t('levelManagement.levelNameRequired') }]}
          >
            <Input 
              size="middle"
              disabled={isPublished}
            />
          </Form.Item>
        </Col>
        {showPrerequisiteAndCode && (
          <Col span={12}>
            <Form.Item
              name="levelCode"
              label={t('levelManagement.levelCode')}
            >
              <Input 
                size="middle"
                disabled={true}
              />
            </Form.Item>
          </Col>
        )}
        {!showPrerequisiteAndCode && (
          <Col span={12}>
            <Form.Item
              name="estimatedDurationWeeks"
              label={<span>{t('levelManagement.duration')} <span style={{ color: 'red' }}>*</span></span>}
              required
              rules={[{ required: true, message: t('levelManagement.durationRequired') }]}
            >
              <InputNumber 
                min={1}
                max={260}
                style={{ width: '100%' }}
                size="middle"
                disabled={isPublished}
                addonAfter="weeks"
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      {showPrerequisiteAndCode && (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="prerequisite"
              label={t('levelManagement.prerequisite')}
            >
              <Input 
                size="middle"
                disabled={true}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="estimatedDurationWeeks"
              label={<span>{t('levelManagement.duration')} <span style={{ color: 'red' }}>*</span></span>}
              required
              rules={[{ required: true, message: t('levelManagement.durationRequired') }]}
            >
              <InputNumber 
                min={1}
                max={104}
                style={{ width: '100%' }}
                size="middle"
                disabled={isPublished}
                addonAfter="weeks"
              />
            </Form.Item>
          </Col>
        </Row>
      )}

      <Form.Item
        name="description"
        label={t('levelManagement.description')}
      >
        <TextArea 
          rows={2}
          placeholder={t('levelManagement.descriptionPlaceholder')}
          maxLength={500}
          showCount
          size="middle"
        />
      </Form.Item>


      <Form.Item
        name="learningObjectives"
        label={t('levelManagement.learningObjectives')}
      >
        <TextArea 
          rows={3}
          placeholder={t('levelManagement.learningObjectivesPlaceholder')}
          maxLength={1000}
          showCount
          size="middle"
        />
      </Form.Item>

      <Form.Item
        name="promotionCriteria"
        label={t('levelManagement.promotionCriteria')}
      >
        <TextArea 
          rows={2}
          placeholder={t('levelManagement.promotionCriteriaPlaceholder')}
          maxLength={500}
          showCount
          size="middle"
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button 
            onClick={onCancel} 
            size="middle"
            style={{
              height: '40px',
              width: '120px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '6px',
              transition: 'all 0.3s ease',
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isSubmitting}
            size="middle"
            style={{
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
              color: theme === 'sun' ? '#000000' : '#ffffff',
              height: '40px',
              width: '120px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '6px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (theme === 'sun') {
                e.target.style.background = 'rgb(95, 160, 240)';
                e.target.style.borderColor = 'rgb(95, 160, 240)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(113, 179, 253, 0.6)';
              } else {
                e.target.style.background = 'linear-gradient(135deg, #5a1fb8 0%, #8a7aff 100%)';
                e.target.style.borderColor = '#5a1fb8';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(114, 40, 217, 0.6)';
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
            }}
          >
            {isEdit ? t('common.update') : t('common.save')}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default LevelForm;
