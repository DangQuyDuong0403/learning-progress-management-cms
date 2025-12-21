import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { spaceToast } from '../../../../../component/SpaceToastify';
import { SaveOutlined, EditOutlined, DragOutlined } from '@ant-design/icons';
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
	useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Text } = Typography;

// Sortable and editable blank component
const SortableBlankItem = ({ blank, index, onAnswerChange, theme }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(blank.answer || '');

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: blank.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const blankColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
	const blankBgColor = theme === 'sun' 
		? 'rgba(24, 144, 255, 0.08)' 
		: 'rgba(139, 92, 246, 0.15)';
	const blankBorderColor = theme === 'sun' 
		? 'rgba(24, 144, 255, 0.3)' 
		: 'rgba(139, 92, 246, 0.4)';

	const handleSave = () => {
		if (editValue.trim()) {
			onAnswerChange(blank.id, editValue);
		} else {
			setEditValue(blank.answer || '');
		}
		setIsEditing(false);
	};

	const handleCancel = () => {
		setEditValue(blank.answer || '');
		setIsEditing(false);
	};

	useEffect(() => {
		setEditValue(blank.answer || '');
	}, [blank.answer]);

	if (isEditing) {
		return (
			<div
				ref={setNodeRef}
				style={{
					...style,
					display: 'inline-flex',
					alignItems: 'center',
					gap: '6px',
					padding: '4px 12px',
					background: blankBgColor,
					border: `2px dashed ${blankBorderColor}`,
					borderRadius: '8px',
					margin: '0 4px',
					minWidth: '80px',
					maxWidth: '300px',
					minHeight: '40px',
				}}
			>
				<span
					style={{
						width: '18px',
						height: '18px',
						borderRadius: '50%',
						background: blankColor,
						color: 'white',
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: '11px',
						fontWeight: 700,
						flexShrink: 0,
					}}
				>
					{index + 1}
				</span>
				<Input
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					onPressEnter={handleSave}
					onBlur={handleSave}
					onKeyDown={(e) => {
						if (e.key === 'Escape') {
							handleCancel();
						}
					}}
					maxLength={50}
					autoFocus
					style={{
						flex: 1,
						border: 'none',
						background: 'transparent',
						padding: 0,
						minWidth: '80px',
					}}
				/>
			</div>
		);
	}

	return (
		<div
			ref={setNodeRef}
			style={{
				...style,
				display: 'inline-flex',
				alignItems: 'center',
				gap: '6px',
				padding: '4px 12px',
				background: blankBgColor,
				border: `2px dashed ${blankBorderColor}`,
				borderRadius: '8px',
				margin: '0 4px',
				minWidth: '80px',
				maxWidth: '200px',
				minHeight: '40px',
				position: 'relative',
			}}
			{...attributes}
		>
			<span
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					gap: '6px',
					flexShrink: 0,
					cursor: 'grab',
					padding: '2px 4px',
					borderRadius: '6px',
					transition: 'all 0.2s ease',
				}}
				{...listeners}
				onMouseEnter={(e) => {
					e.currentTarget.style.background = 'rgba(24, 144, 255, 0.1)';
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.background = 'transparent';
				}}
			>
				<DragOutlined 
					style={{ 
						fontSize: '14px',
						color: blankColor,
						opacity: 0.6,
					}} 
				/>
				<span
					style={{
						width: '20px',
						height: '20px',
						borderRadius: '50%',
						background: blankColor,
						color: 'white',
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: '11px',
						fontWeight: 700,
						boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
					}}
				>
					{index + 1}
				</span>
			</span>
			<span
				style={{
					flex: 1,
					color: '#333',
					fontWeight: 500,
					cursor: 'pointer',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
					minWidth: 0,
					paddingRight: '24px',
				}}
				onClick={(e) => {
					e.stopPropagation();
					e.preventDefault();
					setIsEditing(true);
				}}
				onMouseDown={(e) => {
					e.stopPropagation();
				}}
				title={blank.answer || ''}
			>
				{blank.answer || ''}
			</span>
			<EditOutlined 
				style={{ 
					position: 'absolute',
					right: '8px',
					opacity: 0.6,
					fontSize: '12px',
					cursor: 'pointer',
					zIndex: 10,
					flexShrink: 0,
				}} 
				onClick={(e) => {
					e.stopPropagation();
					e.preventDefault();
					setIsEditing(true);
				}}
				onMouseDown={(e) => {
					e.stopPropagation();
					e.preventDefault();
				}}
			/>
		</div>
	);
};


