import React from 'react';
import { Button } from 'antd';
import { CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';
import './StudentBottomActionBar.css';

const StudentBottomActionBar = ({ 
	selectedCount, 
	onSelectAll, 
	onActiveAll,
	onDeactiveAll,
	onClose,
	showSelectAll = true,
	showActiveAll = true,
	showDeactiveAll = true,
	showClose = true,
	selectAllText = "Select all",
	activeAllText = "Active all",
	deactiveAllText = "Deactive all"
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
							className="student-deactive-all-button"
						>
							{deactiveAllText}
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
