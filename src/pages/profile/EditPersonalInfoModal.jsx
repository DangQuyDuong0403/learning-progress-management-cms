import React, { useEffect } from 'react';
import { Modal, Form, Row, Col, Input, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../redux/auth';
import { spaceToast } from '../../component/SpaceToastify';

export default function EditPersonalInfoModal({ 
  isVisible, 
  onCancel, 
  onSuccess, 
  profileData 
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { updateProfileLoading } = useSelector((state) => state.auth);
  const [form] = Form.useForm();

  // Cập nhật form values khi profileData thay đổi
  useEffect(() => {
    if (profileData && isVisible) {
      form.setFieldsValue({
        username: profileData.userName || "",
        lastName: profileData.lastName || "",
        firstName: profileData.firstName || "",
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
    try {
      const values = await form.validateFields();

      // Chuẩn bị dữ liệu theo format API - chỉ gửi các field cần thiết
      const updateData = {
        firstName: values.firstName,
        lastName: values.lastName,
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
          username: profileData?.userName || "",
          lastName: profileData?.lastName || "",
          firstName: profileData?.firstName || "",
          phone: profileData?.phoneNumber || "",
          address: profileData?.address || "",
          gender: profileData?.gender || "MALE",
          dateOfBirth: profileData?.dateOfBirth 
            ? new Date(profileData.dateOfBirth).toISOString().split('T')[0]
            : ""
        }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <span>
                  {t('common.username')}
                  <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                </span>
              }
              name='username'
              required={false}>
              <Input placeholder="Enter username" />
            </Form.Item>
          </Col>
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
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <span>
                  {t('common.lastName')}
                  <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                </span>
              }
              name='lastName'
              required={false}>
              <Input placeholder="Enter last name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <span>
                  {t('common.firstName')}
                  <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                </span>
              }
              name='firstName'
              required={false}>
              <Input placeholder="Enter first name" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
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
          <Col span={12}>
            <Form.Item
              label={
                <span>
                  {t('common.dateOfBirth')}
                  <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                </span>
              }
              name='dateOfBirth'
              required={false}>
              <Input 
                type="date"
                placeholder="Select date of birth"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={
            <span>
              {t('common.address')}
              <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
            </span>
          }
          name='address'
          required={false}>
          <Input placeholder="Enter address" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
