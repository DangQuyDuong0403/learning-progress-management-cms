import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import authApi from '../../../../apis/backend/auth';

const EditEmailModal = ({ isVisible, onClose, teacherId, currentEmail }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      form.resetFields();
      form.setFieldsValue({ email: currentEmail });
    }
  }, [isVisible, currentEmail, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      console.log('Teacher EditEmailModal - TeacherId:', teacherId);
      console.log('Teacher EditEmailModal - Current Email:', currentEmail);
      console.log('Teacher EditEmailModal - New Email:', values.email);
      
      // Call API to change email for specific teacher
      const response = await authApi.changeUserEmail(teacherId, { email: values.email });
      
      console.log('Teacher EditEmailModal - API Response:', response);
      
      if (response.success || response.message) {
        spaceToast.success(response.message || t('teacherManagement.updateEmailSuccess'));
        onClose(true); // Tell parent to refresh data
      } else {
        spaceToast.error(response.message || t('teacherManagement.updateEmailError'));
      }
    } catch (error) {
      console.error('Teacher EditEmailModal - Error:', error);
      console.error('Teacher EditEmailModal - Error response:', error.response?.data);
      console.error('Teacher EditEmailModal - Error status:', error.response?.status);
      
      // Show backend error message if available
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          t('teacherManagement.updateEmailError');
      spaceToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose(false);
  };

  return (
    <Modal
      title={
        <div style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: '#000000',
          textAlign: 'center',
          padding: '10px 0'
        }}>
          {t('teacherManagement.editEmail')}
        </div>
      }
      open={isVisible}
      onCancel={handleCancel}
      footer={null}
      width={500}
      centered
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ email: currentEmail }}
      >
        <Form.Item
          label={
            <span>
              {t('teacherManagement.newEmail')}
              <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
            </span>
          }
          name="email"
          rules={[
            { required: true, message: t('teacherManagement.emailRequired') },
            { type: 'email', message: t('teacherManagement.emailInvalid') },
            { max: 255, message: t('teacherManagement.emailMaxLength') },
          ]}
        >
          <Input placeholder={t('teacherManagement.enterNewEmail')} />
        </Form.Item>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '24px',
          gap: '12px'
        }}>
          <Button
            onClick={handleCancel}
            style={{
              flex: 1,
              height: '40px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              flex: 1,
              height: '40px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
              background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
              borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
              color: theme === 'sun' ? '#000000' : '#ffffff',
            }}
          >
            {t('common.save')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditEmailModal;
