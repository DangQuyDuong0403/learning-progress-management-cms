import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Button, Typography, Modal, Input } from 'antd';
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
import ChapterForm from './ChapterForm';
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

// Optimized: Memoized Sortable Chapter Item Component
const SortableChapterItem = memo(
	({ chapter, index, onDeleteChapter, onUpdateChapterName, onInputChange, theme, t }) => {
		const [editValue, setEditValue] = useState(chapter.name || '');

		// Update editValue when chapter.name changes - optimized
		useEffect(() => {
			setEditValue(chapter.name || '');
		}, [chapter.name]);

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
			id: chapter.id,
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
			// Chỉ update state khi blur, không validate ở đây
			if (editValue.trim()) {
				onUpdateChapterName(index, editValue.trim());
			} else {
				// Reset về giá trị ban đầu nếu trống
				setEditValue(chapter.name || '');
				// Update state với giá trị rỗng để validation khi save có thể bắt được
				onUpdateChapterName(index, '');
			}
		}, [index, editValue, onUpdateChapterName, chapter.name]);

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
							onChange={(e) => {
								const newValue = e.target.value;
								setEditValue(newValue);
								// Sync giá trị vào state ngay lập tức để validation có thể kiểm tra
								if (onInputChange) {
									onInputChange(index, newValue);
								}
							}}
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
							width: '40px',
							height: '40px',
							fontSize: '20px',
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

