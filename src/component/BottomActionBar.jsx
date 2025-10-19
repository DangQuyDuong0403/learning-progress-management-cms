import React from 'react';
import { Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import './BottomActionBar.css';

const BottomActionBar = ({ 
	selectedCount, 
	onSelectAll, 
	onDeleteAll, 
	onClose,
	showSelectAll = true,
	showDeleteAll = true,
	showClose = true,
	selectAllText = "Select all",
	deleteAllText = "Delete all",
	additionalActions = []
}) => {
	const { theme } = useTheme();
	const { t } = useTranslation();

	if (selectedCount === 0) {
		return null;
	}

	return (
		<div className={`bottom-action-bar ${theme}-bottom-action-bar`}>
			<div className="action-bar-content">
				<div className="selected-info">
					<span className="selected-count">{selectedCount} {t('classManagement.selected')}</span>
				</div>
				<div className="action-buttons">
					{showSelectAll && (
						<Button
							type="text"
							onClick={() => onSelectAll(true)}
							className="select-all-button"
						>
							{selectAllText}
						</Button>
					)}
					{additionalActions.map((action) => {
						// Map action keys to appropriate CSS classes
						const getButtonClass = (key) => {
							switch(key) {
								case 'openAll':
									return 'open-all-button';
								case 'closeAll':
									return 'close-all-button';
								default:
									return `${key}-button`;
							}
						};
						
						return (
							<Button
								key={action.key}
								type={action.type || "text"}
								onClick={action.onClick}
								className={getButtonClass(action.key)}
							>
								{action.label}
							</Button>
						);
					})}
					{showDeleteAll && (
						<Button
							type="text"
							icon={<DeleteOutlined />}
							onClick={onDeleteAll}
							className="delete-all-button"
						>
							{deleteAllText}
						</Button>
					)}
				</div>
				{showClose && (
					<Button
						type="text"
						icon={<span style={{ fontSize: '16px' }}>×</span>}
						onClick={onClose}
						className="close-button"
					/>
				)}
			</div>
		</div>
	);
};

export default BottomActionBar;
