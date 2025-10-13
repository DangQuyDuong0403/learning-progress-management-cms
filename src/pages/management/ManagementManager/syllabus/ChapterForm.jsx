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
	createChapter,
	updateChapter,
} from '../../../../redux/syllabus';

const { TextArea } = Input;
const { Option } = Select;

const ChapterForm = ({ chapter, syllabus, onClose }) => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { loading } = useSelector((state) => state.syllabus);

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
			const chapterData = {
				...values,
				syllabusId: syllabus.id,
			};

			if (isEdit) {
				await dispatch(updateChapter({ id: chapter.id, ...chapterData }));
				message.success(t('chapterManagement.updateChapterSuccess'));
			} else {
				await dispatch(createChapter(chapterData));
				message.success(t('chapterManagement.addChapterSuccess'));
			}
			onClose();
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

	const statusOptions = [
		{ value: 'active', label: t('chapterManagement.active') },
		{ value: 'inactive', label: t('chapterManagement.inactive') },
	];

	return (
		<Form
			form={form}
			layout="vertical"
			onFinish={onFinish}
			initialValues={{
				status: 'active',
				duration: 2,
				order: 1,
				...chapter,
			}}
		>
			<Row gutter={16}>
				<Col span={12}>
					<Form.Item
						name="order"
						label={t('chapterManagement.chapterNumber')}
						rules={[
							{
								required: true,
								message: t('chapterManagement.orderRequired'),
							},
							{
								type: 'number',
								min: 1,
								message: t('chapterManagement.orderMin'),
							},
						]}
					>
						<InputNumber
							min={1}
							placeholder={t('chapterManagement.orderPlaceholder')}
							style={{ width: '100%' }}
							size="large"
						/>
					</Form.Item>
				</Col>
				<Col span={12}>
					<Form.Item
						name="duration"
						label={t('chapterManagement.duration')}
						rules={[
							{
								required: true,
								message: t('chapterManagement.durationRequired'),
							},
							{
								type: 'number',
								min: 0.5,
								max: 20,
								message: t('chapterManagement.durationRange'),
							},
						]}
					>
						<InputNumber
							min={0.5}
							max={20}
							step={0.5}
							placeholder={t('chapterManagement.durationPlaceholder')}
							style={{ width: '100%' }}
							size="large"
							addonAfter={t('chapterManagement.hours')}
						/>
					</Form.Item>
				</Col>
			</Row>

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

			<Form.Item
				name="description"
				label={t('chapterManagement.description')}
				rules={[
					{
						required: true,
						message: t('chapterManagement.descriptionRequired'),
					},
					{
						min: 10,
						message: t('chapterManagement.descriptionMinLength'),
					},
				]}
			>
				<TextArea
					rows={3}
					placeholder={t('chapterManagement.descriptionPlaceholder')}
					maxLength={500}
					showCount
				/>
			</Form.Item>

			<Row gutter={16}>
				<Col span={12}>
					<Form.Item
						name="objectives"
						label={t('chapterManagement.objectives')}
					>
						<TextArea
							rows={3}
							placeholder={t('chapterManagement.objectivesPlaceholder')}
							maxLength={500}
							showCount
						/>
					</Form.Item>
				</Col>
				<Col span={12}>
					<Form.Item
						name="status"
						label={t('chapterManagement.status')}
						rules={[
							{
								required: true,
								message: t('chapterManagement.statusRequired'),
							},
						]}
					>
						<Select
							placeholder={t('chapterManagement.selectStatus')}
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
				name="learningOutcomes"
				label={t('chapterManagement.learningOutcomes')}
			>
				<TextArea
					rows={4}
					placeholder={t('chapterManagement.learningOutcomesPlaceholder')}
					maxLength={1000}
					showCount
				/>
			</Form.Item>

			<Form.Item
				name="assessmentCriteria"
				label={t('chapterManagement.assessmentCriteria')}
			>
				<TextArea
					rows={3}
					placeholder={t('chapterManagement.assessmentCriteriaPlaceholder')}
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

export default ChapterForm;
