import React, { useState, useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { updateEmail, clearUpdateEmailState } from '../../redux/auth';
import { spaceToast } from '../../component/SpaceToastify';
import { useTheme } from '../../contexts/ThemeContext';

export default function EditEmailModal({ 
  isVisible, 
  onCancel, 
  onSuccess, 
  currentEmail 
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { updateEmailLoading } = useSelector((state) => state.auth);
  const { theme } = useTheme();
  const [form] = Form.useForm();
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);

  // Reset loading state khi modal được mở
  useEffect(() => {
    if (isVisible) {
      dispatch(clearUpdateEmailState());
    }
  }, [isVisible, dispatch]);

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (!validateEmail(values.email)) {
        form.setFields([
          {
            name: 'email',
            errors: [t('messages.invalidEmail')],
          },
        ]);
        spaceToast.error(t('messages.invalidEmail'));
        return;
      }

      // Chuẩn bị dữ liệu theo format API
      const updateData = {
        email: values.email
      };

      console.log('Update Email Data:', updateData);
      
      // Dispatch action để update email
      const result = await dispatch(updateEmail(updateData)).unwrap();
      
      if (result.success || result.message) {
        spaceToast.success(result.message);
        // Không đóng modal ngay, hiển thị thông báo chờ xác nhận
        setShowConfirmationMessage(true);
      }
    } catch (error) {
      console.error('Update Email Error:', error);
      
      // Xử lý error từ API response
      let errorMessage = error.response?.data?.message;
      if (error.error) {
        errorMessage = error.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      spaceToast.error(errorMessage);
      form.setFields([
        {
          name: 'email',
          errors: [errorMessage || t('messages.invalidEmail')],
        },
      ]);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setShowConfirmationMessage(false);
    // Reset loading state khi đóng modal
    dispatch(clearUpdateEmailState());
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
          {t('common.editEmail')}
        </div>
      }
      open={isVisible}
      onOk={showConfirmationMessage ? handleCancel : handleOk}
      onCancel={showConfirmationMessage ? undefined : handleCancel}
      width={500}
      okText={showConfirmationMessage ? t('common.ok') : t('common.update')}
      confirmLoading={updateEmailLoading}
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
          width: '100px',
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
                message: t('common.emailRequired'),
              },
              {
                type: 'email',
                message: t('messages.invalidEmail'),
              },
            ]}
            required={false}>
            <Input placeholder={t('common.emailPlaceholder')} />
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