const EditReorderModal = ({ visible, onCancel, onSave, questionData = null, challengeStatus = 'draft', saving = false }) => {
	const { t } = useTranslation();
	const [blanks, setBlanks] = useState([]);
	const [questionText, setQuestionText] = useState('');

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Parse question data when modal opens
	useEffect(() => {
		if (visible && questionData) {
			// Parse questionText to extract blanks
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = questionData.questionText || '';
			const textContent = tempDiv.textContent || tempDiv.innerText || '';

			// Extract all position IDs from questionText
			const positionIdRegex = /\[\[pos_([a-z0-9]+)\]\]/g;
			const positionIds = [];
			let match;
			while ((match = positionIdRegex.exec(textContent)) !== null) {
				positionIds.push(match[1]);
			}

			// Get correct options (blanks) from content.data
			const correctOptions = [];

			if (questionData.content && Array.isArray(questionData.content.data)) {
				questionData.content.data.forEach((item) => {
					if (item.positionId && item.correct === true) {
						// Strip duplicate indices like "(1)", "(2)" from the value for editing
						let cleanValue = (item.value || '').replace(/\s*\(\d+\)\s*$/, '').trim();
						// This is a correct option (blank)
						correctOptions.push({
							id: `blank-${item.positionId}`,
							positionId: item.positionId,
							answer: cleanValue,
						});
					}
				});
			}

			// Sort blanks by position in questionText
			const sortedBlanks = positionIds
				.map((posId) => {
					const blank = correctOptions.find((b) => b.positionId === posId);
					return blank || {
						id: `blank-${posId}`,
						positionId: posId,
						answer: '',
					};
				})
				.filter(Boolean);

			setBlanks(sortedBlanks);
			setQuestionText(questionData.questionText || '');
		}
	}, [visible, questionData]);

	// Reset when modal closes
	useEffect(() => {
		if (!visible) {
			setBlanks([]);
			setQuestionText('');
		}
	}, [visible]);

	// Handle blank answer change
	const handleBlankAnswerChange = (blankId, value) => {
		setBlanks((prev) =>
			prev.map((blank) =>
				blank.id === blankId ? { ...blank, answer: value.slice(0, 50) } : blank
			)
		);
	};

	// Handle drag end for blank sorting
	const handleDragEnd = (event) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			setBlanks((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	// Handle save
	const handleSave = () => {
		// Validate
		if (blanks.length === 0) {
			spaceToast.error(t('dailyChallenge.pleaseFillInAllBlankAnswers', 'Please fill in all blank answers'));
			return;
		}

		const hasEmptyBlanks = blanks.some((blank) => !blank.answer || !blank.answer.trim());
		if (hasEmptyBlanks) {
			spaceToast.error(t('dailyChallenge.pleaseFillInAllBlankAnswers', 'Please fill in all blank answers'));
			return;
		}


		// Build content data
		const contentData = [];

		// Calculate duplicate indices for blanks (to add (1), (2) to duplicate values when saving)
		// Count occurrences of each answer value (case-insensitive, trimmed)
		const valueCounts = new Map();
		blanks.forEach((blank) => {
			const normalizedValue = (blank.answer || '').toLowerCase().trim();
			if (normalizedValue) {
				valueCounts.set(normalizedValue, (valueCounts.get(normalizedValue) || 0) + 1);
			}
		});

		// Track current index for each value
		const valueIndices = new Map();
		const blanksWithDuplicateIndices = blanks.map((blank) => {
			const normalizedValue = (blank.answer || '').toLowerCase().trim();
			const count = valueCounts.get(normalizedValue) || 0;
			
			if (count > 1 && normalizedValue) {
				// This value appears multiple times, add index
				const currentIndex = (valueIndices.get(normalizedValue) || 0) + 1;
				valueIndices.set(normalizedValue, currentIndex);
				return {
					...blank,
					duplicateIndex: currentIndex,
				};
			}
			return blank;
		});

		// Add correct options (blanks) - keep original order, add (1), (2) for duplicates
		blanksWithDuplicateIndices.forEach((blank, index) => {
			let valueToSave = blank.answer || '';
			if (blank.duplicateIndex) {
				valueToSave = `${valueToSave} (${blank.duplicateIndex})`;
			}
			contentData.push({
				id: `ans${index + 1}`,
				value: valueToSave,
				positionId: blank.positionId,
				correct: true,
			});
		});

		// Update questionText based on new blank order
		const newQuestionText = blanks.map((blank) => `[[pos_${blank.positionId}]]`).join(' ');

		// Build shuffled words array with proper structure (for preview/display)
		const shuffledWordsData = blanks.map((blank, index) => ({
			id: blank.id,
			text: blank.answer,
			originalIndex: index,
			currentIndex: index,
			color: '#1890ff', // Default color
			positionId: blank.positionId,
			isCorrect: true,
		}));

		// Call onSave with updated data
		onSave({
			...questionData,
			questionText: newQuestionText,
			shuffledWords: shuffledWordsData,
			content: {
				data: contentData,
			},
		});
	};


	const theme = 'sun'; // You can get this from context if needed

	return (
		<Modal
			title={
				<div style={{ fontSize: '20px', fontWeight: '600', color: '#1890ff', textAlign: 'center' }}>
					{t('dailyChallenge.editRearrange', 'Edit Rearrange')}
				</div>
			}
			open={visible}
			onCancel={onCancel}
			width={1200}
			centered
			footer={[
				<Button key="cancel" onClick={onCancel}>
					{t('common.cancel', 'Cancel')}
				</Button>,
				<Button
					key="save"
					type="primary"
					icon={<SaveOutlined />}
					onClick={handleSave}
					loading={saving}
					style={{
						background: 'linear-gradient(135deg, #66AEFF, #3C99FF)',
						border: 'none',
					}}
				>
					{t('common.save', 'Save')}
				</Button>,
			]}
		>
			<div style={{ padding: '24px 0' }}>
				{/* Correct Order (Editable & Sortable) */}
				<div
					style={{
						padding: '16px',
						borderRadius: '12px',
						border: '2px solid rgba(24, 144, 255, 0.2)',
						background: 'rgba(240, 247, 255, 0.5)',
					}}
				>
					<Text strong style={{ fontSize: '16px', marginBottom: '12px', display: 'block' }}>
						{t('dailyChallenge.correctOrder', 'Correct Order:')}
					</Text>

					{/* Blanks with Drag and Drop */}
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext items={blanks.map((b) => b.id)}>
							<div
								style={{
									fontSize: '15px',
									lineHeight: '1.8',
									color: '#333',
									display: 'flex',
									flexWrap: 'wrap',
									gap: '8px',
									alignItems: 'center',
								}}
							>
								{blanks.map((blank, index) => (
									<SortableBlankItem
										key={blank.id}
										blank={blank}
										index={index}
										onAnswerChange={handleBlankAnswerChange}
										theme={theme}
									/>
								))}
							</div>
						</SortableContext>
					</DndContext>
				</div>
			</div>
		</Modal>
	);
};

export default EditReorderModal;

