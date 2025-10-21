import React from 'react';
import { Button } from 'antd';
import { CheckCircleOutlined, StopOutlined, UserAddOutlined } from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';
import './StudentBottomActionBar.css';

const StudentBottomActionBar = ({ 
	selectedCount, 
	onSelectAll, 
	onActiveAll,
	onDeactiveAll,
	onAssignAllToClass,
	onClose,
	showSelectAll = true,
	showActiveAll = true,
	showDeactiveAll = true,
	showAssignAllToClass = true,
	showClose = true,
	selectAllText = "Select all",
	activeAllText = "Active all",
	deactiveAllText = "Deactive all",
	assignAllToClassText = "Assign all to class",
	loadingActive = false,
	loadingDeactive = false,
	loadingAssign = false
}) => {
	const { theme } = useTheme();

	if (selectedCount === 0) {
		return null;
	}

	return (
		<div className={`student-bottom-action-bar ${theme}-student-bottom-action-bar`}>
			<div className="student-action-bar-content">
				<div className="student-selected-info">
					<span className="student-selected-count">{selectedCount} selected</span>
				</div>
				<div className="student-action-buttons">
					{showSelectAll && (
						<Button
							type="text"
							onClick={() => onSelectAll(true)}
							className="student-select-all-button"
						>
							{selectAllText}
						</Button>
					)}
					{showActiveAll && (
						<Button
							type="text"
							icon={<CheckCircleOutlined />}
							onClick={onActiveAll}
							loading={loadingActive}
							disabled={loadingDeactive || loadingAssign}
							className="student-active-all-button"
						>
							{activeAllText}
						</Button>
					)}
					{showDeactiveAll && (
						<Button
							type="text"
							icon={<StopOutlined />}
							onClick={onDeactiveAll}
							loading={loadingDeactive}
							disabled={loadingActive || loadingAssign}
							className="student-deactive-all-button"
						>
							{deactiveAllText}
						</Button>
					)}
					{showAssignAllToClass && (
						<Button
							type="text"
							icon={<UserAddOutlined />}
							onClick={onAssignAllToClass}
							loading={loadingAssign}
							disabled={loadingActive || loadingDeactive}
							className="student-assign-all-to-class-button"
						>
							{assignAllToClassText}
						</Button>
					)}
				</div>
				{showClose && (
					<Button
						type="text"
						icon={<span style={{ fontSize: '16px' }}>×</span>}
						onClick={onClose}
						className="student-close-button"
					/>
				)}
			</div>
		</div>
	);
};

export default StudentBottomActionBar;
