import React, { useState, useEffect } from 'react';
import {
	Form,
	Input,
	Button,
	Select,
	InputNumber,
	Card,
	message,
	Space,
	Row,
	Col,
} from 'antd';
import {
	ArrowLeftOutlined,
	SaveOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
	createLesson,
	updateLesson,
} from '../../../../redux/syllabus';
import usePageTitle from '../../../../hooks/usePageTitle';
import syllabusManagementApi from '../../../../apis/backend/syllabusManagement';
import './SyllabusList.css';
import ThemedLayout from '../../../../component/ThemedLayout';
import { useTheme } from '../../../../contexts/ThemeContext';

const { TextArea } = Input;
const { Option } = Select;

const LessonFormPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { syllabusId, chapterId, lessonId } = useParams();
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const { loading } = useSelector((state) => state.syllabus);

	// Set page title
	usePageTitle(lessonId ? 'Edit Lesson' : 'Add Lesson');

	const [form] = Form.useForm();
	const [chapterInfo, setChapterInfo] = useState(null);
	const [isEditMode, setIsEditMode] = useState(false);

	// Fetch chapter info
	const fetchChapterInfo = async () => {
		if (!chapterId || !syllabusId) return;
		
		try {
			const response = await syllabusManagementApi.getChaptersBySyllabusId(syllabusId, {
				params: { page: 0, size: 100 }
			});
			
			// Find the specific chapter
			const chapter = response.data.find(c => c.id === parseInt(chapterId));
			if (chapter) {
				setChapterInfo({
					id: chapter.id,
					name: chapter.chapterName,
					description: chapter.description,
				});
			}
		} catch (error) {
			console.error('Error fetching chapter info:', error);
		}
	};

	// Fetch lesson data for editing
	const fetchLessonData = async () => {
		if (!lessonId) return;
		
		try {
			const response = await syllabusManagementApi.getLessonsByChapterId(chapterId, {
				params: { page: 0, size: 100 }
			});
			
			// Find the specific lesson
			const lesson = response.data.find(l => l.id === parseInt(lessonId));
			if (lesson) {
				form.setFieldsValue({
					name: lesson.lessonName || lesson.name,
					description: lesson.description,
					duration: lesson.duration,
					type: lesson.type,
					order: lesson.orderNumber || lesson.order,
				});
				setIsEditMode(true);
			}
		} catch (error) {
			console.error('Error fetching lesson data:', error);
		}
	};

	useEffect(() => {
		fetchChapterInfo();
		if (lessonId) {
			fetchLessonData();
		}
	}, [chapterId, syllabusId, lessonId]);

	const handleBack = () => {
		navigate(`/manager/syllabuses/${syllabusId}/chapters/${chapterId}/lessons`);
	};

	const handleSubmit = async (values) => {
		try {
			const lessonData = {
				chapterId: parseInt(chapterId),
				lessonName: values.name,
				description: values.description,
				duration: values.duration,
				type: values.type,
				orderNumber: values.order,
			};

			let response;
			if (isEditMode) {
				response = await dispatch(updateLesson({ id: parseInt(lessonId), ...lessonData }));
			} else {
				response = await dispatch(createLesson(lessonData));
			}
			
			// Handle success message from backend only
			const successMessage = response?.message || response?.data?.message;
			if (successMessage) {
				message.success(successMessage);
			}

			handleBack();
		} catch (error) {
			console.error('Error saving lesson:', error);
			
			// Handle error message from backend
			let errorMessage = error.response?.data?.error || 
				error.response?.data?.message || 
				error.message 
			
			message.error(errorMessage);
		}
	};

	const handleCancel = () => {
		handleBack();
	};

	if (!chapterInfo) {
		return (
			<ThemedLayout>
				<div className="lesson-form-container">
					<Card>
						<div style={{ textAlign: 'center', padding: '50px' }}>
							<h3>{t('lessonManagement.chapterNotFound')}</h3>
							<Button type="primary" onClick={handleBack}>
								{t('lessonManagement.backToLessons')}
							</Button>
						</div>
					</Card>
				</div>
			</ThemedLayout>
		);
	}

	return (
		<ThemedLayout>
			<div className="lesson-form-container">
				{/* Main Container Card */}
				<Card className="main-container-card">
					{/* Back Button */}
					<div style={{ marginBottom: '16px' }}>
						<Button 
							type="text" 
							icon={<ArrowLeftOutlined />}
							onClick={handleBack}
							style={{ padding: '4px 8px' }}
						>
							{t('common.back')}
						</Button>
					</div>

					{/* Header */}
					<div style={{ marginBottom: '24px' }}>
						<h2 
							style={{ 
								margin: 0, 
								fontSize: '24px', 
								fontWeight: 'bold',
								color: theme === 'space' ? '#ffffff' : '#000000'
							}}
						>
							{isEditMode ? t('lessonManagement.editLesson') : t('lessonManagement.addLesson')} - {chapterInfo.name}
						</h2>
					</div>

					{/* Form Card */}
					<Card className="table-card">
						<Form
							form={form}
							layout="vertical"
							onFinish={handleSubmit}
							initialValues={{
								type: 'theory',
								duration: 1,
								order: 1,
							}}
						>
							<Row gutter={24}>
								<Col span={12}>
									<Form.Item
										label={t('lessonManagement.lessonName')}
										name="name"
										rules={[
											{ required: true, message: t('lessonManagement.lessonNameRequired') },
											{ max: 255, message: t('lessonManagement.lessonNameMaxLength') }
										]}
									>
										<Input 
											placeholder={t('lessonManagement.lessonNamePlaceholder')}
											size="large"
										/>
									</Form.Item>
								</Col>
								<Col span={12}>
									<Form.Item
										label={t('lessonManagement.duration')}
										name="duration"
										rules={[
											{ required: true, message: t('lessonManagement.durationRequired') },
											{ type: 'number', min: 0.5, max: 10, message: t('lessonManagement.durationRange') }
										]}
									>
										<InputNumber 
											placeholder={t('lessonManagement.durationPlaceholder')}
											size="large"
											style={{ width: '100%' }}
											step={0.5}
											min={0.5}
											max={10}
											addonAfter={t('lessonManagement.hours')}
										/>
									</Form.Item>
								</Col>
							</Row>

							<Row gutter={24}>
								<Col span={12}>
									<Form.Item
										label={t('lessonManagement.lessonType')}
										name="type"
										rules={[{ required: true, message: t('lessonManagement.lessonTypeRequired') }]}
									>
										<Select 
											placeholder={t('lessonManagement.lessonTypePlaceholder')}
											size="large"
										>
											<Option value="theory">{t('lessonManagement.theory')}</Option>
											<Option value="practice">{t('lessonManagement.practice')}</Option>
											<Option value="mixed">{t('lessonManagement.mixed')}</Option>
										</Select>
									</Form.Item>
								</Col>
								<Col span={12}>
									<Form.Item
										label={t('lessonManagement.order')}
										name="order"
										rules={[
											{ required: true, message: t('lessonManagement.orderRequired') },
											{ type: 'number', min: 1, message: t('lessonManagement.orderMin') }
										]}
									>
										<InputNumber 
											placeholder={t('lessonManagement.orderPlaceholder')}
											size="large"
											style={{ width: '100%' }}
											min={1}
										/>
									</Form.Item>
								</Col>
							</Row>

							<Form.Item
								label={t('lessonManagement.description')}
								name="description"
								rules={[
									{ max: 1000, message: t('lessonManagement.descriptionMaxLength') }
								]}
							>
								<TextArea 
									placeholder={t('lessonManagement.descriptionPlaceholder')}
									rows={4}
									size="large"
								/>
							</Form.Item>

							<Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
								<Space>
									<Button 
										size="large"
										onClick={handleCancel}
									>
										{t('common.cancel')}
									</Button>
									<Button 
										type="primary" 
										htmlType="submit"
										size="large"
										icon={<SaveOutlined />}
										loading={loading}
									>
										{isEditMode ? t('common.update') : t('common.create')}
									</Button>
								</Space>
							</Form.Item>
						</Form>
					</Card>
				</Card>
			</div>
		</ThemedLayout>
	);
};

export default LessonFormPage;
