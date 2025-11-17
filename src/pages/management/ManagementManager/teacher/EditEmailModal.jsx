import React, { useState, useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import authApi from '../../../../apis/backend/auth';

const EditEmailModal = ({ isVisible, onClose, teacherId, currentEmail }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);

  useEffect(() => {
    if (isVisible) {
      form.resetFields();
      form.setFieldsValue({ email: currentEmail });
      setLoading(false); // Reset loading state when modal opens
      setShowConfirmationMessage(false); // Reset confirmation message
    }
  }, [isVisible, currentEmail, form]);

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const handleOk = async () => {
    if (showConfirmationMessage) {
      handleCancel(); // Close modal when OK is clicked on confirmation
      return;
    }

    try {
      const values = await form.validateFields();
      
      console.log('Teacher EditEmailModal - Form values:', values);
      console.log('Teacher EditEmailModal - Current email:', currentEmail);
      console.log('Teacher EditEmailModal - Teacher ID:', teacherId);
      
      if (!validateEmail(values.email)) {
        spaceToast.error(t('messages.invalidEmail'));
        return;
      }

      setLoading(true);

      console.log('=== DEBUG EMAIL CHANGE ===');
      console.log('teacherId:', teacherId);
      console.log('currentEmail (from props):', currentEmail);
      console.log('newEmail (from form):', values.email);
      
      // Call API to change email for specific teacher
      const response = await authApi.changeUserEmail(teacherId, { email: values.email });
      
      console.log('Teacher EditEmailModal - API Response:', response);
      console.log('=== END DEBUG ===');
      
      if (response.success) {
        spaceToast.success('Email update request sent successfully!');
        setShowConfirmationMessage(true); // Show confirmation message instead of closing
      } else {
        spaceToast.error(response.message || 'Failed to update email');
      }
    } catch (error) {
      console.error('Teacher EditEmailModal - Error:', error);
      console.error('Teacher EditEmailModal - Error response:', error.response?.data);
      
      // Show backend error message if available
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message;
      spaceToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setLoading(false); // Reset loading state when closing modal
    setShowConfirmationMessage(false); // Reset confirmation message
    onClose(false);
  };

  return (
    <Modal
      title={
        <div style={{
          fontSize: '28px',
          fontWeight: '600',
          color: 'rgb(24, 144, 255)',
          textAlign: 'center',
          padding: '10px 0',
        }}>
          {t('common.editEmail')}
        </div>
      }
      open={isVisible}
      onOk={showConfirmationMessage ? handleOk : handleOk}
      onCancel={handleCancel}
      width={500}
      okText={showConfirmationMessage ? t('common.ok') : t('common.update')}
      cancelText={showConfirmationMessage ? undefined : t('common.close')}
      confirmLoading={loading}
      okButtonProps={{
        style: {
          background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
          borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
          color: theme === 'sun' ? '#000' : '#fff',
          borderRadius: '6px',
          height: '32px',
          fontWeight: '500',
          fontSize: '16px',
          padding: '4px 15px',
          width: showConfirmationMessage ? '150px' : '100px',
          transition: 'all 0.3s ease',
          boxShadow: 'none'
        },
      }}
      cancelButtonProps={showConfirmationMessage ? { style: { display: 'none' } } : {
        style: {
          height: '32px',
          fontWeight: '500',
          fontSize: '16px',
          padding: '4px 15px',
          width: '100px'
        },
      }}
      centered
      destroyOnClose
    >
      {!showConfirmationMessage ? (
        <Form
          form={form}
          layout='vertical'
          initialValues={{
            email: currentEmail,
          }}>
          <Form.Item
            label={
              <span>
                {t('common.email')}
                <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
              </span>
            }
            name='email'
            rules={[
              {
                required: true,
                message: 'Email is required',
              },
              {
                type: 'email',
                message: 'Please enter a valid email',
              },
            ]}
            required={false}>
            <Input placeholder="Enter email" />
          </Form.Item>
        </Form>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }}>
            📧
          </div>
          <h3 style={{ color: '#1890ff', marginBottom: '16px' }}>
            {t('common.emailChangeRequestSent')}
          </h3>
        </div>
      )}
    </Modal>
  );
};

export default EditEmailModal;
