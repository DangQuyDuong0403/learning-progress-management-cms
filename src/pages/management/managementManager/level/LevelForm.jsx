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

  const isEdit = !!level;

  useEffect(() => {
    if (level) {
      form.setFieldsValue(level);
    }
  }, [level, form]);

  const onFinish = async (values) => {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await dispatch(updateLevel({ id: level.id, ...values }));
        message.success(t('levelManagement.updateLevelSuccess'));
      } else {
        await dispatch(createLevel(values));
        message.success(t('levelManagement.addLevelSuccess'));
      }
      onClose();
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
        difficulty: 'beginner',
        duration: 12,
        ...level
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="name"
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
            name="code"
            label={t('levelManagement.levelCode')}
            rules={[
              { required: true, message: t('levelManagement.levelCodeRequired') },
              { 
                pattern: /^[A-Z0-9_]+$/, 
                message: t('levelManagement.levelCodePattern') 
              }
            ]}
          >
            <Input 
              placeholder={t('levelManagement.levelCodePlaceholder')}
              size="large"
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="description"
        label={t('levelManagement.description')}
        rules={[
          { required: true, message: t('levelManagement.descriptionRequired') },
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
        <Col span={8}>
          <Form.Item
            name="difficulty"
            label={t('levelManagement.difficulty')}
            rules={[{ required: true, message: t('levelManagement.difficultyRequired') }]}
          >
            <Select 
              placeholder={t('levelManagement.selectDifficulty')}
              size="large"
            >
              {difficultyOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="duration"
            label={t('levelManagement.duration')}
            rules={[
              { required: true, message: t('levelManagement.durationRequired') },
              { type: 'number', min: 1, max: 52, message: t('levelManagement.durationRange') }
            ]}
          >
            <InputNumber 
              min={1}
              max={52}
              placeholder={t('levelManagement.durationPlaceholder')}
              style={{ width: '100%' }}
              size="large"
              addonAfter={t('levelManagement.weeks')}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="status"
            label={t('levelManagement.status')}
            rules={[{ required: true, message: t('levelManagement.statusRequired') }]}
          >
            <Select 
              placeholder={t('levelManagement.selectStatus')}
              size="large"
            >
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="minAge"
            label={t('levelManagement.minAge')}
            rules={[
              { type: 'number', min: 3, max: 18, message: t('levelManagement.minAgeRange') }
            ]}
          >
            <InputNumber 
              min={3}
              max={18}
              placeholder={t('levelManagement.minAgePlaceholder')}
              style={{ width: '100%' }}
              size="large"
              addonAfter={t('levelManagement.years')}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="maxAge"
            label={t('levelManagement.maxAge')}
            rules={[
              { type: 'number', min: 3, max: 18, message: t('levelManagement.maxAgeRange') }
            ]}
          >
            <InputNumber 
              min={3}
              max={18}
              placeholder={t('levelManagement.maxAgePlaceholder')}
              style={{ width: '100%' }}
              size="large"
              addonAfter={t('levelManagement.years')}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="objectives"
        label={t('levelManagement.objectives')}
      >
        <TextArea 
          rows={4}
          placeholder={t('levelManagement.objectivesPlaceholder')}
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <Form.Item
        name="prerequisites"
        label={t('levelManagement.prerequisites')}
      >
        <TextArea 
          rows={3}
          placeholder={t('levelManagement.prerequisitesPlaceholder')}
          maxLength={500}
          showCount
        />
      </Form.Item>

      <Form.Item
        name="learningOutcomes"
        label={t('levelManagement.learningOutcomes')}
      >
        <TextArea 
          rows={4}
          placeholder={t('levelManagement.learningOutcomesPlaceholder')}
          maxLength={1000}
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
