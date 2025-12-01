import React, { useState, useRef, useCallback, useEffect, useMemo, memo } from "react";
import {
  Modal,
  Button,
  InputNumber,
  Tooltip,
} from "antd";
import { useTranslation } from 'react-i18next';
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

// Memoized Answer Card to minimize re-renders while typing
const AnswerCard = memo(({ answer, index, answerEditorConfig, getPlainText, onRemove, onChange, answerEditorsRef, canDelete, onHover, t }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      key={answer.id}
      onMouseEnter={() => { setIsHovered(true); onHover && onHover(answer.id); }}
      onMouseLeave={() => { setIsHovered(false); onHover && onHover(null); }}
      style={{
        background: `linear-gradient(135deg, ${answer.color}cc 0%, ${answer.color} 100%)`,
        borderRadius: '16px',
        padding: '24px',
        minHeight: '320px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isHovered ? `0 12px 32px ${answer.color}80` : '0 4px 16px rgba(0,0,0,0.08)',
        border: '2px solid rgba(255,255,255,0.5)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        cursor: 'pointer',
        overflow: 'visible'
      }}
    >
      {/* Answer Label */}
      <div style={{
        position: 'absolute', top: '16px', left: '16px', width: '40px', height: '40px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '18px', color: '#333', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: `2px solid ${answer.color}`
      }}>
        {index + 1}
      </div>

      {/* Delete Button */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        {canDelete && (
          <Tooltip title={t('dailyChallenge.deleteAnswer', 'Delete Answer')}>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => { e.stopPropagation(); onRemove(answer.id); }}
              style={{
                background: 'rgba(255, 77, 79, 0.9)', color: 'white', border: 'none', borderRadius: '8px',
                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
              }}
            />
          </Tooltip>
        )}
      </div>

      {/* Answer Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginTop: '60px', position: 'relative', zIndex: 1 }}>
        <div className={`option-editor option-editor-${answer.id}`} style={{ borderRadius: '12px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.98)', border: '2px solid rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}>
          <CKEditor
            key={`answer-editor-${answer.id}`}
            editor={ClassicEditor}
            data={answer.answer}
            config={answerEditorConfig}
            onChange={(event, editor) => onChange(answer.id, event, editor)}
            onReady={(editor) => { answerEditorsRef.current[answer.id] = editor; }}
          />
        </div>
        {/* Character Counter */}
        <div style={{ marginTop: '6px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: getPlainText(answer.answer).length > 200 ? '#ff4d4f' : '#595959' }}>
          {`${Math.min(getPlainText(answer.answer).length, 200)}/200`}
        </div>
      </div>
    </div>
  );
}, (prev, next) => prev.answer === next.answer && prev.index === next.index);

const RewriteModal = ({ visible, onCancel, onSave, questionData = null }) => {
  const { t } = useTranslation();
  
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
  const [questionCharCount, setQuestionCharCount] = useState(0);
  const editorRef = useRef(null);
  const answerEditorsRef = useRef({});
  const lastValidQuestionDataRef = useRef('');

  const getPlainText = useCallback((html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html || '';
    return (tempDiv.textContent || tempDiv.innerText || '').trim();
  }, []);

  // Memoize CKEditor config for question editor
  const questionEditorConfig = useMemo(() => ({
    placeholder: t('dailyChallenge.enterYourQuestionHere', 'Enter your question here...'),
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
        { model: 'paragraph', title: t('dailyChallenge.paragraph', 'Paragraph'), class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: t('dailyChallenge.heading1', 'Heading 1'), class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: t('dailyChallenge.heading2', 'Heading 2'), class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: t('dailyChallenge.heading3', 'Heading 3'), class: 'ck-heading_heading3' }
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
	}), [t]);

  // Memoize answer editor config (simpler toolbar)
  const answerEditorConfig = useMemo(() => ({
    placeholder: t('dailyChallenge.typeYourAnswerHere', 'Type your answer here...'),
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
	}), [t]);

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
          setQuestionCharCount(getPlainText(questionText).length);
          lastValidQuestionDataRef.current = questionText;
          
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
        } else {
          // New question - reset character count
          setQuestionCharCount(0);
          lastValidQuestionDataRef.current = '';
        }
      }, 0);
    }
  }, [questionData, visible, getAnswerColors, getPlainText]);

  // Debounced editor change handler for main question
  const editorChangeTimeoutRef = useRef(null);
  const handleEditorChange = useCallback((event, editor) => {
    const data = editor.getData();
    const plainText = getPlainText(data);
    
    // Update counter immediately for real-time feedback
    setQuestionCharCount(plainText.length);
    
    // Debounce the actual data update and validation
    if (editorChangeTimeoutRef.current) {
      clearTimeout(editorChangeTimeoutRef.current);
    }
    editorChangeTimeoutRef.current = setTimeout(() => {
      // Enforce max 600 characters (plain text length)
      if (plainText.length > 600) {
        spaceToast.warning(t('dailyChallenge.maximum600CharactersAllowed', 'Maximum 600 characters allowed for the question'));
        // Revert to last valid HTML snapshot
        if (lastValidQuestionDataRef.current !== '' && editorRef.current) {
          editorRef.current.setData(lastValidQuestionDataRef.current);
          // Reset counter to last valid count
          const lastValidPlainText = getPlainText(lastValidQuestionDataRef.current);
          setQuestionCharCount(lastValidPlainText.length);
        } else {
          setQuestionCharCount(600);
        }
        return;
      }
      
      // Update last valid HTML snapshot
      lastValidQuestionDataRef.current = data;
      
      setEditorData(prevData => {
        // Only update if data actually changed
        if (prevData !== data) {
          return data;
        }
        return prevData;
      });
    }, 150);
  }, [getPlainText]);

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
        spaceToast.warning(t('dailyChallenge.maximum200CharactersAllowed', 'Maximum 200 characters allowed'));
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
        spaceToast.warning(t('dailyChallenge.maximum8AnswersAllowed', 'Maximum 8 answers allowed'));
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
      spaceToast.warning(t('dailyChallenge.questionMustHaveAtLeastOneCorrectAnswer', 'Question must have at least one correct answer'));
        return prevAnswers;
      }
    });
  }, []);

  const handleSave = async () => {
    // Validate editor data
    const questionPlainText = getPlainText(editorData);
    if (!questionPlainText || !questionPlainText.trim()) {
      spaceToast.warning(t('dailyChallenge.pleaseEnterQuestionTextRewrite', 'Please enter the question text'));
      return;
    }

    // Validate question length (plain text <= 600)
    if (questionPlainText.length > 600) {
      spaceToast.warning(t('dailyChallenge.maximum600CharactersAllowed', 'Maximum 600 characters allowed for the question'));
      return;
    }

    // Validate answer length (plain text <= 200) and non-empty
    const tooLong = correctAnswers.some(ans => getPlainText(ans.answer).length > 200);
    if (tooLong) {
      spaceToast.error(t('dailyChallenge.eachAnswerMustBe200Characters', 'Each answer must be 200 characters or fewer'));
      return;
    }

    // Check empty answers
    const hasEmptyAnswers = correctAnswers.some(ans => !getPlainText(ans.answer));
    if (hasEmptyAnswers) {
      spaceToast.warning(t('dailyChallenge.pleaseFillInAllCorrectAnswers', 'Please fill in all correct answers'));
      return;
    }

    // Validate duplicate answers
    const answerTexts = correctAnswers.map(ans => getPlainText(ans.answer).toLowerCase().trim());
    const duplicates = answerTexts.filter((text, index) => text && answerTexts.indexOf(text) !== index);
    if (duplicates.length > 0) {
      spaceToast.warning(t('dailyChallenge.cannotCreateDuplicateAnswers', 'Cannot create duplicate answers. Please ensure all answers are unique.'));
      return;
    }

    // Generate unique positionId for REWRITE question
    const positionId = `a1b2c3${Date.now()}`;
    
    // Convert HTML to plain text
    const plainTextQuestion = getPlainText(editorData);
    
    // Create content.data array with correct answers (using plain text for answers)
    const contentData = correctAnswers.map((ans, index) => ({
      id: `item${index + 1}`,
      value: getPlainText(ans.answer), // Store plain text instead of HTML
      positionId: positionId,
      correct: true
    }));

    // Add positionId marker to questionText if not already present (using plain text)
    let questionTextWithPosition = plainTextQuestion;
    if (!questionTextWithPosition.includes(`[[pos_${positionId}]]`)) {
      questionTextWithPosition += `\n[[pos_${positionId}]]`;
    }
    
    const newQuestionData = {
      id: questionData?.id || Date.now(),
      type: 'REWRITE',
      title: 'Re-write',
      questionText: questionTextWithPosition,
      question: questionTextWithPosition, // For backward compatibility
      correctAnswers: correctAnswers.map(ans => ({
        ...ans,
        answer: getPlainText(ans.answer) // Store plain text
      })),
      correctAnswer: correctAnswers.map(ans => getPlainText(ans.answer)).join(', '), // Use plain text
      weight: weight,
      content: {
        data: contentData
      }
    };

    try {
      setSaving(true);
      const ret = onSave(newQuestionData);
      if (ret && typeof ret.then === 'function') {
        await ret;
        handleCancel();
      }
    } catch (e) {
      spaceToast.error(t('dailyChallenge.failedToSaveQuestion', 'Failed to save question'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const colors = getAnswerColors();
    setEditorData('');
    setQuestionCharCount(0);
    lastValidQuestionDataRef.current = '';
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
						{questionData ? t('dailyChallenge.editRewriteQuestion', 'Edit Re-write Question') : t('dailyChallenge.createRewriteQuestion', 'Create Re-write Question')}
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
            {t('dailyChallenge.tipsCreateQuestionOnLeft', '💡 Tips: Create the question on the left • Add multiple correct answers on the right')}
        </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#666' }}>{t('dailyChallenge.weight', 'Weight')}</span>
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
              <SaveOutlined /> {t('common.save', 'Save')} {t('dailyChallenge.question', 'Question')}
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
                  // Initialize character count on ready
                  const initialPlainText = getPlainText(editorData);
                  setQuestionCharCount(initialPlainText.length);
                  lastValidQuestionDataRef.current = editorData;
                }}
              />
              {/* Character Counter for Question (600 max) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: questionCharCount > 600 ? '#ff4d4f' : '#595959',
                  pointerEvents: 'none',
                  zIndex: 10,
                  background: 'rgba(240, 247, 255, 0.9)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}>
                {`${Math.min(questionCharCount, 600)}/600`}
              </div>
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
            {t('dailyChallenge.correctAnswers', 'Correct Answers')} ({correctAnswers.length})
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
              {t('dailyChallenge.addAnswer', 'Add Answer')}
          </Button>
        </div>

        {/* Answers Grid Container - 2x2 Layout */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridAutoRows: 'min-content', gap: '16px',
          flex: 1, overflowY: 'auto', padding: '4px', alignContent: 'start'
        }}>
          {correctAnswers.map((answer, index) => (
            <AnswerCard
              key={answer.id}
              answer={answer}
              index={index}
              answerEditorConfig={answerEditorConfig}
              getPlainText={getPlainText}
              onRemove={handleRemoveAnswer}
              onChange={handleAnswerEditorChange}
              answerEditorsRef={answerEditorsRef}
              canDelete={correctAnswers.length > 1}
              onHover={(id) => setHoveredAnswer(id)}
              t={t}
            />
          ))}
        </div>
        </div>
      </div>
    </Modal>
  );
};

export default RewriteModal;
