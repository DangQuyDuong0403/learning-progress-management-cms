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
	createSyllabus,
	updateSyllabus,
} from '../../../../redux/syllabus';
import { fetchLevels } from '../../../../redux/level';

const { TextArea } = Input;
const { Option } = Select;

const SyllabusForm = ({ syllabus, onClose }) => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { loading } = useSelector((state) => state.syllabus);
	const { levels } = useSelector((state) => state.level);

	const [form] = Form.useForm();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEdit = !!syllabus;

	useEffect(() => {
		if (syllabus) {
			form.setFieldsValue(syllabus);
		}
	}, [syllabus, form]);

	useEffect(() => {
		// Load levels when component mounts
		dispatch(fetchLevels());
	}, [dispatch]);

	const onFinish = async (values) => {
		setIsSubmitting(true);
		try {
			if (isEdit) {
				await dispatch(updateSyllabus({ id: syllabus.id, ...values }));
				message.success(t('syllabusManagement.updateSyllabusSuccess'));
			} else {
				await dispatch(createSyllabus(values));
				message.success(t('syllabusManagement.addSyllabusSuccess'));
			}
			onClose();
		} catch (error) {
			message.error(
				isEdit
					? t('syllabusManagement.updateSyllabusError')
					: t('syllabusManagement.addSyllabusError')
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
		{ value: 'active', label: t('syllabusManagement.active') },
		{ value: 'inactive', label: t('syllabusManagement.inactive') },
	];

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
						label={t('syllabusManagement.syllabusName')}
						rules={[
							{
								required: true,
								message: t('syllabusManagement.syllabusNameRequired'),
							},
							{
								min: 2,
								message: t('syllabusManagement.syllabusNameMinLength'),
							},
						]}
					>
						<Input
							placeholder={t('syllabusManagement.syllabusNamePlaceholder')}
							size="large"
						/>
					</Form.Item>
				</Col>
				<Col span={12}>
					<Form.Item
						name="levelId"
						label={t('syllabusManagement.level')}
						rules={[
							{
								required: true,
								message: t('syllabusManagement.levelRequired'),
							},
						]}
					>
						<Select
							placeholder={t('syllabusManagement.selectLevel')}
							size="large"
							showSearch
							filterOption={(input, option) =>
								option.children.toLowerCase().includes(input.toLowerCase())
							}
						>
							{levels.map((level) => (
								<Option key={level.id} value={level.id}>
									{level.name} ({level.code})
								</Option>
							))}
						</Select>
					</Form.Item>
				</Col>
			</Row>

			<Form.Item
				name="description"
				label={t('syllabusManagement.description')}
				rules={[
					{
						required: true,
						message: t('syllabusManagement.descriptionRequired'),
					},
					{
						min: 10,
						message: t('syllabusManagement.descriptionMinLength'),
					},
				]}
			>
				<TextArea
					rows={3}
					placeholder={t('syllabusManagement.descriptionPlaceholder')}
					maxLength={500}
					showCount
				/>
			</Form.Item>

			<Row gutter={16}>
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

export default SyllabusForm;
