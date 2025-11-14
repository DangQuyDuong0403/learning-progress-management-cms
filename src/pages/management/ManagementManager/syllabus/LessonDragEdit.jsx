import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Button, message, Typography, Modal } from 'antd';
import {
	PlusOutlined,
	DeleteOutlined,
	SaveOutlined,
	EditOutlined,
	SwapOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useSyllabusMenu } from '../../../../contexts/SyllabusMenuContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import ThemedLayout from '../../../../component/ThemedLayout';
import LoadingWithEffect from '../../../../component/spinner/LoadingWithEffect';
import usePageTitle from '../../../../hooks/usePageTitle';
import syllabusManagementApi from '../../../../apis/backend/syllabusManagement';
import LessonForm from './LessonForm';
import ROUTER_PAGE from '../../../../constants/router';
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
import '../level/LevelDragEdit.css';

const { Text, Title } = Typography;

// Optimized: Memoized Sortable Lesson Item Component
const SortableLessonItem = memo(
	({
		lesson,
		index,
		onDeleteLesson,
		onEditLesson,
		theme,
		t,
	}) => {
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
			id: lesson.id,
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
			onEditLesson(lesson);
		}, [lesson, onEditLesson]);

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
						<Text
							style={{
								fontSize: '16px',
								color: '#333',
								maxWidth: '200px',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
								display: 'inline-block',
							}}
							title={lesson.name || t('lessonManagement.noLessonName')}>
							{lesson.name || t('lessonManagement.noLessonName')}
						</Text>
					</div>
					<div className='level-field' style={{ flex: 1 }}>
						<Text strong style={{ minWidth: '120px', fontSize: '20px' }}>
							{t('lessonManagement.content')}:
						</Text>
						<Text
							style={{
								fontSize: '16px',
								color: '#333',
								maxWidth: '250px',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
								display: 'inline-block',
							}}
							title={lesson.content || t('lessonManagement.noContent')}>
							{lesson.content || t('lessonManagement.noContent')}
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
		return (
			prevProps.theme === nextProps.theme && prevProps.index === nextProps.index
		);
	}
);

AddLessonButton.displayName = 'AddLessonButton';

