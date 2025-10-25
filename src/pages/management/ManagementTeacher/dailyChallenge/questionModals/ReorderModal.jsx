import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Modal,
  Button,
  message,
  Select,
} from "antd";
import { 
  DragOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  SaveOutlined,
  RetweetOutlined,
} from "@ant-design/icons";
import './MultipleChoiceModal.css';

const ReorderModal = ({ visible, onCancel, onSave, questionData = null }) => {
  const [points, setPoints] = useState(1);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [showBlankPopup, setShowBlankPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [blanks, setBlanks] = useState([]);
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);

  // Initialize from questionData
  useEffect(() => {
    if (visible && questionData?.questionText && editorRef.current) {
      editorRef.current.innerHTML = questionData.questionText;
      if (questionData.shuffledWords) {
        setShuffledWords(questionData.shuffledWords);
      }
    }
    if (visible) {
      setPoints(questionData?.points || 1);
    }
  }, [questionData, visible]);

  const handlePaste = useCallback((e) => {
    // Prevent all paste
    e.preventDefault();
    return false;
  }, []);

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
  const updatePopupPosition = useCallback(() => {
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

  // Generate position ID
  const generatePositionId = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  // Colors for blanks - using distinct, high-contrast colors
  const blankColors = useMemo(() => [
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

  // Handle blank answer change
  const handleBlankAnswerChange = useCallback((blankId, value) => {
    setBlanks(prev => {
      const newBlanks = prev.map(blank => 
        blank.id === blankId ? { ...blank, answer: value } : blank
      );
      
      // Update shuffled words immediately with new blanks
      setTimeout(() => {
        const words = newBlanks
          .filter(blank => blank.answer && blank.answer.trim())
          .map((blank, index) => ({
            id: blank.id,
            text: blank.answer,
            originalIndex: index,
            currentIndex: index,
            color: blank.color
          }));
        
        // Shuffle array
        const shuffled = [...words];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Update currentIndex after shuffle
        const finalWords = shuffled.map((word, index) => ({
          ...word,
          currentIndex: index
        }));
        
        setShuffledWords(finalWords);
      }, 50);
      
      return newBlanks;
    });
  }, []);

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
  const handleDeleteBlankElement = useCallback((blankId) => {
    if (!editorRef.current) return;

    // Find and remove the blank element from DOM
    const blankElement = editorRef.current.querySelector(`[data-blank-id="${blankId}"]`);
    if (blankElement) {
      blankElement.remove();
    }

    // Update state
    setBlanks(prev => {
      const newBlanks = prev.filter(blank => blank.id !== blankId);
      
      // Update blank numbers and shuffled words after deletion
      setTimeout(() => {
        updateBlankNumbers();
        
        // Update shuffled words from new blanks
        const words = newBlanks
          .filter(blank => blank.answer && blank.answer.trim())
          .map((blank, index) => ({
            id: blank.id,
            text: blank.answer,
            originalIndex: index,
            currentIndex: index,
            color: blank.color
          }));
        
        // Shuffle array
        const shuffled = [...words];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Update currentIndex after shuffle
        const finalWords = shuffled.map((word, index) => ({
          ...word,
          currentIndex: index
        }));
        
        setShuffledWords(finalWords);
      }, 10);
      
      return newBlanks;
    });
    
    message.success('Item removed');
    
    // Refocus editor
    editorRef.current.focus();
  }, [updateBlankNumbers]);

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
      flex: 1;
      margin-right: 8px;
    `;
    input.addEventListener('input', (e) => {
      handleBlankAnswerChange(blank.id, e.target.value);
      // Update answer text in real-time
      answerText.textContent = e.target.value || '';
    });
    input.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    input.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    input.addEventListener('blur', (e) => {
      // Don't collapse if clicking on delete button
      setTimeout(() => {
        // Check if the blank still exists (not deleted)
        if (document.body.contains(span)) {
          // If input is empty, delete the blank
          if (!e.target.value || !e.target.value.trim()) {
            handleDeleteBlankElement(blank.id);
            return;
          }
          
          collapseBlank();
          // Focus editor and update popup position after collapsing
          if (editorRef.current) {
            editorRef.current.focus();
            // Set cursor position after the blank
    const selection = window.getSelection();
            const range = document.createRange();
            // Try to position cursor after the blank
            if (span.nextSibling) {
              range.setStart(span.nextSibling, 0);
              range.collapse(true);
            } else if (span.parentNode) {
              range.setStartAfter(span);
              range.collapse(true);
            }
      selection.removeAllRanges();
      selection.addRange(range);
            // Update popup position
            setTimeout(() => {
              updatePopupPosition();
            }, 50);
          }
        }
      }, 100);
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
    span.appendChild(chip);

    // Store expand function for external use
    span.expandBlank = expandBlank;

    return span;
  }, [handleBlankAnswerChange, handleDeleteBlankElement, updatePopupPosition]);

  // Insert blank at saved cursor position
  const insertBlankAtCursor = useCallback(() => {
    if (!editorRef.current || !savedRangeRef.current) return;

    // Don't insert blank if cursor is inside another blank
    if (isCursorInsideBlank()) {
      message.warning('Cannot insert item inside another item');
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
        setTimeout(() => {
          try {
            // Update all blank numbers first
            updateBlankNumbers();
            
            const insertedBlank = editorRef.current.querySelector(`[data-blank-id="${blankId}"]`);
            if (insertedBlank && insertedBlank.expandBlank) {
              insertedBlank.expandBlank();
      } else {
              editorRef.current.focus();
            }
            
            // Update shuffled words from new blanks
            const words = newBlanks
              .filter(blank => blank.answer && blank.answer.trim())
              .map((blank, index) => ({
                id: blank.id,
                text: blank.answer,
                originalIndex: index,
                currentIndex: index,
                color: blank.color
              }));
            
            // Shuffle array
            const shuffled = [...words];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            
            // Update currentIndex after shuffle
            const finalWords = shuffled.map((word, index) => ({
              ...word,
              currentIndex: index
            }));
            
            setShuffledWords(finalWords);
          } catch (error) {
            console.error('Error expanding blank:', error);
            editorRef.current.focus();
          }
        }, 10);
        
        return newBlanks;
      });
    } catch (error) {
      console.error('Error inserting blank:', error);
    }

    // Hide popup
    setShowBlankPopup(false);
  }, [blanks, blankColors, createBlankElement, isCursorInsideBlank, updateBlankNumbers]);

  const handleEditorClick = useCallback((e) => {
    // Only set cursor if there's no current selection
    // This allows drag-to-select to work properly
    if (e.target === editorRef.current) {
      // Don't interfere if user is selecting text (check after a small delay to allow for drag-to-select)
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().length === 0) {
          const range = document.caretRangeFromPoint(e.clientX, e.clientY);
          if (range) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
          // Update popup position at cursor
          updatePopupPosition();
        }
      }, 0);
    }
  }, [updatePopupPosition]);

  const handleEditorFocus = useCallback(() => {
    setTimeout(() => {
      updatePopupPosition();
    }, 50);
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
    
    message.success('Words shuffled!');
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
      message.error('Please add at least one item');
        return;
      }

    // Check if all blanks have answers
    const hasEmptyBlanks = blanks.some(blank => !blank.answer || !blank.answer.trim());
    if (hasEmptyBlanks) {
      message.error('Please fill in all item answers');
      return;
    }

    // Build correct answer from blanks in order
    const correctAnswer = blanks.map(blank => blank.answer).join(' ');

    // Create questionText with [[pos_xxx]] format for API
    const questionText = blanks.map(blank => `[[pos_${blank.positionId}]]`).join(' ');

    // Create content.data array with positionId and positionOrder
    const contentData = blanks.map((blank, index) => ({
      id: `opt${index + 1}`,
      value: blank.answer,
      positionId: blank.positionId,
      positionOrder: index + 1, // 1-based order
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
            Create Reorder Question
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
                  Add Item
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
            Each item above = 1 word. Students will see shuffled words below and reorder them.
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