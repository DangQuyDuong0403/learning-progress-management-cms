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
import { useDispatch, useSelector } from 'react-redux';
import { 
  createLevel, 
  updateLevel 
} from '../../../../redux/level';

const { TextArea } = Input;
const { Option } = Select;

const LevelForm = ({ level, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.level);
  
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
        difficulty: level.difficulty,
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
      // Map form values to API format (match với Swagger API)
      const apiData = {
        levelName: values.levelName,
        description: values.description,
        difficulty: values.difficulty,
        promotionCriteria: values.promotionCriteria || '',
        learningObjectives: values.learningObjectives || '',
        estimatedDurationWeeks: values.estimatedDurationWeeks,
        orderNumber: values.orderNumber,
      };

      if (isEdit) {
        await dispatch(updateLevel({ id: level.id, ...apiData }));
        message.success(t('levelManagement.updateLevelSuccess'));
      } else {
        await dispatch(createLevel(apiData));
        message.success(t('levelManagement.addLevelSuccess'));
      }
      onClose(true); // Pass true to indicate successful save
    } catch (error) {
      message.error(isEdit ? t('levelManagement.updateLevelError') : t('levelManagement.addLevelError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCancel = () => {
    form.resetFields();
    onClose();
  };

  const difficultyOptions = [
    { value: 'beginner', label: t('levelManagement.beginner') },
    { value: 'intermediate', label: t('levelManagement.intermediate') },
    { value: 'advanced', label: t('levelManagement.advanced') },
  ];

  const statusOptions = [
    { value: 'active', label: t('levelManagement.active') },
    { value: 'inactive', label: t('levelManagement.inactive') },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        status: 'active',
        difficulty: 'LE',
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
              size="large"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="difficulty"
            label={t('levelManagement.difficulty')}
            rules={[{ required: true, message: t('levelManagement.difficultyRequired') }]}
          >
            <Input 
              placeholder="e.g., LE, ME, AE"
              size="large"
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
          rows={3}
          placeholder={t('levelManagement.descriptionPlaceholder')}
          maxLength={500}
          showCount
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
        <Col span={8}>
         
        </Col>
      </Row>

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
            loading={isSubmitting || loading}
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
