import React, { useState, useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { spaceToast } from '../../../../component/SpaceToastify';
import { useTheme } from '../../../../contexts/ThemeContext';
import authApi from '../../../../apis/backend/auth';

export default function EditEmailModal({ 
  isVisible, 
  onCancel, 
  onSuccess, 
  currentEmail,
  studentId 
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [form] = Form.useForm();
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset form and loading state when modal opens
  useEffect(() => {
    if (isVisible) {
      form.resetFields();
      form.setFieldsValue({
        email: currentEmail
      });
      setShowConfirmationMessage(false);
      setLoading(false); // Reset loading state
    }
  }, [isVisible, currentEmail, form]);

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      console.log('Form values:', values);
      console.log('Current email from props:', currentEmail);
      console.log('Student ID:', studentId);
      
      if (!validateEmail(values.email)) {
        spaceToast.error(t('messages.invalidEmail'));
        return;
      }

      setLoading(true);

      // Gọi API changeUserEmail với debug chi tiết
      console.log('=== DEBUG EMAIL CHANGE ===');
      console.log('studentId:', studentId);
      console.log('currentEmail (from props):', currentEmail);
      console.log('newEmail (from form):', values.email);
      console.log('Form values:', values);
      
      const response = await authApi.changeUserEmail(studentId, {
        email: values.email
      });
      
      console.log('API Response:', response);
      console.log('=== END DEBUG ===');

      if (response.success) {
        spaceToast.success('Email update request sent successfully!');
        // Không đóng modal ngay, hiển thị thông báo chờ xác nhận
        setShowConfirmationMessage(true);
        // KHÔNG gọi onSuccess ở đây vì email chưa được confirm
        // Email sẽ chỉ được cập nhật sau khi user confirm từ email
      } else {
        spaceToast.error(response.message || 'Failed to update email');
      }
    } catch (error) {
      console.error('Update Email Error:', error);
      
      // Xử lý error từ API response
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
    setShowConfirmationMessage(false);
    setLoading(false); // Reset loading state when closing modal
    onCancel();
  };

  return (
    <Modal
      title={
        <div
          style={{
            fontSize: '26px',
            fontWeight: '600',
            color: '#000000ff',
            textAlign: 'center',
            padding: '10px 0',
          }}>
          {t('common.editEmail')}
        </div>
      }
      open={isVisible}
      onOk={showConfirmationMessage ? handleCancel : handleOk}
      onCancel={showConfirmationMessage ? undefined : handleCancel}
      width={500}
      okText={showConfirmationMessage ? t('common.ok') : t('common.update')}
      cancelText={showConfirmationMessage ? undefined : t('common.close')}
      confirmLoading={loading}
      okButtonProps={{
        style: {
          backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
          background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
          borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
          color: theme === 'sun' ? '#000000' : '#ffffff',
          height: '40px',
          fontSize: '16px',
          fontWeight: '500',
          minWidth: '100px',
        },
      }}
      cancelButtonProps={showConfirmationMessage ? { style: { display: 'none' } } : {
        style: {
          height: '40px',
          fontSize: '16px',
          fontWeight: '500',
          minWidth: '100px',
        },
      }}>
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
          <p style={{ color: '#666', marginBottom: '20px' }}>
            {t('common.emailChangeConfirmationMessage')}
          </p>
          <p style={{ color: '#999', fontSize: '14px' }}>
            {t('common.emailChangeCheckInbox')}
          </p>
        </div>
      )}
    </Modal>
  );
}