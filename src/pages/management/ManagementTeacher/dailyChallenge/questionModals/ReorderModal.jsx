import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Modal,
  Button,
  message,
  Select,
  Tooltip,
  Dropdown,
} from "antd";
import { 
  DeleteOutlined, 
  DragOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  SaveOutlined,
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
} from "@ant-design/icons";
import './MultipleChoiceModal.css';

const ReorderModal = ({ visible, onCancel, onSave, questionData = null }) => {
  const [points, setPoints] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [tableDropdownOpen, setTableDropdownOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState({ row: 0, col: 0 });
  const [shuffledWords, setShuffledWords] = useState([]);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

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
      Object.values(handleElements).forEach(h => h.style.opacity = '1');
      wrapper.style.outline = '2px solid #1890ff';
      wrapper.style.outlineOffset = '2px';
    };
    
    wrapper.onmouseleave = function() {
      if (selectedImage !== img) {
        Object.values(handleElements).forEach(h => h.style.opacity = '0');
      }
    };
    
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
      
      if (newWidth < 100) newWidth = 100;
      if (newWidth > 800) newWidth = 800;
      
      img.style.width = newWidth + 'px';
      
      if (wrapper.style.display === 'block' && wrapper.style.width) {
        wrapper.style.width = newWidth + 'px';
      }
    };
    
    const stopResize = () => {
      isResizing = false;
      document.removeEventListener('mousemove', doResize);
      document.removeEventListener('mouseup', stopResize);
    };
    
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
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.insertNode(wrapper);
      const br = document.createElement('br');
      wrapper.parentNode.insertBefore(br, wrapper.nextSibling);
      range.setStartAfter(br);
      range.setEndAfter(br);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.current.appendChild(wrapper);
      const br = document.createElement('br');
      editorRef.current.appendChild(br);
    }
    
    message.success('Image inserted successfully');
  }, [selectedImage]);

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
      message.error('Please select an image file');
    }
    if (e.target) {
      e.target.value = '';
    }
  }, [insertImageIntoEditor]);

  const handlePaste = useCallback((e) => {
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
    
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, [insertImageIntoEditor]);

  const handleImageAlign = useCallback((alignment) => {
    if (!selectedImage) {
      message.warning('Please select an image first');
      return;
    }
    
    const wrapper = selectedImage.parentElement;
    if (!wrapper || !wrapper.hasAttribute('data-image-wrapper')) {
      message.warning('Image wrapper not found');
      return;
    }
    
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
    
    message.success(`Image aligned to ${alignment}`);
    
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }, 100);
  }, [selectedImage]);

  const handleInsertTable = useCallback((numRows, numCols) => {
    if (!editorRef.current) return;
    
    if (numRows > 0 && numCols > 0 && numRows <= 10 && numCols <= 10) {
      editorRef.current.focus();
      
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
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }
      
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(table);
        range.collapse(false);
      } else {
        editorRef.current.appendChild(table);
      }
      
      setTableDropdownOpen(false);
      message.success(`Table ${numRows}x${numCols} inserted successfully`);
    }
  }, []);

  const handleHeading = useCallback((level) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    
    if (level === 'paragraph') {
      document.execCommand('formatBlock', false, 'p');
    } else {
      document.execCommand('formatBlock', false, level);
    }
  }, []);

  const handleEditorClick = useCallback((e) => {
    if (e.target.tagName !== 'IMG') {
      if (editorRef.current) {
        const wrappers = editorRef.current.querySelectorAll('[data-image-wrapper]');
        wrappers.forEach(wrapper => {
          wrapper.style.outline = 'none';
        });
      }
      setSelectedImage(null);
    }
    
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
        }
      }, 0);
    }
  }, []);

  const handleEditorKeyDown = useCallback((e) => {
    if ((e.key === 'Backspace' || e.key === 'Delete') && selectedImage) {
      e.preventDefault();
      
      const wrapper = selectedImage.parentElement;
      if (wrapper && wrapper.hasAttribute('data-image-wrapper')) {
        wrapper.remove();
        setSelectedImage(null);
        
        if (editorRef.current) {
          editorRef.current.focus();
        }
        
        message.success('Image deleted');
      }
    }
  }, [selectedImage]);

  // Extract words from editor content and shuffle them
  const extractAndShuffleWords = useCallback(() => {
    if (!editorRef.current) return [];
    
    const text = editorRef.current.textContent.trim();
    if (!text) return [];
    
    // Split by spaces and filter out empty strings
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    // Shuffle array
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.map((word, index) => ({
      id: `word-${index}-${Date.now()}`,
      text: word,
      originalIndex: words.indexOf(word),
      currentIndex: index
    }));
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

  // Generate preview when editor changes
  const handleEditorInput = useCallback(() => {
    const words = extractAndShuffleWords();
    setShuffledWords(words);
  }, [extractAndShuffleWords]);

  const handleSave = () => {
    if (!editorRef.current) return;

    const questionText = editorRef.current.textContent.trim();
    if (!questionText) {
      message.error('Please enter the question text');
        return;
      }

    if (shuffledWords.length === 0) {
      message.error('Question must contain at least one word');
      return;
    }

    // Build HTML
    let questionHTML = '';
    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        if (node.hasAttribute('data-image-wrapper')) {
          const img = node.querySelector('img');
          if (img) {
            const src = img.getAttribute('src');
            const imgWidth = img.style.width || '300px';
            const wrapperDisplay = node.style.display || 'inline-block';
            const wrapperWidth = node.style.width || '';
            const marginLeft = node.style.marginLeft || '0';
            const marginRight = node.style.marginRight || '0';
            const wrapperStyle = `position:relative;display:${wrapperDisplay};${wrapperWidth ? `width:${wrapperWidth};` : 'max-width:100%;'}margin:10px ${marginRight} 10px ${marginLeft};user-select:none;`;
            return `<div class="image-wrapper" style="${wrapperStyle}"><img src="${src}" style="width:${imgWidth};height:auto;display:block;border-radius:8px;" /></div>`;
          }
          return '';
        }
        
        if (tagName === 'img') {
          const src = node.getAttribute('src');
          const style = node.getAttribute('style') || '';
          return `<img src="${src}" style="${style}" />`;
        }
        
        if (tagName === 'table') {
          return node.outerHTML;
        }
        
        let innerContent = '';
        node.childNodes.forEach(child => {
          innerContent += processNode(child);
        });
        
        if (tagName === 'div' || tagName === 'br') {
          return innerContent + (tagName === 'br' ? '<br>' : '');
        }
        
        if (innerContent || ['ul', 'ol', 'li', 'h1', 'h2', 'h3'].includes(tagName)) {
          return `<${tagName}>${innerContent}</${tagName}>`;
        }
        
        return innerContent;
      }
      return '';
    };

    editorRef.current.childNodes.forEach(node => {
      questionHTML += processNode(node);
    });

    questionHTML = questionHTML.replace(/\n/g, '<br>');

    const newQuestionData = {
      id: questionData?.id || Date.now(),
      type: 'REORDER',
      title: 'Reorder',
      questionText: questionHTML,
      correctAnswer: questionText,
      shuffledWords: shuffledWords,
      points: points,
    };

    console.log('=== REORDER QUESTION HTML ===');
    console.log('Question HTML:', questionHTML);
    console.log('Shuffled Words:', shuffledWords);
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
    setPoints(1);
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
            💡 Tips: Type the correct order of the sentence • Students will need to rearrange the words
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
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onPaste={handlePaste}
            onClick={handleEditorClick}
            onKeyDown={handleEditorKeyDown}
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
              marginBottom: '24px',
              cursor: 'text',
              userSelect: 'text',
              WebkitUserSelect: 'text'
            }}
            data-placeholder="Type the correct order of your sentence here..."
          />

          {/* Hint Text */}
              <div style={{
            textAlign: 'center',
            color: '#999',
            fontSize: '14px',
            marginBottom: '24px',
            fontStyle: 'italic'
          }}>
            The sentence above is the correct answer. Students will see shuffled words below.
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
                gap: '8px'
              }}>
                <DragOutlined style={{ fontSize: '18px' }} />
                Preview: Shuffled Words (Students will drag to reorder)
              </div>
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px'
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
                      background: 'linear-gradient(135deg, rgba(240, 247, 255, 0.8) 0%, rgba(230, 244, 255, 0.9) 100%)',
                      border: '2px solid #1890ff',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#333',
                      cursor: 'grab',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                      boxShadow: '0 2px 8px rgba(24, 144, 255, 0.15)',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.15)';
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
