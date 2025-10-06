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

const AssignStudentToClass = ({ student, onClose }) => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [searchText, setSearchText] = useState('');

	// Mock data for classes - replace with actual API calls
	const [classes, setClasses] = useState([
		{
			id: 1,
			name: 'Lớp 10A1 - Beginner',
			level: 'Beginner',
			ageRange: '15-16 years',
			currentTeacher: 'Nguyễn Văn B',
			studentCount: 15,
			maxStudents: 25,
			status: 'active',
			assigned: false,
		},
		{
			id: 2,
			name: 'Lớp 10A2 - Intermediate',
			level: 'Intermediate',
			ageRange: '15-16 years',
			currentTeacher: 'Trần Thị C',
			studentCount: 20,
			maxStudents: 25,
			status: 'active',
			assigned: false,
		},
		{
			id: 3,
			name: 'Lớp 11B1 - Advanced',
			level: 'Advanced',
			ageRange: '16-17 years',
			currentTeacher: 'Lê Văn D',
			studentCount: 18,
			maxStudents: 25,
			status: 'active',
			assigned: true,
		},
		{
			id: 4,
			name: 'Lớp 9C1 - Beginner',
			level: 'Beginner',
			ageRange: '14-15 years',
			currentTeacher: 'Phạm Thị E',
			studentCount: 12,
			maxStudents: 25,
			status: 'active',
			assigned: false,
		},
		{
			id: 5,
			name: 'Lớp 12A1 - Advanced',
			level: 'Advanced',
			ageRange: '17-18 years',
			currentTeacher: 'Hoàng Văn F',
			studentCount: 22,
			maxStudents: 25,
			status: 'active',
			assigned: false,
		},
	]);

	const [selectedClass, setSelectedClass] = useState(null);

	useEffect(() => {
		if (student) {
			// Pre-select class where this student is already assigned
			const assignedClass = classes.find(cls => cls.assigned);
			setSelectedClass(assignedClass ? assignedClass.id : null);
		}
	}, [student, classes]);

	const handleSubmit = async (values) => {
		setLoading(true);
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			spaceToast.success(t('studentManagement.assignStudentSuccess'));
			onClose();
		} catch (error) {
			spaceToast.error(t('studentManagement.assignStudentError'));
		} finally {
			setLoading(false);
		}
	};

	const handleClassSelection = (classId) => {
		setSelectedClass(classId);
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
			title: t('studentManagement.className'),
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
			title: t('studentManagement.currentTeacher'),
			dataIndex: 'currentTeacher',
			key: 'currentTeacher',
			width: 150,
			render: (teacher) => (
				teacher ? (
					<Tag color="blue">{teacher}</Tag>
				) : (
					<Tag color="default">{t('studentManagement.noTeacher')}</Tag>
				)
			),
		},
		{
			title: t('studentManagement.studentCount'),
			dataIndex: 'studentCount',
			key: 'studentCount',
			width: 120,
			render: (count, record) => (
				<Tag color={count >= record.maxStudents ? "red" : "green"}>
					<TeamOutlined /> {count}/{record.maxStudents} {t('studentManagement.students')}
				</Tag>
			),
		},
		{
			title: t('studentManagement.status'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (status) => (
				<Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
			),
		},
		{
			title: t('studentManagement.actions'),
			key: 'actions',
			width: 100,
			render: (_, record) => (
				<Space size="small">
					{selectedClass === record.id ? (
						<Tooltip title={t('studentManagement.removeFromClass')}>
							<Button
								type="text"
								icon={<CloseOutlined style={{ color: '#ff4d4f' }} />}
								size="small"
								onClick={() => setSelectedClass(null)}
							/>
						</Tooltip>
					) : (
						<Tooltip title={t('studentManagement.assignToClass')}>
							<Button
								type="text"
								icon={<CheckOutlined style={{ color: '#52c41a' }} />}
								size="small"
								onClick={() => handleClassSelection(record.id)}
								disabled={record.studentCount >= record.maxStudents}
							/>
						</Tooltip>
					)}
				</Space>
			),
		},
	];

	return (
		<div className={`assign-student-form ${theme}-assign-student-form`}>
			{/* Student Info Card */}
			<Card 
				title={t('studentManagement.studentInfo')}
				className={`student-info-card ${theme}-student-info-card`}
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
								{student?.fullName}
							</h3>
							<p style={{ margin: '8px 0', color: '#666' }}>
								{student?.email}
							</p>
							<p style={{ margin: '8px 0', color: '#666' }}>
								{student?.phone}
							</p>
							<Tag color="blue">
								{student?.studentCode}
							</Tag>
							<Tag color="orange" style={{ marginLeft: 8 }}>
								{student?.level}
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
							placeholder={t('studentManagement.searchClasses')}
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
					title={t('studentManagement.availableClasses')}
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
							type: 'radio',
							selectedRowKeys: selectedClass ? [selectedClass] : [],
							onChange: (selectedRowKeys) => {
								setSelectedClass(selectedRowKeys[0] || null);
							},
							getCheckboxProps: (record) => ({
								disabled: record.studentCount >= record.maxStudents,
							}),
						}}
					/>
				</Card>

				{/* Selected Class Summary */}
				{selectedClass && (
					<Card 
						title={t('studentManagement.selectedClass')}
						className={`selected-class-card ${theme}-selected-class-card`}
						style={{ marginBottom: 24 }}
					>
						<div>
							{(() => {
								const cls = classes.find(c => c.id === selectedClass);
								return cls ? (
									<Tag 
										color="blue" 
										style={{ fontSize: '14px', padding: '4px 8px' }}
									>
										{cls.name} ({cls.studentCount}/{cls.maxStudents} {t('studentManagement.students')})
									</Tag>
								) : null;
							})()}
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
							disabled={!selectedClass}
							style={{ width: '100%', height: 40 }}
							className={`submit-button ${theme}-submit-button`}
						>
							{t('studentManagement.assignToSelectedClass')}
						</Button>
					</Col>
				</Row>
			</Form>
		</div>
	);
};

export default AssignStudentToClass;
