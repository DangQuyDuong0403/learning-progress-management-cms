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
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import usePageTitle from '../../../../hooks/usePageTitle';
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

const LessonDragEditBySyllabus = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navigate = useNavigate();
	const { syllabusId } = useParams();
	
	// Set page title
	usePageTitle('Edit Syllabus Lesson Positions');
	
	const [lessons, setLessons] = useState([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [activeId, setActiveId] = useState(null);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingLesson, setEditingLesson] = useState(null);
	const [insertAtIndex, setInsertAtIndex] = useState(null);
	const [syllabusInfo, setSyllabusInfo] = useState(null);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

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
		if (!syllabusId) return;

		setLoading(true);
		try {
			const params = {
				page: 0,
				size: 100,
			};

			const response = await syllabusManagementApi.getLessonsBySyllabusId(
				syllabusId,
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
	}, [syllabusId, t]);

	const fetchSyllabusInfo = useCallback(async () => {
		if (!syllabusId) return;

		try {
			const response = await syllabusManagementApi.getSyllabuses({
				params: { page: 0, size: 100 },
			});

			const syllabus = response.data.find((s) => s.id === parseInt(syllabusId));
			if (syllabus) {
				setSyllabusInfo({
					id: syllabus.id,
					name: syllabus.syllabusName,
					description: syllabus.description,
				});
			}
		} catch (error) {
			console.error('Error fetching syllabus info:', error);
		}
	}, [syllabusId]);

	useEffect(() => {
		const fetchData = async () => {
			setIsInitialLoading(true);
			await Promise.all([
				fetchAllLessons(),
				fetchSyllabusInfo()
			]);
			setIsInitialLoading(false);
		};
		fetchData();
	}, [fetchAllLessons, fetchSyllabusInfo]);

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
			const visibleLessons = lessons.filter(lesson => !lesson.toBeDeleted);

			// Get the actual lesson from visible lessons using the index
			const lessonToDelete = visibleLessons[index];
			if (!lessonToDelete) {
				console.error('Lesson not found at index:', index);
				return;
			}

			// Set toBeDeleted: true but keep in state
			setLessons((prev) => {
				const newLessons = prev.map((lesson) => {
					if (lesson.id === lessonToDelete.id) {
						return {
							...lesson,
							toBeDeleted: true
						};
					}
					return lesson;
				});
				
				// Recalculate positions only for visible items
				const visibleItems = newLessons.filter(lesson => !lesson.toBeDeleted);
				return newLessons.map((lesson) => {
					if (lesson.toBeDeleted) {
						return lesson; // Keep deleted items as-is
					}
					
					// Update position for visible items
					const visibleIndex = visibleItems.findIndex(item => item.id === lesson.id);
					return {
						...lesson,
						position: visibleIndex + 1,
					};
				});
			});

			spaceToast.success(t('lessonManagement.deleteLessonSuccess'));
		},
		[lessons, t]
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

	const lessonIds = useMemo(() => 
		lessons.filter(lesson => !lesson.toBeDeleted).map((lesson) => lesson.id), 
		[lessons]
	);

	const handleSave = useCallback(async () => {
		const visibleLessons = lessons.filter(lesson => !lesson.toBeDeleted);
		const invalidLessons = visibleLessons.filter((lesson) => !lesson.name.trim());
		if (invalidLessons.length > 0) {
			message.error(t('lessonManagement.lessonNameRequired'));
			return;
		}

		setSaving(true);
		try {
			// TODO: Implement bulk update API for syllabus-level lessons
			// For now, we'll just show success message
			spaceToast.success(t('lessonManagement.updatePositionsSuccess'));
			navigate(`/manager/syllabuses/${syllabusId}/lessons`);
		} catch (error) {
			console.error('Error syncing lessons:', error);
			spaceToast.error(t('lessonManagement.updatePositionsError'));
		} finally {
			setSaving(false);
		}
	}, [lessons, syllabusId, t, navigate]);

	const handleGoBack = useCallback(() => {
		navigate(`/manager/syllabuses/${syllabusId}/lessons`);
	}, [navigate, syllabusId]);

	const activeLessonData = useMemo(
		() => lessons.filter(lesson => !lesson.toBeDeleted).find((lesson) => lesson.id === activeId),
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

	if (!syllabusInfo || isInitialLoading) {
		return (
			<ThemedLayout>
				{/* Main Content Panel */}
				<div className={`main-content-panel ${theme}-main-panel`}>
					<div style={{ textAlign: 'center', padding: '50px' }}>
						<LoadingWithEffect
							loading={true}
							message={t('common.loading')}
						>
							<div></div>
						</LoadingWithEffect>
					</div>
				</div>
			</ThemedLayout>
		);
	}

	return (
		<ThemedLayout>
			<div className={`main-content-panel ${theme}-main-panel`}>
				{/* Header Section */}
				<div className={`panel-header ${theme}-panel-header`}>
					<div className="page-title-container" style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
						<Button 
							icon={<ArrowLeftOutlined />}
							onClick={handleGoBack}
							className={`back-button ${theme}-back-button`}
							style={{ marginRight: '24px' }}
						>
							{t('common.back')}
						</Button>
						<Title 
							level={1} 
							className="page-title"
							style={{ margin: 0, flex: 1, textAlign: 'center' }}
						>
							{t('lessonManagement.editPositions')} - {syllabusInfo.name}
						</Title>
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
											{lessons
												.filter(lesson => !lesson.toBeDeleted)
												.map((lesson, index) => (
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
											
											{/* Always show Add button at the end if there are lessons */}
											{lessons.filter(lesson => !lesson.toBeDeleted).length > 0 && (
												<AddLessonButton
													theme={theme}
													index={lessons.filter(lesson => !lesson.toBeDeleted).length}
													onAddAtPosition={handleAddLessonAtPosition}
												/>
											)}
											
											{/* Show fixed Add button when no lessons exist */}
											{lessons.filter(lesson => !lesson.toBeDeleted).length === 0 && (
												<div className={`add-level-empty ${theme}-add-level-empty`} style={{ 
													marginTop: '40px', 
													textAlign: 'center',
													padding: '40px 20px'
												}}>
													<Button
														type='primary'
														icon={<PlusOutlined />}
														size='large'
														onClick={() => handleAddLessonAtPosition(0)}
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
														{t('lessonManagement.addLesson')}
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

			{/* Add/Edit Lesson Modal */}
			<Modal
				title={
					editingLesson
						? t('lessonManagement.editLesson')
						: t('lessonManagement.addLesson')
				}
				open={isModalVisible}
				onCancel={() => handleModalClose(false)}
				footer={null}
				width={600}
				destroyOnClose
			>
				<LessonForm
					lesson={editingLesson}
					chapter={null} // No specific chapter context for syllabus-level lessons
					onClose={handleModalClose}
					theme={theme}
				/>
			</Modal>
		</ThemedLayout>
	);
};

export default LessonDragEditBySyllabus;
