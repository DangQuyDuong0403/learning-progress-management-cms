import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Button, message, Typography, Modal, Input } from 'antd';
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
import { useClassMenu } from '../../../../contexts/ClassMenuContext';
import { spaceToast } from '../../../../component/SpaceToastify';
import ThemedLayoutWithSidebar from '../../../../component/ThemedLayout';
import ThemedLayoutNoSidebar from '../../../../component/teacherlayout/ThemedLayout';
import TableSpinner from '../../../../component/spinner/TableSpinner';
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

// Optimized: Memoized Sortable Lesson Item Component
const SortableLessonItem = memo(
	({ lesson, index, onDeleteLesson, onUpdateLessonName, theme, t }) => {
		const [editValue, setEditValue] = useState(lesson.name || '');

		// Update editValue when lesson.name changes - optimized
		useEffect(() => {
			setEditValue(lesson.name || '');
		}, [lesson.name]);

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

		const handleSaveEdit = useCallback(() => {
			if (editValue.trim()) {
				onUpdateLessonName(index, editValue.trim());
			}
		}, [index, editValue, onUpdateLessonName]);

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
					<div className='level-field' style={{ flex: 1 }}>
						<Text strong style={{ minWidth: '120px', fontSize: '20px' }}>
							{t('lessonManagement.lessonName')}:
						</Text>
						<Input
							value={editValue}
							onChange={(e) => setEditValue(e.target.value)}
							onBlur={handleSaveEdit}
							size="small"
							style={{ width: '200px', fontSize: '16px' }}
							placeholder={t('lessonManagement.lessonNamePlaceholder')}
							maxLength={100}
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
		// Custom comparison để tránh re-render không cần thiết
		return (
			prevProps.lesson.id === nextProps.lesson.id &&
			prevProps.lesson.name === nextProps.lesson.name &&
			prevProps.lesson.createdBy === nextProps.lesson.createdBy &&
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

const TeacherClassLessonDragEdit = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navigate = useNavigate();
	const { classId, chapterId } = useParams();
	const { user } = useSelector((state) => state.auth);
	const { enterClassMenu, exitClassMenu } = useClassMenu();
	
	console.log('TeacherClassLessonDragEdit - Component mounted');
	console.log('TeacherClassLessonDragEdit - classId:', classId);
	console.log('TeacherClassLessonDragEdit - chapterId:', chapterId);
	console.log('TeacherClassLessonDragEdit - user:', user);
	
	// Determine which layout to use based on user role
	const userRole = user?.role?.toLowerCase();
	const ThemedLayout = (userRole === 'teacher' || userRole === 'teaching_assistant') 
		? ThemedLayoutNoSidebar 
		: ThemedLayoutWithSidebar;
	
	// Security check: Only TEACHER role can access edit positions page
	useEffect(() => {
		if (user && userRole) {
			if (userRole !== 'teacher' && userRole !== 'manager') {
				spaceToast.error(t('common.accessDenied') || 'You do not have permission to access this page');
				// Redirect based on user role
				if (userRole === 'teaching_assistant') {
					navigate(`/teaching-assistant/classes/chapters/${classId}/${chapterId}/lessons`);
				} else {
					navigate('/choose-login');
				}
			}
		}
	}, [user, userRole, classId, chapterId, navigate, t]);
	
	const [lessons, setLessons] = useState([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingLesson, setEditingLesson] = useState(null);
	const [insertAtIndex, setInsertAtIndex] = useState(null);
	const [classData, setClassData] = useState(null);
	const [chapterData, setChapterData] = useState(null);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

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

	const fetchClassData = useCallback(async () => {
		if (!classId) return;
		
		try {
			console.log('Fetching class data for classId:', classId);
			const response = await teacherManagementApi.getClassById(classId);
			console.log('Class data response:', response);
			
			const data = response?.data ?? response;
			setClassData({
				id: classId,
				name: data?.name ?? data?.className ?? data?.title ?? 'Unknown Class',
				syllabus: {
					id: data?.syllabusId,
					name: data?.syllabusName,
				}
			});
		} catch (error) {
			console.error('Error fetching class info:', error);
			spaceToast.error(t('lessonManagement.loadingClassInfo'));
		}
	}, [classId, t]);

	const fetchChapterData = useCallback(async () => {
		if (!chapterId) return;
		
		try {
			console.log('Fetching chapter data for chapterId:', chapterId);
			const response = await teacherManagementApi.getClassChapterById(chapterId);
			console.log('Chapter data response:', response);
			
			const data = response?.data ?? response;
			setChapterData({
				id: chapterId,
				name: data?.classChapterName,
				description: data?.description,
				order: data?.orderNumber,
				createdBy: data?.createdBy,
				createdAt: data?.createdAt,
			});
		} catch (error) {
			console.error('Error fetching chapter info:', error);
			spaceToast.error(t('lessonManagement.loadingChapterInfo'));
		}
	}, [chapterId, t]);

	const fetchAllLessons = useCallback(async () => {
		if (!chapterId) return;

		setLoading(true);
		try {
			console.log('Fetching lessons for chapterId:', chapterId);
			const params = {
				classChapterId: chapterId, // Keep classChapterId parameter
				page: 0,
				size: 100,
			};

		const response = await teacherManagementApi.getClassLessons(params);
		console.log('Lessons response:', response);
		
		// Handle different response structures
		let lessonsData = [];
		if (response.data) {
			// Check if response.data is an array
			if (Array.isArray(response.data)) {
				lessonsData = response.data;
			} 
			// Check if response.data has a data property (nested structure)
			else if (response.data.data && Array.isArray(response.data.data)) {
				lessonsData = response.data.data;
			}
			// Check if response.data has content property (Spring Boot pagination)
			else if (response.data.content && Array.isArray(response.data.content)) {
				lessonsData = response.data.content;
			}
			// If it's a single object, wrap it in array
			else if (response.data.id) {
				lessonsData = [response.data];
			}
		}
		
		console.log('Extracted lessons data:', lessonsData);
		
		// Map API response to component format
		const mappedLessons = lessonsData.map((lesson, index) => ({
			id: lesson.id,
			name: lesson.classLessonName,
			content: lesson.classLessonContent,
			order: lesson.orderNumber,
			createdBy: lesson.createdBy,
			createdAt: lesson.createdAt,
			position: index + 1,
		}));

			console.log('Mapped lessons:', mappedLessons);
			setLessons(mappedLessons);
		} catch (error) {
			console.error('Error fetching lessons:', error);
			spaceToast.error(t('lessonManagement.loadingLessons'));
		} finally {
			setLoading(false);
		}
	}, [chapterId, t]);

	useEffect(() => {
		console.log('TeacherClassLessonDragEdit - useEffect triggered');
		const fetchData = async () => {
			console.log('TeacherClassLessonDragEdit - Starting data fetch');
			setIsInitialLoading(true);
			await Promise.all([
				fetchClassData(),
				fetchChapterData(),
				fetchAllLessons()
			]);
			console.log('TeacherClassLessonDragEdit - Data fetch completed');
			setIsInitialLoading(false);
		};
		fetchData();
	}, [fetchClassData, fetchChapterData, fetchAllLessons]);

	// Handle class menu updates - separate effects to avoid infinite loops
	useEffect(() => {
		if (classId) {
			enterClassMenu({ id: classId });
		}
		return () => exitClassMenu();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [classId]);

	useEffect(() => {
		if (classData && chapterData && classId) {
			enterClassMenu({
				id: classData.id,
				name: classData.name,
				description: `${classData.name} / ${chapterData.name}`,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [classData?.id, classData?.name, chapterData?.name, classId]);

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
					setLessons((prev) => {
						// Create new lesson with temporary position
						const newLesson = {
							...newLessonData,
							id: `new-${Date.now()}`,
							position: 0, // Temporary, will be recalculated
							order: 0, // Temporary, will be recalculated
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
							order: i + 1,
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
						order: visibleIndex + 1,
						orderNumber: visibleIndex + 1, // Cập nhật orderNumber để tuần tự
					};
				});
			});
		},
		[lessons]
	);

	const handleUpdateLessonName = useCallback(
		(index, newName) => {
			setLessons((prev) => {
				// Get visible lessons to find the correct lesson by index
				const visibleLessons = prev.filter(lesson => !lesson.toBeDeleted);
				const lessonToUpdate = visibleLessons[index];
				
				if (!lessonToUpdate) {
					console.error('Lesson not found at index:', index);
					return prev;
				}

				// Update the lesson by its ID
				return prev.map((lesson) => {
					if (lesson.id === lessonToUpdate.id) {
						return {
							...lesson,
							name: newName,
						};
					}
					return lesson;
				});
			});
		},
		[]
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
						order: visibleIndex + 1,
						orderNumber: visibleIndex + 1, // Cập nhật orderNumber để tuần tự
					};
				});
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
						classLessonName: lesson.name,
						orderNumber: lesson.position, // Position hiện tại = orderNumber
						toBeDeleted: lesson.toBeDeleted || false, // Include toBeDeleted flag
					};
				})
				.filter((lesson) => {
					// Không gửi các record mới (id: null) mà đã bị xóa (toBeDeleted: true)
					// Vì chúng chưa tồn tại trên backend nên không cần xóa
					return !(lesson.id === null && lesson.toBeDeleted === true);
				});

			console.log('TeacherClassLessonDragEdit - Sending sync data:', {
				count: syncData.length,
				lessons: syncData.map(l => ({ 
					id: l.id, 
					classLessonName: l.classLessonName, 
					orderNumber: l.orderNumber,
					toBeDeleted: l.toBeDeleted 
				}))
			});

			// Gọi API sync với classChapterId và dữ liệu lessons
			const response = await teacherManagementApi.syncClassLessons(chapterId, syncData);

			// Use backend message if available, otherwise fallback to translation
			const successMessage = response.message || t('lessonManagement.updatePositionsSuccess');
			spaceToast.success(successMessage);
			navigate(`${routePrefix}/chapters/${classId}/${chapterId}/lessons`);
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
	}, [lessons, chapterId, classId, t, navigate, routePrefix]);

	// Early return if user doesn't have permission (defense in depth)
	if (user && userRole && userRole !== 'teacher' && userRole !== 'manager') {
		return null;
	}

	if (!classData || !chapterData || isInitialLoading) {
		console.log('TeacherClassLessonDragEdit - Rendering loading state');
		console.log('TeacherClassLessonDragEdit - classData:', classData);
		console.log('TeacherClassLessonDragEdit - chapterData:', chapterData);
		console.log('TeacherClassLessonDragEdit - isInitialLoading:', isInitialLoading);
		
		return (
			<ThemedLayout>
				{/* Main Content Panel */}
				<div className={`main-content-panel ${theme}-main-panel`}>
					<TableSpinner />
				</div>
			</ThemedLayout>
		);
	}

	console.log('TeacherClassLessonDragEdit - Rendering main content');
	console.log('TeacherClassLessonDragEdit - lessons:', lessons);

	return (
		<ThemedLayout>
			<div className={`main-content-panel ${theme}-main-panel`}>
				{/* Header Section */}
				<div className={`panel-header ${theme}-panel-header`}>
					<div className='page-title-container' style={{ marginBottom: '24px', width: '100%', display: 'flex', justifyContent: 'center' }}>
						<Title
							level={1}
							className="page-title"
							style={{ margin: 0, textAlign: 'center' }}
						>
							{t('lessonManagement.editPositions')}
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
									<TableSpinner />
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
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
						{editingLesson ? (
							<>
								<EditOutlined style={{ fontSize: '28px', color: 'rgb(24, 144, 255)' }} />
								<Title level={4} style={{ margin: 0, color: 'rgb(24, 144, 255)', fontSize: '28px' }}>
									{t('lessonManagement.editLesson')}
								</Title>
							</>
						) : (
							<>
								<PlusOutlined style={{ fontSize: '28px', color: 'rgb(24, 144, 255)' }} />
								<Title level={4} style={{ margin: 0, color: 'rgb(24, 144, 255)', fontSize: '28px' }}>
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
				<ChapterForm
					chapter={editingLesson}
					syllabus={classData?.syllabus}
					onClose={handleModalClose}
					isLesson={true}
				/>
			</Modal>
		</ThemedLayout>
	);
};

export default TeacherClassLessonDragEdit;
