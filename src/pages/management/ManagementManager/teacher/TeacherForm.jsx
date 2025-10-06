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
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const TeacherForm = ({ teacher, onClose }) => {
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
			setAvatarUrl(teacher.avatar);
		}
	}, [teacher, form]);

	const handleSubmit = async (values) => {
		setLoading(true);
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			const teacherData = {
				...values,
				dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null,
				avatar: avatarUrl,
			};

			if (teacher) {
				// Update existing teacher
				spaceToast.success(t('teacherManagement.updateTeacherSuccess'));
			} else {
				// Create new teacher
				spaceToast.success(t('teacherManagement.createTeacherSuccess'));
			}

			onClose();
		} catch (error) {
			spaceToast.error(t('teacherManagement.saveTeacherError'));
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
					role: 'teacher',
					status: 'active',
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

				{/* Account Information */}
				<Row gutter={24}>
					<Col span={12}>
						<Form.Item
							name="username"
							label={t('teacherManagement.username')}
							rules={[
								{ required: true, message: t('teacherManagement.usernameRequired') },
								{ min: 3, message: t('teacherManagement.usernameMinLength') },
								{ pattern: /^[a-zA-Z0-9_]+$/, message: t('teacherManagement.usernamePattern') },
							]}
						>
							<Input 
								placeholder={t('teacherManagement.usernamePlaceholder')}
								className={`form-input ${theme}-form-input`}
								disabled={!!teacher} // Disable username when editing
							/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							name="password"
							label={t('teacherManagement.password')}
							rules={[
								{ required: !teacher, message: t('teacherManagement.passwordRequired') },
								{ min: 6, message: t('teacherManagement.passwordMinLength') },
							]}
						>
							<Input.Password 
								placeholder={teacher ? t('teacherManagement.passwordPlaceholderEdit') : t('teacherManagement.passwordPlaceholder')}
								className={`form-input ${theme}-form-input`}
							/>
						</Form.Item>
					</Col>
				</Row>

				{/* Basic Information */}
				<Row gutter={24}>
					<Col span={12}>
						<Form.Item
							name="name"
							label={t('teacherManagement.name')}
							rules={[
								{ required: true, message: t('teacherManagement.nameRequired') },
								{ min: 2, message: t('teacherManagement.nameMinLength') },
							]}
						>
							<Input 
								placeholder={t('teacherManagement.namePlaceholder')}
								className={`form-input ${theme}-form-input`}
							/>
						</Form.Item>
					</Col>
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
				</Row>

				<Row gutter={24}>
					<Col span={12}>
						<Form.Item
							name="phone"
							label={t('teacherManagement.phone')}
							rules={[
								{ required: true, message: t('teacherManagement.phoneRequired') },
								{ pattern: /^[0-9]{10,11}$/, message: t('teacherManagement.phoneInvalid') },
							]}
						>
							<Input 
								placeholder={t('teacherManagement.phonePlaceholder')}
								className={`form-input ${theme}-form-input`}
							/>
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

				{/* Professional Information */}
				<Row gutter={24}>
					<Col span={12}>
						<Form.Item
							name="role"
							label={t('teacherManagement.role')}
							rules={[{ required: true, message: t('teacherManagement.roleRequired') }]}
						>
							<Select 
								placeholder={t('teacherManagement.rolePlaceholder')}
								className={`custom-dropdown ${theme}-custom-dropdown`}
							>
								<Option value="teacher">{t('teacherManagement.teacher')}</Option>
								<Option value="teacher_assistant">{t('teacherManagement.teacherAssistant')}</Option>
							</Select>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							name="specialization"
							label={t('teacherManagement.specialization')}
							rules={[{ required: true, message: t('teacherManagement.specializationRequired') }]}
						>
							<Select 
								placeholder={t('teacherManagement.specializationPlaceholder')}
								className={`custom-dropdown ${theme}-custom-dropdown`}
							>
								<Option value="Mathematics">{t('teacherManagement.mathematics')}</Option>
								<Option value="English">{t('teacherManagement.english')}</Option>
								<Option value="Physics">{t('teacherManagement.physics')}</Option>
								<Option value="Chemistry">{t('teacherManagement.chemistry')}</Option>
								<Option value="Biology">{t('teacherManagement.biology')}</Option>
								<Option value="History">{t('teacherManagement.history')}</Option>
								<Option value="Geography">{t('teacherManagement.geography')}</Option>
								<Option value="Computer Science">{t('teacherManagement.computerScience')}</Option>
							</Select>
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={12}>
						<Form.Item
							name="experience"
							label={t('teacherManagement.experience')}
							rules={[{ required: true, message: t('teacherManagement.experienceRequired') }]}
						>
							<Input 
								placeholder={t('teacherManagement.experiencePlaceholder')}
								className={`form-input ${theme}-form-input`}
							/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							name="status"
							label={t('teacherManagement.status')}
							rules={[{ required: true, message: t('teacherManagement.statusRequired') }]}
						>
							<Select 
								placeholder={t('teacherManagement.statusPlaceholder')}
								className={`custom-dropdown ${theme}-custom-dropdown`}
							>
								<Option value="active">{t('teacherManagement.active')}</Option>
								<Option value="inactive">{t('teacherManagement.inactive')}</Option>
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

				{/* Bio */}
				<Form.Item
					name="bio"
					label={t('teacherManagement.bio')}
				>
					<TextArea 
						rows={4}
						placeholder={t('teacherManagement.bioPlaceholder')}
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