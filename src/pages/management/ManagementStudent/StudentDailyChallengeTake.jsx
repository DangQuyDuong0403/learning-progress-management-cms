import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import {
  Button,
  Typography,
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  MenuOutlined,
  CloseOutlined,
  SaveOutlined,
  ClockCircleOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import ThemedLayout from "../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../component/spinner/LoadingWithEffect";
import "../ManagementTeacher/dailyChallenge/DailyChallengeContent.css";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../contexts/ThemeContext";
import usePageTitle from "../../../hooks/usePageTitle";
import { spaceToast } from "../../../component/SpaceToastify";
import dailyChallengeApi from "../../../apis/backend/dailyChallengeManagement";
import { useTestSecurity } from "../../../hooks/useTestSecurity";
import TextTranslator from "../../../component/TextTranslator/TextTranslator";

// Context for collecting answers from child components
const AnswerCollectionContext = createContext(null);
// Context for restoring answers to child components
const AnswerRestorationContext = createContext(null);
// Context to trigger debounced auto-save when answers change
const AutoSaveTriggerContext = createContext(null);

// Memoized HTML renderer to keep DOM stable and preserve text selection
const MemoizedHTML = React.memo(
  function MemoizedHTML({ html, className, style }) {
    const enhanceImages = (rawHtml) => {
      if (!rawHtml) return '';
      // If image has no style attribute, add fixed size. If it has style, append our constraints.
      let result = String(rawHtml)
        .replace(/<img(?![^>]*style=)/gi, '<img style="width:300px;height:300px;object-fit:contain;"')
        .replace(/<img([^>]*?)style="([^"]*)"/gi, (m, prefix, styles) => {
          const appended = styles.includes('width') || styles.includes('height')
            ? `${styles}; width:300px; height:300px; object-fit:contain;`
            : `${styles}; width:300px; height:300px; object-fit:contain;`;
          return `<img${prefix}style="${appended}"`;
        });
      return result;
    };

    const processedHtml = enhanceImages(html);

    return (
      <div
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    );
  },
  (prev, next) => {
    if (prev.html !== next.html) return false;
    if (prev.className !== next.className) return false;
    const prevStyle = prev.style || {};
    const nextStyle = next.style || {};
    const prevKeys = Object.keys(prevStyle);
    const nextKeys = Object.keys(nextStyle);
    if (prevKeys.length !== nextKeys.length) return false;
    for (let i = 0; i < prevKeys.length; i++) {
      const k = prevKeys[i];
      if (prevStyle[k] !== nextStyle[k]) return false;
    }
    return true;
  }
);

// Helper function: process passage/transcript HTML and normalize media
const processPassageContent = (content, theme, challengeType) => {
  if (!content) return '';
  // Constrain all images to 300x300 for consistent layout
  const enhanceImages = (rawHtml) => String(rawHtml)
    .replace(/<img(?![^>]*style=)/gi, '<img style="width:300px;height:300px;object-fit:contain;"')
    .replace(/<img([^>]*?)style="([^"]*)"/gi, (m, prefix, styles) => {
      return `<img${prefix}style="${styles}; width:300px; height:300px; object-fit:contain;"`;
    });

  let processed = enhanceImages(content);

  // Only process for Speaking challenges
  if (challengeType === 'SP') {
    // Remove [[dur_3]] without replacement, as the static badge is now handled separately
    processed = processed.replace(/\[\[dur_3\]\]/g, '');
  }

  return processed;
};



