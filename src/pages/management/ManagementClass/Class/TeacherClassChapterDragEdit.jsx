import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Button, message, Typography, Modal, Input } from 'antd';
import {
	PlusOutlined,
	DeleteOutlined,
	SaveOutlined,
	ArrowLeftOutlined,
	EditOutlined,
	SwapOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import ThemedLayoutWithSidebar from '../../../../component/ThemedLayout';
import ThemedLayoutNoSidebar from '../../../../component/teacherlayout/ThemedLayout';
import teacherManagementApi from '../../../../apis/backend/teacherManagement';
import ChapterForm from '../../ManagementManager/syllabus/ChapterForm';
import { useSelector } from 'react-redux';
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
import '../../ManagementManager/level/LevelDragEdit.css';

const { Text, Title } = Typography;

// Sortable Chapter Item Component
const SortableChapterItem = memo(
	({ chapter, index, onDeleteChapter, onUpdateChapterName, theme, t }) => {
		const [editValue, setEditValue] = useState(chapter.name || '');

		// Update editValue when chapter.name changes
		useEffect(() => {
			setEditValue(chapter.name || '');
		}, [chapter.name]);

		const animateLayoutChanges = useCallback((args) => {
			const { isSorting, wasDragging } = args;
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
			id: chapter.id,
			animateLayoutChanges,
		});

		const style = useMemo(
			() => ({
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0.5 : 1,
				willChange: 'transform',
			}),
			[transform, transition, isDragging]
		);

		const handleSaveEdit = useCallback(() => {
			if (editValue.trim()) {
				onUpdateChapterName(index, editValue.trim());
			}
		}, [index, editValue, onUpdateChapterName]);

		const handleDelete = useCallback(() => {
			onDeleteChapter(index);
		}, [index, onDeleteChapter]);

		return (
			<div
				ref={setNodeRef}
				style={style}
				className={`level-drag-item ${theme}-level-drag-item ${
					isDragging ? 'dragging' : ''
				}`}>
				<div className='level-position'>
					<Text strong style={{ fontSize: '18px', color: 'black' }}>
						{chapter.position}
					</Text>
				</div>

				<div className='level-content'>
					<div className='level-field' style={{ flex: 1 }}>
						<Text strong style={{ minWidth: '120px', fontSize: '20px' }}>
							{t('chapterManagement.chapterName')}:
						</Text>
						<Input
							value={editValue}
							onChange={(e) => setEditValue(e.target.value)}
							onBlur={handleSaveEdit}
							size="small"
							style={{ width: '200px', fontSize: '16px' }}
							placeholder={t('chapterManagement.chapterNamePlaceholder')}
						/>
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
		return (
			prevProps.chapter.id === nextProps.chapter.id &&
			prevProps.chapter.name === nextProps.chapter.name &&
			prevProps.chapter.createdBy === nextProps.chapter.createdBy &&
			prevProps.chapter.position === nextProps.chapter.position &&
			prevProps.theme === nextProps.theme
		);
	}
);

SortableChapterItem.displayName = 'SortableChapterItem';

// Add Chapter Button
const AddChapterButton = memo(
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

AddChapterButton.displayName = 'AddChapterButton';

const TeacherClassChapterDragEdit = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navigate = useNavigate();
	const { classId } = useParams();
	const { user } = useSelector((state) => state.auth);
	
	// Determine which layout to use based on user role
	const userRole = user?.role?.toLowerCase();
	const ThemedLayout = (userRole === 'teacher' || userRole === 'teaching_assistant') 
		? ThemedLayoutNoSidebar 
		: ThemedLayoutWithSidebar;
	
	const [chapters, setChapters] = useState([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [activeId, setActiveId] = useState(null);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingChapter, setEditingChapter] = useState(null);
	const [insertAtIndex, setInsertAtIndex] = useState(null);
	const [classInfo, setClassInfo] = useState(null);

	// Determine route prefix based on user role
	const getRoutePrefix = () => {
		const userRole = user?.role?.toLowerCase();
		switch (userRole) {
			case 'manager':
				return '/manager/classes';
			case 'teacher':
				return '/teacher/classes';
			case 'teaching_assistant':
				return '/teaching-assistant/classes';
			default:
				return '/manager/classes';
		}
	};

	const routePrefix = getRoutePrefix();

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
				delay: 0,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const fetchClassInfo = useCallback(async () => {
		if (!classId) return;

		try {
			const response = await teacherManagementApi.getClassById(classId);
			setClassInfo({
				id: classId,
				name: response.data.name,
				syllabus: {
					id: response.data.syllabusId,
					name: response.data.syllabusName,
				}
			});
		} catch (error) {
			console.error('Error fetching class info:', error);
		}
	}, [classId]);

	const fetchAllChapters = useCallback(async () => {
		if (!classId) return;

		setLoading(true);
		try {
			const params = {
				page: 0,
				size: 100,
			};

			const response = await teacherManagementApi.getClassChapters(classId, params);

			const mappedChapters = response.data.map((chapter, index) => ({
				id: chapter.id,
				name: chapter.classChapterName,
				description: chapter.description || '',
				duration: chapter.duration || 0,
				order: chapter.orderNumber,
				status: chapter.status || 'active',
				objectives: chapter.objectives || '',
				learningOutcomes: chapter.learningOutcomes || '',
				assessmentCriteria: chapter.assessmentCriteria || '',
				createdBy: chapter.createdBy || chapter.createdByUser || 'N/A',
				position: index + 1,
			}));

			setChapters(mappedChapters);
		} catch (error) {
			console.error('Error fetching chapters:', error);
			spaceToast.error(t('chapterManagement.loadChaptersError'));
		} finally {
			setLoading(false);
		}
	}, [classId, t]);

	useEffect(() => {
		fetchClassInfo();
	}, [fetchClassInfo]);

	useEffect(() => {
		if (classId) {
			fetchAllChapters();
		}
	}, [fetchAllChapters, classId]);

	const handleAddChapterAtPosition = useCallback((index) => {
		setEditingChapter(null);
		setInsertAtIndex(index);
		setIsModalVisible(true);
	}, []);

	const handleModalClose = useCallback(
		(shouldRefresh, newChapterData) => {
			setIsModalVisible(false);

			if (shouldRefresh && newChapterData) {
				if (editingChapter) {
					// Update existing chapter
					setChapters((prev) => {
						return prev.map((chapter) =>
							chapter.id === editingChapter.id
								? { ...chapter, ...newChapterData }
								: chapter
						);
					});
				} else if (insertAtIndex !== null) {
					// Insert new chapter at specific position
					const newChapter = {
						...newChapterData,
						id: `new-${Date.now()}`,
						position: insertAtIndex + 1,
						order: insertAtIndex + 1,
					};

					setChapters((prev) => {
						const newChapters = [...prev];
						newChapters.splice(insertAtIndex, 0, newChapter);
						return newChapters.map((chapter, i) => ({
							...chapter,
							position: i + 1,
							order: i + 1,
						}));
					});
				}
			}

			setEditingChapter(null);
			setInsertAtIndex(null);
		},
		[editingChapter, insertAtIndex]
	);

	const handleDeleteChapter = useCallback(
		(index) => {
			if (chapters.length <= 1) {
				message.warning(t('chapterManagement.minChaptersRequired'));
				return;
			}

			setChapters((prev) => {
				const newChapters = prev.filter((_, i) => i !== index);
				return newChapters.map((chapter, i) => ({
					...chapter,
					position: i + 1,
					order: i + 1,
				}));
			});
		},
		[chapters.length, t]
	);

	const handleUpdateChapterName = useCallback(
		(index, newName) => {
			setChapters((prev) => {
				const newChapters = [...prev];
				newChapters[index] = {
					...newChapters[index],
					name: newName,
				};
				return newChapters;
			});
		},
		[]
	);

	const handleDragStart = useCallback((event) => {
		setActiveId(event.active.id);
		document.body.style.overflow = 'hidden';
	}, []);

	useEffect(() => {
		return () => {
			document.body.style.overflow = '';
		};
	}, []);

	const handleDragEnd = useCallback((event) => {
		const { active, over } = event;
		setActiveId(null);
		document.body.style.overflow = '';

		if (active.id !== over?.id) {
			setChapters((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);

				if (oldIndex === -1 || newIndex === -1) return items;

				const newItems = arrayMove(items, oldIndex, newIndex);

				return newItems.map((chapter, index) => ({
					...chapter,
					position: index + 1,
					order: index + 1,
				}));
			});
		}
	}, []);

	const chapterIds = useMemo(() => chapters.map((chapter) => chapter.id), [chapters]);

	const handleSave = useCallback(async () => {
		const invalidChapters = chapters.filter((chapter) => !chapter.name.trim());
		if (invalidChapters.length > 0) {
			message.error(t('chapterManagement.chapterNameRequired'));
			return;
		}

		setSaving(true);
		try {
			// Chuẩn bị dữ liệu theo format của API /class-chapter/sync
			const syncData = chapters.map((chapter, index) => {
				const isNewRecord = typeof chapter.id === 'string' && chapter.id.startsWith('new-');
				
				return {
					id: isNewRecord ? null : chapter.id, // null cho chapter mới
					classChapterName: chapter.name,
					orderNumber: index + 1, // Thứ tự từ 1
					toBeDeleted: false, // Mặc định không xóa
				};
			});

			// Gọi API sync với classId và dữ liệu chapters
			await teacherManagementApi.syncClassChapters(classId, syncData);

			spaceToast.success(t('chapterManagement.updatePositionsSuccess'));
			navigate(`${routePrefix}/chapters/${classId}`);
		} catch (error) {
			console.error('Error syncing chapters:', error);
			spaceToast.error(t('chapterManagement.updatePositionsError'));
		} finally {
			setSaving(false);
		}
	}, [chapters, classId, t, navigate, routePrefix]);

	const handleGoBack = useCallback(() => {
		navigate(`${routePrefix}/chapters/${classId}`);
	}, [navigate, routePrefix, classId]);

	const activeChapterData = useMemo(
		() => chapters.find((chapter) => chapter.id === activeId),
		[activeId, chapters]
	);

	const offsetModifier = useCallback((args) => {
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

	if (!classInfo) {
		return (
			<ThemedLayout>
				<div style={{ textAlign: 'center', padding: '50px' }}>
					<Text>{t('chapterManagement.classNotFound')}</Text>
				</div>
			</ThemedLayout>
		);
	}

	return (
		<ThemedLayout>
			<div className={`main-content-panel ${theme}-main-panel`}>
				{/* Header Section */}
				<div className={`panel-header ${theme}-panel-header`}>
					<div className='page-header'>
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
								{t('chapterManagement.editPositions')} - {classInfo.name}
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

						{/* Chapters List with Scroll */}
						<div className={`levels-scroll-container ${theme}-levels-scroll-container`}>
							<div className='levels-drag-container'>
								{loading ? (
									<div style={{ textAlign: 'center', padding: '40px' }}>
										<Text type='secondary'>
											{t('chapterManagement.loadingChapters')}
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
											items={chapterIds}
											strategy={verticalListSortingStrategy}>
											{chapters.map((chapter, index) => (
												<React.Fragment key={chapter.id}>
													{index > 0 && (
														<AddChapterButton
															theme={theme}
															index={index}
															onAddAtPosition={handleAddChapterAtPosition}
														/>
													)}

													<SortableChapterItem
														chapter={chapter}
														index={index}
														onDeleteChapter={handleDeleteChapter}
														onUpdateChapterName={handleUpdateChapterName}
														theme={theme}
														t={t}
													/>
												</React.Fragment>
											))}
										</SortableContext>

										{/* Drag Overlay */}
										<DragOverlay
											dropAnimation={null}
											modifiers={[offsetModifier]}>
											{activeChapterData ? (
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
															{activeChapterData.position}
														</Text>
													</div>
													<div className='drag-handle'></div>
													<div className='level-content'>
														<div className='level-field'>
															<Text strong style={{ minWidth: '120px' }}>
																{t('chapterManagement.chapterName')}:
															</Text>
															<Text
																style={{
																	color: theme === 'dark' ? '#ffffff' : '#000000',
																}}>
																{activeChapterData.name}
															</Text>
														</div>
														<div className='level-field'>
															<Text strong style={{ minWidth: '120px' }}>
																{t('chapterManagement.createdBy')}:
															</Text>
															<Text
																style={{
																	color: theme === 'dark' ? '#ffffff' : '#000000',
																}}>
																{activeChapterData.createdBy || 'N/A'}
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

			{/* Add/Edit Chapter Modal */}
			<Modal
				title={
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
						{editingChapter ? (
							<>
								<EditOutlined style={{ fontSize: '28px', color: 'rgb(24, 144, 255)' }} />
								<Title level={4} style={{ margin: 0, color: 'rgb(24, 144, 255)', fontSize: '28px' }}>
									{t('chapterManagement.editChapter')}
								</Title>
							</>
						) : (
							<>
								<PlusOutlined style={{ fontSize: '28px', color: 'rgb(24, 144, 255)' }} />
								<Title level={4} style={{ margin: 0, color: 'rgb(24, 144, 255)', fontSize: '28px' }}>
									{t('chapterManagement.addChapter')}
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
				<ChapterForm
					chapter={editingChapter}
					syllabus={classInfo?.syllabus}
					onClose={handleModalClose}
				/>
			</Modal>
		</ThemedLayout>
	);
};

export default TeacherClassChapterDragEdit;
