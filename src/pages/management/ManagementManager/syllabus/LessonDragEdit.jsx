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
import ThemedLayout from '../../../../component/ThemedLayout';
import syllabusManagementApi from '../../../../apis/backend/syllabusManagement';
import LessonForm from './LessonForm';
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
import '../level/LevelDragEdit.css';

const { Text, Title } = Typography;

// Sortable Lesson Item Component
const SortableLessonItem = memo(
	({ lesson, index, onDeleteLesson, onUpdateLessonName, onUpdateLessonContent, theme, t }) => {
		const [nameValue, setNameValue] = useState(lesson.name || '');
		const [contentValue, setContentValue] = useState(lesson.content || '');

		// Update values when lesson data changes
		useEffect(() => {
			setNameValue(lesson.name || '');
			setContentValue(lesson.content || '');
		}, [lesson.name, lesson.content]);

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
			id: lesson.id,
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

		const handleSaveName = useCallback(() => {
			if (nameValue.trim()) {
				onUpdateLessonName(index, nameValue.trim());
			}
		}, [index, nameValue, onUpdateLessonName]);

		const handleSaveContent = useCallback(() => {
			onUpdateLessonContent(index, contentValue.trim());
		}, [index, contentValue, onUpdateLessonContent]);

		const handleDelete = useCallback(() => {
			onDeleteLesson(index);
		}, [index, onDeleteLesson]);

		return (
			<div
				ref={setNodeRef}
				style={style}
				className={`level-drag-item ${theme}-level-drag-item ${
					isDragging ? 'dragging' : ''
				}`}>
				<div className='level-position'>
					<Text strong style={{ fontSize: '18px', color: 'black' }}>
						{lesson.position}
					</Text>
				</div>

				<div className='level-content'>
					<div className='level-field' style={{ flex: 1, marginBottom: '8px' }}>
						<Text strong style={{ minWidth: '120px', fontSize: '20px' }}>
							{t('lessonManagement.lessonName')}:
						</Text>
						<Input
							value={nameValue}
							onChange={(e) => setNameValue(e.target.value)}
							onBlur={handleSaveName}
							size="small"
							style={{ width: '200px', fontSize: '16px' }}
							placeholder={t('lessonManagement.lessonNamePlaceholder')}
						/>
					</div>
					<div className='level-field' style={{ flex: 1 }}>
						<Text strong style={{ minWidth: '120px', fontSize: '20px' }}>
							{t('lessonManagement.content')}:
						</Text>
						<Input
							value={contentValue}
							onChange={(e) => setContentValue(e.target.value)}
							onBlur={handleSaveContent}
							size="small"
							style={{ width: '300px', fontSize: '16px' }}
							placeholder={t('lessonManagement.contentPlaceholder')}
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
			prevProps.lesson.id === nextProps.lesson.id &&
			prevProps.lesson.name === nextProps.lesson.name &&
			prevProps.lesson.content === nextProps.lesson.content &&
			prevProps.lesson.position === nextProps.lesson.position &&
			prevProps.theme === nextProps.theme
		);
	}
);

SortableLessonItem.displayName = 'SortableLessonItem';

