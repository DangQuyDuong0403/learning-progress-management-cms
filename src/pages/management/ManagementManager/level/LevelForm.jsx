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
import { useTheme } from '../../../../contexts/ThemeContext';
import levelManagementApi from '../../../../apis/backend/levelManagement';

const { TextArea } = Input;
const { Option } = Select;

const LevelForm = ({ level, onClose, shouldCallApi = true }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
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
        prerequisite: values.prerequisite,
        promotionCriteria: values.promotionCriteria || '',
        learningObjectives: values.learningObjectives || '',
        estimatedDurationWeeks: values.estimatedDurationWeeks,
        orderNumber: values.orderNumber || 0,
      };

      console.log('LevelForm onFinish:', { isEdit, level, apiData, shouldCallApi });

      if (shouldCallApi) {
        // Call API (for LevelList usage)
        let successMessage;
        if (isEdit) {
          // Update existing level
          console.log('Updating level with ID:', level.id);
          await levelManagementApi.updateLevel(level.id, apiData);
          successMessage = t('levelManagement.updateLevelSuccess');
        } else {
          // Create new level
          console.log('Creating new level');
          await levelManagementApi.createLevel(apiData);
          successMessage = t('levelManagement.addLevelSuccess');
        }
        onClose(true, successMessage); // Tell parent to refresh data and show success message
      } else {
        // Don't call API (for LevelDragEdit usage)
        console.log('Not calling API, returning data to parent');
        const successMessage = isEdit ? t('levelManagement.updateLevelSuccess') : t('levelManagement.addLevelSuccess');
        onClose(true, apiData, successMessage); // Pass data and message to parent
      }
    } catch (error) {
      console.error('Error saving level:', error);
      message.error(isEdit ? t('levelManagement.updateLevelError') : t('levelManagement.addLevelError'));
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
            rules={[
              { required: true, message: t('levelManagement.levelNameRequired') },
              { min: 2, message: t('levelManagement.levelNameMinLength') }
            ]}
          >
            <Input 
              placeholder={t('levelManagement.levelNamePlaceholder')}
              size="middle"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="prerequisite"
            label={t('levelManagement.prerequisite')}
          >
            <Input 
              placeholder="e.g., Movers, Starters"
              size="middle"
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="description"
        label={t('levelManagement.description')}
        rules={[
          { required: false, message: t('levelManagement.descriptionRequired') },
          { min: 10, message: t('levelManagement.descriptionMinLength') }
        ]}
      >
        <TextArea 
          rows={2}
          placeholder={t('levelManagement.descriptionPlaceholder')}
          maxLength={500}
          showCount
          size="middle"
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={16}>
          <Form.Item
            name="estimatedDurationWeeks"
            label={t('levelManagement.duration')}
            rules={[
              { required: true, message: t('levelManagement.durationRequired') },
              { type: 'number', min: 1, max: 104, message: t('levelManagement.durationRange') }
            ]}
          >
            <InputNumber 
              min={1}
              max={104}
              placeholder={t('levelManagement.durationPlaceholder')}
              style={{ width: '100%' }}
              size="middle"
              addonAfter={
                <Select 
                  value={durationUnit}
                  onChange={setDurationUnit}
                  style={{ width: 100 }}
                  size="middle"
                >
                  <Option value="days">{t('levelManagement.days')}</Option>
                  <Option value="weeks">{t('levelManagement.weeks')}</Option>
                  <Option value="months">{t('levelManagement.months')}</Option>
                </Select>
              }
            />
          </Form.Item>
        </Col>
        <Col span={8}>
         
        </Col>
      </Row>

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
              height: '36px',
              padding: '0 24px',
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
              background: theme === 'sun' ? '#298EFE' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
              borderColor: theme === 'sun' ? '#298EFE' : '#7228d9',
              color: '#ffffff',
              height: '36px',
              padding: '0 24px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '6px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (theme === 'sun') {
                e.target.style.background = '#1a7ce8';
                e.target.style.borderColor = '#1a7ce8';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(41, 142, 254, 0.6)';
              } else {
                e.target.style.background = 'linear-gradient(135deg, #5a1fb8 0%, #8a7aff 100%)';
                e.target.style.borderColor = '#5a1fb8';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(114, 40, 217, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (theme === 'sun') {
                e.target.style.background = '#298EFE';
                e.target.style.borderColor = '#298EFE';
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
