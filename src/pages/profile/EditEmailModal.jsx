import React, { useState } from 'react';
import { Modal, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { updateEmail } from '../../redux/auth';
import { spaceToast } from '../../component/SpaceToastify';

export default function EditEmailModal({ 
  isVisible, 
  onCancel, 
  onSuccess, 
  currentEmail 
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { updateEmailLoading } = useSelector((state) => state.auth);
  const [form] = Form.useForm();

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (!validateEmail(values.email)) {
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
      
      if (result.success) {
        spaceToast.success(t('common.profileUpdated'));
        onSuccess(result.data.email);
        handleCancel();
      }
    } catch (error) {
      console.error('Update Email Error:', error);
      spaceToast.error(error.message || t('common.profileUpdateFailed'));
    }
  };

  const handleCancel = () => {
    form.resetFields();
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
      onOk={handleOk}
      onCancel={handleCancel}
      width={500}
      okText={t('common.update')}
      cancelText={t('common.cancel')}
      confirmLoading={updateEmailLoading}
      okButtonProps={{
        style: {
          backgroundColor: '#1890ff',
          borderColor: '#1890ff',
          height: '40px',
          fontSize: '16px',
          fontWeight: '500',
          minWidth: '100px',
        },
      }}
      cancelButtonProps={{
        style: {
          height: '40px',
          fontSize: '16px',
          fontWeight: '500',
          minWidth: '100px',
        },
      }}>
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
    </Modal>
  );
}
