import React, { useState, useEffect } from 'react';
import {
	Form,
	Input,
	Select,
	Button,
	Row,
	Col,
	Upload,
	Avatar,
	message,
	DatePicker,
} from 'antd';
import {
	UserOutlined,
	UploadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import { teacherManagementApi } from '../../../../apis/apis';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const TeacherForm = ({ teacher, onClose, onSuccess }) => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState(null);

	useEffect(() => {
		if (teacher) {
			form.setFieldsValue({
				...teacher,
				dateOfBirth: teacher.dateOfBirth ? dayjs(teacher.dateOfBirth) : null,
			});
			setAvatarUrl(teacher.avatarUrl);
		}
	}, [teacher, form]);

	const handleSubmit = async (values) => {
		setLoading(true);
		try {
			// Format data according to API requirements
			const processedData = {
				roleName: values.roleName || "TEACHER", // Use selected role or default to TEACHER
				email: values.email,
				firstName: values.firstName,
				lastName: values.lastName,
				avatarUrl: avatarUrl || "string", // Default to "string" if no avatar
				dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
				address: values.address || "",
				phoneNumber: values.phoneNumber,
				gender: values.gender || "MALE", // Default to MALE if not specified
			};

			if (teacher) {
				// Update existing teacher
				const response = await teacherManagementApi.updateTeacherProfile(teacher.id, processedData);
				if (response.success) {
					spaceToast.success(t('teacherManagement.updateTeacherSuccess'));
				} else {
					throw new Error(response.message || 'Failed to update teacher');
				}
			} else {
				// Create new teacher
				const response = await teacherManagementApi.createTeacher(processedData);
				if (response.success) {
					spaceToast.success(t('teacherManagement.createTeacherSuccess'));
				} else {
					throw new Error(response.message || 'Failed to create teacher');
				}
			}

			onClose();
			if (onSuccess) {
				onSuccess();
			}
		} catch (error) {
			console.error('Error saving teacher:', error);
			const errorMessage = error.response?.data?.message || error.message || t('teacherManagement.saveTeacherError');
			spaceToast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const handleAvatarChange = (info) => {
		if (info.file.status === 'done') {
			// Simulate successful upload
			const url = URL.createObjectURL(info.file.originFileObj);
			setAvatarUrl(url);
			message.success(t('teacherManagement.avatarUploadSuccess'));
		} else if (info.file.status === 'error') {
			message.error(t('teacherManagement.avatarUploadError'));
		}
	};

	const uploadProps = {
		name: 'avatar',
		listType: 'picture',
		showUploadList: false,
		beforeUpload: (file) => {
			const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
			if (!isJpgOrPng) {
				message.error(t('teacherManagement.avatarFormatError'));
			}
			const isLt2M = file.size / 1024 / 1024 < 2;
			if (!isLt2M) {
				message.error(t('teacherManagement.avatarSizeError'));
			}
			return isJpgOrPng && isLt2M;
		},
		onChange: handleAvatarChange,
	};

	return (
		<div className={`teacher-form ${theme}-teacher-form`}>
			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
				initialValues={{
					// No default values - user must select
				}}
			>
				{/* Avatar Section */}
				<Row gutter={24} style={{ marginBottom: 24 }}>
					<Col span={24} style={{ textAlign: 'center' }}>
						<div className="avatar-section">
							<Avatar
								size={120}
								icon={<UserOutlined />}
								src={avatarUrl}
								style={{ 
									backgroundColor: '#1890ff',
									marginBottom: 16,
									border: `3px solid ${theme === 'space' ? 'rgba(77, 208, 255, 0.5)' : 'rgba(0, 0, 0, 0.1)'}`,
									boxShadow: `0 4px 12px ${theme === 'space' ? 'rgba(77, 208, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`
								}}
							/>
							<div>
								<Upload {...uploadProps}>
									<Button 
										icon={<UploadOutlined />}
										className={`upload-button ${theme}-upload-button`}
									>
										{t('teacherManagement.uploadAvatar')}
									</Button>
								</Upload>
							</div>
						</div>
					</Col>
				</Row>

				{/* Basic Information */}
				<Row gutter={24}>
					<Col span={12}>
						<Form.Item
							name="firstName"
							label={t('teacherManagement.firstName')}
							rules={[
								{ required: true, message: t('teacherManagement.firstNameRequired') },
								{ min: 2, message: t('teacherManagement.firstNameMinLength') },
							]}
						>
							<Input 
								placeholder={t('teacherManagement.firstNamePlaceholder')}
								className={`form-input ${theme}-form-input`}
							/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							name="lastName"
							label={t('teacherManagement.lastName')}
							rules={[
								{ required: true, message: t('teacherManagement.lastNameRequired') },
								{ min: 2, message: t('teacherManagement.lastNameMinLength') },
							]}
						>
							<Input 
								placeholder={t('teacherManagement.lastNamePlaceholder')}
								className={`form-input ${theme}-form-input`}
							/>
						</Form.Item>
					</Col>
				</Row>

				{/* Contact Information */}
				<Row gutter={24}>
					<Col span={12}>
						<Form.Item
							name="email"
							label={t('teacherManagement.email')}
							rules={[
								{ required: true, message: t('teacherManagement.emailRequired') },
								{ type: 'email', message: t('teacherManagement.emailInvalid') },
							]}
						>
							<Input 
								placeholder={t('teacherManagement.emailPlaceholder')}
								className={`form-input ${theme}-form-input`}
							/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							name="phoneNumber"
							label={t('teacherManagement.phoneNumber')}
							rules={[
								{ required: true, message: t('teacherManagement.phoneNumberRequired') },
								{ pattern: /^[0-9]{10,11}$/, message: t('teacherManagement.phoneNumberInvalid') },
							]}
						>
							<Input 
								placeholder={t('teacherManagement.phoneNumberPlaceholder')}
								className={`form-input ${theme}-form-input`}
							/>
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={12}>
						<Form.Item
							name="roleName"
							label={t('teacherManagement.role')}
							rules={[{ required: true, message: t('teacherManagement.roleRequired') }]}
						>
							<Select 
								placeholder={t('teacherManagement.rolePlaceholder')}
								className={`custom-dropdown ${theme}-custom-dropdown`}
							>
								<Option value="TEACHER">{t('teacherManagement.teacher')}</Option>
								<Option value="TEACHING_ASSISTANT">{t('teacherManagement.teacherAssistant')}</Option>
							</Select>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							name="dateOfBirth"
							label={t('teacherManagement.dateOfBirth')}
						>
							<DatePicker 
								style={{ width: '100%' }}
								placeholder={t('teacherManagement.dateOfBirthPlaceholder')}
								className={`form-input ${theme}-form-input`}
								format="DD/MM/YYYY"
							/>
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={12}>
						<Form.Item
							name="gender"
							label={t('teacherManagement.gender')}
							rules={[{ required: true, message: t('teacherManagement.genderRequired') }]}
						>
							<Select 
								placeholder={t('teacherManagement.genderPlaceholder')}
								className={`custom-dropdown ${theme}-custom-dropdown`}
							>
								<Option value="MALE">{t('teacherManagement.male')}</Option>
								<Option value="FEMALE">{t('teacherManagement.female')}</Option>
								<Option value="OTHER">{t('teacherManagement.other')}</Option>
							</Select>
						</Form.Item>
					</Col>
				</Row>


				{/* Address */}
				<Form.Item
					name="address"
					label={t('teacherManagement.address')}
				>
					<TextArea 
						rows={3}
						placeholder={t('teacherManagement.addressPlaceholder')}
						className={`form-input ${theme}-form-input`}
					/>
				</Form.Item>

				{/* Action Buttons */}
				<Row gutter={16} style={{ marginTop: 32 }}>
					<Col span={12}>
						<Button
							type="default"
							onClick={onClose}
							style={{ width: '100%', height: 40 }}
							className={`cancel-button ${theme}-cancel-button`}
						>
							{t('common.cancel')}
						</Button>
					</Col>
					<Col span={12}>
						<Button
							type="primary"
							htmlType="submit"
							loading={loading}
							style={{ width: '100%', height: 40 }}
							className={`submit-button ${theme}-submit-button`}
						>
							{teacher ? t('common.update') : t('common.save')}
						</Button>
					</Col>
				</Row>
			</Form>
		</div>
	);
};

export default TeacherForm;