import React, { useState, useEffect } from 'react';
import {
	Form,
	Input,
	Button,
	message,
	Space,
} from 'antd';
import { useTranslation } from 'react-i18next';

const ChapterForm = ({ chapter, syllabus, onClose }) => {
	const { t } = useTranslation();

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
				]}
			>
				<Input
					placeholder={t('chapterManagement.chapterNamePlaceholder')}
					size="large"
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
					>
						{isEdit ? t('common.update') : t('common.save')}
					</Button>
				</Space>
			</Form.Item>
		</Form>
	);
};

export default ChapterForm;