const ChapterDragEdit = () => {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const navigate = useNavigate();
	const { syllabusId } = useParams();
	const { enterSyllabusMenu, exitSyllabusMenu } = useSyllabusMenu();
	
	// Set page title
	usePageTitle('Edit Chapter Positions');
	
	const [chapters, setChapters] = useState([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingChapter, setEditingChapter] = useState(null);
	const [insertAtIndex, setInsertAtIndex] = useState(null);
	const [syllabusInfo, setSyllabusInfo] = useState(null);
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

	const fetchAllChapters = useCallback(async () => {
		if (!syllabusId) return;

		setLoading(true);
		try {
			const params = {
				page: 0,
				size: 100,
			};

			const response = await syllabusManagementApi.getChaptersBySyllabusId(
				syllabusId,
				params
			);

			const mappedChapters = response.data.map((chapter, index) => ({
				id: chapter.id,
				name: chapter.chapterName,
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
				fetchAllChapters(),
				fetchSyllabusInfo()
			]);
			setIsInitialLoading(false);
		};
		fetchData();
	}, [fetchAllChapters, fetchSyllabusInfo]);

	// Enter syllabus menu mode when syllabusInfo is available
	useEffect(() => {
		if (syllabusInfo) {
			enterSyllabusMenu({
				id: syllabusInfo.id,
				name: syllabusInfo.name,
				description: syllabusInfo.description,
				backUrl: ROUTER_PAGE.MANAGER_SYLLABUS_CHAPTERS.replace(':syllabusId', String(syllabusId)),
			});
		}
		
		return () => {
			exitSyllabusMenu();
		};
	}, [syllabusInfo, enterSyllabusMenu, exitSyllabusMenu, syllabusId]);

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

	const handleInputChange = useCallback(
		(index, newValue) => {
			// Sync giá trị vào state ngay khi user type để validation có thể kiểm tra
			setChapters((prev) => {
				const visibleChapters = prev.filter(chapter => !chapter.toBeDeleted);
				const chapterToUpdate = visibleChapters[index];
				
				if (!chapterToUpdate) {
					return prev;
				}

				return prev.map((chapter) => {
					if (chapter.id === chapterToUpdate.id) {
						return {
							...chapter,
							name: newValue, // Update ngay lập tức
						};
					}
					return chapter;
				});
			});
		},
		[]
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
		// Trigger blur cho tất cả inputs để sync giá trị vào state trước khi validate
		const allInputs = document.querySelectorAll('input[type="text"]');
		allInputs.forEach(input => {
			if (input.closest('.level-drag-item')) {
				input.blur();
			}
		});
		
		// Đợi một chút để state được cập nhật sau khi blur
		await new Promise(resolve => setTimeout(resolve, 100));
		
		const visibleChapters = chapters.filter(chapter => !chapter.toBeDeleted);
		
		// Kiểm tra chapter name trống - kiểm tra kỹ hơn
		const invalidChapters = visibleChapters.filter((chapter) => {
			const name = chapter.name;
			return !name || (typeof name === 'string' && !name.trim());
		});
		
		if (invalidChapters.length > 0) {
			// Hiển thị message với số thứ tự của các chapter bị lỗi
			const invalidPositions = invalidChapters.map(ch => `#${ch.position}`).join(', ');
			spaceToast.error(
				t('chapterManagement.chapterNameRequired') + 
				` (${invalidPositions})`
			);
			return; // Ngăn không cho save
		}

		// Kiểm tra trùng tên chapter (không phân biệt hoa thường và khoảng trắng)
		const duplicateMap = new Map();
		visibleChapters.forEach((chapter) => {
			if (!chapter.name) return;
			const normalized = chapter.name.trim().toLowerCase();
			if (!normalized) return;

			if (!duplicateMap.has(normalized)) {
				duplicateMap.set(normalized, []);
			}
			duplicateMap.get(normalized).push(chapter);
		});

		const duplicateInfo = Array.from(duplicateMap.values())
			.filter((chaptersWithSameName) => chaptersWithSameName.length > 1)
			.map((chaptersWithSameName) => ({
				name: chaptersWithSameName[0].name?.trim() || `${t('chapterManagement.chapterLabel', 'Chapter')} #${chaptersWithSameName[0].position}`,
				positions: chaptersWithSameName.map((chapter) => `#${chapter.position}`),
			}));

		if (duplicateInfo.length > 0) {
			const duplicateMessages = duplicateInfo
				.map(
					(info) =>
						`${info.name}`
				)
				.join('; ');
			spaceToast.error(
				t('chapterManagement.duplicateChapterName', 'Chapter names must be unique:') +
				` ${duplicateMessages}`
			);
			return; // Ngăn không cho save
		}

		// Kiểm tra độ dài tên chapter
		const longNameChapters = visibleChapters.filter((chapter) => chapter.name && chapter.name.length > 100);
		if (longNameChapters.length > 0) {
			// Hiển thị message với số thứ tự của các chapter có tên quá dài
			const longNamePositions = longNameChapters.map(ch => `#${ch.position}`).join(', ');
			spaceToast.error(
				(t('chapterManagement.chapterNameTooLong') || 'Chapter name is too long!') + 
				` (${longNamePositions})`
			);
			return; // Ngăn không cho save
		}

		setSaving(true);
		try {
			// Chuẩn bị dữ liệu theo format của API /chapter/sync
			const syncData = chapters
				.map((chapter) => {
					const isNewRecord = typeof chapter.id === 'string' && chapter.id.startsWith('new-');
					
					return {
						id: isNewRecord ? null : chapter.id, // null cho chapter mới
						chapterName: chapter.name,
						orderNumber: chapter.position, // Position hiện tại = orderNumber
						toBeDeleted: chapter.toBeDeleted || false, // Include toBeDeleted flag
					};
				})
				.filter((chapter) => {
					// Không gửi các record mới (id: null) mà đã bị xóa (toBeDeleted: true)
					// Vì chúng chưa tồn tại trên backend nên không cần xóa
					return !(chapter.id === null && chapter.toBeDeleted === true);
				});

			// Gọi API sync với syllabusId và dữ liệu chapters
			const response = await syllabusManagementApi.syncChapters(syllabusId, syncData);

			// Use backend message if available, otherwise fallback to translation
			const successMessage = response.message || t('chapterManagement.updatePositionsSuccess');
			spaceToast.success(successMessage);
			navigate(`/manager/syllabuses/${syllabusId}/chapters`);
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
	}, [chapters, syllabusId, t, navigate]);


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
														onInputChange={handleInputChange}
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
					syllabus={syllabusInfo}
					onClose={handleModalClose}
				/>
			</Modal>
		</ThemedLayout>
	);
};

export default ChapterDragEdit;

