import React, { useState, useEffect } from 'react';
import {
	Form,
	Input,
	Button,
	message,
	Space,
} from 'antd';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;

const LessonForm = ({ lesson, chapter, onClose, theme }) => {
	const { t } = useTranslation();

	const [form] = Form.useForm();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEdit = !!lesson;

	useEffect(() => {
		if (lesson) {
			form.setFieldsValue(lesson);
		}
	}, [lesson, form]);

	const onFinish = async (values) => {
		setIsSubmitting(true);
		try {
			// Map form values to API format - chỉ cần lessonName và content
			const lessonData = {
				name: values.name,
				content: values.content || '',
			};

			// Return data to parent component instead of calling API
			message.success(
				isEdit
					? t('lessonManagement.updateLessonSuccess')
					: t('lessonManagement.addLessonSuccess')
			);
			onClose(true, lessonData); // Pass data to parent
		} catch (error) {
			message.error(
				isEdit
					? t('lessonManagement.updateLessonError')
					: t('lessonManagement.addLessonError')
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const onCancel = () => {
		form.resetFields();
		onClose(false); // Pass false to indicate cancel
	};

	return (
		<Form
			form={form}
			layout="vertical"
			onFinish={onFinish}
			initialValues={{
				...lesson,
			}}
		>
			<Form.Item
				name="name"
				label={
					<span>
						{t('lessonManagement.lessonName')}
						<span style={{ color: 'red', marginLeft: '4px' }}>*</span>
					</span>
				}
				rules={[
					{
						required: true,
						message: t('lessonManagement.lessonNameRequired'),
					},
					{
						min: 2,
						message: t('lessonManagement.lessonNameMinLength'),
					},
				]}
			>
				<Input
					placeholder={t('lessonManagement.lessonNamePlaceholder')}
					size="large"
				/>
			</Form.Item>

			<Form.Item
				name="content"
				label={t('lessonManagement.content')}
				rules={[
					{
						message: t('lessonManagement.contentMinLength'),
					},
				]}
			>
				<TextArea
					rows={4}
					placeholder={t('lessonManagement.contentPlaceholder')}
					maxLength={1000}
					showCount
				/>
			</Form.Item>

			<Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
				<Space>
					<Button 
						onClick={onCancel} 
						size="large"
						style={{
							height: '40px',
							fontSize: '16px',
							fontWeight: '500',
							minWidth: '100px'
						}}
					>
						{t('common.cancel')}
					</Button>
					<Button
						type="primary"
						htmlType="submit"
						loading={isSubmitting}
						size="large"
						style={{
							backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
							background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
							borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
							color: theme === 'sun' ? '#000000' : '#ffffff',
							height: '40px',
							fontSize: '16px',
							fontWeight: '500',
							minWidth: '100px'
						}}
					>
						{isEdit ? t('common.update') : t('common.save')}
					</Button>
				</Space>
			</Form.Item>
		</Form>
	);
};

export default LessonForm;