const LessonDragEdit = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navigate = useNavigate();
	const { syllabusId, chapterId } = useParams();
	const { enterSyllabusMenu, exitSyllabusMenu } = useSyllabusMenu();

	// Set page title
	usePageTitle('Edit Lesson Positions');

	const [lessons, setLessons] = useState([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingLesson, setEditingLesson] = useState(null);
	const [insertAtIndex, setInsertAtIndex] = useState(null);
	const [chapterInfo, setChapterInfo] = useState(null);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

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
			const response = await syllabusManagementApi.getChaptersBySyllabusId(
				syllabusId,
				{
					params: { page: 0, size: 100 },
				}
			);

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
		const fetchData = async () => {
			setIsInitialLoading(true);
			await Promise.all([fetchAllLessons(), fetchChapterInfo()]);
			setIsInitialLoading(false);
		};
		fetchData();
	}, [fetchAllLessons, fetchChapterInfo]);

	// Fetch syllabus info and enter menu mode
	useEffect(() => {
		const fetchSyllabusInfo = async () => {
			if (!syllabusId || !chapterInfo) return;
			
			try {
				const response = await syllabusManagementApi.getSyllabuses({
					params: { page: 0, size: 100 }
				});
				
				const syllabus = response.data.find(s => s.id === parseInt(syllabusId));
				if (syllabus) {
					enterSyllabusMenu({
						id: syllabus.id,
						name: syllabus.syllabusName,
						description: syllabus.description,
						chapterName: chapterInfo.name,
						backUrl: ROUTER_PAGE.MANAGER_SYLLABUS_CHAPTER_LESSONS
							.replace(':syllabusId', String(syllabusId))
							.replace(':chapterId', String(chapterId)),
					});
				}
			} catch (error) {
				console.error('Error fetching syllabus info:', error);
			}
		};

		fetchSyllabusInfo();
		
		return () => {
			exitSyllabusMenu();
		};
	}, [syllabusId, chapterInfo, enterSyllabusMenu, exitSyllabusMenu]);

	const handleAddLessonAtPosition = useCallback((index) => {
		setEditingLesson(null);
		setInsertAtIndex(index);
		setIsModalVisible(true);
	}, []);

	const handleEditLesson = useCallback((lesson) => {
		setEditingLesson(lesson);
		setInsertAtIndex(null);
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
					setLessons((prev) => {
						// Create new lesson with temporary position
						const newLesson = {
							...newLessonData,
							id: `new-${Date.now()}`,
							position: 0, // Temporary, will be recalculated
							orderNumber: 0, // Temporary, will be recalculated
						};
						
						// Get only visible lessons (not deleted)
						const visibleLessons = prev.filter(lesson => !lesson.toBeDeleted);
						
						// Insert at the correct position in visible lessons
						const newVisibleLessons = [...visibleLessons];
						newVisibleLessons.splice(insertAtIndex, 0, newLesson);
						
						// Recalculate positions for visible lessons only
						const updatedVisibleLessons = newVisibleLessons.map((lesson, i) => ({
							...lesson,
							position: i + 1,
							orderNumber: i + 1,
						}));
						
						// Combine with deleted lessons (keep them as-is)
						const deletedLessons = prev.filter(lesson => lesson.toBeDeleted);
						
						return [...updatedVisibleLessons, ...deletedLessons];
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
			const visibleLessons = lessons.filter((lesson) => !lesson.toBeDeleted);

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
							toBeDeleted: true,
						};
					}
					return lesson;
				});

				// Recalculate positions only for visible items
				const visibleItems = newLessons.filter((lesson) => !lesson.toBeDeleted);
				return newLessons.map((lesson) => {
					if (lesson.toBeDeleted) {
						return lesson; // Keep deleted items as-is
					}

					// Update position for visible items
					const visibleIndex = visibleItems.findIndex(
						(item) => item.id === lesson.id
					);
					return {
						...lesson,
						position: visibleIndex + 1,
						orderNumber: visibleIndex + 1, // Cập nhật orderNumber để tuần tự
					};
				});
			});
		},
		[lessons]
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
			setLessons((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);

				if (oldIndex === -1 || newIndex === -1) return items;

				const newItems = arrayMove(items, oldIndex, newIndex);

				// Chỉ update position cho visible items (không bị xóa)
				const visibleItems = newItems.filter(lesson => !lesson.toBeDeleted);
				return newItems.map((lesson) => {
					if (lesson.toBeDeleted) {
						return lesson; // Giữ nguyên items đã bị xóa
					}
					
					// Tính position dựa trên thứ tự trong visible items
					const visibleIndex = visibleItems.findIndex(item => item.id === lesson.id);
					return {
						...lesson,
						position: visibleIndex + 1,
						orderNumber: visibleIndex + 1, // Cập nhật orderNumber để tuần tự
					};
				});
			});
		}
	}, []);

	const lessonIds = useMemo(
		() =>
			lessons
				.filter((lesson) => !lesson.toBeDeleted)
				.map((lesson) => lesson.id),
		[lessons]
	);

	const handleSave = useCallback(async () => {
		const visibleLessons = lessons.filter((lesson) => !lesson.toBeDeleted);
		const invalidLessons = visibleLessons.filter(
			(lesson) => !lesson.name.trim()
		);
		if (invalidLessons.length > 0) {
			message.error(t('lessonManagement.lessonNameRequired'));
			return;
		}

		// Kiểm tra độ dài tên lesson
		const longNameLessons = visibleLessons.filter((lesson) => lesson.name.length > 100);
		if (longNameLessons.length > 0) {
			message.error(t('lessonManagement.lessonNameTooLong'));
			return;
		}

		setSaving(true);
		try {
			// Chuẩn bị dữ liệu theo format của API /lesson/sync
			const syncData = lessons
				.map((lesson) => {
					const isNewRecord = typeof lesson.id === 'string' && lesson.id.startsWith('new-');

					return {
						id: isNewRecord ? null : lesson.id, // null cho lesson mới
						lessonName: lesson.name,
						content: lesson.content,
						orderNumber: lesson.position, // Position hiện tại = orderNumber
						toBeDeleted: lesson.toBeDeleted || false, // Include toBeDeleted flag
					};
				})
				.filter((lesson) => {
					// Không gửi các record mới (id: null) mà đã bị xóa (toBeDeleted: true)
					// Vì chúng chưa tồn tại trên backend nên không cần xóa
					return !(lesson.id === null && lesson.toBeDeleted === true);
				});

			console.log('LessonDragEdit - Sending sync data:', {
				count: syncData.length,
				lessons: syncData.map(l => ({ 
					id: l.id, 
					lessonName: l.lessonName, 
					orderNumber: l.orderNumber,
					toBeDeleted: l.toBeDeleted 
				}))
			});

			// Gọi API sync với chapterId và dữ liệu lessons
			const response = await syllabusManagementApi.syncLessons(chapterId, syncData);

			// Use backend message if available, otherwise fallback to translation
			const successMessage = response.message || t('lessonManagement.updatePositionsSuccess');
			spaceToast.success(successMessage);
			navigate(
				`/manager/syllabuses/${syllabusId}/chapters/${chapterId}/lessons`
			);
		} catch (error) {
			console.error('Error syncing lessons:', error);
			
			// Handle API errors with backend messages
			if (error.response) {
				const errorMessage = error.response.data?.error || error.response.data?.message || error.message;
				spaceToast.error(errorMessage);
			} else {
				spaceToast.error(error.message || t('lessonManagement.updatePositionsError'));
			}
		} finally {
			setSaving(false);
		}
	}, [lessons, chapterId, syllabusId, t, navigate]);


	if (!chapterInfo || isInitialLoading) {
		return (
			<ThemedLayout>
				{/* Main Content Panel */}
				<div className={`main-content-panel ${theme}-main-panel`}>
					<div style={{ textAlign: 'center', padding: '50px' }}>
						<LoadingWithEffect loading={true} message={t('common.loading')}>
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
					<div className='page-title-container' style={{ marginBottom: '24px', width: '100%', display: 'flex', justifyContent: 'center' }}>
						<Title
							level={1}
							className='page-title'
							style={{ margin: 0, textAlign: 'center' }}>
							{t('lessonManagement.editPositions')} - {chapterInfo.name}
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
						<div
							className={`levels-scroll-container ${theme}-levels-scroll-container`}>
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
										onDragEnd={handleDragEnd}>
										<SortableContext
											items={lessonIds}
											strategy={verticalListSortingStrategy}>
											{lessons
												.filter((lesson) => !lesson.toBeDeleted)
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
															onEditLesson={handleEditLesson}
															theme={theme}
															t={t}
														/>
													</React.Fragment>
												))}

											{/* Always show Add button at the end if there are lessons */}
											{lessons.filter((lesson) => !lesson.toBeDeleted).length >
												0 && (
												<AddLessonButton
													theme={theme}
													index={
														lessons.filter((lesson) => !lesson.toBeDeleted)
															.length
													}
													onAddAtPosition={handleAddLessonAtPosition}
												/>
											)}

											{/* Show fixed Add button when no lessons exist */}
											{lessons.filter((lesson) => !lesson.toBeDeleted)
												.length === 0 && (
												<div
													className={`add-level-empty ${theme}-add-level-empty`}
													style={{
														marginTop: '40px',
														textAlign: 'center',
														padding: '40px 20px',
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
															backgroundColor:
																theme === 'sun'
																	? 'rgb(113, 179, 253)'
																	: 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
															background:
																theme === 'sun'
																	? 'rgb(113, 179, 253)'
																	: 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
															borderColor:
																theme === 'sun'
																	? 'rgb(113, 179, 253)'
																	: 'transparent',
															color: theme === 'sun' ? '#000000' : '#ffffff',
															boxShadow:
																theme === 'sun'
																	? '0 6px 20px rgba(113, 179, 253, 0.4)'
																	: '0 6px 20px rgba(90, 31, 184, 0.4)',
														}}>
														{t('lessonManagement.addLesson')}
													</Button>
													<div
														style={{
															marginTop: '16px',
															color: '#666',
															fontSize: '14px',
														}}></div>
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
								type='primary'
								icon={<SaveOutlined />}
								onClick={handleSave}
								loading={saving}
								className='save-button'
								style={{
									height: '42px',
									borderRadius: '8px',
									fontWeight: '500',
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
				<div style={{ textAlign: 'center', fontSize: '28px', fontWeight: '600', color: 'rgb(24, 144, 255)' }}>
					{editingLesson
						? t('lessonManagement.editLesson')
						: t('lessonManagement.addLesson')}
				</div>
			}
			open={isModalVisible}
			onCancel={() => handleModalClose(false)}
			footer={null}
			width={600}
			destroyOnClose>
				<LessonForm
					lesson={editingLesson}
					chapter={chapterInfo}
					onClose={handleModalClose}
					theme={theme}
				/>
			</Modal>
		</ThemedLayout>
	);
};

export default LessonDragEdit;
