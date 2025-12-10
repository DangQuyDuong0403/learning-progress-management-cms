import React, { useState, useEffect } from 'react';
import {
	Form,
	Input,
	Select,
	Button,
	message,
	Space,
	Row,
	Col,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import usePageTitle from '../../../../hooks/usePageTitle';
import syllabusManagementApi from '../../../../apis/backend/syllabusManagement';
import levelManagementApi from '../../../../apis/backend/levelManagement';
import { spaceToast } from '../../../../component/SpaceToastify';

const { TextArea } = Input;
const { Option } = Select;

const SyllabusForm = ({ syllabus, onClose, onSuccess }) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { theme } = useTheme();
	
	// Set page title
	usePageTitle(syllabus ? 'Edit Syllabus' : 'Add Syllabus');
	
	const [form] = Form.useForm();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isButtonDisabled, setIsButtonDisabled] = useState(false);
	const [loading, setLoading] = useState(false);
	const [levels, setLevels] = useState([]);

	const isEdit = !!syllabus;

	useEffect(() => {
		// Load published levels when component mounts
		const fetchPublishedLevels = async () => {
			setLoading(true);
			try {
				const params = {
					page: 0,
					size: 100, // Get all published levels
				};
				
				const response = await levelManagementApi.getPublishedLevels({
					params: params,
				});
				
				// Handle different response structures
				const levelsData = response.data?.content || response.data || [];
				setLevels(levelsData);
				
			} catch (error) {
				console.error('Error fetching published levels:', error);
				
				// Handle error message from backend
				let errorMessage = error.response?.data?.error || 
					error.response?.data?.message || 
					error.message ||
					t('levelManagement.loadLevelsError') || 'Failed to load levels';
				
				message.error(errorMessage);
				setLevels([]); // Set empty array on error
			} finally {
				setLoading(false);
			}
		};
		fetchPublishedLevels();
	}, [t]);

	// Set form values after levels are loaded (for edit mode)
	useEffect(() => {
		if (syllabus && levels.length > 0) {
			// Map syllabus data to form format
			const formData = {
				...syllabus,
				levelId: syllabus.level?.id || syllabus.levelId // Use level.id if available, fallback to levelId
			};
			form.setFieldsValue(formData);
		}
	}, [syllabus, levels, form]);

	const onFinish = async (values) => {
		if (isButtonDisabled) return; // Prevent multiple submissions
		
		setIsSubmitting(true);
		setIsButtonDisabled(true);
		
		try {
			// Map form values to API request body format
			const requestBody = {
				syllabusName: values.name,
				levelId: values.levelId,
				description: values.description,
				// Add other fields if needed
				...(values.duration && { duration: values.duration }),
				...(values.status && { status: values.status }),
				...(values.objectives && { objectives: values.objectives }),
				...(values.learningOutcomes && { learningOutcomes: values.learningOutcomes }),
				...(values.assessmentCriteria && { assessmentCriteria: values.assessmentCriteria }),
			};

			let response;
			if (isEdit) {
				response = await syllabusManagementApi.updateSyllabus(syllabus.id, requestBody);
				
				// Show success message from backend
				spaceToast.success(response.message);
				
				// Call onSuccess callback to refresh the list
				if (onSuccess) {
					onSuccess();
				}
				
				onClose();
			} else {
				response = await syllabusManagementApi.createSyllabus(requestBody);
				spaceToast.success(response.message);
				
				// Navigate to chapter list of the newly created syllabus
				if (response.data && response.data.id) {
					navigate(`/manager/syllabuses/${response.data.id}/chapters`);
				} else {
					// Fallback: call onSuccess callback to refresh the list
					if (onSuccess) {
						onSuccess();
					}
					onClose();
				}
			}
		} catch (error) {
			console.error('Error saving syllabus:', error);
			
			// Handle error message from backend
			let errorMessage = error.response?.data?.error || 
				error.response?.data?.message || 
				error.message ||
				(isEdit ? t('syllabusManagement.updateSyllabusError') : t('syllabusManagement.addSyllabusError'));
			
				spaceToast.error(errorMessage);
		} finally {
			setIsSubmitting(false);
			// Re-enable button after 0.5 seconds
			setTimeout(() => {
				setIsButtonDisabled(false);
			}, 500);
		}
	};

	const onCancel = () => {
		form.resetFields();
		onClose();
	};


	return (
		<Form
			form={form}
			layout="vertical"
			onFinish={onFinish}
			initialValues={{
				status: 'active',
				duration: 12,
				...syllabus,
			}}
		>
			<Row gutter={16}>
				<Col span={12}>
					<Form.Item
						name="name"
						label={<span>{t('syllabusManagement.syllabusName')} <span style={{ color: 'red' }}>*</span></span>}
						rules={[
							{
								required: true,
								message: t('syllabusManagement.syllabusNameRequired'),
							},
							{
								min: 2,
								message: t('syllabusManagement.syllabusNameMinLength'),
							},
							{
								max: 100,
								message: t('syllabusManagement.syllabusNameTooLong'),
							},
						]}
					>
						<Input
							placeholder={t('syllabusManagement.syllabusNamePlaceholder')}
							size="large"
							maxLength={100}
							showCount
						/>
					</Form.Item>
				</Col>
				<Col span={12}>
					<Form.Item
						name="levelId"
						label={<span>{t('syllabusManagement.level')} <span style={{ color: 'red' }}>*</span></span>}
						rules={[
							{
								required: true,
								message: t('syllabusManagement.levelRequired'),
							},
						]}
					>
						<Select
							placeholder={loading ? t('common.loading') : t('syllabusManagement.selectLevel')}
							size="large"
							loading={loading}
							disabled={loading}
							notFoundContent={loading ? t('common.loading') : t('syllabusManagement.noLevelsFound')}
						>
							{levels.map((level) => {
								// Handle different field names that might come from API
								const levelName = level.name || level.levelName || level.title || 'Unknown Level';
								const levelCode = level.code || level.levelCode || '';
								
								return (
									<Option key={level.id} value={level.id}>
										{levelName} {levelCode ? `(${levelCode})` : ''}
									</Option>
								);
							})}
						</Select>
					</Form.Item>
				</Col>
			</Row>

			<Form.Item
				name="description"
				label={t('syllabusManagement.description')}
			>
				<TextArea
					rows={3}
					autoSize={{ minRows: 4, maxRows: 8 }}
					placeholder={t('syllabusManagement.descriptionPlaceholder')}
					maxLength={500}
					showCount
					style={{ resize: 'none' ,marginBottom: '10px'}}
				/>
			</Form.Item>

			{/* <Row gutter={16}>
				<Col span={8}>
					<Form.Item
						name="duration"
						label={t('syllabusManagement.duration')}
						rules={[
							{
								required: true,
								message: t('syllabusManagement.durationRequired'),
							},
							{
								type: 'number',
								min: 1,
								max: 52,
								message: t('syllabusManagement.durationRange'),
							},
						]}
					>
						<InputNumber
							min={1}
							max={52}
							placeholder={t('syllabusManagement.durationPlaceholder')}
							style={{ width: '100%' }}
							size="large"
							addonAfter={t('syllabusManagement.weeks')}
						/>
					</Form.Item>
				</Col>
				<Col span={8}>
					<Form.Item
						name="totalLessons"
						label={t('syllabusManagement.totalLessons')}
						rules={[
							{
								type: 'number',
								min: 1,
								message: t('syllabusManagement.totalLessonsMin'),
							},
						]}
					>
						<InputNumber
							min={1}
							placeholder={t('syllabusManagement.totalLessonsPlaceholder')}
							style={{ width: '100%' }}
							size="large"
							addonAfter={t('syllabusManagement.lessons')}
						/>
					</Form.Item>
				</Col>
				<Col span={8}>
					<Form.Item
						name="status"
						label={t('syllabusManagement.status')}
						rules={[
							{
								required: true,
								message: t('syllabusManagement.statusRequired'),
							},
						]}
					>
						<Select
							placeholder={t('syllabusManagement.selectStatus')}
							size="large"
						>
							{statusOptions.map((option) => (
								<Option key={option.value} value={option.value}>
									{option.label}
								</Option>
							))}
						</Select>
					</Form.Item>
				</Col>
			</Row>

			<Form.Item
				name="objectives"
				label={t('syllabusManagement.objectives')}
			>
				<TextArea
					rows={4}
					placeholder={t('syllabusManagement.objectivesPlaceholder')}
					maxLength={1000}
					showCount
				/>
			</Form.Item>

			<Form.Item
				name="learningOutcomes"
				label={t('syllabusManagement.learningOutcomes')}
			>
				<TextArea
					rows={4}
					placeholder={t('syllabusManagement.learningOutcomesPlaceholder')}
					maxLength={1000}
					showCount
				/>
			</Form.Item>

			<Form.Item
				name="assessmentCriteria"
				label={t('syllabusManagement.assessmentCriteria')}
			>
				<TextArea
					rows={3}
					placeholder={t('syllabusManagement.assessmentCriteriaPlaceholder')}
					maxLength={500}
					showCount
				/>
			</Form.Item> */}

			<Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
				<Space>
					<Button onClick={onCancel} size="large">
						{t('common.cancel')}
					</Button>
					<Button
						type="primary"
						htmlType="submit"
						loading={isSubmitting || loading}
						disabled={isButtonDisabled}
						size="large"
						style={{
							background: theme === 'sun' 
								? 'rgb(113, 179, 253)' 
								: 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
							color: theme === 'sun' ? '#000' : '#fff',
							borderColor: theme === 'sun' 
								? 'rgb(113, 179, 253)' 
								: 'transparent'
						}}
					>
						{isEdit ? t('common.update') : t('common.save')}
					</Button>
				</Space>
			</Form.Item>
		</Form>
	);
};

export default SyllabusForm;
