import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Modal, Button, message, Select } from 'antd';
import {
	CheckOutlined,
	ThunderboltOutlined,
	SaveOutlined,
} from '@ant-design/icons';
import './MultipleChoiceModal.css';

const FillBlankModal = ({ visible, onCancel, onSave, questionData = null }) => {
	const [editorContent, setEditorContent] = useState([]);
	const [blanks, setBlanks] = useState([]);
	const [points, setPoints] = useState(1);
	const editorRef = useRef(null);

	// Colors for blanks
	const blankColors = useMemo(() => [
		'#0ea5e9', '#06b6d4', '#3b82f6', '#8b5cf6',
		'#ec4899', '#f59e0b', '#10b981', '#6366f1',
	], []);

	// Parse backend format to editor format
	const parseQuestionText = useCallback((questionText, contentData) => {
		const parsed = [];
		const blanksData = [];
		
		// Remove <br> tags and split by blank pattern
		const cleanText = questionText.replace(/<br\s*\/?>/gi, '\n');
		const regex = /\[\[pos_([a-z0-9]+)\]\]/g;
		let lastIndex = 0;
		let match;

		while ((match = regex.exec(cleanText)) !== null) {
			// Add text before blank
			if (match.index > lastIndex) {
				const textContent = cleanText.substring(lastIndex, match.index);
				if (textContent) {
					parsed.push({ type: 'text', content: textContent, id: `text-${Date.now()}-${lastIndex}` });
				}
			}

			// Add blank
			const positionId = match[1];
			const blankData = contentData.find(item => item.positionId === positionId);
			const blankId = `blank-${Date.now()}-${positionId}`;
			
			parsed.push({
				type: 'blank',
				id: blankId,
				positionId: positionId,
				answer: blankData?.value || ''
			});

			blanksData.push({
				id: blankId,
				positionId: positionId,
				answer: blankData?.value || '',
				color: blankColors[blanksData.length % blankColors.length]
			});

			lastIndex = regex.lastIndex;
		}

		// Add remaining text
		if (lastIndex < cleanText.length) {
			const remainingText = cleanText.substring(lastIndex);
			if (remainingText) {
				parsed.push({ type: 'text', content: remainingText, id: `text-${Date.now()}-${lastIndex}` });
			}
		}

		if (parsed.length === 0) {
			parsed.push({ type: 'text', content: '', id: Date.now() });
		}

		setEditorContent(parsed);
		setBlanks(blanksData);
	}, [blankColors]);

	// Initialize editor content from questionData
	useEffect(() => {
		if (visible) {
			if (questionData?.questionText && questionData?.content?.data) {
				// Parse existing question
				parseQuestionText(questionData.questionText, questionData.content.data);
				} else {
				// New question
				setEditorContent([{ type: 'text', content: '', id: Date.now() }]);
				setBlanks([]);
			}
			setPoints(questionData?.points || 1);
		}
	}, [questionData, visible, parseQuestionText]);

	// Generate position ID
	const generatePositionId = () => {
		return Math.random().toString(36).substring(2, 8);
	};

	// Handle text input in editor
	const handleEditorInput = (e) => {
		const element = e.currentTarget;

		// Check if any blanks were removed from DOM (e.g., by Backspace)
		const currentBlankIds = new Set();
		const blankElements = element.querySelectorAll('[data-blank-id]');
		blankElements.forEach(el => {
			const blankId = el.getAttribute('data-blank-id');
			if (blankId) currentBlankIds.add(blankId);
		});

		// Remove blanks from state that no longer exist in DOM
		setBlanks(prev => {
			const filtered = prev.filter(blank => currentBlankIds.has(blank.id));
			if (filtered.length !== prev.length) {
				// Some blanks were removed
				return filtered;
			}
			return prev;
		});

		// Look for __ or [] pattern in text nodes only
		findAndReplacePattern(element);
	};

	// Find and replace pattern in text nodes without affecting existing blanks
	const findAndReplacePattern = (element) => {
		// Walk through all child nodes
		const walker = document.createTreeWalker(
			element,
			NodeFilter.SHOW_TEXT,
			null,
			false
		);

		let textNode;

		while ((textNode = walker.nextNode())) {
			const text = textNode.textContent;
			const underscoreIndex = text.indexOf('__');
			const bracketIndex = text.indexOf('[]');

			let patternIndex = -1;
			let patternLength = 2;

			if (underscoreIndex !== -1 && bracketIndex !== -1) {
				patternIndex = Math.min(underscoreIndex, bracketIndex);
			} else if (underscoreIndex !== -1) {
				patternIndex = underscoreIndex;
			} else if (bracketIndex !== -1) {
				patternIndex = bracketIndex;
			}

			if (patternIndex !== -1) {
				// Found a pattern in this text node

				// Create blank
				const positionId = generatePositionId();
				const blankId = `blank-${Date.now()}-${positionId}`;
				const color = blankColors[blanks.length % blankColors.length];

				const newBlank = {
					id: blankId,
					positionId: positionId,
					answer: '',
					color: color
				};

				// Split the text node
				let beforePattern = text.substring(0, patternIndex);
				const afterPattern = text.substring(patternIndex + patternLength);

				// Add space before blank if text before doesn't end with space
				if (beforePattern && !beforePattern.endsWith(' ')) {
					beforePattern += ' ';
				}

				// Create blank element
				const blankElement = createBlankElement(newBlank, blanks.length);

				// Get parent node
				const parent = textNode.parentNode;

				// Create document fragment to hold new nodes
				const fragment = document.createDocumentFragment();

				// Add text before pattern (if any)
				if (beforePattern) {
					fragment.appendChild(document.createTextNode(beforePattern));
				}

				// Add blank chip
				fragment.appendChild(blankElement);

				// Add space + text after pattern (if any, otherwise just add space)
				if (afterPattern) {
					// Add space before afterPattern if it doesn't start with space
					const textAfter = afterPattern.startsWith(' ') ? afterPattern : ' ' + afterPattern;
					fragment.appendChild(document.createTextNode(textAfter));
				} else {
					fragment.appendChild(document.createTextNode(' '));
				}

				// Replace the text node with the fragment
				parent.replaceChild(fragment, textNode);

				// Update blanks state
				setBlanks(prev => [...prev, newBlank]);

				// Expand the newly created blank and focus on input
				setTimeout(() => {
					try {
						// Find the newly inserted blank in DOM
						const insertedBlank = element.querySelector(`[data-blank-id="${blankId}"]`);
						if (insertedBlank && insertedBlank.expandBlank) {
							// Call the expand function to show input field
							insertedBlank.expandBlank();
							return;
						}
						// Fallback: focus on editor
						element.focus();
					} catch (error) {
						console.error('Error expanding blank:', error);
						element.focus();
					}
				}, 10);

				// Only process one pattern at a time
				break;
			}
		}
	};

	// Handle blank answer change
	const handleBlankAnswerChange = useCallback((blankId, value) => {
		setBlanks(prev => prev.map(blank => 
				blank.id === blankId ? { ...blank, answer: value } : blank
		));
	}, []);

	// Handle delete blank from DOM
	const handleDeleteBlankElement = useCallback((blankId) => {
		if (!editorRef.current) return;

		// Find and remove the blank element from DOM
		const blankElement = editorRef.current.querySelector(`[data-blank-id="${blankId}"]`);
		if (blankElement) {
			blankElement.remove();
		}

		// Update state
		setBlanks(prev => prev.filter(blank => blank.id !== blankId));
		message.success('Blank removed');
		
		// Refocus editor
		editorRef.current.focus();
	}, []);

	// Create blank element
	const createBlankElement = useCallback((blank, index) => {
		const span = document.createElement('span');
		span.setAttribute('contenteditable', 'false');
		span.setAttribute('data-blank-id', blank.id);
		span.style.cssText = `
			display: inline-flex;
			align-items: center;
			margin: 0 4px;
			position: relative;
			vertical-align: middle;
		`;

		const chip = document.createElement('span');
		chip.style.cssText = `
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 6px 12px;
			background: linear-gradient(135deg, ${blank.color}20, ${blank.color}40);
			border: 2px solid ${blank.color};
			border-radius: 8px;
			font-size: 14px;
			font-weight: 500;
			color: ${blank.color};
			transition: all 0.2s ease;
			cursor: pointer;
		`;

		// Number badge
		const badge = document.createElement('span');
		badge.style.cssText = `
			width: 20px;
			height: 20px;
			border-radius: 50%;
			background: ${blank.color};
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 11px;
			font-weight: 700;
		`;
		badge.textContent = index + 1;

		// Compact mode: Display answer text
		const answerText = document.createElement('span');
		answerText.className = 'blank-answer-text';
		answerText.style.cssText = `
			color: #333;
			font-weight: 500;
			font-size: 14px;
			display: inline;
		`;
		answerText.textContent = blank.answer || 'empty';

		// Input field (hidden by default in compact mode)
		const input = document.createElement('input');
		input.type = 'text';
		input.placeholder = 'type answer...';
		input.value = blank.answer || '';
		input.className = 'blank-input';
		input.style.cssText = `
			border: none;
			outline: none;
			background: rgba(255,255,255,0.9);
			padding: 4px 8px;
			border-radius: 4px;
			font-size: 14px;
			min-width: 120px;
			max-width: 200px;
			color: #333;
			font-weight: 500;
			display: none;
		`;
		input.addEventListener('input', (e) => {
			handleBlankAnswerChange(blank.id, e.target.value);
			// Update answer text in real-time
			answerText.textContent = e.target.value || 'empty';
		});
		input.addEventListener('click', (e) => {
			e.stopPropagation();
		});
		input.addEventListener('blur', () => {
			// When input loses focus, collapse back to compact mode
			collapseBlank();
		});

		// Delete button (hidden by default in compact mode)
		const deleteBtn = document.createElement('button');
		deleteBtn.innerHTML = '×';
		deleteBtn.className = 'blank-delete-btn';
		deleteBtn.style.cssText = `
			border: none;
			background: rgba(255,77,79,0.9);
			color: white;
			border-radius: 4px;
			width: 24px;
			height: 24px;
			display: none;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			transition: all 0.2s ease;
			font-size: 18px;
			font-weight: bold;
		`;
		deleteBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			handleDeleteBlankElement(blank.id);
		});
		deleteBtn.addEventListener('mouseenter', (e) => {
			e.target.style.background = 'rgba(255,77,79,1)';
			e.target.style.transform = 'scale(1.1)';
		});
		deleteBtn.addEventListener('mouseleave', (e) => {
			e.target.style.background = 'rgba(255,77,79,0.9)';
			e.target.style.transform = 'scale(1)';
		});

		// Function to expand blank (show input and delete button)
		const expandBlank = () => {
			answerText.style.display = 'none';
			input.style.display = 'inline';
			deleteBtn.style.display = 'flex';
			setTimeout(() => input.focus(), 10);
		};

		// Function to collapse blank (show only answer text)
		const collapseBlank = () => {
			answerText.style.display = 'inline';
			input.style.display = 'none';
			deleteBtn.style.display = 'none';
		};

		// Click on chip to expand
		chip.addEventListener('click', (e) => {
			e.stopPropagation();
			expandBlank();
		});

		chip.appendChild(badge);
		chip.appendChild(answerText);
		chip.appendChild(input);
		chip.appendChild(deleteBtn);
		span.appendChild(chip);

		// Store expand function for external use
		span.expandBlank = expandBlank;

		return span;
	}, [handleBlankAnswerChange, handleDeleteBlankElement]);

	// Handle paste
	const handlePaste = (e) => {
		e.preventDefault();
		const text = e.clipboardData.getData('text/plain');
		document.execCommand('insertText', false, text);
	};

	// Handle save
	const handleSave = () => {
		if (!editorRef.current) return;

		// Validate
		const editorText = editorRef.current.textContent.trim();
		if (!editorText && blanks.length === 0) {
			message.error('Please enter the question text');
			return;
		}

		if (blanks.length === 0) {
			message.error('Please add at least one blank (use __ or [])');
			return;
		}

		const hasEmptyBlanks = blanks.some(blank => !blank.answer || !blank.answer.trim());
		if (hasEmptyBlanks) {
			message.error('Please fill in all blank answers');
			return;
		}

		// Build backend format by traversing DOM
		let questionText = '';
		const contentData = [];
		let answerIndex = 1;

		const childNodes = editorRef.current.childNodes;
		childNodes.forEach(node => {
			if (node.nodeType === Node.TEXT_NODE) {
				questionText += node.textContent.replace(/\n/g, '<br>');
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const blankId = node.getAttribute('data-blank-id');
				if (blankId) {
					// This is a blank
					const blank = blanks.find(b => b.id === blankId);
					if (blank) {
						questionText += `[[pos_${blank.positionId}]]`;
						contentData.push({
							id: `ans${answerIndex}`,
							value: blank.answer,
							positionId: blank.positionId,
							correct: true
						});
						answerIndex++;
					}
				} else {
					questionText += node.textContent.replace(/\n/g, '<br>');
				}
			}
		});

		const newQuestionData = {
			id: questionData?.id || Date.now(),
			type: 'fill-blank',
			title: 'Fill in the blank',
			questionText: questionText,
			content: {
				data: contentData
			},
			points: points,
			// For backward compatibility
			question: questionText,
			blanks: blanks,
			correctAnswer: contentData.map(d => d.value).join(', '),
		};

		onSave(newQuestionData);
		handleCancel();
	};

	// Handle cancel
	const handleCancel = () => {
		if (editorRef.current) {
			editorRef.current.innerHTML = '';
		}
		setBlanks([]);
		setPoints(1);
		onCancel();
	};

	// Track if editor has been initialized
	const editorInitializedRef = useRef(false);

	// Populate editor only when modal opens (initial load)
	useEffect(() => {
		if (!visible) {
			editorInitializedRef.current = false;
			return;
		}
		
		if (!editorRef.current || editorInitializedRef.current) return;

		// Clear editor first
		editorRef.current.innerHTML = '';

		if (editorContent.length === 0) {
			editorInitializedRef.current = true;
			return;
		}

		// Build editor DOM from editorContent (only on initial load)
		editorContent.forEach((item, index) => {
			if (item.type === 'text') {
				editorRef.current.appendChild(document.createTextNode(item.content));
			} else if (item.type === 'blank') {
				const blankIndex = blanks.findIndex(b => b.id === item.id);
				const blankElement = createBlankElement(item, blankIndex >= 0 ? blankIndex : index);
				editorRef.current.appendChild(blankElement);
			}
		});
		
		editorInitializedRef.current = true;
	}, [visible, editorContent, blanks, createBlankElement]);

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
						color: '#1890ff',
						animation: 'pulse 2s infinite'
					}} />
					<span style={{ fontSize: '24px', fontWeight: 600 }}>
						Create Fill in the Blank Question
					</span>
				</div>
			}
			open={visible}
			onCancel={handleCancel}
			width={1400}
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
			
			{/* Top Toolbar */}
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
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<div style={{ 
						fontSize: '14px', 
						color: '#666',
						background: 'rgba(24, 144, 255, 0.1)',
						padding: '8px 16px',
						borderRadius: '8px',
						fontWeight: 500
					}}>
						💡 Tip: Type <code style={{ 
							background: 'rgba(24, 144, 255, 0.2)', 
							padding: '2px 8px', 
							borderRadius: '4px',
							fontWeight: 600,
							color: '#1890ff'
						}}>__</code> or <code style={{ 
							background: 'rgba(24, 144, 255, 0.2)', 
							padding: '2px 8px', 
							borderRadius: '4px',
							fontWeight: 600,
							color: '#1890ff'
						}}>[]</code> to create a blank
					</div>
					
					<div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<CheckOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
							{pointsMenu}
						</div>

						<Button
							type='primary'
							onClick={handleSave}
							size="large"
							style={{
								height: '44px',
								borderRadius: '12px',
								fontWeight: 600,
								fontSize: '16px',
								padding: '0 32px',
								border: 'none',
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

			{/* Main Editor Area */}
			<div style={{ 
				padding: '24px',
				height: 'calc(100vh - 210px)',
				overflowY: 'auto'
			}}>
					<div style={{
						background: 'rgba(255, 255, 255, 0.95)',
						borderRadius: '20px',
						padding: '24px',
						boxShadow: '0 8px 32px rgba(24, 144, 255, 0.15)',
						border: '2px solid rgba(24, 144, 255, 0.1)',
						backdropFilter: 'blur(20px)',
					minHeight: '300px',
					position: 'relative'
				}}>
					{/* Decorative background */}
						<div style={{
							position: 'absolute',
							top: -50,
							right: -50,
							width: '200px',
							height: '200px',
						background: '#1890ff',
							opacity: 0.05,
							borderRadius: '50%',
							filter: 'blur(40px)'
						}} />

					{/* Editor */}
					<div
						ref={editorRef}
						contentEditable
						onInput={handleEditorInput}
						onPaste={handlePaste}
						suppressContentEditableWarning
						style={{
							minHeight: '200px',
							padding: '20px',
							fontSize: '16px',
							lineHeight: '1.8',
							color: '#333',
							background: 'rgba(240, 247, 255, 0.5)',
							borderRadius: '12px',
							border: '2px solid rgba(24, 144, 255, 0.2)',
							outline: 'none',
							position: 'relative',
							zIndex: 1,
							whiteSpace: 'pre-wrap',
							wordWrap: 'break-word'
						}}
						data-placeholder="Type your question here... Use __ or [] to create blanks"
					/>

					{/* Blanks Summary */}
					{blanks.length > 0 && (
						<div style={{ 
							marginTop: '24px',
							padding: '16px',
							background: 'rgba(24, 144, 255, 0.05)',
							borderRadius: '12px',
							border: '1px solid rgba(24, 144, 255, 0.1)'
						}}>
							<div style={{
								fontSize: '14px', 
								fontWeight: 600, 
								color: '#1890ff',
								marginBottom: '12px'
							}}>
								Blanks Summary ({blanks.length})
							</div>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
						{blanks.map((blank, index) => (
							<div
								key={blank.id}
								style={{
											padding: '8px 12px',
											background: 'white',
											border: `2px solid ${blank.color}`,
											borderRadius: '8px',
											fontSize: '13px',
									display: 'flex',
									alignItems: 'center',
											gap: '6px'
										}}
									>
										<span style={{
											width: '20px',
											height: '20px',
											borderRadius: '50%',
											background: blank.color,
												color: 'white',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											fontSize: '11px',
											fontWeight: 700
										}}>
											{index + 1}
										</span>
										<span style={{ fontWeight: 500, color: '#333' }}>
											{blank.answer || '(empty)'}
										</span>
							</div>
						))}
					</div>
						</div>
					)}
				</div>
			</div>
		</Modal>
	);
};

export default FillBlankModal;
