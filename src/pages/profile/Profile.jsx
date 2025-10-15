import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Modal, Form, Row, Col, Input, Radio, Upload, Avatar } from 'antd';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import './Profile.css';
import ThemedLayout from '../../component/ThemedLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { getUserProfile } from '../../redux/auth';
import TableSpinner from '../../component/spinner/TableSpinner';

export default function Profile() {
  const { t } = useTranslation();
  const { user, profileData, profileLoading, profileError } = useSelector((state) => state.auth);
  const { theme } = useTheme();
  const dispatch = useDispatch();
  
  // Modal state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [avatarFileList, setAvatarFileList] = useState([]);
  
  // Spinner state
  const [showSpinner, setShowSpinner] = useState(true);
  const [spinnerCompleted, setSpinnerCompleted] = useState(false);

  // Fetch user profile data on component mount
  useEffect(() => {
    dispatch(getUserProfile());
  }, [dispatch]);

  // Handle profile error
  useEffect(() => {
    if (profileError) {
      toast.error('Failed to load profile data');
    }
  }, [profileError]);

  // Handle spinner completion when profile data is loaded
  useEffect(() => {
    if (!profileLoading && profileData) {
      // Add 100 second delay before starting fade out animation
      setTimeout(() => {
        setSpinnerCompleted(true);
      }, 1000);
    }
  }, [profileLoading, profileData]);

  // Handle spinner animation end
  const handleSpinnerAnimationEnd = () => {
    setShowSpinner(false);
  };


  function validateName(name) {
    // Only letters (including Vietnamese), spaces, at least 2 chars
    return /^[A-Za-zÀ-ỹà-ỹ\s]{2,}$/u.test(name);
  }

  function validateEmail(email) {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isFutureDate(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const inputDate = new Date(dateStr);
    return inputDate > today;
  }

  const handleEdit = () => {
    // Set form values from profile data
    form.setFieldsValue({
      username: profileData?.userName || "test1",
      lastName: profileData?.lastName || "Nguyen Duc",
      firstName: profileData?.firstName || "Anh",
      email: profileData?.email || "anhtony2003@gmail.com",
      phone: profileData?.phoneNumber || "0987654321",
      address: profileData?.address || "fsd",
      gender: profileData?.gender || "Male",
      dateOfBirth: profileData?.dateOfBirth 
        ? new Date(profileData.dateOfBirth).toISOString().split('T')[0]
        : "2003-05-16"
    });
    setIsEditModalVisible(true);
  };

  const handleModalUpdate = async () => {
    try {
      const values = await form.validateFields();
      
      // Validation
      if (!validateName(values.lastName)) {
        toast.error('Last name must be at least 2 letters, no numbers or special characters!');
        return;
      }
      if (!validateName(values.firstName)) {
        toast.error('First name must be at least 2 letters, no numbers or special characters!');
        return;
      }
      if (!validateEmail(values.email)) {
        toast.error(t('messages.invalidEmail'));
        return;
      }
      if (isFutureDate(values.dateOfBirth)) {
        toast.error('Date of birth cannot be in the future!');
        return;
      }
      
      toast.success(t('messages.updateSuccess'));
      setIsEditModalVisible(false);
      // ...submit logic here
    } catch (error) {
      toast.error('Please check your information');
    }
  };

  const handleModalCancel = () => {
    setIsEditModalVisible(false);
    form.resetFields();
    setAvatarFileList([]);
  };

  const handleAvatarChange = ({ fileList }) => {
    setAvatarFileList(fileList);
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      toast.error('You can only upload image files!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      toast.error('Image must be smaller than 2MB!');
      return false;
    }
    return false; // Prevent auto upload
  };

  

  // Show TableSpinner while fetching profile data or during fade animation
  if (showSpinner) {
    return (
      <ThemedLayout>
        <div className={`profile-container profile-page ${theme}-profile-container`} style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <TableSpinner 
            message={t('common.loading') || "Đang tải..."}
            isCompleted={spinnerCompleted}
            onAnimationEnd={handleSpinnerAnimationEnd}
          />
        </div>
      </ThemedLayout>
    );
  }

  return (
    <ThemedLayout>
      {/* Main Content Panel */}
      <div className={`profile-page main-content-panel ${theme}-main-panel`}>
        {/* Header Section */}
        <div className={`panel-header ${theme}-panel-header`}>
          <div className='search-section'>
            <div style={{width: 500}}></div>
          </div>
          <div className='action-buttons'>
            <button className={`btn btn-primary ${theme}-btn-primary`} onClick={handleEdit}>
              {t('common.edit')}
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className={`content-section ${theme}-content-section`}>
          <div className="profile-cards">
            {/* Personal Information Card */}
            <div className={`profile-card personal-info-card ${theme}-profile-card`}>
              <div className={`card-header ${theme}-card-header`}>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: '1.5rem',
                    letterSpacing: '0.5px',
                    margin: 0,
                  }}
                >
                  {t('common.personalInformation')}
                </h3>
                <i className="ti ti-user"></i>
              </div>
              <div className="card-content">
                <div className="profile-info-layout">
                  {/* Left side - Profile Picture and Name */}
                  <div className="profile-left">
                    <div className="profile-picture-container">
                      <div className="profile-picture-placeholder">
                        <img 
                          src={profileData?.avatarUrl || "/img/avatar_1.png"} 
                          alt="Profile" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                        />
                      </div>
                    </div>
                    <div className="profile-name-section">
                      <h4 className="profile-full-name">
                        {profileData ? `${profileData.lastName} ${profileData.firstName}` : (user?.fullName || 'Nguyen Duc Anh')}
                      </h4>
                      <p className="profile-role">{profileData?.roleName || user?.role || 'Admin'}</p>
                    </div>
                  </div>
                  
                  {/* Right side - Personal Info Display */}
                  <div className="profile-right">
                    {/* Username Field */}
                    <div className="form-group">
                      <label className={`form-label ${theme}-form-label`}>{t('common.username')}</label>
                      <div className={`form-display ${theme}-form-display`}>
                        {profileData?.userName || "test1"}
                      </div>
                    </div>

                    {/* Name Fields Row */}
                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className={`form-label ${theme}-form-label`}>{t('common.lastName')}</label>
                        <div className={`form-display ${theme}-form-display`}>
                          {profileData?.lastName || "Nguyen Duc"}
                        </div>
                      </div>
                      <div className="form-group" style={{ flex: 1, marginLeft: '1rem' }}>
                        <label className={`form-label ${theme}-form-label`}>{t('common.firstName')}</label>
                        <div className={`form-display ${theme}-form-display`}>
                          {profileData?.firstName || "Anh"}
                        </div>
                      </div>
                    </div>

                    {/* Gender and Date of Birth Row */}
                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className={`form-label ${theme}-form-label`}>{t('common.gender')}</label>
                        <div className={`form-display ${theme}-form-display`}>
                          {profileData?.gender || "Male"}
                        </div>
                      </div>
                      <div className="form-group" style={{ flex: 1, marginLeft: '1rem' }}>
                        <label className={`form-label ${theme}-form-label`}>{t('common.dateOfBirth')}</label>
                        <div className={`form-display ${theme}-form-display`}>
                          {profileData?.dateOfBirth 
                            ? new Date(profileData.dateOfBirth).toLocaleDateString()
                            : "16/05/2003"
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className={`profile-card contact-info-card ${theme}-profile-card`}>
              <div className={`card-header ${theme}-card-header`}>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: '1.5rem',
                    letterSpacing: '0.5px',
                    margin: 0,
                  }}
                >
                  {t('common.contactInformation')}
                </h3>
                <i className="ti ti-mail"></i>
              </div>
              <div className="card-content">
                <div className="contact-info-layout">
                  {/* Email Field */}
                  <div className="form-group">
                    <label className={`form-label ${theme}-form-label`}>{t('common.email')}</label>
                    <div className={`form-display ${theme}-form-display`}>
                      {profileData?.email || "anhtony2003@gmail.com"}
                    </div>
                  </div>

                  {/* Phone Number Field */}
                  <div className="form-group">
                    <label className={`form-label ${theme}-form-label`}>{t('common.phoneNumber')}</label>
                    <div className={`form-display ${theme}-form-display`}>
                      {profileData?.phoneNumber || "0987654321"}
                    </div>
                  </div>

                  {/* Address Field */}
                  <div className="form-group">
                    <label className={`form-label ${theme}-form-label`}>{t('common.address')}</label>
                    <div className={`form-display ${theme}-form-display`}>
                      {profileData?.address || "fsd"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
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
            {t('common.editProfile')}
          </div>
        }
        open={isEditModalVisible}
        onOk={handleModalUpdate}
        onCancel={handleModalCancel}
        width={600}
        okText={t('common.update')}
        cancelText={t('common.cancel')}
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
            gender: 'Male',
          }}>
          {/* Avatar Upload */}
          <Form.Item
            label={
              <span>
                {t('common.avatar')}
                <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
              </span>
            }
            name='avatar'
            rules={[
              {
                required: true,
                message: 'Avatar is required',
              },
            ]}
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
            <Col span={12}>
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
            </Col>
          </Row>
        </Form>
      </Modal>
    </ThemedLayout>
  );
    }
