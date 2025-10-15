import React, { useState } from 'react';
import { Modal, Form, Row, Col, Input, Radio, Upload, Avatar } from 'antd';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';
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
  const [avatarFileList, setAvatarFileList] = useState([]);

  function validateName(name) {
    return /^[A-Za-zÀ-ỹà-ỹ\s]{2,}$/u.test(name);
  }

  function isFutureDate(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const inputDate = new Date(dateStr);
    return inputDate > today;
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Validation
      if (!validateName(values.lastName)) {
        spaceToast.error('Last name must be at least 2 letters, no numbers or special characters!');
        return;
      }
      if (!validateName(values.firstName)) {
        spaceToast.error('First name must be at least 2 letters, no numbers or special characters!');
        return;
      }
      if (isFutureDate(values.dateOfBirth)) {
        spaceToast.error('Date of birth cannot be in the future!');
        return;
      }

      // Chuẩn bị dữ liệu theo format API - chỉ gửi các field cần thiết
      const updateData = {
        firstName: values.firstName,
        lastName: values.lastName,
        avatarUrl: profileData?.avatarUrl || "string", // Luôn gửi string, không gửi File object
        dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : new Date("2003-10-15").toISOString(), // Format ISO với time và timezone
        address: values.address,
        phoneNumber: values.phone,
        gender: values.gender === "Male" ? "MALE" : values.gender === "Female" ? "FEMALE" : "OTHER"
      };

      console.log('Update Profile Data:', updateData);
      
      // Dispatch action để update profile
      const result = await dispatch(updateProfile(updateData)).unwrap();
      
      if (result.success) {
        spaceToast.success(t('common.profileUpdated'));
        onSuccess(result.data);
        handleCancel();
      }
    } catch (error) {
      console.error('Update Profile Error:', error);
      spaceToast.error(error.message || t('common.profileUpdateFailed'));
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setAvatarFileList([]);
    onCancel();
  };

  const handleAvatarChange = ({ fileList }) => {
    setAvatarFileList(fileList);
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      spaceToast.error('You can only upload image files!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      spaceToast.error('Image must be smaller than 2MB!');
      return false;
    }
    return false; // Prevent auto upload
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
          gender: profileData?.gender || "Male",
          dateOfBirth: profileData?.dateOfBirth 
            ? new Date(profileData.dateOfBirth).toISOString().split('T')[0]
            : ""
        }}>
        {/* Avatar Upload */}
        <Form.Item
          label={
            <span>
              {t('common.avatar')}
            </span>
          }
          name='avatar'
          required={false}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Avatar
              size={80}
              src={avatarFileList.length > 0 ? URL.createObjectURL(avatarFileList[0].originFileObj) : (profileData?.avatarUrl || "/img/avatar_1.png")}
              icon={<UserOutlined />}
            />
            <Upload
              fileList={avatarFileList}
              onChange={handleAvatarChange}
              beforeUpload={beforeUpload}
              maxCount={1}
              listType="picture-card"
              showUploadList={false}>
              <div style={{ textAlign: 'center' }}>
                <UploadOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                <div style={{ marginTop: '8px', color: '#1890ff' }}>Upload Avatar</div>
              </div>
            </Upload>
          </div>
        </Form.Item>

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
              rules={[
                {
                  required: true,
                  message: 'Username is required',
                },
                {
                  min: 3,
                  message: 'Username must be at least 3 characters',
                },
              ]}
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
              rules={[
                {
                  required: true,
                  message: 'Phone number is required',
                },
                {
                  pattern: /^[0-9]{10,11}$/,
                  message: 'Please enter a valid phone number',
                },
              ]}
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
              rules={[
                {
                  required: true,
                  message: 'Last name is required',
                },
              ]}
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
              rules={[
                {
                  required: true,
                  message: 'First name is required',
                },
              ]}
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
              rules={[
                {
                  required: true,
                  message: 'Gender is required',
                },
              ]}
              required={false}>
              <Radio.Group>
                <Radio value="Male">{t('common.male')}</Radio>
                <Radio value="Female">{t('common.female')}</Radio>
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
              rules={[
                {
                  required: true,
                  message: 'Date of birth is required',
                },
              ]}
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
          rules={[
            {
              required: true,
              message: 'Address is required',
            },
          ]}
          required={false}>
          <Input placeholder="Enter address" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
