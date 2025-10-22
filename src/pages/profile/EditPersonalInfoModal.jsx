import React, { useEffect, useState } from 'react';
import { Modal, Form, Row, Col, Input, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../redux/auth';
import { spaceToast } from '../../component/SpaceToastify';
import { useTheme } from '../../contexts/ThemeContext';

export default function EditPersonalInfoModal({ 
  isVisible, 
  onCancel, 
  onSuccess, 
  profileData 
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { updateProfileLoading } = useSelector((state) => state.auth);
  const { theme } = useTheme();
  const [form] = Form.useForm();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  // Cập nhật form values khi profileData thay đổi
  useEffect(() => {
    if (profileData && isVisible) {
      form.setFieldsValue({
        fullName: profileData.fullName || "",
        phone: profileData.phoneNumber || "",
        address: profileData.address || "",
        gender: profileData.gender || "MALE",
        dateOfBirth: profileData.dateOfBirth 
          ? new Date(profileData.dateOfBirth).toISOString().split('T')[0]
          : ""
      });
    }
  }, [profileData, isVisible, form]);

  const handleOk = async () => {
    if (isButtonDisabled) return; // Prevent multiple submissions
    
    setIsButtonDisabled(true);
    
    try {
      const values = await form.validateFields();

      // Chuẩn bị dữ liệu theo format API - chỉ gửi các field cần thiết
      const updateData = {
        fullName: values.fullName,
        avatarUrl: profileData?.avatarUrl || "string", // Luôn gửi string, không gửi File object
        dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : new Date("2003-10-15").toISOString(), // Format ISO với time và timezone
        address: values.address,
        phoneNumber: values.phone,
        gender: values.gender === "MALE" ? "MALE" : values.gender === "FEMALE" ? "FEMALE" : "OTHER"
      };

      
      // Dispatch action để update profile
      const result = await dispatch(updateProfile(updateData)).unwrap();
      
      if (result.success) {
        spaceToast.success(result.message);
        onSuccess(result.data);
        handleCancel();
      }
    } catch (error) {
      // Xử lý lỗi từ API - error object có cấu trúc trực tiếp
      const errorMessage = error.error || error.message;
      spaceToast.error(errorMessage);
    } finally {
      // Re-enable button after 0.5 seconds
      setTimeout(() => {
        setIsButtonDisabled(false);
      }, 500);
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
          {t('common.editPersonalInfo')}
        </div>
      }
      open={isVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={600}
      okText={t('common.update')}
      cancelText={t('common.cancel')}
      confirmLoading={updateProfileLoading}
      okButtonProps={{
        disabled: isButtonDisabled,
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
          fullName: profileData?.fullName || "",
          phone: profileData?.phoneNumber || "",
          address: profileData?.address || "",
          gender: profileData?.gender || "MALE",
          dateOfBirth: profileData?.dateOfBirth 
            ? new Date(profileData.dateOfBirth).toISOString().split('T')[0]
            : ""
        }}>
        <Form.Item
          label={
            <span>
              {t('common.fullName')}
              <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
            </span>
          }
          name='fullName'
          required={false}>
          <Input placeholder="Enter full name" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <span>
                  {t('common.phoneNumber')}
                  <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                </span>
              }
              name='phone'
              required={false}>
              <Input placeholder="Enter phone number" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <span>
                  {t('common.gender')}
                  <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                </span>
              }
              name='gender'
              required={false}>
              <Radio.Group>
                <Radio value="MALE">{t('common.male')}</Radio>
                <Radio value="FEMALE">{t('common.female')}</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('common.dateOfBirth')}
              name='dateOfBirth'
              required={false}
              rules={[
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const selectedDate = new Date(value);
                    const selectedYear = selectedDate.getFullYear();
                    if (selectedYear < 1920) {
                      return Promise.reject(new Error('Date of birth must be from 1920 onwards'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}>
              <Input 
                type="date"
                placeholder="Select date of birth"
                min="1920-01-01"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            {/* Empty column for layout balance */}
          </Col>
        </Row>

        <Form.Item
          label={t('common.address')}
          name='address'
          required={false}>
          <Input placeholder="Enter address" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