// Add Lesson Button
const AddLessonButton = memo(
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

AddLessonButton.displayName = 'AddLessonButton';

const LessonDragEdit = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navigate = useNavigate();
	const { syllabusId, chapterId } = useParams();
	const [lessons, setLessons] = useState([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [activeId, setActiveId] = useState(null);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingLesson, setEditingLesson] = useState(null);
	const [insertAtIndex, setInsertAtIndex] = useState(null);
	const [chapterInfo, setChapterInfo] = useState(null);

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

	const fetchAllLessons = useCallback(async () => {
		if (!chapterId) return;

		setLoading(true);
		try {
			const params = {
				page: 0,
				size: 100,
			};

			const response = await syllabusManagementApi.getLessonsByChapterId(
				chapterId,
				params
			);

			const mappedLessons = response.data.map((lesson, index) => ({
				id: lesson.id,
				name: lesson.lessonName,
				content: lesson.content || '',
				duration: lesson.duration || 0,
				lessonType: lesson.lessonType || 'theory',
				materials: lesson.materials || '',
				homework: lesson.homework || '',
				objectives: lesson.objectives || '',
				status: lesson.status || 'active',
				createdBy: lesson.createdBy || lesson.createdByUser || 'N/A',
				position: index + 1,
			}));

			setLessons(mappedLessons);
		} catch (error) {
			console.error('Error fetching lessons:', error);
			spaceToast.error(t('lessonManagement.loadLessonsError'));
		} finally {
			setLoading(false);
		}
	}, [chapterId, t]);

	const fetchChapterInfo = useCallback(async () => {
		if (!chapterId || !syllabusId) return;

		try {
			const response = await syllabusManagementApi.getChaptersBySyllabusId(syllabusId, {
				params: { page: 0, size: 100 },
			});

			const chapter = response.data.find((c) => c.id === parseInt(chapterId));
			if (chapter) {
				setChapterInfo({
					id: chapter.id,
					name: chapter.chapterName,
					description: chapter.description,
				});
			}
		} catch (error) {
			console.error('Error fetching chapter info:', error);
		}
	}, [chapterId, syllabusId]);

	useEffect(() => {
		fetchAllLessons();
		fetchChapterInfo();
	}, [fetchAllLessons, fetchChapterInfo]);

	const handleAddLessonAtPosition = useCallback((index) => {
		setEditingLesson(null);
		setInsertAtIndex(index);
		setIsModalVisible(true);
	}, []);

	const handleModalClose = useCallback(
		(shouldRefresh, newLessonData) => {
			setIsModalVisible(false);

			if (shouldRefresh && newLessonData) {
				if (editingLesson) {
					// Update existing lesson
					setLessons((prev) => {
						return prev.map((lesson) =>
							lesson.id === editingLesson.id
								? { ...lesson, ...newLessonData }
								: lesson
						);
					});
				} else if (insertAtIndex !== null) {
					// Insert new lesson at specific position
					const newLesson = {
						...newLessonData,
						id: `new-${Date.now()}`,
						position: insertAtIndex + 1,
					};

					setLessons((prev) => {
						const newLessons = [...prev];
						newLessons.splice(insertAtIndex, 0, newLesson);
						return newLessons.map((lesson, i) => ({
							...lesson,
							position: i + 1,
						}));
					});
				}
			}

			setEditingLesson(null);
			setInsertAtIndex(null);
		},
		[editingLesson, insertAtIndex]
	);

	const handleDeleteLesson = useCallback(
		(index) => {
			if (lessons.length <= 1) {
				message.warning(t('lessonManagement.minLessonsRequired'));
				return;
			}

			setLessons((prev) => {
				const newLessons = prev.filter((_, i) => i !== index);
				return newLessons.map((lesson, i) => ({
					...lesson,
					position: i + 1,
				}));
			});
		},
		[lessons.length, t]
	);

	const handleUpdateLessonName = useCallback(
		(index, newName) => {
			setLessons((prev) => {
				const newLessons = [...prev];
				newLessons[index] = {
					...newLessons[index],
					name: newName,
				};
				return newLessons;
			});
		},
		[]
	);

	const handleUpdateLessonContent = useCallback(
		(index, newContent) => {
			setLessons((prev) => {
				const newLessons = [...prev];
				newLessons[index] = {
					...newLessons[index],
					content: newContent,
				};
				return newLessons;
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
			setLessons((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);

				if (oldIndex === -1 || newIndex === -1) return items;

				const newItems = arrayMove(items, oldIndex, newIndex);

				return newItems.map((lesson, index) => ({
					...lesson,
					position: index + 1,
				}));
			});
		}
	}, []);

	const lessonIds = useMemo(() => lessons.map((lesson) => lesson.id), [lessons]);

	const handleSave = useCallback(async () => {
		const invalidLessons = lessons.filter((lesson) => !lesson.name.trim());
		if (invalidLessons.length > 0) {
			message.error(t('lessonManagement.lessonNameRequired'));
			return;
		}

		setSaving(true);
		try {
			// Chuẩn bị dữ liệu theo format của API /lesson/sync
			const syncData = lessons.map((lesson, index) => {
				const isNewRecord = typeof lesson.id === 'string' && lesson.id.startsWith('new-');
				
				return {
					id: isNewRecord ? null : lesson.id, // null cho lesson mới
					lessonName: lesson.name,
					content: lesson.content,
					orderNumber: index + 1, // Thứ tự từ 1
					toBeDeleted: false, // Mặc định không xóa
				};
			});

			// Gọi API sync với chapterId và dữ liệu lessons
			await syllabusManagementApi.syncLessons(chapterId, syncData);

			spaceToast.success(t('lessonManagement.updatePositionsSuccess'));
			navigate(`/manager/syllabuses/${syllabusId}/chapters/${chapterId}/lessons`);
		} catch (error) {
			console.error('Error syncing lessons:', error);
			spaceToast.error(t('lessonManagement.updatePositionsError'));
		} finally {
			setSaving(false);
		}
	}, [lessons, chapterId, syllabusId, t, navigate]);

	const handleGoBack = useCallback(() => {
		navigate(`/manager/syllabuses/${syllabusId}/chapters/${chapterId}/lessons`);
	}, [navigate, syllabusId, chapterId]);

	const activeLessonData = useMemo(
		() => lessons.find((lesson) => lesson.id === activeId),
		[activeId, lessons]
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

	if (!chapterInfo) {
		return (
			<ThemedLayout>
				<div style={{ textAlign: 'center', padding: '50px' }}>
					<Text>{t('lessonManagement.chapterNotFound')}</Text>
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
								{t('lessonManagement.editPositions')} - {chapterInfo.name}
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

						{/* Lessons List with Scroll */}
						<div className={`levels-scroll-container ${theme}-levels-scroll-container`}>
							<div className='levels-drag-container'>
								{loading ? (
									<div style={{ textAlign: 'center', padding: '40px' }}>
										<Text type='secondary'>
											{t('lessonManagement.loadingLessons')}
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
											items={lessonIds}
											strategy={verticalListSortingStrategy}>
											{lessons.map((lesson, index) => (
												<React.Fragment key={lesson.id}>
													{index > 0 && (
														<AddLessonButton
															theme={theme}
															index={index}
															onAddAtPosition={handleAddLessonAtPosition}
														/>
													)}

													<SortableLessonItem
														lesson={lesson}
														index={index}
														onDeleteLesson={handleDeleteLesson}
														onUpdateLessonName={handleUpdateLessonName}
														onUpdateLessonContent={handleUpdateLessonContent}
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
											{activeLessonData ? (
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
															{activeLessonData.position}
														</Text>
													</div>
													<div className='drag-handle'></div>
													<div className='level-content'>
														<div className='level-field'>
															<Text strong style={{ minWidth: '120px' }}>
																{t('lessonManagement.lessonName')}:
															</Text>
															<Text
																style={{
																	color: theme === 'dark' ? '#ffffff' : '#000000',
																}}>
																{activeLessonData.name}
															</Text>
														</div>
														<div className='level-field'>
															<Text strong style={{ minWidth: '120px' }}>
																{t('lessonManagement.content')}:
															</Text>
															<Text
																style={{
																	color: theme === 'dark' ? '#ffffff' : '#000000',
																}}>
																{activeLessonData.content || 'N/A'}
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

			{/* Add/Edit Lesson Modal */}
			<Modal
				title={
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						{editingLesson ? (
							<>
								<EditOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
								<Title level={4} style={{ margin: 0, color: '#1890ff' }}>
									{t('lessonManagement.editLesson')}
								</Title>
							</>
						) : (
							<>
								<PlusOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
								<Title level={4} style={{ margin: 0, color: '#1890ff' }}>
									{t('lessonManagement.addLesson')}
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
				<LessonForm
					lesson={editingLesson}
					chapter={chapterInfo}
					onClose={handleModalClose}
				/>
			</Modal>
		</ThemedLayout>
	);
};

export default LessonDragEdit;
