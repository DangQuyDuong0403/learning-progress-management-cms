import React, { useState, useEffect } from 'react';
import {
	Form,
	Input,
	Select,
	Button,
	Row,
	Col,
	DatePicker,
	Radio,
} from 'antd';
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
	const [isButtonDisabled, setIsButtonDisabled] = useState(false);

	useEffect(() => {
		if (teacher) {
			form.setFieldsValue({
				...teacher,
				dateOfBirth: teacher.dateOfBirth ? dayjs(teacher.dateOfBirth) : null,
			});
		}
	}, [teacher, form]);

	const handleSubmit = async (values) => {
		if (isButtonDisabled) return; // Prevent multiple submissions
		
		setLoading(true);
		setIsButtonDisabled(true);
		
		try {
			// Format data according to API requirements
			const processedData = {
				roleName: values.roleName || "TEACHER", // Use selected role or default to TEACHER
				email: values.email,
				fullName: values.fullName,
				avatarUrl: "string", // Always send "string" as per API example
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
			const errorMessage = error.response?.data?.error || error.message || t('teacherManagement.saveTeacherError');
			spaceToast.error(errorMessage);
		} finally {
			setLoading(false);
			// Re-enable button after 0.5 seconds
			setTimeout(() => {
				setIsButtonDisabled(false);
			}, 500);
		}
	};


	return (
		<div className={`teacher-form ${theme}-teacher-form`}>
			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
				initialValues={{
					gender: 'MALE' // Default to Male
				}}
			>

				{/* Basic Information */}
				<Row gutter={24}>
					<Col span={24}>
						<Form.Item
							name="fullName"
							label={
								<span>
									{t('teacherManagement.fullName')}
									<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
								</span>
							}
							rules={[
								{ required: true, message: t('teacherManagement.fullNameRequired') },
								{ min: 2, message: t('teacherManagement.nameMinLength') },
							]}
						>
							<Input 
								
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
							label={
								<span>
									{t('teacherManagement.email')}
									<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
								</span>
							}
							rules={[
								{ required: true, message: t('teacherManagement.emailRequired') },
								{ type: 'email', message: t('teacherManagement.emailInvalid') },
							]}
						>
							<Input 
								
								className={`form-input ${theme}-form-input`}
							/>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							name="phoneNumber"
							label={
								<span>
									{t('teacherManagement.phoneNumber')}
									<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
								</span>
							}
							rules={[
								{ required: true, message: t('teacherManagement.phoneNumberRequired') },
								{ pattern: /^[0-9]{10,11}$/, message: t('teacherManagement.phoneNumberInvalid') },
							]}
						>
							<Input 
								
								className={`form-input ${theme}-form-input`}
							/>
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={12}>
						<Form.Item
							name="roleName"
							label={
								<span>
									{t('teacherManagement.role')}
									<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
								</span>
							}
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
							rules={[
								{
									validator: (_, value) => {
										if (!value) return Promise.resolve();
										const selectedYear = value.year();
										if (selectedYear < 1920) {
											return Promise.reject(new Error('Date of birth must be from 1920 onwards'));
										}
										return Promise.resolve();
									}
								}
							]}
						>
							<DatePicker 
								style={{ width: '100%' }}
								placeholder={t('teacherManagement.dateOfBirthPlaceholder')}
								className={`form-input ${theme}-form-input`}
								format="DD/MM/YYYY"
								disabledDate={(current) => {
									// Disable dates before 1950-01-01
									return current && current.year() < 1920;
								}}
							/>
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={24}>
					<Col span={12}>
						<Form.Item
							name="gender"
							label={
								<span>
									{t('teacherManagement.gender')}
									<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
								</span>
							}
							rules={[{ required: true, message: t('teacherManagement.genderRequired') }]}
						>
							<Radio.Group>
								<Radio value="MALE">{t('teacherManagement.male')}</Radio>
								<Radio value="FEMALE">{t('teacherManagement.female')}</Radio>
								<Radio value="OTHER">{t('teacherManagement.other')}</Radio>
							</Radio.Group>
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
							disabled={isButtonDisabled}
							style={{ 
								width: '100%', 
								height: 40,
								backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
								background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
								borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
								color: theme === 'sun' ? '#000000' : '#ffffff',
							}}
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