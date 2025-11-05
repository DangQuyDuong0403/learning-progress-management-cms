import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Modal,
  Button,
  InputNumber,
  Tooltip,
} from "antd";
import { spaceToast } from '../../../../../component/SpaceToastify';
import { 
  PlusOutlined, 
  DeleteOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import './MultipleChoiceModal.css';

const RewriteModal = ({ visible, onCancel, onSave, questionData = null }) => {
  
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
  
  // Answer colors - Pastel colors
  const getAnswerColors = useCallback(() => {
    return [
      '#A3D5FF', // Pastel Blue
      '#B8E6B8', // Pastel Green
      '#FFD6A5', // Pastel Orange
      '#FFB3D9', // Pastel Pink
      '#A8E6E6', // Pastel Cyan
      '#D4B5E6', // Pastel Purple
      '#FFCCAA', // Pastel Peach
      '#B3C7FF', // Pastel Periwinkle
    ];
  }, []);

  const [correctAnswers, setCorrectAnswers] = useState(
    questionData?.correctAnswers || [{ id: 1, answer: "", color: getAnswerColors()[0] }]
  );
  const [weight, setWeight] = useState(1);
  const [saving, setSaving] = useState(false);
  const [hoveredAnswer, setHoveredAnswer] = useState(null);
  const [editorData, setEditorData] = useState('');
  const editorRef = useRef(null);
  const answerEditorsRef = useRef({});

  const getPlainText = useCallback((html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html || '';
    return (tempDiv.textContent || tempDiv.innerText || '').trim();
  }, []);

  // Memoize CKEditor config for question editor
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
        'insertTable',
        'imageUpload',
        '|',
        'bulletedList',
        'numberedList',
        '|',
        'link',
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

  // Memoize answer editor config (simpler toolbar)
  const answerEditorConfig = useMemo(() => ({
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

  // Initialize from questionData
  useEffect(() => {
    if (visible) {
      // Use setTimeout to ensure form is mounted
    setTimeout(() => {
        const colors = getAnswerColors();
        if (questionData) {
          // Edit mode - load existing data
          let questionText = questionData.questionText || '';
          
          // Remove positionId markers for editing
          if (questionData.content && questionData.content.data) {
            questionData.content.data.forEach((item) => {
              const pattern = `[[pos_${item.positionId}]]`;
              questionText = questionText.replace(pattern, '');
            });
          }
          
          setEditorData(questionText);
          
          // Load answers from content.data if available, otherwise from correctAnswers
          let answers = [];
          if (questionData.content && questionData.content.data && questionData.content.data.length > 0) {
            // Load from content.data (API format)
            answers = questionData.content.data.map((item, idx) => ({
              id: idx + 1,
              answer: item.value,
              color: colors[idx % colors.length]
            }));
          } else if (questionData.correctAnswers) {
            // Fallback to correctAnswers format
            answers = questionData.correctAnswers.map((ans, idx) => ({
              ...ans,
              color: ans.color || colors[idx % colors.length]
            }));
          } else {
            answers = [{ id: 1, answer: "", color: colors[0] }];
          }
          
          setCorrectAnswers(answers);
          setWeight((questionData && (questionData.weight ?? questionData.points)) || 1);
        } 
      }, 0);
    }
  }, [questionData, visible, getAnswerColors]);

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

  // Debounced answer change handler  
  const answerChangeTimeoutRef = useRef({});
  const handleAnswerEditorChange = useCallback((answerId, event, editor) => {
    if (answerChangeTimeoutRef.current[answerId]) {
      clearTimeout(answerChangeTimeoutRef.current[answerId]);
    }
    answerChangeTimeoutRef.current[answerId] = setTimeout(() => {
      const data = editor.getData();
      const plainText = getPlainText(data);
      if (plainText.length > 200) {
        spaceToast.warning('Maximum 200 characters allowed');
        const currentAnswer = correctAnswers.find((ans) => ans.id === answerId);
        const previousHtml = currentAnswer ? currentAnswer.answer : '';
        if (answerEditorsRef.current[answerId]) {
          answerEditorsRef.current[answerId].setData(previousHtml || '');
        } else {
          editor.setData(previousHtml || '');
        }
        return;
      }
      setCorrectAnswers(prevAnswers =>
        prevAnswers.map(ans =>
          ans.id === answerId ? { ...ans, answer: data } : ans
        )
      );
    }, 150);
  }, [getPlainText, correctAnswers]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const editorTimeout = editorChangeTimeoutRef.current;
    const answerTimeouts = answerChangeTimeoutRef.current;
    return () => {
      if (editorTimeout) {
        clearTimeout(editorTimeout);
      }
      Object.values(answerTimeouts).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const handleAddAnswer = useCallback(() => {
    setCorrectAnswers(prevAnswers => {
      // Limit to maximum of 8 answers
      if (prevAnswers.length >= 8) {
        spaceToast.warning('Maximum 8 answers allowed');
        return prevAnswers;
      }
      const newId = Math.max(...prevAnswers.map(ans => ans.id)) + 1;
      const colors = getAnswerColors();
      const newColor = colors[prevAnswers.length % colors.length];
      return [...prevAnswers, { id: newId, answer: "", color: newColor }];
    });
  }, [getAnswerColors]);

  const handleRemoveAnswer = useCallback((answerId) => {
    setCorrectAnswers(prevAnswers => {
      if (prevAnswers.length > 1) {
        return prevAnswers.filter(ans => ans.id !== answerId);
    } else {
      spaceToast.warning("Question must have at least one correct answer");
        return prevAnswers;
      }
    });
  }, []);

  const handleSave = async () => {
    // Validate editor data
    if (!editorData || !editorData.trim()) {
      spaceToast.warning('Please enter the question text');
      return;
    }

    // Validate answer length (plain text <= 200) and non-empty
    const tooLong = correctAnswers.some(ans => getPlainText(ans.answer).length > 200);
    if (tooLong) {
      spaceToast.error('Each answer must be 200 characters or fewer');
      return;
    }

    // Check empty answers
    const hasEmptyAnswers = correctAnswers.some(ans => !getPlainText(ans.answer));
    if (hasEmptyAnswers) {
      spaceToast.warning('Please fill in all correct answers');
      return;
    }

    // Generate unique positionId for REWRITE question
    const positionId = `a1b2c3${Date.now()}`;
    
    // Create content.data array with correct answers
    const contentData = correctAnswers.map((ans, index) => ({
      id: `item${index + 1}`,
      value: ans.answer,
      positionId: positionId,
      correct: true
    }));

    // Add positionId marker to questionText if not already present
    let questionTextWithPosition = editorData;
    if (!questionTextWithPosition.includes(`[[pos_${positionId}]]`)) {
      questionTextWithPosition += `<br>[[pos_${positionId}]]`;
    }
    
    const newQuestionData = {
      id: questionData?.id || Date.now(),
      type: 'REWRITE',
      title: 'Re-write',
      questionText: questionTextWithPosition,
      question: questionTextWithPosition, // For backward compatibility
      correctAnswers: correctAnswers,
      correctAnswer: correctAnswers.map(ans => ans.answer).join(', '),
      weight: weight,
      content: {
        data: contentData
      }
    };

    console.log('=== REWRITE QUESTION HTML ===');
    console.log('Question HTML:', questionTextWithPosition);
    console.log('Correct Answers:', correctAnswers);
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

  const handleCancel = () => {
    const colors = getAnswerColors();
    setEditorData('');
    setCorrectAnswers([{ id: 1, answer: "", color: colors[0] }]);
    setWeight(1);
    onCancel();
  };

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
						{questionData ? 'Edit Re-write Question' : 'Create Re-write Question'}
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
            💡 Tips: Create the question on the left • Add multiple correct answers on the right
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

      {/* Right Panel - Correct Answers Grid */}
        <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative'
      }}>
        {/* Answers Grid Header */}
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
            Correct Answers ({correctAnswers.length})
          </span>
          <Button
            icon={<PlusOutlined />}
            onClick={handleAddAnswer}
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
              Add Answer
          </Button>
        </div>

        {/* Answers Grid Container - 2x2 Layout */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridAutoRows: 'min-content',
          gap: '16px',
          flex: 1,
          overflowY: 'auto',
          padding: '4px',
          alignContent: 'start'
        }}>
          {correctAnswers.map((answer, index) => (
            <div
              key={answer.id}
              onMouseEnter={() => setHoveredAnswer(answer.id)}
              onMouseLeave={() => setHoveredAnswer(null)}
              style={{
                background: `linear-gradient(135deg, ${answer.color}cc 0%, ${answer.color} 100%)`,
                borderRadius: '16px',
                padding: '24px',
                minHeight: '320px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: hoveredAnswer === answer.id
                  ? `0 12px 32px ${answer.color}80`
                  : '0 4px 16px rgba(0,0,0,0.08)',
                border: '2px solid rgba(255,255,255,0.5)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredAnswer === answer.id ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                cursor: 'pointer',
                overflow: 'visible'
              }}
            >
              {/* Answer Label */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '18px',
                color: '#333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                border: `2px solid ${answer.color}`
              }}>
                {index + 1}
              </div>

              {/* Delete Button */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                {correctAnswers.length > 1 && (
                  <Tooltip title="Delete Answer">
                  <Button
                    size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAnswer(answer.id);
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
                )}
              </div>

              {/* Answer Editor */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                marginTop: '60px',
                position: 'relative',
                zIndex: 1
              }}>
                <div 
                  className={`option-editor option-editor-${answer.id}`}
                style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.98)',
                    border: '2px solid rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <CKEditor
                    key={`answer-editor-${answer.id}`}
                    editor={ClassicEditor}
                    data={answer.answer}
                    config={answerEditorConfig}
                    onChange={(event, editor) => handleAnswerEditorChange(answer.id, event, editor)}
                    onReady={(editor) => {
                      answerEditorsRef.current[answer.id] = editor;
                    }}
              />
            </div>
            {/* Character Counter */}
            <div style={{
              marginTop: '6px',
              textAlign: 'right',
              fontSize: '12px',
              fontWeight: 600,
              color: getPlainText(answer.answer).length > 200 ? '#ff4d4f' : '#595959'
            }}>
              {`${Math.min(getPlainText(answer.answer).length, 200)}/200`}
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

export default RewriteModal;
