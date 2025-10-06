import React, { useState, useEffect } from 'react';
import {
	Form,
	Select,
	Button,
	Row,
	Col,
	Card,
	Table,
	Tag,
	message,
	Input,
	Space,
	Tooltip,
} from 'antd';
import {
	UserOutlined,
	TeamOutlined,
	CheckOutlined,
	CloseOutlined,
	SearchOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';

const { Option } = Select;
const { Search } = Input;

const AssignTeacherToClass = ({ teacher, onClose }) => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [searchText, setSearchText] = useState('');

	// Mock data for classes - replace with actual API calls
	const [classes, setClasses] = useState([
		{
			id: 1,
			name: 'Class A1 - Beginner',
			level: 'Beginner',
			ageRange: '6-8 years',
			currentTeacher: 'Nguyễn Văn B',
			studentCount: 15,
			status: 'active',
			assigned: false,
		},
		{
			id: 2,
			name: 'Class B2 - Intermediate',
			level: 'Intermediate',
			ageRange: '9-12 years',
			currentTeacher: null,
			studentCount: 20,
			status: 'active',
			assigned: false,
		},
		{
			id: 3,
			name: 'Class C3 - Advanced',
			level: 'Advanced',
			ageRange: '13-16 years',
			currentTeacher: 'Trần Thị C',
			studentCount: 18,
			status: 'active',
			assigned: true,
		},
		{
			id: 4,
			name: 'Class D4 - Beginner',
			level: 'Beginner',
			ageRange: '6-8 years',
			currentTeacher: null,
			studentCount: 12,
			status: 'active',
			assigned: false,
		},
	]);

	const [selectedClasses, setSelectedClasses] = useState([]);

	useEffect(() => {
		if (teacher) {
			// Pre-select classes where this teacher is already assigned
			const assignedClasses = classes
				.filter(cls => cls.assigned)
				.map(cls => cls.id);
			setSelectedClasses(assignedClasses);
		}
	}, [teacher, classes]);

	const handleSubmit = async (values) => {
		setLoading(true);
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			spaceToast.success(t('teacherManagement.assignTeacherSuccess'));
			onClose();
		} catch (error) {
			spaceToast.error(t('teacherManagement.assignTeacherError'));
		} finally {
			setLoading(false);
		}
	};

	const handleClassSelection = (classId, selected) => {
		if (selected) {
			setSelectedClasses([...selectedClasses, classId]);
		} else {
			setSelectedClasses(selectedClasses.filter(id => id !== classId));
		}
	};

	// Filter classes based on search
	const filteredClasses = classes.filter((cls) => {
		const matchesSearch =
			cls.name.toLowerCase().includes(searchText.toLowerCase()) ||
			cls.level.toLowerCase().includes(searchText.toLowerCase()) ||
			(cls.currentTeacher && cls.currentTeacher.toLowerCase().includes(searchText.toLowerCase()));
		return matchesSearch;
	});

	const columns = [
		{
			title: t('teacherManagement.className'),
			dataIndex: 'name',
			key: 'name',
			render: (text, record) => (
				<div>
					<div style={{ fontWeight: 'bold', fontSize: '16px' }}>{text}</div>
					<div style={{ color: '#666', fontSize: '12px' }}>
						{record.level} • {record.ageRange}
					</div>
				</div>
			),
		},
		{
			title: t('teacherManagement.currentTeacher'),
			dataIndex: 'currentTeacher',
			key: 'currentTeacher',
			width: 150,
			render: (teacher) => (
				teacher ? (
					<Tag color="blue">{teacher}</Tag>
				) : (
					<Tag color="default">{t('teacherManagement.noTeacher')}</Tag>
				)
			),
		},
		{
			title: t('teacherManagement.studentCount'),
			dataIndex: 'studentCount',
			key: 'studentCount',
			width: 120,
			render: (count) => (
				<Tag color="green">
					<TeamOutlined /> {count} {t('teacherManagement.students')}
				</Tag>
			),
		},
		{
			title: t('teacherManagement.status'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (status) => (
				<Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
			),
		},
		{
			title: t('teacherManagement.actions'),
			key: 'actions',
			width: 100,
			render: (_, record) => (
				<Space size="small">
					{selectedClasses.includes(record.id) ? (
						<Tooltip title={t('teacherManagement.removeFromClass')}>
							<Button
								type="text"
								icon={<CloseOutlined style={{ color: '#ff4d4f' }} />}
								size="small"
								onClick={() => handleClassSelection(record.id, false)}
							/>
						</Tooltip>
					) : (
						<Tooltip title={t('teacherManagement.assignToClass')}>
							<Button
								type="text"
								icon={<CheckOutlined style={{ color: '#52c41a' }} />}
								size="small"
								onClick={() => handleClassSelection(record.id, true)}
							/>
						</Tooltip>
					)}
				</Space>
			),
		},
	];

	return (
		<div className={`assign-teacher-form ${theme}-assign-teacher-form`}>
			{/* Teacher Info Card */}
			<Card 
				title={t('teacherManagement.teacherInfo')}
				className={`teacher-info-card ${theme}-teacher-info-card`}
				style={{ marginBottom: 24 }}
			>
				<Row gutter={16}>
					<Col span={8}>
						<div style={{ textAlign: 'center' }}>
							<UserOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
						</div>
					</Col>
					<Col span={16}>
						<div>
							<h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
								{teacher?.name}
							</h3>
							<p style={{ margin: '8px 0', color: '#666' }}>
								{teacher?.email}
							</p>
							<p style={{ margin: '8px 0', color: '#666' }}>
								{teacher?.phone}
							</p>
							<Tag color={teacher?.role === 'teacher' ? 'blue' : 'green'}>
								{teacher?.role === 'teacher' 
									? t('teacherManagement.teacher') 
									: t('teacherManagement.teacherAssistant')
								}
							</Tag>
							<Tag color="orange" style={{ marginLeft: 8 }}>
								{teacher?.specialization}
							</Tag>
						</div>
					</Col>
				</Row>
			</Card>

			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
			>
				{/* Search Classes */}
				<Row gutter={16} style={{ marginBottom: 24 }}>
					<Col span={24}>
						<Input
							placeholder={t('teacherManagement.searchClasses')}
							prefix={<SearchOutlined />}
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							className={`search-input ${theme}-search-input`}
							allowClear
						/>
					</Col>
				</Row>

				{/* Classes Table */}
				<Card 
					title={t('teacherManagement.availableClasses')}
					className={`classes-table-card ${theme}-classes-table-card`}
					style={{ marginBottom: 24 }}
				>
					<Table
						columns={columns}
						dataSource={filteredClasses}
						rowKey="id"
						pagination={{
							total: filteredClasses.length,
							pageSize: 5,
							showSizeChanger: false,
							showQuickJumper: false,
							showTotal: (total, range) =>
								`${range[0]}-${range[1]} of ${total}`,
						}}
						scroll={{ x: 800 }}
						className={`classes-table ${theme}-classes-table`}
						rowSelection={{
							selectedRowKeys: selectedClasses,
							onChange: (selectedRowKeys) => {
								setSelectedClasses(selectedRowKeys);
							},
							getCheckboxProps: (record) => ({
								disabled: record.currentTeacher && !record.assigned,
							}),
						}}
					/>
				</Card>

				{/* Selected Classes Summary */}
				{selectedClasses.length > 0 && (
					<Card 
						title={t('teacherManagement.selectedClasses')}
						className={`selected-classes-card ${theme}-selected-classes-card`}
						style={{ marginBottom: 24 }}
					>
						<div>
							{selectedClasses.map(classId => {
								const cls = classes.find(c => c.id === classId);
								return cls ? (
									<Tag 
										key={classId} 
										color="blue" 
										style={{ margin: '4px', fontSize: '14px', padding: '4px 8px' }}
									>
										{cls.name} ({cls.studentCount} {t('teacherManagement.students')})
									</Tag>
								) : null;
							})}
						</div>
					</Card>
				)}

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
							{t('teacherManagement.assignToSelectedClasses')}
						</Button>
					</Col>
				</Row>
			</Form>
		</div>
	);
};

export default AssignTeacherToClass;
