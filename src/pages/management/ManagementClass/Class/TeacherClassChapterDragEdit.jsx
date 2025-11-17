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
import classManagementApi from '../../../../apis/backend/classManagement';
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
	const { enterClassMenu, exitClassMenu } = useClassMenu();
	
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
					navigate(`/teaching-assistant/classes/chapters/${classId}`);
				} else {
					navigate('/choose-login');
				}
			}
		}
	}, [user, userRole, classId, navigate, t]);
	
	const [chapters, setChapters] = useState([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingChapter, setEditingChapter] = useState(null);
	const [insertAtIndex, setInsertAtIndex] = useState(null);
	const [classInfo, setClassInfo] = useState(null);
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
			console.log('Fetching class info for classId:', classId);
			let response;
			if (userRole === 'manager') {
				response = await teacherManagementApi.getClassById(classId);
			} else {
				response = await classManagementApi.getClassDetail(classId);
			}
			console.log('Class info response:', response);
			
			const data = response?.data?.data ?? response?.data ?? null;
			if (!data) {
				throw new Error('Class not found');
			}
			setClassInfo({
				id: classId,
				name: data?.name ?? data?.className ?? data?.title ?? 'Unknown Class',
				syllabus: {
					id: data?.syllabusId,
					name: data?.syllabusName,
				}
			});
		} catch (error) {
			console.error('Error fetching class info:', error);
			spaceToast.error(t('classDetail.accessDenied') || 'Bạn không có quyền truy cập lớp học này / You do not have permission to access this class');
			navigate('/choose-login', { replace: true });
		}
	}, [classId, userRole, navigate, t]);

	const fetchAllChapters = useCallback(async () => {
		if (!classId) return;

		setLoading(true);
		try {
			const params = {
				page: 0,
				size: 100,
			};

			const response = await teacherManagementApi.getClassChapters(classId, params);
			
			// Handle different response structures
			let chaptersData = [];
			if (response.data) {
				if (Array.isArray(response.data)) {
					chaptersData = response.data;
				} else if (response.data.data && Array.isArray(response.data.data)) {
					chaptersData = response.data.data;
				} else if (response.data.content && Array.isArray(response.data.content)) {
					chaptersData = response.data.content;
				}
			}
			
			// Allow empty array - class may not have chapters yet
			// Backend handles authorization, so if API returns empty array, it's valid
			const mappedChapters = chaptersData.map((chapter, index) => ({
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
			spaceToast.error(t('chapterManagement.permission') || 'Bạn không có quyền truy cập chương này / You do not have permission to access these chapters');
			navigate('/choose-login', { replace: true });
		} finally {
			setLoading(false);
		}
	}, [classId, t, navigate]);

	useEffect(() => {
		const fetchData = async () => {
			setIsInitialLoading(true);
			await Promise.all([
				fetchClassInfo(),
				fetchAllChapters()
			]);
			setIsInitialLoading(false);
		};
		fetchData();
	}, [fetchClassInfo, fetchAllChapters]);

	// Handle class menu updates - separate effects to avoid infinite loops
	useEffect(() => {
		if (classId) {
			enterClassMenu({ id: classId });
		}
		return () => exitClassMenu();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [classId]);

	useEffect(() => {
		if (classInfo && classId) {
			enterClassMenu({
				id: classInfo.id,
				name: classInfo.name,
				description: classInfo.name,
				backUrl: `${routePrefix}/chapters/${classId}`
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [classInfo?.id, classInfo?.name, classId]);

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
					setChapters((prev) => {
						// Create new chapter with temporary position
						const newChapter = {
							...newChapterData,
							id: `new-${Date.now()}`,
							position: 0, // Temporary, will be recalculated
							order: 0, // Temporary, will be recalculated
							orderNumber: 0, // Temporary, will be recalculated
						};
						
						// Get only visible chapters (not deleted)
						const visibleChapters = prev.filter(chapter => !chapter.toBeDeleted);
						
						// Insert at the correct position in visible chapters
						const newVisibleChapters = [...visibleChapters];
						newVisibleChapters.splice(insertAtIndex, 0, newChapter);
						
						// Recalculate positions for visible chapters only
						const updatedVisibleChapters = newVisibleChapters.map((chapter, i) => ({
							...chapter,
							position: i + 1,
							order: i + 1,
							orderNumber: i + 1,
						}));
						
						// Combine with deleted chapters (keep them as-is)
						const deletedChapters = prev.filter(chapter => chapter.toBeDeleted);
						
						return [...updatedVisibleChapters, ...deletedChapters];
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
			const visibleChapters = chapters.filter(chapter => !chapter.toBeDeleted);

			// Get the actual chapter from visible chapters using the index
			const chapterToDelete = visibleChapters[index];
			if (!chapterToDelete) {
				console.error('Chapter not found at index:', index);
				return;
			}

			// Set toBeDeleted: true but keep in state
			setChapters((prev) => {
				const newChapters = prev.map((chapter) => {
					if (chapter.id === chapterToDelete.id) {
						return {
							...chapter,
							toBeDeleted: true
						};
					}
					return chapter;
				});
				
				// Recalculate positions only for visible items
				const visibleItems = newChapters.filter(chapter => !chapter.toBeDeleted);
				return newChapters.map((chapter) => {
					if (chapter.toBeDeleted) {
						return chapter; // Keep deleted items as-is
					}
					
					// Update position for visible items
					const visibleIndex = visibleItems.findIndex(item => item.id === chapter.id);
					return {
						...chapter,
						position: visibleIndex + 1,
						order: visibleIndex + 1,
						orderNumber: visibleIndex + 1, // Cập nhật orderNumber để tuần tự
					};
				});
			});
		},
		[chapters]
	);

	const handleUpdateChapterName = useCallback(
		(index, newName) => {
			setChapters((prev) => {
				// Get visible chapters to find the correct chapter by index
				const visibleChapters = prev.filter(chapter => !chapter.toBeDeleted);
				const chapterToUpdate = visibleChapters[index];
				
				if (!chapterToUpdate) {
					console.error('Chapter not found at index:', index);
					return prev;
				}

				// Update the chapter by its ID
				return prev.map((chapter) => {
					if (chapter.id === chapterToUpdate.id) {
						return {
							...chapter,
							name: newName,
						};
					}
					return chapter;
				});
			});
		},
		[]
	);

	const handleDragStart = useCallback((event) => {
		document.body.style.overflow = 'hidden';
	}, []);

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
			setChapters((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);

				if (oldIndex === -1 || newIndex === -1) return items;

				const newItems = arrayMove(items, oldIndex, newIndex);

				// Chỉ update position cho visible items (không bị xóa)
				const visibleItems = newItems.filter(chapter => !chapter.toBeDeleted);
				return newItems.map((chapter) => {
					if (chapter.toBeDeleted) {
						return chapter; // Giữ nguyên items đã bị xóa
					}
					
					// Tính position dựa trên thứ tự trong visible items
					const visibleIndex = visibleItems.findIndex(item => item.id === chapter.id);
					return {
						...chapter,
						position: visibleIndex + 1,
						order: visibleIndex + 1,
						orderNumber: visibleIndex + 1, // Cập nhật orderNumber để tuần tự
					};
				});
			});
		}
	}, []);

	const chapterIds = useMemo(() => 
		chapters.filter(chapter => !chapter.toBeDeleted).map((chapter) => chapter.id), 
		[chapters]
	);

	const handleSave = useCallback(async () => {
		const visibleChapters = chapters.filter(chapter => !chapter.toBeDeleted);
		const invalidChapters = visibleChapters.filter((chapter) => !chapter.name.trim());
		if (invalidChapters.length > 0) {
			message.error(t('chapterManagement.chapterNameRequired'));
			return;
		}

		// Kiểm tra độ dài tên chapter
		const longNameChapters = visibleChapters.filter((chapter) => chapter.name.length > 100);
		if (longNameChapters.length > 0) {
			message.error(t('chapterManagement.chapterNameTooLong'));
			return;
		}

		setSaving(true);
		try {
			// Chuẩn bị dữ liệu theo format của API /class-chapter/sync
			const syncData = chapters
				.map((chapter) => {
					const isNewRecord = typeof chapter.id === 'string' && chapter.id.startsWith('new-');
					
					return {
						id: isNewRecord ? null : chapter.id, // null cho chapter mới
						classChapterName: chapter.name,
						orderNumber: chapter.position, // Position hiện tại = orderNumber
						toBeDeleted: chapter.toBeDeleted || false, // Include toBeDeleted flag
					};
				})
				.filter((chapter) => {
					// Không gửi các record mới (id: null) mà đã bị xóa (toBeDeleted: true)
					// Vì chúng chưa tồn tại trên backend nên không cần xóa
					return !(chapter.id === null && chapter.toBeDeleted === true);
				});

			console.log('TeacherClassChapterDragEdit - Sending sync data:', {
				count: syncData.length,
				chapters: syncData.map(c => ({ 
					id: c.id, 
					classChapterName: c.classChapterName, 
					orderNumber: c.orderNumber,
					toBeDeleted: c.toBeDeleted 
				}))
			});

			// Gọi API sync với classId và dữ liệu chapters
			const response = await teacherManagementApi.syncClassChapters(classId, syncData);

			// Use backend message if available, otherwise fallback to translation
			const successMessage = response.message || t('chapterManagement.updatePositionsSuccess');
			spaceToast.success(successMessage);
			navigate(`${routePrefix}/chapters/${classId}`);
		} catch (error) {
			console.error('Error syncing chapters:', error);
			
			// Handle API errors with backend messages
			if (error.response) {
				const errorMessage = error.response.data?.error || error.response.data?.message || error.message;
				spaceToast.error(errorMessage);
			} else {
				spaceToast.error(error.message || t('chapterManagement.updatePositionsError'));
			}
		} finally {
			setSaving(false);
		}
	}, [chapters, classId, t, navigate, routePrefix]);

	// Early return if user doesn't have permission (defense in depth)
	if (user && userRole && userRole !== 'teacher' && userRole !== 'manager') {
		return null;
	}

	if (!classInfo || isInitialLoading) {
		return (
			<ThemedLayout>
				{/* Main Content Panel */}
				<div className={`main-content-panel ${theme}-main-panel`}>
					<TableSpinner />
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
							className="page-title"
							style={{ margin: 0, textAlign: 'center' }}
						>
							{t('chapterManagement.editPositions')}
						</Title>
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
										onDragEnd={handleDragEnd}>
										<SortableContext
											items={chapterIds}
											strategy={verticalListSortingStrategy}>
											{chapters
												.filter(chapter => !chapter.toBeDeleted)
												.map((chapter, index) => (
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
											
											{/* Always show Add button at the end if there are chapters */}
											{chapters.filter(chapter => !chapter.toBeDeleted).length > 0 && (
												<AddChapterButton
													theme={theme}
													index={chapters.filter(chapter => !chapter.toBeDeleted).length}
													onAddAtPosition={handleAddChapterAtPosition}
												/>
											)}
											
											{/* Show fixed Add button when no chapters exist */}
											{chapters.filter(chapter => !chapter.toBeDeleted).length === 0 && (
												<div className={`add-level-empty ${theme}-add-level-empty`} style={{ 
													marginTop: '40px', 
													textAlign: 'center',
													padding: '40px 20px'
												}}>
													<Button
														type='primary'
														icon={<PlusOutlined />}
														size='large'
														onClick={() => handleAddChapterAtPosition(0)}
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
														{t('chapterManagement.addChapter')}
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
