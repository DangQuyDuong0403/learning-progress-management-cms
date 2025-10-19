import React, { useState, useEffect } from 'react';
import {
	Form,
	Input,
	Button,
	message,
	Space,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';

const ChapterForm = ({ chapter, syllabus, onClose }) => {
	const { t } = useTranslation();
	const { theme } = useTheme();

	const [form] = Form.useForm();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEdit = !!chapter;

	useEffect(() => {
		if (chapter) {
			form.setFieldsValue(chapter);
		}
	}, [chapter, form]);

	const onFinish = async (values) => {
		setIsSubmitting(true);
		try {
			// Map form values to API format - chỉ cần chapterName
			const chapterData = {
				name: values.name,
			};

			// Return data to parent component instead of calling API
			message.success(
				isEdit
					? t('chapterManagement.updateChapterSuccess')
					: t('chapterManagement.addChapterSuccess')
			);
			onClose(true, chapterData); // Pass data to parent
		} catch (error) {
			message.error(
				isEdit
					? t('chapterManagement.updateChapterError')
					: t('chapterManagement.addChapterError')
			);
		} finally {
			setIsSubmitting(false);
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
				...chapter,
			}}
		>
			<Form.Item
				name="name"
				label={t('chapterManagement.chapterName')}
				rules={[
					{
						required: true,
						message: t('chapterManagement.chapterNameRequired'),
					},
					{
						min: 2,
						message: t('chapterManagement.chapterNameMinLength'),
					},
					{
						max: 100,
						message: t('chapterManagement.chapterNameTooLong'),
					},
				]}
			>
				<Input
					placeholder={t('chapterManagement.chapterNamePlaceholder')}
					size="large"
					maxLength={100}
					showCount
				/>
			</Form.Item>

			<Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
				<Space>
					<Button onClick={onCancel} size="large">
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
						}}
					>
						{isEdit ? t('common.update') : t('common.save')}
					</Button>
				</Space>
			</Form.Item>
		</Form>
	);
};

export default ChapterForm;
