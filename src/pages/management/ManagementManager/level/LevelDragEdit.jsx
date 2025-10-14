import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Button, message, Typography, Divider, Modal } from 'antd';
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
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragOverlay,
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
				transform: CSS.Transform.toString(transform),
				transition,
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
						{level.position}
					</Text>
				</div>

				<div className='level-content'>
					<div className='level-field'>
						<Text strong style={{ minWidth: '120px', fontSize: '20px' }}>
							{t('levelManagement.levelName')}:
						</Text>
						<Text style={{ flex: 1, fontSize: '20px' }}>
							{level.levelName || 'N/A'}
						</Text>
					</div>

					<div className='level-field'>
						<Text
							strong
							style={{
								minWidth: '120px',
								fontSize: '20px',
								marginLeft: '20px',
							}}>
							{t('levelManagement.difficulty')}:
						</Text>
						<Text style={{ fontSize: '20px' }}>{level.difficulty}</Text>
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
						icon={<EditOutlined />}
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
						icon={<DeleteOutlined />}
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
			prevProps.level.difficulty === nextProps.level.difficulty &&
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
	const [levels, setLevels] = useState([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [activeId, setActiveId] = useState(null);
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
				size: 100,
				sortBy: 'orderNumber',
				sortDir: 'asc',
			};
			params.status = [true, false];

			const response = await levelManagementApi.getLevels({
				params: params,
			});

			const mappedLevels = response.data.map((level, index) => ({
				id: level.id,
				levelName: level.levelName,
				difficulty: level.difficulty,
				estimatedDurationWeeks: level.estimatedDurationWeeks,
				status: level.isActive ? 'active' : 'inactive',
				orderNumber: level.orderNumber,
				description: level.description || '',
				promotionCriteria: level.promotionCriteria || '',
				learningObjectives: level.learningObjectives || '',
				position: index + 1,
			}));

			setLevels(mappedLevels);
		} catch (error) {
			console.error('Error fetching levels:', error);
			spaceToast.error(t('levelManagement.loadLevelsError'));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		fetchAllLevels();
	}, [fetchAllLevels]);

	const [insertAtIndex, setInsertAtIndex] = useState(null);

	const handleAddLevelAtPosition = useCallback((index) => {
		setEditingLevel(null);
		setInsertAtIndex(index);
		setIsModalVisible(true);
	}, []);

	const handleModalClose = useCallback(
		(shouldRefresh, newLevelData) => {
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
					// Insert new level at specific position
					const newLevel = {
						...newLevelData,
						id: `new-${Date.now()}`, // Temporary ID for new record
						position: insertAtIndex + 1,
						orderNumber: insertAtIndex + 1,
					};
					
					setLevels((prev) => {
						const newLevels = [...prev];
						newLevels.splice(insertAtIndex, 0, newLevel);
						// Recalculate positions
						return newLevels.map((level, i) => ({
							...level,
							position: i + 1,
							orderNumber: i + 1,
						}));
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
			if (levels.length <= 1) {
				message.warning(t('levelManagement.minLevelsRequired'));
				return;
			}

			setLevels((prev) => {
				const newLevels = prev.filter((_, i) => i !== index);
				return newLevels.map((level, i) => ({
					...level,
					position: i + 1,
					orderNumber: i + 1,
				}));
			});
		},
		[levels.length, t]
	);

	const handleEditLevel = useCallback(
		(index) => {
			const level = levels[index];
			setEditingLevel(level);
			setIsModalVisible(true);
		},
		[levels]
	);

	const handleDragStart = useCallback((event) => {
		setActiveId(event.active.id);
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
		setActiveId(null);
		// Reset overflow
		document.body.style.overflow = '';

		if (active.id !== over?.id) {
			setLevels((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);

				if (oldIndex === -1 || newIndex === -1) return items;

				const newItems = arrayMove(items, oldIndex, newIndex);

				// Chỉ update position một lần khi drop, không update liên tục
				return newItems.map((level, index) => ({
					...level,
					position: index + 1,
					orderNumber: index + 1,
				}));
			});
		}
	}, []);

	const levelIds = useMemo(() => levels.map((level) => level.id), [levels]);

	const handleSave = useCallback(async () => {
		const invalidLevels = levels.filter((level) => !level.levelName.trim());
		if (invalidLevels.length > 0) {
			message.error(t('levelManagement.levelNameRequired'));
			return;
		}

		setSaving(true);
		try {
			// Prepare data theo format API yêu cầu với tất cả các trường
			const bulkUpdateData = levels.map((level) => {
				const isNewRecord = typeof level.id === 'string' && level.id.startsWith('new-');
				
				return {
					id: isNewRecord ? null : level.id, // null for new records
					levelName: level.levelName,
					description: level.description || '',
					difficulty: level.difficulty,
					promotionCriteria: level.promotionCriteria || '',
					learningObjectives: level.learningObjectives || '',
					estimatedDurationWeeks: level.estimatedDurationWeeks || 0,
					orderNumber: level.position, // Position hiện tại = orderNumber
				};
			});

			// Gọi API bulk update (sẽ xử lý cả create và update)
			await levelManagementApi.bulkUpdateLevels(bulkUpdateData);

			spaceToast.success(t('levelManagement.updatePositionsSuccess'));
			navigate(ROUTER_PAGE.MANAGER_LEVELS);
		} catch (error) {
			console.error('Error saving levels:', error);
			spaceToast.error(t('levelManagement.updatePositionsError'));
		} finally {
			setSaving(false);
		}
	}, [levels, t, navigate]);

	const handleGoBack = useCallback(() => {
		navigate(ROUTER_PAGE.MANAGER_LEVELS);
	}, [navigate]);

	const activeLevelData = useMemo(
		() => levels.find((level) => level.id === activeId),
		[activeId, levels]
	);

	// Custom modifier để offset DragOverlay - với safety check
	const offsetModifier = useCallback((args) => {
		// Safety check để tránh lỗi "Cannot use 'in' operator"
		if (!args || !args.transform) {
			return {
				x: 0,
				y: 0,
				scaleX: 1,
				scaleY: 1,
			};
		}

		return {
			...args.transform,
			y: args.transform.y - 300,
			x: args.transform.x - 300,
		};
	}, []);

	return (
		<ThemedLayout>
			<div className={`main-content-panel ${theme}-main-panel`}>
				{/* Header Section */}
				<div className={`panel-header ${theme}-panel-header`}>
					<div className='page-header'>
						<Button
							icon={<ArrowLeftOutlined />}
							onClick={handleGoBack}
							style={{ position: 'absolute', left: 0 }}>
							{t('common.back')}
						</Button>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '12px',
								padding: '12px 24px',
								borderRadius: '12px',
								background:
									theme === 'space'
										? 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)'
										: 'rgb(101 191 253)',
								boxShadow:
									theme === 'space'
										? '0 4px 12px rgba(76, 29, 149, 0.4)'
										: '0 4px 12px rgba(173, 219, 250, 0.3)',
							}}>
							<SwapOutlined
								rotate={90}
								style={{
									fontSize: '28px',
									color: '#ffffff',
								}}
							/>
							<Title
								level={2}
								style={{
									margin: 0,
									color: '#ffffff',
								}}>
								{t('levelManagement.editPositions')}
							</Title>
						</div>
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
											{t('levelManagement.loadingLevels')}
										</Text>
									</div>
								) : (
									<DndContext
										sensors={sensors}
										collisionDetection={closestCenter}
										onDragStart={handleDragStart}
										onDragEnd={handleDragEnd}
										measuring={{
											droppable: {
												strategy: 'always',
											},
										}}>
										<SortableContext
											items={levelIds}
											strategy={verticalListSortingStrategy}>
											{levels.map((level, index) => (
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
										</SortableContext>

										{/* Drag Overlay - offset lên trên 100px */}
										<DragOverlay
											dropAnimation={null}
											modifiers={[offsetModifier]}>
											{activeLevelData ? (
												<div
													className={`level-drag-item ${theme}-level-drag-item`}
													style={{
														opacity: 0.95,
														boxShadow: '0 12px 32px rgba(24, 144, 255, 0.5)',
														border: '2px solid #1890ff',
														background: theme === 'dark' ? '#2a2a2a' : '#ffffff',
														cursor: 'grabbing',
														transform: 'rotate(3deg)',
														maxWidth: '800px',
													}}>
													<div className='level-position'>
														<Text
															strong
															style={{ fontSize: '18px', color: 'black' }}>
															{activeLevelData.position}
														</Text>
													</div>
													<div className='drag-handle'></div>
													<div className='level-content'>
														<div className='level-field'>
															<Text strong style={{ minWidth: '120px' }}>
																{t('levelManagement.levelName')}:
															</Text>
															<Text
																style={{
																	color: theme === 'dark' ? '#ffffff' : '#000000',
																}}>
																{activeLevelData.levelName}
															</Text>
														</div>
														<div className='level-field'>
															<Text strong style={{ minWidth: '120px' }}>
																{t('levelManagement.difficulty')}:
															</Text>
															<Text
																style={{
																	color: theme === 'dark' ? '#ffffff' : '#000000',
																}}>
																{activeLevelData.difficulty}
															</Text>
														</div>
													</div>
												</div>
											) : null}
										</DragOverlay>
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
								className='save-button'>
								{t('common.save')}
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Add/Edit Level Modal */}
			<Modal
				title={
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						{editingLevel ? (
							<>
								<EditOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
								<Title level={4} style={{ margin: 0, color: '#1890ff' }}>
									{t('levelManagement.editLevel')}
								</Title>
							</>
						) : (
							<>
								<PlusOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
								<Title level={4} style={{ margin: 0, color: '#1890ff' }}>
									{t('levelManagement.addLevel')}
								</Title>
							</>
						)}
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
				<LevelForm level={editingLevel} onClose={handleModalClose} />
			</Modal>
		</ThemedLayout>
	);
};

export default LevelDragEdit;
