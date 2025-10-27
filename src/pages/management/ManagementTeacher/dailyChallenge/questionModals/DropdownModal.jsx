import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Modal, Button, Select, Input, Tooltip, Dropdown } from 'antd';
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
	return function(...args) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => inThrottle = false, limit);
		}
	};
};

const DropdownModal = ({ visible, onCancel, onSave, questionData = null }) => {
	const [editorContent, setEditorContent] = useState([]);
	const [dropdowns, setDropdowns] = useState([]);
	const [points, setPoints] = useState(1);
	const [selectedImage, setSelectedImage] = useState(null);
	const [tableDropdownOpen, setTableDropdownOpen] = useState(false);
	const [hoveredCell, setHoveredCell] = useState({ row: 0, col: 0 });
	const [showDropdownPopup, setShowDropdownPopup] = useState(false);
	const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
	const editorRef = useRef(null);
	const fileInputRef = useRef(null);
	const savedRangeRef = useRef(null);

	// Colors for dropdowns - matching ReorderModal color palette
	const dropdownColors = useMemo(() => [
		'#e63946', // Red
		'#2563eb', // Blue
		'#059669', // Green
		'#9333ea', // Purple
		'#ea580c', // Orange
		'#dc2626', // Bright Red
		'#0891b2', // Cyan
		'#d946ef', // Magenta
		'#84cc16', // Lime
		'#f59e0b', // Amber
	], []);

	// Parse backend format to editor format
	const parseQuestionText = useCallback((questionText, contentData) => {
		const parsed = [];
		const dropsData = [];
		
		// Remove <br> tags and split by dropdown pattern
		const cleanText = questionText.replace(/<br\s*\/?>/gi, '\n');
		const regex = /\[\[pos_([a-z0-9]+)\]\]/g;
		let lastIndex = 0;
		let match;

		while ((match = regex.exec(cleanText)) !== null) {
			// Add text before dropdown
			if (match.index > lastIndex) {
				const textContent = cleanText.substring(lastIndex, match.index);
				if (textContent) {
					parsed.push({ type: 'text', content: textContent, id: `text-${Date.now()}-${lastIndex}` });
				}
			}

			// Add dropdown
			const positionId = match[1];
			const dropdownOptions = contentData.filter(item => item.positionId === positionId);
			const correctOption = dropdownOptions.find(opt => opt.correct === true);
			const incorrectOptions = dropdownOptions.filter(opt => opt.correct === false);
			
			const dropdownId = `dropdown-${Date.now()}-${positionId}`;
			
			parsed.push({
				type: 'dropdown',
				id: dropdownId,
				positionId: positionId,
				correctAnswer: correctOption?.value || '',
				incorrectOptions: incorrectOptions.map(opt => ({ id: opt.id, text: opt.value }))
			});

			dropsData.push({
				id: dropdownId,
				positionId: positionId,
				correctAnswer: correctOption?.value || '',
				incorrectOptions: incorrectOptions.map(opt => ({ id: opt.id, text: opt.value })),
				color: dropdownColors[dropsData.length % dropdownColors.length]
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
		setDropdowns(dropsData);
	}, [dropdownColors]);

	// Initialize editor content from questionData
	useEffect(() => {
		if (visible) {
			if (questionData?.questionText && questionData?.content?.data) {
				// Parse existing question
				parseQuestionText(questionData.questionText, questionData.content.data);
			} else {
				// New question
				setEditorContent([{ type: 'text', content: '', id: Date.now() }]);
				setDropdowns([]);
			}
			setPoints(questionData?.points || 1);
		}
	}, [questionData, visible, parseQuestionText]);

	// Generate position ID
	const generatePositionId = () => {
		return Math.random().toString(36).substring(2, 8);
	};

	// Check if cursor is inside a dropdown element
	const isCursorInsideDropdown = useCallback(() => {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return false;

		let node = selection.anchorNode;
		while (node && node !== editorRef.current) {
			if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('data-dropdown-id')) {
				return true;
			}
			node = node.parentNode;
		}
		return false;
	}, []);

	// Handle dropdown answer change
	const handleDropdownAnswerChange = useCallback((dropdownId, value) => {
		setDropdowns(prev => prev.map(dropdown => 
			dropdown.id === dropdownId ? { ...dropdown, correctAnswer: value } : dropdown
		));
	}, []);

	// Update dropdown numbers based on DOM order
	const updateDropdownNumbers = useCallback(() => {
		if (!editorRef.current) return;
		
		const dropdownElements = editorRef.current.querySelectorAll('[data-dropdown-id]');
		dropdownElements.forEach((element, index) => {
			const badge = element.querySelector('.dropdown-badge');
			if (badge) {
				badge.textContent = index + 1;
			}
		});
	}, []);

	// Handle delete dropdown from DOM
	const handleDeleteDropdownElement = useCallback((dropdownId) => {
		console.log('Attempting to delete dropdown:', dropdownId);
		
		if (!editorRef.current) {
			console.error('Editor ref not available');
			return;
		}

		// Find and remove the dropdown element from DOM
		const dropdownElement = editorRef.current.querySelector(`[data-dropdown-id="${dropdownId}"]`);
		console.log('Found dropdown element:', dropdownElement);
		
		if (dropdownElement) {
			dropdownElement.remove();
			console.log('Dropdown element removed from DOM');
		} else {
			console.warn('Dropdown element not found in DOM');
		}

		// Update state
		setDropdowns(prev => {
			const filtered = prev.filter(dropdown => dropdown.id !== dropdownId);
			console.log('Updated dropdowns state:', filtered);
			return filtered;
		});
		
		// Update dropdown numbers after deletion
		requestAnimationFrame(() => {
			updateDropdownNumbers();
		});
		
		console.log('Dropdown removed');
		
		// Refocus editor
		if (editorRef.current) {
			editorRef.current.focus();
		}
	}, [updateDropdownNumbers]);

	// Create dropdown element
	const createDropdownElement = useCallback((dropdown, index) => {
		const span = document.createElement('span');
		span.setAttribute('contenteditable', 'false');
		span.setAttribute('data-dropdown-id', dropdown.id);
		span.style.cssText = `
			display: inline-flex;
			align-items: center;
			margin: 0 4px;
			position: relative;
			vertical-align: middle;
			user-select: none;
			-webkit-user-select: none;
		`;

	const chip = document.createElement('span');
	chip.style.cssText = `
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		background: linear-gradient(135deg, ${dropdown.color}20, ${dropdown.color}40);
		border: 2px solid ${dropdown.color};
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		color: ${dropdown.color};
		transition: all 0.2s ease;
		cursor: pointer;
		min-width: 0;
		max-width: 220px;
	`;

		// Number badge
		const badge = document.createElement('span');
		badge.className = 'dropdown-badge';
		badge.style.cssText = `
			width: 20px;
			height: 20px;
			border-radius: 50%;
			background: ${dropdown.color};
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
	answerText.className = 'dropdown-answer-text';
	answerText.style.cssText = `
		color: #333;
		font-weight: 500;
		font-size: 14px;
		display: inline-block;
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		vertical-align: middle;
	`;
	answerText.textContent = dropdown.correctAnswer || '';

		// Input field (hidden by default in compact mode)
		const input = document.createElement('input');
		input.type = 'text';
		input.placeholder = 'type correct answer...';
		input.value = dropdown.correctAnswer || '';
		input.className = 'dropdown-input';
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
	// Optimize input handling with debounce for state update
	let inputTimeout;
	input.addEventListener('input', (e) => {
		const newValue = e.target.value;
		// Update answer text in real-time (instant visual feedback)
		answerText.textContent = newValue || '';

		// Debounce state update to reduce re-renders
		clearTimeout(inputTimeout);
		inputTimeout = setTimeout(() => {
			handleDropdownAnswerChange(dropdown.id, newValue);
		}, 100);
	});
		input.addEventListener('click', (e) => {
			e.stopPropagation();
		});
	input.addEventListener('blur', (e) => {
		// If input is empty, delete the dropdown
		if (!e.target.value || !e.target.value.trim()) {
			handleDeleteDropdownElement(dropdown.id);
			return;
		}
		// When input loses focus, collapse back to compact mode
		collapseDropdown();
	});

		// Delete button (always visible for easier deletion)
		const deleteBtn = document.createElement('button');
		deleteBtn.innerHTML = '×';
		deleteBtn.className = 'dropdown-delete-btn';
		deleteBtn.type = 'button'; // Prevent form submission
		deleteBtn.style.cssText = `
			border: none;
			background: rgba(255,77,79,0.9);
			color: white;
			border-radius: 4px;
			width: 20px;
			height: 20px;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			transition: all 0.2s ease;
			font-size: 14px;
			font-weight: bold;
			position: relative;
			z-index: 10;
			opacity: 0.7;
		`;
		// Add multiple event listeners to ensure click is captured
		const handleDeleteClick = (e) => {
			e.preventDefault();
			e.stopPropagation();
			console.log('Delete button clicked for dropdown:', dropdown.id);
			handleDeleteDropdownElement(dropdown.id);
		};
		
		deleteBtn.addEventListener('click', handleDeleteClick);
		deleteBtn.addEventListener('mousedown', handleDeleteClick);
		deleteBtn.addEventListener('touchstart', handleDeleteClick);
		deleteBtn.addEventListener('mouseenter', (e) => {
			e.target.style.background = 'rgba(255,77,79,1)';
			e.target.style.transform = 'scale(1.2)';
			e.target.style.opacity = '1';
		});
		deleteBtn.addEventListener('mouseleave', (e) => {
			e.target.style.background = 'rgba(255,77,79,0.9)';
			e.target.style.transform = 'scale(1)';
			e.target.style.opacity = '0.7';
		});

		// Function to expand dropdown (show input)
		const expandDropdown = () => {
			console.log('Expanding dropdown:', dropdown.id);
			answerText.style.display = 'none';
			input.style.display = 'inline';
			console.log('Input field displayed');
			setTimeout(() => input.focus(), 10);
		};

		// Function to collapse dropdown (show only answer text)
		const collapseDropdown = () => {
			console.log('Collapsing dropdown:', dropdown.id);
			answerText.style.display = 'inline';
			input.style.display = 'none';
		};

		// Click on chip to expand
		chip.addEventListener('click', (e) => {
			e.stopPropagation();
			expandDropdown();
		});

		chip.appendChild(badge);
		chip.appendChild(answerText);
		chip.appendChild(input);
		chip.appendChild(deleteBtn);
		span.appendChild(chip);

		// Store expand function for external use
		span.expandDropdown = expandDropdown;

		return span;
	}, [handleDropdownAnswerChange, handleDeleteDropdownElement]);

	// Find and replace pattern in text nodes without affecting existing dropdowns
	const findAndReplacePattern = useCallback((element) => {
		// Walk through all child nodes
		const walker = document.createTreeWalker(
			element,
			NodeFilter.SHOW_TEXT,
			null,
			false
		);

		let textNode;

		while ((textNode = walker.nextNode())) {
			// Check if this text node is inside a dropdown element
			let parentNode = textNode.parentNode;
			let isInsideDropdown = false;
			while (parentNode && parentNode !== element) {
				if (parentNode.hasAttribute && parentNode.hasAttribute('data-dropdown-id')) {
					isInsideDropdown = true;
					break;
				}
				parentNode = parentNode.parentNode;
			}

			// Skip if inside a dropdown
			if (isInsideDropdown) continue;

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

				// Create dropdown
				const positionId = generatePositionId();
				const dropdownId = `dropdown-${Date.now()}-${positionId}`;
				const color = dropdownColors[dropdowns.length % dropdownColors.length];

				const newDropdown = {
					id: dropdownId,
					positionId: positionId,
					correctAnswer: '',
					incorrectOptions: [],
					color: color
				};

				// Split the text node
				let beforePattern = text.substring(0, patternIndex);
				const afterPattern = text.substring(patternIndex + patternLength);

				// Add space before dropdown if text before doesn't end with space
				if (beforePattern && !beforePattern.endsWith(' ')) {
					beforePattern += ' ';
				}

				// Create dropdown element
				const dropdownElement = createDropdownElement(newDropdown, dropdowns.length);

				// Get parent node
				const parent = textNode.parentNode;

				// Create document fragment to hold new nodes
				const fragment = document.createDocumentFragment();

				// Add text before pattern (if any)
				if (beforePattern) {
					fragment.appendChild(document.createTextNode(beforePattern));
				}

				// Add dropdown chip
				fragment.appendChild(dropdownElement);

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

				// Update dropdowns state
				setDropdowns(prev => [...prev, newDropdown]);

				// Update dropdown numbers and expand the newly created dropdown
				requestAnimationFrame(() => {
					try {
						// Update all dropdown numbers first
						updateDropdownNumbers();
						
						// Find the newly inserted dropdown in DOM
						const insertedDropdown = element.querySelector(`[data-dropdown-id="${dropdownId}"]`);
						if (insertedDropdown && insertedDropdown.expandDropdown) {
							// Call the expand function to show input field
							insertedDropdown.expandDropdown();
							return;
						}
						// Fallback: focus on editor
						element.focus();
					} catch (error) {
						console.error('Error expanding dropdown:', error);
						element.focus();
					}
				});

				// Only process one pattern at a time
				break;
			}
		}
	}, [dropdowns, dropdownColors, createDropdownElement, setDropdowns, updateDropdownNumbers]);

	// Debounced pattern finder - run after user stops typing for 50ms
	const findPatternDebounced = useMemo(
		() => debounce((element) => {
			if (!isCursorInsideDropdown()) {
				findAndReplacePattern(element);
			}
		}, 50),
		[isCursorInsideDropdown, findAndReplacePattern]
	);


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
	const insertImageIntoEditor = useCallback((base64Image) => {
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
		
		handles.forEach(position => {
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
		wrapper.onclick = function(e) {
			e.stopPropagation();
			setSelectedImage(img);
			// Show handles and add visual feedback
			Object.values(handleElements).forEach(h => h.style.opacity = '1');
			wrapper.style.outline = '2px solid #1890ff';
			wrapper.style.outlineOffset = '2px';
		};
		
		// Hide handles on mouse leave
		wrapper.onmouseleave = function() {
			if (selectedImage !== img) {
				Object.values(handleElements).forEach(h => h.style.opacity = '0');
			}
		};
		
		// Show handles on mouse enter
		wrapper.onmouseenter = function() {
			Object.values(handleElements).forEach(h => h.style.opacity = '1');
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
	}, [selectedImage]);

	// Handle image upload from file
	const handleImageUpload = useCallback(() => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	}, []);

	const handleFileChange = useCallback((e) => {
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
	}, [insertImageIntoEditor]);

	// Handle paste (including images)
	const handlePaste = useCallback((e) => {
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
	}, [insertImageIntoEditor]);

	// Handle image alignment
	const handleImageAlign = useCallback((alignment) => {
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
		
		switch(alignment) {
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
	}, [selectedImage]);


	// Core popup position update function
	const updatePopupPositionCore = useCallback(() => {
		if (!editorRef.current) return;

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			setShowDropdownPopup(false);
			return;
		}

		// Don't show popup if cursor is inside a dropdown
		if (isCursorInsideDropdown()) {
			setShowDropdownPopup(false);
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
			setShowDropdownPopup(true);
		} else {
			const popupX = rect.left - editorRect.left;
			const popupY = rect.top - editorRect.top + rect.height + 5;

			setPopupPosition({ x: popupX, y: popupY });
			savedRangeRef.current = range.cloneRange();
			setShowDropdownPopup(true);
		}
	}, [isCursorInsideDropdown]);

	// Debounced version - only update popup after user stops typing for 150ms
	const updatePopupPosition = useMemo(
		() => debounce(updatePopupPositionCore, 150),
		[updatePopupPositionCore]
	);

	// Handle table insertion
	const handleInsertTable = useCallback((numRows, numCols) => {
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
						setTimeout(() => {
							updatePopupPosition();
						}, 10);
					});
					td.addEventListener('keyup', () => {
						updatePopupPosition();
					});
					td.addEventListener('focus', () => {
						setTimeout(() => {
							updatePopupPosition();
						}, 50);
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
	}, [updatePopupPosition]);

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
	const handleEditorClick = useCallback((e) => {
		// If clicked on something other than an image, deselect
		if (e.target.tagName !== 'IMG') {
			// Remove outline from all image wrappers
			if (editorRef.current) {
				const wrappers = editorRef.current.querySelectorAll('[data-image-wrapper]');
				wrappers.forEach(wrapper => {
					wrapper.style.outline = 'none';
				});
			}
			setSelectedImage(null);
		}
		
		// Check if click is inside editor (including table cells)
		const isInEditor = editorRef.current && (
			e.target === editorRef.current || 
			editorRef.current.contains(e.target)
		);
		
		// Only set cursor if click is inside editor
		if (isInEditor) {
			// Don't interfere if user is selecting text (check after a small delay to allow for drag-to-select)
			requestAnimationFrame(() => {
				const selection = window.getSelection();
				if (selection && selection.toString().length === 0) {
					// Update popup position at cursor
					updatePopupPosition();
				}
			});
		}
	}, [updatePopupPosition]);

	// Handle editor focus - show popup at cursor
	const handleEditorFocus = useCallback(() => {
		requestAnimationFrame(() => {
			updatePopupPosition();
		});
	}, [updatePopupPosition]);

	// Handle keydown to delete selected image
	const handleEditorKeyDown = useCallback((e) => {
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
	}, [selectedImage]);


	// Throttled dropdown check - only run once every 100ms
	const checkRemovedDropdownsThrottled = useMemo(
		() => throttle((element) => {
			const currentDropdownIds = new Set();
			const dropdownElements = element.querySelectorAll('[data-dropdown-id]');
			dropdownElements.forEach(el => {
				const dropdownId = el.getAttribute('data-dropdown-id');
				if (dropdownId) currentDropdownIds.add(dropdownId);
			});

			// Remove dropdowns from state that no longer exist in DOM
			setDropdowns(prev => {
				const filtered = prev.filter(dropdown => currentDropdownIds.has(dropdown.id));
				if (filtered.length !== prev.length) {
					// Some dropdowns were removed - update numbers
					requestAnimationFrame(() => {
						updateDropdownNumbers();
					});
					return filtered;
				}
				return prev;
			});
		}, 100),
		[setDropdowns, updateDropdownNumbers]
	);

	// Handle text input in editor
	const handleEditorInput = useCallback((e) => {
		const element = e.currentTarget;

		// Check if any dropdowns were removed from DOM (throttled)
		checkRemovedDropdownsThrottled(element);

		// Don't allow creating dropdowns inside another dropdown
		if (!isCursorInsideDropdown()) {
			// Look for __ or [] pattern in text nodes only (debounced)
			findPatternDebounced(element);
		}

		// Update popup position (debounced via the debounced function)
		updatePopupPosition();
	}, [checkRemovedDropdownsThrottled, isCursorInsideDropdown, findPatternDebounced, updatePopupPosition]);


	// Add incorrect option to a specific dropdown
	const handleAddIncorrectOption = (dropdownId) => {
		setDropdowns(prev => prev.map(dropdown => 
			dropdown.id === dropdownId 
				? { ...dropdown, incorrectOptions: [...dropdown.incorrectOptions, { id: Date.now(), text: '' }] }
				: dropdown
    ));
  };

	// Remove incorrect option from a specific dropdown
	const handleRemoveIncorrectOption = (dropdownId, optionId) => {
		setDropdowns(prev => prev.map(dropdown => 
			dropdown.id === dropdownId 
				? { ...dropdown, incorrectOptions: dropdown.incorrectOptions.filter(opt => opt.id !== optionId) }
				: dropdown
    ));
  };

	// Change incorrect option text for a specific dropdown
	const handleIncorrectOptionChange = (dropdownId, optionId, value) => {
		setDropdowns(prev => prev.map(dropdown => 
			dropdown.id === dropdownId 
				? { 
						...dropdown, 
						incorrectOptions: dropdown.incorrectOptions.map(opt => 
              opt.id === optionId ? { ...opt, text: value } : opt
            )
          }
				: dropdown
    ));
  };

	// Insert dropdown at saved cursor position
	const insertDropdownAtCursor = useCallback(() => {
		if (!editorRef.current || !savedRangeRef.current) return;

		// Don't insert dropdown if cursor is inside another dropdown
		if (isCursorInsideDropdown()) {
			spaceToast.warning('Cannot insert dropdown inside another dropdown');
			setShowDropdownPopup(false);
			return;
		}

		// Create dropdown
		const positionId = generatePositionId();
		const dropdownId = `dropdown-${Date.now()}-${positionId}`;
		const color = dropdownColors[dropdowns.length % dropdownColors.length];

		const newDropdown = {
			id: dropdownId,
			positionId: positionId,
			correctAnswer: '',
			incorrectOptions: [],
			color: color
		};

		// Create dropdown element
		const dropdownElement = createDropdownElement(newDropdown, dropdowns.length);

		// Restore saved range
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(savedRangeRef.current);

		// Insert dropdown at cursor
		try {
			const range = savedRangeRef.current.cloneRange();
			
			// Add space before dropdown if needed
			const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || '';
			if (textBefore && !textBefore.endsWith(' ')) {
				range.insertNode(document.createTextNode(' '));
				range.collapse(false);
			}

			// Insert dropdown
			range.insertNode(dropdownElement);
			range.collapse(false);

			// Add space after dropdown
			range.insertNode(document.createTextNode(' '));
			range.collapse(false);

			// Update selection
			selection.removeAllRanges();
			selection.addRange(range);

			// Update dropdowns state
			setDropdowns(prev => [...prev, newDropdown]);

			// Update dropdown numbers and expand the newly created dropdown
			requestAnimationFrame(() => {
				try {
					// Update all dropdown numbers first
					updateDropdownNumbers();
					
					const insertedDropdown = editorRef.current.querySelector(`[data-dropdown-id="${dropdownId}"]`);
					if (insertedDropdown && insertedDropdown.expandDropdown) {
						insertedDropdown.expandDropdown();
					} else {
						editorRef.current.focus();
					}
				} catch (error) {
					console.error('Error expanding dropdown:', error);
					editorRef.current.focus();
				}
			});
		} catch (error) {
			console.error('Error inserting dropdown:', error);
		}

		// Hide popup
		setShowDropdownPopup(false);
	}, [dropdowns, dropdownColors, createDropdownElement, isCursorInsideDropdown, updateDropdownNumbers]);

	// Handle save
  const handleSave = () => {
		if (!editorRef.current) return;

		// Validate
		const editorText = editorRef.current.textContent.trim();
		console.log('=== VALIDATION DEBUG ===');
		console.log('Editor text:', editorText);
		console.log('Dropdowns length:', dropdowns.length);
		console.log('Dropdowns state:', dropdowns);
		
		if (!editorText && dropdowns.length === 0) {
			spaceToast.warning('Please enter the question text');
        return;
      }

		if (dropdowns.length === 0) {
			spaceToast.warning('Please add at least one dropdown (use __ or [])');
        return;
      }

		// Check each dropdown's correct answer
		dropdowns.forEach((dropdown, index) => {
			console.log(`Dropdown ${index} validation:`, {
				id: dropdown.id,
				correctAnswer: dropdown.correctAnswer,
				isEmpty: !dropdown.correctAnswer || !dropdown.correctAnswer.trim(),
				trimmed: dropdown.correctAnswer?.trim()
			});
		});

		const hasEmptyDropdowns = dropdowns.some(dropdown => !dropdown.correctAnswer || !dropdown.correctAnswer.trim());
		console.log('Has empty dropdowns:', hasEmptyDropdowns);
		
		if (hasEmptyDropdowns) {
			spaceToast.warning('Please fill in all dropdown correct answers. Click on each dropdown chip to enter the correct answer.');
        return;
      }

		// Build backend format by traversing DOM (preserve HTML)
		let questionText = '';
		const contentData = [];
		
		console.log('=== BUILDING CONTENT DATA ===');
		console.log('Current dropdowns state:', dropdowns);
		console.log('Dropdowns length:', dropdowns.length);
		console.log('Editor content:', editorRef.current.innerHTML);
		
		// Debug: Check if dropdowns have correct answers
		dropdowns.forEach((dropdown, index) => {
			console.log(`Dropdown ${index}:`, {
				id: dropdown.id,
				correctAnswer: dropdown.correctAnswer,
				incorrectOptions: dropdown.incorrectOptions,
				positionId: dropdown.positionId
			});
		});
		
		// Debug: Check all dropdown elements in DOM
		const allDropdownElements = editorRef.current.querySelectorAll('[data-dropdown-id]');
		console.log('Found dropdown elements in DOM:', allDropdownElements.length);
		allDropdownElements.forEach((el, index) => {
			console.log(`Dropdown ${index}:`, el.getAttribute('data-dropdown-id'), el);
		});

		// Process each child node
		const processNode = (node) => {
			if (node.nodeType === Node.TEXT_NODE) {
				return node.textContent;
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const dropdownId = node.getAttribute('data-dropdown-id');
				console.log('Processing node:', node.tagName, 'dropdownId:', dropdownId);
				
				if (dropdownId) {
					// This is a dropdown - replace with placeholder
					const dropdown = dropdowns.find(d => d.id === dropdownId);
					console.log('Found dropdown in state:', dropdown);
					
					if (dropdown) {
						return `[[pos_${dropdown.positionId}]]`;
					} else {
						console.warn('Dropdown not found in state for ID:', dropdownId);
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
							
							const wrapperStyle = `position:relative;display:${wrapperDisplay};${wrapperWidth ? `width:${wrapperWidth};` : 'max-width:100%;'}margin:10px ${marginRight} 10px ${marginLeft};user-select:none;`;
							
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
					
					// Special handling for tables
					if (tagName === 'table') {
						return node.outerHTML;
					}
					
					// Process child nodes
					let innerContent = '';
					node.childNodes.forEach(child => {
						innerContent += processNode(child);
					});
					
					// Don't wrap if it's a div or certain block elements from contentEditable
					if (tagName === 'div' || tagName === 'br') {
						return innerContent + (tagName === 'br' ? '<br>' : '');
					}
					
					// Wrap with appropriate HTML tag
					if (innerContent || ['ul', 'ol', 'li', 'h1', 'h2', 'h3'].includes(tagName)) {
						return `<${tagName}>${innerContent}</${tagName}>`;
					}
					
					return innerContent;
				}
			}
			return '';
		};

		// Process all child nodes recursively
		const processAllNodes = (parentNode) => {
			if (!parentNode) return '';
			
			let result = '';
			const childNodes = Array.from(parentNode.childNodes);
			
			console.log('Processing parent node:', parentNode.tagName || 'TEXT', 'with', childNodes.length, 'children');
			
			childNodes.forEach((node, index) => {
				console.log(`Processing child ${index}:`, node.nodeType === Node.TEXT_NODE ? 'TEXT' : node.tagName, node);
				result += processNode(node);
			});
			
			return result;
		};
		
		questionText = processAllNodes(editorRef.current);

		// Clean up multiple line breaks
		questionText = questionText.replace(/\n/g, '<br>');
		
		console.log('Final questionText:', questionText);
		
		// PRIMARY APPROACH: Process dropdowns directly from state (more reliable than DOM traversal)
		console.log('=== PRIMARY: Processing dropdowns from state ===');
		
		dropdowns.forEach((dropdown, dropdownIndex) => {
			console.log('Processing dropdown from state:', dropdown);
			
			// Add correct answer (positionOrder: 1)
			const correctOption = {
				id: `opt${dropdownIndex + 1}`,
				value: dropdown.correctAnswer,
				positionId: dropdown.positionId,
				positionOrder: 1,
				correct: true
			};
			contentData.push(correctOption);
			console.log('Added correct option:', correctOption);
			
			// Add incorrect options (positionOrder: 2, 3, 4, ...)
			// Only send options that have actual data
			const validIncorrectOptions = dropdown.incorrectOptions.filter(option => option.text && option.text.trim());
			
			// Add only the incorrect options that have data
			validIncorrectOptions.forEach((option, index) => {
				const incorrectOption = {
					id: `opt${dropdownIndex + 1}_${index + 1}`,
					value: option.text.trim(),
					positionId: dropdown.positionId,
					positionOrder: index + 2, // 2, 3, 4, ...
					correct: false
				};
				contentData.push(incorrectOption);
				console.log('Added incorrect option:', incorrectOption);
			});
		});
		
		console.log('Primary contentData:', contentData);

      const newQuestionData = {
        id: questionData?.id || Date.now(),
			type: 'DROPDOWN',
			questionType: 'DROPDOWN',
			title: 'Dropdown',
			questionText: questionText,
			content: {
				data: contentData
			},
			points: points,
			// For backward compatibility
			question: questionText,
			correctAnswer: dropdowns.map(d => d.correctAnswer).join(', '),
      };

		// Log HTML output for debugging
		console.log('=== DROPDOWN QUESTION HTML ===');
		console.log('Question HTML:', questionText);
		console.log('Content Data:', contentData);
		console.log('Full Question Data:', newQuestionData);
		console.log('================================');

      onSave(newQuestionData);
		handleCancel();
	};

	// Handle cancel
	const handleCancel = () => {
		if (editorRef.current) {
			editorRef.current.innerHTML = '';
		}
		setDropdowns([]);
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
			} else if (item.type === 'dropdown') {
				const dropdownIndex = dropdowns.findIndex(d => d.id === item.id);
				const dropdownElement = createDropdownElement(item, dropdownIndex >= 0 ? dropdownIndex : index);
				editorRef.current.appendChild(dropdownElement);
			}
		});
		
		// Update dropdown numbers after populating editor
		requestAnimationFrame(() => {
			updateDropdownNumbers();
		});
		
		editorInitializedRef.current = true;
	}, [visible, editorContent, dropdowns, createDropdownElement, updateDropdownNumbers]);

	// Get dropdowns ordered by DOM position
	const orderedDropdowns = useMemo(() => {
		if (!editorRef.current) return dropdowns;
		
		const dropdownElements = editorRef.current.querySelectorAll('[data-dropdown-id]');
		const orderedIds = Array.from(dropdownElements).map(el => el.getAttribute('data-dropdown-id'));
		
		// Create ordered array based on DOM order
		const ordered = orderedIds
			.map(id => dropdowns.find(d => d.id === id))
			.filter(Boolean); // Remove undefined entries
		
		return ordered;
	}, [dropdowns]);

	// Hide popup when clicking outside
	useEffect(() => {
		if (!showDropdownPopup) return;

		const handleClickOutside = (e) => {
			// Check if click is on editor or popup
			if (
				editorRef.current &&
				!editorRef.current.contains(e.target) &&
				!e.target.closest('[data-dropdown-popup]')
			) {
				setShowDropdownPopup(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showDropdownPopup]);

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
						Create Dropdown Question
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
						💡 Tips: Click <span style={{ 
							background: 'rgba(24, 144, 255, 0.2)', 
							padding: '2px 8px', 
							borderRadius: '4px',
							fontWeight: 600,
							color: '#1890ff'
						}}>+ Dropdown</span> button at cursor position to insert dropdown • Or type <code style={{ 
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
						}}>[]</code>
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
					borderRadius: '16px',
					padding: '20px',
					boxShadow: '0 8px 32px rgba(24, 144, 255, 0.15)',
					border: '2px solid rgba(24, 144, 255, 0.1)',
					backdropFilter: 'blur(20px)',
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

					{/* Formatting Toolbar */}
					<div style={{
						display: 'flex',
						gap: '4px',
						marginBottom: '10px',
						padding: '10px',
						background: 'rgba(255, 255, 255, 0.95)',
						borderRadius: '10px',
						border: '2px solid rgba(24, 144, 255, 0.15)',
						flexWrap: 'wrap',
						position: 'relative',
						zIndex: 2
					}}>
						{/* Heading Dropdown */}
						<Dropdown
							menu={{
								items: [
									{ 
										key: 'paragraph', 
										label: <span style={{ color: '#000000' }}>Paragraph</span>, 
										onClick: () => handleHeading('paragraph') 
									},
									{ 
										key: 'h1', 
										label: <span style={{ color: '#000000', fontWeight: 700, fontSize: '16px' }}>Heading 1</span>, 
										onClick: () => handleHeading('h1') 
									},
									{ 
										key: 'h2', 
										label: <span style={{ color: '#000000', fontWeight: 600, fontSize: '15px' }}>Heading 2</span>, 
										onClick: () => handleHeading('h2') 
									},
									{ 
										key: 'h3', 
										label: <span style={{ color: '#000000', fontWeight: 600, fontSize: '14px' }}>Heading 3</span>, 
										onClick: () => handleHeading('h3') 
									},
								],
								style: {
									background: '#ffffff',
								}
							}}
							trigger={['click']}
							overlayStyle={{
								zIndex: 9999
							}}
						>
							<Tooltip title="Heading">
								<Button
									icon={<FontSizeOutlined />}
									style={{
										border: '1px solid rgba(24, 144, 255, 0.2)',
										borderRadius: '6px',
										height: '36px',
										width: '36px'
									}}
								/>
							</Tooltip>
						</Dropdown>
						<div style={{ width: '1px', background: 'rgba(24, 144, 255, 0.2)', margin: '0 8px' }} />
						
						{/* Text Formatting */}
						<Tooltip title="Bold">
							<Button
								icon={<BoldOutlined />}
								onClick={() => handleFormat('bold')}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px'
								}}
							/>
						</Tooltip>
						<Tooltip title="Italic">
							<Button
								icon={<ItalicOutlined />}
								onClick={() => handleFormat('italic')}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px'
								}}
							/>
						</Tooltip>
						<Tooltip title="Underline">
							<Button
								icon={<UnderlineOutlined />}
								onClick={() => handleFormat('underline')}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px'
								}}
							/>
						</Tooltip>
						<div style={{ width: '1px', background: 'rgba(24, 144, 255, 0.2)', margin: '0 8px' }} />
						
						{/* Link */}
						<Tooltip title="Insert Link">
							<Button
								icon={<LinkOutlined />}
								onClick={handleInsertLink}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px'
								}}
							/>
						</Tooltip>
						
						{/* Image Upload */}
						<Tooltip title="Upload Image">
							<Button
								icon={<PictureOutlined />}
								onClick={handleImageUpload}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px'
								}}
							/>
						</Tooltip>
						<div style={{ width: '1px', background: 'rgba(24, 144, 255, 0.2)', margin: '0 8px' }} />
						
						{/* Lists */}
						<Tooltip title="Ordered List">
							<Button
								icon={<OrderedListOutlined />}
								onClick={() => handleFormat('insertOrderedList')}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px'
								}}
							/>
						</Tooltip>
						<Tooltip title="Unordered List">
							<Button
								icon={<UnorderedListOutlined />}
								onClick={() => handleFormat('insertUnorderedList')}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px'
								}}
							/>
						</Tooltip>
						<div style={{ width: '1px', background: 'rgba(24, 144, 255, 0.2)', margin: '0 8px' }} />
						
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
										border: '1px solid rgba(24, 144, 255, 0.2)'
									}}
									onMouseLeave={() => setHoveredCell({ row: 0, col: 0 })}
								>
									<div style={{
										fontSize: '12px',
										color: '#666',
										marginBottom: '8px',
										textAlign: 'center',
										fontWeight: 500,
										height: '16px'
									}}>
										{hoveredCell.row > 0 && hoveredCell.col > 0 
											? `${hoveredCell.row} x ${hoveredCell.col} Table`
											: 'Select table size'}
									</div>
									<div style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(10, 1fr)',
										gap: '2px'
									}}>
										{Array.from({ length: 100 }, (_, index) => {
											const row = Math.floor(index / 10) + 1;
											const col = (index % 10) + 1;
											const isHovered = row <= hoveredCell.row && col <= hoveredCell.col;
											
											return (
												<div
													key={index}
													onMouseEnter={() => setHoveredCell({ row, col })}
													onClick={() => {
														if (hoveredCell.row > 0 && hoveredCell.col > 0) {
															handleInsertTable(hoveredCell.row, hoveredCell.col);
														}
													}}
													style={{
														width: '20px',
														height: '20px',
														border: '1px solid #000000',
														background: isHovered ? '#1890ff' : '#ffffff',
														cursor: 'pointer',
														transition: 'all 0.1s ease',
														borderRadius: '2px'
													}}
												/>
											);
										})}
									</div>
								</div>
							)}
						>
							<Tooltip title="Insert Table">
								<Button
									icon={<TableOutlined />}
									style={{
										border: '1px solid rgba(24, 144, 255, 0.2)',
										borderRadius: '6px',
										height: '36px',
										width: '36px'
									}}
								/>
							</Tooltip>
						</Dropdown>
						<div style={{ width: '1px', background: 'rgba(24, 144, 255, 0.2)', margin: '0 8px' }} />
						
						{/* Image Alignment (only show when image is selected) */}
						{selectedImage && (
							<>
								<Tooltip title="Align Left">
									<Button
										icon={<AlignLeftOutlined />}
										onClick={() => handleImageAlign('left')}
										style={{
											border: '1px solid rgba(24, 144, 255, 0.2)',
											borderRadius: '6px',
											height: '36px',
											width: '36px',
											background: 'rgba(82, 196, 26, 0.1)'
										}}
									/>
								</Tooltip>
								<Tooltip title="Align Center">
									<Button
										icon={<AlignCenterOutlined />}
										onClick={() => handleImageAlign('center')}
										style={{
											border: '1px solid rgba(24, 144, 255, 0.2)',
											borderRadius: '6px',
											height: '36px',
											width: '36px',
											background: 'rgba(82, 196, 26, 0.1)'
										}}
									/>
								</Tooltip>
								<Tooltip title="Align Right">
									<Button
										icon={<AlignRightOutlined />}
										onClick={() => handleImageAlign('right')}
										style={{
											border: '1px solid rgba(24, 144, 255, 0.2)',
											borderRadius: '6px',
											height: '36px',
											width: '36px',
											background: 'rgba(82, 196, 26, 0.1)'
										}}
									/>
								</Tooltip>
								<div style={{ width: '1px', background: 'rgba(24, 144, 255, 0.2)', margin: '0 8px' }} />
							</>
						)}
						
						{/* Undo/Redo */}
						<Tooltip title="Undo">
							<Button
								icon={<UndoOutlined />}
								onClick={() => handleFormat('undo')}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px'
								}}
							/>
						</Tooltip>
						<Tooltip title="Redo">
							<Button
								icon={<RedoOutlined />}
								onClick={() => handleFormat('redo')}
								style={{
									border: '1px solid rgba(24, 144, 255, 0.2)',
									borderRadius: '6px',
									height: '36px',
									width: '36px'
								}}
							/>
						</Tooltip>
					</div>
					
					{/* Hidden File Input for Image Upload */}
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
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
								WebkitUserSelect: 'text'
							}}
							data-placeholder="Type your question here... The + Dropdown button will follow your cursor"
						/>
						
						{/* Dropdown Popup */}
						{showDropdownPopup && (
							<div
								data-dropdown-popup="true"
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
								className="blank-popup-fade-in"
							>
								<Button
									type="primary"
									icon={<ThunderboltOutlined />}
									onClick={insertDropdownAtCursor}
									size="small"
									style={{
										background: 'linear-gradient(135deg, #66AEFF, #3C99FF)',
										border: 'none',
										fontWeight: 600,
										display: 'flex',
										alignItems: 'center',
										gap: '4px',
										color: '#000000',
									}}
								>
									+ Dropdown
								</Button>
							</div>
						)}
					</div>

					{/* Hint Text */}
					<div style={{ 
						textAlign: 'center',
						color: '#999',
						fontSize: '14px',
						marginBottom: '24px',
						fontStyle: 'italic'
					}}>
						Type '__' or select text to add blank
      </div>

					{/* Dropdowns with their own Correct & Incorrect Options */}
					{dropdowns.length > 0 && (
        <div style={{ 
							display: 'grid', 
							gridTemplateColumns: 'repeat(auto-fill, minmax(600px, 1fr))',
							gap: '16px'
						}}>
							{orderedDropdowns.map((dropdown, dropdownIndex) => (
          <div
            key={dropdown.id}
            style={{
										padding: '16px',
										background: 'white',
										borderRadius: '12px',
										border: `2px solid ${dropdown.color}`,
										boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
									}}
								>
									{/* Dropdown Header */}
									<div style={{
										fontSize: '15px',
										fontWeight: 700,
										color: dropdown.color,
										marginBottom: '12px',
										display: 'flex',
										alignItems: 'center',
										gap: '8px'
									}}>
										<span style={{
											width: '24px',
											height: '24px',
											borderRadius: '50%',
											background: dropdown.color,
											color: 'white',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: '12px',
											fontWeight: 700
										}}>
											{dropdownIndex + 1}
										</span>
										Dropdown {dropdownIndex + 1}
            </div>

									{/* Correct Option */}
									<div style={{ marginBottom: '12px' }}>
										<div style={{ 
											fontSize: '13px', 
											fontWeight: 600, 
											color: '#666',
											marginBottom: '6px'
										}}>
											✓ Correct option
										</div>
										<div 
                style={{
												padding: '10px 12px',
												background: `${dropdown.color}10`,
												border: `1.5px solid ${dropdown.color}`,
												borderRadius: '8px',
												fontSize: '14px',
												fontWeight: 500,
												color: '#333'
											}}
										>
											{dropdown.correctAnswer || '(empty)'}
										</div>
            </div>

									{/* Incorrect Options */}
									<div>
										<div style={{ 
											fontSize: '13px', 
											fontWeight: 600, 
											color: '#666',
											marginBottom: '6px',
											display: 'flex',
											alignItems: 'center',
											gap: '6px'
										}}>
											✗ Incorrect options
											<span style={{
												width: '16px',
												height: '16px',
												borderRadius: '50%',
												background: '#d9d9d9',
												color: 'white',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontSize: '10px',
												fontWeight: 700
											}}>
												?
											</span>
										</div>
										<div style={{ 
											display: 'flex', 
											flexDirection: 'column',
											gap: '6px'
										}}>
											{dropdown.incorrectOptions.map((option, optIndex) => (
                <div
                  key={option.id}
                  style={{
														padding: '6px 10px',
														background: '#fafafa',
														border: '1.5px solid #e0e0e0',
														borderRadius: '8px',
														display: 'flex',
														alignItems: 'center',
														gap: '8px'
													}}
												>
                  <Input
                    value={option.text}
														onChange={(e) => handleIncorrectOptionChange(dropdown.id, option.id, e.target.value)}
														placeholder={`Option ${optIndex + 1}`}
														style={{ 
															flex: 1, 
															border: 'none', 
															outline: 'none', 
															boxShadow: 'none',
															background: 'transparent',
															fontSize: '13px'
														}}
                  />
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
														onClick={() => handleRemoveIncorrectOption(dropdown.id, option.id)}
                    size="small"
														danger
														style={{ flexShrink: 0, padding: '2px' }}
                  />
                </div>
              ))}
											<Button
												type="dashed"
												icon={<PlusOutlined />}
												onClick={() => handleAddIncorrectOption(dropdown.id)}
												size="small"
												style={{
													borderColor: '#e0e0e0',
													color: '#666',
													fontSize: '12px',
													height: '28px'
												}}
											>
												Add option
											</Button>
										</div>
            </div>
          </div>
        ))}
      </div>
					)}

					{/* Empty State */}
					{dropdowns.length === 0 && (
						<div style={{ 
							textAlign: 'center',
							color: '#999',
							fontSize: '14px',
							padding: '40px',
							fontStyle: 'italic'
						}}>
							No dropdowns yet. Type __ or [] in the editor to create one.
						</div>
					)}
				</div>
      </div>
    </Modal>
  );
};

export default DropdownModal;