// Section Question Component for Reading/Listening sections
const SectionQuestionItem = ({ question, index, theme, sectionScore }) => {
  const registerAnswerCollector = useContext(AnswerCollectionContext);
  const registerAnswerRestorer = useContext(AnswerRestorationContext);
  const triggerAutoSave = useContext(AutoSaveTriggerContext);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [droppedItems, setDroppedItems] = useState({});
  const [availableItems, setAvailableItems] = useState({});
  const [dragOverPosition, setDragOverPosition] = useState({});
  const [reorderStates, setReorderStates] = useState({});

  const toPlainText = (html) => {
    if (!html) return '';
    return String(html)
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Initialize availableItems for drag and drop questions
  useEffect(() => {
    if (question.questions) {
      setAvailableItems(prev => {
        const newItems = { ...prev };
        let hasChanges = false;
        
        question.questions.forEach(q => {
          if (q.type === 'DRAG_AND_DROP' && q.content?.data && !newItems[q.id]) {
            // Include ALL values (both correct and incorrect) and preserve duplicates
            const dragDropItems = q.content.data
              .map(item => item.value)
              .filter(Boolean);
            if (dragDropItems.length > 0) {
              newItems[q.id] = dragDropItems;
              hasChanges = true;
            }
          }
        });
        
        return hasChanges ? newItems : prev;
      });
    }
  }, [question.questions]);

  // Local refs for Fill-in-the-Blank inputs to avoid caret jumps
  const fillBlankRefs = useRef({});

  // Register answer collectors for all questions in this section
  useEffect(() => {
    if (!registerAnswerCollector || !question.questions) return;

    const unregisterFunctions = [];

    question.questions.forEach(q => {
      const getAnswer = () => {
        let answer = null;
        let options = undefined;

        if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE') {
          answer = selectedAnswers[q.id] || null;
          // Build options mapping for MC/TF
          if (q?.options && Array.isArray(q.options) && q.options.length > 0) {
            options = q.options.map((opt, idx) => ({ key: opt.key || String.fromCharCode(65 + idx), text: opt.text }));
          } else if (q?.content?.data && Array.isArray(q.content.data)) {
            options = q.content.data.map((d, idx) => ({
              key: q.type === 'TRUE_OR_FALSE' ? (String(d.value).toLowerCase() === 'true' ? 'A' : 'B') : (d.id || String.fromCharCode(65 + idx)),
              text: d.value
            }));
          }
        } else if (q.type === 'MULTIPLE_SELECT') {
          answer = selectedAnswers[q.id] || [];
          if (q?.options && Array.isArray(q.options) && q.options.length > 0) {
            options = q.options.map((opt, idx) => ({ key: opt.key || String.fromCharCode(65 + idx), text: opt.text }));
          } else if (q?.content?.data && Array.isArray(q.content.data)) {
            options = q.content.data.map((d, idx) => ({ key: d.id || String.fromCharCode(65 + idx), text: d.value }));
          }
        } else if (q.type === 'DROPDOWN') {
          // Collect all dropdown answers for this question
          const dropdownAnswers = {};
          Object.keys(selectedAnswers).forEach(key => {
            if (key.startsWith(`${q.id}_pos_`)) {
              const positionId = key.split('_pos_')[1];
              dropdownAnswers[key] = selectedAnswers[key];
            }
          });
          answer = Object.keys(dropdownAnswers).length > 0 ? dropdownAnswers : null;
        } else if (q.type === 'FILL_IN_THE_BLANK' || q.type === 'FILL_BLANK') {
          // Collect all fill-in-the-blank answers for this question
          const fibAnswers = {};
          Object.keys(selectedAnswers).forEach(key => {
            if (key.startsWith(`${q.id}_pos_`)) {
              fibAnswers[key] = selectedAnswers[key];
            }
          });
          answer = Object.keys(fibAnswers).length > 0 ? fibAnswers : null;
        } else if (q.type === 'DRAG_AND_DROP') {
          answer = droppedItems[q.id] || null;
        } else if (q.type === 'REARRANGE' || q.type === 'REORDER') {
          const reorderState = reorderStates[q.id];
          if (reorderState?.items && Array.isArray(reorderState.items) && reorderState.items.length > 0) {
            answer = reorderState.items;
          } else if (reorderState?.droppedItems && typeof reorderState.droppedItems === 'object') {
            // Derive ordered array from droppedItems mapping
            const indices = Object.keys(reorderState.droppedItems)
              .map(k => parseInt(k, 10))
              .filter(i => !Number.isNaN(i))
              .sort((a, b) => a - b);
            const arr = indices.map(i => reorderState.droppedItems[i]).filter(Boolean);
            answer = arr.length > 0 ? arr : null;
          } else {
            answer = null;
          }
        }

        if (!answer) return null;
        // Normalize questionType for API
        const normalizedType = (q.type === 'FILL_IN_THE_BLANK') ? 'FILL_BLANK'
          : (q.type === 'REARRANGE') ? 'REORDER'
          : q.type;
        return { answer, questionType: normalizedType, options };
      };

      const unregister = registerAnswerCollector(q.id, getAnswer);
      if (unregister) {
        unregisterFunctions.push(unregister);
      }
    });

    return () => {
      unregisterFunctions.forEach(unregister => unregister());
    };
  }, [registerAnswerCollector, question.questions, selectedAnswers, droppedItems, reorderStates]);

  // Sync restored FIB values into DOM without breaking caret (only when not focused)
  useEffect(() => {
    if (!question?.questions) return;
    question.questions.forEach(q => {
      if (q.type !== 'FILL_IN_THE_BLANK' && q.type !== 'FILL_BLANK') return;
      Object.keys(selectedAnswers).forEach(key => {
        if (!key.startsWith(`${q.id}_pos_`)) return;
        const el = fillBlankRefs.current[key];
        const value = selectedAnswers[key] ?? '';
        if (el && document.activeElement !== el) {
          if ((el.textContent || '') !== String(value)) {
            el.textContent = String(value);
          }
        }
      });
    });
  }, [selectedAnswers, question?.questions]);

  // Register answer restorers for all questions in this section
  useEffect(() => {
    if (!registerAnswerRestorer || !question.questions) return;

    const unregisterFunctions = [];

    question.questions.forEach(q => {
      const setAnswer = (answer) => {
        if (!answer && answer !== 0 && answer !== '') return;

        if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE') {
          if (typeof answer === 'string') {
            // Map restored text/value back to option key
            let options = [];
            if (q?.options && Array.isArray(q.options) && q.options.length > 0) {
              options = q.options.map((opt, idx) => ({ key: opt.key || String.fromCharCode(65 + idx), text: typeof opt.text === 'string' ? opt.text.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim() : opt.text }));
            } else if (q?.content?.data && Array.isArray(q.content.data)) {
              options = q.content.data.map((d, idx) => ({
                key: q.type === 'TRUE_OR_FALSE' ? (String(d.value).toLowerCase() === 'true' ? 'A' : 'B') : (d.id || String.fromCharCode(65 + idx)),
                text: typeof d.value === 'string' ? d.value.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim() : d.value
              }));
            }
            const normalized = String(answer).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
            const match = options.find(o => o.text === normalized || o.key === normalized);
            setSelectedAnswers(prev => ({ ...prev, [q.id]: match ? match.key : normalized }));
          }
        } else if (q.type === 'MULTIPLE_SELECT') {
          if (Array.isArray(answer)) {
            let options = [];
            if (q?.options && Array.isArray(q.options) && q.options.length > 0) {
              options = q.options.map((opt, idx) => ({ key: opt.key || String.fromCharCode(65 + idx), text: typeof opt.text === 'string' ? opt.text.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim() : opt.text }));
            } else if (q?.content?.data && Array.isArray(q.content.data)) {
              options = q.content.data.map((d, idx) => ({ key: d.id || String.fromCharCode(65 + idx), text: typeof d.value === 'string' ? d.value.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim() : d.value }));
            }
            const keys = answer.map(val => {
              const normalized = String(val).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
              const match = options.find(o => o.text === normalized || o.key === normalized);
              return match ? match.key : normalized;
            });
            setSelectedAnswers(prev => ({ ...prev, [q.id]: keys }));
          }
        } else if (q.type === 'DROPDOWN') {
          if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
            setSelectedAnswers(prev => ({ ...prev, ...answer }));
          }
          } else if (q.type === 'FILL_IN_THE_BLANK' || q.type === 'FILL_BLANK') {
            if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
              setSelectedAnswers(prev => ({ ...prev, ...answer }));
            }
        } else if (q.type === 'DRAG_AND_DROP') {
          if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
            setDroppedItems(prev => ({ ...prev, [q.id]: answer }));
          }
        } else if (q.type === 'REARRANGE' || q.type === 'REORDER') {
          if (Array.isArray(answer)) {
            // Place restored items into dropped slots by index
            const dropped = answer.reduce((acc, val, idx) => {
              if (val !== undefined && val !== null && String(val).trim() !== '') acc[idx] = val;
              return acc;
            }, {});
            const reorderState = {
              sourceItems: [],
              droppedItems: dropped,
              dragOverIndex: null,
              draggedItem: null,
              isDraggingFromSource: false,
              wasDropped: false
            };
            setReorderStates(prev => ({ ...prev, [q.id]: reorderState }));
          }
        }
      };

      const unregister = registerAnswerRestorer(q.id, setAnswer);
      if (unregister) {
        unregisterFunctions.push(unregister);
      }
    });

    return () => {
      unregisterFunctions.forEach(unregister => unregister());
    };
  }, [registerAnswerRestorer, question.questions]);

  // Debounced auto-save for RE changes (answers/drag/reorder)
  useEffect(() => {
    if (triggerAutoSave) triggerAutoSave();
  }, [triggerAutoSave, selectedAnswers, droppedItems, reorderStates]);

  // Sync restored LI Fill-Blank values to DOM when state changes
  useEffect(() => {
    if (!question?.questions) return;
    question.questions.forEach(q => {
      if (q.type !== 'FILL_IN_THE_BLANK' && q.type !== 'FILL_BLANK') return;
      Object.keys(selectedAnswers).forEach(key => {
        if (!key.startsWith(`${q.id}_pos_`)) return;
        const el = fillBlankRefs.current[key];
        const value = selectedAnswers[key] ?? '';
        if (el && document.activeElement !== el) {
          if ((el.textContent || '') !== String(value)) {
            el.textContent = String(value);
          }
        }
      });
    });
  }, [selectedAnswers, question?.questions]);

  const handleAnswerSelect = (questionId, optionKey) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionKey
    }));
  };
  return (
    <>
      <style>
        {`
          .reading-passage-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .reading-passage-scrollbar::-webkit-scrollbar-track {
            background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'};
            border-radius: 4px;
          }
          .reading-passage-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'};
            border-radius: 4px;
            border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'};
          }
          .reading-passage-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'};
          }
        `}
      </style>
      <div
        className={`question-item ${theme}-question-item`}
        style={{
          marginBottom: '24px',
          borderRadius: '16px',
          padding: '24px',
          border: '2px solid',
          borderColor: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.25)' 
            : 'rgba(138, 122, 255, 0.2)',
          background: theme === 'sun' 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
          boxShadow: theme === 'sun' 
            ? '0 4px 16px rgba(113, 179, 253, 0.1)'
            : '0 4px 16px rgba(138, 122, 255, 0.12)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(10px)'
        }}
      >
      {/* Header */}
      <div className="question-header" style={{
        paddingBottom: '14px',
        marginBottom: '16px',
        borderBottom: '2px solid',
        borderBottomColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography.Text strong style={{ 
          fontSize: '20px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          {index + 1}. Reading Section
        </Typography.Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <Typography.Text style={{ fontSize: '14px', opacity: 0.7 }}>
            ({question.points || sectionScore?.totalScore || 0} {question.points !== 1 ? 'points' : 'point'})
        </Typography.Text>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'flex', gap: '24px', minHeight: '500px' }}>
        {/* Left Column - Reading Passage */}
        <div 
          className="reading-passage-scrollbar"
          style={{
            flex: '1',
            padding: '20px',
            background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
            overflowY: 'auto',
            maxHeight: '600px',
            scrollbarWidth: 'thin',
            scrollbarColor: theme === 'sun' 
              ? '#1890ff rgba(24, 144, 255, 0.2)' 
              : '#8B5CF6 rgba(138, 122, 255, 0.2)'
          }}>

          {React.useMemo(() => (
            <div 
              className="passage-text-content"
              style={{
                fontSize: '15px',
                lineHeight: '1.8',
                color: theme === 'sun' ? '#333' : '#1F2937',
                textAlign: 'justify'
              }}
              dangerouslySetInnerHTML={{ __html: question.passage || '' }}
            />
          ), [question.passage, theme])}
        </div>

        {/* Right Column - Questions */}
        <div style={{
          flex: '1',
          background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
          overflowY: 'auto',
          maxHeight: '600px'
        }}>
          <div style={{ padding: '20px' }}>
            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {question.questions
                .slice()
                .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0) || ((a.id || 0) - (b.id || 0)))
                .map((q, qIndex) => (
                <div key={q.id} style={{
                  padding: '16px',
                  background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`
                }}>
                  {/* Answer Options */}
                  {q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE' || q.type === 'MULTIPLE_SELECT' ? (
                    (() => {
                      const options = (q.options && q.options.length
                        ? q.options
                        : (q.content?.data || []).map((d, idx) => ({
                            // For TRUE/FALSE questions, we don't want to show backend ids like "true_option"
                            // Build a simple A/B key but rely on text for display
                            key: q.type === 'TRUE_OR_FALSE' ? (d.value === 'True' ? 'A' : 'B') : String.fromCharCode(65 + idx),
                            text: d.value
                          }))
                      );
                      const isMulti = q.type === 'MULTIPLE_SELECT';
                      const selected = selectedAnswers[q.id] || (isMulti ? [] : null);
                      const isChecked = (k) => isMulti ? (selected || []).includes(k) : selected === k;
                      const toggle = (k) => {
                        if (isMulti) {
                          setSelectedAnswers(prev => ({
                            ...prev,
                            [q.id]: (prev[q.id] || []).includes(k)
                              ? (prev[q.id] || []).filter(x => x !== k)
                              : [ ...(prev[q.id] || []), k ]
                          }));
                        } else {
                          setSelectedAnswers(prev => ({ ...prev, [q.id]: k }));
                        }
                      };
                      return (
                        <div style={{ 
                          marginBottom: '16px',
                          fontSize: '15px', 
                          fontWeight: 350,
                          lineHeight: '1.8',
                          color: '#000000'
                        }}>
                          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                            Question {qIndex + 1}:
                          </div>
                          <MemoizedHTML 
                            className="question-text-content"
                            style={{ marginBottom: '10px' }}
                            html={q.questionText || q.question || ''}
                          />
                          <div className="question-options" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr', 
                            gap: '12px'
                          }}>
                            {options.map((opt, idx) => {
                              const key = opt.key || String.fromCharCode(65 + idx);
                              const checked = isChecked(key);
                              return (
                                <label key={key} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '12px 14px',
                                  background: checked
                                    ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                                    : (theme === 'sun' ? '#fff' : 'rgba(255,255,255,0.03)'),
                                  border: `2px solid ${checked ? (theme === 'sun' ? '#1890ff' : '#8B5CF6') : (theme === 'sun' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)')}`,
                                  borderRadius: '12px',
                                  cursor: 'pointer'
                                }}>
                                  <input
                                    type={isMulti ? 'checkbox' : 'radio'}
                                    name={`reading-q-${q.id}`}
                                    checked={checked}
                                    onChange={() => toggle(key)}
                                    style={{ width: '18px', height: '18px', accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6' }}
                                  />
                                  {q.type !== 'TRUE_OR_FALSE' && (
                                    <span style={{ fontWeight: 600 }}>{key}.</span>
                                  )}
                                  <span 
                                    className="option-text"
                                    style={{ flex: 1, lineHeight: '1.6' }}
                                    dangerouslySetInnerHTML={{ __html: opt.text || opt.value || '' }}
                                  />
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  ) : q.type === 'DROPDOWN' ? (
                    // Dropdown
                    <div style={{ 
                      marginBottom: '16px',
                      fontSize: '15px', 
                      fontWeight: 350,
                      lineHeight: '1.8',
                      color: '#000000'
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                        Question {qIndex + 1}:
                      </div>
                      <div>
                        {(() => {
                          const text = q.questionText || q.question || '';
                          const parts = [];
                          const regex = /\[\[pos_(.*?)\]\]/g;
                          let last = 0; let match; let idx = 0;
                          while ((match = regex.exec(text)) !== null) {
                            if (match.index > last) {
                            parts.push(
                              <span 
                                  key={`text_${idx}`}
                                  className="question-text-content"
                                  dangerouslySetInnerHTML={{ __html: text.slice(last, match.index) }}
                                />
                              );
                            }
                            const positionId = match[1];
                            const contentData = q.content?.data || [];
                            // Check if any options have positionId
                            const hasPositionIds = contentData.some(opt => opt.positionId);
                            // If options have positionId, filter by positionId; otherwise use all options
                            const optionsForPosition = hasPositionIds
                              ? contentData.filter(opt => {
                                  const optPosId = String(opt.positionId || '');
                                  const matchPosId = String(positionId);
                                  return optPosId === matchPosId;
                                })
                              : contentData;
                            parts.push(
                            <select
                                key={`dd_${q.id}_${idx++}`}
                                value={selectedAnswers[`${q.id}_pos_${positionId}`] || ''}
                              onChange={(e) => setSelectedAnswers(prev => ({
                                ...prev,
                                  [`${q.id}_pos_${positionId}`]: e.target.value
                              }))}
                              style={{
                                display: 'inline-block',
                                minWidth: '120px',
                                height: '32px',
                                padding: '4px 12px',
                                margin: '0 8px 6px 8px',
                                background: theme === 'sun' 
                                  ? 'rgba(24, 144, 255, 0.08)' 
                                  : 'rgba(138, 122, 255, 0.12)',
                                border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                cursor: 'pointer',
                                outline: 'none',
                                textAlign: 'center'
                              }}
                            >
                              <option value="">Select</option>
                                {optionsForPosition.map((item) => (
                                  <option key={item.id} value={item.value || ''} dangerouslySetInnerHTML={{ __html: item.value || '' }}>
                                  </option>
                              ))}
                            </select>
                            );
                            last = match.index + match[0].length;
                          }
                          if (last < text.length) {
                            parts.push(
                              <span 
                                key={`text_final_${idx}`}
                                className="question-text-content"
                                dangerouslySetInnerHTML={{ __html: text.slice(last) }}
                              />
                            );
                          }
                          return parts;
                        })()}
                      </div>
                    </div>
                  ) : q.type === 'DRAG_AND_DROP' ? (
                    // Drag and Drop
                    (() => {
                      const qDroppedItems = droppedItems[q.id] || {};
                      // Get all items from content.data (both correct and incorrect) and preserve duplicates
                      const allItems = (q.content?.data || [])
                        .map(item => item.value)
                        .filter(Boolean);
                      
                      // Initialize availableItems if not set
                      if (availableItems[q.id] === undefined && allItems.length > 0) {
                        setAvailableItems(prev => ({
                          ...prev,
                          [q.id]: allItems
                        }));
                      }
                      
                      const qAvailableItems = availableItems[q.id] || allItems;
                      
                      const handleDragStart = (e, item, isDropped = false, positionId = null) => {
                        e.dataTransfer.setData('text/plain', item);
                        e.dataTransfer.setData('isDropped', isDropped);
                        e.dataTransfer.setData('positionId', positionId || '');
                        e.dataTransfer.setData('questionId', q.id);
                      };

                      const handleDrop = (e, positionId) => {
                        e.preventDefault();
                        const item = e.dataTransfer.getData('text/plain');
                        const isDropped = e.dataTransfer.getData('isDropped') === 'true';
                        const fromPositionId = e.dataTransfer.getData('positionId');
                        const questionId = e.dataTransfer.getData('questionId');
                        
                        if (questionId !== q.id.toString()) return;
                        
                        setDroppedItems(prev => {
                          const newItems = { ...prev };
                          if (!newItems[q.id]) newItems[q.id] = {};
                          const currentItem = newItems[q.id][positionId];
                          
                          // Clear drag over state
                          setDragOverPosition(prev => ({
                            ...prev,
                            [q.id]: null
                          }));
                          
                          // If moving from one position to another
                          if (fromPositionId && fromPositionId !== positionId) {
                            newItems[q.id][positionId] = item;
                            if (fromPositionId in newItems[q.id]) {
                              delete newItems[q.id][fromPositionId];
                            }
                            // Return the old item from target position to available list
                            if (currentItem) {
                              setAvailableItems(prev => ({
                                ...prev,
                                [q.id]: [...(prev[q.id] || []), currentItem]
                              }));
                            }
                            return newItems;
                          }
                          
                          // If dropping from available items (not from another position)
                          if (!isDropped) {
                            newItems[q.id][positionId] = item;
                            // Remove from available items
                            setAvailableItems(prev => ({
                              ...prev,
                              [q.id]: (prev[q.id] || []).filter(i => i !== item)
                            }));
                          }
                          
                          return newItems;
                        });
                      };

                      const handleDragStartFromDropped = (e, item, positionId) => {
                        handleDragStart(e, item, true, positionId);
                        
                        // Remove from dropped items immediately
                        setDroppedItems(prev => {
                          const newItems = { ...prev };
                          if (newItems[q.id]) {
                            delete newItems[q.id][positionId];
                          }
                          return newItems;
                        });
                        
                        // Add back to available items
                        setAvailableItems(prev => ({
                          ...prev,
                          [q.id]: [...(prev[q.id] || []), item]
                        }));
                      };

                      const handleDragOver = (e, positionId) => {
                        e.preventDefault();
                        setDragOverPosition(prev => ({
                          ...prev,
                          [q.id]: positionId
                        }));
                      };

                      const handleDragLeave = (e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          setDragOverPosition(prev => ({
                            ...prev,
                            [q.id]: null
                          }));
                        }
                      };

                      // Parse question text with [[pos_xxx]] placeholders
                      const text = q.questionText || q.question || '';
                      const parts = [];
                      const regex = /\[\[pos_(.*?)\]\]/g;
                      let last = 0; let match; let idx = 0;
                      const positions = [];
                      
                      while ((match = regex.exec(text)) !== null) {
                        if (match.index > last) parts.push({ type: 'text', content: text.slice(last, match.index) });
                        const posId = match[1];
                        positions.push(posId);
                        parts.push({ type: 'position', positionId: posId, index: idx++ });
                        last = match.index + match[0].length;
                      }
                      if (last < text.length) parts.push({ type: 'text', content: text.slice(last) });

                      return (
                        <div style={{ marginBottom: '16px' }}>
                          {/* Stacked Layout: Sentence on top, draggable words below */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '200px' }}>
                            {/* Sentence with drop zones */}
                            <div style={{
                              padding: '16px',
                              background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
                              borderRadius: '8px',
                              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
                            }}>
                              <div style={{ 
                                fontSize: '15px', 
                                fontWeight: 350,
                                lineHeight: '1.8',
                                color: '#000000',
                                marginBottom: '12px'
                              }}>
                                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                                  Question {qIndex + 1}:
                                </div>
                                <div>
                                  {parts.map((part, pIdx) => (
                                    <React.Fragment key={pIdx}>
                                      {part.type === 'text' ? (
                                        <span 
                                          className="question-text-content"
                                          dangerouslySetInnerHTML={{ __html: part.content || '' }}
                                        />
                                      ) : (
                                        qDroppedItems[part.positionId] ? (
                                          <span
                                            draggable
                                            onDragStart={(e) => handleDragStartFromDropped(e, qDroppedItems[part.positionId], part.positionId)}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              minWidth: '100px',
                                              minHeight: '28px',
                                              height: 'auto',
                                              padding: '4px 8px',
                                              margin: '4px 6px 8px 6px',
                                              background: theme === 'sun' ? 'rgba(24, 144, 255, 0.15)' : 'rgba(138, 122, 255, 0.18)',
                                              border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                              borderRadius: '6px',
                                              fontSize: '14px',
                                              fontWeight: '350',
                                              color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                              cursor: 'grab',
                                              transition: 'all 0.2s ease',
                                              verticalAlign: 'baseline',
                                              lineHeight: '1.5',
                                              boxSizing: 'border-box',
                                              textAlign: 'center',
                                              maxWidth: '280px',
                                              whiteSpace: 'normal',
                                              wordBreak: 'break-word',
                                              overflowWrap: 'anywhere'
                                            }}
                                            dangerouslySetInnerHTML={{ __html: qDroppedItems[part.positionId] || '' }}
                                          />
                                        ) : (
                                          <span
                                            onDrop={(e) => handleDrop(e, part.positionId)}
                                            onDragOver={(e) => handleDragOver(e, part.positionId)}
                                            onDragLeave={handleDragLeave}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              minWidth: '100px',
                                              minHeight: '28px',
                                              height: 'auto',
                                              padding: '4px 8px',
                                              margin: '4px 6px 8px 6px',
                                              background: dragOverPosition[q.id] === part.positionId 
                                                ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.25)')
                                                : '#ffffff',
                                              border: `2px ${dragOverPosition[q.id] === part.positionId ? 'solid' : 'dashed'} ${dragOverPosition[q.id] === part.positionId ? (theme === 'sun' ? '#1890ff' : '#8B5CF6') : 'rgba(0, 0, 0, 0.5)'}`,
                                              borderRadius: '6px',
                                              fontSize: '14px',
                                              fontWeight: '350',
                                              color: dragOverPosition[q.id] === part.positionId ? (theme === 'sun' ? '#1890ff' : '#8B5CF6') : 'rgba(0, 0, 0, 0.5)',
                                              cursor: 'pointer',
                                              transition: 'all 0.3s ease',
                                              verticalAlign: 'baseline',
                                              lineHeight: '1.5',
                                              boxSizing: 'border-box',
                                              marginTop: '4px',
                                              transform: dragOverPosition[q.id] === part.positionId ? 'scale(1.05)' : 'scale(1)',
                                              boxShadow: dragOverPosition[q.id] === part.positionId 
                                                ? (theme === 'sun' ? '0 4px 12px rgba(24, 144, 255, 0.3)' : '0 4px 12px rgba(138, 122, 255, 0.3)')
                                                : 'none',
                                              textAlign: 'center',
                                              maxWidth: '280px',
                                              whiteSpace: 'normal',
                                              wordBreak: 'break-word',
                                              overflowWrap: 'anywhere'
                                            }}
                                          >
                                            {dragOverPosition[q.id] === part.positionId ? 'Drop here!' : 'Drop here'}
                                          </span>
                                        )
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Available words for dragging (below) */}
                            <div style={{
                              padding: '16px',
                              background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                              borderRadius: '8px',
                              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
                            }}>
                              <Typography.Text style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                                Drag these words:
                              </Typography.Text>
                              <div style={{ 
                                display: 'flex', 
                                gap: '8px',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '80px'
                              }}>
                                {qAvailableItems.map((item, idx) => (
                                  <span
                                    key={idx}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item)}
                                    style={{
                                      padding: '8px 12px',
                                      background: theme === 'sun' 
                                        ? 'rgba(24, 144, 255, 0.08)' 
                                        : 'rgba(138, 122, 255, 0.12)',
                                      border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                      borderRadius: '8px',
                                      fontSize: '13px',
                                      fontWeight: '600',
                                      color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                      cursor: 'grab',
                                      userSelect: 'none',
                                      transition: 'all 0.2s ease',
                                      minWidth: '60px',
                                      textAlign: 'center',
                                      boxShadow: theme === 'sun' 
                                        ? '0 2px 6px rgba(24, 144, 255, 0.15)' 
                                        : '0 2px 6px rgba(138, 122, 255, 0.15)'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'scale(1.05)';
                                      e.currentTarget.style.boxShadow = theme === 'sun' 
                                        ? '0 4px 10px rgba(24, 144, 255, 0.25)' 
                                        : '0 4px 10px rgba(138, 122, 255, 0.25)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                      e.currentTarget.style.boxShadow = theme === 'sun' 
                                        ? '0 2px 6px rgba(24, 144, 255, 0.15)' 
                                        : '0 2px 6px rgba(138, 122, 255, 0.15)';
                                    }}
                                    dangerouslySetInnerHTML={{ __html: item || '' }}
                                  >
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (q.type === 'FILL_IN_THE_BLANK' || q.type === 'FILL_BLANK' || q.questionType === 'FILL_BLANK' || q.questionType === 'FILL_IN_THE_BLANK') ? (
                    // Fill in the Blank
                    <div style={{ 
                      marginBottom: '16px',
                      fontSize: '15px', 
                      fontWeight: 350,
                      lineHeight: '1.8',
                      color: '#000000'
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                        Question {qIndex + 1}:
                      </div>
                      <div>
                        {(() => {
                          const text = q.questionText || q.question || '';
                          const parts = [];
                          const regex = /\[\[pos_(.*?)\]\]/g;
                          let last = 0; let match; let idx = 0;
                          while ((match = regex.exec(text)) !== null) {
                            if (match.index > last) parts.push(text.slice(last, match.index));
                            const positionId = match[1];
                            parts.push(
                            <span
                                key={`fib_${q.id}_${idx++}`}
                              className="paragraph-input"
                              contentEditable
                                suppressContentEditableWarning
                              onInput={(e) => {
                                const textVal = e.currentTarget.textContent || e.currentTarget.innerText || '';
                                setSelectedAnswers(prev => ({
                                  ...prev,
                                  [`${q.id}_pos_${positionId}`]: textVal
                                }));
                              }}
                              onBlur={(e) => {
                                const textVal = e.currentTarget.textContent || e.currentTarget.innerText || '';
                                setSelectedAnswers(prev => ({
                                  ...prev,
                                  [`${q.id}_pos_${positionId}`]: textVal
                                }));
                              }}
                              ref={(el) => {
                                if (el) {
                                  fillBlankRefs.current[`${q.id}_pos_${positionId}`] = el;
                                } else {
                                  delete fillBlankRefs.current[`${q.id}_pos_${positionId}`];
                                }
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '120px',
                                maxWidth: '200px',
                                minHeight: '32px',
                                padding: '4px 12px',
                                margin: '4px 8px 6px 8px',
                                background: theme === 'sun' ? '#E9EEFF94' : 'rgba(255, 255, 255, 0.1)',
                                border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                borderRadius: '8px',
                                cursor: 'text',
                                outline: 'none',
                                verticalAlign: 'top',
                                lineHeight: '1.4',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'pre-wrap',
                                color: '#000000',
                                textAlign: 'center'
                              }}
                            />
                            );
                            last = match.index + match[0].length;
                          }
                          if (last < text.length) parts.push(text.slice(last));
                          return parts;
                        })()}
                      </div>
                    </div>
                  ) : q.type === 'REARRANGE' ? (
                    // Reorder Question - align behavior with single GV Rearrange
                    (() => {
                      const questionId = q.id;
                      const currentState = {
                        sourceItems: q.content?.data?.map(item => item.value) || [],
                        droppedItems: {},
                        dragOverIndex: null,
                        draggedItem: null,
                        isDraggingFromSource: false,
                        wasDropped: false,
                        ...(reorderStates[questionId] || {})
                      };

                      // Compute number of slots based on provided words
                      const numSlots = (q.content?.data?.filter(it => it?.value)?.length) || currentState.sourceItems.length || 0;

                      // Remove placeholder tokens but keep HTML formatting
                      const displayText = ((q.questionText || q.question || 'Rearrange the words to form a correct sentence:')
                        .replace(/\[\[pos_.*?\]\]/g, '')).trim();

                      const handleDragStartFromSource = (e, item) => {
                        setReorderStates(prev => ({
                          ...prev,
                          [questionId]: {
                            ...currentState,
                            draggedItem: item,
                            isDraggingFromSource: true
                          }
                        }));
                        e.dataTransfer.effectAllowed = 'move';
                      };

                      const handleDragStartFromSlot = (e, index) => {
                        const item = currentState.droppedItems[index];
                        setReorderStates(prev => ({
                          ...prev,
                          [questionId]: {
                            ...currentState,
                            draggedItem: item,
                            isDraggingFromSource: false,
                            wasDropped: false,
                            dragOverIndex: index
                          }
                        }));
                        e.dataTransfer.effectAllowed = 'move';
                      };

                      const handleDropOnSlot = (e, index) => {
                        e.preventDefault();
                        const newState = { ...currentState, wasDropped: true, dragOverIndex: null };
                        if (currentState.draggedItem) {
                          const currentItem = currentState.droppedItems[index];
                          if (currentItem) newState.sourceItems = [...currentState.sourceItems, currentItem];
                          if (!currentState.isDraggingFromSource) {
                            const oldIndex = Object.keys(currentState.droppedItems).find(i => currentState.droppedItems[i] === currentState.draggedItem && parseInt(i) !== index);
                            if (oldIndex !== undefined) delete newState.droppedItems[parseInt(oldIndex)];
                          } else {
                            // Remove only one occurrence from source to preserve duplicates
                            const newSource = [...currentState.sourceItems];
                            const rmIdx = newSource.findIndex(item => item === currentState.draggedItem);
                            if (rmIdx !== -1) newSource.splice(rmIdx, 1);
                            newState.sourceItems = newSource;
                          }
                          newState.droppedItems = { ...currentState.droppedItems, [index]: currentState.draggedItem };
                        }
                        newState.draggedItem = null;
                        newState.isDraggingFromSource = false;
                        setReorderStates(prev => ({ ...prev, [questionId]: newState }));
                      };

                      const handleDragOverSlot = (e, index) => {
                        e.preventDefault();
                        setReorderStates(prev => ({
                          ...prev,
                          [questionId]: { ...currentState, dragOverIndex: index }
                        }));
                        e.dataTransfer.dropEffect = 'move';
                      };

                      const handleDragLeaveSlot = () => {
                        setReorderStates(prev => ({
                          ...prev,
                          [questionId]: { ...currentState, dragOverIndex: null }
                        }));
                      };

                      const handleDragEnd = () => {
                        if (currentState.draggedItem && !currentState.isDraggingFromSource && !currentState.wasDropped) {
                          const newState = { ...currentState };
                          // Return item back to source without deduping to preserve duplicates
                          newState.sourceItems = [...newState.sourceItems, currentState.draggedItem];
                          const oldIndex = Object.keys(currentState.droppedItems).find(i => currentState.droppedItems[i] === currentState.draggedItem);
                          if (oldIndex !== undefined) delete newState.droppedItems[oldIndex];
                          newState.draggedItem = null;
                          newState.isDraggingFromSource = false;
                          newState.dragOverIndex = null;
                          newState.wasDropped = false;
                          setReorderStates(prev => ({ ...prev, [questionId]: newState }));
                        }
                      };

                      return (
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                            Question {qIndex + 1}:
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 350, marginBottom: '16px', lineHeight: '1.8', color: '#000000' }}>
                            <div 
                              className="question-text-content"
                              dangerouslySetInnerHTML={{ __html: displayText || 'Rearrange the words to form a correct sentence:' }}
                            />
                          </div>

                          {/* Slots Row */}
                          <div style={{
                            marginBottom: '16px',
                            padding: '16px',
                            background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '8px',
                            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
                          }}>
                            <div style={{ fontSize: '14px', fontWeight: 350, marginBottom: '12px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                              Drop the words here in order:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {Array.from({ length: numSlots }).map((_, index) => (
                                <div
                                  key={index}
                                  onDrop={(e) => handleDropOnSlot(e, index)}
                                  onDragOver={(e) => handleDragOverSlot(e, index)}
                                  onDragLeave={handleDragLeaveSlot}
                                  onDragEnd={handleDragEnd}
                                  style={{
                                    minWidth: '80px',
                                    height: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: currentState.droppedItems[index] 
                                      ? `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`
                                      : currentState.dragOverIndex === index 
                                        ? `3px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`
                                        : `2px dashed rgba(0, 0, 0, 0.5)`,
                                    borderRadius: '6px',
                                    background: currentState.droppedItems[index]
                                      ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)')
                                      : currentState.dragOverIndex === index
                                        ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.15)' : 'rgba(138, 122, 255, 0.15)')
                                        : '#ffffff',
                                    position: 'relative',
                                    transition: 'all 0.3s ease',
                                    transform: currentState.dragOverIndex === index ? 'scale(1.05)' : 'scale(1)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {currentState.droppedItems[index] ? (
                                    <div
                                      draggable
                                      onDragStart={(e) => handleDragStartFromSlot(e, index)}
                                      onDragEnd={handleDragEnd}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '6px 8px',
                                        background: theme === 'sun' ? 'rgba(24, 144, 255, 0.12)' : 'rgba(138, 122, 255, 0.14)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'grab',
                                        userSelect: 'none'
                                      }}
                                    >
                                      <span 
                                        style={{ fontSize: '13px', fontWeight: '700', color: theme === 'sun' ? '#1890ff' : '#8B5CF6', textAlign: 'center' }}
                                        dangerouslySetInnerHTML={{ __html: currentState.droppedItems[index] || '' }}
                                      />
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                      <span style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(0, 0, 0, 0.5)' }}>
                                        {index + 1}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Source Words */}
                          <div
                            onDrop={(e) => {
                              e.preventDefault();
                              const newState = { ...currentState, wasDropped: true };
                              if (currentState.draggedItem && !currentState.isDraggingFromSource) {
                                // Return item back to source without deduping to preserve duplicates
                                newState.sourceItems = [...newState.sourceItems, currentState.draggedItem];
                                const oldIndex = Object.keys(currentState.droppedItems).find(i => currentState.droppedItems[i] === currentState.draggedItem);
                                if (oldIndex) delete newState.droppedItems[oldIndex];
                                newState.draggedItem = null;
                                newState.isDraggingFromSource = false;
                                newState.dragOverIndex = null;
                                setReorderStates(prev => ({ ...prev, [questionId]: newState }));
                              }
                            }}
                            onDragOver={(e) => { e.preventDefault(); }}
                            style={{
                              padding: '16px',
                              background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                              borderRadius: '8px',
                              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
                            }}
                          >
                            <div style={{ fontSize: '14px', fontWeight: 350, marginBottom: '12px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                              Drag these words to the slots above:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {currentState.sourceItems.map((item, idx) => (
                                <div
                                  key={`${item}-${idx}`}
                                  draggable
                                  onDragStart={(e) => handleDragStartFromSource(e, item)}
                                  onDragEnd={handleDragEnd}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    background: theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)',
                                    border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                    cursor: 'grab',
                                    userSelect: 'none',
                                    transition: 'all 0.2s ease',
                                    boxShadow: theme === 'sun' ? '0 2px 6px rgba(24, 144, 255, 0.15)' : '0 2px 6px rgba(138, 122, 255, 0.15)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = theme === 'sun' ? '0 4px 10px rgba(24, 144, 255, 0.25)' : '0 4px 10px rgba(138, 122, 255, 0.25)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = theme === 'sun' ? '0 2px 6px rgba(24, 144, 255, 0.15)' : '0 2px 6px rgba(138, 122, 255, 0.15)';
                                  }}
                                  dangerouslySetInnerHTML={{ __html: item || '' }}
                                >
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <Typography.Text style={{ 
                          fontSize: '16px', 
                          fontWeight: 600,
                          color: '#000000',
                          display: 'block',
                          marginBottom: '8px'
                        }}>
                          Question {qIndex + 1}:
                        </Typography.Text>
                        <Typography.Text style={{ 
                          fontSize: '15px', 
                          fontWeight: 350,
                          color: '#000000',
                          display: 'block',
                          lineHeight: '1.8'
                        }}>
                          {q.question || q.questionText}
                        </Typography.Text>
                      </div>

                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px' 
                    }}>
                      {q.type === 'MULTIPLE_SELECT' ? (
                      // Multiple Select (Checkbox)
                      q.options?.map((option) => (
                        <div 
                          key={option.key} 
                          className={`option-item ${selectedAnswers[q.id]?.includes(option.key) ? 'selected-answer' : ''}`}
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 18px',
                            background: selectedAnswers[q.id]?.includes(option.key)
                              ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                              : theme === 'sun'
                                ? 'rgba(255, 255, 255, 0.85)'
                                : 'rgba(255, 255, 255, 0.7)',
                            border: `2px solid ${
                              selectedAnswers[q.id]?.includes(option.key)
                                ? (theme === 'sun' ? 'rgb(24, 144, 255)' : 'rgb(138, 122, 255)')
                                : theme === 'sun' 
                                  ? 'rgba(113, 179, 253, 0.2)' 
                                  : 'rgba(138, 122, 255, 0.15)'
                            }`,
                            borderRadius: '12px',
                            boxShadow: theme === 'sun' 
                              ? '0 2px 6px rgba(113, 179, 253, 0.08)'
                              : '0 2px 6px rgba(138, 122, 255, 0.08)',
                            fontSize: '14px',
                            fontWeight: '350',
                            position: 'relative',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            minHeight: '50px',
                            boxSizing: 'border-box'
                          }}
                          onClick={() => {
                            const currentAnswers = selectedAnswers[q.id] || [];
                            const newAnswers = currentAnswers.includes(option.key)
                              ? currentAnswers.filter(key => key !== option.key)
                              : [...currentAnswers, option.key];
                            setSelectedAnswers(prev => ({
                              ...prev,
                              [q.id]: newAnswers
                            }));
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedAnswers[q.id]?.includes(option.key) || false}
                            onChange={() => {}}
                            style={{ 
                              width: '18px',
                              height: '18px',
                              accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                              cursor: 'pointer'
                            }} 
                          />
                          <span style={{ 
                            flexShrink: 0, 
                            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                            fontWeight: '600',
                            fontSize: '16px'
                          }}>
                            {option.key}.
                          </span>
                          <Typography.Text style={{ 
                            fontSize: '14px',
                            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                            fontWeight: '350',
                            flex: 1
                          }}>
                            {option.text}
                          </Typography.Text>
                        </div>
                      ))
                    ) : (
                      // Multiple Choice (Radio) or True/False
                      q.options?.map((option) => (
                        <div 
                          key={option.key} 
                          className={`option-item ${selectedAnswers[q.id] === option.key ? 'selected-answer' : ''}`}
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 18px',
                            background: selectedAnswers[q.id] === option.key 
                              ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                              : theme === 'sun'
                                ? 'rgba(255, 255, 255, 0.85)'
                                : 'rgba(255, 255, 255, 0.7)',
                            border: `2px solid ${
                              selectedAnswers[q.id] === option.key 
                                ? (theme === 'sun' ? 'rgb(24, 144, 255)' : 'rgb(138, 122, 255)')
                                : theme === 'sun' 
                                  ? 'rgba(113, 179, 253, 0.2)' 
                                  : 'rgba(138, 122, 255, 0.15)'
                            }`,
                            borderRadius: '12px',
                            boxShadow: theme === 'sun' 
                              ? '0 2px 6px rgba(113, 179, 253, 0.08)'
                              : '0 2px 6px rgba(138, 122, 255, 0.08)',
                            fontSize: '14px',
                            fontWeight: '350',
                            position: 'relative',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            minHeight: '50px',
                            boxSizing: 'border-box'
                          }}
                          onClick={() => handleAnswerSelect(q.id, option.key)}
                        >
                          <input 
                            type="radio" 
                            name={`question-${q.id}`} 
                            checked={selectedAnswers[q.id] === option.key}
                            onChange={() => handleAnswerSelect(q.id, option.key)}
                            style={{ 
                              width: '18px',
                              height: '18px',
                              accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                              cursor: 'pointer'
                            }} 
                          />
                          {q.type === 'TRUE_OR_FALSE' ? (
                            <Typography.Text style={{ 
                              fontSize: '14px',
                              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                              fontWeight: '350',
                              flex: 1
                            }}>
                              {option.text}
                            </Typography.Text>
                          ) : (
                            <>
                              <span style={{ 
                                flexShrink: 0, 
                                color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                                fontWeight: '600',
                                fontSize: '16px'
                              }}>
                                {option.key}.
                              </span>
                              <Typography.Text style={{ 
                                fontSize: '14px',
                                color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                fontWeight: '350',
                                flex: 1
                              }}>
                                {option.text}
                              </Typography.Text>
                            </>
                          )}
                        </div>
                      ))
                    )}
                    </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
// Listening Section Component
const ListeningSectionItem = ({ question, index, theme, sectionScore }) => {
  const registerAnswerCollector = useContext(AnswerCollectionContext);
  const registerAnswerRestorer = useContext(AnswerRestorationContext);
  const triggerAutoSave = useContext(AutoSaveTriggerContext);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [droppedItems, setDroppedItems] = useState({});
  const [availableItems, setAvailableItems] = useState({});
  const [dragOverPosition, setDragOverPosition] = useState({});
  const [reorderStates, setReorderStates] = useState({});
  // Local refs for LI Fill-in-the-Blank inputs
  const fillBlankRefs = useRef({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [audioRef, setAudioRef] = useState(null);
  const toPlainText = (html) => {
    if (!html) return '';
    return String(html)
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Register answer collectors for all questions in this section
  useEffect(() => {
    if (!registerAnswerCollector || !question.questions) return;

    const unregisterFunctions = [];

    question.questions.forEach(q => {
      const getAnswer = () => {
        let answer = null;
        let options;

        if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE') {
          answer = selectedAnswers[q.id] || null;
          if (q?.options && Array.isArray(q.options) && q.options.length > 0) {
            options = q.options.map((opt, idx) => ({ key: opt.key || String.fromCharCode(65 + idx), text: opt.text }));
          } else if (q?.content?.data && Array.isArray(q.content.data)) {
            options = q.content.data.map((d, idx) => ({
              key: q.type === 'TRUE_OR_FALSE' ? (String(d.value).toLowerCase() === 'true' ? 'A' : 'B') : (d.id || String.fromCharCode(65 + idx)),
              text: d.value
            }));
          }
        } else if (q.type === 'MULTIPLE_SELECT') {
          answer = selectedAnswers[q.id] || [];
          if (q?.options && Array.isArray(q.options) && q.options.length > 0) {
            options = q.options.map((opt, idx) => ({ key: opt.key || String.fromCharCode(65 + idx), text: opt.text }));
          } else if (q?.content?.data && Array.isArray(q.content.data)) {
            options = q.content.data.map((d, idx) => ({ key: d.id || String.fromCharCode(65 + idx), text: d.value }));
          }
        } else if (q.type === 'DROPDOWN') {
          // Collect all dropdown answers for this question
          const dropdownAnswers = {};
          Object.keys(selectedAnswers).forEach(key => {
            if (key.startsWith(`${q.id}_pos_`)) {
              dropdownAnswers[key] = selectedAnswers[key];
            }
          });
          answer = Object.keys(dropdownAnswers).length > 0 ? dropdownAnswers : null;
        } else if (q.type === 'FILL_IN_THE_BLANK' || q.type === 'FILL_BLANK') {
          // Collect LI fill-in-the-blank answers by position
          const fibAnswers = {};
          Object.keys(selectedAnswers).forEach(key => {
            if (key.startsWith(`${q.id}_pos_`)) {
              fibAnswers[key] = selectedAnswers[key];
            }
          });
          answer = Object.keys(fibAnswers).length > 0 ? fibAnswers : null;
        } else if (q.type === 'DRAG_AND_DROP') {
          answer = droppedItems[q.id] || null;
        } else if (q.type === 'REARRANGE' || q.type === 'REORDER') {
          const reorderState = reorderStates[q.id];
          if (reorderState?.items && Array.isArray(reorderState.items) && reorderState.items.length > 0) {
            answer = reorderState.items;
          } else if (reorderState?.droppedItems && typeof reorderState.droppedItems === 'object') {
            // Derive ordered array from droppedItems mapping
            const indices = Object.keys(reorderState.droppedItems)
              .map(k => parseInt(k, 10))
              .filter(i => !Number.isNaN(i))
              .sort((a, b) => a - b);
            const arr = indices.map(i => reorderState.droppedItems[i]).filter(Boolean);
            answer = arr.length > 0 ? arr : null;
          } else {
            answer = null;
          }
        }

        // Normalize type names to match API
        const normalizedType = (q.type === 'FILL_IN_THE_BLANK') ? 'FILL_BLANK'
          : (q.type === 'REARRANGE') ? 'REORDER'
          : q.type;
        return answer ? { answer, questionType: normalizedType, options } : null;
      };

      const unregister = registerAnswerCollector(q.id, getAnswer);
      if (unregister) {
        unregisterFunctions.push(unregister);
      }
    });

    return () => {
      unregisterFunctions.forEach(unregister => unregister());
    };
  }, [registerAnswerCollector, question.questions, selectedAnswers, droppedItems, reorderStates]);

  // Register answer restorers for all questions in this section
  useEffect(() => {
    if (!registerAnswerRestorer || !question.questions) return;

    const unregisterFunctions = [];

    question.questions.forEach(q => {
      const setAnswer = (answer) => {
        if (!answer && answer !== 0 && answer !== '') return;

        if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE') {
          if (typeof answer === 'string') {
            // Map restored text/value back to option key (A/B/...)
            let options = [];
            if (q?.options && Array.isArray(q.options) && q.options.length > 0) {
              options = q.options.map((opt, idx) => ({ key: opt.key || String.fromCharCode(65 + idx), text: typeof opt.text === 'string' ? opt.text.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim() : opt.text }));
            } else if (q?.content?.data && Array.isArray(q.content.data)) {
              options = q.content.data.map((d, idx) => ({
                key: q.type === 'TRUE_OR_FALSE' ? (String(d.value).toLowerCase() === 'true' ? 'A' : 'B') : (d.id || String.fromCharCode(65 + idx)),
                text: typeof d.value === 'string' ? d.value.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim() : d.value
              }));
            }
            const normalized = String(answer).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
            const match = options.find(o => o.text === normalized || o.key === normalized);
            setSelectedAnswers(prev => ({ ...prev, [q.id]: match ? match.key : normalized }));
          }
        } else if (q.type === 'MULTIPLE_SELECT') {
          if (Array.isArray(answer)) {
            let options = [];
            if (q?.options && Array.isArray(q.options) && q.options.length > 0) {
              options = q.options.map((opt, idx) => ({ key: opt.key || String.fromCharCode(65 + idx), text: typeof opt.text === 'string' ? opt.text.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim() : opt.text }));
            } else if (q?.content?.data && Array.isArray(q.content.data)) {
              options = q.content.data.map((d, idx) => ({ key: d.id || String.fromCharCode(65 + idx), text: typeof d.value === 'string' ? d.value.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim() : d.value }));
            }
            const keys = answer.map(val => {
              const normalized = String(val).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
              const match = options.find(o => o.text === normalized || o.key === normalized);
              return match ? match.key : normalized;
            });
            setSelectedAnswers(prev => ({ ...prev, [q.id]: keys }));
          }
        } else if (q.type === 'DROPDOWN') {
          if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
            setSelectedAnswers(prev => ({ ...prev, ...answer }));
          }
        } else if (q.type === 'FILL_IN_THE_BLANK' || q.type === 'FILL_BLANK') {
          if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
            setSelectedAnswers(prev => ({ ...prev, ...answer }));
            // Push values into corresponding contentEditable spans
            Object.keys(answer).forEach(key => {
              const el = fillBlankRefs.current[key];
              const val = answer[key] ?? '';
              if (el && document.activeElement !== el) {
                el.textContent = String(val);
              }
            });
          }
        } else if (q.type === 'DRAG_AND_DROP') {
          if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
            setDroppedItems(prev => ({ ...prev, [q.id]: answer }));
          }
        } else if (q.type === 'REARRANGE' || q.type === 'REORDER') {
          if (Array.isArray(answer)) {
            // Place restored items into dropped slots by index
            const dropped = answer.reduce((acc, val, idx) => {
              if (val !== undefined && val !== null && String(val).trim() !== '') acc[idx] = val;
              return acc;
            }, {});
            const reorderState = {
              sourceItems: [],
              droppedItems: dropped,
              dragOverIndex: null,
              draggedItem: null,
              isDraggingFromSource: false,
              wasDropped: false
            };
            setReorderStates(prev => ({ ...prev, [q.id]: reorderState }));
          }
        }
      };

      const unregister = registerAnswerRestorer(q.id, setAnswer);
      if (unregister) {
        unregisterFunctions.push(unregister);
      }
    });

    return () => {
      unregisterFunctions.forEach(unregister => unregister());
    };
  }, [registerAnswerRestorer, question.questions]);

  // Debounced auto-save for LI changes
  useEffect(() => {
    if (triggerAutoSave) triggerAutoSave();
  }, [triggerAutoSave, selectedAnswers, droppedItems, reorderStates]);

  // Initialize available items for DRAG_AND_DROP questions (include all values)
  useEffect(() => {
    if (question.questions) {
      setAvailableItems(prev => {
        const newItems = { ...prev };
        let hasChanges = false;
        question.questions.forEach(q => {
          if (q.type === 'DRAG_AND_DROP' && q.content?.data && !newItems[q.id]) {
            const all = (q.content.data || []).map(it => it.value).filter(Boolean);
            if (all.length > 0) {
              newItems[q.id] = all;
              hasChanges = true;
            }
          }
        });
        return hasChanges ? newItems : prev;
      });
    }
  }, [question.questions]);

  const handleAnswerSelect = (questionId, optionKey) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionKey
    }));
  };

  const handlePlayPause = () => {
    if (audioRef) {
      if (isPlaying) {
        audioRef.pause();
      } else {
        audioRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
  };

  const handleLoadedMetadata = (e) => {
    setDuration(e.target.duration);
  };

  const handleSeek = (e) => {
    if (audioRef) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      audioRef.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef) {
      audioRef.volume = newVolume;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <style>
        {`
          .listening-passage-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .listening-passage-scrollbar::-webkit-scrollbar-track {
            background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'};
            border-radius: 4px;
          }
          .listening-passage-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'};
            border-radius: 4px;
            border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'};
          }
          .listening-passage-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'};
          }
        `}
      </style>
      <div
        className={`question-item ${theme}-question-item`}
        style={{
          marginBottom: '24px',
          borderRadius: '16px',
          padding: '24px',
          border: '2px solid',
          borderColor: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.25)' 
            : 'rgba(138, 122, 255, 0.2)',
          background: theme === 'sun' 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
          boxShadow: theme === 'sun' 
            ? '0 4px 16px rgba(113, 179, 253, 0.1)'
            : '0 4px 16px rgba(138, 122, 255, 0.12)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Header */}
        <div className="question-header" style={{
          paddingBottom: '14px',
          marginBottom: '16px',
          borderBottom: '2px solid',
          borderBottomColor: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.25)' 
            : 'rgba(138, 122, 255, 0.2)',
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography.Text strong style={{ 
            fontSize: '20px', 
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
          }}>
            {index + 1}. Listening Section
          </Typography.Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
              ({question.points || sectionScore?.totalScore || 0} {question.points !== 1 ? 'points' : 'point'})
          </Typography.Text>
          </div>
        </div>
        {/* Two Column Layout */}
        <div style={{ display: 'flex', gap: '24px', minHeight: '500px' }}>
          {/* Left Column - Audio Player and Transcript */}
          <div 
            className="listening-passage-scrollbar"
            style={{
              flex: '1',
              padding: '20px',
              background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
              overflowY: 'auto',
              maxHeight: '600px',
              scrollbarWidth: 'thin',
              scrollbarColor: theme === 'sun' 
                ? '#1890ff rgba(24, 144, 255, 0.2)' 
                : '#8B5CF6 rgba(138, 122, 255, 0.2)'
            }}>
            
            {/* Audio Title removed as requested */}

            {/* Audio Player */}
            <div style={{
              background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
              boxShadow: theme === 'sun' 
                ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                : '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              <audio
                ref={setAudioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                style={{ display: 'none' }}
              >
                <source src={question.audioUrl} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>

              {/* Audio Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                {/* Play/Pause Button */}
                <button
                  onClick={handlePlayPause}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: 'none',
                    background: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: theme === 'sun' 
                      ? '0 4px 12px rgba(24, 144, 255, 0.3)' 
                      : '0 4px 12px rgba(138, 122, 255, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>

                {/* Time Display */}
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme === 'sun' ? '#333' : '#1F2937',
                  minWidth: '80px'
                }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    flex: 1,
                    height: '6px',
                    background: theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={handleSeek}
                >
                  <div
                    style={{
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                      height: '100%',
                      background: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                      borderRadius: '3px',
                      transition: 'width 0.1s ease'
                    }}
                  />
                </div>

                {/* Volume Control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '16px',
                    color: theme === 'sun' ? '#666' : '#ccc'
                  }}>🔊</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    style={{
                      width: '60px',
                      accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Questions */}
          <div style={{
            flex: '1',
            background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
            overflowY: 'auto',
            maxHeight: '600px'
          }}>
            <div style={{ padding: '20px' }}>
              {/* Questions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {question.questions
                  .slice()
                  .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0) || ((a.id || 0) - (b.id || 0)))
                  .map((q, qIndex) => (
                  <div key={q.id} style={{
                    padding: '16px',
                    background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`
                  }}>
                    {/* Question Types - mirrored from Reading */}
                    {q.type === 'DROPDOWN' ? (
                      <div style={{ 
                        marginBottom: '16px',
                        fontSize: '15px', 
                        fontWeight: 350,
                        lineHeight: '1.8',
                        color: '#000000'
                      }}>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                          Question {qIndex + 1}:
                        </div>
                        <div>
                          {(() => {
                            const text = q.questionText || q.question || '';
                            const parts = [];
                            const regex = /\[\[pos_(.*?)\]\]/g;
                            let last = 0; let match; let idx = 0;
                            while ((match = regex.exec(text)) !== null) {
                              if (match.index > last) parts.push(text.slice(last, match.index));
                              const positionId = match[1];
                              const contentData = q.content?.data || [];
                              // Prefer explicit mapping when provided
                              const hasPositionIds = contentData.some(opt => opt.positionId);
                              let optionsForPosition;
                              if (hasPositionIds) {
                                optionsForPosition = contentData.filter(opt => String(opt.positionId || '') === String(positionId));
                              } else {
                                // Fallback: infer groups by option id prefix (e.g., opt1, opt1_1 belong to group 'opt1')
                                const groupKeyFromId = (id) => {
                                  if (!id || typeof id !== 'string') return id;
                                  const m = id.match(/^([^_]+?\d+)/); // take prefix with first number, before underscore
                                  return (m && m[1]) || id.split('_')[0] || id;
                                };
                                const groupKeysInOrder = [];
                                const seen = new Set();
                                for (const item of contentData) {
                                  const gk = groupKeyFromId(item.id);
                                  if (!seen.has(gk)) { seen.add(gk); groupKeysInOrder.push(gk); }
                                }
                                const groupKeyForThisPos = groupKeysInOrder[idx] || groupKeysInOrder[0];
                                optionsForPosition = contentData.filter(item => groupKeyFromId(item.id) === groupKeyForThisPos);
                              }
                              parts.push(
                              <select
                                  key={`dd_${q.id}_${idx++}`}
                                  value={selectedAnswers[`${q.id}_pos_${positionId}`] || ''}
                                onChange={(e) => setSelectedAnswers(prev => ({
                                  ...prev,
                                    [`${q.id}_pos_${positionId}`]: e.target.value
                                }))}
                                style={{
                                  display: 'inline-block',
                                  minWidth: '120px',
                                  height: '32px',
                                  padding: '4px 12px',
                                  margin: '0 8px 6px 8px',
                                  background: theme === 'sun' 
                                    ? 'rgba(24, 144, 255, 0.08)' 
                                    : 'rgba(138, 122, 255, 0.12)',
                                  border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  textAlign: 'center'
                                }}
                              >
                                <option value="">Select</option>
                                  {optionsForPosition.map((item) => (
                                    <option key={item.id} value={item.value || ''}>
                                      {item.value || ''}
                                  </option>
                                ))}
                              </select>
                              );
                              last = match.index + match[0].length;
                            }
                            if (last < text.length) parts.push(text.slice(last));
                            return parts;
                          })()}
                        </div>
                      </div>
                    ) : q.type === 'DRAG_AND_DROP' ? (
                      (() => {
                        const qDroppedItems = droppedItems[q.id] || {};
                        const allItems = (q.content?.data || []).map(item => item.value).filter(Boolean);
                        if (availableItems[q.id] === undefined && allItems.length > 0) {
                          setAvailableItems(prev => ({ ...prev, [q.id]: allItems }));
                        }
                        const qAvailableItems = availableItems[q.id] || allItems;

                        const handleDragStart = (e, item, isDropped = false, positionId = null) => {
                          e.dataTransfer.setData('text/plain', item);
                          e.dataTransfer.setData('isDropped', isDropped);
                          e.dataTransfer.setData('positionId', positionId || '');
                          e.dataTransfer.setData('questionId', q.id);
                        };
                        const handleDrop = (e, positionId) => {
                          e.preventDefault();
                          const item = e.dataTransfer.getData('text/plain');
                          const isDropped = e.dataTransfer.getData('isDropped') === 'true';
                          const fromPositionId = e.dataTransfer.getData('positionId');
                          const questionId = e.dataTransfer.getData('questionId');
                          if (questionId !== q.id.toString()) return;
                          setDroppedItems(prev => {
                            const newItems = { ...prev };
                            if (!newItems[q.id]) newItems[q.id] = {};
                            const currentItem = newItems[q.id][positionId];
                            setDragOverPosition(pr => ({ ...pr, [q.id]: null }));
                            if (fromPositionId && fromPositionId !== positionId) {
                              newItems[q.id][positionId] = item;
                              if (fromPositionId in newItems[q.id]) delete newItems[q.id][fromPositionId];
                              if (currentItem) {
                                setAvailableItems(prev => ({ ...prev, [q.id]: [...(prev[q.id] || []), currentItem] }));
                              }
                              return newItems;
                            }
                            if (!isDropped) {
                              newItems[q.id][positionId] = item;
                              setAvailableItems(prev => ({ ...prev, [q.id]: (prev[q.id] || []).filter(i => i !== item) }));
                            }
                            return newItems;
                          });
                        };
                        const handleDragStartFromDropped = (e, item, positionId) => {
                          handleDragStart(e, item, true, positionId);
                          setDroppedItems(prev => {
                            const newItems = { ...prev };
                            if (newItems[q.id]) delete newItems[q.id][positionId];
                            return newItems;
                          });
                          setAvailableItems(prev => ({ ...prev, [q.id]: [...(prev[q.id] || []), item] }));
                        };
                        const handleDragOver = (e, positionId) => {
                          e.preventDefault();
                          setDragOverPosition(prev => ({ ...prev, [q.id]: positionId }));
                        };
                        const handleDragLeave = (e) => {
                          if (!e.currentTarget.contains(e.relatedTarget)) {
                            setDragOverPosition(prev => ({ ...prev, [q.id]: null }));
                          }
                        };

                        const text = q.questionText || q.question || '';
                        const parts = [];
                        const regex = /\[\[pos_(.*?)\]\]/g;
                        let last = 0; let match; let idx = 0; const positions = [];
                        while ((match = regex.exec(text)) !== null) {
                          if (match.index > last) parts.push({ type: 'text', content: text.slice(last, match.index) });
                          const posId = match[1];
                          positions.push(posId);
                          parts.push({ type: 'position', positionId: posId, index: idx++ });
                          last = match.index + match[0].length;
                        }
                        if (last < text.length) parts.push({ type: 'text', content: text.slice(last) });

                        const toPlain = (s) => (typeof s === 'string' ? s.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').trim() : s);

                        return (
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '200px' }}>
                              <div style={{ padding: '16px', background: theme === 'sun' ? '#f9f9f9' : 'rgba(255,255,255,0.02)', borderRadius: '8px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255,255,255,0.1)'}` }}>
                                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Question {qIndex + 1}:</div>
                                <div style={{ fontSize: '15px', fontWeight: 350, lineHeight: '1.8', color: '#000000' }}>
                                  {parts.map((part, pIdx) => (
                                    <React.Fragment key={pIdx}>
                                      {part.type === 'text' ? (
                                        <span 
                                          className="question-text-content"
                                          dangerouslySetInnerHTML={{ __html: part.content || '' }}
                                        />
                                      ) : (
                                        qDroppedItems[part.positionId] ? (
                                          <span 
                                            draggable 
                                            onDragStart={(e) => handleDragStartFromDropped(e, qDroppedItems[part.positionId], part.positionId)} 
                                            style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:'100px', minHeight:'28px', padding:'4px 8px', margin:'0 6px', background: theme==='sun'? 'rgba(24,144,255,0.15)':'rgba(138,122,255,0.18)', border: `2px solid ${theme==='sun'?'#1890ff':'#8B5CF6'}`, borderRadius:'6px', fontSize:'14px', fontWeight:'350', color: theme==='sun'?'#1890ff':'#8B5CF6', cursor:'grab', verticalAlign:'baseline', textAlign:'center' }}
                                            dangerouslySetInnerHTML={{ __html: qDroppedItems[part.positionId] || '' }}
                                          />
                                        ) : (
                                          <span onDrop={(e)=>handleDrop(e, part.positionId)} onDragOver={(e)=>handleDragOver(e, part.positionId)} onDragLeave={handleDragLeave} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:'100px', minHeight:'28px', padding:'4px 8px', margin:'0 6px', background: dragOverPosition[q.id]===part.positionId ? (theme==='sun'?'rgba(24,144,255,0.2)':'rgba(138,122,255,0.25)') : '#ffffff', border:`2px ${dragOverPosition[q.id]===part.positionId ? 'solid':'dashed'} ${dragOverPosition[q.id]===part.positionId ? (theme==='sun'?'#1890ff':'#8B5CF6') : 'rgba(0,0,0,0.5)'}`, borderRadius:'6px', fontSize:'14px', color: dragOverPosition[q.id]===part.positionId ? (theme==='sun'?'#1890ff':'#8B5CF6') : 'rgba(0,0,0,0.5)', textAlign:'center' }}>
                                            {dragOverPosition[q.id]===part.positionId ? 'Drop here!' : 'Drop here'}
                                          </span>
                                        )
                            )}
                          </React.Fragment>
                        ))}
                        </div>
                      </div>

                              <div style={{ padding:'16px', background: theme==='sun'?'#ffffff':'rgba(255,255,255,0.03)', borderRadius:'8px', border:`1px solid ${theme==='sun'?'#e8e8e8':'rgba(255,255,255,0.1)'}` }}>
                                <Typography.Text style={{ fontSize:'13px', fontWeight:600, marginBottom:'12px', display:'block', color: theme==='sun'?'rgb(15,23,42)':'rgb(45,27,105)' }}>Drag these words:</Typography.Text>
                                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center', alignItems:'center', minHeight:'80px' }}>
                                  {qAvailableItems.map((item, idx) => (
                                    <span 
                                      key={idx} 
                                      draggable 
                                      onDragStart={(e)=>handleDragStart(e, item)} 
                                      style={{ padding:'8px 12px', background: theme==='sun'?'rgba(24,144,255,0.08)':'rgba(138,122,255,0.12)', border:`2px solid ${theme==='sun'?'#1890ff':'#8B5CF6'}`, borderRadius:'8px', fontSize:'13px', fontWeight:'600', color: theme==='sun'?'#1890ff':'#8B5CF6', cursor:'grab', userSelect:'none', minWidth:'60px', textAlign:'center' }}
                                      dangerouslySetInnerHTML={{ __html: item || '' }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (q.type === 'FILL_IN_THE_BLANK' || q.type === 'FILL_BLANK' || q.questionType === 'FILL_BLANK' || q.questionType === 'FILL_IN_THE_BLANK') ? (
                      <div style={{ 
                        marginBottom: '16px',
                        fontSize: '15px', 
                        fontWeight: 350,
                        lineHeight: '1.8',
                        color: '#000000'
                      }}>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                          Question {qIndex + 1}:
                        </div>
                        <div>
                          {(() => {
                            const text = q.questionText || q.question || '';
                            const parts = [];
                            const regex = /\[\[pos_(.*?)\]\]/g;
                            let last = 0; let match; let idx = 0;
                            while ((match = regex.exec(text)) !== null) {
                              if (match.index > last) parts.push(text.slice(last, match.index));
                              const positionId = match[1];
                              parts.push(
                                <span
                                  key={`fib_${q.id}_${idx++}`}
                                  className="paragraph-input"
                                  contentEditable
                                  suppressContentEditableWarning
                                  onInput={(e) => {
                                    const textVal = e.currentTarget.textContent || e.currentTarget.innerText || '';
                                    setSelectedAnswers(prev => ({
                                      ...prev,
                                      [`${q.id}_pos_${positionId}`]: textVal
                                    }));
                                  }}
                                  onBlur={(e) => {
                                    const textVal = e.currentTarget.textContent || e.currentTarget.innerText || '';
                                    setSelectedAnswers(prev => ({
                                      ...prev,
                                      [`${q.id}_pos_${positionId}`]: textVal
                                    }));
                                  }}
                                  ref={(el) => {
                                    if (el) {
                                      fillBlankRefs.current[`${q.id}_pos_${positionId}`] = el;
                                    } else {
                                      delete fillBlankRefs.current[`${q.id}_pos_${positionId}`];
                                    }
                                  }}
                                  style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:'120px', maxWidth:'200px', minHeight:'32px', padding:'4px 12px', margin:'4px 8px 6px 8px', background: theme==='sun'?'#E9EEFF94':'rgba(255,255,255,0.1)', border:`2px solid ${theme==='sun'?'#1890ff':'#8B5CF6'}`, borderRadius:'8px', cursor:'text', outline:'none', verticalAlign:'top', lineHeight:'1.4', fontSize:'14px', boxSizing:'border-box', color:'#000000', textAlign:'center' }}
                                />
                              );
                              last = match.index + match[0].length;
                            }
                            if (last < text.length) parts.push(text.slice(last));
                            return parts;
                          })()}
                        </div>
                      </div>
                    ) : q.type === 'REARRANGE' ? (
                      (() => {
                        const questionId = q.id;
                        const currentState = {
                          sourceItems: q.content?.data?.map(item => item.value) || [],
                          droppedItems: {},
                          dragOverIndex: null,
                          draggedItem: null,
                          isDraggingFromSource: false,
                          wasDropped: false,
                          ...(reorderStates[questionId] || {})
                        };
                        const numSlots = (q.content?.data?.filter(it => it?.value)?.length) || currentState.sourceItems.length || 0;
                        // Remove placeholder tokens but keep HTML formatting
                        const displayText = ((q.questionText || q.question || '').replace(/\[\[pos_.*?\]\]/g,'')).trim();

                        const handleDragStartFromSource = (e, item) => {
                          setReorderStates(prev => ({ ...prev, [questionId]: { ...currentState, draggedItem: item, isDraggingFromSource: true } }));
                          e.dataTransfer.effectAllowed = 'move';
                        };
                        const handleDragStartFromSlot = (e, index) => {
                          const item = currentState.droppedItems[index];
                          setReorderStates(prev => ({ ...prev, [questionId]: { ...currentState, draggedItem: item, isDraggingFromSource: false, wasDropped: false, dragOverIndex: index } }));
                          e.dataTransfer.effectAllowed = 'move';
                        };
                        const handleDropOnSlot = (e, index) => {
                          e.preventDefault();
                          const newState = { ...currentState, wasDropped: true, dragOverIndex: null };
                          if (currentState.draggedItem) {
                            const currentItem = currentState.droppedItems[index];
                            if (currentItem) newState.sourceItems = [...currentState.sourceItems, currentItem];
                            if (!currentState.isDraggingFromSource) {
                              const oldIndex = Object.keys(currentState.droppedItems).find(i => currentState.droppedItems[i] === currentState.draggedItem && parseInt(i) !== index);
                              if (oldIndex !== undefined) delete newState.droppedItems[parseInt(oldIndex)];
                          } else {
                              // Remove only one occurrence from source to preserve duplicates
                              const newSource = [...currentState.sourceItems];
                              const rmIdx = newSource.findIndex(item => item === currentState.draggedItem);
                              if (rmIdx !== -1) newSource.splice(rmIdx, 1);
                              newState.sourceItems = newSource;
                            }
                            newState.droppedItems = { ...currentState.droppedItems, [index]: currentState.draggedItem };
                          }
                          newState.draggedItem = null; newState.isDraggingFromSource = false;
                          setReorderStates(prev => ({ ...prev, [questionId]: newState }));
                        };
                        const handleDragOverSlot = (e, index) => { e.preventDefault(); setReorderStates(prev => ({ ...prev, [questionId]: { ...currentState, dragOverIndex: index } })); e.dataTransfer.dropEffect='move'; };
                        const handleDragLeaveSlot = () => { setReorderStates(prev => ({ ...prev, [questionId]: { ...currentState, dragOverIndex: null } })); };
                        const handleDragEnd = () => {
                          if (currentState.draggedItem && !currentState.isDraggingFromSource && !currentState.wasDropped) {
                            const newState = { ...currentState };
                            // Return item back to source without deduping to preserve duplicates
                            newState.sourceItems = [...newState.sourceItems, currentState.draggedItem];
                            const oldIndex = Object.keys(currentState.droppedItems).find(i => currentState.droppedItems[i] === currentState.draggedItem);
                            if (oldIndex !== undefined) delete newState.droppedItems[oldIndex];
                            newState.draggedItem = null; newState.isDraggingFromSource = false; newState.dragOverIndex = null; newState.wasDropped = false;
                            setReorderStates(prev => ({ ...prev, [questionId]: newState }));
                          }
                        };

                        return (
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Question {qIndex + 1}:</div>
                            <div 
                              className="question-text-content"
                              style={{ fontSize: '15px', fontWeight: 350, marginBottom: '16px', lineHeight: '1.8', color: '#000000' }}
                              dangerouslySetInnerHTML={{ __html: displayText || '' }}
                            />
                            <div style={{ marginBottom:'16px', padding:'16px', background: theme==='sun'?'#f9f9f9':'rgba(255,255,255,0.02)', borderRadius:'8px', border:`1px solid ${theme==='sun'?'#e8e8e8':'rgba(255,255,255,0.1)'}` }}>
                              <div style={{ fontSize:'14px', fontWeight:350, marginBottom:'12px', color: theme==='sun'?'rgb(15,23,42)':'rgb(45,27,105)' }}>Drop the words here in order:</div>
                              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                                {Array.from({ length: numSlots }).map((_, index) => (
                                  <div key={index} onDrop={(e)=>handleDropOnSlot(e,index)} onDragOver={(e)=>handleDragOverSlot(e,index)} onDragLeave={handleDragLeaveSlot} onDragEnd={handleDragEnd} style={{ minWidth:'80px', height:'50px', display:'flex', alignItems:'center', justifyContent:'center', border: currentState.droppedItems[index] ? `2px solid ${theme==='sun'?'#1890ff':'#8B5CF6'}` : currentState.dragOverIndex===index ? `3px solid ${theme==='sun'?'#1890ff':'#8B5CF6'}` : `2px dashed rgba(0,0,0,0.5)`, borderRadius:'6px', background: currentState.droppedItems[index] ? (theme==='sun'?'rgba(24,144,255,0.1)':'rgba(138,122,255,0.1)') : currentState.dragOverIndex===index ? (theme==='sun'?'rgba(24,144,255,0.15)':'rgba(138,122,255,0.15)') : '#ffffff', transition:'all 0.3s ease', transform: currentState.dragOverIndex===index ? 'scale(1.05)' : 'scale(1)' }}>
                                    {currentState.droppedItems[index] ? (
                                      <div draggable onDragStart={(e)=>handleDragStartFromSlot(e,index)} onDragEnd={handleDragEnd} style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:'6px 8px', background: 'transparent', border:'none', borderRadius:'4px', cursor:'grab', userSelect:'none' }}>
                                        <span style={{ fontSize:'13px', fontWeight:'700', color: theme==='sun'?'#1890ff':'#8B5CF6', textAlign:'center' }}>{currentState.droppedItems[index]}</span>
                                      </div>
                                    ) : (
                                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'2px' }}>
                                        <span style={{ fontSize:'10px', fontWeight:'600', color:'rgba(0,0,0,0.5)' }}>{index + 1}</span>
                                      </div>
                                    )}
                                  </div>
                        ))}
                        </div>
                      </div>
                            <div onDrop={(e)=>{ e.preventDefault(); const newState={...currentState, wasDropped:true}; if(currentState.draggedItem && !currentState.isDraggingFromSource){ newState.sourceItems=[...newState.sourceItems, currentState.draggedItem]; const oldIndex=Object.keys(currentState.droppedItems).find(i=>currentState.droppedItems[i]===currentState.draggedItem); if(oldIndex){ delete newState.droppedItems[oldIndex]; } newState.draggedItem=null; newState.isDraggingFromSource=false; newState.dragOverIndex=null; setReorderStates(prev=>({ ...prev, [questionId]: newState })); } }} onDragOver={(e)=>{e.preventDefault();}} style={{ padding:'16px', background: theme==='sun'?'#ffffff':'rgba(255,255,255,0.03)', borderRadius:'8px', border:`1px solid ${theme==='sun'?'#e8e8e8':'rgba(255,255,255,0.1)'}` }}>
                              <div style={{ fontSize:'14px', fontWeight:350, marginBottom:'12px', color: theme==='sun'?'rgb(15,23,42)':'rgb(45,27,105)' }}>Drag these words to the slots above:</div>
                              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                                {currentState.sourceItems.map((item, idx) => (
                                  <div key={`${item}-${idx}`} draggable onDragStart={(e)=>handleDragStartFromSource(e,item)} onDragEnd={handleDragEnd} style={{ display:'inline-flex', alignItems:'center', padding:'8px 12px', background: theme==='sun'?'rgba(24,144,255,0.08)':'rgba(138,122,255,0.12)', border:`2px solid ${theme==='sun'?'#1890ff':'#8B5CF6'}`, borderRadius:'6px', fontSize:'12px', fontWeight:'600', color: theme==='sun'?'#1890ff':'#8B5CF6', cursor:'grab', userSelect:'none' }}>{item}</div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <>
                        <div style={{ marginBottom: '16px' }}>
                          <Typography.Text style={{ 
                            fontSize: '16px', 
                            fontWeight: 600,
                            color: '#000000',
                            display: 'block',
                            marginBottom: '8px'
                          }}>
                            Question {qIndex + 1}:
                          </Typography.Text>
                          <div 
                            className="question-text-content"
                            style={{ 
                              fontSize: '15px', 
                              fontWeight: 350,
                              color: '#000000',
                              display: 'block',
                              lineHeight: '1.8'
                            }}
                            dangerouslySetInnerHTML={{ __html: q.question || q.questionText || '' }}
                          />
                        </div>

                        <div style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px' 
                        }}>
                          {q.type === 'MULTIPLE_SELECT' ? (
                          // Multiple Select (Checkbox)
                          q.options?.map((option) => (
                            <div 
                              key={option.key} 
                              className={`option-item ${selectedAnswers[q.id]?.includes(option.key) ? 'selected-answer' : ''}`}
                              style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 18px',
                                background: selectedAnswers[q.id]?.includes(option.key)
                                  ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                                  : theme === 'sun'
                                    ? 'rgba(255, 255, 255, 0.85)'
                                    : 'rgba(255, 255, 255, 0.7)',
                                border: `2px solid ${
                                  selectedAnswers[q.id]?.includes(option.key)
                                    ? (theme === 'sun' ? 'rgb(24, 144, 255)' : 'rgb(138, 122, 255)')
                                    : theme === 'sun' 
                                      ? 'rgba(113, 179, 253, 0.2)' 
                                      : 'rgba(138, 122, 255, 0.15)'
                                }`,
                                borderRadius: '12px',
                                boxShadow: theme === 'sun' 
                                  ? '0 2px 6px rgba(113, 179, 253, 0.08)'
                                  : '0 2px 6px rgba(138, 122, 255, 0.08)',
                                fontSize: '14px',
                                fontWeight: '350',
                                position: 'relative',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                minHeight: '50px',
                                boxSizing: 'border-box'
                              }}
                              onClick={() => {
                                const currentAnswers = selectedAnswers[q.id] || [];
                                const newAnswers = currentAnswers.includes(option.key)
                                  ? currentAnswers.filter(key => key !== option.key)
                                  : [...currentAnswers, option.key];
                                setSelectedAnswers(prev => ({
                                  ...prev,
                                  [q.id]: newAnswers
                                }));
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={selectedAnswers[q.id]?.includes(option.key) || false}
                                onChange={() => {}}
                                style={{ 
                                  width: '18px',
                                  height: '18px',
                                  accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                  cursor: 'pointer'
                                }} 
                              />
                              <span style={{ 
                                flexShrink: 0, 
                                color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                                fontWeight: '600',
                                fontSize: '16px'
                              }}>
                                {option.key}.
                              </span>
                              <span 
                                className="option-text"
                                style={{ 
                                  fontSize: '14px',
                                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                  fontWeight: '350',
                                  flex: 1,
                                  lineHeight: '1.6'
                                }}
                                dangerouslySetInnerHTML={{ __html: option.text || '' }}
                              />
                            </div>
                          ))
                        ) : (
                          // Multiple Choice (Radio) or True/False
                          q.options?.map((option) => (
                            <div 
                              key={option.key} 
                              className={`option-item ${selectedAnswers[q.id] === option.key ? 'selected-answer' : ''}`}
                              style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 18px',
                                background: selectedAnswers[q.id] === option.key 
                                  ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                                  : theme === 'sun'
                                    ? 'rgba(255, 255, 255, 0.85)'
                                    : 'rgba(255, 255, 255, 0.7)',
                                border: `2px solid ${
                                  selectedAnswers[q.id] === option.key 
                                    ? (theme === 'sun' ? 'rgb(24, 144, 255)' : 'rgb(138, 122, 255)')
                                    : theme === 'sun' 
                                      ? 'rgba(113, 179, 253, 0.2)' 
                                      : 'rgba(138, 122, 255, 0.15)'
                                }`,
                                borderRadius: '12px',
                                boxShadow: theme === 'sun' 
                                  ? '0 2px 6px rgba(113, 179, 253, 0.08)'
                                  : '0 2px 6px rgba(138, 122, 255, 0.08)',
                                fontSize: '14px',
                                fontWeight: '350',
                                position: 'relative',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                minHeight: '50px',
                                boxSizing: 'border-box'
                              }}
                              onClick={() => handleAnswerSelect(q.id, option.key)}
                            >
                              <input 
                                type="radio" 
                                name={`question-${q.id}`} 
                                checked={selectedAnswers[q.id] === option.key}
                                onChange={() => handleAnswerSelect(q.id, option.key)}
                                style={{ 
                                  width: '18px',
                                  height: '18px',
                                  accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                  cursor: 'pointer'
                                }} 
                              />
                              {q.type === 'TRUE_OR_FALSE' ? (
                                <Typography.Text style={{ 
                                  fontSize: '14px',
                                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                  fontWeight: '350',
                                  flex: 1
                                }}>
                                  <span 
                                    className="option-text"
                                    style={{ flex: 1, lineHeight: '1.6' }}
                                    dangerouslySetInnerHTML={{ __html: option.text || '' }}
                                  />
                                </Typography.Text>
                              ) : (
                                <>
                                  <span style={{ 
                                    flexShrink: 0, 
                                    color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                                    fontWeight: '600',
                                    fontSize: '16px'
                                  }}>
                                    {option.key}.
                                  </span>
                                  <span 
                                    className="option-text"
                                    style={{ 
                                      fontSize: '14px',
                                      color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                      fontWeight: '350',
                                      flex: 1,
                                      lineHeight: '1.6'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: option.text || '' }}
                                  />
                                </>
                              )}
                            </div>
                          ))
                        )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
// Writing Section Component
const WritingSectionItem = ({ question, index, theme }) => {
  const registerAnswerCollector = useContext(AnswerCollectionContext);
  const registerAnswerRestorer = useContext(AnswerRestorationContext);
  const triggerAutoSave = useContext(AutoSaveTriggerContext);
  const [essayText, setEssayText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [wordCount, setWordCount] = useState(0);
  const [writingMode, setWritingMode] = useState(null); // null or 'handwriting'

  const toPlainText = (html) => {
    if (!html) return '';
    return String(html)
      .replace(/<br\s*\/?>(?=\s*)/gi, '\n')
      .replace(/<\/?p[^>]*>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\r\n|\r/g, '\n')
      .replace(/\s+\n/g, '\n')
      .replace(/\n\s+/g, '\n')
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // Word count effect
  useEffect(() => {
    const words = essayText.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [essayText]);

  // Register answer collector so Writing answers are included in submit payload
  useEffect(() => {
    if (!registerAnswerCollector || !question?.id) return;

    const getAnswer = () => {
      const text = (essayText || '').trim();
      if (text) {
        return { answer: text, questionType: 'WRITING' };
      }
      if (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
        const files = uploadedFiles
          .map(f => (typeof f === 'string' ? f : (f?.value || f?.name)))
          .filter(Boolean);
        if (files.length > 0) {
          return { answer: files, questionType: 'WRITING' };
        }
      }
      return null;
    };

    const unregister = registerAnswerCollector(question.id, getAnswer);
    return unregister;
  }, [registerAnswerCollector, question?.id, essayText, uploadedFiles]);

  // Register answer restorer to prefill saved writing text from drafts/results
  useEffect(() => {
    if (!registerAnswerRestorer || !question?.id) return;

    const setAnswer = (answer) => {
      if (typeof answer === 'string') {
        setEssayText(answer);
        setWritingMode('handwriting');
        return;
      }
      if (Array.isArray(answer) && answer.length > 0) {
        // Treat array answers as uploaded files (filenames/urls)
        const files = answer
          .filter(Boolean)
          .map((name) => ({ id: Date.now() + Math.random(), name: String(name), size: 0, type: 'application/octet-stream', url: null }));
        setUploadedFiles(files);
        return;
      }
      if (answer && typeof answer === 'object' && answer.text) {
        setEssayText(String(answer.text));
        setWritingMode('handwriting');
      }
    };

    const unregister = registerAnswerRestorer(question.id, setAnswer);
    return unregister;
  }, [registerAnswerRestorer, question?.id]);

  // Debounced auto-save for WR changes
  useEffect(() => {
    if (triggerAutoSave) triggerAutoSave();
  }, [triggerAutoSave, essayText, uploadedFiles, writingMode]);


  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };


  return (
    <>
      <style>
        {`
          .writing-prompt-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .writing-prompt-scrollbar::-webkit-scrollbar-track {
            background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'};
            border-radius: 4px;
          }
          .writing-prompt-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'};
            border-radius: 4px;
            border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'};
          }
          .writing-prompt-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'};
          }
        `}
      </style>
      <div
        className={`question-item ${theme}-question-item`}
        style={{
          marginBottom: '24px',
          borderRadius: '16px',
          padding: '24px',
          border: '2px solid',
          borderColor: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.25)' 
            : 'rgba(138, 122, 255, 0.2)',
          background: theme === 'sun' 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
          boxShadow: theme === 'sun' 
            ? '0 4px 16px rgba(113, 179, 253, 0.1)'
            : '0 4px 16px rgba(138, 122, 255, 0.12)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Header */}
        <div className="question-header" style={{
          paddingBottom: '14px',
          marginBottom: '16px',
          borderBottom: '2px solid',
          borderBottomColor: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.25)' 
            : 'rgba(138, 122, 255, 0.2)',
          position: 'relative'
        }}>
          <Typography.Text strong style={{ 
            fontSize: '16px', 
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
          }}>
            {index + 1}. Writing Section
          </Typography.Text>
          <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
            ({question.points} {question.points > 1 ? 'points' : 'point'})
          </Typography.Text>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'flex', gap: '24px', minHeight: '600px' }}>
          {/* Left Column - Writing Prompt */}
          <div 
            className="writing-prompt-scrollbar"
            style={{
              flex: '1',
              padding: '20px',
              background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
              overflowY: 'auto',
              maxHeight: '600px',
              scrollbarWidth: 'thin',
              scrollbarColor: theme === 'sun' 
                ? '#1890ff rgba(24, 144, 255, 0.2)' 
                : '#8B5CF6 rgba(138, 122, 255, 0.2)'
            }}>
            
            {/* Writing Prompt */}
            <div 
              className="passage-text-content"
              style={{
                fontSize: '15px',
                lineHeight: '1.8',
                color: theme === 'sun' ? '#333' : '#1F2937',
                textAlign: 'justify'
              }}
              dangerouslySetInnerHTML={{ __html: question.prompt || '' }}
            />
            {/* Legacy formatting removed - using HTML directly now */}
            {false && question.prompt && (
            <div style={{
              fontSize: '15px',
              lineHeight: '1.8',
              color: theme === 'sun' ? '#333' : '#1F2937',
              textAlign: 'justify'
            }}>
              {(question.prompt || '').split('\n').map((line, idx) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                  return (
                    <div key={idx} style={{
                      fontWeight: '600',
                      fontSize: '16px',
                      margin: '16px 0 8px 0',
                      color: theme === 'sun' ? '#1E40AF' : '#1F2937'
                    }}>
                      {line.replace(/\*\*/g, '')}
                    </div>
                  );
                } else if (line.startsWith('- ')) {
                  return (
                    <div key={idx} style={{
                      margin: '4px 0',
                      paddingLeft: '16px',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '0',
                        color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                        fontWeight: 'bold'
                      }}>•</span>
                      {line.substring(2)}
                    </div>
                  );
                } else if (line.match(/^\d+\./)) {
                  return (
                    <div key={idx} style={{
                      margin: '4px 0',
                      paddingLeft: '16px',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '0',
                        color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                        fontWeight: 'bold'
                      }}>{(line.match(/^\d+\./) || [''])[0]}</span>
                      {line.replace(/^\d+\.\s*/, '')}
                    </div>
                  );
                } else if (line.trim() === '') {
                  return <div key={idx} style={{ height: '8px' }} />;
                } else {
                  return (
                    <div key={idx} style={{ margin: '8px 0' }}>
                      {line}
                    </div>
                  );
                }
              })}
            </div>
            )}
          </div>

          {/* Right Column - Writing Area */}
          <div style={{
            flex: '1',
            background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
            overflowY: 'auto',
            maxHeight: '600px'
          }}>
            <div style={{ padding: '20px' }}>
              {writingMode === null ? (
                /* Show 2 options initially */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Handwriting Option */}
                  <div
                    onClick={() => setWritingMode('handwriting')}
                    style={{
                      padding: '24px',
                      background: theme === 'sun' 
                        ? 'linear-gradient(135deg, rgba(230, 245, 255, 0.5) 0%, rgba(186, 231, 255, 0.4) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(244, 240, 255, 0.5) 100%)',
                      border: `2px solid ${theme === 'sun' 
                        ? 'rgba(24, 144, 255, 0.3)' 
                        : 'rgba(138, 122, 255, 0.3)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = theme === 'sun' 
                        ? '0 4px 12px rgba(24, 144, 255, 0.2)'
                        : '0 4px 12px rgba(138, 122, 255, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>✍️</div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600',
                      color: theme === 'sun' ? '#1E40AF' : '#8377A0',
                      marginBottom: '4px'
                    }}>
                      Write Essay Here
                    </div>
                    <div style={{ 
                      fontSize: '13px',
                      color: theme === 'sun' ? '#666' : '#999'
                    }}>
                      Type your essay directly in the text area
                    </div>
                  </div>

                  {/* Upload File Option */}
                  <div style={{
                    position: 'relative'
                  }}>
                    <input
                      type="file"
                      id="upload-option"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="upload-option"
                      style={{
                        display: 'block',
                        padding: '24px',
                        background: theme === 'sun' 
                          ? 'linear-gradient(135deg, rgba(237, 250, 230, 0.5) 0%, rgba(207, 244, 192, 0.4) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(244, 240, 255, 0.5) 100%)',
                        border: `2px solid ${theme === 'sun' 
                          ? 'rgba(82, 196, 26, 0.3)' 
                          : 'rgba(138, 122, 255, 0.3)'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = theme === 'sun' 
                          ? '0 4px 12px rgba(82, 196, 26, 0.2)'
                          : '0 4px 12px rgba(138, 122, 255, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '600',
                        color: theme === 'sun' ? '#1E40AF' : '#8377A0',
                        marginBottom: '4px'
                      }}>
                        Upload
                      </div>
                      <div style={{ 
                        fontSize: '13px',
                        color: theme === 'sun' ? '#666' : '#999'
                      }}>
                        Upload image of your handwritten essay (Max 5MB)
                      </div>
                    </label>
                  </div>
                </div>
              ) : writingMode === 'handwriting' ? (
                /* Show textarea when handwriting mode */
                <div>
                  <button
                    onClick={() => {
                      setWritingMode(null);
                    }}
                    style={{
                      padding: '6px 12px',
                      marginBottom: '16px',
                      background: 'none',
                      border: `1px solid ${theme === 'sun' ? '#d9d9d9' : 'rgba(255, 255, 255, 0.2)'}`,
                      borderRadius: '6px',
                      color: theme === 'sun' ? '#1E40AF' : '#8B5CF6',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    ← Back to options
                  </button>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: theme === 'sun' ? '#333' : '#1F2937'
                      }}>
                        Your Essay:
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ 
                          fontSize: '16px', 
                          fontWeight: '500',
                          color: theme === 'sun' ? '#666' : '#999',
                          letterSpacing: '0.3px'
                        }}>
                          {wordCount}
                        </span>
                        <span style={{ 
                          fontSize: '16px',
                          color: theme === 'sun' ? '#999' : '#777',
                          fontWeight: '400'
                        }}>
                          words
                        </span>
                      </div>
                    </div>
                    <textarea
                      value={essayText}
                      onChange={(e) => setEssayText(e.target.value)}
                      placeholder="Start writing your essay here..."
                      style={{
                        width: '100%',
                        minHeight: '400px',
                        padding: '16px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        border: `2px solid ${theme === 'sun' 
                          ? 'rgba(24, 144, 255, 0.2)' 
                          : 'rgba(138, 122, 255, 0.3)'}`,
                        borderRadius: '8px',
                        background: theme === 'sun' 
                          ? 'linear-gradient(135deg, #ffffff 0%, rgba(24, 144, 255, 0.02) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(138, 122, 255, 0.05) 100%)',
                        color: theme === 'sun' ? '#333' : '#1F2937',
                        resize: 'vertical',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        boxShadow: theme === 'sun' 
                          ? '0 2px 8px rgba(24, 144, 255, 0.1)'
                          : '0 2px 8px rgba(138, 122, 255, 0.15)'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
                        e.target.style.boxShadow = theme === 'sun' 
                          ? '0 4px 12px rgba(24, 144, 255, 0.2)'
                          : '0 4px 12px rgba(138, 122, 255, 0.25)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = theme === 'sun' 
                          ? 'rgba(24, 144, 255, 0.2)' 
                          : 'rgba(138, 122, 255, 0.3)';
                        e.target.style.boxShadow = theme === 'sun' 
                          ? '0 2px 8px rgba(24, 144, 255, 0.1)'
                          : '0 2px 8px rgba(138, 122, 255, 0.15)';
                      }}
                    />
                  </div>
                </div>
              ) : null}
              {/* Show uploaded files below options */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: theme === 'sun' ? '#333' : '#1F2937'
                  }}>
                    Uploaded Files:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          background: theme === 'sun' 
                            ? 'linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(64, 169, 255, 0.05) 100%)'
                            : 'linear-gradient(135deg, rgba(138, 122, 255, 0.12) 0%, rgba(167, 139, 250, 0.08) 100%)',
                          border: `1px solid ${theme === 'sun' 
                            ? 'rgba(24, 144, 255, 0.2)' 
                            : 'rgba(138, 122, 255, 0.25)'}`,
                          borderRadius: '6px',
                          fontSize: '12px',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <span>📄</span>
                        <span style={{ color: theme === 'sun' ? '#333' : '#1F2937' }}>
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeFile(file.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ff4d4f',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '2px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
// Speaking Section Component
const SpeakingSectionItem = ({ question, index, theme, isViewOnly }) => {
  const registerAnswerCollector = useContext(AnswerCollectionContext);
  const registerAnswerRestorer = useContext(AnswerRestorationContext);
  const triggerAutoSave = useContext(AutoSaveTriggerContext);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const toPlainText = (html) => {
    if (!html) return '';
    return String(html)
      .replace(/<br\s*\/?>(?=\s*)/gi, '\n')
      .replace(/<\/?p[^>]*>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\r\n|\r/g, '\n')
      .replace(/\s+\n/g, '\n')
      .replace(/\n\s+/g, '\n')
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = () => {
    if (isViewOnly) return;
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          // Create temporary blob URL for preview
          const tempUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(tempUrl);
          
          // Immediately upload to server and replace with server URL
          try {
            const ext = 'webm';
            const file = new File([audioBlob], `speaking-${Date.now()}.${ext}`, { 
              type: audioBlob.type || 'audio/webm' 
            });
            
            const uploadRes = await dailyChallengeApi.uploadFile(file);
            const serverUrl = uploadRes?.data?.url || uploadRes?.data || uploadRes;
            
            if (serverUrl && typeof serverUrl === 'string') {
              // Replace temp blob URL with server URL
              URL.revokeObjectURL(tempUrl);
              setAudioUrl(serverUrl);
              console.log('✅ Audio uploaded to server:', serverUrl);
            } else {
              console.warn('⚠️ Server did not return valid URL, keeping blob URL');
            }
          } catch (error) {
            console.error('❌ Failed to upload audio:', error);
            // Keep blob URL as fallback
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
        alert('Could not access microphone. Please check permissions.');
      });
  };

  const stopRecording = () => {
    if (isViewOnly) return;
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (event) => {
    if (isViewOnly) return;
    const files = Array.from(event.target.files);
    
    // Upload each file to server and get server URLs
    const uploadedFilesData = await Promise.all(
      files.map(async (file) => {
        try {
          const uploadRes = await dailyChallengeApi.uploadFile(file);
          const serverUrl = uploadRes?.data?.url || uploadRes?.data || uploadRes;
          
          if (serverUrl && typeof serverUrl === 'string') {
            console.log('✅ File uploaded to server:', serverUrl);
            return {
              id: Date.now() + Math.random(),
              name: file.name,
              size: file.size,
              type: file.type,
              url: serverUrl // Use server URL instead of blob URL
            };
          } else {
            throw new Error('Server did not return valid URL');
          }
        } catch (error) {
          console.error('❌ Failed to upload file:', file.name, error);
          // Fallback to blob URL if upload fails
          return {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file)
          };
        }
      })
    );
    
    setUploadedFiles(prev => [...prev, ...uploadedFilesData]);
  };

  const removeFile = (fileId) => {
    if (isViewOnly) return;
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const removeRecording = () => {
    if (isViewOnly) return;
    setAudioUrl(null);
  };

  // Register answer collector for Speaking
  useEffect(() => {
    if (!registerAnswerCollector || !question?.id) return;

    const getAnswer = () => {
      if (isViewOnly) return null;
      // Prefer recorded audio URL, else any uploaded file URLs/names
      if (audioUrl) {
        return { answer: audioUrl, questionType: 'SPEAKING' };
      }
      if (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
        const files = uploadedFiles
          .map(f => (typeof f === 'string' ? f : (f?.url || f?.name)))
          .filter(Boolean);
        if (files.length > 0) return { answer: files, questionType: 'SPEAKING' };
      }
      return null;
    };

    const unregister = registerAnswerCollector(question.id, getAnswer);
    return unregister;
  }, [registerAnswerCollector, question?.id, audioUrl, uploadedFiles]);

  // Register restorer to prefill speaking answer from draft/result
  useEffect(() => {
    if (!registerAnswerRestorer || !question?.id) return;

    const setAnswer = (answer) => {
      if (typeof answer === 'string') {
        // Just set the URL directly (should be server URL now)
        setAudioUrl(answer);
        return;
      }
      if (Array.isArray(answer) && answer.length > 0) {
        const first = answer.find(Boolean);
        if (first && typeof first === 'string') {
          // Just set the URL directly (should be server URL now)
          setAudioUrl(String(first));
        }
      }
    };

    const unregister = registerAnswerRestorer(question.id, setAnswer);
    return unregister;
  }, [registerAnswerRestorer, question?.id]);

  // Debounced auto-save for SP changes
  useEffect(() => {
    if (triggerAutoSave) triggerAutoSave();
  }, [triggerAutoSave, isRecording, audioUrl, uploadedFiles]);

  return (
    <>
      <style>
        {`
          .speaking-prompt-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .speaking-prompt-scrollbar::-webkit-scrollbar-track {
            background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'};
            border-radius: 4px;
          }
          .speaking-prompt-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'};
            border-radius: 4px;
            border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'};
          }
          .speaking-prompt-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'};
          }
        `}
      </style>
      <div
        className={`question-item ${theme}-question-item`}
        style={{
          marginBottom: '24px',
          borderRadius: '16px',
          padding: '24px',
          border: '2px solid',
          borderColor: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.25)' 
            : 'rgba(138, 122, 255, 0.2)',
          background: theme === 'sun' 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
          boxShadow: theme === 'sun' 
            ? '0 4px 16px rgba(113, 179, 253, 0.1)'
            : '0 4px 16px rgba(138, 122, 255, 0.12)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Header */}
        <div className="question-header" style={{
          paddingBottom: '14px',
          marginBottom: '16px',
          borderBottom: '2px solid',
          borderBottomColor: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.25)' 
            : 'rgba(138, 122, 255, 0.2)',
          position: 'relative'
        }}>
          <Typography.Text strong style={{ 
            fontSize: '20px', 
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
          }}>
            {index + 1}. Speaking Section
          </Typography.Text>
          <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
            ({question.points} {question.points > 1 ? 'points' : 'point'})
          </Typography.Text>
        </div>
        {/* Layout: Left - Prompt, Right - Recording */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Left Section - Prompt */}
          <div 
            className="speaking-prompt-scrollbar"
            style={{
              flex: '1',
              padding: '20px',
              background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
              overflowY: 'auto',
              maxHeight: '500px',
              scrollbarWidth: 'thin',
              scrollbarColor: theme === 'sun' 
                ? '#1890ff rgba(24, 144, 255, 0.2)' 
                : '#8B5CF6 rgba(138, 122, 255, 0.2)'
            }}>
            
            {/* Maximum Recording Time */}
            <div style={{
              marginBottom: '16px',
              fontWeight: '600',
              fontSize: '20px',
              color: theme === 'sun' ? '#1E40AF' : '#1F2937',
              textAlign: 'left'
            }}>
              🎤 Maximum limit 3 minutes
            </div>
            
            <div style={{
              fontSize: '15px',
              lineHeight: '1.8',
              color: theme === 'sun' ? '#333' : '#1F2937',
              textAlign: 'justify'
            }}>
              <div dangerouslySetInnerHTML={{ __html: processPassageContent(question.prompt, theme, 'SP') }} />
            </div>
          </div>

          {/* Right Section - Recording Area */}
          <div style={{
            flex: '1',
            padding: '24px',
            background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
            textAlign: 'center'
          }}>
            {/* Recorded Audio Display */}
            {audioUrl && (
              <div style={{ marginBottom: '20px' }}>
                <audio controls style={{ width: '100%', height: '40px' }} src={audioUrl}>
                  Your browser does not support the audio element.
                </audio>
                {!isViewOnly && (
                <button
                  onClick={removeRecording}
                  style={{
                    marginTop: '8px',
                    padding: '6px 16px',
                    background: theme === 'sun' 
                      ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                      : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ✕ Remove Recording
                </button>
                )}
              </div>
            )}

            {/* Mic Button - Large and Centered */}
            {!isViewOnly && (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: 'none',
                background: isRecording 
                  ? '#ff4d4f'
                  : 'rgb(227, 244, 255)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: isRecording
                  ? '0 0 20px rgba(255, 77, 79, 0.5)'
                  : '0 4px 12px rgba(24, 144, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isRecording) {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 6px 16px rgba(24, 144, 255, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isRecording) {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.3)';
                }
              }}
            >
              <img 
                src="/img/icon-mic.png" 
                alt="Microphone" 
                style={{ 
                  width: '60px',
                  height: '60px',
                  filter: 'none'
                }} 
              />
            </button>
            )}

            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: theme === 'sun' ? '#1E40AF' : '#8B5CF6',
              marginBottom: '8px'
            }}>
              {isViewOnly ? 'Submitted answer' : (isRecording ? 'Recording...' : 'Click to start recording')}
            </div>
            <div style={{
              fontSize: '12px',
              color: theme === 'sun' ? '#666' : '#999'
            }}>
              {isViewOnly ? '' : (isRecording ? 'Click the microphone again to stop' : 'Press the microphone to record your response')}
            </div>

            {/* Upload Section - Similar to Writing */}
            {!isViewOnly && (
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.2)'}` }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '600',
                color: theme === 'sun' ? '#333' : '#1F2937',
                marginBottom: '16px'
              }}>
                Upload Audio File (Optional):
              </div>
              
              <div style={{
                position: 'relative'
              }}>
                <input
                  type="file"
                  id="speaking-audio-upload"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="speaking-audio-upload"
                  style={{
                    display: 'block',
                    padding: '20px',
                    background: theme === 'sun' 
                      ? 'linear-gradient(135deg, rgba(237, 250, 230, 0.5) 0%, rgba(207, 244, 192, 0.4) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(244, 240, 255, 0.5) 100%)',
                    border: `2px solid ${theme === 'sun' 
                      ? 'rgba(82, 196, 26, 0.3)' 
                      : 'rgba(138, 122, 255, 0.3)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = theme === 'sun' 
                      ? '0 4px 12px rgba(82, 196, 26, 0.2)'
                      : '0 4px 12px rgba(138, 122, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: theme === 'sun' ? '#1E40AF' : '#8377A0',
                    marginBottom: '4px'
                  }}>
                    Upload Audio
                  </div>
                  <div style={{ 
                    fontSize: '13px',
                    color: theme === 'sun' ? '#666' : '#999'
                  }}>
                    Upload MP3 audio file (Max 5MB)
                  </div>
                </label>
              </div>
            </div>
            )}

            {/* Uploaded Files */}
            {!isViewOnly && uploadedFiles.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: theme === 'sun' 
                          ? 'linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(64, 169, 255, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(138, 122, 255, 0.12) 0%, rgba(167, 139, 250, 0.08) 100%)',
                        border: `1px solid ${theme === 'sun' 
                          ? 'rgba(24, 144, 255, 0.2)' 
                          : 'rgba(138, 122, 255, 0.25)'}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span>🎵</span>
                      <span style={{ color: theme === 'sun' ? '#333' : '#1F2937' }}>
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(file.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff4d4f',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '2px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
// Speaking With Audio Section Component
const SpeakingWithAudioSectionItem = ({ question, index, theme, sectionScore, isViewOnly }) => {
  const registerAnswerCollector = useContext(AnswerCollectionContext);
  const registerAnswerRestorer = useContext(AnswerRestorationContext);
  const triggerAutoSave = useContext(AutoSaveTriggerContext);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const toPlainText = (html) => {
    if (!html) return '';
    return String(html)
      .replace(/<br\s*\/?>(?=\s*)/gi, '\n')
      .replace(/<\/?p[^>]*>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\r\n|\r/g, '\n')
      .replace(/\s+\n/g, '\n')
      .replace(/\n\s+/g, '\n')
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  const startRecording = () => {
    if (isViewOnly) return;
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          // Create temporary blob URL for preview
          const tempUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(tempUrl);
          
          // Immediately upload to server and replace with server URL
          try {
            const ext = 'webm';
            const file = new File([audioBlob], `speaking-${Date.now()}.${ext}`, { 
              type: audioBlob.type || 'audio/webm' 
            });
            
            const uploadRes = await dailyChallengeApi.uploadFile(file);
            const serverUrl = uploadRes?.data?.url || uploadRes?.data || uploadRes;
            
            if (serverUrl && typeof serverUrl === 'string') {
              // Replace temp blob URL with server URL
              URL.revokeObjectURL(tempUrl);
              setAudioUrl(serverUrl);
              console.log('✅ Audio uploaded to server:', serverUrl);
            } else {
              console.warn('⚠️ Server did not return valid URL, keeping blob URL');
            }
          } catch (error) {
            console.error('❌ Failed to upload audio:', error);
            // Keep blob URL as fallback
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
        alert('Could not access microphone. Please check permissions.');
      });
  };

  const stopRecording = () => {
    if (isViewOnly) return;
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (event) => {
    if (isViewOnly) return;
    const files = Array.from(event.target.files);
    
    // Upload each file to server and get server URLs
    const uploadedFilesData = await Promise.all(
      files.map(async (file) => {
        try {
          const uploadRes = await dailyChallengeApi.uploadFile(file);
          const serverUrl = uploadRes?.data?.url || uploadRes?.data || uploadRes;
          
          if (serverUrl && typeof serverUrl === 'string') {
            console.log('✅ File uploaded to server:', serverUrl);
            return {
              id: Date.now() + Math.random(),
              name: file.name,
              size: file.size,
              type: file.type,
              url: serverUrl // Use server URL instead of blob URL
            };
          } else {
            throw new Error('Server did not return valid URL');
          }
        } catch (error) {
          console.error('❌ Failed to upload file:', file.name, error);
          // Fallback to blob URL if upload fails
          return {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file)
          };
        }
      })
    );
    
    setUploadedFiles(prev => [...prev, ...uploadedFilesData]);
  };

  const removeFile = (fileId) => {
    if (isViewOnly) return;
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Register answer collector for Speaking with audio prompt
  useEffect(() => {
    if (!registerAnswerCollector || !question?.id) return;

    const getAnswer = () => {
      if (isViewOnly) return null;
      if (audioUrl) {
        return { answer: audioUrl, questionType: 'SPEAKING' };
      }
      if (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
        const files = uploadedFiles
          .map(f => (typeof f === 'string' ? f : (f?.url || f?.name)))
          .filter(Boolean);
        if (files.length > 0) return { answer: files, questionType: 'SPEAKING' };
      }
      return null;
    };

    const unregister = registerAnswerCollector(question.id, getAnswer);
    return unregister;
  }, [registerAnswerCollector, question?.id, audioUrl, uploadedFiles]);

  // Register restorer to prefill saved speaking answer
  useEffect(() => {
    if (!registerAnswerRestorer || !question?.id) return;

    const setAnswer = (answer) => {
      if (typeof answer === 'string') {
        // Just set the URL directly (should be server URL now)
        setAudioUrl(answer);
        return;
      }
      if (Array.isArray(answer) && answer.length > 0) {
        const first = answer.find(Boolean);
        if (first && typeof first === 'string') {
          // Just set the URL directly (should be server URL now)
          setAudioUrl(String(first));
        }
      }
    };

    const unregister = registerAnswerRestorer(question.id, setAnswer);
    return unregister;
  }, [registerAnswerRestorer, question?.id]);

  useEffect(() => {
    if (triggerAutoSave) triggerAutoSave();
  }, [triggerAutoSave, isRecording, audioUrl, uploadedFiles, isPlaying, currentTime]);

  const removeRecording = () => {
    if (isViewOnly) return;
    setAudioUrl(null);
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <style>
        {`
          .speaking-audio-prompt-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .speaking-audio-prompt-scrollbar::-webkit-scrollbar-track {
            background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'};
            border-radius: 4px;
          }
          .speaking-audio-prompt-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'};
            border-radius: 4px;
            border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'};
          }
          .speaking-audio-prompt-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'};
          }
        `}
      </style>
      <div
        className={`question-item ${theme}-question-item`}
        style={{
          marginBottom: '24px',
          borderRadius: '16px',
          padding: '24px',
          border: '2px solid',
          borderColor: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.25)' 
            : 'rgba(138, 122, 255, 0.2)',
          background: theme === 'sun' 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
          boxShadow: theme === 'sun' 
            ? '0 4px 16px rgba(113, 179, 253, 0.1)'
            : '0 4px 16px rgba(138, 122, 255, 0.12)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Header */}
        <div className="question-header" style={{
          paddingBottom: '14px',
          marginBottom: '16px',
          borderBottom: '2px solid',
          borderBottomColor: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.25)' 
            : 'rgba(138, 122, 255, 0.2)',
          position: 'relative'
        }}>
        <Typography.Text strong style={{ 
            fontSize: '20px', 
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
          }}>
            {index + 1}. Speaking With Audio Section
          </Typography.Text>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
          <Typography.Text style={{ fontSize: '14px', opacity: 0.7 }}>
            ({question.points || sectionScore?.totalScore || 0} {(question.points || sectionScore?.totalScore || 0) !== 1 ? 'points' : 'point'})
          </Typography.Text>
        </div>
        </div>

        {/* Layout: Left - Audio Player, Right - Recording */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Left Section - Audio Player */}
          <div 
            className="speaking-audio-prompt-scrollbar"
            style={{
              flex: '1',
              padding: '20px',
              background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
              overflowY: 'auto',
              maxHeight: '500px',
              scrollbarWidth: 'thin',
              scrollbarColor: theme === 'sun' 
                ? '#1890ff rgba(24, 144, 255, 0.2)' 
                : '#8B5CF6 rgba(138, 122, 255, 0.2)'
            }}>
            
            {/* Maximum Recording Time */}
            <div style={{
              marginBottom: '16px',
              fontWeight: '600',
              fontSize: '20px',
              color: theme === 'sun' ? '#1E40AF' : '#1F2937',
              textAlign: 'left'
            }}>
              🎤 Maximum limit 3 minutes
            </div>

            {/* Audio Player */}
            <div style={{
              background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
              boxShadow: theme === 'sun' 
                ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                : '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              <audio
                ref={audioRef}
                src={question.audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                style={{ display: 'none' }}
              >
                <source src={question.audioUrl} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>

              {/* Audio Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                {/* Play/Pause Button */}
                <button
                  onClick={togglePlayPause}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: 'none',
                    background: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: theme === 'sun' 
                      ? '0 4px 12px rgba(24, 144, 255, 0.3)' 
                      : '0 4px 12px rgba(138, 122, 255, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>

                {/* Time Display */}
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme === 'sun' ? '#333' : '#1F2937',
                  minWidth: '80px'
                }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    flex: 1,
                    height: '6px',
                    background: theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={handleSeek}
                >
                  <div
                    style={{
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                      height: '100%',
                      background: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                      borderRadius: '3px',
                      transition: 'width 0.1s ease'
                    }}
                  />
                </div>

                {/* Volume Control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '16px',
                    color: theme === 'sun' ? '#666' : '#ccc'
                  }}>🔊</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    style={{
                      width: '60px',
                      accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Transcript Content */}
            {question.transcript && (
              <div style={{
                background: '#ffffff',
                borderRadius: '8px',
                padding: '16px',
                border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(138, 122, 255, 0.3)'}`,
                fontSize: '15px',
                lineHeight: '1.8',
                color: '#333',
                textAlign: 'justify',
                boxShadow: theme === 'sun' 
                  ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                  : '0 2px 8px rgba(138, 122, 255, 0.2)'
              }}>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: theme === 'sun' ? '#1E40AF' : '#8B5CF6'
                }}>
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  <div dangerouslySetInnerHTML={{ __html: processPassageContent(question.transcript, theme, 'SP') }} />
                </div>
              </div>
            )}
          </div>

          {/* Right Section - Recording Area */}
          <div style={{
            flex: '1',
            padding: '24px',
            background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
            textAlign: 'center'
          }}>
            {/* Recorded Audio Display */}
            {audioUrl && (
              <div style={{ marginBottom: '20px' }}>
                <audio controls style={{ width: '100%', height: '40px' }} src={audioUrl}>
                  Your browser does not support the audio element.
                </audio>
                {!isViewOnly && (
                <button
                  onClick={removeRecording}
                  style={{
                    marginTop: '8px',
                    padding: '6px 16px',
                    background: theme === 'sun' 
                      ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                      : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ✕ Remove Recording
                </button>
                )}
              </div>
            )}

            {/* Mic Button - Large and Centered */}
            {!isViewOnly && (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: 'none',
                background: isRecording 
                  ? '#ff4d4f'
                  : 'rgb(227, 244, 255)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: isRecording
                  ? '0 0 20px rgba(255, 77, 79, 0.5)'
                  : '0 4px 12px rgba(24, 144, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isRecording) {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 6px 16px rgba(24, 144, 255, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isRecording) {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.3)';
                }
              }}
            >
              <img 
                src="/img/icon-mic.png" 
                alt="Microphone" 
                style={{ 
                  width: '60px',
                  height: '60px',
                  filter: 'none'
                }} 
              />
            </button>
            )}

            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: theme === 'sun' ? '#1E40AF' : '#8B5CF6',
              marginBottom: '8px'
            }}>
              {isViewOnly ? 'Submitted answer' : (isRecording ? 'Recording...' : 'Click to start recording')}
            </div>
            <div style={{
              fontSize: '12px',
              color: theme === 'sun' ? '#666' : '#999'
            }}>
              {isViewOnly ? '' : (isRecording ? 'Click the microphone again to stop' : 'Press the microphone to record your response')}
            </div>

            {/* Upload Section - Similar to Writing */}
            {!isViewOnly && (
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.2)'}` }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '600',
                color: theme === 'sun' ? '#333' : '#1F2937',
                marginBottom: '16px'
              }}>
                Upload Audio File (Optional):
              </div>
              
              <div style={{
                position: 'relative'
              }}>
                <input
                  type="file"
                  id="speaking-with-audio-upload"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="speaking-with-audio-upload"
                  style={{
                    display: 'block',
                    padding: '20px',
                    background: theme === 'sun' 
                      ? 'linear-gradient(135deg, rgba(237, 250, 230, 0.5) 0%, rgba(207, 244, 192, 0.4) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(244, 240, 255, 0.5) 100%)',
                    border: `2px solid ${theme === 'sun' 
                      ? 'rgba(82, 196, 26, 0.3)' 
                      : 'rgba(138, 122, 255, 0.3)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = theme === 'sun' 
                      ? '0 4px 12px rgba(82, 196, 26, 0.2)'
                      : '0 4px 12px rgba(138, 122, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: theme === 'sun' ? '#1E40AF' : '#8377A0',
                    marginBottom: '4px'
                  }}>
                    Upload Audio
                  </div>
                  <div style={{ 
                    fontSize: '13px',
                    color: theme === 'sun' ? '#666' : '#999'
                  }}>
                    Upload MP3 audio file (Max 5MB)
                  </div>
                </label>
              </div>
            </div>
            )}

            {/* Uploaded Files */}
            {!isViewOnly && uploadedFiles.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: theme === 'sun' 
                          ? 'linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(64, 169, 255, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(138, 122, 255, 0.12) 0%, rgba(167, 139, 250, 0.08) 100%)',
                        border: `1px solid ${theme === 'sun' 
                          ? 'rgba(24, 144, 255, 0.2)' 
                          : 'rgba(138, 122, 255, 0.25)'}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span>🎵</span>
                      <span style={{ color: theme === 'sun' ? '#333' : '#1F2937' }}>
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(file.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff4d4f',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '2px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
// Multiple Choice Container Component
const MultipleChoiceContainer = ({ theme, data }) => {
  const registerAnswerCollector = useContext(AnswerCollectionContext);
  const registerAnswerRestorer = useContext(AnswerRestorationContext);
  const [selectedAnswer, setSelectedAnswer] = React.useState(null);
  const questionText = data?.question || data?.questionText || 'What is the capital city of Vietnam?';
  const optionsFromApi = Array.isArray(data?.options) && data.options.length > 0
    ? data.options
    : null;

  // Register answer collector
  React.useEffect(() => {
    if (!registerAnswerCollector || !data?.id) return;
    
    const getAnswer = () => {
      if (!selectedAnswer) return null;
      const contentOpts = Array.isArray(data?.content?.data) && data.content.data.length > 0
        ? data.content.data.map((d, idx) => ({ key: d.id || String.fromCharCode(65 + idx), text: d.value }))
        : null;
      const baseOptions = optionsFromApi || contentOpts || ['A','B','C','D'].map((k, i) => ({ key: k, text: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho'][i] }));
      const options = baseOptions.map((o, idx) => ({ key: o.key || String.fromCharCode(65 + idx), text: o.text }));
      return { answer: selectedAnswer, questionType: 'MULTIPLE_CHOICE', options };
    };
    
    const unregister = registerAnswerCollector(data.id, getAnswer);
    return unregister;
  }, [registerAnswerCollector, data?.id, selectedAnswer]);

  // Register answer restorer (for submittedContent)
  React.useEffect(() => {
    if (!registerAnswerRestorer || !data?.id) return;

    const unregister = registerAnswerRestorer(data.id, (restored) => {
      if (typeof restored === 'string' && restored) {
        const contentOpts = Array.isArray(data?.content?.data) && data.content.data.length > 0
          ? data.content.data.map((d, idx) => ({ key: d.id || String.fromCharCode(65 + idx), text: d.value }))
          : null;
        const baseOptions = optionsFromApi || contentOpts || ['A','B','C','D'].map((k, i) => ({ key: k, text: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho'][i] }));
        const options = baseOptions.map((o, idx) => ({ key: o.key || String.fromCharCode(65 + idx), text: typeof o.text === 'string' ? o.text.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim() : o.text }));
        const normalized = String(restored).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
        const match = options.find(o => o.text === normalized || o.key === normalized);
        setSelectedAnswer(match ? match.key : normalized);
      }
    });
    return unregister;
  }, [registerAnswerRestorer, data?.id]);

  return (
    <div
      className={`question-item ${theme}-question-item`}
      style={{
        marginBottom: '24px',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid',
        borderColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        background: theme === 'sun' 
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
        boxShadow: theme === 'sun' 
          ? '0 4px 16px rgba(113, 179, 253, 0.1)'
          : '0 4px 16px rgba(138, 122, 255, 0.12)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div className="question-header" style={{
        paddingBottom: '14px',
        marginBottom: '16px',
        borderBottom: '2px solid',
        borderBottomColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography.Text strong style={{ 
          fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question 1
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          Multiple Choice
        </Typography.Text>
      </div>

      {/* Content Area */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        <div 
          className="question-text-content"
          style={{ 
            fontSize: '15px', 
            fontWeight: 350,
            marginBottom: '12px',
            display: 'block',
            lineHeight: '1.8',
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
          }}
          dangerouslySetInnerHTML={{ __html: questionText }}
        />

        {/* Options */}
        <div className="question-options" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '14px', 
          marginTop: '12px' 
        }}>
          {(
            optionsFromApi
              || (Array.isArray(data?.content?.data) && data.content.data.length > 0
                    ? data.content.data.map((d, idx) => ({ key: d.id || String.fromCharCode(65 + idx), text: d.value }))
                    : null)
              || ['A','B','C','D'].map((k, i) => ({ key: k, text: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho'][i] }))
          ).map((opt, idx) => {
            const key = opt.key || String.fromCharCode(65 + idx);
            const isSelected = selectedAnswer === key;
            return (
              <div
                key={idx}
                onClick={() => setSelectedAnswer(key)}
                className={`option-item ${isSelected ? 'selected-answer' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: isSelected
                    ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                    : theme === 'sun'
                      ? 'rgba(255, 255, 255, 0.85)'
                      : 'rgba(255, 255, 255, 0.7)',
                  border: `2px solid ${
                    isSelected
                      ? (theme === 'sun' ? 'rgb(24, 144, 255)' : 'rgb(138, 122, 255)')
                      : theme === 'sun' 
                        ? 'rgba(113, 179, 253, 0.2)' 
                        : 'rgba(138, 122, 255, 0.15)'
                  }`,
        borderRadius: '12px',
        boxShadow: theme === 'sun' 
                    ? '0 2px 6px rgba(113, 179, 253, 0.08)'
                    : '0 2px 6px rgba(138, 122, 255, 0.08)',
                  fontSize: '14px',
                  fontWeight: '350',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  minHeight: '50px',
                  boxSizing: 'border-box'
                }}
              >
                <input 
                  type="radio" 
                  name="question-1"
                  checked={isSelected}
                  onChange={() => setSelectedAnswer(key)}
                  style={{ 
                    width: '18px',
                    height: '18px',
                    accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                    cursor: 'pointer'
                  }} 
                />
                <span style={{ 
                  flexShrink: 0, 
                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                  fontWeight: '600',
                  fontSize: '16px'
                }}>
                  {key}.
                </span>
                <span 
                  className="option-text"
                  style={{ 
                    fontSize: '14px',
                    color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                    fontWeight: '350',
                    flex: 1,
                    lineHeight: '1.6'
                  }}
                  dangerouslySetInnerHTML={{ __html: opt.text || '' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Multiple Select Container Component
const MultipleSelectContainer = ({ theme, data }) => {
  const registerAnswerCollector = useContext(AnswerCollectionContext);
  const registerAnswerRestorer = useContext(AnswerRestorationContext);
  const [selectedAnswers, setSelectedAnswers] = React.useState([]);
  const questionText = data?.question || data?.questionText || 'Which of the following are Southeast Asian countries? (Select all that apply)';
  const optionsFromApi = Array.isArray(data?.options) && data.options.length > 0 ? data.options : null;

  // Register answer collector
  React.useEffect(() => {
    if (!registerAnswerCollector || !data?.id) return;
    
    const getAnswer = () => {
      if (selectedAnswers.length === 0) return null;
      const contentOpts = Array.isArray(data?.content?.data) && data.content.data.length > 0
        ? data.content.data.map((d, idx) => ({ key: d.id || String.fromCharCode(65 + idx), text: d.value }))
        : null;
      const baseOptions = optionsFromApi || contentOpts || ['A','B','C','D'].map((k,i)=>({ key:k, text: ['Vietnam','Thailand','Japan','Malaysia'][i] }));
      const options = baseOptions.map((o, idx) => ({ key: o.key || String.fromCharCode(65 + idx), text: o.text }));
      return { answer: selectedAnswers, questionType: 'MULTIPLE_SELECT', options };
    };
    
    const unregister = registerAnswerCollector(data.id, getAnswer);
    return unregister;
  }, [registerAnswerCollector, data?.id, selectedAnswers]);

  // Register answer restorer (for submittedContent)
  React.useEffect(() => {
    if (!registerAnswerRestorer || !data?.id) return;

    const unregister = registerAnswerRestorer(data.id, (restored) => {
      const contentOpts = Array.isArray(data?.content?.data) && data.content.data.length > 0
        ? data.content.data.map((d, idx) => ({ key: d.id || String.fromCharCode(65 + idx), text: d.value }))
        : null;
      const baseOptions = optionsFromApi || contentOpts || ['A','B','C','D'].map((k,i)=>({ key:k, text: ['Vietnam','Thailand','Japan','Malaysia'][i] }));
      const options = baseOptions.map((o, idx) => ({ key: o.key || String.fromCharCode(65 + idx), text: typeof o.text === 'string' ? o.text.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim() : o.text }));
      if (Array.isArray(restored)) {
        const keys = restored.map(val => {
          const normalized = String(val).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
          const match = options.find(o => o.text === normalized || o.key === normalized);
          return match ? match.key : normalized;
        });
        setSelectedAnswers(keys);
      } else if (typeof restored === 'string' && restored) {
        const normalized = String(restored).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
        const match = options.find(o => o.text === normalized || o.key === normalized);
        setSelectedAnswers([match ? match.key : normalized]);
      }
    });
    return unregister;
  }, [registerAnswerRestorer, data?.id]);

  const toggleAnswer = (key) => {
    if (selectedAnswers.includes(key)) {
      setSelectedAnswers(selectedAnswers.filter(k => k !== key));
    } else {
      setSelectedAnswers([...selectedAnswers, key]);
    }
  };

  return (
    <div
      className={`question-item ${theme}-question-item`}
      style={{
        marginBottom: '24px',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid',
        borderColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        background: theme === 'sun' 
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
        boxShadow: theme === 'sun' 
          ? '0 4px 16px rgba(113, 179, 253, 0.1)'
          : '0 4px 16px rgba(138, 122, 255, 0.12)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div className="question-header" style={{
        paddingBottom: '14px',
        marginBottom: '16px',
        borderBottom: '2px solid',
        borderBottomColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography.Text strong style={{ 
          fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question 2
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          Multiple Select
        </Typography.Text>
      </div>

      {/* Content Area */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        <div 
          className="question-text-content"
          style={{ 
            fontSize: '15px', 
            fontWeight: 350,
            marginBottom: '12px',
            display: 'block',
            lineHeight: '1.8',
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
          }}
          dangerouslySetInnerHTML={{ __html: questionText }}
        />

        {/* Options */}
        <div className="question-options" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '14px', 
          marginTop: '12px' 
        }}>
          {(
            optionsFromApi
              || (Array.isArray(data?.content?.data) && data.content.data.length > 0
                    ? data.content.data.map((d, idx) => ({ key: d.id || String.fromCharCode(65 + idx), text: d.value }))
                    : null)
              || ['A','B','C','D'].map((k,i)=>({ key:k, text: ['Vietnam','Thailand','Japan','Malaysia'][i] }))
          ).map((opt, idx) => {
            const key = opt.key || String.fromCharCode(65 + idx);
            const isSelected = selectedAnswers.includes(key);
            return (
              <div
                key={idx}
                onClick={() => toggleAnswer(key)}
                className={`option-item ${isSelected ? 'selected-answer' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: isSelected
                    ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                    : theme === 'sun'
                      ? 'rgba(255, 255, 255, 0.85)'
                      : 'rgba(255, 255, 255, 0.7)',
                  border: `2px solid ${
                    isSelected
                      ? (theme === 'sun' ? 'rgb(24, 144, 255)' : 'rgb(138, 122, 255)')
                      : theme === 'sun' 
                        ? 'rgba(113, 179, 253, 0.2)' 
                        : 'rgba(138, 122, 255, 0.15)'
                  }`,
                  borderRadius: '12px',
                  boxShadow: theme === 'sun' 
                    ? '0 2px 6px rgba(113, 179, 253, 0.08)'
                    : '0 2px 6px rgba(138, 122, 255, 0.08)',
                  fontSize: '14px',
                  fontWeight: '350',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  minHeight: '50px',
                  boxSizing: 'border-box'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => toggleAnswer(key)}
                  style={{ 
                    width: '18px',
                    height: '18px',
                    accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                    cursor: 'pointer'
                  }} 
                />
                <span style={{ 
                  flexShrink: 0, 
                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                  fontWeight: '600',
                  fontSize: '16px'
                }}>
                  {key}.
                </span>
                <span 
                  className="option-text"
                  style={{ 
                    fontSize: '14px',
                    color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                    fontWeight: '350',
                    flex: 1,
                    lineHeight: '1.6'
                  }}
                  dangerouslySetInnerHTML={{ __html: opt.text || '' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
// True/False Container Component
const TrueFalseContainer = ({ theme, data }) => {
  const registerAnswerCollector = useContext(AnswerCollectionContext);
  const registerAnswerRestorer = useContext(AnswerRestorationContext);
  const [selectedAnswer, setSelectedAnswer] = React.useState(null);
  const questionText = data?.question || data?.questionText || 'The Earth revolves around the Sun.';

  // Normalize options from API: prefer backend ids (e.g., 'opt1', 'opt2')
  const tfOptions = React.useMemo(() => {
    if (Array.isArray(data?.options) && data.options.length > 0) {
      return data.options.map((opt, idx) => ({
        key: opt.key || opt.id || (String(opt.text).toLowerCase() === 'true' ? 'opt1' : 'opt2'),
        text: typeof opt.text === 'string' ? opt.text.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim() : opt.text
      }));
    }
    const contentData = Array.isArray(data?.content?.data) ? data.content.data : [];
    return contentData.map((d) => ({
      key: d.id || (String(d.value).toLowerCase() === 'true' ? 'opt1' : 'opt2'),
      text: typeof d.value === 'string' ? d.value.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim() : d.value
    }));
  }, [data?.options, data?.content?.data]);

  // Register answer collector
  React.useEffect(() => {
    if (!registerAnswerCollector || !data?.id) return;
    
    const getAnswer = () => {
      if (!selectedAnswer) return null;
      // Pass options with backend ids so formatter emits id=opt1/opt2
      const options = tfOptions;
      return { answer: selectedAnswer, questionType: 'TRUE_OR_FALSE', options };
    };
    
    const unregister = registerAnswerCollector(data.id, getAnswer);
    return unregister;
  }, [registerAnswerCollector, data?.id, selectedAnswer, tfOptions]);

  // Register answer restorer (for submittedContent)
  React.useEffect(() => {
    if (!registerAnswerRestorer || !data?.id) return;

    const unregister = registerAnswerRestorer(data.id, (restored) => {
      if (!restored) return;
      // Accept either backend id ('opt1') or text ('True'/'False')
      if (typeof restored === 'string') {
        const normalized = restored.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
        const match = tfOptions.find(o => o.key === normalized || String(o.text).toLowerCase() === normalized.toLowerCase());
        setSelectedAnswer(match ? match.key : normalized);
      }
    });
    return unregister;
  }, [registerAnswerRestorer, data?.id, tfOptions]);

  return (
    <div
      className={`question-item ${theme}-question-item`}
      style={{
        marginBottom: '24px',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid',
        borderColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        background: theme === 'sun' 
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
        boxShadow: theme === 'sun' 
          ? '0 4px 16px rgba(113, 179, 253, 0.1)'
          : '0 4px 16px rgba(138, 122, 255, 0.12)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div className="question-header" style={{
        paddingBottom: '14px',
        marginBottom: '16px',
        borderBottom: '2px solid',
        borderBottomColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography.Text strong style={{ 
            fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question 3
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          True/False
        </Typography.Text>
      </div>

      {/* Content Area */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        <div 
          className="question-text-content"
          style={{ 
            fontSize: '15px', 
            fontWeight: 350,
            marginBottom: '12px',
            display: 'block',
            lineHeight: '1.8',
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
          }}
          dangerouslySetInnerHTML={{ __html: questionText }}
        />

        {/* Options */}
        <div className="question-options" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '14px', 
          marginTop: '12px' 
        }}>
          {tfOptions.map((opt, idx) => {
            const isSelected = selectedAnswer === opt.key;
            return (
              <div
                key={opt.key}
                onClick={() => setSelectedAnswer(opt.key)}
                className={`option-item ${isSelected ? 'selected-answer' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: isSelected
                    ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                    : theme === 'sun'
                      ? 'rgba(255, 255, 255, 0.85)'
                      : 'rgba(255, 255, 255, 0.7)',
                  border: `2px solid ${
                    isSelected
                      ? (theme === 'sun' ? 'rgb(24, 144, 255)' : 'rgb(138, 122, 255)')
                      : theme === 'sun' 
                        ? 'rgba(113, 179, 253, 0.2)' 
                        : 'rgba(138, 122, 255, 0.15)'
                  }`,
                  borderRadius: '12px',
                  boxShadow: theme === 'sun' 
                    ? '0 2px 6px rgba(113, 179, 253, 0.08)'
                    : '0 2px 6px rgba(138, 122, 255, 0.08)',
                  fontSize: '14px',
                  fontWeight: '350',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  minHeight: '50px',
                  boxSizing: 'border-box'
                }}
              >
                <input 
                  type="radio" 
                  name="question-3"
                  checked={isSelected}
                  onChange={() => setSelectedAnswer(opt.key)}
                  style={{ 
                    width: '18px',
                    height: '18px',
                    accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                    cursor: 'pointer'
                  }} 
                />
                <span style={{ 
                  flexShrink: 0, 
                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                  fontWeight: '600',
                  fontSize: '16px'
                }}>
                  {String(opt.text).toLowerCase() === 'true' ? 'A' : 'B'}.
                </span>
                <Typography.Text style={{ 
                  fontSize: '14px',
                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                  fontWeight: '350',
                  flex: 1
                }}>
                  {opt.text}
                </Typography.Text>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
// Dropdown Container Component
const DropdownContainer = ({ theme, data }) => {
  const registerAnswerCollector = useContext(AnswerCollectionContext);
  const registerAnswerRestorer = useContext(AnswerRestorationContext);
  const [selectedAnswers, setSelectedAnswers] = React.useState({});
  const questionText = data?.questionText || data?.question || 'Choose the correct words to complete the sentence:';
  const contentData = Array.isArray(data?.content?.data) ? data.content.data : [];
  
  // Register answer collector
  React.useEffect(() => {
    if (!registerAnswerCollector || !data?.id) return;
    
    const getAnswer = () => {
      // Format dropdown answers with positionId keys
      const formattedAnswers = {};
      Object.keys(selectedAnswers).forEach(posId => {
        formattedAnswers[`${data.id}_pos_${posId}`] = selectedAnswers[posId];
      });
      return Object.keys(formattedAnswers).length > 0 ? { answer: formattedAnswers, questionType: 'DROPDOWN' } : null;
    };
    
    const unregister = registerAnswerCollector(data.id, getAnswer);
    return unregister;
  }, [registerAnswerCollector, data?.id, selectedAnswers]);

  // Register answer restorer (for submittedContent)
  React.useEffect(() => {
    if (!registerAnswerRestorer || !data?.id) return;

    const unregister = registerAnswerRestorer(data.id, (restored) => {
      // restored is an object like { `${qId}_pos_${pos}`: value, ... } or { pos: value }
      if (restored && typeof restored === 'object' && !Array.isArray(restored)) {
        const mapped = {};
        Object.keys(restored).forEach((key) => {
          // Extract position id after '_pos_'
          let pos = key;
          if (key.includes('_pos_')) {
            const parts = key.split('_pos_');
            pos = parts[parts.length - 1];
          }
          if (!String(pos).startsWith('pos_')) {
            pos = `pos_${pos}`;
          }
          mapped[pos] = restored[key];
        });
        setSelectedAnswers(mapped);
      }
    });
    return unregister;
  }, [registerAnswerRestorer, data?.id]);

  const handleDropdownChange = (positionId, value) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [positionId]: value
    }));
  };

  return (
    <div
      className={`question-item ${theme}-question-item`}
      style={{
        marginBottom: '24px',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid',
        borderColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        background: theme === 'sun' 
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
        boxShadow: theme === 'sun' 
          ? '0 4px 16px rgba(113, 179, 253, 0.1)'
          : '0 4px 16px rgba(138, 122, 255, 0.12)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div className="question-header" style={{
        paddingBottom: '14px',
        marginBottom: '16px',
        borderBottom: '2px solid',
        borderBottomColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography.Text strong style={{ 
          fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question {data?.orderNumber || '?'}
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          Dropdown
        </Typography.Text>
      </div>

      {/* Content Area */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        {/* Render question text with dropdowns */}
        <div
          className="question-text-content"
          style={{
          fontSize: '15px', 
          fontWeight: 350,
          lineHeight: '1.8',
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
          marginBottom: '16px'
          }}
        >
          {(() => {
            const text = questionText || data?.questionText || data?.question || '';
            const parts = [];
            const regex = /\[\[pos_(.*?)\]\]/g;
            let lastIndex = 0;
            let match;
            let partIndex = 0;

            while ((match = regex.exec(text)) !== null) {
              // Add text before the placeholder
              if (match.index > lastIndex) {
                const beforeText = text.slice(lastIndex, match.index);
                if (beforeText) {
                  parts.push(
                    <span key={`text-${partIndex++}`} dangerouslySetInnerHTML={{ __html: beforeText }} />
                  );
                }
              }

              // Add dropdown for this position
              const positionIdNum = match[1]; // Extract number from [[pos_1]] -> "1"
              const positionId = `pos_${positionIdNum}`; // Convert to "pos_1" to match data format
              
              // Check if any options have positionId
              const hasPositionIds = contentData.some(it => it.positionId);
              
              // If options have positionId, filter by positionId; otherwise use all options
              const opts = hasPositionIds
                ? contentData
                    .filter(it => {
                      const itPosId = String(it.positionId || '');
                      const matchPosId = String(positionId);
                      return itPosId === matchPosId;
                    })
                    .map(it => it.value || it.text || '')
                    .filter(Boolean)
                : contentData
                    .map(it => it.value || it.text || '')
                    .filter(Boolean);

              parts.push(
                <select
                  key={`select-${partIndex++}`}
                  value={selectedAnswers[positionId] || ''}
                  onChange={(e) => handleDropdownChange(positionId, e.target.value)}
                  style={{
                    display: 'inline-block',
                    minWidth: '120px',
                    height: '32px',
                    padding: '4px 12px',
                    margin: '0 8px',
                    background: theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)',
                    border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'rgb(24, 144, 255)',
                    cursor: 'pointer',
                    outline: 'none',
                    verticalAlign: 'middle',
                    textAlign: 'center',
                    textAlignLast: 'center',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = theme === 'sun' ? '#40a9ff' : '#a78bfa';
                    e.target.style.boxShadow = `0 0 0 2px ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="" disabled hidden style={{ textAlign: 'center' }}>
                    Select
                  </option>
                  {opts.map((opt, idx) => (
                    <option key={idx} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              );

              lastIndex = match.index + match[0].length;
            }

            // Add remaining text after last placeholder
            if (lastIndex < text.length) {
              const afterText = text.slice(lastIndex);
              if (afterText) {
                parts.push(
                  <span key={`text-${partIndex++}`} dangerouslySetInnerHTML={{ __html: afterText }} />
                );
              }
            }

            return parts.length > 0 ? parts : <span dangerouslySetInnerHTML={{ __html: text }} />;
          })()}
        </div>

      </div>
      <style>
        {`
          .dropdown-select option {
            text-align: center;
          }
          .question-text-content select {
            text-align: center;
            text-align-last: center;
          }
          .question-text-content select option {
            text-align: center;
          }
        `}
      </style>
    </div>
  );
};
// Drag and Drop Container Component
const DragDropContainer = ({ theme, data }) => {
  const registerAnswerCollector = useContext(AnswerCollectionContext);
  const registerAnswerRestorer = useContext(AnswerRestorationContext);
  const [droppedItems, setDroppedItems] = React.useState({});
  // Use ALL values from API (including duplicates) as draggable options; fallback to a simple list
  const [availableItems, setAvailableItems] = React.useState(() => {
    const all = (data?.content?.data || []).map(it => it?.value).filter(Boolean);
    return all.length ? all : ['love', 'like', 'enjoy', 'hate'];
  });
  const [dragOverPosition, setDragOverPosition] = React.useState(null);

  // Register answer collector
  React.useEffect(() => {
    if (!registerAnswerCollector || !data?.id) return;
    
    const getAnswer = () => {
      return Object.keys(droppedItems).length > 0 ? { answer: droppedItems, questionType: 'DRAG_AND_DROP' } : null;
    };
    
    const unregister = registerAnswerCollector(data.id, getAnswer);
    return unregister;
  }, [registerAnswerCollector, data?.id, droppedItems]);

  // Register answer restorer (for submittedContent)
  React.useEffect(() => {
    if (!registerAnswerRestorer || !data?.id) return;

    const unregister = registerAnswerRestorer(data.id, (restored) => {
      // restored is an object mapping position -> value; normalize keys to 'pos_*'
      if (restored && typeof restored === 'object' && !Array.isArray(restored)) {
        const normalized = {};
        Object.keys(restored).forEach((k) => {
          const key = String(k).startsWith('pos_') ? String(k) : `pos_${k}`;
          normalized[key] = restored[k];
        });
        setDroppedItems(normalized);
        // Rebuild available items by removing dropped ones from the pool
        const all = (data?.content?.data || []).map(it => it?.value).filter(Boolean);
        const pool = all.length ? all : ['love', 'like', 'enjoy', 'hate'];
        const remaining = pool.filter(v => !Object.values(normalized).includes(v));
        setAvailableItems(remaining);
      }
    });
    return unregister;
  }, [registerAnswerRestorer, data?.id, data?.content?.data]);

  const handleDragStart = (e, item, isDropped = false, positionId = null) => {
    e.dataTransfer.setData('text/plain', item);
    e.dataTransfer.setData('isDropped', isDropped);
    e.dataTransfer.setData('positionId', positionId || '');
  };

  const handleDrop = (e, positionId) => {
    e.preventDefault();
    setDragOverPosition(null);
    const item = e.dataTransfer.getData('text/plain');
    const isDropped = e.dataTransfer.getData('isDropped') === 'true';
    const fromPositionId = e.dataTransfer.getData('positionId');
    
    setDroppedItems(prev => {
      const newItems = { ...prev };
      const currentItem = newItems[positionId];
      
      if (fromPositionId && fromPositionId !== positionId) {
        newItems[positionId] = item;
        if (fromPositionId in newItems) {
          delete newItems[fromPositionId];
        }
        if (currentItem) {
          setAvailableItems(prev => [...prev, currentItem]);
        }
        return newItems;
      }
      
      if (!isDropped) {
        newItems[positionId] = item;
        setAvailableItems(prev => {
          const idx = prev.indexOf(item);
          if (idx === -1) return prev; // safety
          const copy = [...prev];
          copy.splice(idx, 1);
          return copy;
        });
      }
      
      return newItems;
    });
  };

  const handleDragStartFromDropped = (e, item, positionId) => {
    handleDragStart(e, item, true, positionId);
    setDroppedItems(prev => {
      const newItems = { ...prev };
      delete newItems[positionId];
      return newItems;
    });
    setAvailableItems(prev => [...prev, item]);
  };

  const handleDragOver = (e, positionId) => {
    e.preventDefault();
    setDragOverPosition(positionId);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverPosition(null);
    }
  };

  // Parse questionText from API to create dynamic sentence with placeholders
  const questionText = data?.questionText || data?.question || '';
  const parts = React.useMemo(() => {
    const result = [];
    const regex = /\[\[pos_(.*?)\]\]/g;
    let last = 0; let match; let idx = 0;
    while ((match = regex.exec(questionText)) !== null) {
      if (match.index > last) result.push({ type: 'text', content: questionText.slice(last, match.index) });
      const posId = match[1];
      result.push({ type: 'position', positionId: `pos_${posId}`, index: idx++ });
      last = match.index + match[0].length;
    }
    if (last < questionText.length) result.push({ type: 'text', content: questionText.slice(last) });
    return result;
  }, [questionText]);

  return (
    <div
      className={`question-item ${theme}-question-item`}
      style={{
        marginBottom: '24px',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid',
        borderColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        background: theme === 'sun' 
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
        boxShadow: theme === 'sun' 
          ? '0 4px 16px rgba(113, 179, 253, 0.1)'
          : '0 4px 16px rgba(138, 122, 255, 0.12)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div className="question-header" style={{
        paddingBottom: '14px',
        marginBottom: '16px',
        borderBottom: '2px solid',
        borderBottomColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography.Text strong style={{ 
          fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question 6
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          Drag and Drop
        </Typography.Text>
      </div>

      {/* Content Area */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        <Typography.Text style={{ 
          fontSize: '15px', 
          fontWeight: 350,
          marginBottom: '12px',
          display: 'block',
          lineHeight: '1.8',
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
        }}>
          Complete the sentence by dragging words into the blanks:
        </Typography.Text>

        {/* Two Column Layout */}
        <div style={{ display: 'flex', gap: '24px', minHeight: '300px' }}>
          {/* Left Column - Question with drop zones */}
          <div style={{
            flex: '1',
            padding: '20px',
            background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
          }}>
            <div 
              className="question-text-content"
              style={{ 
                fontSize: '15px', 
                fontWeight: 350,
                lineHeight: '1.8',
                color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                marginBottom: '16px'
              }}
            >
              {parts.length > 0 ? (
                parts.map((part, pIdx) => (
                  <React.Fragment key={pIdx}>
                    {part.type === 'text' ? (
                      <span dangerouslySetInnerHTML={{ __html: part.content || '' }} />
                    ) : (
                      droppedItems[part.positionId] ? (
                        <div
                          draggable
                          onDragStart={(e) => handleDragStartFromDropped(e, droppedItems[part.positionId], part.positionId)}
                          style={{
                            minWidth: '120px',
                            height: '32px',
                            margin: '0 8px',
                            background: theme === 'sun' ? 'rgba(24, 144, 255, 0.15)' : 'rgba(138, 122, 255, 0.18)',
                            border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                            borderRadius: '8px',
                            display: 'inline-block',
                            padding: '4px 12px',
                            fontSize: '15px',
                            fontWeight: '350',
                            color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                            cursor: 'grab',
                            transition: 'all 0.2s ease',
                            verticalAlign: 'top',
                            lineHeight: '1.4',
                            boxSizing: 'border-box',
                            textAlign: 'center'
                          }}
                          dangerouslySetInnerHTML={{ __html: droppedItems[part.positionId] || '' }}
                        />
                      ) : (
                        <div
                          onDrop={(e) => handleDrop(e, part.positionId)}
                          onDragOver={(e) => handleDragOver(e, part.positionId)}
                          onDragLeave={handleDragLeave}
                          style={{
                            minWidth: '120px',
                            height: '32px',
                            margin: '0 8px',
                            background: dragOverPosition === part.positionId 
                              ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.25)')
                              : '#ffffff',
                            border: `2px ${dragOverPosition === part.positionId ? 'solid' : 'dashed'} ${dragOverPosition === part.positionId ? (theme === 'sun' ? '#1890ff' : '#8B5CF6') : 'rgba(0, 0, 0, 0.5)'}`,
                            borderRadius: '8px',
                            display: 'inline-block',
                            padding: '4px 12px',
                            fontSize: '15px',
                            fontWeight: '350',
                            color: dragOverPosition === part.positionId ? (theme === 'sun' ? '#1890ff' : '#8B5CF6') : 'rgba(0, 0, 0, 0.5)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            verticalAlign: 'top',
                            lineHeight: '1.4',
                            boxSizing: 'border-box',
                            textAlign: 'center',
                            transform: dragOverPosition === part.positionId ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: dragOverPosition === part.positionId 
                              ? (theme === 'sun' ? '0 4px 12px rgba(24, 144, 255, 0.3)' : '0 4px 12px rgba(138, 122, 255, 0.3)')
                              : 'none'
                          }}
                        >
                          {dragOverPosition === part.positionId ? 'Drop here!' : 'Drop here'}
                        </div>
                      )
                    )}
                  </React.Fragment>
                ))
              ) : null}
            </div>
          </div>

          {/* Right Column - Available words for dragging */}
          <div style={{
            flex: '1',
            padding: '20px',
            background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
          }}>
            <Typography.Text style={{ 
              fontSize: '14px', 
              fontWeight: 350,
              marginBottom: '16px',
              display: 'block',
              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
            }}>
              Drag these words to complete the sentence:
            </Typography.Text>
            
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '120px'
            }}>
              {availableItems.map((item, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  style={{
                    padding: '12px 20px',
                    background: theme === 'sun' 
                      ? 'rgba(24, 144, 255, 0.08)' 
                      : 'rgba(138, 122, 255, 0.12)',
                    border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                    cursor: 'grab',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                    minWidth: '80px',
                    textAlign: 'center',
                    boxShadow: theme === 'sun' 
                      ? '0 2px 8px rgba(24, 144, 255, 0.15)' 
                      : '0 2px 8px rgba(138, 122, 255, 0.15)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = theme === 'sun' 
                      ? '0 4px 12px rgba(24, 144, 255, 0.25)' 
                      : '0 4px 12px rgba(138, 122, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = theme === 'sun' 
                      ? '0 2px 8px rgba(24, 144, 255, 0.15)' 
                      : '0 2px 8px rgba(138, 122, 255, 0.15)';
                  }}
                  dangerouslySetInnerHTML={{ __html: item || '' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
// Reorder Container Component
const ReorderContainer = ({ theme, data }) => {
  const registerAnswerCollector = useContext(AnswerCollectionContext);
  const registerAnswerRestorer = useContext(AnswerRestorationContext);
  const [sourceItems, setSourceItems] = React.useState(() => {
    const words = (data?.content?.data || [])
      .map(it => it.value)
      .filter(Boolean);
    return words.length ? words : ['I','love','programming','very','much'];
  });
  const [droppedItems, setDroppedItems] = React.useState({});
  const [dragOverIndex, setDragOverIndex] = React.useState(null);
  const [draggedItem, setDraggedItem] = React.useState(null);
  const [isDraggingFromSource, setIsDraggingFromSource] = React.useState(false);
  const [wasDropped, setWasDropped] = React.useState(false);

  // Register answer collector
  React.useEffect(() => {
    if (!registerAnswerCollector || !data?.id) return;
    
    const getAnswer = () => {
      // Get items in order from droppedItems (support sparse indices)
      const indexKeys = Object.keys(droppedItems)
        .map(k => parseInt(k, 10))
        .filter(i => !Number.isNaN(i))
        .sort((a, b) => a - b);
      const orderedItems = indexKeys
        .map(i => droppedItems[i])
        .filter(v => v !== undefined && v !== null && String(v).trim() !== '');
      if (orderedItems.length === 0) return null;
      const options = (data?.content?.data || []).map((d, idx) => ({ key: d.id || String.fromCharCode(65 + idx), text: d.value }));
      return { answer: orderedItems, questionType: 'REORDER', options };
    };
    
    const unregister = registerAnswerCollector(data.id, getAnswer);
    return unregister;
  }, [registerAnswerCollector, data?.id, droppedItems]);

  // Register answer restorer (for submittedContent)
  React.useEffect(() => {
    if (!registerAnswerRestorer || !data?.id) return;

    const unregister = registerAnswerRestorer(data.id, (restored) => {
      if (Array.isArray(restored)) {
        const mapping = {};
        restored.forEach((val, idx) => { mapping[idx] = val; });
        setDroppedItems(mapping);
        // Remove restored items from source list
        const words = (data?.content?.data || []).map(it => it?.value).filter(Boolean);
        const pool = words.length ? words : ['I','love','programming','very','much'];
        const remaining = pool.filter(v => !restored.includes(v));
        setSourceItems(remaining);
      }
    });
    return unregister;
  }, [registerAnswerRestorer, data?.id, data?.content?.data]);
  const numSlots = React.useMemo(() => {
    const countFromData = (data?.content?.data || [])
      .map(it => it.value)
      .filter(Boolean).length;
    const base = countFromData || sourceItems.length || 0;
    const ensureAtLeastDropped = Math.max(base, Object.keys(droppedItems).length);
    return ensureAtLeastDropped;
  }, [data, sourceItems.length, droppedItems]);

  const handleDragStartFromSource = (e, item) => {
    setDraggedItem(item);
    setIsDraggingFromSource(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStartFromSlot = (e, index) => {
    const item = droppedItems[index];
    setDraggedItem(item);
    setIsDraggingFromSource(false);
    setWasDropped(false);
    setDragOverIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnSlot = (e, index) => {
    e.preventDefault();
    setWasDropped(true);
    setDragOverIndex(null);
    
    if (draggedItem) {
      const currentItem = droppedItems[index];
      
      // If there's already an item in this slot, return it to source
      if (currentItem) {
        setSourceItems(prev => [...prev, currentItem]);
      }
      
      // If moving from another slot, clear the old slot first
      if (!isDraggingFromSource) {
        const oldIndex = Object.keys(droppedItems).find(i => droppedItems[i] === draggedItem && parseInt(i) !== index);
        if (oldIndex !== undefined) {
          setDroppedItems(prev => {
            const newItems = { ...prev };
            delete newItems[parseInt(oldIndex)];
            return newItems;
          });
        }
      } else {
        // Remove only one occurrence from source to preserve duplicates
        setSourceItems(prev => {
          const arr = [...prev];
          const idx = arr.findIndex(item => item === draggedItem);
          if (idx !== -1) arr.splice(idx, 1);
          return arr;
        });
      }
      
      // Place the new item in the slot
      setDroppedItems(prev => ({
        ...prev,
        [index]: draggedItem
      }));
    }
    
    setDraggedItem(null);
    setIsDraggingFromSource(false);
  };

  const handleDragOverSlot = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeaveSlot = () => {
    setDragOverIndex(null);
  };

  const handleDragEnd = (e) => {
    // If we're dragging from a slot (not from source) and not dropped in a slot or source area,
    // return the item to source
    if (draggedItem && !isDraggingFromSource && !wasDropped) {
      // Return item back to source without deduping to preserve duplicates
      setSourceItems(prev => [...prev, draggedItem]);
      
      // Remove from the slot
      const oldIndex = Object.keys(droppedItems).find(i => droppedItems[i] === draggedItem);
      if (oldIndex !== undefined) {
        setDroppedItems(prev => {
          const newItems = { ...prev };
          delete newItems[oldIndex];
          return newItems;
        });
      }
    }
    
    setDraggedItem(null);
    setIsDraggingFromSource(false);
    setDragOverIndex(null);
    setWasDropped(false);
  };

  return (
    <div
      className={`question-item ${theme}-question-item`}
            style={{
        marginBottom: '24px',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid',
        borderColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
              background: theme === 'sun' 
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
        boxShadow: theme === 'sun' 
          ? '0 4px 16px rgba(113, 179, 253, 0.1)'
          : '0 4px 16px rgba(138, 122, 255, 0.12)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div className="question-header" style={{
        paddingBottom: '14px',
        marginBottom: '16px',
        borderBottom: '2px solid',
        borderBottomColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography.Text strong style={{ 
          fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question 7
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          Reorder
        </Typography.Text>
      </div>

      {/* Content Area */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        <Typography.Text style={{ 
          fontSize: '15px', 
          fontWeight: 350,
          marginBottom: '16px',
          display: 'block',
          lineHeight: '1.8',
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
        }}>
          Rearrange the words by dragging them into the correct order:
        </Typography.Text>

        {/* Slots Row */}
        <div style={{
          marginBottom: '24px',
          padding: '20px',
          background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
        }}>
          <Typography.Text style={{ 
            fontSize: '14px', 
            fontWeight: 350,
            marginBottom: '16px',
            display: 'block',
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
          }}>
            Drop the words here in order:
          </Typography.Text>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {Array.from({ length: numSlots }).map((_, index) => (
              <div
                key={index}
                onDrop={(e) => handleDropOnSlot(e, index)}
                onDragOver={(e) => handleDragOverSlot(e, index)}
                onDragLeave={handleDragLeaveSlot}
                onDragEnd={handleDragEnd}
                style={{
                  minWidth: '100px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: droppedItems[index] 
                    ? `1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.3)' : 'rgba(138, 122, 255, 0.3)'}` // Lighter border when item is present
                    : dragOverIndex === index 
                      ? `3px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}` // Solid border when dragging over
                      : `2px dashed rgba(0, 0, 0, 0.5)`, // Dashed border when empty - gray
                  borderRadius: '8px',
                  background: droppedItems[index]
                    ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)') // Different background when item is present
                    : dragOverIndex === index
                      ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.15)' : 'rgba(138, 122, 255, 0.15)')
                      : '#ffffff', // White background when empty
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  transform: dragOverIndex === index ? 'scale(1.05)' : 'scale(1)',
                  cursor: 'pointer'
                }}
              >
                {droppedItems[index] ? (
                  <div
                    draggable
                    onDragStart={(e) => handleDragStartFromSlot(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'grab',
                      userSelect: 'none'
                    }}
                  >
                    <span style={{ 
                      fontSize: '14px',
                      fontWeight: '600',
                      color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                      textAlign: 'center'
                    }}>
                      {droppedItems[index]}
                    </span>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'rgba(0, 0, 0, 0.5)'
                    }}>
                      {index + 1}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Source Words */}
        <div
          onDrop={(e) => {
            e.preventDefault();
            setWasDropped(true);
            // If dropping from slot back to source
            if (draggedItem && !isDraggingFromSource) {
              // Return item back to source without deduping to preserve duplicates
              setSourceItems(prev => [...prev, draggedItem]);
              // Remove from slot
              const oldIndex = Object.keys(droppedItems).find(i => droppedItems[i] === draggedItem);
              if (oldIndex) {
                setDroppedItems(prev => {
                  const newItems = { ...prev };
                  delete newItems[oldIndex];
                  return newItems;
                });
              }
              setDraggedItem(null);
              setIsDraggingFromSource(false);
              setDragOverIndex(null);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          style={{
            padding: '20px',
            background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
          }}
        >
          <Typography.Text style={{ 
            fontSize: '14px', 
            fontWeight: 350,
            marginBottom: '16px',
            display: 'block',
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
          }}>
            Drag these words to the slots above:
          </Typography.Text>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {sourceItems.map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                draggable
                onDragStart={(e) => handleDragStartFromSource(e, item)}
                onDragEnd={handleDragEnd}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '10px 18px',
                  background: theme === 'sun' 
                    ? 'rgba(24, 144, 255, 0.08)' 
                    : 'rgba(138, 122, 255, 0.12)',
                  border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                  cursor: 'grab',
                  userSelect: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: theme === 'sun' 
                    ? '0 2px 8px rgba(24, 144, 255, 0.15)' 
                    : '0 2px 8px rgba(138, 122, 255, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = theme === 'sun' 
                    ? '0 4px 12px rgba(24, 144, 255, 0.25)' 
                    : '0 4px 12px rgba(138, 122, 255, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = theme === 'sun' 
                    ? '0 2px 8px rgba(24, 144, 255, 0.15)' 
                    : '0 2px 8px rgba(138, 122, 255, 0.15)';
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
// Rewrite Container Component
const RewriteContainer = ({ theme, data }) => {
  const registerAnswerCollector = useContext(AnswerCollectionContext);
  const registerAnswerRestorer = useContext(AnswerRestorationContext);
  const [answer, setAnswer] = React.useState('');
  // Remove placeholder tokens but keep HTML formatting
  const questionText = (data?.questionText || data?.question || 'Rewrite the following sentence using different words:')
    .replace(/\[\[pos_.*?\]\]/g, '');

  // Register answer collector
  React.useEffect(() => {
    if (!registerAnswerCollector || !data?.id) return;
    
    const getAnswer = () => {
      return answer ? { answer: answer, questionType: 'REWRITE' } : null;
    };
    
    const unregister = registerAnswerCollector(data.id, getAnswer);
    return unregister;
  }, [registerAnswerCollector, data?.id, answer]);

  // Register answer restorer (for submittedContent)
  React.useEffect(() => {
    if (!registerAnswerRestorer || !data?.id) return;

    const unregister = registerAnswerRestorer(data.id, (restored) => {
      if (typeof restored === 'string') {
        setAnswer(restored);
      } else if (restored && typeof restored === 'object' && !Array.isArray(restored)) {
        // Concatenate parts in position order if provided as object
        const parts = Object.keys(restored)
          .map(k => ({ k, v: restored[k] }))
          .sort((a, b) => {
            const pa = parseInt(String(a.k).split('_').pop(), 10);
            const pb = parseInt(String(b.k).split('_').pop(), 10);
            return (isNaN(pa) ? 0 : pa) - (isNaN(pb) ? 0 : pb);
          })
          .map(x => x.v)
          .filter(Boolean);
        if (parts.length) setAnswer(parts.join(' '));
      }
    });
    return unregister;
  }, [registerAnswerRestorer, data?.id]);

  return (
    <div
      className={`question-item ${theme}-question-item`}
      style={{
        marginBottom: '24px',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid',
        borderColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        background: theme === 'sun' 
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
        boxShadow: theme === 'sun' 
          ? '0 4px 16px rgba(113, 179, 253, 0.1)'
          : '0 4px 16px rgba(138, 122, 255, 0.12)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div className="question-header" style={{
        paddingBottom: '14px',
        marginBottom: '16px',
        borderBottom: '2px solid',
        borderBottomColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography.Text strong style={{ 
          fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question 8
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          Rewrite
        </Typography.Text>
      </div>

      {/* Content Area */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        <div 
          className="question-text-content"
          style={{ 
            fontSize: '15px', 
            fontWeight: 350,
            marginBottom: '16px',
            display: 'block',
            lineHeight: '1.8',
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
          }}
          dangerouslySetInnerHTML={{ __html: questionText }}
        />

        {/* Only show the question sentence for rewrite */}

        {/* Answer textarea */}
        <div style={{ marginTop: '20px' }}>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your rewritten sentence here..."
            rows={4}
            style={{
              width: '100%',
              fontSize: '14px',
              padding: '12px 16px',
              resize: 'vertical',
              border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
              borderRadius: '8px',
              backgroundColor: theme === 'sun' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.85)',
              color: theme === 'sun' ? '#000000' : '#FFFFFF',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
          />
        </div>
      </div>
    </div>
  );
};


// Fill in the Blank Container Component
const FillBlankContainer = ({ theme, data }) => {
  const registerAnswerCollector = useContext(AnswerCollectionContext);
  const registerAnswerRestorer = useContext(AnswerRestorationContext);
  const [blankAnswers, setBlankAnswers] = React.useState({});
  const questionText = data?.questionText || data?.question || 'Fill in the blanks';
  
  // Register answer collector
  React.useEffect(() => {
    if (!registerAnswerCollector || !data?.id) return;
    
    const getAnswer = () => {
      // Format blank answers with positionId keys
      const formattedAnswers = {};
      Object.keys(blankAnswers).forEach(posId => {
        const value = blankAnswers[posId];
        // Include even empty strings, but trim to check if really empty
        if (value !== null && value !== undefined && String(value).trim() !== '') {
          formattedAnswers[`${data.id}_pos_${posId}`] = String(value).trim();
        }
      });
      // Always return answer object, even if empty, so the question is tracked
      const result = { answer: formattedAnswers, questionType: 'FILL_BLANK' };
      return result;
    };
    
    const unregister = registerAnswerCollector(data.id, getAnswer);
    return unregister;
  }, [registerAnswerCollector, data?.id, blankAnswers]);

  // Register answer restorer (for submittedContent)
  React.useEffect(() => {
    if (!registerAnswerRestorer || !data?.id) return;

    const unregister = registerAnswerRestorer(data.id, (restored) => {
      if (restored && typeof restored === 'object' && !Array.isArray(restored)) {
        const mapped = {};
        Object.keys(restored).forEach((key) => {
          let pos = key;
          if (key.includes('_pos_')) {
            const parts = key.split('_pos_');
            pos = parts[parts.length - 1];
          }
          mapped[pos] = restored[key];
        });
        setBlankAnswers(mapped);
      } else if (typeof restored === 'string' && restored) {
        setBlankAnswers({ default: restored });
      }
    });
    return unregister;
  }, [registerAnswerRestorer, data?.id]);
  
  // Parse questionText and render editable spans where [[pos_x]] appears
  const renderWithInputs = () => {
    const elements = [];
    const regex = /(\[\[pos_(.*?)\]\])/g;
    let lastIndex = 0;
    let match;
    let inputIndex = 0;
    while ((match = regex.exec(questionText)) !== null) {
      if (match.index > lastIndex) {
        const textContent = questionText.slice(lastIndex, match.index);
        elements.push(
          <span 
            key={`text_${inputIndex}`}
            className="question-text-content"
            dangerouslySetInnerHTML={{ __html: textContent }}
          />
        );
      }
      inputIndex += 1;
      const positionId = match[2];
      elements.push(
        <input
          key={`fill_blank_input_${data.id}_${positionId}`}
          className="paragraph-input"
          value={blankAnswers[positionId] || ''}
          onChange={(e) => {
            const text = e.target.value || '';
            setBlankAnswers(prev => ({
              ...prev,
              [positionId]: text
            }));
          }}
          onBlur={(e) => {
            const text = e.target.value || '';
            setBlankAnswers(prev => ({
              ...prev,
              [positionId]: text
            }));
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '120px',
            maxWidth: '200px',
            height: '32px',
            padding: '4px 12px',
            margin: '0 8px',
            background: '#E9EEFF94',
            border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
            borderRadius: '8px',
            outline: 'none',
            verticalAlign: 'middle',
            lineHeight: '1.4',
            fontSize: '14px',
            boxSizing: 'border-box',
            textAlign: 'center'
          }}
        />
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < questionText.length) {
      const textContent = questionText.slice(lastIndex);
      elements.push(
        <span 
          key={`text_final`}
          className="question-text-content"
          dangerouslySetInnerHTML={{ __html: textContent }}
        />
      );
    }
    return elements;
  };

  return (
    <div
      className={`question-item ${theme}-question-item`}
      style={{
        marginBottom: '24px',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid',
        borderColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        background: theme === 'sun' 
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
        boxShadow: theme === 'sun' 
          ? '0 4px 16px rgba(113, 179, 253, 0.1)'
          : '0 4px 16px rgba(138, 122, 255, 0.12)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div className="question-header" style={{
        paddingBottom: '14px',
        marginBottom: '16px',
        borderBottom: '2px solid',
        borderBottomColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography.Text strong style={{ 
          fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question 4
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          Fill in the Blank
        </Typography.Text>
      </div>

      {/* Content Area - Fill in the blank question */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        {/* Question Content - render blanks for [[pos_]] tokens */}
        <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 350, lineHeight: '1.8', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
          {renderWithInputs()}
        </div>
      </div>
    </div>
  );
};
// Generate fake data based on challenge type
// Transform API response data to component format
const transformApiDataToComponentFormat = (apiResponse, challengeType) => {
  const questions = [];
  const readingSections = [];
  const listeningSections = [];
  const writingSections = [];
  const speakingSections = [];

  if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data)) {
    return { questions, readingSections, listeningSections, writingSections, speakingSections };
  }

  apiResponse.data.forEach((item) => {
    const section = item.section || {};
    const sectionQuestions = item.questions || [];

    if (sectionQuestions.length === 0) return;

    // Helper function to transform options from {id, value} to {key, text}
    const transformOptions = (contentData, questionType) => {
      if (!Array.isArray(contentData) || contentData.length === 0) return [];
      
      // For TRUE_OR_FALSE, convert {id, value} to {key, text} format
      if (questionType === 'TRUE_OR_FALSE') {
        return contentData.map(opt => ({
          key: opt.id || (opt.value === 'True' ? 'A' : 'B'),
          text: opt.value || ''
        }));
      }
      
      // For other types, convert {id, value} to {key, text} format
      return contentData.map(opt => ({
        key: opt.id || opt.key || String.fromCharCode(65 + contentData.indexOf(opt)),
        text: opt.value || opt.text || ''
      }));
    };

    // Check questionType and resourceType to determine section type
    const firstQuestionType = sectionQuestions?.[0]?.questionType || '';
    const resourceType = section.resourceType || '';
    const sectionTitle = (section.sectionTitle || '').toLowerCase();
    const hasAudioUrl = section.sectionsUrl && section.sectionsUrl.trim() !== '';
    const isAudioFile = hasAudioUrl && (section.sectionsUrl.match(/\.(mp3|wav|ogg|m4a|aac)$/i));
    
    // Determine if this is a Listening section
    const isListeningSection = 
      firstQuestionType === 'LISTENING' || 
      resourceType === 'AUDIO' || 
      (resourceType === 'FILE' && isAudioFile) ||
      sectionTitle.includes('listening');
    
    // Determine if this is a Reading section
    const isReadingSection = 
      firstQuestionType === 'READING' || 
      (resourceType === 'DOCUMENT' && !isListeningSection);
    
    if (firstQuestionType === 'WRITING') {
      // Writing section
      sectionQuestions.forEach((q) => {
        writingSections.push({
          id: q.id,
          type: 'WRITING_SECTION',
          title: section.sectionTitle || 'Writing Section',
          prompt: q.questionText || section.sectionsContent || '',
          questionText: q.questionText || section.sectionsContent || '',
          wordLimit: null,
          timeLimit: null,
          points: null,
          orderNumber: q.orderNumber || section.orderNumber || 0,
        });
      });
    } else if (firstQuestionType === 'SPEAKING') {
      // Speaking section - ensure id is the real questionId
      sectionQuestions.forEach((q) => {
        const hasAudio = section.sectionsUrl && section.sectionsUrl.trim() !== '';
        speakingSections.push({
          id: q.id,
          type: hasAudio ? 'SPEAKING_WITH_AUDIO_SECTION' : 'SPEAKING_SECTION',
          title: section.sectionTitle || 'Speaking Section',
          prompt: q.questionText || section.sectionsContent || '',
          points: null,
          audioUrl: hasAudio ? section.sectionsUrl : null,
          transcript: section.sectionsContent || '',
          orderNumber: q.orderNumber || section.orderNumber || 0,
        });
      });
    } else if (isListeningSection) {
      // Listening section
      listeningSections.push({
        id: section.id,
        type: 'LISTENING_SECTION',
        title: section.sectionTitle || 'Listening Section',
        audioUrl: section.sectionsUrl || '',
        duration: null,
        transcript: section.sectionsContent || '',
        questions: sectionQuestions.map(q => ({
          id: q.id,
          type: q.questionType,
          questionText: q.questionText || '',
          question: q.questionText || '',
          options: transformOptions(q.content?.data, q.questionType),
          content: q.content || { data: [] },
          points: null,
          orderNumber: q.orderNumber || 0,
        })),
        points: null,
        orderNumber: section.orderNumber || 0,
      });
    } else if (isReadingSection) {
      // Reading section
      readingSections.push({
        id: section.id,
        type: 'SECTION',
        title: section.sectionTitle || 'Reading Section',
        passage: section.sectionsContent || '',
        questions: sectionQuestions.map(q => ({
          id: q.id,
          type: q.questionType,
          questionText: q.questionText || '',
          question: q.questionText || '',
          options: transformOptions(q.content?.data, q.questionType),
          content: q.content || { data: [] },
          points: null,
          orderNumber: q.orderNumber || 0,
        })),
        points: null,
        orderNumber: section.orderNumber || 0,
      });
    } else {
      // Individual questions (GV type) - add to questions array
      sectionQuestions.forEach((q) => {
        questions.push({
          id: q.id,
          type: q.questionType,
          questionText: q.questionText || '',
          question: q.questionText || '',
          options: transformOptions(q.content?.data, q.questionType),
          content: q.content || { data: [] },
          points: null,
          orderNumber: q.orderNumber || 0,
        });
      });
    }
  });

  // Sort sections and questions by orderNumber
  const sortByOrder = (a, b) => (a.orderNumber || 0) - (b.orderNumber || 0);
  readingSections.sort(sortByOrder);
  listeningSections.sort(sortByOrder);
  writingSections.sort(sortByOrder);
  speakingSections.sort(sortByOrder);
  questions.sort(sortByOrder);

  return { questions, readingSections, listeningSections, writingSections, speakingSections };
};
const StudentDailyChallengeTake = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { theme } = useTheme();
  const userRole = useSelector((state) => state.auth?.user?.role);
  const isTestTaker = userRole === 'test_taker' || userRole === 'TEST_TAKER';
  const routePrefix = isTestTaker ? '/test-taker' : '/student';
  
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [readingSections, setReadingSections] = useState([]);
  const [listeningSections, setListeningSections] = useState([]);
  const [writingSections, setWritingSections] = useState([]);
  const [speakingSections, setSpeakingSections] = useState([]);
  const [challengeType, setChallengeType] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [challengeInfo, setChallengeInfo] = useState({
    challengeName: location.state?.challengeName || 'Daily Challenge',
    className: location.state?.lessonName || null,
  });
  const questionRefs = useRef({});
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [submitConfirmLoading, setSubmitConfirmLoading] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  
  // Auto-save UI state
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'idle' | 'saving' | 'saved'
  // Removed immediate localStorage hooks due to input side-effects
  
  // Section scores - store scores for each section
  const [sectionScores, setSectionScores] = useState({});
  
  // Answer collection system: store answer getter functions from child components
  const answerCollectorsRef = useRef(new Map());
  // Answer restoration system: store answer setter functions from child components
  const answerRestorersRef = useRef(new Map());
  // Map questionId -> original content.data (for id lookup when formatting answers)
  const contentDataByQuestionIdRef = useRef(new Map());
  // Map questionId -> array of positionIds in order of appearance in questionText ([[pos_xxx]]...)
  const positionIdsByQuestionIdRef = useRef(new Map());
  
  // Timer state (only enabled if backend provides challengeDuration)
  const [isTimedChallenge, setIsTimedChallenge] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const deadlineTsRef = useRef(null); // absolute deadline timestamp (ms)
  const autoSubmitTriggeredRef = useRef(false);
  const [timeUpModalVisible, setTimeUpModalVisible] = useState(false);

  // Anti-cheat security state
  const [violationWarningModalVisible, setViolationWarningModalVisible] = useState(false);
  const [violationWarningData, setViolationWarningData] = useState(null);
  const violationCountRef = useRef(new Map()); // Track violation count per type: { 'tab_switch': 1, 'copy': 0, ... }
  const pendingLogsRef = useRef([]); // Store logs that need to be sent to backend
  const [isAntiCheatEnabled, setIsAntiCheatEnabled] = useState(false);
  const [allowTranslateOnScreen, setAllowTranslateOnScreen] = useState(false);
  const [allowShuffleQuestions, setAllowShuffleQuestions] = useState(false);
  
  usePageTitle('Daily Challenge - Take Challenge');
  
  // Transform draft API response (sectionDetails format) to sections format
  const transformDraftResponseToSectionsFormat = (draftResponse, challengeType) => {
    if (!draftResponse) {
      console.warn('⚠️ Draft response is undefined');
      return null;
    }
    
    if (!draftResponse.data) {
      console.warn('⚠️ Draft response missing data:', draftResponse);
      return null;
    }
    
    if (!draftResponse.data.sectionDetails) {
      console.warn('⚠️ Draft response missing sectionDetails:', draftResponse.data);
      return null;
    }

    const sectionDetails = draftResponse.data.sectionDetails;
    
    if (!Array.isArray(sectionDetails)) {
      console.warn('⚠️ sectionDetails is not an array:', sectionDetails);
      return null;
    }
    
    const transformedSections = [];

    sectionDetails.forEach((sectionDetail) => {
      if (!sectionDetail) {
        console.warn('⚠️ Section detail is undefined');
        return;
      }
      
      const { section, questionResults, questions } = sectionDetail;
      
      if (!section) {
        console.warn('⚠️ Section is undefined in sectionDetail:', sectionDetail);
        return;
      }
      
      // Draft API returns 'questions', Result API returns 'questionResults'
      // Handle both formats
      const questionDataList = questionResults || questions;
      
      if (!questionDataList) {
        console.warn('⚠️ Section missing both questionResults and questions:', sectionDetail);
        return;
      }
      
      if (!Array.isArray(questionDataList)) {
        console.warn('⚠️ questionResults/questions is not an array:', questionDataList);
        return;
      }

      const transformedQuestions = questionDataList.map((qr) => {
        // Handle both question object structure and direct question data
        // For draft API: qr = {question: {...}, submittedContent: {...}}
        // For result API: qr = {questionId, question: {...}, submittedContent: {...}}
        const questionData = qr.question || qr;
        
        return {
          id: qr.questionId || questionData.id,
          questionType: qr.questionType || questionData.questionType,
          questionText: questionData.questionText || qr.questionText || '',
          content: questionData.content || qr.content || { data: [] },
          orderNumber: questionData.orderNumber || qr.orderNumber || 0,
        };
      });

      // Ensure section object has all required properties for Reading/Listening sections
      const enhancedSection = {
        ...section,
        // Make sure these properties exist for Reading/Listening sections
        sectionsUrl: section.sectionsUrl || section.url || section.audioUrl || '',
        sectionsContent: section.sectionsContent || section.content || section.passage || section.transcript || '',
        sectionTitle: section.sectionTitle || section.title || 'Section',
        resourceType: section.resourceType || (section.sectionsUrl ? 'FILE' : 'DOCUMENT'),
        orderNumber: section.orderNumber || 0,
      };

      transformedSections.push({
        section: enhancedSection,
        questions: transformedQuestions,
      });
    });

    // Debug logs removed

    // Create a response object similar to getPublicSectionsByChallenge format
    return {
      success: true,
      data: transformedSections,
    };
  };

  const [isViewOnly, setIsViewOnly] = useState(false);

  // Helper function to find current questionId from active element
  const getCurrentQuestionId = useCallback(() => {
    try {
      const activeElement = document.activeElement;
      if (!activeElement) return 0;

      // Traverse up the DOM tree to find question container
      let current = activeElement;
      while (current && current !== document.body) {
        // Check if element has data-question-id attribute
        if (current.dataset?.questionId) {
          const qId = parseInt(current.dataset.questionId);
          if (!isNaN(qId)) return qId;
        }

        // Check if element is inside a question ref
        for (const [key, ref] of Object.entries(questionRefs.current)) {
          if (ref && ref.contains && ref.contains(current)) {
            // Extract questionId from ref key (e.g., "q-123" -> 123)
            const match = key.match(/q-(\d+)/);
            if (match) {
              const qId = parseInt(match[1]);
              if (!isNaN(qId)) return qId;
            }
          }
        }

        current = current.parentElement;
      }

      // Fallback: try to find from questionRefs based on scroll position
      const scrollY = window.scrollY || window.pageYOffset;
      let closestQuestionId = 0;
      let minDistance = Infinity;

      for (const [key, ref] of Object.entries(questionRefs.current)) {
        if (ref && ref.getBoundingClientRect) {
          const rect = ref.getBoundingClientRect();
          const distance = Math.abs(rect.top + scrollY - scrollY);
          if (distance < minDistance && rect.top < window.innerHeight / 2) {
            minDistance = distance;
            const match = key.match(/q-(\d+)|(\d+)/);
            if (match) {
              const qId = parseInt(match[1] || match[2]);
              if (!isNaN(qId)) closestQuestionId = qId;
            }
          }
        }
      }

      return closestQuestionId;
    } catch (e) {
      console.error('Error getting current questionId:', e);
      return 0;
    }
  }, []);

  // Helper function to get selected text (for copy)
  const getSelectedText = useCallback(() => {
    try {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        return selection.toString().trim();
      }
      return '';
    } catch (e) {
      return '';
    }
  }, []);

  // Helper function to get clipboard content (for paste) - async
  const getClipboardContent = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        return text.trim();
      }
    } catch (e) {
      // Clipboard API might require permission or be blocked
      console.warn('Cannot read clipboard:', e);
    }
    return '';
  }, []);

  // Convert log entry from useTestSecurity to API format
  const convertLogToApiFormat = useCallback(async (logEntry) => {
    if (!logEntry) return null;

    // Map violation type to event name
    const eventMap = {
      'tab_switch': 'TAB_SWITCH',
      'copy': 'COPY_ATTEMPT',
      'paste': 'PASTE_ATTEMPT'
    };

    const event = eventMap[logEntry.type] || logEntry.type?.toUpperCase() || 'UNKNOWN';
    const timestamp = logEntry.timestamp || new Date().toISOString();

    let oldValue = [];
    let newValue = [];

    // For copy: capture selected text as oldValue (content being copied)
    if (logEntry.type === 'copy') {
      const selectedText = logEntry.selectedText || getSelectedText();
      if (selectedText) {
        oldValue = [selectedText];
      }
    }

    // For paste: capture clipboard content as newValue (content being pasted)
    if (logEntry.type === 'paste') {
      const clipboardText = logEntry.clipboardText || await getClipboardContent();
      if (clipboardText) {
        newValue = [clipboardText];
      }
    }

    // Ensure we never include questionId inside content either
    const { questionId: _omitQuestionId, ...sanitizedLog } = logEntry || {};

    return {
      event,
      timestamp,
      oldValue,
      newValue,
      durationMs: logEntry.durationMs || 0,
      content: logEntry.message || JSON.stringify(sanitizedLog)
    };
  }, [getSelectedText, getClipboardContent]);

  // Handle violation callback - first time show warning, second time onwards log and send
  const handleViolation = useCallback(async (logEntry) => {
    if (!logEntry || !logEntry.type) return;

    const violationType = logEntry.type;
    const currentCount = violationCountRef.current.get(violationType) || 0;
    const newCount = currentCount + 1;

    // Capture additional data for copy/paste
    let selectedText = '';
    let clipboardText = '';
    if (violationType === 'copy') {
      // Use selectedText from logEntry if available (captured in useTestSecurity)
      // Otherwise try to get it again
      selectedText = logEntry.selectedText || getSelectedText();
    } else if (violationType === 'paste') {
      try {
        clipboardText = await getClipboardContent();
      } catch (e) {
        console.warn('Could not read clipboard:', e);
      }
    }

    // Enhance logEntry with captured data
    const { questionId: _dropQId, ...restLog } = logEntry || {};
    const enhancedLogEntry = {
      ...restLog,
      selectedText,
      clipboardText
    };

    // Update violation count
    violationCountRef.current.set(violationType, newCount);

    if (newCount === 1) {
      // First time: show warning modal with details, don't log
      setViolationWarningData({
        type: violationType,
        message: logEntry.message || 'Hành động không được phép đã được phát hiện',
        timestamp: logEntry.timestampDisplay || new Date().toLocaleString('vi-VN'),
        oldValue: violationType === 'copy' ? (selectedText ? [selectedText] : []) : [],
        newValue: violationType === 'paste' ? (clipboardText ? [clipboardText] : []) : []
      });
      setViolationWarningModalVisible(true);
    } else {
      // Second time onwards: add to pending logs to be sent to backend
      const apiLog = await convertLogToApiFormat(enhancedLogEntry);
      if (apiLog) {
        pendingLogsRef.current.push(apiLog);
      }
    }
  }, [getSelectedText, getClipboardContent, convertLogToApiFormat]);

  // Initialize useTestSecurity hook
  useTestSecurity(
    isAntiCheatEnabled && !isViewOnly,
    handleViolation
  );

  useEffect(() => {
    // Get challenge type from location state
    const type = location.state?.challengeType || location.state?.type || 'GV';
    const challengeId = id; // Get challengeId from URL params
    const submissionStatus = location.state?.submissionStatus; // Get submission status
    
    if (!challengeId) {
      spaceToast.error('Challenge ID is missing');
      setLoading(false);
      return;
    }

    setChallengeType(type);
    // Feature flags from navigation state
    const translateOnScreen = !!location.state?.translateOnScreen;
    const shuffleQuestion = !!location.state?.shuffleQuestion;
    setAllowTranslateOnScreen(translateOnScreen);
    setAllowShuffleQuestions(shuffleQuestion);
    // Determine initial view-only mode from navigation state
    if (submissionStatus === 'SUBMITTED' || submissionStatus === 'GRADED') {
      setIsViewOnly(true);
    }
    setChallengeInfo({
      challengeName: location.state?.challengeName || 'Daily Challenge',
      className: location.state?.lessonName || null,
    });
    
    // Get submissionId from location state (backward compatible)
    let initialSubmissionId = location.state?.submissionId || location.state?.submissionChallengeId;
    if (initialSubmissionId) {
      setSubmissionId(initialSubmissionId);
    }
    
    // Load data from API
    setLoading(true);
    
    // First, try to get submissionId if not provided
    const getSubmissionIdPromise = initialSubmissionId 
      ? Promise.resolve({ data: { id: initialSubmissionId } })
      : dailyChallengeApi.getChallengeSubmissions(challengeId, { page: 0, size: 1 })
        .then((submissionsResponse) => {
          if (submissionsResponse && submissionsResponse.success) {
            const submissions = submissionsResponse.data?.content || submissionsResponse.data || [];
            if (Array.isArray(submissions) && submissions.length > 0) {
              const currentSubmission = submissions.find(sub => sub.challengeId === parseInt(challengeId)) || submissions[0];
              return currentSubmission && currentSubmission.id ? { data: { id: currentSubmission.id } } : null;
            }
          }
          return null;
        });

    getSubmissionIdPromise
      .then((submissionData) => {
        const finalSubmissionId = submissionData?.data?.id || initialSubmissionId;
        
        if (!finalSubmissionId) {
          // If no submission exists yet, fall back to public sections API
          return dailyChallengeApi.getPublicSectionsByChallenge(challengeId, { page: 0, size: 100 })
            .then((sectionsResponse) => {
              if (sectionsResponse && sectionsResponse.success) {
                const transformedData = transformApiDataToComponentFormat(sectionsResponse, type);
                // Shuffle question order if allowed and not view-only
                const shuffle = (arr) => {
                  const a = Array.isArray(arr) ? [...arr] : [];
                  for (let i = a.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [a[i], a[j]] = [a[j], a[i]];
                  }
                  return a;
                };
                const applyShuffle = (data) => {
                  if (!allowShuffleQuestions || isViewOnly) return data;
                  const newData = { ...data };
                  newData.questions = shuffle(data.questions || []);
                  newData.readingSections = (data.readingSections || []).map(sec => ({ ...sec, questions: shuffle(sec.questions || []) }));
                  newData.listeningSections = (data.listeningSections || []).map(sec => ({ ...sec, questions: shuffle(sec.questions || []) }));
                  return newData;
                };
                const maybeShuffled = applyShuffle(transformedData);
                setQuestions(maybeShuffled.questions);
                setReadingSections(maybeShuffled.readingSections);
                setListeningSections(maybeShuffled.listeningSections);
                setWritingSections(maybeShuffled.writingSections);
                setSpeakingSections(maybeShuffled.speakingSections);
              }
              setLoading(false);
            });
        }

        // Update submissionId state
        setSubmissionId(finalSubmissionId);

        // Fetch timing info and initialize countdown if applicable
        if (finalSubmissionId && !isViewOnly) {
          dailyChallengeApi.getSubmissionChallengeInfo(finalSubmissionId)
            .then((infoResp) => {
              const info = infoResp?.data || infoResp?.data?.data || infoResp?.data; // support different wrappers
              const payload = infoResp?.data?.data ? infoResp.data.data : info;
              const challengeDurationSec = payload?.challengeDuration;
              if (challengeDurationSec && Number(challengeDurationSec) > 0) {
                // Determine start time: use actualStartAt if present; otherwise mark start now
                let startTs = payload?.actualStartAt ? Date.parse(payload.actualStartAt) : null;
                const ensureStart = () => {
                  if (!startTs) {
                    return dailyChallengeApi.startSubmission(finalSubmissionId)
                      .catch(() => {})
                      .finally(() => { startTs = Date.now(); });
                  }
                  return Promise.resolve();
                };
                return ensureStart().then(() => {
                  const deadlineTs = startTs + Number(challengeDurationSec) * 1000;
                  deadlineTsRef.current = deadlineTs;
                  setIsTimedChallenge(true);
                  setTimeRemaining(Math.max(0, Math.floor((deadlineTs - Date.now()) / 1000)));
                });
              } else {
                setIsTimedChallenge(false);
                return null;
              }
            })
            .catch(() => {
              // If timing info fails, do not enable timer
              setIsTimedChallenge(false);
            });
        }
        
        // Determine which API to use based on submission status and challenge type
        // For WR and SP types with SUBMITTED status, use result API instead of draft API
        const shouldUseResultAPI = (submissionStatus === 'SUBMITTED' || submissionStatus === 'GRADED') && (type === 'WR' || type === 'SP');
        if (shouldUseResultAPI) setIsViewOnly(true);
        
        const apiCall = shouldUseResultAPI 
          ? dailyChallengeApi.getSubmissionResult(finalSubmissionId)
          : dailyChallengeApi.getDraftSubmission(finalSubmissionId);
        
        return apiCall
          .then((response) => {
            if (response && response.success) {
              
              // Transform response to sections format
              const sectionsResponse = transformDraftResponseToSectionsFormat(response, type);
              
              if (sectionsResponse) {
                try {
                  // Load sections/questions from response
                  const transformedData = transformApiDataToComponentFormat(sectionsResponse, type);
                  const shuffle = (arr) => {
                    const a = Array.isArray(arr) ? [...arr] : [];
                    for (let i = a.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [a[i], a[j]] = [a[j], a[i]];
                    }
                    return a;
                  };
                  const applyShuffle = (data) => {
                    if (!allowShuffleQuestions || isViewOnly) return data;
                    const newData = { ...data };
                    newData.questions = shuffle(data.questions || []);
                    newData.readingSections = (data.readingSections || []).map(sec => ({ ...sec, questions: shuffle(sec.questions || []) }));
                    newData.listeningSections = (data.listeningSections || []).map(sec => ({ ...sec, questions: shuffle(sec.questions || []) }));
                    return newData;
                  };
                  const maybeShuffled = applyShuffle(transformedData);
                  if (maybeShuffled) {
                    setQuestions(maybeShuffled.questions || []);
                    setReadingSections(maybeShuffled.readingSections || []);
                    setListeningSections(maybeShuffled.listeningSections || []);
                    setWritingSections(maybeShuffled.writingSections || []);
                    setSpeakingSections(maybeShuffled.speakingSections || []);
                    // Build content lookup map for all question types
                    const map = new Map();
                    const posMap = new Map();
                    const collect = (q) => {
                      map.set(q.id, q.content?.data || []);
                      const txt = q.questionText || q.question || '';
                      const ids = [];
                      const re = /\[\[pos_(.*?)\]\]/g; let m;
                      while ((m = re.exec(txt)) !== null) ids.push(m[1]);
                      if (ids.length > 0) posMap.set(q.id, ids);
                    };
                    (maybeShuffled.readingSections || []).forEach(sec => (sec.questions || []).forEach(collect));
                    (maybeShuffled.listeningSections || []).forEach(sec => (sec.questions || []).forEach(collect));
                    (maybeShuffled.questions || []).forEach(collect);
                    (maybeShuffled.writingSections || []).forEach(sec => { posMap.set(sec.id, []); map.set(sec.id, sec.content?.data || []); });
                    (maybeShuffled.speakingSections || []).forEach(sec => { posMap.set(sec.id, []); map.set(sec.id, sec.content?.data || []); });
                    contentDataByQuestionIdRef.current = map;
                    positionIdsByQuestionIdRef.current = posMap;
                  }
                } catch (error) {
                  console.error('❌ Error transforming response to sections:', error);
                  console.error('Response:', response);
                  console.error('Sections response:', sectionsResponse);
                }
              }
              
              // Restore saved answers from response
              if (response.data) {
                // If API says submitted/graded, enforce view-only
                const statusFromApi = response.data?.submission?.status || response.data?.status;
                if (statusFromApi === 'SUBMITTED' || statusFromApi === 'GRADED') setIsViewOnly(true);
                // Delay restoration slightly to ensure components are mounted
                // Use requestAnimationFrame to wait for next render cycle
                requestAnimationFrame(() => {
                  setTimeout(() => {
                    try {
                      restoreAnswersFromResult(response.data);
                      // LocalStorage overlay removed
                    } catch (error) {
                      console.error('❌ Error in restoreAnswersFromResult:', error);
                      console.error('Data structure:', response.data);
                    }
                  }, 300);
                });
              }
            }
          })
          .catch((error) => {
            console.error('Error loading submission:', error);
            // Fall back to public sections API if API fails
            return dailyChallengeApi.getPublicSectionsByChallenge(challengeId, { page: 0, size: 100 })
              .then((sectionsResponse) => {
                if (sectionsResponse && sectionsResponse.success) {
                  const transformedData = transformApiDataToComponentFormat(sectionsResponse, type);
                  const shuffle = (arr) => {
                    const a = Array.isArray(arr) ? [...arr] : [];
                    for (let i = a.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [a[i], a[j]] = [a[j], a[i]];
                    }
                    return a;
                  };
                  const applyShuffle = (data) => {
                    if (!allowShuffleQuestions || isViewOnly) return data;
                    const newData = { ...data };
                    newData.questions = shuffle(data.questions || []);
                    newData.readingSections = (data.readingSections || []).map(sec => ({ ...sec, questions: shuffle(sec.questions || []) }));
                    newData.listeningSections = (data.listeningSections || []).map(sec => ({ ...sec, questions: shuffle(sec.questions || []) }));
                    return newData;
                  };
                  const maybeShuffled = applyShuffle(transformedData);
                  setQuestions(maybeShuffled.questions);
                  setReadingSections(maybeShuffled.readingSections);
                  setListeningSections(maybeShuffled.listeningSections);
                  setWritingSections(maybeShuffled.writingSections);
                  setSpeakingSections(maybeShuffled.speakingSections);
                  // Build content lookup map + position ids map
                  const map = new Map();
                  const posMap = new Map();
                  const collect = (q) => {
                    map.set(q.id, q.content?.data || []);
                    const txt = q.questionText || q.question || '';
                    const ids = [];
                    const re = /\[\[pos_(.*?)\]\]/g; let m;
                    while ((m = re.exec(txt)) !== null) ids.push(m[1]);
                    if (ids.length > 0) posMap.set(q.id, ids);
                  };
                  (maybeShuffled.readingSections || []).forEach(sec => (sec.questions || []).forEach(collect));
                  (maybeShuffled.listeningSections || []).forEach(sec => (sec.questions || []).forEach(collect));
                  (maybeShuffled.questions || []).forEach(collect);
                  (maybeShuffled.writingSections || []).forEach(sec => { posMap.set(sec.id, []); map.set(sec.id, sec.content?.data || []); });
                  (maybeShuffled.speakingSections || []).forEach(sec => { posMap.set(sec.id, []); map.set(sec.id, sec.content?.data || []); });
                  contentDataByQuestionIdRef.current = map;
                  positionIdsByQuestionIdRef.current = posMap;
                }
              });
          });
      })
      .catch((error) => {
        console.error('Error loading challenge data:', error);
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to load challenge data';
        spaceToast.error(errorMessage);
      })
      .finally(() => {
        setLoading(false);
        // Enable anti-cheat after data is loaded and not in view-only mode
        const hasAntiCheat = !!location.state?.hasAntiCheat;
        if (!isViewOnly && hasAntiCheat) {
          setIsAntiCheatEnabled(true);
        } else {
          setIsAntiCheatEnabled(false);
        }
      });
  }, [id, location.state, isViewOnly]);
  // Start or update countdown based on absolute deadline
  useEffect(() => {
    if (loading || isViewOnly || !isTimedChallenge || !deadlineTsRef.current) return;
    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((deadlineTsRef.current - now) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0 && !autoSubmitTriggeredRef.current) {
        autoSubmitTriggeredRef.current = true;
        // Auto submit once when time is up
        handleAutoSubmitOnTimeout();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [loading, isViewOnly, isTimedChallenge]);



  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Removed localStorage persistence to avoid breaking inputs

  // Debounced auto-save trigger exposed to children via context
  const autoSaveDebounceRef = useRef(null);
  const markProgressDirty = React.useCallback(() => {
    if (loading || isViewOnly) return;
    try {
      setAutoSaveStatus('saving');
    } catch {}
    if (autoSaveDebounceRef.current) {
      clearTimeout(autoSaveDebounceRef.current);
    }
    autoSaveDebounceRef.current = setTimeout(() => {
      autoSaveDraftSilently();
    }, 1500);
  }, [loading, isViewOnly]);

  // Silently save draft (no global loading/toast)
  const autoSaveDraftSilently = async () => {
    if (isViewOnly) return;
    try {
      setAutoSaveStatus('saving');
      const questionAnswers = collectAllAnswers();

      // LocalStorage persistence removed

      // Attempt silent server draft save without toggling global loading
      let currentSubmissionId = submissionId;
      if (!currentSubmissionId) {
        try {
          const submissionsResponse = await dailyChallengeApi.getChallengeSubmissions(id, { page: 0, size: 1 });
          if (submissionsResponse && submissionsResponse.success) {
            const submissions = submissionsResponse.data?.content || submissionsResponse.data || [];
            if (Array.isArray(submissions) && submissions.length > 0) {
              const currentSubmission = submissions.find(sub => sub.challengeId === parseInt(id)) || submissions[0];
              if (currentSubmission && currentSubmission.id) {
                currentSubmissionId = currentSubmission.id;
                setSubmissionId(currentSubmissionId);
              }
            }
          }
        } catch (e) {
          // Silent fail – keep localStorage only
        }
      }

      if (currentSubmissionId) {
        try {
          const submitData = { saveAsDraft: true, questionAnswers };
          const resp = await dailyChallengeApi.submitDailyChallenge(currentSubmissionId, submitData);
          if (resp && resp.success) {
            const responseSubmissionId = resp.data?.submissionId || resp.data?.id || currentSubmissionId;
            if (responseSubmissionId && responseSubmissionId !== currentSubmissionId) {
              setSubmissionId(responseSubmissionId);
            }
          }
        } catch (e) {
          // Silent network/API failure – localStorage still has the draft
        }

        // Send anti-cheat logs if there are any pending logs
        if (pendingLogsRef.current.length > 0 && currentSubmissionId) {
          const logsToSend = [...pendingLogsRef.current];
          pendingLogsRef.current = []; // Clear pending logs before sending
          
          try {
            await dailyChallengeApi.appendAntiCheatLogs(currentSubmissionId, logsToSend);
            console.log('Anti-cheat logs sent successfully:', logsToSend.length);
          } catch (e) {
            // If sending fails, put logs back to pending for retry
            pendingLogsRef.current.unshift(...logsToSend);
            console.error('Failed to send anti-cheat logs:', e);
          }
        }
      }

      setAutoSaveStatus('saved');
      // Revert to idle after short delay
      // Keep showing "Saved" to make status visible next to timer
      // (do not auto-hide)
    } catch (e) {
      setAutoSaveStatus('idle');
    }
  };

  // Auto-save interval every 90 seconds
  useEffect(() => {
    if (loading || isViewOnly) return;
    const intervalId = setInterval(() => {
      autoSaveDraftSilently();
    }, 70 * 1000);
    return () => clearInterval(intervalId);
  }, [loading, isViewOnly, submissionId]);
  // Upload any blob: or data:audio URLs inside formatted answers and replace with server URLs
  const replaceBlobUrlsInAnswers = async (questionAnswers) => {
    const uploadedCache = new Map();
    const toAbsoluteUrl = (res) => {
      if (res?.data?.url) return res.data.url;
      if (typeof res?.data === 'string') return res.data;
      if (typeof res === 'string') return res;
      return null;
    };
    const uploadFromUrl = async (url) => {
      if (uploadedCache.has(url)) return uploadedCache.get(url);
      const resp = await fetch(url);
      const blob = await resp.blob();
      const ext = (blob.type && blob.type.includes('mp3')) ? 'mp3' : (blob.type && blob.type.includes('wav')) ? 'wav' : 'webm';
      const file = new File([blob], `speaking-${Date.now()}.${ext}`, { type: blob.type || 'audio/webm' });
      const res = await dailyChallengeApi.uploadFile(file);
      const finalUrl = toAbsoluteUrl(res);
      if (!finalUrl) throw new Error('Upload failed: no url');
      uploadedCache.set(url, finalUrl);
      return finalUrl;
    };

    const processed = [];
    const uploadErrors = [];
    for (const qa of questionAnswers) {
      if (!qa?.content?.data) { processed.push(qa); continue; }
      const newData = [];
      for (const item of qa.content.data) {
        let value = item?.value;
        if (typeof value === 'string' && (value.startsWith('blob:') || value.startsWith('data:audio'))) {
          try {
            value = await uploadFromUrl(value);
            console.log('✅ Audio blob uploaded successfully, new URL:', value);
          } catch (e) {
            console.error('❌ Audio upload failed for speaking answer:', e);
            uploadErrors.push({ questionId: qa.questionId, error: e.message || 'Upload failed' });
            // Still include the blob URL - backend might handle it, or user will see error
          }
        }
        newData.push({ ...item, id: item?.id === 'text' ? (item.id) : (item.id || 'text'), value });
      }
      processed.push({ ...qa, content: { data: newData } });
    }
    
    // If there were upload errors, log them but don't block submission
    if (uploadErrors.length > 0) {
      console.warn('⚠️ Some audio uploads failed:', uploadErrors);
    }
    
    return processed;
  };

  // Register answer collector function from child components
  const registerAnswerCollector = (questionId, getAnswerFn) => {
    answerCollectorsRef.current.set(questionId, getAnswerFn);
    return () => {
      answerCollectorsRef.current.delete(questionId);
    };
  };

  // Register answer restorer function from child components
  const registerAnswerRestorer = (questionId, setAnswerFn) => {
    answerRestorersRef.current.set(questionId, setAnswerFn);
    return () => {
      answerRestorersRef.current.delete(questionId);
    };
  };

  // Helper function to format answers according to API structure
  const formatAnswerForAPI = (questionId, answer, questionType, options) => {
    // Normalize equivalent types
    const normalizedType = (questionType === 'FILL_IN_THE_BLANK') ? 'FILL_BLANK'
      : (questionType === 'REARRANGE') ? 'REORDER'
      : questionType;
    // For FILL_BLANK, always process even if answer object is empty
    if (normalizedType !== 'FILL_BLANK' && normalizedType !== 'REWRITE') {
      if (!answer && answer !== 0 && answer !== '') {
        return null; // Skip empty answers for other types
      }
    }
    const contentData = [];

    // Lookup original content items for this question to preserve IDs
    const originalItems = contentDataByQuestionIdRef.current.get(questionId) || [];
    const normalize = (s) => (typeof s === 'string' ? s.trim() : s);
    const findIdByValue = (val) => {
      const v = normalize(val);
      const found = originalItems.find(it => normalize(it?.value) === v);
      return found?.id || v;
    };
    const findIdByPosition = (pos) => {
      const p = String(pos ?? '').trim();
      const found = originalItems.find(it => String(it?.positionId ?? '').trim() === p);
      return found?.id || (originalItems[0]?.id) || p;
    };
    const findValueById = (id) => {
      const found = originalItems.find(it => String(it?.id) === String(id));
      return found?.value;
    };

    // Helper to map a choice key/text to display text using provided options
    const getTextForKey = (keyOrText) => {
      if (Array.isArray(options)) {
        const found = options.find(o => o && (o.key === keyOrText || o.text === keyOrText));
        if (found) return found.text ?? String(keyOrText);
      }
      return String(keyOrText);
    };
    const stripHtml = (s) => String(s).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

    // Handle different answer types based on question type
    if (normalizedType === 'MULTIPLE_CHOICE' || normalizedType === 'TRUE_OR_FALSE') {
      // Single answer: can be option key like 'A' or text like 'True'
      if (typeof answer === 'string') {
        let id = answer;
        let value = getTextForKey(answer);

        const getOption = (ans) => {
          const a = String(ans);
          if (Array.isArray(options)) {
            return options.find(o => o && (o.key === a || o.id === a || o.text === a || o.value === a));
          }
          return originalItems.find(it => String(it?.id) === a || String(it?.value) === a) || null;
        };

        if (normalizedType === 'TRUE_OR_FALSE') {
          const normalized = answer.trim().toLowerCase();
          const opt = getOption(answer);
          if (opt) {
            id = opt.key ?? opt.id ?? id;
            value = opt.text ?? opt.value ?? value;
          } else if (normalized === 'true' || normalized === 'false') {
            id = (normalized === 'true') ? 'A' : 'B';
            value = normalized === 'true' ? 'True' : 'False';
          } else if (answer === 'A' || answer === 'B') {
            // Map A/B to True/False when no options provided
            value = answer === 'A' ? 'True' : 'False';
          }
        } else if (Array.isArray(options)) {
          const match = getOption(answer);
          if (match) {
            id = match.key ?? match.id ?? id;
            value = match.text ?? match.value ?? value;
          }
        }
        // Fallback: if value still equals id, try mapping from original items
        if (!value || value === id) {
          const mapped = findValueById(id);
          if (mapped) value = mapped;
        }
        contentData.push({ id, value: stripHtml(value), positionId: null });
      }
    } else if (normalizedType === 'MULTIPLE_SELECT') {
      // Multiple answers: array of option keys/texts
      if (Array.isArray(answer) && answer.length > 0) {
        answer.forEach(optKeyOrText => {
          let id = String(optKeyOrText);
          let value = getTextForKey(optKeyOrText);
          if (Array.isArray(options)) {
            const match = options.find(o => o && (o.key === optKeyOrText || o.text === optKeyOrText));
            if (match) {
              id = match.key ?? id;
              value = match.text ?? value;
            }
          }
          // Fallback map using originalItems when value still equals id
          if (!value || value === id) {
            const mapped = findValueById(id);
            if (mapped) value = mapped;
          }
          contentData.push({ id, value: stripHtml(value), positionId: null });
        });
      }
    } else if (normalizedType === 'DROPDOWN') {
      // Dropdown: answer is an object with positionId keys like { "qId_pos_1": "value", ... }
      // or a single value if not using positionId
      if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
        Object.keys(answer).forEach(key => {
          // Normalize to take only the suffix after '_pos_' or 'pos_'
          let positionId = null;
          if (key.includes('_pos_')) {
            positionId = key.split('_pos_').pop();
            if (positionId && String(positionId).startsWith('pos_')) {
              positionId = String(positionId).substring(4);
            }
          } else if (key.startsWith('pos_')) {
            positionId = key.substring(4);
          } else {
            positionId = key;
          }
          const value = answer[key];
          if (value) {
            contentData.push({
              id: findIdByPosition(positionId),
              value: value,
              positionId: positionId
            });
          }
        });
      } else if (typeof answer === 'string' && answer) {
        contentData.push({
          id: findIdByPosition(null),
          value: answer,
          positionId: null
        });
      }
    } else if (normalizedType === 'DRAG_AND_DROP') {
      // Drag and drop: answer is an object with positionId keys like { "pos_xxxxxx": "value", ... }
      if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
        Object.keys(answer).forEach(rawPos => {
          const value = answer[rawPos];
          if (value) {
            // Normalize position id to remove prefixes
            let positionId = rawPos;
            if (rawPos.includes('_pos_')) {
              positionId = rawPos.split('_pos_').pop();
            } else if (rawPos.startsWith('pos_')) {
              positionId = rawPos.substring(4);
            }
            contentData.push({
              id: findIdByPosition(positionId) || findIdByValue(value),
              value: value,
              positionId: positionId
            });
          }
        });
      }
    } else if (normalizedType === 'REORDER') {
      // Reorder: answer is an array of values in order
      if (Array.isArray(answer) && answer.length > 0) {
        const posOrder = positionIdsByQuestionIdRef.current.get(questionId) || [];
        answer.forEach((value, index) => {
          if (value) {
            contentData.push({
              id: findIdByValue(value),
              value: value,
              positionId: (originalItems.find(it => normalize(it?.value) === normalize(value))?.positionId)
                ?? posOrder[index]
                ?? String(index)
            });
          }
        });
      }
    } else if (normalizedType === 'FILL_BLANK' || normalizedType === 'REWRITE') {
      // Fill blank/Rewrite: answer is a string or object with positionId keys
      // Formatting fill blank answers
      if (typeof answer === 'string' && answer) {
        contentData.push({
          id: originalItems[0]?.id || 'text',
          value: answer,
          positionId: null
        });
      } else if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
        Object.keys(answer).forEach(key => {
          // Extract positionId: key format is "questionId_pos_positionId" or just "positionId"
          let positionId = key;
          if (key.includes('_pos_')) {
            const parts = key.split('_pos_');
            positionId = parts.length > 1 ? parts[parts.length - 1] : key;
          }
          const raw = answer[key];
          // Accept both plain strings and objects with 'value'
          const value = (raw && typeof raw === 'object' && 'value' in raw) ? raw.value : raw;
          // Include value even if it's an empty string to mirror RE behavior
          if (value !== null && value !== undefined) {
            const chosenId = findIdByPosition(positionId) || findIdByValue(value) || (originalItems[0]?.id) || String(value);
            contentData.push({ id: chosenId, value: String(value), positionId });
          }
        });
      }
      // End formatting
    } else if (questionType === 'WRITING' || questionType === 'SPEAKING') {
      // Writing/Speaking: answer can be text string or file references
      if (typeof answer === 'string' && answer) {
        contentData.push({
          id: 'text',
          value: answer,
          positionId: null
        });
      } else if (Array.isArray(answer)) {
        // File uploads or multiple parts
        answer.forEach((item, index) => {
          if (typeof item === 'string') {
            contentData.push({
              id: item,
              value: item,
              positionId: String(index)
            });
          } else if (item && item.value) {
            contentData.push({
              id: item.id || item.value,
              value: item.value,
              positionId: item.positionId || String(index)
            });
          }
        });
      }
    }

    if (contentData.length === 0) {
      return null; // Skip if no valid answer data
    }

    return {
      questionId: questionId,
      content: {
        data: contentData
      }
    };
  };
  // Restore answers from API result
  const restoreAnswersFromResult = (resultData, retryCount = 0) => {
    if (!resultData) {
      console.warn('⚠️ restoreAnswersFromResult: resultData is undefined');
      return;
    }
    
    if (!resultData.sectionDetails) {
      console.warn('⚠️ restoreAnswersFromResult: sectionDetails is missing', resultData);
      return;
    }
    
    if (!Array.isArray(resultData.sectionDetails)) {
      console.warn('⚠️ restoreAnswersFromResult: sectionDetails is not an array', resultData.sectionDetails);
      return;
    }
    
    const { sectionDetails, challengeId, submissionId: resultSubmissionId, submissionChallengeId: legacySubmissionId } = resultData;
    
    // Update submissionId if provided
    const resolvedResultSubmissionId = resultSubmissionId || legacySubmissionId;
    if (resolvedResultSubmissionId) {
      setSubmissionId(resolvedResultSubmissionId);
    }
    
    // Calculate section scores
    const scores = {};
    const pendingRestorations = [];
    
    sectionDetails.forEach((sectionDetail) => {
      if (!sectionDetail) {
        console.warn('⚠️ Section detail is undefined');
        return;
      }
      
      const { section, questionResults, questions } = sectionDetail;
      
      if (!section) {
        console.warn('⚠️ Section is undefined in sectionDetail:', sectionDetail);
        return;
      }
      
      // Draft API returns 'questions', Result API returns 'questionResults'
      // Handle both formats
      const questionDataList = questionResults || questions;
      
      if (!questionDataList) {
        console.warn('⚠️ Section missing both questionResults and questions:', sectionDetail);
        return;
      }
      
      if (!Array.isArray(questionDataList)) {
        console.warn('⚠️ questionResults/questions is not an array:', questionDataList);
        return;
      }
      
      const sectionId = section.id;
      
      // Calculate total score for this section
      let totalScore = 0;
      let totalReceivedScore = 0;
      
      questionDataList.forEach((qr) => {
        // Handle both formats:
        // Draft API: {question: {id, ...}, submittedContent: {...}}
        // Result API: {questionId, question: {...}, submittedContent: {...}}
        const questionId = qr.questionId || qr.question?.id || qr.id;
        const submittedContent = qr.submittedContent;
        const receivedScore = qr.receivedScore;
        const questionType = qr.questionType || qr.question?.type || qr.type;
        const score = qr.score;
        totalScore += score || 0;
        totalReceivedScore += receivedScore || 0;
        
        // Debug logging
        if (submittedContent && submittedContent.data && submittedContent.data.length > 0) {
          console.log(`📝 Found saved answer for question ${questionId}:`, submittedContent.data);
        }
        
        // Restore answer from submittedContent
        const setAnswerFn = answerRestorersRef.current.get(questionId);
        
        if (!setAnswerFn) {
          console.log(`❌ No restorer function found for question ${questionId}. Available restorers:`, Array.from(answerRestorersRef.current.keys()));
        }
        
        if (setAnswerFn && submittedContent) {
          try {
            // Parse answer data from API format
            const answerData = submittedContent?.data || [];
            let restoredAnswer = null;
            
            if (answerData.length === 0) return;
            
            // Determine question type from answer data structure
            if (answerData.length === 1 && !answerData[0].positionId) {
              // Single answer (MULTIPLE_CHOICE, TRUE_OR_FALSE, etc.)
              restoredAnswer = answerData[0].value;
            } else if (answerData.some(item => item.positionId)) {
              // Multiple answers with positionId
              if (questionType === 'REORDER' || questionType === 'REARRANGE') {
                // For REARRANGE/REORDER, the array order in submittedContent.data is the correct order
                // positionId is metadata (for matching question text positions) but not used for slot ordering
                // Just map the values in the order they appear in the array
                restoredAnswer = answerData.map(item => item.value).filter(v => v !== undefined && v !== null);
              } else if (questionType === 'DRAG_AND_DROP') {
                const answerObj = {};
                answerData.forEach(item => {
                  const rawPos = String(item.positionId || '');
                  const normalizedPos = rawPos.includes('_pos_') ? rawPos.split('_pos_').pop() : rawPos;
                  if (normalizedPos) answerObj[normalizedPos] = item.value;
                });
                restoredAnswer = Object.keys(answerObj).length > 0 ? answerObj : null;
              } else {
                // Default for dropdown/fill-like questions: prefix with questionId
                const answerObj = {};
                answerData.forEach(item => {
                  const rawPos = String(item.positionId || '');
                  const normalizedPos = rawPos.includes('_pos_') ? rawPos.split('_pos_').pop() : rawPos;
                  const key = `${questionId}_pos_${normalizedPos || 'default'}`;
                  answerObj[key] = item.value;
                });
                restoredAnswer = Object.keys(answerObj).length > 0 ? answerObj : null;
              }
            } else {
              // Multiple answers without positionId (MULTIPLE_SELECT, REORDER, etc.)
              restoredAnswer = answerData.map(item => item.value);
            }
            
            if (restoredAnswer !== null) {
              setAnswerFn(restoredAnswer);
              console.log(`✅ Restored answer for question ${questionId}:`, restoredAnswer);
            }
          } catch (error) {
            console.error(`Error restoring answer for question ${questionId}:`, error);
          }
        } else if (submittedContent && submittedContent.data && submittedContent.data.length > 0) {
          // If restorer function not found but we have answer data, store for retry
          pendingRestorations.push({ questionId, qr });
          if (retryCount === 0) {
            console.log(`⏳ Waiting for restorer function for question ${questionId}`);
          }
        }
      });
      
      // Store section score
      if (sectionId) {
        scores[sectionId] = {
          totalScore,
          receivedScore: totalReceivedScore,
          percentage: totalScore > 0 ? Math.round((totalReceivedScore / totalScore) * 100) : 0
        };
      }
    });
    
    // Update section scores state
    setSectionScores(scores);
    
    // Retry restoration for pending questions if components haven't mounted yet
    if (pendingRestorations.length > 0 && retryCount < 10) {
      setTimeout(() => {
        restoreAnswersFromResult(resultData, retryCount + 1);
      }, 500);
    } else if (pendingRestorations.length > 0) {
      console.warn(`⚠️ Could not restore ${pendingRestorations.length} answers after ${retryCount} retries`);
    }
  };

  // Collect all answers from registered collectors
  const collectAllAnswers = () => {
    const questionAnswers = [];

    // Collect from all registered answer collectors
    answerCollectorsRef.current.forEach((getAnswerFn, questionId) => {
      try {
        const answerData = getAnswerFn();
        if (answerData && typeof answerData === 'object') {
          const { answer, questionType, options } = answerData;
          const formattedAnswer = formatAnswerForAPI(questionId, answer, questionType, options);
          if (formattedAnswer) {
            questionAnswers.push(formattedAnswer);
          } else {
            // Include unanswered question explicitly with empty content
            questionAnswers.push({ questionId, content: { data: [] } });
          }
        } else {
          // No answer returned – still include the question with empty content
          questionAnswers.push({ questionId, content: { data: [] } });
        }
      } catch (error) {
        console.error(`❌ Error collecting answer for question ${questionId}:`, error);
        // On error, still include the question with empty content to ensure completeness
        questionAnswers.push({ questionId, content: { data: [] } });
      }
    });

    return questionAnswers;
  };

  // Handle save (save as draft)
  const handleSave = async () => {
    setAutoSaveStatus('saving');
    // If submissionId is not available, try to get it first
    let currentSubmissionId = submissionId;
    
    if (!currentSubmissionId) {
      try {
        // Try to get submission from API
        const submissionsResponse = await dailyChallengeApi.getChallengeSubmissions(id, { page: 0, size: 1 });
        if (submissionsResponse && submissionsResponse.success) {
          const submissions = submissionsResponse.data?.content || submissionsResponse.data || [];
          if (Array.isArray(submissions) && submissions.length > 0) {
            const currentSubmission = submissions.find(sub => sub.challengeId === parseInt(id)) || submissions[0];
            if (currentSubmission && currentSubmission.id) {
              currentSubmissionId = currentSubmission.id;
              setSubmissionId(currentSubmissionId);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching submission:', error);
      }
      
      // If still no submission ID, show error
      if (!currentSubmissionId) {
        spaceToast.error('Submission ID is missing. Please refresh and try again.');
        return;
      }
    }

    try {
      const questionAnswers = collectAllAnswers();
      const processedAnswers = await replaceBlobUrlsInAnswers(questionAnswers);
      
      const submitData = {
        saveAsDraft: true,
        questionAnswers: processedAnswers
      };

      setLoading(true);
      const response = await dailyChallengeApi.submitDailyChallenge(currentSubmissionId, submitData);
      
      if (response && response.success) {
        spaceToast.success('Progress saved successfully');
        setAutoSaveStatus('saved');
        
        // Get submissionId from response and update state
        const responseSubmissionId = response.data?.submissionId || response.data?.id || currentSubmissionId;
        if (responseSubmissionId && responseSubmissionId !== currentSubmissionId) {
          setSubmissionId(responseSubmissionId);
          currentSubmissionId = responseSubmissionId;
        }
        
        // Reload draft data from API to ensure sync with server
        if (currentSubmissionId) {
          try {
            console.log('🔄 Reloading draft data after save...');
            const draftResponse = await dailyChallengeApi.getDraftSubmission(currentSubmissionId);
            if (draftResponse && draftResponse.success && draftResponse.data) {
              // Restore answers from fresh draft data
              setTimeout(() => {
                restoreAnswersFromResult(draftResponse.data);
              }, 300);
              console.log('✅ Draft data reloaded after save');
            }
          } catch (error) {
            console.error('Error reloading draft data after save:', error);
            // Don't show error to user - save was successful
          }
        }
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to save progress';
      spaceToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle submit - show confirmation modal
  const handleSubmit = () => {
    setSubmitModalVisible(true);
  };

  // Confirm submit - handle actual submission
  const handleConfirmSubmit = async () => {
    setSubmitConfirmLoading(true);
    // If submissionId is not available, try to get it first
    let currentSubmissionId = submissionId;
    
    if (!currentSubmissionId) {
      try {
        // Try to get submission from API
        const submissionsResponse = await dailyChallengeApi.getChallengeSubmissions(id, { page: 0, size: 1 });
        if (submissionsResponse && submissionsResponse.success) {
          const submissions = submissionsResponse.data?.content || submissionsResponse.data || [];
          if (Array.isArray(submissions) && submissions.length > 0) {
            const currentSubmission = submissions.find(sub => sub.challengeId === parseInt(id)) || submissions[0];
            if (currentSubmission && currentSubmission.id) {
              currentSubmissionId = currentSubmission.id;
              setSubmissionId(currentSubmissionId);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching submission:', error);
      }
      
      // If still no submission ID, show error
      if (!currentSubmissionId) {
        spaceToast.error('Submission ID is missing. Please refresh and try again.');
        setSubmitModalVisible(false);
        return;
      }
    }

    try {
      const questionAnswers = collectAllAnswers();
      const processedAnswers = await replaceBlobUrlsInAnswers(questionAnswers);
      
      const submitData = {
        saveAsDraft: false,
        questionAnswers: processedAnswers
      };

      setLoading(true);
      const response = await dailyChallengeApi.submitDailyChallenge(currentSubmissionId, submitData);
    
    // Close modal
    setSubmitModalVisible(false);
    
      if (response && response.success) {
    spaceToast.success('Submitted successfully');
        
        // Get submissionId from response and update state
        const responseSubmissionId = response.data?.submissionId || response.data?.id || currentSubmissionId;
        if (responseSubmissionId && responseSubmissionId !== currentSubmissionId) {
          setSubmissionId(responseSubmissionId);
          currentSubmissionId = responseSubmissionId;
        }
    
    // Navigate to class daily challenge list after short delay
    setTimeout(() => {
      const resolvedClassId = location.state?.classId;
      if (resolvedClassId) {
        navigate(`${routePrefix}/classes/daily-challenges/${resolvedClassId}`);
      } else {
        navigate(`${routePrefix}/classes`);
      }
    }, 1500);
      } 
    } catch (error) {
      console.error('Error submitting challenge:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to submit';
      spaceToast.error(errorMessage);
      setSubmitModalVisible(false);
    } finally {
      setLoading(false);
      setSubmitConfirmLoading(false);
    }
  };

  // Auto submit when time is up: submit without navigation, then show time-up modal
  const handleAutoSubmitOnTimeout = async () => {
    try {
      // Ensure we have a submissionId
      let currentSubmissionId = submissionId;
      if (!currentSubmissionId) {
        try {
          const submissionsResponse = await dailyChallengeApi.getChallengeSubmissions(id, { page: 0, size: 1 });
          if (submissionsResponse && submissionsResponse.success) {
            const submissions = submissionsResponse.data?.content || submissionsResponse.data || [];
            if (Array.isArray(submissions) && submissions.length > 0) {
              const currentSubmission = submissions.find(sub => sub.challengeId === parseInt(id)) || submissions[0];
              if (currentSubmission && currentSubmission.id) {
                currentSubmissionId = currentSubmission.id;
                setSubmissionId(currentSubmissionId);
              }
            }
          }
        } catch {}
      }
      if (!currentSubmissionId) {
        setTimeUpModalVisible(true);
        return;
      }

      const questionAnswers = collectAllAnswers();
      const processedAnswers = await replaceBlobUrlsInAnswers(questionAnswers);
      const submitData = { saveAsDraft: false, questionAnswers: processedAnswers };
      await dailyChallengeApi.submitDailyChallenge(currentSubmissionId, submitData);
    } catch (e) {
      // Even if submit fails, still show time up modal
    } finally {
      setTimeUpModalVisible(true);
    }
  };

  // Cancel submit
  const handleCancelSubmit = () => {
    setSubmitModalVisible(false);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleTimeUpOk = () => {
    const resolvedClassId = location.state?.classId;
    if (resolvedClassId) {
      navigate(`${routePrefix}/classes/daily-challenges/${resolvedClassId}`);
    } else {
      navigate(`${routePrefix}/classes`);
    }
  };

  // Navigate to question
  const scrollToQuestion = (questionId) => {
    const element = questionRefs.current[questionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Build question navigation list (only single questions)
  const getQuestionNavigation = () => {
    const navigation = [];
    let questionNumber = 1;
    // Reading sections
    if (readingSections.length > 0) {
      readingSections.forEach((s, idx) => {
        const count = s.questions?.length || 0;
        const start = questionNumber;
        const end = count > 0 ? start + count - 1 : start;
        navigation.push({ id: `reading-${idx + 1}`, type: 'section', title: `Reading ${idx + 1}: Question ${start}-${end}` });
        questionNumber = end + 1;
      });
    }
    // Listening sections
    if (listeningSections.length > 0) {
      listeningSections.forEach((s, idx) => {
        const count = s.questions?.length || 0;
      const start = questionNumber;
        const end = count > 0 ? start + count - 1 : start;
        navigation.push({ id: `listening-${idx + 1}`, type: 'section', title: `Listening ${idx + 1}: Question ${start}-${end}` });
      questionNumber = end + 1;
      });
    }
    // Writing sections
    if (writingSections.length > 0) {
      writingSections.forEach((s, idx) => {
        navigation.push({ id: `writing-${idx + 1}`, type: 'section', title: `Writing ${idx + 1}` });
      });
    }
    // Speaking sections
    if (speakingSections.length > 0) {
      speakingSections.forEach((s, idx) => {
        navigation.push({ id: `speaking-${idx + 1}`, type: 'section', title: `Speaking ${idx + 1}` });
      });
    }
    // Individual questions (GV etc.)
    if (!(challengeType === 'LI' || challengeType === 'SP' || challengeType === 'WR')) {
      [...questions]
        .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0) || ((a.id || 0) - (b.id || 0)))
        .forEach((q) => {
        navigation.push({ id: `q-${q.id}`, type: 'question', title: `Question ${questionNumber++}` });
        });
    }
    return navigation;
  };

  // Custom Header Component
  const subtitle = (challengeInfo.className && challengeInfo.challengeName)
    ? `${challengeInfo.className} / ${challengeInfo.challengeName}`
    : (challengeInfo.challengeName || 'Daily Challenge');
  const customHeader = (
    <header className={`themed-header ${theme}-header`}>
      <nav className="themed-navbar">
        <div className="themed-navbar-content" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className={`class-menu-back-button ${theme}-class-menu-back-button`}
              style={{
                height: '32px',
                borderRadius: '8px',
                fontWeight: '350',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                background: '#ffffff',
                color: '#000000',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
            >
              {t('common.back')}
            </Button>
            <div style={{
              fontSize: '18px',
              fontWeight: 600,
              color: theme === 'sun' ? '#1E40AF' : '#1F2937',
              textShadow: theme === 'sun' ? 'none' : '0 0 10px rgba(134, 134, 134, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ 
                fontSize: '24px',
                fontWeight: 350,
                opacity: 0.5
              }}>|</span>
              <span>{subtitle}</span>
            </div>
          </div>
          
          {/* Timer and Save Button */}
          {!isViewOnly && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Timer (show only if duration exists) */}
            {isTimedChallenge && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
             {/* Auto-save status */}
             <span style={{
                fontSize: '12px',
                color: autoSaveStatus === 'saving' ? '#555' : '#2b8a3e',
                fontStyle: 'italic',
                marginLeft: '6px'
              }}>
                {autoSaveStatus === 'saving' ? 'Saving…' : 'Saved'}
              </span>
              <ClockCircleOutlined style={{
                fontSize: '24px',
                color: '#000000',
              }} />
              <span style={{
                fontSize: '20px',
                fontWeight: 'normal',
                color: '#000000',
                fontFamily: 'monospace',
                minWidth: '70px',
                textAlign: 'center',
              }}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            )}
            
            {/* Save Button */}
            <Button
              icon={<SaveOutlined />}
              onClick={handleSave}
              style={{
                height: '36px',
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: theme === 'sun' 
                  ? 'rgb(255, 165, 0)' 
                  : 'linear-gradient(135deg, #FF8C42 19%, #FF7F50 64%, #FF6B35 75%, #FF8C69 97%, #FF6347 100%)',
                borderColor: theme === 'sun' 
                  ? 'rgb(255, 165, 0)' 
                  : '#FF6347',
                color: '#000',
                border: 'none',
                padding: '0 20px',
              }}
              onMouseEnter={(e) => {
                if (theme === 'sun') {
                  e.currentTarget.style.background = 'rgb(255, 140, 0)';
                } else {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #FF7A32 19%, #FF6F40 64%, #FF5B25 75%, #FF7C59 97%, #FF5343 100%)';
                }
              }}
              onMouseLeave={(e) => {
                if (theme === 'sun') {
                  e.currentTarget.style.background = 'rgb(255, 165, 0)';
                } else {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #FF8C42 19%, #FF7F50 64%, #FF6B35 75%, #FF8C69 97%, #FF6347 100%)';
                }
              }}
            >
              Save as draft
            </Button>
            
            {/* Submit Button */}
            <Button
              icon={<CheckOutlined />}
              onClick={handleSubmit}
              style={{
                height: '36px',
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: theme === 'sun' 
                  ? 'rgb(113, 179, 253)' 
                  : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                borderColor: theme === 'sun' 
                  ? 'rgb(113, 179, 253)' 
                  : '#7228d9',
                color: '#000',
                border: 'none',
                padding: '0 20px',
              }}
              onMouseEnter={(e) => {
                if (theme === 'sun') {
                  e.currentTarget.style.background = 'rgb(93, 159, 233)';
                } else {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #9C8FB0 19%, #9588AB 64%, #726795 75%, #9A95B0 97%, #5D4F7F 100%)';
                }
              }}
              onMouseLeave={(e) => {
                if (theme === 'sun') {
                  e.currentTarget.style.background = 'rgb(113, 179, 253)';
                } else {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)';
                }
              }}
            >
              Submit
            </Button>
          </div>
          )}
        </div>
      </nav>
    </header>
  );

  // Ensure GV questions render in ascending orderNumber like the left nav
  const sortedQuestions = React.useMemo(() => {
    return [...questions].sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0) || ((a.id || 0) - (b.id || 0)));
  }, [questions]);
  const questionNav = getQuestionNavigation();

  return (
    <ThemedLayout customHeader={customHeader}>
      <div className={`daily-challenge-content-wrapper ${theme}-daily-challenge-content-wrapper`}>
        {/* Sidebar Toggle Button */}
        <button
          className={`question-sidebar-toggle ${theme}-question-sidebar-toggle ${isSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            position: 'fixed',
            left: isSidebarOpen ? '200px' : '0',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1001,
            background: theme === 'sun' ? 'rgba(113, 179, 253, 0.9)' : 'rgba(138, 122, 255, 0.9)',
            border: 'none',
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px',
            padding: '10px 8px',
            cursor: 'pointer',
            transition: 'left 0.3s ease',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isSidebarOpen ? <CloseOutlined /> : <MenuOutlined />}
        </button>

        {/* Question Sidebar */}
        <div className={`question-sidebar ${theme}-question-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="question-sidebar-header">
            <h3 style={{ fontSize: '20px', fontWeight: 700, textAlign: 'center', color: '#000000' }}>Questions</h3>
          </div>
          <div className="question-sidebar-list">
            {questionNav.map((item) => (
              <div
                key={item.id}
                className={`question-sidebar-item ${item.type === 'section' ? 'question-sidebar-section' : ''}`}
                onClick={() => scrollToQuestion(item.id)}
                style={{ fontWeight: 'normal', textAlign: 'center', color: '#000000' }}
              >
                {item.title}
              </div>
            ))}
          </div>
        </div>

        <div className={`question-content-container ${isSidebarOpen ? 'with-sidebar' : ''}`} style={{ padding: '24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <LoadingWithEffect loading={loading} message="Loading questions...">
              <AnswerCollectionContext.Provider value={registerAnswerCollector}>
                <AnswerRestorationContext.Provider value={registerAnswerRestorer}>
                <AutoSaveTriggerContext.Provider value={markProgressDirty}>
              <div className="questions-list">
                {/* Render Reading sections when challenge type is RE */}
                {challengeType === 'RE' && readingSections.length > 0 && (
                  readingSections.map((section, index) => (
                    <div key={`reading-wrap-${section.id || index}`} ref={el => (questionRefs.current[`reading-${index + 1}`] = el)}>
                      <SectionQuestionItem 
                        key={section.id || `section_${index}`} 
                        question={section} 
                        index={index} 
                        theme={theme} 
                        sectionScore={sectionScores[section.id]}
                      />
                </div>
                  ))
                )}
                {/* Render Writing sections when challenge type is WR */}
                {challengeType === 'WR' && writingSections.length > 0 && (
                  writingSections.map((section, index) => (
                    <div key={`writing-wrap-${section.id || index}`} ref={el => (questionRefs.current[`writing-${index + 1}`] = el)}>
                      <WritingSectionItem key={section.id || `writing_${index}`} question={section} index={index} theme={theme} />
                    </div>
                  ))
                )}
                {/* Render Speaking sections when challenge type is SP */}
                {challengeType === 'SP' && speakingSections.length > 0 && (
                  speakingSections.map((section, index) => (
                    <div key={`speaking-wrap-${section.id || index}`} ref={el => (questionRefs.current[`speaking-${index + 1}`] = el)}>
                      {section.type === 'SPEAKING_WITH_AUDIO_SECTION' ? (
                        <SpeakingWithAudioSectionItem 
                          key={section.id || `speaking_audio_${index}`} 
                          question={section} 
                          index={index} 
                          theme={theme} 
                          isViewOnly={isViewOnly}
                          sectionScore={sectionScores[section.id]}
                        />
                      ) : (
                        <SpeakingSectionItem key={section.id || `speaking_${index}`} question={section} index={index} theme={theme} isViewOnly={isViewOnly} />
                      )}
                    </div>
                  ))
                )}
                {/* Dynamic questions preview (hide complex sections) */}
                {sortedQuestions.map((q, idx) => (
                  <div key={q.id} ref={el => (questionRefs.current[`q-${q.id}`] = el)}>
                    {q.type === 'MULTIPLE_CHOICE' && (
                      <MultipleChoiceContainer theme={theme} data={q} />
                    )}
                    {q.type === 'MULTIPLE_SELECT' && (
                      <MultipleSelectContainer theme={theme} data={q} />
                    )}
                    {q.type === 'TRUE_OR_FALSE' && (
                      <TrueFalseContainer theme={theme} data={q} />
                    )}
                    {(q.type === 'FILL_IN_THE_BLANK' || q.type === 'FILL_BLANK' || q.questionType === 'FILL_BLANK' || q.questionType === 'FILL_IN_THE_BLANK') && (
                      <FillBlankContainer theme={theme} data={q} />
                    )}
                    {q.type === 'DROPDOWN' && (
                      <DropdownContainer theme={theme} data={q} />
                    )}
                    {q.type === 'DRAG_AND_DROP' && (
                      <DragDropContainer theme={theme} data={q} />
                    )}
                    {q.type === 'REARRANGE' && (
                      <ReorderContainer theme={theme} data={q} />
                    )}
                    {q.type === 'REWRITE' && (
                      <RewriteContainer theme={theme} data={q} />
                    )}
                </div>
                ))}
                {challengeType === 'LI' && listeningSections.length > 0 && (
                  listeningSections.map((section, index) => (
                    <div key={`listening-wrap-${section.id || index}`} ref={el => (questionRefs.current[`listening-${index + 1}`] = el)}>
                      <ListeningSectionItem 
                        key={section.id || `listening_${index}`} 
                        question={section} 
                        index={index} 
                        theme={theme} 
                        sectionScore={sectionScores[section.id]}
                      />
                    </div>
                  ))
                )}
              </div>
                </AutoSaveTriggerContext.Provider>
                </AnswerRestorationContext.Provider>
              </AnswerCollectionContext.Provider>
            </LoadingWithEffect>
          </div>
        </div>
      </div>
      
      {/* Violation Warning Modal */}
      <Modal
        open={violationWarningModalVisible}
        closable={false}
        maskClosable={false}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setViolationWarningModalVisible(false)}
            style={{
              background: theme === 'sun' 
                ? 'rgb(113, 179, 253)' 
                : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
              borderColor: theme === 'sun' 
                ? 'rgb(113, 179, 253)' 
                : '#7228d9',
              color: '#000',
              border: 'none',
              fontWeight: 600,
              height: '40px',
              padding: '0 24px',
              fontSize: '15px',
              borderRadius: '8px',
            }}
          >
            Đã hiểu
          </Button>
        ]}
        title={
          <div style={{ display: 'flex', alignItems: 'center',justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>Cảnh báo vi phạm</span>
          </div>
        }
        styles={{
          body: {
            padding: '24px',
          }
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <p style={{ marginBottom: '12px', fontSize: '16px', lineHeight: '1.6' }}>
            <strong>Lần đầu cảnh báo:</strong> Hệ thống đã phát hiện hành động không được phép.
          </p>
          {violationWarningData && (
            <>
              <p style={{ marginBottom: '8px', fontSize: '14px' }}>
                <strong>Loại vi phạm:</strong> {
                  violationWarningData.type === 'tab_switch' ? '🔄 Chuyển tab' :
                  violationWarningData.type === 'copy' ? '📋 Copy' :
                  violationWarningData.type === 'paste' ? '📥 Paste' :
                  violationWarningData.type
                }
              </p>
              <p style={{ marginBottom: '8px', fontSize: '14px'}}>
                <strong>Thời gian:</strong> {violationWarningData.timestamp}
              </p>
              {violationWarningData.type === 'copy' && violationWarningData.oldValue && violationWarningData.oldValue.length > 0 && (
                <p style={{ marginBottom: '8px', fontSize: '14px'}}>
                  <strong>Nội dung đã copy:</strong> 
                  <div style={{ 
                    marginTop: '4px', 
                    padding: '8px', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: '4px',
                    maxHeight: '100px',
                    overflow: 'auto',
                    wordBreak: 'break-word',
                    fontSize: '12px'
                  }}>
                    {violationWarningData.oldValue[0]}
                  </div>
                </p>
              )}
              {violationWarningData.type === 'paste' && violationWarningData.newValue && violationWarningData.newValue.length > 0 && (
                <p style={{ marginBottom: '8px', fontSize: '14px'}}>
                  <strong>Nội dung đã paste:</strong> 
                  <div style={{ 
                    marginTop: '4px', 
                    padding: '8px', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: '4px',
                    maxHeight: '100px',
                    overflow: 'auto',
                    wordBreak: 'break-word',
                    fontSize: '12px'
                  }}>
                    {violationWarningData.newValue[0]}
                  </div>
                </p>
              )}
              <p style={{ marginBottom: '8px', fontSize: '14px'}}>
                <strong>Chi tiết:</strong> {violationWarningData.message}
              </p>
            </>
          )}
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#fff3cd', 
            borderRadius: '8px',
            border: '1px solid #ffc107'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
              <strong>⚠️ Lưu ý:</strong> Đây là lần cảnh báo đầu tiên. Nếu vi phạm tiếp tục xảy ra, 
              hệ thống sẽ ghi lại và báo cáo lên giáo viên.
            </p>
          </div>
        </div>
      </Modal>

      {/* Time Up Modal */}
      <Modal
        open={timeUpModalVisible}
        closable={false}
        maskClosable={false}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={handleTimeUpOk}
            style={{
              background: theme === 'sun' 
                ? 'rgb(113, 179, 253)' 
                : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
              borderColor: theme === 'sun' 
                ? 'rgb(113, 179, 253)' 
                : '#7228d9',
              color: '#000',
              border: 'none',
              fontWeight: 600,
              height: '40px',
              padding: '0 24px',
              fontSize: '15px',
              borderRadius: '8px',
            }}
          >
            OK
          </Button>
        ]}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>Bạn đã hết giờ</span>
          </div>
        }
        styles={{
          body: {
            padding: '24px',
          }
        }}
      >
        <div style={{ marginBottom: '8px', fontSize: '16px', lineHeight: 1.6 }}>
          Bài làm của bạn đã được tự động nộp. Nhấn OK để quay lại danh sách Daily Challenge.
        </div>
      </Modal>

      {/* Submit Confirmation Modal */}
      <Modal
        open={submitModalVisible}
        confirmLoading={submitConfirmLoading}
        onOk={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
        okText="Yes"
        cancelText="No"
        okButtonProps={{
          style: {
            background: theme === 'sun' 
              ? 'rgb(113, 179, 253)' 
              : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
            borderColor: theme === 'sun' 
              ? 'rgb(113, 179, 253)' 
              : '#7228d9',
            color: '#000',
            border: 'none',
            fontWeight: 600,
            height: '40px',
            padding: '0 24px',
            fontSize: '15px',
            borderRadius: '8px',
          }
        }}
        cancelButtonProps={{
          style: {
            color: '#000',
            fontWeight: 600,
            height: '40px',
            padding: '0 24px',
            fontSize: '15px',
            borderRadius: '8px',
            border: '1px solid rgba(0, 0, 0, 0.15)',
          }
        }}
        styles={{
          body: {
            padding: '32px 24px',
          },
          footer: {
            padding: '16px 24px',
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          },
        }}
        style={{
          top: '20%',
        }}
        width={520}
      >
        <div style={{ textAlign: 'center' }}>
          {/* Custom Title */}
          <div style={{
            marginBottom: '24px',
          }}>
            <Typography.Title 
              level={4} 
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 700,
                color: 'rgb(24, 144, 255)',
                textAlign: 'center',
              }}
            >
              Confirm Submission
            </Typography.Title>
          </div>
          
          {/* Icon/Visual Element */}
          <div style={{
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: theme === 'sun'
                ? 'linear-gradient(135deg, rgba(113, 179, 253, 0.2) 0%, rgba(113, 179, 253, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(138, 122, 255, 0.3) 0%, rgba(138, 122, 255, 0.15) 100%)',
              border: `3px solid ${theme === 'sun' ? 'rgba(113, 179, 253, 0.5)' : 'rgba(138, 122, 255, 0.5)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme === 'sun'
                ? '0 4px 16px rgba(113, 179, 253, 0.3)'
                : '0 4px 16px rgba(138, 122, 255, 0.4)',
            }}>
              <CheckOutlined style={{
                fontSize: '32px',
                color: theme === 'sun' ? 'rgb(113, 179, 253)' : '#8B7AF6',
              }} />
            </div>
          </div>
          
          {/* Message */}
          <p style={{
            fontSize: '16px',
            lineHeight: '1.6',
            color: theme === 'sun' ? '#333' : 'rgba(255, 255, 255, 0.9)',
            marginBottom: 0,
            padding: '0 12px',
          }}>
            Are you sure you want to submit your answers?<br />
            <span style={{ color: theme === 'sun' ? '#666' : 'rgba(255, 255, 255, 0.7)' }}>
              Once submitted, you cannot make any changes.
            </span>
          </p>
        </div>
      </Modal>
      {allowTranslateOnScreen && !isViewOnly && (
        <TextTranslator enabled={true} />
      )}
    </ThemedLayout>
  );
};

export default StudentDailyChallengeTake;