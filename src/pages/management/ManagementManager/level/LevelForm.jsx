import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  message, 
  Space,
  Row,
  Col,
  InputNumber
} from 'antd';
import { useTranslation } from 'react-i18next';
import levelManagementApi from '../../../../apis/backend/levelManagement';

const { TextArea } = Input;
const { Option } = Select;

const LevelForm = ({ level, onClose, shouldCallApi = true }) => {
  const { t } = useTranslation();
  
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [durationUnit, setDurationUnit] = useState('weeks');

  const isEdit = !!level;

  useEffect(() => {
    if (level) {
      // Map API data to form fields
      form.setFieldsValue({
        levelName: level.levelName,
        description: level.description,
        prerequisite: level.prerequisite,
        estimatedDurationWeeks: level.estimatedDurationWeeks,
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
        description: values.description || '',
        promotionCriteria: values.promotionCriteria || '',
        learningObjectives: values.learningObjectives || '',
        estimatedDurationWeeks: values.estimatedDurationWeeks,
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
        const successMessage = response.message || (isEdit ? t('levelManagement.updateLevelSuccess') : t('levelManagement.addLevelSuccess'));
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
      if (error.response) {
        const errorMessage = error.response.data.error || error.response.data?.message;
        message.error(errorMessage);
      } else {
        message.error(error.message || (isEdit ? t('levelManagement.updateLevelError') : t('levelManagement.addLevelError')));
      }
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
        <Col span={12}>
          <Form.Item
            name="levelName"
            label={t('levelManagement.levelName')}
          >
            <Input 
              placeholder={t('levelManagement.levelNamePlaceholder')}
              size="large"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="estimatedDurationWeeks"
            label={t('levelManagement.duration')}
          >
            <InputNumber 
              min={1}
              max={104}
              placeholder={t('levelManagement.durationPlaceholder')}
              style={{ width: '100%' }}
              size="large"
              addonAfter={
                <Select 
                  value={durationUnit}
                  onChange={setDurationUnit}
                  style={{ width: 120 }}
                  size="large"
                >
                  <Option value="days">{t('levelManagement.days')}</Option>
                  <Option value="weeks">{t('levelManagement.weeks')}</Option>
                  <Option value="months">{t('levelManagement.months')}</Option>
                </Select>
              }
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="description"
        label={t('levelManagement.description')}
      >
        <TextArea 
          rows={3}
          placeholder={t('levelManagement.descriptionPlaceholder')}
          maxLength={500}
          showCount
        />
      </Form.Item>


      <Form.Item
        name="learningObjectives"
        label={t('levelManagement.learningObjectives')}
      >
        <TextArea 
          rows={4}
          placeholder={t('levelManagement.learningObjectivesPlaceholder')}
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <Form.Item
        name="promotionCriteria"
        label={t('levelManagement.promotionCriteria')}
      >
        <TextArea 
          rows={3}
          placeholder={t('levelManagement.promotionCriteriaPlaceholder')}
          maxLength={500}
          showCount
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel} size="large">
            {t('common.cancel')}
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isSubmitting}
            size="large"
          >
            {isEdit ? t('common.update') : t('common.save')}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default LevelForm;
