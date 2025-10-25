import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Modal, Button, message, Select, Tooltip } from 'antd';
import {
	PlusOutlined,
	DeleteOutlined,
	CheckOutlined,
	ThunderboltOutlined,
	SaveOutlined,
} from '@ant-design/icons';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import './MultipleChoiceModal.css';

const MultipleSelectModal = ({
	visible,
	onCancel,
	onSave,
	questionData = null,
}) => {
	
	// Custom upload adapter for CKEditor to convert images to base64
	function CustomUploadAdapterPlugin(editor) {
		editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
			return {
				upload: () => {
					return loader.file.then(file => new Promise((resolve, reject) => {
						const reader = new FileReader();
						reader.onload = () => {
							resolve({ default: reader.result });
						};
						reader.onerror = error => reject(error);
						reader.readAsDataURL(file);
					}));
				},
				abort: () => {}
			};
		};
	}
	
	// Option colors for sun theme
	const getOptionColors = React.useCallback(() => {
		return [
			'#1890ff', // Blue
			'#52c41a', // Green
			'#faad14', // Orange
			'#eb2f96', // Pink
			'#13c2c2', // Cyan
			'#722ed1', // Purple
			'#fa8c16', // Dark Orange
			'#2f54eb', // Dark Blue
		];
	}, []);

	const [options, setOptions] = useState(
		questionData?.options || [
			{ id: 1, text: '', isCorrect: false, color: getOptionColors()[0] },
			{ id: 2, text: '', isCorrect: false, color: getOptionColors()[1] },
			{ id: 3, text: '', isCorrect: false, color: getOptionColors()[2] },
			{ id: 4, text: '', isCorrect: false, color: getOptionColors()[3] },
		]
	);
	const [points, setPoints] = useState(1);
	const [hoveredOption, setHoveredOption] = useState(null);
	const [editorData, setEditorData] = useState('');
	const editorRef = useRef(null);

	
	// Sun theme colors (fixed)
	const primaryColor = '#1890ff';

	// Memoize CKEditor config to prevent re-creation on each render
	const questionEditorConfig = useMemo(() => ({
		placeholder: 'Enter your question here...',
		extraPlugins: [CustomUploadAdapterPlugin],
		toolbar: {
			items: [
				'heading',
				'|',
				'bold',
				'italic',
				'underline',
				'|',
				'link',
				'imageUpload',
				'|',
				'bulletedList',
				'numberedList',
				'|',
				'blockQuote',
				'insertTable',
				'|',
				'undo',
				'redo'
			],
			shouldNotGroupWhenFull: false
		},
		heading: {
			options: [
				{ model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
				{ model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
				{ model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
				{ model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
			]
		},
		table: {
			contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
		},
		image: {
			toolbar: [
				'imageTextAlternative',
				'|',
				'imageStyle:alignLeft',
				'imageStyle:full',
				'imageStyle:alignRight'
			],
			styles: [
				'full',
				'alignLeft',
				'alignRight'
			]
		}
	}), []);

	// Memoize option editor config
	const optionEditorConfig = useMemo(() => ({
		placeholder: 'Type your answer here...',
		extraPlugins: [CustomUploadAdapterPlugin],
		toolbar: {
			items: [
				'bold',
				'italic',
				'underline',
				'|',
				'link',
				'imageUpload',
				'|',
				'bulletedList',
				'numberedList',
				'|',
				'undo',
				'redo'
			],
			shouldNotGroupWhenFull: false
		},
		image: {
			toolbar: [
				'imageTextAlternative',
				'|',
				'imageStyle:alignLeft',
				'imageStyle:full',
				'imageStyle:alignRight'
			],
			styles: [
				'full',
				'alignLeft',
				'alignRight'
			]
		}
	}), []);

	// Load question data when editing
	useEffect(() => {
		if (visible) {
			// Use setTimeout to ensure form is mounted
			setTimeout(() => {
				const colors = getOptionColors();
				if (questionData) {
					// Edit mode - load existing data
					setEditorData(questionData.question || '');
					setOptions(questionData.options || [
						{ id: 1, text: '', isCorrect: false, color: colors[0] },
						{ id: 2, text: '', isCorrect: false, color: colors[1] },
						{ id: 3, text: '', isCorrect: false, color: colors[2] },
						{ id: 4, text: '', isCorrect: false, color: colors[3] },
					]);
					setPoints(questionData.points || 1);
				} else {
					// Add mode - reset to defaults
					setEditorData('');
					setOptions([
						{ id: 1, text: '', isCorrect: false, color: colors[0] },
						{ id: 2, text: '', isCorrect: false, color: colors[1] },
						{ id: 3, text: '', isCorrect: false, color: colors[2] },
						{ id: 4, text: '', isCorrect: false, color: colors[3] },
					]);
					setPoints(1);
				}
			}, 0);
		}
	}, [questionData, visible, getOptionColors]);

	const handleAddOption = useCallback(() => {
		setOptions(prevOptions => {
			const newId = Math.max(...prevOptions.map((opt) => opt.id)) + 1;
			const colors = getOptionColors();
			const newColor = colors[prevOptions.length % colors.length];
			return [
				...prevOptions,
				{ id: newId, text: '', isCorrect: false, color: newColor },
			];
		});
	}, [getOptionColors]);

	const handleRemoveOption = useCallback((optionId) => {
		setOptions(prevOptions => {
			if (prevOptions.length > 2) {
				return prevOptions.filter((opt) => opt.id !== optionId);
			} else {
				message.warning('Question must have at least 2 options');
				return prevOptions;
			}
		});
	}, []);

	const handleOptionChange = useCallback((optionId, field, value) => {
		setOptions(prevOptions => {
			// Check if value actually changed to avoid unnecessary updates
			const currentOption = prevOptions.find(opt => opt.id === optionId);
			if (currentOption && currentOption[field] === value) {
				return prevOptions;
			}
			
			return prevOptions.map((opt) =>
				opt.id === optionId ? { ...opt, [field]: value } : opt
			);
		});
	}, []);

	const handleMouseEnter = useCallback((optionId) => {
		setHoveredOption(optionId);
	}, []);

	const handleMouseLeave = useCallback(() => {
		setHoveredOption(null);
	}, []);

	// Debounced editor change handler for main question
	const editorChangeTimeoutRef = useRef(null);
	const handleEditorChange = useCallback((event, editor) => {
		if (editorChangeTimeoutRef.current) {
			clearTimeout(editorChangeTimeoutRef.current);
		}
		editorChangeTimeoutRef.current = setTimeout(() => {
			const data = editor.getData();
			setEditorData(prevData => {
				// Only update if data actually changed
				if (prevData !== data) {
					return data;
				}
				return prevData;
			});
		}, 150);
	}, []);

	// Debounced option change handler
	const optionChangeTimeoutRef = useRef({});
	const handleOptionEditorChange = useCallback((optionId, event, editor) => {
		if (optionChangeTimeoutRef.current[optionId]) {
			clearTimeout(optionChangeTimeoutRef.current[optionId]);
		}
		optionChangeTimeoutRef.current[optionId] = setTimeout(() => {
			const data = editor.getData();
			handleOptionChange(optionId, 'text', data);
		}, 150);
	}, [handleOptionChange]);

	// Cleanup timeouts on unmount
	useEffect(() => {
		const editorTimeout = editorChangeTimeoutRef.current;
		const optionTimeouts = optionChangeTimeoutRef.current;
		return () => {
			if (editorTimeout) {
				clearTimeout(editorTimeout);
			}
			Object.values(optionTimeouts).forEach(timeout => {
				if (timeout) clearTimeout(timeout);
			});
		};
	}, []);

	const handleSave = () => {
		// Validate editor data
		if (!editorData || !editorData.trim()) {
			message.error('Please enter the question text');
			return;
		}

		const correctAnswers = options.filter((opt) => opt.isCorrect);
		if (correctAnswers.length === 0) {
			message.error('Please select at least one correct answer');
			return;
		}

		if (correctAnswers.length === 1) {
			message.warning('Multiple select questions should have more than one correct answer. Consider using Multiple Choice instead.');
		}

		const hasEmptyOptions = options.some((opt) => !opt.text.trim());
		if (hasEmptyOptions) {
			message.error('Please fill in all option texts');
			return;
		}

		const newQuestionData = {
			id: questionData?.id || Date.now(),
			type: 'MULTIPLE_SELECT',
			title: 'Multiple select',
			question: editorData,
			options: options.map((opt, index) => ({
				...opt,
				key: String.fromCharCode(65 + index), // A, B, C, D, ...
			})),
			correctAnswer: correctAnswers
				.map((opt) => opt.text)
				.join(', '),
		};

		onSave(newQuestionData);
		const colors = getOptionColors();
		setEditorData('');
		setOptions([
			{ id: 1, text: '', isCorrect: false, color: colors[0] },
			{ id: 2, text: '', isCorrect: false, color: colors[1] },
			{ id: 3, text: '', isCorrect: false, color: colors[2] },
			{ id: 4, text: '', isCorrect: false, color: colors[3] },
		]);
	};

	const handleCancel = () => {
		const colors = getOptionColors();
		setEditorData('');
		setOptions([
			{ id: 1, text: '', isCorrect: false, color: colors[0] },
			{ id: 2, text: '', isCorrect: false, color: colors[1] },
			{ id: 3, text: '', isCorrect: false, color: colors[2] },
			{ id: 4, text: '', isCorrect: false, color: colors[3] },
		]);
		onCancel();
	};

	const pointsMenu = (
		<Select
			value={points}
			onChange={setPoints}
			style={{ width: 90 }}
			options={[
				{ value: 1, label: '1 point' },
				{ value: 2, label: '2 points' },
				{ value: 3, label: '3 points' },
				{ value: 5, label: '5 points' },
			]}
		/>
	);

	return (
		<Modal
			title={
				<div style={{ 
					display: 'flex', 
					alignItems: 'center', 
					justifyContent: 'center',
					gap: '12px'
				}}>
					<ThunderboltOutlined style={{ 
						fontSize: '30px', 
						color: primaryColor,
						animation: 'pulse 2s infinite'
					}} />
					<span style={{ fontSize: '24px', fontWeight: 600 }}>
						Create Multiple Select Question
					</span>
				</div>
			}
			open={visible}
			onCancel={handleCancel}
			width={1600}
			footer={null}
			style={{ top: 10 }}
			bodyStyle={{ 
				maxHeight: 'calc(100vh - 120px)',
				overflow: 'hidden', 
				position: 'relative',
				padding: 0,
				background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%)'
			}}
			key={questionData?.id || 'new'}
			destroyOnClose>
			{/* Modern Top Toolbar */}
			<div style={{
				position: 'sticky',
				top: 0,
				left: 0,
				right: 0,
				zIndex: 1000,
				background: 'rgba(255, 255, 255, 0.95)',
				backdropFilter: 'blur(20px)',
				borderBottom: '2px solid rgba(24, 144, 255, 0.1)',
				padding: '16px 24px',
				boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
			}}>
				<div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
					{/* Points & Save Button */}
					<div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<CheckOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
						{pointsMenu}
					</div>

					<Button
						type='primary'
						onClick={handleSave}
						size="large"
						className="save-question-btn"
						style={{
							height: '44px',
							borderRadius: '12px',
							fontWeight: 600,
							fontSize: '16px',
							padding: '0 32px',
							border: 'none',
							transition: 'all 0.3s ease',
							background: 'linear-gradient(135deg, #66AEFF, #3C99FF)',
							color: '#000000',
							boxShadow: '0 4px 16px rgba(60, 153, 255, 0.4)',
						}}
					>
						<SaveOutlined /> Save Question
					</Button>
					</div>
				</div>
			</div>


			{/* Main Split Layout */}
			<div style={{ 
				display: 'flex', 
				height: 'calc(100vh - 210px)', 
				padding: '24px',
				gap: '24px'
			}}>
				{/* Left Panel - Question Editor */}
				<div style={{ 
					flex: '0 0 38%',
					display: 'flex',
					flexDirection: 'column',
					gap: '16px',
					minHeight: 0
				}}>
					{/* Question Card */}
					<div style={{
						flex: 1,
						background: 'rgba(255, 255, 255, 0.95)',
						borderRadius: '20px',
						padding: '24px',
						boxShadow: '0 8px 32px rgba(24, 144, 255, 0.15)',
						border: '2px solid rgba(24, 144, 255, 0.1)',
						backdropFilter: 'blur(20px)',
						display: 'flex',
						flexDirection: 'column',
						position: 'relative',
						overflow: 'hidden',
						minHeight: 0
					}}>
						{/* Decorative background elements */}
						<div style={{
							position: 'absolute',
							top: -50,
							right: -50,
							width: '200px',
							height: '200px',
							background: primaryColor,
							opacity: 0.05,
							borderRadius: '50%',
							filter: 'blur(40px)'
						}} />

						{/* Question Input - CKEditor */}
					<div style={{ 
							flex: 1, 
						display: 'flex',
							flexDirection: 'column',
							position: 'relative',
							zIndex: 1,
							minHeight: 0,
							overflow: 'hidden'
						}}>
							<div style={{
								flex: 1,
								borderRadius: '12px',
								border: '2px solid rgba(24, 144, 255, 0.2)',
								overflow: 'hidden',
								background: 'rgba(240, 247, 255, 0.5)',
								position: 'relative',
								display: 'flex',
								flexDirection: 'column'
							}}>
								<CKEditor
									key="main-question-editor"
									editor={ClassicEditor}
									data={editorData}
									config={questionEditorConfig}
									onChange={handleEditorChange}
									onReady={(editor) => {
										editorRef.current = editor;
									}}
								/>
					</div>
				</div>
					</div>
			</div>


				{/* Right Panel - Answer Options Grid */}
				<div style={{ 
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					gap: '16px',
					position: 'relative'
				}}>
					{/* Options Grid Header */}
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: '0 4px'
					}}>
						<span style={{ 
							fontSize: '16px', 
							fontWeight: 600,
							color: '#1890ff'
						}}>
							Answer Options ({options.length})
						</span>
						<Button
							icon={<PlusOutlined />}
							onClick={handleAddOption}
							style={{
								height: '40px',
								borderRadius: '8px',
								fontWeight: 500,
								fontSize: '16px',
								padding: '0 24px',
								border: 'none',
								transition: 'all 0.3s ease',
								background: 'linear-gradient(135deg, rgba(102, 174, 255, 0.6), rgba(60, 153, 255, 0.6))',
								color: '#000000',
								boxShadow: '0 2px 8px rgba(60, 153, 255, 0.2)',
								opacity: 0.9
							}}
						>
							Add Option
						</Button>
					</div>

					{/* Options Grid Container - 2x2 Layout */}
					<div style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(2, 1fr)',
						gap: '16px',
						flex: 1,
						overflowY: 'auto',
						padding: '4px'
				}}>
				{options.map((option, index) => (
					<div
						key={option.id}
						onMouseEnter={() => handleMouseEnter(option.id)}
						onMouseLeave={handleMouseLeave}
						style={{
									background: `linear-gradient(135deg, ${option.color}dd 0%, ${option.color} 100%)`,
									borderRadius: '16px',
									padding: '24px',
									minHeight: '320px',
							position: 'relative',
							display: 'flex',
							flexDirection: 'column',
									boxShadow: hoveredOption === option.id
										? `0 12px 32px ${option.color}50`
										: '0 4px 16px rgba(0,0,0,0.1)',
									border: option.isCorrect
										? '3px solid #52c41a'
										: '2px solid rgba(255,255,255,0.3)',
									transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
									transform: hoveredOption === option.id ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
							cursor: 'pointer',
									overflow: 'visible'
								}}>
								{/* Option Label */}
								<div style={{
									position: 'absolute',
									top: '16px',
									left: '16px',
									width: '40px',
									height: '40px',
									borderRadius: '50%',
									background: 'rgba(255,255,255,0.9)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontWeight: 700,
									fontSize: '18px',
									color: option.color,
									boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
								}}>
									{String.fromCharCode(65 + index)}
								</div>

								{/* Action Buttons */}
								<div style={{
									position: 'absolute',
									top: '16px',
									right: '16px',
									display: 'flex',
									gap: '8px',
									alignItems: 'center'
								}}>
									{/* Correct Answer Badge */}
									<Tooltip title={option.isCorrect ? "Correct Answer" : "Mark as Correct"}>
										<div
											onClick={(e) => {
												e.stopPropagation();
												handleOptionChange(option.id, 'isCorrect', !option.isCorrect);
											}}
											style={{
												background: option.isCorrect ? '#52c41a' : 'rgba(255,255,255,0.3)',
												color: 'white',
												padding: '6px 12px',
												borderRadius: '20px',
												fontSize: '13px',
												fontWeight: 600,
												cursor: 'pointer',
												transition: 'all 0.3s ease',
												display: 'flex',
												alignItems: 'center',
												gap: '4px',
												boxShadow: option.isCorrect ? '0 2px 8px rgba(82, 196, 26, 0.5)' : 'none',
												opacity: hoveredOption === option.id || option.isCorrect ? 1 : 0
											}}
										>
											<CheckOutlined />
											{option.isCorrect ? 'Correct' : 'Mark'}
										</div>
									</Tooltip>
									
									<div style={{
										display: 'flex',
										gap: '8px',
										opacity: hoveredOption === option.id ? 1 : 0,
										transition: 'opacity 0.2s ease'
									}}>
										<Tooltip title="Delete Option">
							<Button
												size="small"
												danger
								icon={<DeleteOutlined />}
								onClick={(e) => {
									e.stopPropagation();
									handleRemoveOption(option.id);
								}}
								style={{
													background: 'rgba(255, 77, 79, 0.9)',
									color: 'white',
									border: 'none',
													borderRadius: '8px',
													width: '32px',
													height: '32px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
													fontSize: '16px'
												}}
											/>
										</Tooltip>
									</div>
						</div>

						{/* Input Field - CKEditor */}
								<div style={{
								flex: 1,
								display: 'flex',
									flexDirection: 'column',
									justifyContent: 'center',
									marginTop: '60px',
									marginBottom: '55px',
									position: 'relative',
									zIndex: 1
								}}>
									<div 
										className={`option-editor option-editor-${option.id}`}
								style={{
											borderRadius: '12px',
											overflow: 'hidden',
											background: 'rgba(255, 255, 255, 0.15)',
											border: '2px solid rgba(255,255,255,0.4)',
									backdropFilter: 'blur(10px)',
										}}
									>
										<CKEditor
											key={`option-editor-${option.id}`}
											editor={ClassicEditor}
											data={option.text}
											config={optionEditorConfig}
											onChange={(event, editor) => handleOptionEditorChange(option.id, event, editor)}
										/>
									</div>
						</div>
					</div>
				))}

					</div>
				</div>
			</div>
		</Modal>
	);
};

export default MultipleSelectModal;
