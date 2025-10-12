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
	InputNumber,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
	createLesson,
	updateLesson,
} from '../../../../redux/syllabus';

const { TextArea } = Input;
const { Option } = Select;

const LessonForm = ({ lesson, chapter, onClose }) => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { loading } = useSelector((state) => state.syllabus);

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
			const lessonData = {
				...values,
				chapterId: chapter.id,
			};

			if (isEdit) {
				await dispatch(updateLesson({ id: lesson.id, ...lessonData }));
				message.success(t('lessonManagement.updateLessonSuccess'));
			} else {
				await dispatch(createLesson(lessonData));
				message.success(t('lessonManagement.addLessonSuccess'));
			}
			onClose();
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
		onClose();
	};

	const statusOptions = [
		{ value: 'active', label: t('lessonManagement.active') },
		{ value: 'inactive', label: t('lessonManagement.inactive') },
	];

	const typeOptions = [
		{ value: 'theory', label: t('lessonManagement.theory') },
		{ value: 'practice', label: t('lessonManagement.practice') },
		{ value: 'mixed', label: t('lessonManagement.mixed') },
	];

	return (
		<Form
			form={form}
			layout="vertical"
			onFinish={onFinish}
			initialValues={{
				status: 'active',
				duration: 1,
				type: 'theory',
				order: 1,
				...lesson,
			}}
		>
			<Row gutter={16}>
				<Col span={8}>
					<Form.Item
						name="order"
						label={t('lessonManagement.lessonNumber')}
						rules={[
							{
								required: true,
								message: t('lessonManagement.orderRequired'),
							},
							{
								type: 'number',
								min: 1,
								message: t('lessonManagement.orderMin'),
							},
						]}
					>
						<InputNumber
							min={1}
							placeholder={t('lessonManagement.orderPlaceholder')}
							style={{ width: '100%' }}
							size="large"
						/>
					</Form.Item>
				</Col>
				<Col span={8}>
					<Form.Item
						name="duration"
						label={t('lessonManagement.duration')}
						rules={[
							{
								required: true,
								message: t('lessonManagement.durationRequired'),
							},
							{
								type: 'number',
								min: 0.5,
								max: 4,
								message: t('lessonManagement.durationRange'),
							},
						]}
					>
						<InputNumber
							min={0.5}
							max={4}
							step={0.5}
							placeholder={t('lessonManagement.durationPlaceholder')}
							style={{ width: '100%' }}
							size="large"
							addonAfter={t('lessonManagement.hours')}
						/>
					</Form.Item>
				</Col>
				<Col span={8}>
					<Form.Item
						name="type"
						label={t('lessonManagement.lessonType')}
						rules={[
							{
								required: true,
								message: t('lessonManagement.typeRequired'),
							},
						]}
					>
						<Select
							placeholder={t('lessonManagement.selectType')}
							size="large"
						>
							{typeOptions.map((option) => (
								<Option key={option.value} value={option.value}>
									{option.label}
								</Option>
							))}
						</Select>
					</Form.Item>
				</Col>
			</Row>

			<Form.Item
				name="name"
				label={t('lessonManagement.lessonName')}
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
				name="description"
				label={t('lessonManagement.description')}
				rules={[
					{
						required: true,
						message: t('lessonManagement.descriptionRequired'),
					},
					{
						min: 10,
						message: t('lessonManagement.descriptionMinLength'),
					},
				]}
			>
				<TextArea
					rows={3}
					placeholder={t('lessonManagement.descriptionPlaceholder')}
					maxLength={500}
					showCount
				/>
			</Form.Item>

			<Row gutter={16}>
				<Col span={12}>
					<Form.Item
						name="objectives"
						label={t('lessonManagement.objectives')}
					>
						<TextArea
							rows={3}
							placeholder={t('lessonManagement.objectivesPlaceholder')}
							maxLength={500}
							showCount
						/>
					</Form.Item>
				</Col>
				<Col span={12}>
					<Form.Item
						name="status"
						label={t('lessonManagement.status')}
						rules={[
							{
								required: true,
								message: t('lessonManagement.statusRequired'),
							},
						]}
					>
						<Select
							placeholder={t('lessonManagement.selectStatus')}
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
				name="content"
				label={t('lessonManagement.content')}
			>
				<TextArea
					rows={4}
					placeholder={t('lessonManagement.contentPlaceholder')}
					maxLength={1000}
					showCount
				/>
			</Form.Item>

			<Form.Item
				name="materials"
				label={t('lessonManagement.materials')}
			>
				<TextArea
					rows={3}
					placeholder={t('lessonManagement.materialsPlaceholder')}
					maxLength={500}
					showCount
				/>
			</Form.Item>

			<Form.Item
				name="homework"
				label={t('lessonManagement.homework')}
			>
				<TextArea
					rows={3}
					placeholder={t('lessonManagement.homeworkPlaceholder')}
					maxLength={500}
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
						loading={isSubmitting || loading}
						size="large"
					>
						{isEdit ? t('common.update') : t('common.save')}
					</Button>
				</Space>
			</Form.Item>
		</Form>
	);
};

export default LessonForm;
