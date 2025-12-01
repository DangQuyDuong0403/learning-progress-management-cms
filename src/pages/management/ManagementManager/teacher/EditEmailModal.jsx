import React, { useState, useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import authApi from '../../../../apis/backend/auth';

const EditEmailModal = ({ isVisible, onClose, teacherId, currentEmail }) => {
  const { t, i18n } = useTranslation();
  const getText = (vi, en) => (i18n.language?.startsWith('vi') ? vi : en);
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
      if (!validateEmail(values.email)) {
        const invalidMsg = getText('Email không hợp lệ', 'Invalid email');
        form.setFields([{ name: 'email', errors: [invalidMsg] }]);
        spaceToast.error(invalidMsg);
        return;
      }

      setLoading(true);
      // Call API to change email for specific teacher
      const response = await authApi.changeUserEmail(teacherId, { email: values.email });
      
      if (response.success) {
        spaceToast.success(getText('Yêu cầu cập nhật email đã được gửi!', 'Email update request sent successfully!'));
        setShowConfirmationMessage(true); // Show confirmation message instead of closing
      } else {
        spaceToast.error(response.message || getText('Cập nhật email thất bại', 'Failed to update email'));
      }
    } catch (error) {
      console.error('Teacher EditEmailModal - Error:', error);
      console.error('Teacher EditEmailModal - Error response:', error.response?.data);
      
      // Show backend error message if available
      const backendMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      const errorMessage = backendMessage || getText('Có lỗi xảy ra khi cập nhật email', 'Failed to update email');
      spaceToast.error(errorMessage);
      form.setFields([{ name: 'email', errors: [errorMessage] }]);
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
          {getText(t('common.editEmail'), 'Edit Email')}
        </div>
      }
      open={isVisible}
      onOk={showConfirmationMessage ? handleOk : handleOk}
      onCancel={handleCancel}
      width={500}
      okText={showConfirmationMessage ? t('common.ok') : t('common.update')}
      cancelText={showConfirmationMessage ? undefined : getText(t('common.close'), 'Close')}
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
                {getText(t('common.email'), 'Email')}
                <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
              </span>
            }
            name='email'
            rules={[
              {
                required: true,
                message: getText('Vui lòng nhập email', 'Email is required'),
              },
              {
                type: 'email',
                message: getText('Vui lòng nhập email hợp lệ', 'Please enter a valid email'),
              },
            ]}
            required={false}>
            <Input placeholder={getText('Nhập email', 'Enter email')} />
          </Form.Item>
        </Form>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }}>
            📧
          </div>
          <h3 style={{ color: '#1890ff', marginBottom: '16px' }}>
            {getText(t('common.emailChangeRequestSent'), 'Email change request sent')}
          </h3>
        </div>
      )}
    </Modal>
  );
};

export default EditEmailModal;
