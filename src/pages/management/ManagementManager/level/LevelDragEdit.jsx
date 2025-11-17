import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Button, message, Typography, Modal } from 'antd';
import {
	PlusOutlined,
	DeleteOutlined,
	SaveOutlined,
	ArrowLeftOutlined,
	EditOutlined,
	SwapOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import ThemedLayout from '../../../../component/ThemedLayout';
import levelManagementApi from '../../../../apis/backend/levelManagement';
import ROUTER_PAGE from '../../../../constants/router';
import LevelForm from './LevelForm';
import usePageTitle from '../../../../hooks/usePageTitle';
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	defaultAnimateLayoutChanges,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './LevelDragEdit.css';

const { Text, Title } = Typography;

// Optimized: Memoized Sortable Level Item Component
const SortableLevelItem = memo(
	({ level, index, onDeleteLevel, onEditLevel, theme, t }) => {
		// Tối ưu: Chỉ animate khi không drag
		const animateLayoutChanges = useCallback((args) => {
			const { isSorting, wasDragging } = args;
			// Không animate khi đang drag, chỉ animate sau khi drop
			if (isSorting || wasDragging) {
				return defaultAnimateLayoutChanges(args);
			}
			return true;
		}, []);

		const {
			attributes,
			listeners,
			setNodeRef,
			transform,
			transition,
			isDragging,
		} = useSortable({
			id: level.id,
			animateLayoutChanges,
		});

		const style = useMemo(
			() => ({
				transform: transform ? CSS.Transform.toString(transform) : undefined,
				transition: transition || undefined,
				opacity: isDragging ? 0.5 : 1,
				willChange: 'transform', // GPU acceleration
			}),
			[transform, transition, isDragging]
		);

		const handleEdit = useCallback(() => {
			onEditLevel(index);
		}, [index, onEditLevel]);

		const handleDelete = useCallback(() => {
			onDeleteLevel(index);
		}, [index, onDeleteLevel]);

		return (
			<div
				ref={setNodeRef}
				style={style}
				className={`level-drag-item ${theme}-level-drag-item ${
					isDragging ? 'dragging' : ''
				}`}>
				<div className='level-position'>
					<Text strong style={{ fontSize: '18px', color: 'black' }}>
						{index + 1}
					</Text>
				</div>

				<div className='level-content'>
					<div className='level-field level-name-field'>
						<Text strong style={{ minWidth: '100px', fontSize: '20px' }}>
							{t('levelManagement.levelName')}:
						</Text>
						<Text 
							className='level-name-text'
							style={{ flex: 1, fontSize: '20px' }}
							title={level.levelName || 'N/A'}
						>
							{level.levelName || 'N/A'}
						</Text>
					</div>

				</div>

				<div className='level-actions'>
					<div className='drag-handle' {...attributes} {...listeners}>
						<SwapOutlined
							rotate={90}
							style={{
								fontSize: '20px',
								color: 'black',
							}}
						/>
					</div>
					<Button
						type='text'
						icon={<EditOutlined style={{ color: '#000', fontSize: '18px' }} />}
						onClick={handleEdit}
						style={{
							background: 'rgba(24, 144, 255, 0.1)',
							border: 'none',
							marginRight: '8px',
						}}
					/>
					<Button
						type='text'
						danger
						icon={<DeleteOutlined style={{ color: '#000', fontSize: '18px' }} />}
						onClick={handleDelete}
						style={{
							background: 'rgba(239, 68, 68, 0.1)',
							border: 'none',
						}}
					/>
				</div>
			</div>
		);
	},
	(prevProps, nextProps) => {
		// Custom comparison để tránh re-render không cần thiết
				return (
					prevProps.level.id === nextProps.level.id &&
					prevProps.level.levelName === nextProps.level.levelName &&
					prevProps.level.position === nextProps.level.position &&
					prevProps.theme === nextProps.theme
				);
	}
);

SortableLevelItem.displayName = 'SortableLevelItem';

// Memoized AddLevelButton
const AddLevelButton = memo(
	({ theme, onAddAtPosition, index }) => {
		const handleClick = useCallback(() => {
			onAddAtPosition(index);
		}, [onAddAtPosition, index]);

		return (
			<div className={`add-level-between ${theme}-add-level-between`}>
				<Button
					type='primary'
					shape='circle'
					icon={<PlusOutlined />}
					size='large'
					className='add-level-between-btn'
					onClick={handleClick}
				/>
			</div>
		);
	},
	(prevProps, nextProps) => {
		return prevProps.theme === nextProps.theme && prevProps.index === nextProps.index;
	}
);

AddLevelButton.displayName = 'AddLevelButton';

const LevelDragEdit = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navigate = useNavigate();
	
	// Set page title
	usePageTitle('Edit Level');
	
	const [levels, setLevels] = useState([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingLevel, setEditingLevel] = useState(null);

	// Optimized: Sử dụng passive events và giảm sensitivity
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8, // Tăng lên để tránh di chuyển ngoài ý định
				delay: 0, // Không delay
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const fetchAllLevels = useCallback(async () => {
		setLoading(true);
		try {
			const params = {
				page: 0,
				size: 100, // Request all at once
				sortBy: 'orderNumber',
				sortDir: 'asc',
				status: [true], // Chỉ active levels
			};

			console.log('LevelDragEdit - Fetching all active levels...');

			const response = await levelManagementApi.getLevels(params);

			console.log('LevelDragEdit API Response:', response);
			console.log('Response structure check:', {
				isArray: Array.isArray(response.data),
				hasContent: response.data?.content,
				totalElements: response.totalElements,
				totalPages: response.totalPages,
				dataLength: response.data?.length
			});

			// Handle different response structures
			let levelsData = [];
			if (response && response.data) {
				if (Array.isArray(response.data)) {
					levelsData = response.data;
				} else if (response.data.content && Array.isArray(response.data.content)) {
					levelsData = response.data.content;
				}
			}

			const mappedLevels = levelsData.map((level, index) => ({
				id: level.id,
				levelName: level.levelName,
				levelCode: level.levelCode,
				status: level.status, // Use actual status from API
				orderNumber: level.orderNumber,
				description: level.description || '',
				promotionCriteria: level.promotionCriteria || '',
				learningObjectives: level.learningObjectives || '',
				position: index + 1,
			}));

			console.log('LevelDragEdit - All active levels fetched:', mappedLevels.length);
			
			// Check if all levels are published
			const allPublished = mappedLevels.length > 0 && mappedLevels.every(level => level.status === 'PUBLISHED');
			
			if (allPublished) {
				console.log('All levels are published, redirecting to LevelList...');
				spaceToast.warning(t('levelManagement.allLevelsPublished'));
				navigate(ROUTER_PAGE.MANAGER_LEVELS);
				return;
			}
			
			setLevels(mappedLevels);
		} catch (error) {
			console.error('Error fetching levels:', error);
			
			// Handle API errors with backend messages
			if (error.response) {
				const errorMessage = error.response.data.error || error.response.data?.message;
				spaceToast.error(errorMessage);
			} else {
				spaceToast.error(error.message || t('levelManagement.loadLevelsError'));
			}
		} finally {
			setLoading(false);
		}
	}, [t, navigate]);

	useEffect(() => {
		fetchAllLevels();
	}, [fetchAllLevels]);

	const [insertAtIndex, setInsertAtIndex] = useState(null);

	const handleAddLevelAtPosition = useCallback((index) => {
		setEditingLevel(null);
		// Insert exactly at the separator's index so item appears right after the preceding item
		setInsertAtIndex(index);
		setIsModalVisible(true);
	}, []);

	const handleModalClose = useCallback(
		(shouldRefresh, newLevelData, successMessage) => {
			setIsModalVisible(false);
			
			if (shouldRefresh && newLevelData) {
				if (editingLevel) {
					// Update existing level
					setLevels((prev) => {
						return prev.map((level) =>
							level.id === editingLevel.id
								? { ...level, ...newLevelData }
								: level
						);
					});
				} else if (insertAtIndex !== null) {
					setLevels((prev) => {
						// Create new level with temporary position
						const newLevel = {
							...newLevelData,
							id: `new-${Date.now()}`,
							position: 0, // Temporary, will be recalculated
							orderNumber: 0, // Temporary, will be recalculated
						};
						
						// Get only visible levels (not deleted)
						const visibleLevels = prev.filter(level => !level.toBeDeleted);
						
						// Insert at the correct position in visible levels
						const newVisibleLevels = [...visibleLevels];
						newVisibleLevels.splice(insertAtIndex, 0, newLevel);
						
						// Recalculate positions for visible levels only
						const updatedVisibleLevels = newVisibleLevels.map((level, i) => ({
							...level,
							position: i + 1,
							orderNumber: i + 1,
						}));
						
						// Combine with deleted levels (keep them as-is)
						const deletedLevels = prev.filter(level => level.toBeDeleted);
						
						return [...updatedVisibleLevels, ...deletedLevels];
					});
				}
				
			}
			
			setEditingLevel(null);
			setInsertAtIndex(null);
		},
		[editingLevel, insertAtIndex]
	);

	const handleDeleteLevel = useCallback(
		(index) => {
			const visibleLevels = levels.filter(level => !level.toBeDeleted);

			// Get the actual level from visible levels using the index
			const levelToDelete = visibleLevels[index];
			if (!levelToDelete) {
				console.error('Level not found at index:', index);
				return;
			}

			console.log('Deleting level at index:', index, 'Level:', levelToDelete);

			// Set toBeDeleted: true but keep in state
			setLevels((prev) => {
				const newLevels = prev.map((level) => {
					if (level.id === levelToDelete.id) {
						return {
							...level,
							toBeDeleted: true
						};
					}
					return level;
				});
				
				// Recalculate positions only for visible items
				const visibleItems = newLevels.filter(level => !level.toBeDeleted);
				console.log('Visible items after deletion:', visibleItems.length);
				
				return newLevels.map((level) => {
					if (level.toBeDeleted) {
						return level; // Keep deleted items as-is
					}
					
					// Update position for visible items based on their current order in the array
					const visibleIndex = visibleItems.findIndex(item => item.id === level.id);
					const newPosition = visibleIndex + 1;
					
					console.log(`Updating level ${level.id}: old position ${level.position} -> new position ${newPosition}`);
					
					return {
						...level,
						position: newPosition,
						orderNumber: newPosition,
					};
				});
			});

		},
		[levels]
	);

	const handleEditLevel = useCallback(
		(index) => {
			const visibleLevels = levels.filter(level => !level.toBeDeleted);
			const level = visibleLevels[index];
			if (!level) {
				console.error('Level not found at index:', index);
				return;
			}
			setEditingLevel(level);
			setIsModalVisible(true);
		},
		[levels]
	);


	const handleDragStart = useCallback((event) => {
		// Thêm class để document không bị scroll
		document.body.style.overflow = 'hidden';
	}, []);

	// Cleanup khi drag end
	useEffect(() => {
		return () => {
			document.body.style.overflow = '';
		};
	}, []);

	const handleDragEnd = useCallback((event) => {
		const { active, over } = event;
		// Reset overflow
		document.body.style.overflow = '';

		if (active.id !== over?.id) {
			setLevels((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);

				if (oldIndex === -1 || newIndex === -1) return items;

				const newItems = arrayMove(items, oldIndex, newIndex);

				// Chỉ update position cho visible items (không bị xóa)
				const visibleItems = newItems.filter(level => !level.toBeDeleted);
				return newItems.map((level) => {
					if (level.toBeDeleted) {
						return level; // Giữ nguyên items đã bị xóa
					}
					
					// Tính position dựa trên thứ tự trong visible items
					const visibleIndex = visibleItems.findIndex(item => item.id === level.id);
					return {
						...level,
						position: visibleIndex + 1,
						orderNumber: visibleIndex + 1,
					};
				});
			});
		}
	}, []);

	const levelIds = useMemo(() => 
		levels.filter(level => !level.toBeDeleted).map((level) => level.id), 
		[levels]
	);

	const handleSave = useCallback(async () => {
		const invalidLevels = levels.filter((level) => !level.levelName.trim());
		if (invalidLevels.length > 0) {
			message.error(t('levelManagement.levelNameRequired'));
			return;
		}

		setSaving(true);
		try {
			// Prepare data theo format API yêu cầu với tất cả các trường
			const bulkUpdateData = levels
				.map((level) => {
					const isNewRecord = typeof level.id === 'string' && level.id.startsWith('new-');
					
				return {
					id: isNewRecord ? null : level.id, // null for new records
					levelName: level.levelName,
					levelCode: level.levelCode,
					description: level.description || '',
					promotionCriteria: level.promotionCriteria || '',
					learningObjectives: level.learningObjectives || '',
					orderNumber: level.position, // Position hiện tại = orderNumber
					isActive: true, // Đảm bảo tất cả levels đều active
					toBeDeleted: level.toBeDeleted || false, // Include toBeDeleted flag
				};
				})
				.filter((level) => {
					// Không gửi các record mới (id: null) mà đã bị xóa (toBeDeleted: true)
					// Vì chúng chưa tồn tại trên backend nên không cần xóa
					return !(level.id === null && level.toBeDeleted === true);
				});

			console.log('LevelDragEdit - Sending bulk update data:', {
				count: bulkUpdateData.length,
				levels: bulkUpdateData.map(l => ({ 
					id: l.id, 
					levelName: l.levelName, 
					orderNumber: l.orderNumber,
					toBeDeleted: l.toBeDeleted 
				}))
			});

			// Gọi API bulk update (sẽ xử lý cả create, update và delete)
			const response = await levelManagementApi.bulkUpdateLevels(bulkUpdateData);

			// Use backend message if available, otherwise fallback to translation
			const successMessage = response.message || t('levelManagement.updatePositionsSuccess');
			spaceToast.success(successMessage);
			navigate(ROUTER_PAGE.MANAGER_LEVELS);
		} catch (error) {
			console.error('Error saving levels:', error);
			
			// Handle API errors with backend messages
			if (error.response) {
				const errorMessage = error.response.data.error || error.response.data?.message;
				spaceToast.error(errorMessage);
			} else {
				spaceToast.error(error.message || t('levelManagement.updatePositionsError'));
			}
		} finally {
			setSaving(false);
		}
	}, [levels, t, navigate]);

	const handleGoBack = useCallback(() => {
		navigate(ROUTER_PAGE.MANAGER_LEVELS);
	}, [navigate]);


	return (
		<ThemedLayout>
			<div className={`main-content-panel ${theme}-main-panel`}>
				{/* Header Section */}
				<div className={`panel-header ${theme}-panel-header`}>
					<div className='page-header' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<Button
							icon={<ArrowLeftOutlined />}
							onClick={handleGoBack}
							className={`back-button ${theme}-back-button`}>
							{t('common.back')}
						</Button>
						<div className="page-title-container">
							<Title
								level={1}
								className="page-title"
								style={{ margin: 0 }}
							>
								{t('levelManagement.editLevel')}
							</Title>
						</div>
						<div style={{ width: '100px' }}></div> {/* Spacer để căn giữa */}
					</div>
				</div>

				{/* Content Section */}
				<div
					className={`table-section ${theme}-table-section`}
					style={{ padding: '24px' }}>
					<div
						className={`level-drag-edit-container ${theme}-level-drag-edit-container`}>

						{/* Levels List with Scroll */}
						<div className={`levels-scroll-container ${theme}-levels-scroll-container`}>
							<div className='levels-drag-container'>
								{loading ? (
									<div style={{ textAlign: 'center', padding: '40px' }}>
										<Text type='secondary'>
											{t('common.loading')}
										</Text>
									</div>
								) : (
									<DndContext
										sensors={sensors}
										collisionDetection={closestCenter}
										onDragStart={handleDragStart}
										onDragEnd={handleDragEnd}>
										<SortableContext
											items={levelIds}
											strategy={verticalListSortingStrategy}>
											{levels
												.filter(level => !level.toBeDeleted)
												.map((level, index) => (
												<React.Fragment key={level.id}>
													{index > 0 && (
														<AddLevelButton
															theme={theme}
															index={index}
															onAddAtPosition={handleAddLevelAtPosition}
														/>
													)}

													<SortableLevelItem
														level={level}
														index={index}
														onDeleteLevel={handleDeleteLevel}
														onEditLevel={handleEditLevel}
														theme={theme}
														t={t}
													/>
												</React.Fragment>
											))}
											
											{/* Always show Add button at the end if there are levels */}
											{levels.filter(level => !level.toBeDeleted).length > 0 && (
												<AddLevelButton
													theme={theme}
													index={levels.filter(level => !level.toBeDeleted).length}
													onAddAtPosition={handleAddLevelAtPosition}
												/>
											)}
											
											{/* Show fixed Add button when no levels exist */}
											{levels.filter(level => !level.toBeDeleted).length === 0 && (
												<div className={`add-level-empty ${theme}-add-level-empty`} style={{ 
													marginTop: '40px', 
													textAlign: 'center',
													padding: '40px 20px'
												}}>
													<Button
														type='primary'
														icon={<PlusOutlined />}
														size='large'
														onClick={() => handleAddLevelAtPosition(0)}
														style={{
															height: '60px',
															padding: '0 40px',
															fontSize: '18px',
															fontWeight: '600',
															borderRadius: '12px',
															backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
															background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
															borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
															color: theme === 'sun' ? '#000000' : '#ffffff',
															boxShadow: theme === 'sun' 
																? '0 6px 20px rgba(113, 179, 253, 0.4)' 
																: '0 6px 20px rgba(90, 31, 184, 0.4)',
														}}
													>
														{t('levelManagement.addLevel')}
													</Button>
													<div style={{ 
														marginTop: '16px', 
														color: '#666', 
														fontSize: '14px' 
													}}>
													</div>
												</div>
											)}
										</SortableContext>
									</DndContext>
								)}
							</div>
						</div>

						{/* Footer Actions */}
						<div className={`drag-edit-footer ${theme}-drag-edit-footer`}>
							<Button
								icon={<ArrowLeftOutlined />}
								onClick={handleGoBack}
								size='large'
								className={`back-button ${theme}-back-button`}
								style={{ 
									marginRight: '12px',
									borderRadius: '8px',
									height: '42px',
									padding: '0 24px',
								}}>
								{t('common.back')}
							</Button>
							<Button
								type='primary'
								icon={<SaveOutlined />}
								onClick={handleSave}
								loading={saving}
								className='save-button'
								style={{
									height: '42px',
									borderRadius: '8px',
									fontWeight: '500'
								}}>
								{t('common.save')}
							</Button>
						</div>
					</div>
				</div>
			</div>

		{/* Add/Edit Level Modal */}
		<Modal
			title={
				<div style={{ textAlign: 'center', fontSize: '28px', fontWeight: '600', color: 'rgb(24, 144, 255)' }}>
					{t('levelManagement.editLevel')}
				</div>
			}
			open={isModalVisible}
				onCancel={() => handleModalClose(false)}
				footer={null}
				width={800}
				destroyOnClose
				bodyStyle={{
					padding: '24px',
				}}>
				<LevelForm level={editingLevel} onClose={handleModalClose} shouldCallApi={false} showPrerequisiteAndCode={false} />
			</Modal>
		</ThemedLayout>
	);
};

export default LevelDragEdit;
