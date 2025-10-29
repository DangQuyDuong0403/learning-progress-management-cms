import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Modal,
  Button,
  Select,
} from "antd";
import { spaceToast } from '../../../../../component/SpaceToastify';
import { 
  DragOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  SaveOutlined,
  RetweetOutlined,
} from "@ant-design/icons";
import './MultipleChoiceModal.css';
/* eslint-disable no-use-before-define */

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


const ReorderModal = ({ visible, onCancel, onSave, questionData = null }) => {
  const MAX_ITEMS = 10;
  const [points, setPoints] = useState(1);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [showBlankPopup, setShowBlankPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [blanks, setBlanks] = useState([]);
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const deletionInProgressRef = useRef(new Set());

  // Colors for blanks - using distinct, high-contrast colors (avoid red as first color)
  const blankColors = useMemo(() => [
    '#2563eb', // Blue
    '#059669', // Green
    '#9333ea', // Purple
    '#ea580c', // Orange
    '#0891b2', // Cyan
    '#d946ef', // Magenta
    '#84cc16', // Lime
    '#f59e0b', // Amber
  ], []);

  // Parse backend format to editor format
  const parseQuestionText = useCallback((questionText, contentData = null, options = null) => {
    console.log('ReorderModal - parseQuestionText called with:', {
      questionText,
      contentData,
      options
    });
    
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
      
      // Try to get answer from contentData first, then from options
      let blankAnswer = '';
      if (contentData && contentData.length > 0) {
        const blankData = contentData.find(item => item.positionId === positionId);
        blankAnswer = blankData?.value || '';
      }
      
      // If no answer from contentData, try to find from options with correct flag
      if (!blankAnswer && options && options.length > 0) {
        const correctOption = options.find(opt => opt.isCorrect === true);
        if (correctOption) {
          blankAnswer = correctOption.text || '';
        }
      }
      
      // Enforce 50-character limit like DragDropModal
      blankAnswer = (blankAnswer || '').slice(0, 50);

      console.log('ReorderModal - Processing blank:', {
        positionId,
        blankAnswer,
        contentDataLength: contentData?.length || 0,
        optionsLength: options?.length || 0
      });
      
      const blankId = `blank-${Date.now()}-${positionId}`;
      
      parsed.push({
        type: 'blank',
        id: blankId,
        positionId: positionId,
        answer: blankAnswer
      });

      blanksData.push({
        id: blankId,
        positionId: positionId,
        answer: blankAnswer,
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

    console.log('ReorderModal - Final parsed data:', { parsed, blanksData });
    
    return { parsed, blanksData };
  }, [blankColors]);

  

  // Helper function to create shuffled words with correct order
  const createShuffledWords = useCallback((blanksArray, backendOptions = null) => {
    console.log('ReorderModal - createShuffledWords called with:', { blanksArray, backendOptions });
    
    // Sort blanks by their position in the DOM to get correct order
    const sortedBlanks = [...blanksArray].sort((a, b) => {
      const aElement = editorRef.current?.querySelector(`[data-blank-id="${a.id}"]`);
      const bElement = editorRef.current?.querySelector(`[data-blank-id="${b.id}"]`);
      
      if (!aElement || !bElement) return 0;
      
      const position = aElement.compareDocumentPosition(bElement);
      return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });

    // If we have backend options, use them to create words
    if (backendOptions && backendOptions.length > 0) {
      const words = backendOptions.map((option, index) => ({
        id: `word-${option.key || index}`,
        text: (option.text || '').slice(0, 50),
        originalIndex: option.isCorrect ? sortedBlanks.findIndex(b => b.answer === option.text) : -1,
        currentIndex: index,
        color: option.isCorrect ? blankColors[index % blankColors.length] : '#999999',
        positionId: option.isCorrect ? sortedBlanks.find(b => b.answer === option.text)?.positionId : null,
        isCorrect: option.isCorrect
      }));
      
      // Shuffle array
      const shuffled = [...words];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Update currentIndex after shuffle
      return shuffled.map((word, index) => ({
        ...word,
        currentIndex: index
      }));
    }

    // Fallback: create words from blanks only
    const words = sortedBlanks
      .filter(blank => blank.answer && blank.answer.trim())
      .map((blank, index) => ({
        id: blank.id,
        text: (blank.answer || '').slice(0, 50),
        originalIndex: index, // Correct original position in sentence
        currentIndex: index,  // Will be updated after shuffle
        color: blank.color,
        positionId: blank.positionId,
        isCorrect: true
      }));
    
    // Shuffle array
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Update currentIndex after shuffle
    return shuffled.map((word, index) => ({
      ...word,
      currentIndex: index
    }));
  }, [blankColors]);

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

  // Handle blank answer change (moved earlier so creators can use it)
  const handleBlankAnswerChange = useCallback((blankId, value) => {
    const limitedValue = (value || '').slice(0, 50);
    setBlanks(prev => {
      const newBlanks = prev.map(blank => 
        blank.id === blankId ? { ...blank, answer: limitedValue } : blank
      );
      
      // Update shuffled words with requestAnimationFrame to avoid lag
      requestAnimationFrame(() => {
        const finalWords = createShuffledWords(newBlanks);
        setShuffledWords(finalWords);
      });
      
      return newBlanks;
    });
  }, [createShuffledWords]);

  // Handle delete blank from DOM (moved earlier so creators can use it)
  const handleDeleteBlankElement = useCallback((blankId) => {
    if (!editorRef.current) return;

    // prevent duplicate deletions racing from blur + click
    if (deletionInProgressRef.current.has(blankId)) return;
    deletionInProgressRef.current.add(blankId);

    // Find and remove the blank element from DOM safely
    const blankElement = editorRef.current.querySelector(`[data-blank-id="${blankId}"]`);
    try {
      if (blankElement && blankElement.parentNode) {
        blankElement.parentNode.removeChild(blankElement);
      }
    } catch (err) {
      // no-op: element may already be detached by another handler
    }

    // Update state
    setBlanks(prev => {
      const newBlanks = prev.filter(blank => blank.id !== blankId);
      
      // Update blank numbers and shuffled words after deletion
      requestAnimationFrame(() => {
        updateBlankNumbers();
        const finalWords = createShuffledWords(newBlanks);
        setShuffledWords(finalWords);
        deletionInProgressRef.current.delete(blankId);
      });
      
      return newBlanks;
    });
    
    console.log('Item removed');
    
    // Refocus editor
    editorRef.current.focus();
  }, [updateBlankNumbers, createShuffledWords]);

  // Check if cursor is inside a blank element
  const isCursorInsideBlank = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    let node = selection.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('data-blank-id')) {
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

  // Create blank element
  const createBlankElement = useCallback((blank, index) => {
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
      min-width: 0;
      flex: 1;
    `;

    // Number badge
    const badge = document.createElement('span');
    badge.className = 'blank-badge';
    badge.style.cssText = `
      width: 20px;
      height: 20px;
      min-width: 20px;
      border-radius: 50%;
      background: ${blank.color};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
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
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: middle;
    `;
    answerText.textContent = blank.answer || '';

    // Input field (hidden by default in compact mode)
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'type answer...';
    input.value = (blank.answer || '').slice(0, 50);
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
      flex: 1;
      margin-right: 8px;
    `;
    input.maxLength = 100;

    // Character counter (hidden by default in compact mode)
    const counter = document.createElement('span');
    counter.className = 'blank-char-counter';
    counter.textContent = `${input.value.length}/50`;
    counter.style.cssText = `
      font-size: 12px;
      color: #999;
      display: none;
      white-space: nowrap;
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
      // Delay to allow button click handler to set deletion flag first
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
        if (editorRef.current) {
          editorRef.current.focus();
          // Set cursor position after the blank
          const selection = window.getSelection();
          const range = document.createRange();
          if (span.nextSibling) {
            range.setStart(span.nextSibling, 0);
            range.collapse(true);
          } else if (span.parentNode) {
            range.setStartAfter(span);
            range.collapse(true);
          }
          selection.removeAllRanges();
          selection.addRange(range);
          setTimeout(() => {
            updatePopupPosition();
          }, 50);
        }
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
      // mark deletion initiated by button to avoid blur double-delete
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
      // Don't expand if clicking on delete button
      if (e.target.hasAttribute('data-delete-btn') || e.target.classList.contains('blank-delete-btn')) {
          return;
        }
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
  }, [handleBlankAnswerChange, handleDeleteBlankElement, updatePopupPosition]);

  // Initialize from questionData
  useEffect(() => {
    if (visible && questionData?.questionText && editorRef.current) {
      console.log('ReorderModal - Initializing with questionData:', questionData);
      console.log('ReorderModal - questionData.content?.data:', questionData?.content?.data);
      console.log('ReorderModal - questionData.options:', questionData?.options);
      console.log('ReorderModal - questionData.incorrectOptions:', questionData?.incorrectOptions);
      
      // Parse existing question - pass content.data and options
      const { parsed: parsedContent, blanksData } = parseQuestionText(
        questionData.questionText, 
        questionData.content?.data || [],
        questionData.options || []
      );

      // Enforce maximum items when loading existing data
      const limitedBlanksData = blanksData.length > MAX_ITEMS ? blanksData.slice(0, MAX_ITEMS) : blanksData;
      if (blanksData.length > MAX_ITEMS) {
        spaceToast.warning(`Maximum ${MAX_ITEMS} items allowed. Extra items were ignored.`);
      }
      
      // Set blanks state
      setBlanks(limitedBlanksData);
      console.log('ReorderModal - State updated with parsed data, blanksData length:', limitedBlanksData.length);
      
      // Build editor DOM from parsed content
      editorRef.current.innerHTML = '';
      let blankCounter = 0;
      parsedContent.forEach((item, index) => {
        console.log('ReorderModal - Processing item:', item);
        if (item.type === 'text') {
          if (item.content) {
            editorRef.current.appendChild(document.createTextNode(item.content));
          }
        } else if (item.type === 'blank') {
          // Find the corresponding blank data from blanksData
          const blankData = limitedBlanksData.find(b => b.id === item.id);
          if (blankData) {
            console.log('ReorderModal - Creating blank element for:', blankData);
            const blankElement = createBlankElement(blankData, blankCounter);
            editorRef.current.appendChild(blankElement);
            blankCounter++;
          } else {
            console.warn('ReorderModal - No blank data found for item:', item);
          }
        }
      });
      
      // Update blank numbers after populating editor
      requestAnimationFrame(() => {
        updateBlankNumbers();
      });
      
      // Handle shuffledWords from backend
      if (questionData.shuffledWords && questionData.shuffledWords.length > 0) {
        setShuffledWords(questionData.shuffledWords);
      } else {
        // If no shuffledWords from backend, create them from blanks and options
        const finalWords = createShuffledWords(limitedBlanksData, questionData.options);
        setShuffledWords(finalWords);
      }
    }
    if (visible) {
      setPoints(questionData?.points || 1);
    }
  }, [questionData, visible, parseQuestionText, createBlankElement, updateBlankNumbers, createShuffledWords]);

  const handlePaste = useCallback((e) => {
    // Prevent all paste
    e.preventDefault();
    return false;
  }, []);


  // Generate position ID
  const generatePositionId = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  // Handle blank answer change
  // (removed duplicate - see earlier definition used by creators)

  // (moved earlier) updateBlankNumbers

  // (moved earlier) handleDeleteBlankElement

  // (moved earlier) createBlankElement

  // Insert blank at saved cursor position
  const insertBlankAtCursor = useCallback(() => {
    if (!editorRef.current || !savedRangeRef.current) return;

    // Enforce maximum number of items
    if (blanks.length >= MAX_ITEMS) {
      spaceToast.warning(`You can add up to ${MAX_ITEMS} items.`);
      setShowBlankPopup(false);
      return;
    }

    // Don't insert blank if cursor is inside another blank
    if (isCursorInsideBlank()) {
      spaceToast.warning('Cannot insert item inside another item');
      setShowBlankPopup(false);
      return;
    }
    
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
      const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || '';
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
      setBlanks(prev => {
        const newBlanks = [...prev, newBlank];
        
        // Update blank numbers and expand the newly created blank
        requestAnimationFrame(() => {
          try {
            // Update all blank numbers first
            updateBlankNumbers();
            
            const insertedBlank = editorRef.current.querySelector(`[data-blank-id="${blankId}"]`);
            if (insertedBlank && insertedBlank.expandBlank) {
              insertedBlank.expandBlank();
      } else {
              editorRef.current.focus();
            }
            
            // Update shuffled words from new blanks with correct order
            const finalWords = createShuffledWords(newBlanks);
            setShuffledWords(finalWords);
          } catch (error) {
            console.error('Error expanding blank:', error);
            editorRef.current.focus();
          }
        });
        
        return newBlanks;
      });
    } catch (error) {
      console.error('Error inserting blank:', error);
    }

    // Hide popup
    setShowBlankPopup(false);
  }, [blanks, blankColors, createBlankElement, isCursorInsideBlank, updateBlankNumbers, createShuffledWords]);

  const handleEditorClick = useCallback((e) => {
    // Only set cursor if there's no current selection
    // This allows drag-to-select to work properly
    if (e.target === editorRef.current) {
      // Don't interfere if user is selecting text
      requestAnimationFrame(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().length === 0) {
          const range = document.caretRangeFromPoint(e.clientX, e.clientY);
          if (range) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
          // Update popup position at cursor (debounced)
          updatePopupPosition();
        }
      });
    }
  }, [updatePopupPosition]);

  const handleEditorFocus = useCallback(() => {
    requestAnimationFrame(() => {
      updatePopupPosition();
    });
  }, [updatePopupPosition]);

  const handleEditorKeyDown = useCallback((e) => {
    // Allow all keys in blank input fields (including Backspace/Delete)
    if (e.target.classList?.contains('blank-input')) {
      return; // Allow normal input in blank fields
    }
    
    // Allow clicking delete button on blank chips
    if (e.target.classList?.contains('blank-delete-btn')) {
      return; // Allow delete button to work
    }
    
    // Handle Backspace to delete blank element
    if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Check if cursor is at the start of a text node and previous sibling is a blank
        if (range.collapsed && range.startOffset === 0) {
          let node = range.startContainer;
          
          // If we're in a text node, check its previous sibling
          if (node.nodeType === Node.TEXT_NODE) {
            let prevSibling = node.previousSibling;
            
            // Find the previous blank element
            while (prevSibling) {
              if (prevSibling.nodeType === Node.ELEMENT_NODE && 
                  prevSibling.hasAttribute('data-blank-id')) {
                // Found a blank element, delete it
                e.preventDefault();
                const blankId = prevSibling.getAttribute('data-blank-id');
                handleDeleteBlankElement(blankId);
                return false;
              }
              // Skip text nodes that are just spaces
              if (prevSibling.nodeType === Node.TEXT_NODE && 
                  prevSibling.textContent.trim() === '') {
                prevSibling = prevSibling.previousSibling;
                continue;
              }
              break;
            }
          }
          // If we're directly after a blank element
          else if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if previous sibling is a blank
            let prevSibling = node.previousSibling;
            while (prevSibling) {
              if (prevSibling.nodeType === Node.ELEMENT_NODE && 
                  prevSibling.hasAttribute('data-blank-id')) {
                e.preventDefault();
                const blankId = prevSibling.getAttribute('data-blank-id');
                handleDeleteBlankElement(blankId);
                return false;
              }
              if (prevSibling.nodeType === Node.TEXT_NODE && 
                  prevSibling.textContent.trim() === '') {
                prevSibling = prevSibling.previousSibling;
                continue;
              }
              break;
            }
            
            // Check if we're in the editor and the last child is a blank
            if (node === editorRef.current) {
              const children = Array.from(node.childNodes);
              for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                if (child.nodeType === Node.ELEMENT_NODE && 
                    child.hasAttribute('data-blank-id')) {
                  e.preventDefault();
                  const blankId = child.getAttribute('data-blank-id');
                  handleDeleteBlankElement(blankId);
                  return false;
                }
                if (child.nodeType === Node.TEXT_NODE && 
                    child.textContent.trim() !== '') {
                  break;
                }
              }
            }
          }
        }
      }
      
      // Prevent backspace if not deleting a blank
      e.preventDefault();
      return false;
    }
    
    // Prevent all text input in editor, only allow navigation and selection
    if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Delete') {
      e.preventDefault();
      return false;
    }
  }, [handleDeleteBlankElement]);

  // Shuffle words
  const handleShuffleWords = useCallback(() => {
    setShuffledWords(prev => {
      if (prev.length === 0) return prev;
      
      // Create a copy and shuffle
      const shuffled = [...prev];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
      // Update currentIndex after shuffle
    return shuffled.map((word, index) => ({
        ...word,
      currentIndex: index
    }));
    });
    
    console.log('Words shuffled!');
  }, []);

  // Handle word drag
  const handleWordDragStart = (e, wordId) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', wordId);
  };

  const handleWordDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleWordDrop = (e, targetWordId) => {
    e.preventDefault();
    const sourceWordId = e.dataTransfer.getData('text/html');
    
    if (sourceWordId === targetWordId) return;
    
    setShuffledWords(prev => {
      const newWords = [...prev];
      const sourceIndex = newWords.findIndex(w => w.id === sourceWordId);
      const targetIndex = newWords.findIndex(w => w.id === targetWordId);
      
      if (sourceIndex !== -1 && targetIndex !== -1) {
        const [removed] = newWords.splice(sourceIndex, 1);
        newWords.splice(targetIndex, 0, removed);
        
        // Update currentIndex
        return newWords.map((word, index) => ({
          ...word,
          currentIndex: index
        }));
      }
      
      return newWords;
    });
  };

  // Handle editor input - prevent text input
  const handleEditorInput = useCallback((e) => {
    // Allow input in blank fields
    if (e.target.classList?.contains('blank-input')) {
      return; // Allow typing in blank input fields
    }
    
    // Prevent text input in editor
    e.preventDefault();
    return false;
  }, []);

  const handleSave = () => {
    if (blanks.length === 0) {
      spaceToast.warning('Please add at least one item');
        return;
      }

    // Check if all blanks have answers
    const hasEmptyBlanks = blanks.some(blank => !blank.answer || !blank.answer.trim());
    if (hasEmptyBlanks) {
      spaceToast.warning('Please fill in all item answers');
      return;
    }

    // Build correct answer from blanks in order
    const correctAnswer = blanks.map(blank => blank.answer).join(' ');

    // Create questionText with [[pos_xxx]] format for API
    // Sort blanks by their position in the DOM to get correct order
    const sortedBlanks = [...blanks].sort((a, b) => {
      const aElement = editorRef.current?.querySelector(`[data-blank-id="${a.id}"]`);
      const bElement = editorRef.current?.querySelector(`[data-blank-id="${b.id}"]`);
      
      if (!aElement || !bElement) return 0;
      
      const position = aElement.compareDocumentPosition(bElement);
      return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    
    const questionText = sortedBlanks.map(blank => `[[pos_${blank.positionId}]]`).join(' ');

    // Create content.data array with positionId only
    // Use sortedBlanks to ensure correct order
    const contentData = sortedBlanks.map((blank, index) => ({
      id: `opt${index + 1}`,
      value: blank.answer,
      positionId: blank.positionId,
      correct: true
    }));

    const newQuestionData = {
      id: questionData?.id || Date.now(),
      type: 'REARRANGE',
      title: 'Rearrange',
      questionText: questionText, // Format: "[[pos_a1b2c3]] [[pos_d4e5f6]] ..."
      correctAnswer: correctAnswer, // Human readable: "I go to school every day"
      shuffledWords: shuffledWords,
      blanks: blanks, // Store blanks info
      points: points,
      content: {
        data: contentData
      }
    };

    console.log('=== REARRANGE QUESTION DATA ===');
    console.log('Question Text (API format):', questionText);
    console.log('Correct Answer (human readable):', correctAnswer);
    console.log('Content Data:', contentData);
    console.log('Shuffled Words:', shuffledWords);
    console.log('Blanks:', blanks);
    console.log('Full Question Data:', newQuestionData);
    console.log('================================');

    onSave(newQuestionData);
    handleCancel();
  };

  const handleCancel = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    setShuffledWords([]);
    setBlanks([]);
    setPoints(1);
    onCancel();
  };

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
            {questionData ? 'Edit Rearrange Question' : 'Create Rearrange Question'}
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
            }}>Add Item</span> to add words • Each item = 1 word in shuffled preview • Students will reorder them
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


          {/* Editor */}
          <div style={{ position: 'relative' }}>
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
              textAlign: 'center'
            }}
            />

            {/* Item Popup */}
            {showBlankPopup && (
              <div
                data-blank-popup="true"
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
                  onClick={insertBlankAtCursor}
                  size="small"
                  disabled={blanks.length >= MAX_ITEMS}
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
                  {blanks.length >= MAX_ITEMS ? `Max ${MAX_ITEMS} items` : 'Add Item'}
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
            Each item above = 1 word. Students will see shuffled words below and reorder them. (Max 10 items)
              </div>

          {/* Shuffled Words Preview */}
          {shuffledWords.length > 0 && (
            <div style={{ 
              background: 'rgba(24, 144, 255, 0.08)',
              border: '2px solid rgba(24, 144, 255, 0.3)',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                color: '#1890ff',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <DragOutlined style={{ fontSize: '18px' }} />
                Preview: Shuffled Words (Students will drag to reorder)
                </div>
                <Button
                  icon={<RetweetOutlined />}
                  onClick={handleShuffleWords}
                  size="small"
                  style={{
                    background: 'linear-gradient(135deg, #66AEFF, #3C99FF)',
                    border: 'none',
                    fontWeight: 600,
                    color: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Shuffle
                </Button>
              </div>
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'center'
              }}>
                {shuffledWords.map((word) => (
                  <div
                    key={word.id}
                    draggable
                    onDragStart={(e) => handleWordDragStart(e, word.id)}
                    onDragOver={handleWordDragOver}
                    onDrop={(e) => handleWordDrop(e, word.id)}
                style={{ 
                      padding: '12px 20px',
                      background: `linear-gradient(135deg, ${word.color}20, ${word.color}40)`,
                      border: `2px solid ${word.color}`,
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#333',
                      cursor: 'grab',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                      boxShadow: `0 2px 8px ${word.color}40`,
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 4px 12px ${word.color}60`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = `0 2px 8px ${word.color}40`;
                    }}
                  >
                    {word.text}
            </div>
          ))}
        </div>
      <div style={{ 
                marginTop: '16px',
                fontSize: '13px',
                color: '#666',
                fontStyle: 'italic'
              }}>
                💡 Tip: Try dragging words to see how students will interact with this question
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ReorderModal;