import React, {
	useState,
	useRef,
	useEffect,
	useCallback,
	useMemo,
} from 'react';
import { Modal, Button, InputNumber, Input, Tooltip, Dropdown } from 'antd';
import { spaceToast } from '../../../../../component/SpaceToastify';
import {
	CheckOutlined,
	ThunderboltOutlined,
	SaveOutlined,
	PlusOutlined,
	DeleteOutlined,
	BoldOutlined,
	ItalicOutlined,
	UnderlineOutlined,
	OrderedListOutlined,
	UnorderedListOutlined,
	LinkOutlined,
	UndoOutlined,
	RedoOutlined,
	PictureOutlined,
	TableOutlined,
	AlignLeftOutlined,
	AlignCenterOutlined,
	AlignRightOutlined,
	FontSizeOutlined,
} from '@ant-design/icons';
import './MultipleChoiceModal.css';

// Debounce utility function
const debounce = (func, wait) => {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

// Throttle utility function
const throttle = (func, limit) => {
	let inThrottle;
	return function (...args) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
};

const DragDropModal = ({ visible, onCancel, onSave, questionData = null }) => {
	const [editorContent, setEditorContent] = useState([]);
	const [blanks, setBlanks] = useState([]);
	const [incorrectOptions, setIncorrectOptions] = useState([]);
    const [weight, setWeight] = useState(1);
	const [questionCharCount, setQuestionCharCount] = useState(0);
	const [selectedImage, setSelectedImage] = useState(null);
	const [saving, setSaving] = useState(false);
	const [tableDropdownOpen, setTableDropdownOpen] = useState(false);
	const [hoveredCell, setHoveredCell] = useState({ row: 0, col: 0 });
	const [showBlankPopup, setShowBlankPopup] = useState(false);
	const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
	const editorRef = useRef(null);
	const fileInputRef = useRef(null);
	const savedRangeRef = useRef(null);
	const deletionInProgressRef = useRef(new Set());
	const lastValidHtmlRef = useRef('');

	// Limit for incorrect options
	const MAX_INCORRECT_OPTIONS = 10;
	const MAX_BLANKS = 10;

	// Colors for blanks - matching ReorderModal color palette (avoid red as first color)
	const blankColors = useMemo(
		() => [
			'#2563eb', // Blue
			'#059669', // Green
			'#9333ea', // Purple
			'#ea580c', // Orange
			'#0891b2', // Cyan
			'#d946ef', // Magenta
			'#84cc16', // Lime
			'#f59e0b', // Amber
		],
		[]
	);

	// Parse backend format to editor format
	const parseQuestionText = useCallback(
		(questionText, contentData) => {
			const blanksData = [];

			// Create a temporary DOM element to parse HTML
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = questionText;

			// Process each child node
			const processNode = (node) => {
				if (node.nodeType === Node.TEXT_NODE) {
					const text = node.textContent;
					const regex = /\[\[pos_([a-z0-9]+)\]\]/g;
					let lastIndex = 0;
					let match;
					const result = [];

					while ((match = regex.exec(text)) !== null) {
						// Add text before blank
						if (match.index > lastIndex) {
							const textContent = text.substring(lastIndex, match.index);
							if (textContent) {
								result.push({
									type: 'text',
									content: textContent,
									id: `text-${Date.now()}-${lastIndex}`,
								});
							}
						}

						// Add blank
						const positionId = match[1];
						const blankData = contentData.find(
							(item) => item.positionId === positionId
						);
						// Use positionId as the main ID to ensure consistency
						const blankId = `blank-${positionId}`;

						const blankItem = {
							type: 'blank',
							id: blankId,
							positionId: positionId,
							answer: blankData?.value || '',
							color: blankColors[blanksData.length % blankColors.length],
						};
						result.push(blankItem);

						blanksData.push({
							id: blankId,
							positionId: positionId,
							answer: blankData?.value || '',
							color: blankColors[blanksData.length % blankColors.length],
						});

						lastIndex = regex.lastIndex;
					}

					// Add remaining text
					if (lastIndex < text.length) {
						const remainingText = text.substring(lastIndex);
						if (remainingText) {
							result.push({
								type: 'text',
								content: remainingText,
								id: `text-${Date.now()}-${lastIndex}`,
							});
						}
					}

					return result;
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					// Regular HTML element, preserve it
					const tagName = node.tagName.toLowerCase();
					const innerHTML = node.innerHTML;

					// Special handling for image wrapper - always preserve
					if (
						node.hasAttribute('data-image-wrapper') ||
						node.classList.contains('image-wrapper')
					) {
						return {
							type: 'html',
							content: node.outerHTML,
							id: `html-${Date.now()}`,
						};
					}

					// Special handling for images - always preserve
					if (tagName === 'img') {
						return {
							type: 'html',
							content: node.outerHTML,
							id: `html-${Date.now()}`,
						};
					}

					// Special handling for tables - ALWAYS preserve structure, extract blank data from patterns
					// This must be checked BEFORE checking if element contains patterns
					if (tagName === 'table') {
						// Extract blank data from table cells that contain patterns
						const textContent = node.textContent;
						if (textContent && /\[\[pos_([a-z0-9]+)\]\]/.test(textContent)) {
							// Extract all positionIds from table
							const positionIdRegex = /\[\[pos_([a-z0-9]+)\]\]/g;
							let match;
							while ((match = positionIdRegex.exec(textContent)) !== null) {
								const positionId = match[1];
								const blankData = contentData.find(
									(item) => item.positionId === positionId
								);
								
								if (blanksData.length < MAX_BLANKS) {
									const blankId = `blank-${positionId}`;
									blanksData.push({
										id: blankId,
										positionId: positionId,
										answer: blankData?.value || '',
										color: blankColors[blanksData.length % blankColors.length],
									});
								}
							}
						}
						
						// Always preserve table as HTML (patterns will be converted during render)
						return {
							type: 'html',
							content: node.outerHTML,
							id: `html-${Date.now()}`,
						};
					}

					// For other elements, check if they contain blank patterns
					const textContent = node.textContent;
					if (textContent && /\[\[pos_([a-z0-9]+)\]\]/.test(textContent)) {
						// This element contains blanks, but it's not a table/image
						// Process its child nodes recursively to preserve structure while parsing blanks
						const childResults = [];
						for (let i = 0; i < node.childNodes.length; i++) {
							const childResult = processNode(node.childNodes[i]);
							if (Array.isArray(childResult)) {
								childResults.push(...childResult);
							} else if (childResult) {
								childResults.push(childResult);
							}
						}
						return childResults.length > 0 ? childResults : [];
					} else {
						// No blank patterns, preserve the HTML
						if (innerHTML) {
							return {
								type: 'html',
								content: node.outerHTML,
								id: `html-${Date.now()}`,
							};
						}
						return { type: 'text', content: '', id: `text-${Date.now()}` };
					}
				}
				return [];
			};

			// Process all child nodes
			const parsed = [];
			for (let i = 0; i < tempDiv.childNodes.length; i++) {
				const node = tempDiv.childNodes[i];
				const result = processNode(node);
				if (Array.isArray(result)) {
					parsed.push(...result);
				} else if (result) {
					parsed.push(result);
				}
			}

			if (parsed.length === 0) {
				parsed.push({ type: 'text', content: '', id: Date.now() });
			}

			setEditorContent(parsed);
			setBlanks(blanksData.slice(0, MAX_BLANKS));
		},
		[blankColors]
	);

	// Reset modal state when it closes
	useEffect(() => {
		if (!visible) {
			console.log('DragDropModal - Modal closed, resetting state');
			// Reset state after a delay to ensure modal is fully closed
			const timer = setTimeout(() => {
				setEditorContent([]);
				setBlanks([]);
				setIncorrectOptions([]);
				setSelectedImage(null);
				setShowBlankPopup(false);
				editorInitializedRef.current = false;
			}, 300); // Small delay to let modal close animation complete
			
			return () => clearTimeout(timer);
		}
	}, [visible]);

	// Initialize editor content from questionData
	useEffect(() => {
		if (visible) {
			console.log('=== DragDropModal - Initializing ===');
			console.log('questionData:', questionData);
			console.log('questionData.options:', questionData?.options);
			console.log('questionData.incorrectOptions:', questionData?.incorrectOptions);
			console.log('questionData.content?.data:', questionData?.content?.data);
			
			// Check if we need to extract incorrect options from content.data
			if (questionData?.options && (!questionData.incorrectOptions || questionData.incorrectOptions.length === 0)) {
				console.log('⚠️ Incorrect options is empty, extracting from options...');
				const extractedIncorrect = questionData.options
					.filter(opt => !opt.isCorrect)
					.map(opt => ({
						id: opt.key || Date.now(),
						text: opt.text
					}));
				console.log('Extracted incorrect options:', extractedIncorrect);
				questionData.incorrectOptions = extractedIncorrect;
			}
			
			// Reset initialization flag when modal opens
			editorInitializedRef.current = false;
			
			if (questionData?.questionText && questionData?.content?.data) {
				// Parse existing question
				console.log('DragDropModal - Parsing existing question');
				console.log('DragDropModal - incorrectOptions from questionData:', questionData.incorrectOptions);
				parseQuestionText(questionData.questionText, questionData.content.data);
				setIncorrectOptions((questionData.incorrectOptions || []).slice(0, MAX_INCORRECT_OPTIONS));
			} else {
				// New question
				console.log('DragDropModal - New question, setting empty content');
				setEditorContent([{ type: 'text', content: '', id: Date.now() }]);
				setBlanks([]);
				setIncorrectOptions([]);
			}
            setWeight((questionData && (questionData.weight ?? questionData.points)) || 1);
		}
	}, [questionData, visible, parseQuestionText]);

	// Generate position ID
	const generatePositionId = () => {
		return Math.random().toString(36).substring(2, 8);
	};

	// Formatting functions for toolbar
	const handleFormat = useCallback((command, value = null) => {
		if (!editorRef.current) return;
		editorRef.current.focus();
		document.execCommand(command, false, value);
	}, []);

	const handleInsertLink = useCallback(() => {
		if (!editorRef.current) return;
		const url = prompt('Enter URL:');
		if (url) {
			handleFormat('createLink', url);
		}
	}, [handleFormat]);

	// Insert image into editor
	const insertImageIntoEditor = useCallback(
		(base64Image) => {
			if (!editorRef.current) return;

			editorRef.current.focus();

			// Create wrapper for image with resize handles
			const wrapper = document.createElement('div');
			wrapper.className = 'image-wrapper';
			wrapper.style.cssText = `
			position: relative;
			display: inline-block;
			max-width: 100%;
			margin: 10px 0;
			user-select: none;
		`;
			wrapper.setAttribute('contenteditable', 'false');
			wrapper.setAttribute('data-image-wrapper', 'true');

			// Create image element
			const img = document.createElement('img');
			img.src = base64Image;
			img.style.cssText = `
			display: block;
			width: 300px;
			height: auto;
			border-radius: 8px;
			cursor: pointer;
		`;
			img.setAttribute('data-image-id', `img-${Date.now()}`);

			// Create 4 resize handles
			const handles = ['nw', 'ne', 'sw', 'se'];
			const handleElements = {};

			handles.forEach((position) => {
				const handle = document.createElement('div');
				handle.className = `resize-handle resize-handle-${position}`;
				handle.style.cssText = `
				position: absolute;
				width: 12px;
				height: 12px;
				background: #1890ff;
				border: 2px solid white;
				border-radius: 50%;
				box-shadow: 0 2px 4px rgba(0,0,0,0.3);
				z-index: 1000;
				opacity: 0;
				transition: all 0.2s ease;
			`;

				// Position handles
				if (position === 'nw') {
					handle.style.top = '-6px';
					handle.style.left = '-6px';
					handle.style.cursor = 'nwse-resize';
				} else if (position === 'ne') {
					handle.style.top = '-6px';
					handle.style.right = '-6px';
					handle.style.cursor = 'nesw-resize';
				} else if (position === 'sw') {
					handle.style.bottom = '-6px';
					handle.style.left = '-6px';
					handle.style.cursor = 'nesw-resize';
				} else if (position === 'se') {
					handle.style.bottom = '-6px';
					handle.style.right = '-6px';
					handle.style.cursor = 'nwse-resize';
				}

				handleElements[position] = handle;
				wrapper.appendChild(handle);
			});

			wrapper.appendChild(img);

			// Make wrapper selectable
			wrapper.onclick = function (e) {
				e.stopPropagation();
				setSelectedImage(img);
				// Show handles and add visual feedback
				Object.values(handleElements).forEach((h) => (h.style.opacity = '1'));
				wrapper.style.outline = '2px solid #1890ff';
				wrapper.style.outlineOffset = '2px';
			};

			// Hide handles on mouse leave
			wrapper.onmouseleave = function () {
				if (selectedImage !== img) {
					Object.values(handleElements).forEach((h) => (h.style.opacity = '0'));
				}
			};

			// Show handles on mouse enter
			wrapper.onmouseenter = function () {
				Object.values(handleElements).forEach((h) => (h.style.opacity = '1'));
			};

			// Resize functionality
			let isResizing = false;
			let startWidth, startX, currentHandle;

			const startResize = (e, handle) => {
				e.preventDefault();
				e.stopPropagation();
				isResizing = true;
				currentHandle = handle;
				startWidth = img.offsetWidth;
				startX = e.clientX;

				document.addEventListener('mousemove', doResize);
				document.addEventListener('mouseup', stopResize);
			};

			const doResize = (e) => {
				if (!isResizing) return;

				const deltaX = e.clientX - startX;

				let newWidth = startWidth;

				if (currentHandle === 'se' || currentHandle === 'ne') {
					newWidth = startWidth + deltaX;
				} else if (currentHandle === 'sw' || currentHandle === 'nw') {
					newWidth = startWidth - deltaX;
				}

				// Min and max width constraints
				if (newWidth < 100) newWidth = 100;
				if (newWidth > 800) newWidth = 800;

				img.style.width = newWidth + 'px';

				// If wrapper has been aligned (display: block), update wrapper width too
				if (wrapper.style.display === 'block' && wrapper.style.width) {
					wrapper.style.width = newWidth + 'px';
				}
			};

			const stopResize = () => {
				isResizing = false;
				document.removeEventListener('mousemove', doResize);
				document.removeEventListener('mouseup', stopResize);
			};

			// Attach resize events to handles
			Object.entries(handleElements).forEach(([position, handle]) => {
				handle.onmousedown = (e) => startResize(e, position);
				handle.onmouseenter = (e) => {
					e.target.style.transform = 'scale(1.3)';
					e.target.style.background = '#40a9ff';
				};
				handle.onmouseleave = (e) => {
					e.target.style.transform = 'scale(1)';
					e.target.style.background = '#1890ff';
				};
			});

			// Insert at cursor or end
			const selection = window.getSelection();
			if (selection.rangeCount > 0) {
				const range = selection.getRangeAt(0);
				range.insertNode(wrapper);

				// Add line break after image for easier editing
				const br = document.createElement('br');
				wrapper.parentNode.insertBefore(br, wrapper.nextSibling);

				// Move cursor after the line break
				range.setStartAfter(br);
				range.setEndAfter(br);
				selection.removeAllRanges();
				selection.addRange(range);
			} else {
				editorRef.current.appendChild(wrapper);
				// Add line break after image
				const br = document.createElement('br');
				editorRef.current.appendChild(br);
			}

			console.log('Image inserted successfully');
		},
		[selectedImage]
	);

	// Handle image upload from file
	const handleImageUpload = useCallback(() => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	}, []);

	const handleFileChange = useCallback(
		(e) => {
			const file = e.target.files?.[0];
			if (file && file.type.startsWith('image/')) {
				const reader = new FileReader();
				reader.onload = (event) => {
					insertImageIntoEditor(event.target.result);
				};
				reader.readAsDataURL(file);
			} else if (file) {
				console.error('Please select an image file');
			}
			// Reset input
			if (e.target) {
				e.target.value = '';
			}
		},
		[insertImageIntoEditor]
	);

	// Handle image alignment
	const handleImageAlign = useCallback(
		(alignment) => {
			if (!selectedImage) {
				spaceToast.warning('Please select an image first');
				return;
			}

			// Find the wrapper (parent of the image)
			const wrapper = selectedImage.parentElement;
			if (!wrapper || !wrapper.hasAttribute('data-image-wrapper')) {
				spaceToast.warning('Image wrapper not found');
				return;
			}

			// Get the current width of the image to maintain it
			const currentWidth = selectedImage.offsetWidth;

			switch (alignment) {
				case 'left':
					wrapper.style.display = 'block';
					wrapper.style.width = `${currentWidth}px`;
					wrapper.style.marginLeft = '0';
					wrapper.style.marginRight = 'auto';
					break;
				case 'center':
					wrapper.style.display = 'block';
					wrapper.style.width = `${currentWidth}px`;
					wrapper.style.marginLeft = 'auto';
					wrapper.style.marginRight = 'auto';
					break;
				case 'right':
					wrapper.style.display = 'block';
					wrapper.style.width = `${currentWidth}px`;
					wrapper.style.marginLeft = 'auto';
					wrapper.style.marginRight = '0';
					break;
				default:
					break;
			}

			console.log(`Image aligned to ${alignment}`);

			// Return focus to editor after alignment
			requestAnimationFrame(() => {
				if (editorRef.current) {
					editorRef.current.focus();
					// Move cursor to end
					const selection = window.getSelection();
					const range = document.createRange();
					range.selectNodeContents(editorRef.current);
					range.collapse(false);
					selection.removeAllRanges();
					selection.addRange(range);
				}
			});
		},
		[selectedImage]
	);

	// Check if cursor is inside a blank element
	const isCursorInsideBlank = useCallback(() => {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return false;

		let node = selection.anchorNode;
		while (node && node !== editorRef.current) {
			if (
				node.nodeType === Node.ELEMENT_NODE &&
				node.hasAttribute('data-blank-id')
			) {
				return true;
			}
			node = node.parentNode;
		}
		return false;
	}, []);

	// Update popup position based on current cursor
	const updatePopupPositionCore = useCallback(() => {
		if (!editorRef.current) return;

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			setShowBlankPopup(false);
			return;
		}

		// Don't show popup if cursor is inside a blank
		if (isCursorInsideBlank()) {
			setShowBlankPopup(false);
			return;
		}

		const range = selection.getRangeAt(0);
		const rect = range.getBoundingClientRect();
		const editorRect = editorRef.current.getBoundingClientRect();

		if (rect.width === 0 && rect.height === 0) {
			// Cursor is at a position, get its location
			const tempSpan = document.createElement('span');
			tempSpan.textContent = '\u200B'; // Zero-width space
			range.insertNode(tempSpan);
			const tempRect = tempSpan.getBoundingClientRect();
			tempSpan.remove();

			const popupX = tempRect.left - editorRect.left;
			const popupY = tempRect.top - editorRect.top + tempRect.height + 5;

			setPopupPosition({ x: popupX, y: popupY });
			savedRangeRef.current = range.cloneRange();
			setShowBlankPopup(true);
		} else {
			const popupX = rect.left - editorRect.left;
			const popupY = rect.top - editorRect.top + rect.height + 5;

			setPopupPosition({ x: popupX, y: popupY });
			savedRangeRef.current = range.cloneRange();
			setShowBlankPopup(true);
		}
	}, [isCursorInsideBlank]);

	// Debounced version - only update popup after user stops typing for 150ms
	const updatePopupPosition = useMemo(
		() => debounce(updatePopupPositionCore, 150),
		[updatePopupPositionCore]
	);

	// Handle table insertion
	const handleInsertTable = useCallback(
		(numRows, numCols) => {
			if (!editorRef.current) return;

			if (numRows > 0 && numCols > 0 && numRows <= 10 && numCols <= 10) {
				editorRef.current.focus();

				// Create table
				const table = document.createElement('table');
				table.style.borderCollapse = 'collapse';
				table.style.width = '100%';
				table.style.margin = '10px 0';
				table.style.border = '1px solid #000000';

				for (let i = 0; i < numRows; i++) {
					const tr = document.createElement('tr');
					for (let j = 0; j < numCols; j++) {
						const td = document.createElement(i === 0 ? 'th' : 'td');
						td.contentEditable = 'true';
						td.style.border = '1px solid #000000';
						td.style.padding = '8px';
						td.style.minWidth = '50px';
						if (i === 0) {
							td.style.background = 'rgba(24, 144, 255, 0.1)';
							td.style.fontWeight = '600';
						}
						td.innerHTML = '&nbsp;';

						// Add event listeners for table cells to update popup position
						td.addEventListener('click', () => {
							requestAnimationFrame(() => {
								updatePopupPosition();
							});
						});
						td.addEventListener('keyup', () => {
							updatePopupPosition();
						});
						td.addEventListener('focus', () => {
							requestAnimationFrame(() => {
								updatePopupPosition();
							});
						});

						tr.appendChild(td);
					}
					table.appendChild(tr);
				}

				// Insert table
				const selection = window.getSelection();
				if (selection.rangeCount > 0) {
					const range = selection.getRangeAt(0);
					range.insertNode(table);
					range.collapse(false);
				} else {
					editorRef.current.appendChild(table);
				}

				setTableDropdownOpen(false);
				console.log(`Table ${numRows}x${numCols} inserted successfully`);
			}
		},
		[updatePopupPosition]
	);

	// Handle heading format
	const handleHeading = useCallback((level) => {
		if (!editorRef.current) return;
		editorRef.current.focus();

		if (level === 'paragraph') {
			document.execCommand('formatBlock', false, 'p');
		} else {
			document.execCommand('formatBlock', false, level);
		}
	}, []);

	// Handle editor click to deselect image and ensure cursor
	const handleEditorClick = useCallback(
		(e) => {
			// If clicked on something other than an image, deselect
			if (e.target.tagName !== 'IMG') {
				// Remove outline from all image wrappers
				if (editorRef.current) {
					const wrappers = editorRef.current.querySelectorAll(
						'[data-image-wrapper]'
					);
					wrappers.forEach((wrapper) => {
						wrapper.style.outline = 'none';
					});
				}
				setSelectedImage(null);
			}

			// Check if click is inside editor (including table cells)
			const isInEditor =
				editorRef.current &&
				(e.target === editorRef.current ||
					editorRef.current.contains(e.target));

			// Only set cursor if click is inside editor
			if (isInEditor) {
				// Don't interfere if user is selecting text
				requestAnimationFrame(() => {
					const selection = window.getSelection();
					if (selection && selection.toString().length === 0) {
						// Update popup position at cursor (debounced)
						updatePopupPosition();
					}
				});
			}
		},
		[updatePopupPosition]
	);

	// Handle editor focus - show popup at cursor
	const handleEditorFocus = useCallback(() => {
		requestAnimationFrame(() => {
			updatePopupPosition();
		});
	}, [updatePopupPosition]);

	// Handle keydown to delete selected image
	const handleEditorKeyDown = useCallback(
		(e) => {
			// Check if Backspace or Delete key is pressed and an image is selected
			if ((e.key === 'Backspace' || e.key === 'Delete') && selectedImage) {
				e.preventDefault();

				// Find the wrapper (parent of the image)
				const wrapper = selectedImage.parentElement;
				if (wrapper && wrapper.hasAttribute('data-image-wrapper')) {
					// Remove the wrapper (which contains the image and resize handles)
					wrapper.remove();

					// Clear selected image
					setSelectedImage(null);

					// Focus back to editor
					if (editorRef.current) {
						editorRef.current.focus();
					}

					console.log('Image deleted');
				}
			}
		},
		[selectedImage]
	);

	// Handle blank answer change
	const handleBlankAnswerChange = useCallback((blankId, value) => {
		const limitedValue = (value ?? '').slice(0, 50);
		setBlanks((prev) =>
			prev.map((blank) =>
				blank.id === blankId ? { ...blank, answer: limitedValue } : blank
			)
		);
	}, []);

	// Keep chip answer text (and chip input if opened) synced when side inputs change
	useEffect(() => {
		if (!editorRef.current) return;
		try {
			blanks.forEach(b => {
			const chipAnswer = editorRef.current.querySelector(
				`[data-blank-id="${b.id}"] .blank-answer-text`
			);
			const limited = (b.answer || '').slice(0, 50);
			if (chipAnswer && chipAnswer.textContent !== limited) {
				chipAnswer.textContent = limited;
			}
				const chipInput = editorRef.current.querySelector(
					`[data-blank-id="${b.id}"] .blank-input`
				);
				if (chipInput && chipInput.value !== limited) {
					chipInput.value = limited;
				}
				const chipCounter = editorRef.current.querySelector(
					`[data-blank-id="${b.id}"] .blank-char-counter`
				);
				if (chipCounter) {
					chipCounter.textContent = `${limited.length}/50`;
				}
			});
		} catch (e) {
			// safeguard
		}
	}, [blanks]);

	// Update blank numbers based on DOM order
	const updateBlankNumbers = useCallback(() => {
		if (!editorRef.current) return;

		const blankElements = editorRef.current.querySelectorAll('[data-blank-id]');
		blankElements.forEach((element, index) => {
			const badge = element.querySelector('.blank-badge');
			if (badge) {
				badge.textContent = index + 1;
			}
		});
	}, []);

	// Handle delete blank from DOM
	const handleDeleteBlankElement = useCallback(
		(blankId) => {
			if (!editorRef.current) return;

			// prevent duplicate deletions racing from blur + click
			if (deletionInProgressRef.current.has(blankId)) return;
			deletionInProgressRef.current.add(blankId);

			// Find and remove the blank element from DOM safely
			const blankElement = editorRef.current.querySelector(
				`[data-blank-id="${blankId}"]`
			);
			try {
				if (blankElement && blankElement.parentNode) {
					blankElement.parentNode.removeChild(blankElement);
				}
			} catch (err) {
				// element may already be detached
			}

			// Update state
			setBlanks((prev) => prev.filter((blank) => blank.id !== blankId));

			// Update blank numbers after deletion
			requestAnimationFrame(() => {
				updateBlankNumbers();
				deletionInProgressRef.current.delete(blankId);
			});

			console.log('Blank removed');

			// Refocus editor
			editorRef.current.focus();
		},
		[updateBlankNumbers]
	);

	// Create blank element
	const createBlankElement = useCallback(
		(blank, index) => {
			const span = document.createElement('span');
			span.setAttribute('contenteditable', 'false');
			span.setAttribute('data-blank-id', blank.id);
			span.setAttribute('data-deleting-by-button', 'false');
			span.style.cssText = `
			display: inline-flex;
			align-items: center;
			margin: 0 4px;
			position: relative;
			vertical-align: middle;
			user-select: none;
			-webkit-user-select: none;
		`;

			// Ensure blank has color
			const blankColor = blank.color || blankColors[index % blankColors.length];

			const chip = document.createElement('span');
			chip.style.cssText = `
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 6px 12px;
			background: linear-gradient(135deg, ${blankColor}20, ${blankColor}40);
			border: 2px solid ${blankColor};
			border-radius: 8px;
			font-size: 14px;
			font-weight: 500;
			color: ${blankColor};
			transition: all 0.2s ease;
			cursor: pointer;
			min-width: 0;
			max-width: 300px;
			flex: 1;
			position: relative;
			padding-right: 56px;
		`;

			// Number badge
			const badge = document.createElement('span');
			badge.className = 'blank-badge';
			badge.style.cssText = `
			width: 23px;
			height: 23px;
			min-width: 23px;
			border-radius: 50%;
			background: ${blankColor};
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 12px;
			font-weight: 700;
			flex-shrink: 0;
		`;
			badge.textContent = index + 1;

			// Compact mode: Display answer text
			const answerText = document.createElement('span');
			answerText.className = 'blank-answer-text';
			answerText.style.cssText = `
		color: #333;
		font-weight: 500;
		font-size: 14px;
		display: inline-block;
		max-width: 230px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		vertical-align: middle;
	`;
			answerText.textContent = (blank.answer || '').slice(0, 50);

			// Input field (hidden by default in compact mode)
			const input = document.createElement('input');
			input.type = 'text';
			input.placeholder = 'type answer...';
			input.value = (blank.answer || '').slice(0, 50);
			input.maxLength = 50;
			input.className = 'blank-input';
			input.style.cssText = `
			border: none;
			outline: none;
			background: rgba(255,255,255,0.9);
			padding: 4px 8px;
			border-radius: 4px;
			font-size: 14px;
			min-width: 120px;
			max-width: 280px;
			color: #333;
			font-weight: 500;
			display: none;
			flex: 1;
			margin-right: 8px;
		`;

			// Character counter (hidden by default in compact mode)
			const counter = document.createElement('span');
			counter.className = 'blank-char-counter';
			counter.textContent = `${input.value.length}/50`;
			counter.style.cssText = `
			font-size: 12px;
			color: #999;
			display: none;
			white-space: nowrap;
			position: absolute;
			right: 10px;
			top: 50%;
			transform: translateY(-50%);
			pointer-events: none;
		`;
			// Optimize input handling with debounce for state update
			let inputTimeout;
			input.addEventListener('input', (e) => {
				const newValue = (e.target.value || '').slice(0, 50);
				if (e.target.value !== newValue) {
					e.target.value = newValue;
				}
				// Update answer text in real-time (instant visual feedback)
				answerText.textContent = newValue || '';
				counter.textContent = `${newValue.length}/50`;

				// Debounce state update to reduce re-renders
				clearTimeout(inputTimeout);
				inputTimeout = setTimeout(() => {
					handleBlankAnswerChange(blank.id, newValue);
				}, 100);
			});
			input.addEventListener('click', (e) => {
				e.stopPropagation();
			});
			input.addEventListener('mousedown', (e) => {
				e.stopPropagation();
			});
			input.addEventListener('blur', (e) => {
				setTimeout(() => {
					const isDeletingByButton = span.getAttribute('data-deleting-by-button') === 'true';
					if (!document.body.contains(span)) return;
					if (!e.target.value || !e.target.value.trim()) {
						if (!isDeletingByButton && !deletionInProgressRef.current.has(blank.id)) {
							handleDeleteBlankElement(blank.id);
						}
						return;
					}
					collapseBlank();
				}, 50);
			});

			// Delete button (hidden by default in compact mode)
			const deleteBtn = document.createElement('button');
			deleteBtn.innerHTML = '×';
			deleteBtn.className = 'blank-delete-btn';
			deleteBtn.type = 'button';
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
			position: relative;
			z-index: 1000;
			flex-shrink: 0;
		`;
			deleteBtn.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				console.log('Delete button clicked for blank:', blank.id);
				span.setAttribute('data-deleting-by-button', 'true');
				handleDeleteBlankElement(blank.id);
			});
			deleteBtn.addEventListener('mousedown', (e) => {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
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
				counter.style.display = 'inline';
				setTimeout(() => input.focus(), 10);
			};

			// Function to collapse blank (show only answer text)
			const collapseBlank = () => {
				answerText.style.display = 'inline';
				input.style.display = 'none';
				deleteBtn.style.display = 'none';
				counter.style.display = 'none';
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
			chip.appendChild(counter);
			span.appendChild(chip);

			// Store expand function for external use
			span.expandBlank = expandBlank;

			return span;
		},
		[handleBlankAnswerChange, handleDeleteBlankElement, blankColors]
	);

	// Throttled blank check - only run once every 100ms
	const checkRemovedBlanksThrottled = useMemo(
		() =>
			throttle((element) => {
				const currentBlankIds = new Set();
				const blankElements = element.querySelectorAll('[data-blank-id]');
				blankElements.forEach((el) => {
					const blankId = el.getAttribute('data-blank-id');
					if (blankId) currentBlankIds.add(blankId);
				});

				// Remove blanks from state that no longer exist in DOM
				setBlanks((prev) => {
					const filtered = prev.filter((blank) =>
						currentBlankIds.has(blank.id)
					);
					if (filtered.length !== prev.length) {
						// Some blanks were removed - update numbers
						requestAnimationFrame(() => {
							updateBlankNumbers();
						});
						return filtered;
					}
					return prev;
				});
			}, 100),
		[setBlanks, updateBlankNumbers]
	);

	// Find and replace pattern in text nodes without affecting existing blanks
	const findAndReplacePattern = useCallback(
		(element) => {
			// Enforce maximum blanks
			if (blanks.length >= MAX_BLANKS) {
				spaceToast.warning(`Maximum ${MAX_BLANKS} blanks allowed`);
				return;
			}
			// Walk through all child nodes
			const walker = document.createTreeWalker(
				element,
				NodeFilter.SHOW_TEXT,
				null,
				false
			);

			let textNode;

			while ((textNode = walker.nextNode())) {
				// Check if this text node is inside a blank element
				let parentNode = textNode.parentNode;
				let isInsideBlank = false;
				while (parentNode && parentNode !== element) {
					if (
						parentNode.hasAttribute &&
						parentNode.hasAttribute('data-blank-id')
					) {
						isInsideBlank = true;
						break;
					}
					parentNode = parentNode.parentNode;
				}

				// Skip if inside a blank
				if (isInsideBlank) continue;

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
					const blankId = `blank-${positionId}`;
					const color = blankColors[blanks.length % blankColors.length];

					const newBlank = {
						id: blankId,
						positionId: positionId,
						answer: '',
						color: color,
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
						const textAfter = afterPattern.startsWith(' ')
							? afterPattern
							: ' ' + afterPattern;
						fragment.appendChild(document.createTextNode(textAfter));
					} else {
						fragment.appendChild(document.createTextNode(' '));
					}

					// Replace the text node with the fragment
					parent.replaceChild(fragment, textNode);

					// Update blanks state
					setBlanks((prev) => [...prev, newBlank]);

					// Update blank numbers and expand the newly created blank
					requestAnimationFrame(() => {
						try {
							// Update all blank numbers first
							updateBlankNumbers();

							// Find the newly inserted blank in DOM
							const insertedBlank = element.querySelector(
								`[data-blank-id="${blankId}"]`
							);
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
					});

					// Only process one pattern at a time
					break;
				}
			}
		},
		[blanks, blankColors, createBlankElement, setBlanks, updateBlankNumbers]
	);

	// Debounced pattern finder - run after user stops typing for 50ms
	const findPatternDebouncedOptimized = useMemo(
		() =>
			debounce((element) => {
				if (!isCursorInsideBlank()) {
					findAndReplacePattern(element);
				}
			}, 50),
		[isCursorInsideBlank, findAndReplacePattern]
	);

	// Handle text input in editor
	const handleEditorInput = useCallback(
		(e) => {
			const element = e.currentTarget;
			// Enforce max 600 characters (plain text length)
			const plainText = (element.textContent || '').trim();
			if (plainText.length > 600) {
				spaceToast.warning('Maximum 600 characters allowed for the question');
				// Revert to last valid HTML snapshot
				if (lastValidHtmlRef.current !== '' && editorRef.current) {
					editorRef.current.innerHTML = lastValidHtmlRef.current;
				}
				setQuestionCharCount(Math.min(plainText.length, 600));
				updatePopupPosition();
				return;
			}
			// Update last valid HTML snapshot and counter
			lastValidHtmlRef.current = editorRef.current ? editorRef.current.innerHTML : '';
			setQuestionCharCount(plainText.length);

			// Check if any blanks were removed from DOM (throttled)
			checkRemovedBlanksThrottled(element);

			// Look for __ or [] pattern in text nodes only (debounced - run after 50ms)
			findPatternDebouncedOptimized(element);

			// Update popup position (debounced via the debounced function)
			updatePopupPosition();
		},
		[
			checkRemovedBlanksThrottled,
			findPatternDebouncedOptimized,
			updatePopupPosition,
		]
	);

	// Insert blank at saved cursor position
	const insertBlankAtCursor = useCallback(() => {
		if (blanks.length >= MAX_BLANKS) {
			spaceToast.warning(`Maximum ${MAX_BLANKS} blanks allowed`);
			setShowBlankPopup(false);
			return;
		}
		if (!editorRef.current || !savedRangeRef.current) return;

		// Don't insert blank if cursor is inside another blank
		if (isCursorInsideBlank()) {
			spaceToast.warning('Cannot insert blank inside another blank');
			setShowBlankPopup(false);
			return;
		}

		// Create blank
		const positionId = generatePositionId();
		const blankId = `blank-${positionId}`;
		const color = blankColors[blanks.length % blankColors.length];

		const newBlank = {
			id: blankId,
			positionId: positionId,
			answer: '',
			color: color,
		};

		// Create blank element
		const blankElement = createBlankElement(newBlank, blanks.length);

		// Restore saved range
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(savedRangeRef.current);

		// Insert blank at cursor
		try {
			const range = savedRangeRef.current.cloneRange();

			// Add space before blank if needed
			const textBefore =
				range.startContainer.textContent?.substring(0, range.startOffset) || '';
			if (textBefore && !textBefore.endsWith(' ')) {
				range.insertNode(document.createTextNode(' '));
				range.collapse(false);
			}

			// Insert blank
			range.insertNode(blankElement);
			range.collapse(false);

			// Add space after blank
			range.insertNode(document.createTextNode(' '));
			range.collapse(false);

			// Update selection
			selection.removeAllRanges();
			selection.addRange(range);

			// Update blanks state
			setBlanks((prev) => [...prev, newBlank]);

			// Update blank numbers and expand the newly created blank
			requestAnimationFrame(() => {
				try {
					// Update all blank numbers first
					updateBlankNumbers();

					const insertedBlank = editorRef.current.querySelector(
						`[data-blank-id="${blankId}"]`
					);
					if (insertedBlank && insertedBlank.expandBlank) {
						insertedBlank.expandBlank();
					} else {
						editorRef.current.focus();
					}
				} catch (error) {
					console.error('Error expanding blank:', error);
					editorRef.current.focus();
				}
			});
		} catch (error) {
			console.error('Error inserting blank:', error);
		}

		// Hide popup
		setShowBlankPopup(false);
	}, [
		blanks,
		blankColors,
		createBlankElement,
		isCursorInsideBlank,
		updateBlankNumbers,
	]);

	// Handle paste (including images)
	const handlePaste = useCallback(
		(e) => {
			// Check for image in clipboard
			const items = e.clipboardData?.items;
			if (items) {
				for (let i = 0; i < items.length; i++) {
					if (items[i].type.indexOf('image') !== -1) {
						e.preventDefault();
						const blob = items[i].getAsFile();
						const reader = new FileReader();
						reader.onload = (event) => {
							insertImageIntoEditor(event.target.result);
						};
						reader.readAsDataURL(blob);
						return;
					}
				}
			}

			// Handle text paste
			e.preventDefault();
			const text = e.clipboardData.getData('text/plain');
			document.execCommand('insertText', false, text);
		},
		[insertImageIntoEditor]
	);

	// Add incorrect option
	const handleAddIncorrectOption = () => {
		setIncorrectOptions((prev) => {
			if (prev.length >= MAX_INCORRECT_OPTIONS) {
				spaceToast.warning(`Maximum ${MAX_INCORRECT_OPTIONS} incorrect options allowed. Please remove an option before adding a new one.`);
				return prev;
			}
			return [...prev, { id: Date.now(), text: '' }];
		});
	};

	// Remove incorrect option
	const handleRemoveIncorrectOption = (id) => {
		setIncorrectOptions((prev) => prev.filter((opt) => opt.id !== id));
	};

	// Change incorrect option text
	const handleIncorrectOptionChange = (id, value) => {
		const limited = (value ?? '').slice(0, 50);
		setIncorrectOptions((prev) =>
			prev.map((opt) => (opt.id === id ? { ...opt, text: limited } : opt))
		);
	};

	// Handle save
	const handleSave = async () => {
		if (!editorRef.current) return;

		// Validate
		const editorText = editorRef.current.textContent.trim();
		if (!editorText && blanks.length === 0) {
			spaceToast.error('Please enter the question text');
			return;
		}

		if (blanks.length === 0) {
			spaceToast.error('Please add at least one blank (use __ or [])');
			return;
		}

		const hasEmptyBlanks = blanks.some(
			(blank) => !blank.answer || !blank.answer.trim()
		);
		if (hasEmptyBlanks) {
			spaceToast.error('Please fill in all blank answers');
			return;
		}

		// Validate duplicate blank answers
		const blankAnswers = blanks.map(blank => (blank.answer || '').toLowerCase().trim());
		const duplicates = blankAnswers.filter((text, index) => text && blankAnswers.indexOf(text) !== index);
		if (duplicates.length > 0) {
			spaceToast.warning('Cannot create duplicate answers. Please ensure all blank answers are unique.');
			return;
		}

		// Validate: check if there are more than 10 incorrect options
		if (incorrectOptions.length > MAX_INCORRECT_OPTIONS) {
			spaceToast.warning(`Maximum ${MAX_INCORRECT_OPTIONS} incorrect options allowed. Please remove excess options before saving.`);
			return;
		}

		// Validate that at least one incorrect option is required
		const incorrectTexts = incorrectOptions
			.map(opt => (opt.text || '').toLowerCase().trim())
			.filter(text => text);
		if (incorrectTexts.length === 0) {
			spaceToast.warning('Please add at least one incorrect option');
			return;
		}

		// Validate duplicate incorrect options
		const duplicateIncorrect = incorrectTexts.filter((text, index) => incorrectTexts.indexOf(text) !== index);
		if (duplicateIncorrect.length > 0) {
			spaceToast.warning('Cannot create duplicate incorrect options. Please ensure all incorrect options are unique.');
			return;
		}

		// Validate that blank answers don't duplicate incorrect options
		const blankAnswersLower = blankAnswers.filter(text => text);
		const hasDuplicateWithIncorrect = blankAnswersLower.some(blankAnswer => incorrectTexts.includes(blankAnswer));
		if (hasDuplicateWithIncorrect) {
			spaceToast.warning('Cannot create duplicate answers. Blank answers cannot be the same as incorrect options.');
			return;
		}

		// Build backend format by traversing DOM (preserve HTML)
		let questionText = '';
		const contentData = [];
		let answerIndex = 1;

		// Process each child node
		const processNode = (node) => {
			if (node.nodeType === Node.TEXT_NODE) {
				return node.textContent;
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const blankId = node.getAttribute('data-blank-id');
				if (blankId) {
					// This is a blank - replace with placeholder
					const blank = blanks.find((b) => b.id === blankId);
					if (blank) {
						contentData.push({
							id: `ans${answerIndex}`,
							value: blank.answer,
							positionId: blank.positionId,
							correct: true,
						});
						answerIndex++;
						return `[[pos_${blank.positionId}]]`;
					}
					return '';
				} else {
					// Regular HTML element - preserve it
					const tagName = node.tagName.toLowerCase();

					// Special handling for image wrapper
					if (node.hasAttribute('data-image-wrapper')) {
						const img = node.querySelector('img');
						if (img) {
							const src = img.getAttribute('src');
							const imgWidth = img.style.width || '300px';

							// Get wrapper styles (display, width, margins for alignment)
							const wrapperDisplay = node.style.display || 'inline-block';
							const wrapperWidth = node.style.width || '';
							const marginLeft = node.style.marginLeft || '0';
							const marginRight = node.style.marginRight || '0';

							const wrapperStyle = `position:relative;display:${wrapperDisplay};${
								wrapperWidth ? `width:${wrapperWidth};` : 'max-width:100%;'
							}margin:10px ${marginRight} 10px ${marginLeft};user-select:none;`;

							return `<div class="image-wrapper" style="${wrapperStyle}"><img src="${src}" style="width:${imgWidth};height:auto;display:block;border-radius:8px;" /></div>`;
						}
						return '';
					}

					// Special handling for images - convert to img tag
					if (tagName === 'img') {
						const src = node.getAttribute('src');
						const style = node.getAttribute('style') || '';
						return `<img src="${src}" style="${style}" />`;
					}

					// Process child nodes (including tables to capture blanks inside)
					let innerContent = '';
					node.childNodes.forEach((child) => {
						innerContent += processNode(child);
					});

					// Don't wrap if it's a div or certain block elements from contentEditable
					if (tagName === 'div' || tagName === 'br') {
						return innerContent + (tagName === 'br' ? '<br>' : '');
					}

					// Wrap with appropriate HTML tag (preserve table wrapper so blanks inside are included)
					if (
						innerContent ||
						['ul', 'ol', 'li', 'h1', 'h2', 'h3'].includes(tagName)
					) {
						// Preserve basic inline style for table if present
						if (tagName === 'table') {
							const styleAttr = node.getAttribute('style');
							const styleText = styleAttr ? ` style="${styleAttr}"` : '';
							return `<table${styleText}>${innerContent}</table>`;
						}
						return `<${tagName}>${innerContent}</${tagName}>`;
					}

					return innerContent;
				}
			}
			return '';
		};

		// Process all child nodes
		editorRef.current.childNodes.forEach((node) => {
			questionText += processNode(node);
		});

		// Clean up multiple line breaks
		questionText = questionText.replace(/\n/g, '<br>');

		// Add incorrect options to contentData (those without positionId)
		const filteredIncorrectOptions = incorrectOptions
			.filter((opt) => opt.text.trim())
			.slice(0, MAX_INCORRECT_OPTIONS);
		filteredIncorrectOptions.forEach((option, index) => {
			contentData.push({
				id: `opt${answerIndex + index}`,
				value: option.text,
				positionId: null, // No position for incorrect options
				correct: false,
			});
		});

		const newQuestionData = {
			id: questionData?.id || Date.now(),
			type: 'DRAG_AND_DROP', // Use uppercase for API format
			title: 'Drag and Drop',
			questionText: questionText,
			content: {
				data: contentData,
			},
			incorrectOptions: filteredIncorrectOptions,
            weight: weight,
			// For backward compatibility
			question: questionText,
			blanks: blanks,
			correctAnswer: contentData
				.filter((d) => d.correct === true)
				.map((d) => d.value)
				.join(', '),
		};

		// Log HTML output for debugging
		console.log('=== DRAG DROP QUESTION HTML ===');
		console.log('Question HTML:', questionText);
		console.log('Content Data:', contentData);
		console.log('Full Question Data:', newQuestionData);
		console.log('================================');

		try {
			setSaving(true);
			const ret = onSave(newQuestionData);
			if (ret && typeof ret.then === 'function') {
				await ret;
				handleCancel();
			}
		} catch (e) {
			spaceToast.error('Failed to save question');
		} finally {
			setSaving(false);
		}
	};

	// Handle cancel
	const handleCancel = () => {
		console.log('DragDropModal - Cancelling, resetting state');
		if (editorRef.current) {
			editorRef.current.innerHTML = '';
		}
		setBlanks([]);
		setIncorrectOptions([]);
        setWeight(1);
		setSelectedImage(null);
		setShowBlankPopup(false);
		editorInitializedRef.current = false;
		onCancel();
	};

	// Track if editor has been initialized
	const editorInitializedRef = useRef(false);

	// Populate editor only when modal opens and state is ready
	useEffect(() => {
		if (!visible) {
			editorInitializedRef.current = false;
			return;
		}
		
		if (!editorRef.current) {
			console.log('DragDropModal - Waiting for editorRef');
			return;
		}
		
		// For new questions with no data yet, just clear
		if (editorContent.length === 0 && !questionData) {
			console.log('DragDropModal - No editor content for new question');
			editorInitializedRef.current = true;
			return;
		}
		
		// For editing: wait for content to be loaded from questionData
		if (questionData && editorContent.length === 0) {
			console.log('DragDropModal - Waiting for content to be parsed from questionData');
			return;
		}
		
		// If we already initialized with this data, skip
		if (editorInitializedRef.current) {
			console.log('DragDropModal - Already initialized, skipping');
			return;
		}

		console.log('DragDropModal - Initializing editor with:', { 
			editorContentLength: editorContent.length, 
			blanksLength: blanks.length,
			incorrectOptionsLength: incorrectOptions.length,
			hasQuestionData: !!questionData
		});

		// Clear editor first
		editorRef.current.innerHTML = '';

		if (editorContent.length === 0) {
			console.log('DragDropModal - No editor content to display');
			editorInitializedRef.current = true;
			return;
		}

		// Build editor DOM from editorContent
		let blankCounter = 0;
		editorContent.forEach((item, index) => {
			console.log('DragDropModal - Processing item:', item);
			if (item.type === 'text') {
				if (item.content) {
					editorRef.current.appendChild(document.createTextNode(item.content));
				}
			} else if (item.type === 'blank') {
				// Find the corresponding blank data
				const blankData = blanks.find((b) => b.id === item.id);
				if (blankData) {
					console.log('DragDropModal - Creating blank element for:', blankData);
					const blankElement = createBlankElement(blankData, blankCounter);
					editorRef.current.appendChild(blankElement);
					blankCounter++;
				} else {
					console.warn('DragDropModal - No blank data found for item:', item);
				}
			} else if (item.type === 'html') {
				// Parse HTML content and insert it, handling blank patterns inside
				if (item.content) {
					const tempDiv = document.createElement('div');
					tempDiv.innerHTML = item.content;
					
					// Process the HTML to convert blank patterns to blank elements
					const processHtmlNode = (node, parentElement) => {
						if (node.nodeType === Node.TEXT_NODE) {
							const text = node.textContent;
							const regex = /\[\[pos_([a-z0-9]+)\]\]/g;
							let lastIndex = 0;
							let match;
							let hasPatterns = false;
							
							while ((match = regex.exec(text)) !== null) {
								hasPatterns = true;
								// Add text before blank
								if (match.index > lastIndex) {
									const textContent = text.substring(lastIndex, match.index);
									if (textContent) {
										parentElement.appendChild(document.createTextNode(textContent));
									}
								}
								
								// Find blank data for this positionId
								const positionId = match[1];
								const blankData = blanks.find((b) => b.positionId === positionId);
								if (blankData) {
									const blankElement = createBlankElement(blankData, blankCounter);
									parentElement.appendChild(blankElement);
									blankCounter++;
								} else {
									// Keep the pattern as text if blank not found
									parentElement.appendChild(document.createTextNode(match[0]));
								}
								
								lastIndex = regex.lastIndex;
							}
							
							// Add remaining text or entire text if no patterns
							if (hasPatterns) {
								if (lastIndex < text.length) {
									const remainingText = text.substring(lastIndex);
									if (remainingText) {
										parentElement.appendChild(document.createTextNode(remainingText));
									}
								}
							} else {
								// No patterns found, append entire text
								if (text) {
									parentElement.appendChild(document.createTextNode(text));
								}
							}
						} else if (node.nodeType === Node.ELEMENT_NODE) {
							// Clone the node
							const clonedNode = node.cloneNode(false);
							
							// Process children recursively
							for (let i = 0; i < node.childNodes.length; i++) {
								processHtmlNode(node.childNodes[i], clonedNode);
							}
							
							// Append the cloned node to parent
							parentElement.appendChild(clonedNode);
						}
					};
					
					// Process all nodes in the HTML and append to editor
					for (let i = 0; i < tempDiv.childNodes.length; i++) {
						processHtmlNode(tempDiv.childNodes[i], editorRef.current);
					}
				}
			}
		});

		// Update blank numbers after populating editor
		requestAnimationFrame(() => {
			updateBlankNumbers();
		});

		editorInitializedRef.current = true;
		// Initialize last valid HTML and character count
		lastValidHtmlRef.current = editorRef.current ? editorRef.current.innerHTML : '';
		const initialPlain = editorRef.current ? (editorRef.current.textContent || '').trim() : '';
		setQuestionCharCount(initialPlain.length);
		console.log('DragDropModal - Editor initialization complete');
	}, [visible, editorContent, blanks, incorrectOptions.length, createBlankElement, updateBlankNumbers, blankColors, questionData]);

	// Get blanks ordered by DOM position
	const orderedBlanks = useMemo(() => {
		// If no editor ref or no blanks, return blanks directly (for initial render)
		if (!editorRef.current || blanks.length === 0) {
			return blanks;
		}

		const blankElements = editorRef.current.querySelectorAll('[data-blank-id]');
		const orderedIds = Array.from(blankElements).map((el) =>
			el.getAttribute('data-blank-id')
		);

		// If no elements found in DOM yet, return blanks directly (for initial render)
		if (orderedIds.length === 0) {
			return blanks;
		}

		// Create ordered array based on DOM order
		const ordered = orderedIds
			.map((id) => blanks.find((b) => b.id === id))
			.filter(Boolean); // Remove undefined entries

		return ordered;
	}, [blanks]);

	// Hide popup when clicking outside
	useEffect(() => {
		if (!showBlankPopup) return;

		const handleClickOutside = (e) => {
			// Check if click is on editor or popup
			if (
				editorRef.current &&
				!editorRef.current.contains(e.target) &&
				!e.target.closest('[data-blank-popup]')
			) {
				setShowBlankPopup(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showBlankPopup]);

    const pointsMenu = (
		<InputNumber
            value={weight}
            onChange={(v) => setWeight(Number(v) || 0)}
			min={0}
			max={100}
			style={{ width: 100 }}
		/>
	);

	return (
		<Modal
			title={
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '12px',
					}}>
					<ThunderboltOutlined
						style={{
							fontSize: '30px',
							color: '#1890ff',
							animation: 'pulse 2s infinite',
						}}
					/>
					<span style={{ fontSize: '24px', fontWeight: 600 }}>
						{questionData ? 'Edit Drag and Drop Question' : 'Create Drag and Drop Question'}
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
				background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%)',
			}}
			key={questionData?.id || 'new'}
			destroyOnClose>
			{/* Top Toolbar */}
			<div
				style={{
					position: 'sticky',
					top: 0,
					left: 0,
					right: 0,
					zIndex: 1000,
					background: 'rgba(255, 255, 255, 0.95)',
					backdropFilter: 'blur(20px)',
					borderBottom: '2px solid rgba(24, 144, 255, 0.1)',
					padding: '16px 24px',
					boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
				}}>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}>
					<div
						style={{
							fontSize: '14px',
							color: '#666',
							background: 'rgba(24, 144, 255, 0.1)',
							padding: '8px 16px',
							borderRadius: '8px',
							fontWeight: 500,
						}}>
						💡 Tips: Click{' '}
						<span
							style={{
								background: 'rgba(24, 144, 255, 0.2)',
								padding: '2px 8px',
								borderRadius: '4px',
								fontWeight: 600,
								color: '#1890ff',
							}}>
							+ Blank
						</span>{' '}
						button at cursor position to insert blank • Or type{' '}
						<code
							style={{
								background: 'rgba(24, 144, 255, 0.2)',
								padding: '2px 8px',
								borderRadius: '4px',
								fontWeight: 600,
								color: '#1890ff',
							}}>
							__
						</code>{' '}
						or{' '}
						<code
							style={{
								background: 'rgba(24, 144, 255, 0.2)',
								padding: '2px 8px',
								borderRadius: '4px',
								fontWeight: 600,
								color: '#1890ff',
							}}>
							[]
						</code>
					</div>

					<div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<CheckOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#666' }}>Weight</span>
							{pointsMenu}
						</div>

						<Button
							type='primary'
							onClick={handleSave}
							loading={saving}
							size='large'
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
							}}>
							<SaveOutlined /> Save Question
						</Button>
					</div>
				</div>
			</div>

			{/* Main Editor Area */}
			<div
				style={{
					padding: '24px',
					height: 'calc(100vh - 210px)',
					overflowY: 'auto',
				}}>
				<div
					style={{
						background: 'rgba(255, 255, 255, 0.95)',
						borderRadius: '16px',
						padding: '20px',
						boxShadow: '0 8px 32px rgba(24, 144, 255, 0.15)',
						border: '2px solid rgba(24, 144, 255, 0.1)',
						backdropFilter: 'blur(20px)',
						position: 'relative',
					}}>
					{/* Decorative background */}
					<div
						style={{
							position: 'absolute',
							top: -50,
							right: -50,
							width: '200px',
							height: '200px',
							background: '#1890ff',
							opacity: 0.05,
							borderRadius: '50%',
							filter: 'blur(40px)',
						}}
					/>

					{/* Formatting Toolbar */}
					<div
						style={{
							display: 'flex',
							gap: '4px',
							marginBottom: '10px',
							padding: '10px',
							background: 'rgba(255, 255, 255, 0.95)',
							borderRadius: '10px',
							border: '2px solid rgba(24, 144, 255, 0.15)',
							flexWrap: 'wrap',
							position: 'relative',
							zIndex: 2,
						}}>
						{/* Heading Dropdown */}
						<Dropdown
							menu={{
								items: [
									{
										key: 'paragraph',
										label: <span style={{ color: '#000000' }}>Paragraph</span>,
										onClick: () => handleHeading('paragraph'),
									},
									{
										key: 'h1',
										label: (
											<span
												style={{
													color: '#000000',
													fontWeight: 700,
													fontSize: '16px',
												}}>
												Heading 1
											</span>
										),
										onClick: () => handleHeading('h1'),
									},
									{
										key: 'h2',
										label: (
											<span
												style={{
													color: '#000000',
													fontWeight: 600,
													fontSize: '15px',
												}}>
												Heading 2
											</span>
										),
										onClick: () => handleHeading('h2'),
									},
									{
										key: 'h3',
										label: (
											<span
												style={{
													color: '#000000',
													fontWeight: 600,
													fontSize: '14px',
												}}>
												Heading 3
											</span>
										),
										onClick: () => handleHeading('h3'),
									},
								],
								style: {
									background: '#ffffff',
								},
							}}
							trigger={['click']}
							overlayStyle={{
								zIndex: 9999,
							}}>
							<Tooltip title='Heading'>
								<Button
									icon={<FontSizeOutlined />}
									style={{
										border: '1px solid rgba(24, 144, 255, 0.2)',
										borderRadius: '6px',
										height: '36px',
										width: '36px',
									}}
								/>
							</Tooltip>
						</Dropdown>
						<div
							style={{
								width: '1px',
								background: 'rgba(24, 144, 255, 0.2)',
								margin: '0 8px',
							}}
						/>

						{/* Text Formatting */}
						<Tooltip title='Bold'>
							<Button
								icon={<BoldOutlined />}
								onClick={() => handleFormat('bold')}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px',
								}}
							/>
						</Tooltip>
						<Tooltip title='Italic'>
							<Button
								icon={<ItalicOutlined />}
								onClick={() => handleFormat('italic')}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px',
								}}
							/>
						</Tooltip>
						<Tooltip title='Underline'>
							<Button
								icon={<UnderlineOutlined />}
								onClick={() => handleFormat('underline')}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px',
								}}
							/>
						</Tooltip>
						<div
							style={{
								width: '1px',
								background: 'rgba(24, 144, 255, 0.2)',
								margin: '0 8px',
							}}
						/>

						{/* Link */}
						<Tooltip title='Insert Link'>
							<Button
								icon={<LinkOutlined />}
								onClick={handleInsertLink}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px',
								}}
							/>
						</Tooltip>

						{/* Image Upload */}
						<Tooltip title='Upload Image'>
							<Button
								icon={<PictureOutlined />}
								onClick={handleImageUpload}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px',
								}}
							/>
						</Tooltip>
						<div
							style={{
								width: '1px',
								background: 'rgba(24, 144, 255, 0.2)',
								margin: '0 8px',
							}}
						/>

						{/* Lists */}
						<Tooltip title='Ordered List'>
							<Button
								icon={<OrderedListOutlined />}
								onClick={() => handleFormat('insertOrderedList')}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px',
								}}
							/>
						</Tooltip>
						<Tooltip title='Unordered List'>
							<Button
								icon={<UnorderedListOutlined />}
								onClick={() => handleFormat('insertUnorderedList')}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px',
								}}
							/>
						</Tooltip>
						<div
							style={{
								width: '1px',
								background: 'rgba(24, 144, 255, 0.2)',
								margin: '0 8px',
							}}
						/>

						{/* Table Grid Selector */}
						<Dropdown
							open={tableDropdownOpen}
							onOpenChange={(open) => {
								setTableDropdownOpen(open);
								if (!open) {
									setHoveredCell({ row: 0, col: 0 });
								}
							}}
							trigger={['click']}
							overlayStyle={{ zIndex: 9999 }}
							dropdownRender={() => (
								<div
									style={{
										background: '#ffffff',
										padding: '12px',
										borderRadius: '8px',
										boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
										border: '1px solid rgba(24, 144, 255, 0.2)',
									}}
									onMouseLeave={() => setHoveredCell({ row: 0, col: 0 })}>
									<div
										style={{
											fontSize: '12px',
											color: '#666',
											marginBottom: '8px',
											textAlign: 'center',
											fontWeight: 500,
											height: '16px',
										}}>
										{hoveredCell.row > 0 && hoveredCell.col > 0
											? `${hoveredCell.row} x ${hoveredCell.col} Table`
											: 'Select table size'}
									</div>
									<div
										style={{
											display: 'grid',
											gridTemplateColumns: 'repeat(10, 1fr)',
											gap: '2px',
										}}>
										{Array.from({ length: 100 }, (_, index) => {
											const row = Math.floor(index / 10) + 1;
											const col = (index % 10) + 1;
											const isHovered =
												row <= hoveredCell.row && col <= hoveredCell.col;

											return (
												<div
													key={index}
													onMouseEnter={() => setHoveredCell({ row, col })}
													onClick={() => {
														if (hoveredCell.row > 0 && hoveredCell.col > 0) {
															handleInsertTable(
																hoveredCell.row,
																hoveredCell.col
															);
														}
													}}
													style={{
														width: '20px',
														height: '20px',
														border: '1px solid #000000',
														background: isHovered ? '#1890ff' : '#ffffff',
														cursor: 'pointer',
														transition: 'all 0.1s ease',
														borderRadius: '2px',
													}}
												/>
											);
										})}
									</div>
								</div>
							)}>
							<Tooltip title='Insert Table'>
								<Button
									icon={<TableOutlined />}
									style={{
										border: '1px solid rgba(24, 144, 255, 0.2)',
										borderRadius: '6px',
										height: '36px',
										width: '36px',
									}}
								/>
							</Tooltip>
						</Dropdown>
						<div
							style={{
								width: '1px',
								background: 'rgba(24, 144, 255, 0.2)',
								margin: '0 8px',
							}}
						/>

						{/* Image Alignment (only show when image is selected) */}
						{selectedImage && (
							<>
								<Tooltip title='Align Left'>
									<Button
										icon={<AlignLeftOutlined />}
										onClick={() => handleImageAlign('left')}
										style={{
											border: '1px solid rgba(24, 144, 255, 0.2)',
											borderRadius: '6px',
											height: '36px',
											width: '36px',
											background: 'rgba(82, 196, 26, 0.1)',
										}}
									/>
								</Tooltip>
								<Tooltip title='Align Center'>
									<Button
										icon={<AlignCenterOutlined />}
										onClick={() => handleImageAlign('center')}
										style={{
											border: '1px solid rgba(24, 144, 255, 0.2)',
											borderRadius: '6px',
											height: '36px',
											width: '36px',
											background: 'rgba(82, 196, 26, 0.1)',
										}}
									/>
								</Tooltip>
								<Tooltip title='Align Right'>
									<Button
										icon={<AlignRightOutlined />}
										onClick={() => handleImageAlign('right')}
										style={{
											border: '1px solid rgba(24, 144, 255, 0.2)',
											borderRadius: '6px',
											height: '36px',
											width: '36px',
											background: 'rgba(82, 196, 26, 0.1)',
										}}
									/>
								</Tooltip>
								<div
									style={{
										width: '1px',
										background: 'rgba(24, 144, 255, 0.2)',
										margin: '0 8px',
									}}
								/>
							</>
						)}

						{/* Undo/Redo */}
						<Tooltip title='Undo'>
							<Button
								icon={<UndoOutlined />}
								onClick={() => handleFormat('undo')}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px',
								}}
							/>
						</Tooltip>
						<Tooltip title='Redo'>
							<Button
								icon={<RedoOutlined />}
								onClick={() => handleFormat('redo')}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px',
								}}
							/>
						</Tooltip>
					</div>

					{/* Hidden File Input for Image Upload */}
					<input
						ref={fileInputRef}
						type='file'
						accept='image/*'
						style={{ display: 'none' }}
						onChange={handleFileChange}
					/>

					{/* Editor */}
						<div style={{ position: 'relative', marginBottom: '24px' }}>
						<div
							ref={editorRef}
							contentEditable
							onInput={handleEditorInput}
							onPaste={handlePaste}
							onClick={handleEditorClick}
							onFocus={handleEditorFocus}
							onKeyDown={handleEditorKeyDown}
							onKeyUp={updatePopupPosition}
							suppressContentEditableWarning
							style={{
								minHeight: '180px',
								maxHeight: '180px',
								overflowY: 'auto',
								padding: '16px',
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
								wordWrap: 'break-word',
								cursor: 'text',
								userSelect: 'text',
								WebkitUserSelect: 'text',
							}}
							data-placeholder='Type your question here... The + Blank button will follow your cursor'
						/>

							{/* Character Counter for Question (600 max) */}
							<div
								style={{
									marginTop: '6px',
									marginRight: '16px',
									textAlign: 'right',
									fontSize: '12px',
									fontWeight: 600,
									color: questionCharCount >= 600 ? '#ff4d4f' : '#595959',
								}}>
								{`${Math.min(questionCharCount, 600)}/600`}
							</div>

						{/* Blank Popup */}
						{showBlankPopup && (
							<div
								data-blank-popup='true'
								style={{
									position: 'absolute',
									left: `${popupPosition.x}px`,
									top: `${popupPosition.y}px`,
									zIndex: 1000,
									background: 'white',
									borderRadius: '8px',
									boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
									border: '2px solid #1890ff',
									padding: '4px',
								}}
								className='blank-popup-fade-in'>
								<Button
									type='primary'
									icon={<ThunderboltOutlined />}
									onClick={insertBlankAtCursor}
									size='small'
									style={{
										background: 'linear-gradient(135deg, #66AEFF, #3C99FF)',
										border: 'none',
										fontWeight: 600,
										display: 'flex',
										alignItems: 'center',
										gap: '4px',
										color: '#000000',
									}}>
									+ Blank
								</Button>
							</div>
						)}
					</div>

					{/* Hint Text */}
					<div
						style={{
							textAlign: 'center',
							color: '#999',
							fontSize: '14px',
							marginBottom: '24px',
							fontStyle: 'italic',
						}}>
						Click the floating "+ Blank" button or type '__' or '[]' to add
						blank
					</div>

					{/* Options Section */}
					<div
						style={{
							display: 'flex',
							gap: '24px',
							marginTop: '32px',
						}}>
						{/* Correct Options */}
						<div style={{ flex: 1 }}>
							<div
								style={{
									fontSize: '16px',
									fontWeight: 600,
									color: '#333',
									marginBottom: '12px',
								}}>
								Correct options
							</div>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									gap: '8px',
								}}>
									{orderedBlanks.length > 0 ? (
										orderedBlanks.map((blank, index) => (
											<div
												key={blank.id}
												style={{
													padding: '12px 16px',
													background: 'white',
													border: `2px solid ${blank.color}`,
													borderRadius: '8px',
													fontSize: '14px',
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
												}}>
												<span
													style={{
														width: '24px',
														height: '24px',
														borderRadius: '50%',
														background: blank.color,
														color: 'white',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: '12px',
														fontWeight: 700,
														flexShrink: 0,
														marginTop: '2px',
												}}>
													{index + 1}
												</span>
										<Input
																value={(blank.answer || '').slice(0, 50)}
																onChange={(e) => {
																	const v = (e.target.value || '').slice(0, 50);
												handleBlankAnswerChange(blank.id, v);
											}}
																maxLength={50}
											placeholder={'Type correct option'}
											style={{
												flex: 1,
												border: 'none',
												outline: 'none',
												boxShadow: 'none',
												lineHeight: '27px',
											}}
										/>
										<span
											style={{
												fontSize: '12px',
												color: '#999',
												whiteSpace: 'nowrap',
											}}
										>
																{`${(blank.answer || '').slice(0, 50).length}/50`}
										</span>
											</div>
										))
								) : (
									<div
										style={{
											color: '#999',
											fontSize: '14px',
											fontStyle: 'italic',
										}}>
										No blanks yet
									</div>
								)}
							</div>
						</div>

						{/* Incorrect Options */}
						<div style={{ flex: 1 }}>
							<div
								style={{
									fontSize: '16px',
									fontWeight: 600,
									color: '#333',
									marginBottom: '12px',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
								}}>
								Incorrect options ({incorrectOptions.length})
								<span
									style={{
										width: '20px',
										height: '20px',
										borderRadius: '50%',
										background: '#d9d9d9',
										color: 'white',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '10px',
										fontWeight: 700,
									}}>
									?
								</span>
							</div>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									gap: '8px',
								}}>
								{incorrectOptions.length > 0 ? (
									incorrectOptions.map((option, index) => (
									<div
										key={option.id}
										style={{
											padding: '8px 12px',
											background: 'white',
											border: '2px solid #d9d9d9',
											borderRadius: '8px',
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
										}}>
											<Input
																value={(option.text || '').slice(0, 50)}
												onChange={(e) =>
													handleIncorrectOptionChange(option.id, e.target.value)
												}
																maxLength={50}
												placeholder={`Incorrect option ${index + 1}`}
												style={{
													flex: 1,
													border: 'none',
													outline: 'none',
													boxShadow: 'none',
													lineHeight: '27px',
												}}
											/>
											<span
												style={{
													fontSize: '12px',
													color: '#999',
													whiteSpace: 'nowrap',
												}}
											>
																{`${(option.text || '').slice(0, 50).length}/50`}
											</span>
										<Button
											type='text'
											icon={<DeleteOutlined />}
											onClick={() => handleRemoveIncorrectOption(option.id)}
											size='small'
											danger
											style={{ flexShrink: 0 }}
										/>
									</div>
									))
								) : (
									<div
										style={{
											color: '#999',
											fontSize: '14px',
											fontStyle: 'italic',
										}}>
										No incorrect options yet
									</div>
								)}
				<Button
									type='dashed'
									icon={<PlusOutlined />}
									onClick={handleAddIncorrectOption}
						disabled={incorrectOptions.length >= MAX_INCORRECT_OPTIONS}
									style={{
										borderColor: '#d9d9d9',
										color: '#666',
										width: '100%',
									}}>
									Add
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Modal>
	);
};

export default DragDropModal;
