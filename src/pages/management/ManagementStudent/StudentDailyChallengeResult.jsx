import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Button,
  Typography,
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  MenuOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CheckOutlined,
  DownloadOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import ThemedLayout from "../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../component/spinner/LoadingWithEffect";
import "../ManagementTeacher/dailyChallenge/DailyChallengeContent.css";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../contexts/ThemeContext";
import usePageTitle from "../../../hooks/usePageTitle";
import { spaceToast } from "../../../component/SpaceToastify";
import { generateFakeDataByType } from "../../../constants/fakeData";

// Helper function to replace [[dur_3]] with HTML badge
const processPassageContent = (content, theme, challengeType) => {
  if (!content) return '';
  
  // Only process for Speaking challenges
  if (challengeType === 'SP') {
    // Remove [[dur_3]] without replacement, as the static badge is now handled separately
    return content.replace(/\[\[dur_3\]\]/g, '');
  }
  
  return content;
};

// Section Question Component for Reading/Listening sections
const SectionQuestionItem = ({ question, index, theme, studentAnswers, onViewFeedback }) => {
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
        position: 'relative'
      }}>
        <Typography.Text strong style={{ 
          fontSize: '20px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          {index + 1}. Reading Section
        </Typography.Text>
        <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
          ({question.points} {question.points > 1 ? 'points' : 'point'})
        </Typography.Text>
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
              {question.questions.map((q, qIndex) => (
                <div key={q.id} style={{
                  padding: '16px',
                  background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`
                }}>
                  {/* Answer Options */}
                  {q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE' || q.type === 'MULTIPLE_SELECT' ? (
                    (() => {
                      const options = (q.options && q.options.length ? q.options : (q.content?.data || []).map((d, idx) => ({
                        key: String.fromCharCode(65 + idx),
                        text: d.value
                      })));
                      const isMulti = q.type === 'MULTIPLE_SELECT';
                      
                      // Get student answer from prop or local state
                      const studentAnswer = studentAnswers?.[q.id];
                      const selected = studentAnswer !== undefined ? studentAnswer : (selectedAnswers[q.id] || (isMulti ? [] : null));
                      
                      // Find correct answers
                      let correctKey = null;
                      let correctKeys = [];
                      if (isMulti) {
                        correctKeys = options.filter(opt => opt.isCorrect).map(opt => opt.key);
                      } else {
                        const correctOption = options.find(opt => opt.isCorrect);
                        if (correctOption) {
                          correctKey = correctOption.key;
                          // For TRUE_OR_FALSE, check if key is 'True'/'False' or text is 'True'/'False'
                          if (q.type === 'TRUE_OR_FALSE') {
                            if (correctOption.key === 'True' || correctOption.key === 'False') {
                              correctKey = correctOption.key;
                            } else if (correctOption.text === 'True' || correctOption.text === 'False') {
                              correctKey = correctOption.text;
                            }
                          }
                        }
                      }
                      
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
                          <div 
                            className="question-text-content"
                            style={{ marginBottom: '10px' }}
                            dangerouslySetInnerHTML={{ __html: q.questionText || q.question || '' }}
                          />
                          <div className="question-options" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr', 
                            gap: '12px'
                          }}>
                            {(q.type === 'TRUE_OR_FALSE' ? ['True', 'False'] : options).map((opt, idx) => {
                              let key, text;
                              if (q.type === 'TRUE_OR_FALSE') {
                                key = opt;
                                text = opt;
                              } else {
                                key = opt.key || String.fromCharCode(65 + idx);
                                text = opt.text || opt.value || '';
                              }
                              
                              // Determine if this is correct answer
                              const isCorrectAnswer = isMulti 
                                ? correctKeys.includes(key)
                                : (key === correctKey || (q.type === 'TRUE_OR_FALSE' && opt === correctKey));
                              
                              // Determine if this is student's selected answer
                              const isSelected = isMulti 
                                ? (Array.isArray(selected) && selected.includes(key))
                                : (selected === key || (q.type === 'TRUE_OR_FALSE' && opt === selected));
                              
                              const isSelectedWrong = isSelected && !isCorrectAnswer;
                              const isCorrectMissing = !isSelected && isCorrectAnswer && isMulti;
                              
                              return (
                                <div key={key} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '12px 14px',
                                  background: isCorrectAnswer || isCorrectMissing
                                    ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)')
                                    : isSelectedWrong
                                      ? (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)')
                                    : (theme === 'sun' ? '#fff' : 'rgba(255,255,255,0.03)'),
                                  border: `2px solid ${
                                    isCorrectAnswer || isCorrectMissing
                                      ? 'rgb(82, 196, 26)'
                                      : isSelectedWrong
                                        ? 'rgb(255, 77, 79)'
                                      : (theme === 'sun' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)')
                                  }`,
                                  borderRadius: '12px',
                                  cursor: 'default',
                                  minHeight: '50px',
                                  boxSizing: 'border-box',
                                  boxShadow: theme === 'sun' 
                                    ? `0 2px 6px ${isCorrectAnswer || isCorrectMissing ? 'rgba(82, 196, 26, 0.25)' : isSelectedWrong ? 'rgba(255, 77, 79, 0.25)' : 'rgba(113, 179, 253, 0.08)'}`
                                    : `0 2px 6px ${isCorrectAnswer || isCorrectMissing ? 'rgba(82, 196, 26, 0.35)' : isSelectedWrong ? 'rgba(255, 77, 79, 0.35)' : 'rgba(138, 122, 255, 0.08)'}`
                                }}>
                                  <input
                                    type={isMulti ? 'checkbox' : 'radio'}
                                    name={`reading-q-${q.id}`}
                                    checked={isSelected || isCorrectAnswer || isCorrectMissing}
                                    disabled
                                    style={{ 
                                      width: '18px', 
                                      height: '18px', 
                                      accentColor: isCorrectAnswer || isCorrectMissing ? '#52c41a' : (isSelectedWrong ? '#ff4d4f' : (theme === 'sun' ? '#1890ff' : '#8B5CF6')),
                                      cursor: 'not-allowed',
                                      opacity: 1
                                    }}
                                  />
                                  <span style={{ 
                                    fontWeight: 600,
                                    color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                    fontSize: '16px'
                                  }}>
                                    {q.type === 'TRUE_OR_FALSE' ? (opt === 'True' ? 'A' : 'B') : key}.
                                  </span>
                                  <span 
                                    className="option-text"
                                    style={{ 
                                      flex: 1, 
                                      lineHeight: '1.6',
                                      color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                      fontWeight: '350'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: q.type === 'TRUE_OR_FALSE' ? opt : text }}
                                  />
                                  {isSelectedWrong && (
                                    <CloseCircleOutlined style={{
                                      fontSize: '22px',
                                      color: '#ff4d4f',
                                      marginLeft: 'auto',
                                      fontWeight: 'bold'
                                    }} />
                                  )}
                                  {(isCorrectAnswer || isCorrectMissing) && !isSelectedWrong && (
                                    <CheckCircleOutlined style={{
                                      fontSize: '20px',
                                      color: '#52c41a',
                                      marginLeft: 'auto'
                                    }} />
                                  )}
                                </div>
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
                          
                          // Get student answers from prop or local state
                          const studentAnswerObj = studentAnswers?.[q.id] || {};
                          
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
                            const positionIdNum = match[1];
                            const positionId = `pos_${positionIdNum}`;
                            const optionsForPosition = q.content?.data?.filter(opt => {
                              const optPosId = String(opt.positionId || '');
                              const matchPosId = String(positionId);
                              return optPosId === matchPosId;
                            }) || [];
                            
                            // Get correct answer and student answer
                            const correctItem = optionsForPosition.find(it => it.correct);
                            const correctAnswer = correctItem?.value || '';
                            
                            // Get student answer from prop or local state
                            const studentAnswer = studentAnswerObj[positionId] || studentAnswerObj[positionIdNum] || selectedAnswers[`${q.id}_pos_${positionId}`] || '';
                            
                            // Compare answers (case-insensitive, trimmed)
                            const isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
                            
                            // Get all option values
                            const optionValues = optionsForPosition.map(it => it.value).filter(Boolean);
                            
                            parts.push(
                            <select
                                key={`dd_${q.id}_${idx++}`}
                                value={studentAnswer || ''}
                                disabled
                                style={{
                                  display: 'inline-block',
                                  minWidth: '120px',
                                  height: '32px',
                                  padding: '4px 12px',
                                  margin: '0 8px',
                                  background: isCorrect 
                                    ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
                                    : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'),
                                  border: `2px solid ${
                                    isCorrect 
                                      ? 'rgb(82, 196, 26)' 
                                      : 'rgb(255, 77, 79)'
                                  }`,
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: isCorrect ? '#52c41a' : '#ff4d4f',
                                  cursor: 'not-allowed',
                                  outline: 'none',
                                  verticalAlign: 'middle',
                                  textAlign: 'center',
                                  textAlignLast: 'center',
                                }}
                            >
                              <option value="" disabled hidden style={{ textAlign: 'center' }}>
                                Select
                              </option>
                                {optionValues.map((opt, optIdx) => (
                                  <option key={optIdx} value={opt} dangerouslySetInnerHTML={{ __html: opt || '' }}>
                                  </option>
                              ))}
                            </select>
                            );
                            
                            // Add correct answer next to dropdown if wrong
                            if (!isCorrect && studentAnswer) {
                              parts.push(
                                <span 
                                  key={`answer_${idx++}`} 
                                  style={{ 
                                    fontSize: '15px',
                                    color: '#52c41a',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    marginLeft: '8px'
                                  }}
                                >
                                  {correctAnswer}
                                </span>
                              );
                            }
                            
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
                      // Get student answers from prop
                      const studentAnswerObj = studentAnswers?.[q.id] || {};
                      
                      // Get all items from content.data (both correct and incorrect) and preserve duplicates
                      const allItems = (q.content?.data || [])
                        .map(item => item.value)
                        .filter(Boolean);
                      
                      // Parse question text with [[pos_xxx]] placeholders
                      const text = q.questionText || q.question || '';
                      const parts = [];
                      const regex = /\[\[pos_(.*?)\]\]/g;
                      let last = 0; let match; let idx = 0;
                      
                      while ((match = regex.exec(text)) !== null) {
                        if (match.index > last) parts.push({ type: 'text', content: text.slice(last, match.index) });
                        const posId = match[1];
                        parts.push({ type: 'position', positionId: `pos_${posId}`, index: idx++ });
                        last = match.index + match[0].length;
                      }
                      if (last < text.length) parts.push({ type: 'text', content: text.slice(last) });
                      
                      const contentData = q.content?.data || [];

                      return (
                        <div style={{ marginBottom: '16px' }}>
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
                              <div style={{ 
                                fontSize: '15px', 
                                fontWeight: 350,
                                lineHeight: '1.8',
                                color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                marginBottom: '16px'
                              }}>
                                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                                  Question {qIndex + 1}:
                                </div>
                                <div>
                                  {parts.map((part, pIdx) => {
                                    if (part.type === 'text') {
                                      return <span key={pIdx} dangerouslySetInnerHTML={{ __html: part.content || '' }} />;
                                    }
                                    
                                    // Get student answer and correct answer for this position
                                    const studentAnswer = studentAnswerObj[part.positionId] || '';
                                    const correctItem = contentData.find(item => {
                                      const itemPosId = String(item.positionId || '');
                                      const matchPosId = String(part.positionId);
                                      return itemPosId === matchPosId && item.correct;
                                    });
                                    const correctAnswer = correctItem?.value || '';
                                    const isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
                                    
                                    return (
                                      <React.Fragment key={pIdx}>
                                        {studentAnswer ? (
                                          <div
                                            style={{
                                              minWidth: '120px',
                                              height: '32px',
                                              margin: '0 8px',
                                              background: isCorrect 
                                                ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
                                                : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'),
                                              border: `2px solid ${
                                                isCorrect 
                                                  ? 'rgb(82, 196, 26)' 
                                                  : 'rgb(255, 77, 79)'
                                              }`,
                                              borderRadius: '8px',
                                              display: 'inline-block',
                                              padding: '4px 12px',
                                              fontSize: '15px',
                                              fontWeight: '350',
                                              color: isCorrect ? '#52c41a' : '#ff4d4f',
                                              cursor: 'not-allowed',
                                              transition: 'all 0.2s ease',
                                              verticalAlign: 'middle',
                                              lineHeight: '1.4',
                                              boxSizing: 'border-box',
                                              textAlign: 'center'
                                            }}
                                            dangerouslySetInnerHTML={{ __html: studentAnswer || '' }}
                                          />
                                        ) : (
                                          <div
                                            style={{
                                              minWidth: '120px',
                                              height: '32px',
                                              margin: '0 8px',
                                              background: '#ffffff',
                                              border: '2px dashed rgba(0, 0, 0, 0.3)',
                                              borderRadius: '8px',
                                              display: 'inline-block',
                                              padding: '4px 12px',
                                              fontSize: '15px',
                                              fontWeight: '350',
                                              color: 'rgba(0, 0, 0, 0.5)',
                                              cursor: 'not-allowed',
                                              verticalAlign: 'middle',
                                              lineHeight: '1.4',
                                              boxSizing: 'border-box',
                                              textAlign: 'center'
                                            }}
                                          >
                                            Empty
                                          </div>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Right Column - Available words (view only) */}
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
                                Available words:
                              </Typography.Text>
                              
                              <div style={{ 
                                display: 'flex', 
                                gap: '12px',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '120px'
                              }}>
                                {contentData.map((item, idx) => {
                                  // Check if this word is correct answer or wrong answer
                                  const itemValue = item?.value || '';
                                  const isCorrectWord = item?.correct === true;
                                  
                                  return (
                                    <div
                                      key={idx}
                                      style={{
                                        padding: '12px 20px',
                                        background: isCorrectWord
                                          ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)')
                                          : (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)'),
                                        border: `2px solid ${
                                          isCorrectWord
                                            ? '#52c41a'
                                            : '#ff4d4f'
                                        }`,
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: isCorrectWord
                                          ? '#52c41a'
                                          : '#ff4d4f',
                                        cursor: 'default',
                                        userSelect: 'none',
                                        transition: 'all 0.2s ease',
                                        minWidth: '80px',
                                        textAlign: 'center',
                                        boxShadow: isCorrectWord
                                          ? '0 2px 8px rgba(82, 196, 26, 0.25)'
                                          : '0 2px 8px rgba(255, 77, 79, 0.25)'
                                      }}
                                      dangerouslySetInnerHTML={{ __html: itemValue }}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : q.type === 'FILL_IN_THE_BLANK' ? (
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
                          const regex = /(\[\[pos_(.*?)\]\])/g;
                          let lastIndex = 0;
                          let match;
                          let inputIndex = 0;
                          
                          // Get student answers from prop or local state
                          const studentAnswerObj = studentAnswers?.[q.id] || {};
                          
                          while ((match = regex.exec(text)) !== null) {
                            if (match.index > lastIndex) {
                              const textContent = text.slice(lastIndex, match.index);
                              parts.push(
                                <span 
                                  key={`text_${inputIndex}`}
                                  className="question-text-content"
                                  dangerouslySetInnerHTML={{ __html: textContent }}
                                />
                              );
                            }
                            inputIndex += 1;
                            
                            // Get position ID
                            const positionIdNum = match[2];
                            const positionId = `pos_${positionIdNum}`;
                            
                            // Get correct answer
                            const contentData = q.content?.data || [];
                            const correctItem = contentData.find(item => {
                              const itemPosId = String(item.positionId || '');
                              const matchPosId = String(positionId);
                              return itemPosId === matchPosId && item.correct;
                            });
                            const correctAnswer = correctItem?.value || '';
                            
                            // Get student answer - check both formats
                            let studentAnswer = '';
                            if (typeof studentAnswerObj === 'object' && studentAnswerObj !== null) {
                              studentAnswer = studentAnswerObj[positionId] || studentAnswerObj[positionIdNum] || '';
                            } else if (typeof studentAnswerObj === 'string') {
                              studentAnswer = studentAnswerObj;
                            }
                            
                            // Compare answers (case-insensitive, trimmed)
                            const isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
                            
                            // Render the input box
                            parts.push(
                              <input
                                key={`fill_blank_input_${inputIndex}`}
                                type="text"
                                value={studentAnswer}
                                readOnly
                                disabled
                                style={{
                                  display: 'inline-block',
                                  minWidth: '120px',
                                  maxWidth: '200px',
                                  minHeight: '32px',
                                  padding: '4px 12px',
                                  margin: '0 8px',
                                  background: isCorrect 
                                    ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
                                    : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'),
                                  border: `2px solid ${
                                    isCorrect 
                                      ? 'rgb(82, 196, 26)' 
                                      : 'rgb(255, 77, 79)'
                                  }`,
                                  borderRadius: '8px',
                                  cursor: 'not-allowed',
                                  outline: 'none',
                                  lineHeight: '1.4',
                                  fontSize: '14px',
                                  boxSizing: 'border-box',
                                  textAlign: 'center',
                                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                  fontWeight: '400',
                                  verticalAlign: 'middle'
                                }}
                              />
                            );
                            
                            // Add correct answer next to input if wrong
                            if (!isCorrect && studentAnswer) {
                              parts.push(
                                <span 
                                  key={`answer_${inputIndex}`}
                                  style={{ 
                                    fontSize: '15px',
                                    color: '#52c41a',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    marginLeft: '8px'
                                  }}
                                >
                                  {correctAnswer}
                                </span>
                              );
                            }
                            
                            lastIndex = match.index + match[0].length;
                          }
                          if (lastIndex < text.length) {
                            const remainingText = text.slice(lastIndex);
                            parts.push(
                              <span 
                                key={`text_final_${inputIndex}`}
                                className="question-text-content"
                                dangerouslySetInnerHTML={{ __html: remainingText }}
                              />
                            );
                          }
                          return parts;
                        })()}
                      </div>
                    </div>
                  ) : q.type === 'REARRANGE' ? (
                    // Reorder Question - align behavior with single GV Rearrange
                    (() => {
                      // Get student answers from prop
                      const studentAnswer = studentAnswers?.[q.id] || [];
                      
                      // Get correct order from contentData (sorted by positionId)
                      const contentData = q.content?.data || [];
                      const correctOrder = contentData
                        .slice()
                        .sort((a, b) => {
                          const posA = parseInt((a.positionId || '').replace('pos_', ''));
                          const posB = parseInt((b.positionId || '').replace('pos_', ''));
                          return posA - posB;
                        })
                        .map(item => item.value)
                        .filter(Boolean);
                      
                      // Get student order
                      const studentOrder = Array.isArray(studentAnswer) 
                        ? studentAnswer 
                        : (typeof studentAnswer === 'object' && studentAnswer !== null
                            ? Object.keys(studentAnswer)
                                .sort((a, b) => parseInt(a) - parseInt(b))
                                .map(key => studentAnswer[key])
                                .filter(Boolean)
                            : []);
                      
                      // Check if student answer is correct
                      const isCorrect = studentOrder.length === correctOrder.length && 
                        studentOrder.every((word, idx) => 
                          word.trim().toLowerCase() === correctOrder[idx].trim().toLowerCase()
                        );
                      
                      // Remove placeholder tokens but keep HTML formatting
                      const displayText = ((q.questionText || q.question || 'Rearrange the words to form a correct sentence:')
                        .replace(/\[\[pos_.*?\]\]/g, '')).trim();
                      
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

                          {/* Student Answer Row */}
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
                              Your answer:
                            </Typography.Text>
                            
                            <div style={{ 
                              display: 'flex', 
                              flexWrap: 'wrap',
                              gap: '12px'
                            }}>
                              {studentOrder.length > 0 ? studentOrder.map((word, index) => (
                                <div
                                  key={index}
                                  style={{
                                    minWidth: '100px',
                                    height: '60px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: `2px solid ${
                                      isCorrect 
                                        ? '#52c41a' 
                                        : '#ff4d4f'
                                    }`,
                                    borderRadius: '8px',
                                    background: isCorrect
                                      ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)')
                                      : (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)'),
                                    position: 'relative',
                                    transition: 'all 0.3s ease',
                                    cursor: 'not-allowed'
                                  }}
                                >
                                  <span style={{ 
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: isCorrect ? '#52c41a' : '#ff4d4f',
                                    textAlign: 'center',
                                    padding: '8px 12px'
                                  }}>
                                    {word}
                                  </span>
                                </div>
                              )) : (
                                <Typography.Text style={{ 
                                  fontSize: '14px',
                                  color: 'rgba(0, 0, 0, 0.5)',
                                  fontStyle: 'italic'
                                }}>
                                  No answer provided
                                </Typography.Text>
                              )}
                            </div>
                          </div>

                          {/* Correct Answer Row (only show if wrong) */}
                          {!isCorrect && studentOrder.length > 0 && (
                            <div style={{
                              marginBottom: '24px',
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
                                Correct order:
                              </Typography.Text>
                              
                              <div style={{ 
                                display: 'flex', 
                                flexWrap: 'wrap',
                                gap: '12px'
                              }}>
                                {correctOrder.map((word, index) => (
                                  <div
                                    key={index}
                                    style={{
                                      minWidth: '100px',
                                      height: '60px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: '2px solid #52c41a',
                                      borderRadius: '8px',
                                      background: theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)',
                                      position: 'relative',
                                      transition: 'all 0.3s ease',
                                      cursor: 'default'
                                    }}
                                  >
                                    <span style={{ 
                                      fontSize: '14px',
                                      fontWeight: '600',
                                      color: '#52c41a',
                                      textAlign: 'center',
                                      padding: '8px 12px'
                                    }}>
                                      {word}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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

      {/* Feedback Button for Section */}
      {question.feedback && question.feedback.trim().length > 0 && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="default"
            icon={<MessageOutlined />}
            onClick={() => onViewFeedback?.(question.id, question.feedback)}
            style={{
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '14px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: `2px solid ${theme === 'sun' ? 'rgba(113, 179, 253, 0.4)' : 'rgba(138, 122, 255, 0.4)'}`,
              background: theme === 'sun' 
                ? 'rgba(113, 179, 253, 0.1)' 
                : 'rgba(138, 122, 255, 0.1)',
              color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
            }}
          >
            View Feedback
          </Button>
        </div>
      )}
    </div>
    </>
  );
};

// Listening Section Component
const ListeningSectionItem = ({ question, index, theme, onViewFeedback }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [droppedItems, setDroppedItems] = useState({});
  const [availableItems, setAvailableItems] = useState({});
  const [dragOverPosition, setDragOverPosition] = useState({});
  const [reorderStates, setReorderStates] = useState({});
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
          position: 'relative'
        }}>
          <Typography.Text strong style={{ 
            fontSize: '20px', 
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
          }}>
            {index + 1}. Listening Section
          </Typography.Text>
          <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
            ({question.points} {question.points > 1 ? 'points' : 'point'})
          </Typography.Text>
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
                {question.questions.map((q, qIndex) => (
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
                              const optionsForPosition = q.content?.data?.filter(opt => opt.positionId === positionId) || [];
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
                                    <option key={item.id} value={(item.value || '').replace(/<[^>]*>/g,' ')}>
                                      {(item.value || '').replace(/<[^>]*>/g,' ')}
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
                    ) : q.type === 'FILL_IN_THE_BLANK' ? (
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
                            parts.push(
                              <span key={`fib_${q.id}_${idx++}`} className="paragraph-input" contentEditable suppressContentEditableWarning style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:'120px', maxWidth:'200px', minHeight:'32px', padding:'4px 12px', margin:'4px 8px 6px 8px', background: theme==='sun'?'#E9EEFF94':'rgba(255,255,255,0.1)', border:`2px solid ${theme==='sun'?'#1890ff':'#8B5CF6'}`, borderRadius:'8px', cursor:'text', outline:'none', verticalAlign:'top', lineHeight:'1.4', fontSize:'14px', boxSizing:'border-box', color:'#000000', textAlign:'center' }} />
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
                        const questionId = `reorder_${q.id}`;
                        const currentState = reorderStates[questionId] || {
                          sourceItems: q.content?.data?.map(item => item.value) || [],
                          droppedItems: {},
                          dragOverIndex: null,
                          draggedItem: null,
                          isDraggingFromSource: false,
                          wasDropped: false
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

        {/* Feedback Button for Section */}
        {question.feedback && question.feedback.trim().length > 0 && (
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="default"
              icon={<MessageOutlined />}
              onClick={() => onViewFeedback?.(question.id, question.feedback)}
              style={{
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '14px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: `2px solid ${theme === 'sun' ? 'rgba(113, 179, 253, 0.4)' : 'rgba(138, 122, 255, 0.4)'}`,
                background: theme === 'sun' 
                  ? 'rgba(113, 179, 253, 0.1)' 
                  : 'rgba(138, 122, 255, 0.1)',
                color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
              }}
            >
              View Feedback
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

// Writing Section Component
const WritingSectionItem = ({ question, index, theme, studentAnswers }) => {
  // Get student answer from prop
  const studentAnswer = studentAnswers?.[question.id] || {};
  const studentEssayText = studentAnswer?.text || studentAnswer?.essay || '';
  const studentFiles = Array.isArray(studentAnswer?.files) ? studentAnswer.files : [];
  
  const [essayText, setEssayText] = useState(studentEssayText);
  const [uploadedFiles, setUploadedFiles] = useState(studentFiles);
  const [wordCount, setWordCount] = useState(0);
  const [writingMode, setWritingMode] = useState(studentEssayText || studentFiles.length > 0 ? 'handwriting' : null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showFeedbackSidebar, setShowFeedbackSidebar] = useState(false);

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

  // Initialize from student answers
  useEffect(() => {
    if (studentAnswer && Object.keys(studentAnswer).length > 0) {
      if (studentEssayText) {
        setEssayText(studentEssayText);
        setWritingMode('handwriting');
      }
      if (studentFiles.length > 0) {
        setUploadedFiles(studentFiles);
        if (!studentEssayText) {
          setWritingMode('upload');
        }
      }
    }
  }, [studentAnswer, studentEssayText, studentFiles]);

  // Render essay text with highlights for feedback
  const renderEssayWithHighlights = (text) => {
    if (!text || !question.feedbacks || question.feedbacks.length === 0) {
      return text;
    }

    // Sort feedbacks by start position
    const sortedFeedbacks = [...question.feedbacks].sort((a, b) => a.startIndex - b.startIndex);
    
    const parts = [];
    let lastIndex = 0;

    sortedFeedbacks.forEach((feedback, idx) => {
      // Add text before highlight
      if (feedback.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {text.substring(lastIndex, feedback.startIndex)}
          </span>
        );
      }

      // Add highlighted text
      const highlightedText = text.substring(feedback.startIndex, feedback.endIndex);
      parts.push(
        <span
          key={`highlight-${idx}`}
          onClick={() => {
            setSelectedFeedback(feedback);
            setShowFeedbackSidebar(true);
          }}
          style={{
            backgroundColor: '#FFEB3B',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '3px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            display: 'inline',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#FFD700';
            e.target.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#FFEB3B';
            e.target.style.transform = 'scale(1)';
          }}
        >
          {highlightedText}
        </span>
      );

      lastIndex = feedback.endIndex;
    });

    // Add remaining text after last highlight
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-final">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  const handleFileUpload = (event) => {
    // Disabled in result view
    if (studentAnswers) return;
    
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
    // Disabled in result view
    if (studentAnswers) return;
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleDownloadFile = async (file) => {
    const fileUrl = file.url || file.imageUrl;
    if (!fileUrl) return;
    
    const fileName = file.name || 'download';
    
    try {
      // If it's a File object (from input), download directly
      if (file instanceof File) {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }
      
      // If it's a blob URL (URL.createObjectURL), download directly
      if (fileUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // For relative or absolute URLs, fetch and create blob
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to fetch file');
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (fetchError) {
        // Fallback: open in new tab if fetch fails (CORS issues, etc.)
        window.open(fileUrl, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
      // Final fallback: open in new tab
      window.open(fileUrl, '_blank');
    }
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

        {/* Layout: Prompt | Essay */}
        <div style={{ display: 'flex', gap: '24px', minHeight: '600px', position: 'relative' }}>
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
                      }}>{line.match(/^\d+\./)[0]}</span>
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

          {/* Center Column - Writing Area */}
          <div style={{
            flex: '1',
            background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
            overflowY: 'auto',
            maxHeight: '600px'
          }}>
            <div style={{ padding: '20px' }}>
              {writingMode === null && !studentAnswers && !studentEssayText && studentFiles.length === 0 ? (
                /* Show 2 options initially - only if no student answers */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Handwriting Option */}
                  <div
                    onClick={() => !studentAnswers && setWritingMode('handwriting')}
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
              ) : (writingMode === 'handwriting' || studentEssayText) ? (
                /* Show textarea when handwriting mode or student has essay text */
                <div>
                  {!studentAnswers && (
                    <button
                      onClick={() => {
                        setWritingMode(null);
                        setEssayText('');
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
                  )}
                  {studentEssayText ? (
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
                          {studentAnswers ? 'Student Essay:' : 'Your Essay:'}
                        </label>
                        {!studentAnswers && (
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
                        )}
                      </div>
                      {studentAnswers && question.feedbacks && question.feedbacks.length > 0 ? (
                        // Show essay with highlights in result view
                        <div
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
                            background: theme === 'sun' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.05)',
                            color: theme === 'sun' ? '#333' : '#1F2937',
                            lineHeight: '1.8',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            boxShadow: theme === 'sun' 
                              ? '0 2px 8px rgba(24, 144, 255, 0.1)'
                              : '0 2px 8px rgba(138, 122, 255, 0.15)'
                          }}
                        >
                          {renderEssayWithHighlights(essayText)}
                        </div>
                      ) : (
                      <textarea
                        value={essayText}
                        onChange={(e) => !studentAnswers && setEssayText(e.target.value)}
                        placeholder={studentAnswers ? "No essay submitted" : "Start writing your essay here..."}
                        disabled={!!studentAnswers}
                        readOnly={!!studentAnswers}
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
                          background: studentAnswers 
                            ? (theme === 'sun' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.05)')
                            : (theme === 'sun' 
                              ? 'linear-gradient(135deg, #ffffff 0%, rgba(24, 144, 255, 0.02) 100%)'
                              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(138, 122, 255, 0.05) 100%)'),
                          color: theme === 'sun' ? '#333' : '#1F2937',
                          resize: 'vertical',
                          outline: 'none',
                          transition: 'all 0.3s ease',
                          cursor: studentAnswers ? 'default' : 'text',
                          boxShadow: theme === 'sun' 
                            ? '0 2px 8px rgba(24, 144, 255, 0.1)'
                            : '0 2px 8px rgba(138, 122, 255, 0.15)'
                        }}
                      />
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Show uploaded files - images preview for result view */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: studentEssayText ? '20px' : '0' }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    color: theme === 'sun' ? '#333' : '#1F2937'
                  }}>
                    {studentAnswers ? (studentEssayText ? 'Uploaded Images:' : 'Student Uploaded Images:') : 'Uploaded Files:'}
                  </div>
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    marginTop: '12px'
                  }}>
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id || file.name}
                        style={{
                          position: 'relative',
                          background: theme === 'sun' 
                            ? 'linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(64, 169, 255, 0.05) 100%)'
                            : 'linear-gradient(135deg, rgba(138, 122, 255, 0.12) 0%, rgba(167, 139, 250, 0.08) 100%)',
                          border: `1px solid ${theme === 'sun' 
                            ? 'rgba(24, 144, 255, 0.2)' 
                            : 'rgba(138, 122, 255, 0.25)'}`,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                          width: '100%'
                        }}
                      >
                        {/* Show image if it's an image file */}
                        {(file.type?.startsWith('image/') || file.url || file.imageUrl) && (
                          <div style={{ 
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            background: theme === 'sun' ? '#fafafa' : 'rgba(0, 0, 0, 0.2)',
                            padding: '20px',
                            minHeight: '400px'
                          }}>
                            <img
                              src={file.url || file.imageUrl || URL.createObjectURL(file)}
                              alt={file.name || 'Uploaded image'}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '600px',
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'contain',
                                display: 'block',
                                cursor: 'pointer',
                                borderRadius: '4px'
                              }}
                              onClick={() => handleDownloadFile(file)}
                              onError={(e) => {
                                // Hide image if failed to load
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div style={{
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: `1px solid ${theme === 'sun' 
                            ? 'rgba(24, 144, 255, 0.15)' 
                            : 'rgba(138, 122, 255, 0.2)'}`
                        }}>
                          <span style={{ 
                            color: theme === 'sun' ? '#333' : '#1F2937',
                            fontSize: '14px',
                            fontWeight: '500',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}>
                            {file.name || 'Image'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Download button for file name row */}
                            <button
                              onClick={() => handleDownloadFile(file)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '6px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                borderRadius: '6px',
                                transition: 'all 0.2s ease',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = theme === 'sun' 
                                  ? 'rgba(24, 144, 255, 0.1)' 
                                  : 'rgba(138, 122, 255, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                              title="Download file"
                            >
                              <DownloadOutlined />
                              <span style={{ fontSize: '14px' }}>Download</span>
                            </button>
                            {!studentAnswers && (
                              <button
                                onClick={() => removeFile(file.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ff4d4f',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  padding: '4px 8px',
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Feedback Sidebar - Outside main layout, positioned fixed on the right */}
        {showFeedbackSidebar && selectedFeedback && (
          <div style={{
            position: 'fixed',
            right: '24px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '350px',
            maxWidth: 'calc(100vw - 48px)',
            maxHeight: '80vh',
            background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.2)'}`,
            padding: '20px',
            overflowY: 'auto',
            boxShadow: theme === 'sun' 
              ? '0 4px 16px rgba(0, 0, 0, 0.15)'
              : '0 4px 16px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
          }}>
                {/* Feedback Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(0, 0, 0, 0.1)'}`
                }}>
                  <div>
                    <Typography.Text strong style={{
                      fontSize: '16px',
                      color: theme === 'sun' ? '#333' : '#1F2937'
                    }}>
                      Teacher Feedback
                    </Typography.Text>
                    <div style={{
                      fontSize: '12px',
                      color: theme === 'sun' ? '#999' : '#777',
                      marginTop: '4px'
                    }}>
                      {selectedFeedback.author || 'Teacher'} • {selectedFeedback.timestamp || new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setShowFeedbackSidebar(false);
                      setSelectedFeedback(null);
                    }}
                    style={{
                      minWidth: 'auto',
                      width: '32px',
                      height: '32px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  />
                </div>

                {/* Feedback Content */}
                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.8',
                  color: theme === 'sun' ? '#333' : '#1F2937',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  marginBottom: '16px'
                }}>
                  {selectedFeedback.comment || selectedFeedback.text || 'No feedback provided.'}
                </div>

                {/* Highlighted Text Reference */}
                {selectedFeedback.startIndex !== undefined && essayText && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: theme === 'sun' ? '#fff9c4' : 'rgba(255, 235, 59, 0.2)',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'sun' ? '#ffeb3b' : 'rgba(255, 235, 59, 0.5)'}`
                  }}>
                    <Typography.Text style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: theme === 'sun' ? '#666' : '#999',
                      display: 'block',
                      marginBottom: '6px'
                    }}>
                      Highlighted text:
                    </Typography.Text>
                    <Typography.Text style={{
                      fontSize: '13px',
                      color: theme === 'sun' ? '#333' : '#1F2937',
                      fontStyle: 'italic'
                    }}>
                      "{essayText.substring(selectedFeedback.startIndex, selectedFeedback.endIndex)}"
                    </Typography.Text>
                  </div>
                )}
          </div>
        )}
      </div>
    </>
  );
};

// Speaking Section Component
const SpeakingSectionItem = ({ question, index, theme, studentAnswers, onViewFeedback }) => {
  // Get student answer from prop
  const studentAnswer = studentAnswers?.[question.id] || {};
  const studentAudioUrl = studentAnswer?.audioUrl || studentAnswer?.audio || null;
  const studentFiles = Array.isArray(studentAnswer?.files) ? studentAnswer.files : [];
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(studentAudioUrl);
  const [uploadedFiles, setUploadedFiles] = useState(studentFiles);
  
  // Initialize from studentAnswers if present
  useEffect(() => {
    if (studentAnswer) {
      if (studentAudioUrl) {
        setAudioUrl(studentAudioUrl);
      }
      if (studentFiles.length > 0) {
        setUploadedFiles(studentFiles);
      }
    }
  }, [studentAnswer, studentAudioUrl, studentFiles]);

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
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event) => {
    // Disabled in result view
    if (studentAnswers) return;
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
    // Disabled in result view
    if (studentAnswers) return;
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const removeRecording = () => {
    // Disabled in result view
    if (studentAnswers) return;
    setAudioUrl(null);
  };
  
  const handleDownloadFile = async (file) => {
    const fileUrl = file.url || file.audioUrl;
    if (!fileUrl) return;
    
    const fileName = file.name || 'download';
    
    try {
      // If it's a File object (from input), download directly
      if (file instanceof File) {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }
      
      // If it's a blob URL (URL.createObjectURL), download directly
      if (fileUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // For relative or absolute URLs, fetch and create blob
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to fetch file');
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (fetchError) {
        // Fallback: open in new tab if fetch fails (CORS issues, etc.)
        window.open(fileUrl, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
      // Final fallback: open in new tab
      window.open(fileUrl, '_blank');
    }
  };

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
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: theme === 'sun' ? '#333' : '#1F2937'
                }}>
                  {studentAnswers ? 'Student Recorded Audio:' : 'Your Recording:'}
                </div>
                <audio controls style={{ width: '100%', height: '40px' }}>
                  <source src={audioUrl} type="audio/mpeg" />
                  <source src={audioUrl} type="audio/wav" />
                  <source src={audioUrl} type="audio/mp3" />
                  Your browser does not support the audio element.
                </audio>
                {!studentAnswers && (
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

            {/* Mic Button - Large and Centered - Only show if no student answers */}
            {!studentAnswers && (
              <>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={studentAnswers}
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    border: 'none',
                    background: isRecording 
                      ? '#ff4d4f'
                      : 'rgb(227, 244, 255)',
                    color: 'white',
                    cursor: studentAnswers ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: isRecording
                      ? '0 0 20px rgba(255, 77, 79, 0.5)'
                      : '0 4px 12px rgba(24, 144, 255, 0.3)',
                    transition: 'all 0.3s ease',
                    opacity: studentAnswers ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isRecording && !studentAnswers) {
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

                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme === 'sun' ? '#1E40AF' : '#8B5CF6',
                  marginBottom: '8px'
                }}>
                  {isRecording ? 'Recording...' : 'Click to start recording'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme === 'sun' ? '#666' : '#999'
                }}>
                  {isRecording ? 'Click the microphone again to stop' : 'Press the microphone to record your response'}
                </div>
              </>
            )}

            {/* Upload Section - Similar to Writing - Only show if no student answers */}
            {!studentAnswers && (
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
                    disabled={studentAnswers}
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
                      cursor: studentAnswers ? 'not-allowed' : 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      opacity: studentAnswers ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!studentAnswers) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = theme === 'sun' 
                          ? '0 4px 12px rgba(82, 196, 26, 0.2)'
                          : '0 4px 12px rgba(138, 122, 255, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!studentAnswers) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
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
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: theme === 'sun' ? '#333' : '#1F2937'
                }}>
                  {studentAnswers ? 'Student Uploaded Audio Files:' : 'Uploaded Audio Files:'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id || file.name}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        padding: '16px',
                        background: theme === 'sun' 
                          ? 'linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(64, 169, 255, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(138, 122, 255, 0.12) 0%, rgba(167, 139, 250, 0.08) 100%)',
                        border: `1px solid ${theme === 'sun' 
                          ? 'rgba(24, 144, 255, 0.2)' 
                          : 'rgba(138, 122, 255, 0.25)'}`,
                        borderRadius: '8px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <span style={{ fontSize: '20px' }}>🎵</span>
                          <span style={{ 
                            color: theme === 'sun' ? '#333' : '#1F2937',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}>
                            {file.name || 'Audio file'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleDownloadFile(file)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                              cursor: 'pointer',
                              fontSize: '16px',
                              padding: '6px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              borderRadius: '6px',
                              transition: 'all 0.2s ease',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = theme === 'sun' 
                                ? 'rgba(24, 144, 255, 0.1)' 
                                : 'rgba(138, 122, 255, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            title="Download audio file"
                          >
                            <DownloadOutlined />
                            <span style={{ fontSize: '14px' }}>Download</span>
                          </button>
                          {!studentAnswers && (
                            <button
                              onClick={() => removeFile(file.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ff4d4f',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '4px 8px',
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Audio player for uploaded file */}
                      {(file.url || file.audioUrl) && (
                        <audio 
                          controls 
                          style={{ width: '100%', height: '40px', marginTop: '8px' }}
                        >
                          <source src={file.url || file.audioUrl} type="audio/mpeg" />
                          <source src={file.url || file.audioUrl} type="audio/wav" />
                          <source src={file.url || file.audioUrl} type="audio/mp3" />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Button for Section */}
        {question.feedback && question.feedback.trim().length > 0 && (
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="default"
              icon={<MessageOutlined />}
              onClick={() => onViewFeedback?.(question.id, question.feedback)}
              style={{
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '14px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: `2px solid ${theme === 'sun' ? 'rgba(113, 179, 253, 0.4)' : 'rgba(138, 122, 255, 0.4)'}`,
                background: theme === 'sun' 
                  ? 'rgba(113, 179, 253, 0.1)' 
                  : 'rgba(138, 122, 255, 0.1)',
                color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
              }}
            >
              View Feedback
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

// Speaking With Audio Section Component
const SpeakingWithAudioSectionItem = ({ question, index, theme, studentAnswers, onViewFeedback }) => {
  // Get student answer from prop
  const studentAnswer = studentAnswers?.[question.id] || {};
  const studentAudioUrl = studentAnswer?.audioUrl || studentAnswer?.audio || null;
  const studentFiles = Array.isArray(studentAnswer?.files) ? studentAnswer.files : [];
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(studentAudioUrl);
  const [uploadedFiles, setUploadedFiles] = useState(studentFiles);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  // Initialize from studentAnswers if present
  useEffect(() => {
    if (studentAnswer) {
      if (studentAudioUrl) {
        setAudioUrl(studentAudioUrl);
      }
      if (studentFiles.length > 0) {
        setUploadedFiles(studentFiles);
      }
    }
  }, [studentAnswer, studentAudioUrl, studentFiles]);

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
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event) => {
    // Disabled in result view
    if (studentAnswers) return;
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
    // Disabled in result view
    if (studentAnswers) return;
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const removeRecording = () => {
    // Disabled in result view
    if (studentAnswers) return;
    setAudioUrl(null);
  };
  
  const handleDownloadFile = async (file) => {
    const fileUrl = file.url || file.audioUrl;
    if (!fileUrl) return;
    
    const fileName = file.name || 'download';
    
    try {
      // If it's a File object (from input), download directly
      if (file instanceof File) {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }
      
      // If it's a blob URL (URL.createObjectURL), download directly
      if (fileUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // For relative or absolute URLs, fetch and create blob
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to fetch file');
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (fetchError) {
        // Fallback: open in new tab if fetch fails (CORS issues, etc.)
        window.open(fileUrl, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
      // Final fallback: open in new tab
      window.open(fileUrl, '_blank');
    }
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
          <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
            ({question.points} {question.points > 1 ? 'points' : 'point'})
          </Typography.Text>
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
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: theme === 'sun' ? '#333' : '#1F2937'
                }}>
                  {studentAnswers ? 'Student Recorded Audio:' : 'Your Recording:'}
                </div>
                <audio controls style={{ width: '100%', height: '40px' }}>
                  <source src={audioUrl} type="audio/mpeg" />
                  <source src={audioUrl} type="audio/wav" />
                  <source src={audioUrl} type="audio/mp3" />
                  Your browser does not support the audio element.
                </audio>
                {!studentAnswers && (
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

            {/* Mic Button - Large and Centered - Only show if no student answers */}
            {!studentAnswers && (
              <>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={studentAnswers}
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    border: 'none',
                    background: isRecording 
                      ? '#ff4d4f'
                      : 'rgb(227, 244, 255)',
                    color: 'white',
                    cursor: studentAnswers ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: isRecording
                      ? '0 0 20px rgba(255, 77, 79, 0.5)'
                      : '0 4px 12px rgba(24, 144, 255, 0.3)',
                    transition: 'all 0.3s ease',
                    opacity: studentAnswers ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isRecording && !studentAnswers) {
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

                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme === 'sun' ? '#1E40AF' : '#8B5CF6',
                  marginBottom: '8px'
                }}>
                  {isRecording ? 'Recording...' : 'Click to start recording'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme === 'sun' ? '#666' : '#999'
                }}>
                  {isRecording ? 'Click the microphone again to stop' : 'Press the microphone to record your response'}
                </div>
              </>
            )}

            {/* Upload Section - Similar to Writing - Only show if no student answers */}
            {!studentAnswers && (
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
                    disabled={studentAnswers}
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
                      cursor: studentAnswers ? 'not-allowed' : 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      opacity: studentAnswers ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!studentAnswers) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = theme === 'sun' 
                          ? '0 4px 12px rgba(82, 196, 26, 0.2)'
                          : '0 4px 12px rgba(138, 122, 255, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!studentAnswers) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
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
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: theme === 'sun' ? '#333' : '#1F2937'
                }}>
                  {studentAnswers ? 'Student Uploaded Audio Files:' : 'Uploaded Audio Files:'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id || file.name}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        padding: '16px',
                        background: theme === 'sun' 
                          ? 'linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(64, 169, 255, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(138, 122, 255, 0.12) 0%, rgba(167, 139, 250, 0.08) 100%)',
                        border: `1px solid ${theme === 'sun' 
                          ? 'rgba(24, 144, 255, 0.2)' 
                          : 'rgba(138, 122, 255, 0.25)'}`,
                        borderRadius: '8px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <span style={{ fontSize: '20px' }}>🎵</span>
                          <span style={{ 
                            color: theme === 'sun' ? '#333' : '#1F2937',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}>
                            {file.name || 'Audio file'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleDownloadFile(file)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                              cursor: 'pointer',
                              fontSize: '16px',
                              padding: '6px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              borderRadius: '6px',
                              transition: 'all 0.2s ease',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = theme === 'sun' 
                                ? 'rgba(24, 144, 255, 0.1)' 
                                : 'rgba(138, 122, 255, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            title="Download audio file"
                          >
                            <DownloadOutlined />
                            <span style={{ fontSize: '14px' }}>Download</span>
                          </button>
                          {!studentAnswers && (
                            <button
                              onClick={() => removeFile(file.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ff4d4f',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '4px 8px',
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Audio player for uploaded file */}
                      {(file.url || file.audioUrl) && (
                        <audio 
                          controls 
                          style={{ width: '100%', height: '40px', marginTop: '8px' }}
                        >
                          <source src={file.url || file.audioUrl} type="audio/mpeg" />
                          <source src={file.url || file.audioUrl} type="audio/wav" />
                          <source src={file.url || file.audioUrl} type="audio/mp3" />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Button for Section */}
        {question.feedback && question.feedback.trim().length > 0 && (
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="default"
              icon={<MessageOutlined />}
              onClick={() => onViewFeedback?.(question.id, question.feedback)}
              style={{
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '14px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: `2px solid ${theme === 'sun' ? 'rgba(113, 179, 253, 0.4)' : 'rgba(138, 122, 255, 0.4)'}`,
                background: theme === 'sun' 
                  ? 'rgba(113, 179, 253, 0.1)' 
                  : 'rgba(138, 122, 255, 0.1)',
                color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
              }}
            >
              View Feedback
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

// Multiple Choice Container Component (Result View)
const MultipleChoiceContainer = ({ theme, data, studentAnswer, studentAnswers, onViewFeedback }) => {
  const questionText = data?.question || data?.questionText || 'What is the capital city of Vietnam?';
  const optionsFromApi = Array.isArray(data?.options) && data.options.length > 0
    ? data.options
    : null;
  
  // Get the answer selected by student (use studentAnswer prop or look up by question id)
  const selectedKey = studentAnswer || studentAnswers?.[data?.id] || null;
  
  // Find correct answer
  const correctOption = optionsFromApi?.find(opt => opt.isCorrect);
  const correctKey = correctOption?.key;
  
  // Check if student answer is correct
  const isCorrect = selectedKey === correctKey;
  
  // Check if student left the answer blank (no answer provided)
  const isBlank = selectedKey === null || selectedKey === undefined || selectedKey === '';

  // Check if there's feedback
  const hasFeedback = data?.feedback && data.feedback.trim().length > 0;

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
          {(optionsFromApi || ['A','B','C','D'].map((k, i) => ({ key: k, text: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho'][i] }))).map((opt, idx) => {
            const key = opt.key || String.fromCharCode(65 + idx);
            const isCorrectAnswer = key === correctKey;
            const isSelected = selectedKey === key;
            const isSelectedWrong = isSelected && !isCorrectAnswer;
            
            // Show all options, but style them differently
            return (
              <div
                key={idx}
                className={`option-item ${isCorrectAnswer ? 'correct-answer' : isSelectedWrong ? 'wrong-answer' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: isBlank && isCorrectAnswer
                    ? (theme === 'sun' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.25)')
                    : isCorrectAnswer
                      ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)')
                      : isSelectedWrong
                        ? (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)')
                        : theme === 'sun'
                          ? 'rgba(255, 255, 255, 0.85)'
                          : 'rgba(255, 255, 255, 0.7)',
                  border: `2px solid ${
                    isBlank && isCorrectAnswer
                      ? 'rgb(255, 193, 7)'
                      : isCorrectAnswer
                        ? (theme === 'sun' ? 'rgb(82, 196, 26)' : 'rgb(82, 196, 26)')
                        : isSelectedWrong
                          ? 'rgb(255, 77, 79)'
                      : theme === 'sun' 
                        ? 'rgba(113, 179, 253, 0.2)' 
                        : 'rgba(138, 122, 255, 0.15)'
                  }`,
        borderRadius: '12px',
        boxShadow: theme === 'sun' 
                    ? `0 2px 6px ${isBlank && isCorrectAnswer ? 'rgba(255, 193, 7, 0.3)' : isCorrectAnswer ? 'rgba(82, 196, 26, 0.25)' : isSelectedWrong ? 'rgba(255, 77, 79, 0.25)' : 'rgba(113, 179, 253, 0.08)'}`
                    : `0 2px 6px ${isBlank && isCorrectAnswer ? 'rgba(255, 193, 7, 0.4)' : isCorrectAnswer ? 'rgba(82, 196, 26, 0.35)' : isSelectedWrong ? 'rgba(255, 77, 79, 0.35)' : 'rgba(138, 122, 255, 0.08)'}`,
                  fontSize: '14px',
                  fontWeight: '350',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'default',
                  minHeight: '50px',
                  boxSizing: 'border-box'
                }}
              >
                <input 
                  type="radio" 
                  name={`question-result-${data?.id || idx}`}
                  checked={isSelected || (isBlank && isCorrectAnswer) || (!isBlank && isCorrectAnswer && !isSelected)}
                  disabled
                  style={{ 
                    width: '18px',
                    height: '18px',
                    accentColor: isBlank && isCorrectAnswer ? '#ffc107' : (isCorrectAnswer ? '#52c41a' : (isSelectedWrong ? '#ff4d4f' : (theme === 'sun' ? '#1890ff' : '#8B5CF6'))),
                    cursor: 'not-allowed',
                    opacity: 1
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
                {isSelectedWrong && (
                  <CloseCircleOutlined style={{
                    fontSize: '22px',
                    color: '#ff4d4f',
                    marginLeft: 'auto',
                    fontWeight: 'bold'
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Feedback Button */}
        <FeedbackButton
          theme={theme}
          hasFeedback={hasFeedback}
          questionId={data?.id}
          feedback={data?.feedback}
          onViewFeedback={onViewFeedback}
        />
      </div>
    </div>
  );
};

// Multiple Select Container Component (Result View)
const MultipleSelectContainer = ({ theme, data, studentAnswers, onViewFeedback }) => {
  const questionText = data?.question || data?.questionText || 'Which of the following are Southeast Asian countries? (Select all that apply)';
  const optionsFromApi = Array.isArray(data?.options) && data.options.length > 0 ? data.options : null;

  // Get the answers selected by student
  const selectedKeys = Array.isArray(studentAnswers?.[data?.id]) ? studentAnswers[data.id] : [];
  
  // Find correct answers
  const correctOptions = optionsFromApi?.filter(opt => opt.isCorrect) || [];
  const correctKeys = correctOptions.map(opt => opt.key);
  
  // Check if student left the answer blank (no answer provided)
  const isBlank = selectedKeys.length === 0;
  
  // Check which selected answers are correct/wrong
  const selectedCorrect = selectedKeys.filter(k => correctKeys.includes(k));
  const selectedWrong = selectedKeys.filter(k => !correctKeys.includes(k));
  const missingCorrect = correctKeys.filter(k => !selectedKeys.includes(k));

  // Check if there's feedback
  const hasFeedback = data?.feedback && data.feedback.trim().length > 0;

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
          {(optionsFromApi || ['A','B','C','D'].map((k,i)=>({ key:k, text: ['Vietnam','Thailand','Japan','Malaysia'][i] }))).map((opt, idx) => {
            const key = opt.key || String.fromCharCode(65 + idx);
            const isCorrect = correctKeys.includes(key);
            const wasSelected = selectedKeys.includes(key);
            const isCorrectSelected = isCorrect && wasSelected;
            const isWrongSelected = !isCorrect && wasSelected;
            const isCorrectMissing = isCorrect && !wasSelected;
            
            // Show all options
            return (
              <div
                key={idx}
                className={`option-item ${isCorrectSelected ? 'correct-answer' : isWrongSelected ? 'wrong-answer' : isCorrectMissing ? 'correct-missing' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: isBlank && isCorrect
                    ? (theme === 'sun' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.25)')
                    : isCorrectSelected || isCorrectMissing
                      ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
                      : isWrongSelected
                        ? (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)')
                        : theme === 'sun'
                          ? 'rgba(255, 255, 255, 0.85)'
                          : 'rgba(255, 255, 255, 0.7)',
                  border: `2px solid ${
                    isBlank && isCorrect
                      ? 'rgb(255, 193, 7)'
                      : isCorrectSelected || isCorrectMissing
                        ? (theme === 'sun' ? 'rgb(82, 196, 26)' : 'rgb(82, 196, 26)')
                        : isWrongSelected
                          ? (theme === 'sun' ? 'rgb(255, 77, 79)' : 'rgb(255, 77, 79)')
                      : theme === 'sun' 
                        ? 'rgba(113, 179, 253, 0.2)' 
                        : 'rgba(138, 122, 255, 0.15)'
                  }`,
                  borderRadius: '12px',
                  boxShadow: theme === 'sun' 
                    ? `0 2px 6px ${isBlank && isCorrect ? 'rgba(255, 193, 7, 0.3)' : isCorrectSelected || isCorrectMissing ? 'rgba(82, 196, 26, 0.2)' : isWrongSelected ? 'rgba(255, 77, 79, 0.2)' : 'rgba(113, 179, 253, 0.08)'}`
                    : `0 2px 6px ${isBlank && isCorrect ? 'rgba(255, 193, 7, 0.4)' : isCorrectSelected || isCorrectMissing ? 'rgba(82, 196, 26, 0.3)' : isWrongSelected ? 'rgba(255, 77, 79, 0.3)' : 'rgba(138, 122, 255, 0.08)'}`,
                  fontSize: '14px',
                  fontWeight: '350',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'default',
                  minHeight: '50px',
                  boxSizing: 'border-box'
                }}
              >
                         <input 
                           type="checkbox" 
                           checked={wasSelected || (!isBlank && isCorrectMissing) || (isBlank && isCorrect)}
                           disabled
                           style={{ 
                             width: '18px',
                             height: '18px',
                             accentColor: isBlank && isCorrect ? '#ffc107' : (isCorrectSelected || (!isBlank && isCorrectMissing) ? '#52c41a' : (isWrongSelected ? '#ff4d4f' : (theme === 'sun' ? '#1890ff' : '#8B5CF6'))),
                             cursor: 'not-allowed',
                             opacity: 1
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
                {isWrongSelected && (
                  <CloseCircleOutlined style={{
                    fontSize: '20px',
                    color: '#ff4d4f',
                    marginLeft: 'auto'
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Feedback Button */}
        <FeedbackButton
          theme={theme}
          hasFeedback={hasFeedback}
          questionId={data?.id}
          feedback={data?.feedback}
          onViewFeedback={onViewFeedback}
        />
      </div>
    </div>
  );
};

// True/False Container Component (Result View)
const TrueFalseContainer = ({ theme, data, studentAnswer, studentAnswers, onViewFeedback }) => {
  const questionText = data?.question || data?.questionText || 'The Earth revolves around the Sun.';
  
  // Get the answer selected by student
  const selectedKey = studentAnswer || studentAnswers?.[data?.id] || null;
  
  // Find correct answer from options
  const optionsFromApi = Array.isArray(data?.options) && data.options.length > 0 ? data.options : null;
  const correctOption = optionsFromApi?.find(opt => opt.isCorrect);
  
  // Determine correct key - handle different formats
  let correctKey = null;
  if (correctOption) {
    // If key is 'True' or 'False', use it directly
    if (correctOption.key === 'True' || correctOption.key === 'False') {
      correctKey = correctOption.key;
    }
    // If text is 'True' or 'False', use text
    else if (correctOption.text === 'True' || correctOption.text === 'False') {
      correctKey = correctOption.text;
    }
    // Fallback to key
    else {
      correctKey = correctOption.key;
    }
  }
  
  // Fallback: if still no correctKey, default to first option (shouldn't happen in real data)
  if (!correctKey && optionsFromApi && optionsFromApi.length > 0) {
    const firstOption = optionsFromApi[0];
    correctKey = firstOption.key === 'True' || firstOption.key === 'False' 
      ? firstOption.key 
      : (firstOption.text === 'True' || firstOption.text === 'False' ? firstOption.text : firstOption.key);
  }
  
  // Check if student answer is correct
  const isCorrect = selectedKey === correctKey;
  
  // Check if student left the answer blank (no answer provided)
  const isBlank = selectedKey === null || selectedKey === undefined || selectedKey === '';

  // Check if there's feedback
  const hasFeedback = data?.feedback && data.feedback.trim().length > 0;

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
          {['True', 'False'].map((option) => {
            // Check if this option is the correct answer
            const isCorrectAnswer = correctKey && option === correctKey;
            const isSelected = selectedKey && selectedKey === option;
            const isSelectedWrong = isSelected && !isCorrectAnswer;
            
            // Always show all options, but highlight correctly
            return (
              <div
                key={option}
                className={`option-item ${isCorrectAnswer ? 'correct-answer' : isSelectedWrong ? 'wrong-answer' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: isBlank && isCorrectAnswer
                    ? (theme === 'sun' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.25)')
                    : isCorrectAnswer
                      ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)')
                      : isSelectedWrong
                        ? (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)')
                        : theme === 'sun'
                          ? 'rgba(255, 255, 255, 0.85)'
                          : 'rgba(255, 255, 255, 0.7)',
                  border: `2px solid ${
                    isBlank && isCorrectAnswer
                      ? 'rgb(255, 193, 7)'
                      : isCorrectAnswer
                        ? (theme === 'sun' ? 'rgb(82, 196, 26)' : 'rgb(82, 196, 26)')
                        : isSelectedWrong
                          ? 'rgb(255, 77, 79)'
                      : theme === 'sun' 
                        ? 'rgba(113, 179, 253, 0.2)' 
                        : 'rgba(138, 122, 255, 0.15)'
                  }`,
                  borderRadius: '12px',
                  boxShadow: theme === 'sun' 
                    ? `0 2px 6px ${isBlank && isCorrectAnswer ? 'rgba(255, 193, 7, 0.3)' : isCorrectAnswer ? 'rgba(82, 196, 26, 0.25)' : isSelectedWrong ? 'rgba(255, 77, 79, 0.25)' : 'rgba(113, 179, 253, 0.08)'}`
                    : `0 2px 6px ${isBlank && isCorrectAnswer ? 'rgba(255, 193, 7, 0.4)' : isCorrectAnswer ? 'rgba(82, 196, 26, 0.35)' : isSelectedWrong ? 'rgba(255, 77, 79, 0.35)' : 'rgba(138, 122, 255, 0.08)'}`,
                  fontSize: '14px',
                  fontWeight: '350',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'default',
                  minHeight: '50px',
                  boxSizing: 'border-box'
                }}
              >
                <input 
                  type="radio" 
                  name={`question-result-${data?.id || option}`}
                  checked={isSelected || (isBlank && isCorrectAnswer) || (!isBlank && isCorrectAnswer && !isSelected)}
                  disabled
                  style={{ 
                    width: '18px',
                    height: '18px',
                    accentColor: isBlank && isCorrectAnswer ? '#ffc107' : (isCorrectAnswer ? '#52c41a' : (isSelectedWrong ? '#ff4d4f' : (theme === 'sun' ? '#1890ff' : '#8B5CF6'))),
                    cursor: 'not-allowed',
                    opacity: 1
                  }} 
                />
                <span style={{ 
                  flexShrink: 0, 
                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                  fontWeight: '600',
                  fontSize: '16px'
                }}>
                  {option === 'True' ? 'A' : 'B'}.
                </span>
                <Typography.Text style={{ 
                  fontSize: '14px',
                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                  fontWeight: '350',
                  flex: 1
                }}>
                  {option}
                </Typography.Text>
                {isSelectedWrong && (
                  <CloseCircleOutlined style={{
                    fontSize: '22px',
                    color: '#ff4d4f',
                    marginLeft: 'auto',
                    fontWeight: 'bold'
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Feedback Button */}
        <FeedbackButton
          theme={theme}
          hasFeedback={hasFeedback}
          questionId={data?.id}
          feedback={data?.feedback}
          onViewFeedback={onViewFeedback}
        />
      </div>
    </div>
  );
};

// Dropdown Container Component
const DropdownContainer = ({ theme, data, studentAnswers, onViewFeedback }) => {
  const questionText = data?.questionText || data?.question || 'Choose the correct words to complete the sentence:';
  const contentData = Array.isArray(data?.content?.data) ? data.content.data : [];
  
  // Get student answers
  const studentAnswerObj = studentAnswers?.[data?.id] || {};

  // Check if there's feedback
  const hasFeedback = data?.feedback && data.feedback.trim().length > 0;

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
              const opts = contentData
                .filter(it => {
                  const itPosId = String(it.positionId || '');
                  const matchPosId = String(positionId);
                  return itPosId === matchPosId;
                });

              // Get correct answer and student answer
              const correctItem = opts.find(it => it.correct);
              const correctAnswer = correctItem?.value || '';
              
              // Get student answer
              const studentAnswer = studentAnswerObj[positionId] || '';
              
              // Compare answers
              const isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
              
              // Get all option values
              const optionValues = opts.map(it => it.value).filter(Boolean);

              // Add dropdown
              parts.push(
                <select
                  key={`select-${partIndex++}`}
                  value={studentAnswer || ''}
                  disabled
                  style={{
                    display: 'inline-block',
                    minWidth: '120px',
                    height: '32px',
                    padding: '4px 12px',
                    margin: '0 8px',
                    background: isCorrect 
                      ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
                      : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'),
                    border: `2px solid ${
                      isCorrect 
                        ? 'rgb(82, 196, 26)' 
                        : 'rgb(255, 77, 79)'
                    }`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: isCorrect ? '#52c41a' : '#ff4d4f',
                    cursor: 'not-allowed',
                    outline: 'none',
                    verticalAlign: 'middle',
                    textAlign: 'center',
                    textAlignLast: 'center',
                  }}
                >
                  <option value="" disabled hidden style={{ textAlign: 'center' }}>
                    Select
                  </option>
                  {optionValues.map((opt, idx) => (
                    <option key={idx} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              );

              // Add correct answer next to dropdown if wrong
              if (!isCorrect && studentAnswer) {
                parts.push(
                  <span 
                    key={`answer-${partIndex++}`} 
                    style={{ 
                      fontSize: '15px',
                      color: '#52c41a',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      marginLeft: '8px'
                    }}
                  >
                    {correctAnswer}
                  </span>
                );
              }

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

      {/* Feedback Button */}
      <FeedbackButton
        theme={theme}
        hasFeedback={hasFeedback}
        questionId={data?.id}
        feedback={data?.feedback}
        onViewFeedback={onViewFeedback}
      />
    </div>
  );
};

// Drag and Drop Container Component
const DragDropContainer = ({ theme, data, studentAnswers, onViewFeedback }) => {
  const contentData = Array.isArray(data?.content?.data) ? data.content.data : [];
  const studentAnswerObj = studentAnswers?.[data?.id] || {};

  // Check if there's feedback
  const hasFeedback = data?.feedback && data.feedback.trim().length > 0;


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
          Question {data?.orderNumber || '?'}
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
          Complete the sentence:
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
                parts.map((part, pIdx) => {
                  if (part.type === 'text') {
                    return <span key={pIdx} dangerouslySetInnerHTML={{ __html: part.content || '' }} />;
                  }
                  
                  // Get student answer and correct answer for this position
                  const studentAnswer = studentAnswerObj[part.positionId] || '';
                  const correctItem = contentData.find(item => item.positionId === part.positionId && item.correct);
                  const correctAnswer = correctItem?.value || '';
                  const isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
                  
                  return (
                  <React.Fragment key={pIdx}>
                      {studentAnswer ? (
                        <div
                          style={{
                            minWidth: '120px',
                            height: '32px',
                            margin: '0 8px',
                            background: isCorrect 
                              ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
                              : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'),
                            border: `2px solid ${
                              isCorrect 
                                ? 'rgb(82, 196, 26)' 
                                : 'rgb(255, 77, 79)'
                            }`,
                            borderRadius: '8px',
                            display: 'inline-block',
                            padding: '4px 12px',
                            fontSize: '15px',
                            fontWeight: '350',
                            color: isCorrect ? '#52c41a' : '#ff4d4f',
                            cursor: 'not-allowed',
                            transition: 'all 0.2s ease',
                            verticalAlign: 'middle',
                            lineHeight: '1.4',
                            boxSizing: 'border-box',
                            textAlign: 'center'
                          }}
                          dangerouslySetInnerHTML={{ __html: studentAnswer || '' }}
                        />
                      ) : (
                        <div
                          style={{
                            minWidth: '120px',
                            height: '32px',
                            margin: '0 8px',
                            background: '#ffffff',
                            border: '2px dashed rgba(0, 0, 0, 0.3)',
                            borderRadius: '8px',
                            display: 'inline-block',
                            padding: '4px 12px',
                            fontSize: '15px',
                            fontWeight: '350',
                            color: 'rgba(0, 0, 0, 0.5)',
                            cursor: 'not-allowed',
                            verticalAlign: 'middle',
                            lineHeight: '1.4',
                            boxSizing: 'border-box',
                            textAlign: 'center'
                          }}
                        >
                          Empty
                        </div>
                    )}
                  </React.Fragment>
                  );
                })
              ) : null}
            </div>
          </div>

          {/* Right Column - Available words (view only) */}
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
              Available words:
            </Typography.Text>
            
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '120px'
            }}>
              {contentData.map((item, idx) => {
                // Check if this word is correct answer or wrong answer
                const itemValue = item?.value || '';
                const isCorrectWord = item?.correct === true;
                
                return (
                <div
                  key={idx}
                  style={{
                    padding: '12px 20px',
                      background: isCorrectWord
                        ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)')
                        : (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)'),
                      border: `2px solid ${
                        isCorrectWord
                          ? '#52c41a'
                          : '#ff4d4f'
                      }`,
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                      color: isCorrectWord
                        ? '#52c41a'
                        : '#ff4d4f',
                      cursor: 'default',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                    minWidth: '80px',
                    textAlign: 'center',
                      boxShadow: isCorrectWord
                        ? '0 2px 8px rgba(82, 196, 26, 0.25)'
                        : '0 2px 8px rgba(255, 77, 79, 0.25)'
                    }}
                    dangerouslySetInnerHTML={{ __html: itemValue }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Button */}
      <FeedbackButton
        theme={theme}
        hasFeedback={hasFeedback}
        questionId={data?.id}
        feedback={data?.feedback}
        onViewFeedback={onViewFeedback}
      />
    </div>
  );
};

// Reorder Container Component
const ReorderContainer = ({ theme, data, studentAnswers, onViewFeedback }) => {
  const contentData = Array.isArray(data?.content?.data) ? data.content.data : [];
  
  // Check if there's feedback
  const hasFeedback = data?.feedback && data.feedback.trim().length > 0;
  
  // Get correct order from contentData (sorted by positionId)
  const correctOrder = React.useMemo(() => {
    return contentData
      .slice()
      .sort((a, b) => {
        const posA = parseInt((a.positionId || '').replace('pos_', ''));
        const posB = parseInt((b.positionId || '').replace('pos_', ''));
        return posA - posB;
      })
      .map(item => item.value)
      .filter(Boolean);
  }, [contentData]);
  
  // Get student answer order
  const studentOrder = React.useMemo(() => {
    const answer = studentAnswers?.[data?.id];
    if (Array.isArray(answer)) {
      return answer;
    } else if (typeof answer === 'object' && answer !== null) {
      // Convert object with numeric keys to array
      return Object.keys(answer)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(key => answer[key])
        .filter(Boolean);
    }
    return [];
  }, [studentAnswers, data?.id]);
  
  // Check if student answer is correct
  const isCorrect = React.useMemo(() => {
    if (studentOrder.length !== correctOrder.length) return false;
    return studentOrder.every((word, idx) => 
      word.trim().toLowerCase() === correctOrder[idx].trim().toLowerCase()
    );
  }, [studentOrder, correctOrder]);


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
          Rearrange the words to form a correct sentence:
        </Typography.Text>

        {/* Student Answer Row */}
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
            Your answer:
          </Typography.Text>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {studentOrder.length > 0 ? studentOrder.map((word, index) => (
              <div
                key={index}
                style={{
                  minWidth: '100px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${
                    isCorrect 
                      ? '#52c41a' 
                      : '#ff4d4f'
                  }`,
                  borderRadius: '8px',
                  background: isCorrect
                    ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)')
                    : (theme === 'sun' ? 'rgba(255, 77, 79, 0.15)' : 'rgba(255, 77, 79, 0.2)'),
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  cursor: 'not-allowed'
                    }}
                  >
                    <span style={{ 
                      fontSize: '14px',
                      fontWeight: '600',
                  color: isCorrect ? '#52c41a' : '#ff4d4f',
                  textAlign: 'center',
                  padding: '8px 12px'
                    }}>
                  {word}
                    </span>
                  </div>
            )) : (
              <Typography.Text style={{ 
                fontSize: '14px',
                color: 'rgba(0, 0, 0, 0.5)',
                fontStyle: 'italic'
              }}>
                No answer provided
              </Typography.Text>
            )}
          </div>
        </div>

        {/* Correct Answer Row (only show if wrong) */}
        {!isCorrect && studentOrder.length > 0 && (
          <div style={{
            marginBottom: '24px',
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
              Correct order:
          </Typography.Text>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '12px'
          }}>
              {correctOrder.map((word, index) => (
              <div
                  key={index}
                style={{
                    minWidth: '100px',
                    height: '60px',
                    display: 'flex',
                  alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #52c41a',
                  borderRadius: '8px',
                    background: theme === 'sun' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(82, 196, 26, 0.2)',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    cursor: 'default'
                  }}
                >
                  <span style={{ 
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#52c41a',
                    textAlign: 'center',
                    padding: '8px 12px'
                  }}>
                    {word}
                  </span>
              </div>
            ))}
          </div>
        </div>
        )}

      </div>

      {/* Feedback Button */}
      <FeedbackButton
        theme={theme}
        hasFeedback={hasFeedback}
        questionId={data?.id}
        feedback={data?.feedback}
        onViewFeedback={onViewFeedback}
      />
    </div>
  );
};

// Rewrite Container Component
const RewriteContainer = ({ theme, data, studentAnswers, onViewFeedback }) => {
  const contentData = Array.isArray(data?.content?.data) ? data.content.data : [];
  const studentAnswer = studentAnswers?.[data?.id] || '';
  
  // Check if there's feedback
  const hasFeedback = data?.feedback && data.feedback.trim().length > 0;
  
  // Get correct answers from contentData
  const correctAnswers = contentData.map(item => item?.value || '').filter(Boolean);
  
  // Check if student answer is correct (case-insensitive comparison with any correct answer)
  const isCorrect = React.useMemo(() => {
    if (!studentAnswer || correctAnswers.length === 0) return false;
    const normalizedStudent = studentAnswer.trim().toLowerCase();
    return correctAnswers.some(correct => 
      correct.trim().toLowerCase() === normalizedStudent
    );
  }, [studentAnswer, correctAnswers]);
  
  // Remove placeholder tokens but keep HTML formatting
  const questionText = (data?.questionText || data?.question || 'Rewrite the following sentence using different words:')
    .replace(/\[\[pos_.*?\]\]/g, '');

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

        {/* Student Answer */}
        <div style={{ marginTop: '20px' }}>
          <Typography.Text style={{ 
            fontSize: '14px', 
            fontWeight: 350,
            marginBottom: '8px',
            display: 'block',
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
          }}>
            Your answer:
          </Typography.Text>
          <div
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px 16px',
              border: `2px solid ${
                studentAnswer 
                  ? (isCorrect ? '#52c41a' : '#ff4d4f')
                  : (theme === 'sun' ? '#1890ff' : '#8B5CF6')
              }`,
              borderRadius: '8px',
              backgroundColor: studentAnswer
                ? (isCorrect 
                    ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
                    : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'))
                : (theme === 'sun' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.85)'),
              color: studentAnswer
                ? (isCorrect ? '#52c41a' : '#ff4d4f')
                : (theme === 'sun' ? '#000000' : '#FFFFFF'),
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              cursor: 'not-allowed'
            }}
          >
            {studentAnswer || 'No answer provided'}
          </div>
        </div>

        {/* Correct Answer (always show) */}
        {correctAnswers.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <Typography.Text style={{ 
              fontSize: '14px', 
              fontWeight: 350,
              marginBottom: '8px',
              display: 'block',
              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
            }}>
              Correct answer{correctAnswers.length > 1 ? 's' : ''}:
            </Typography.Text>
            {correctAnswers.map((correctAnswer, idx) => (
              <div
                key={idx}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px 16px',
                  border: '2px solid #52c41a',
                  borderRadius: '8px',
                  backgroundColor: theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)',
                  color: '#52c41a',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  marginBottom: idx < correctAnswers.length - 1 ? '8px' : '0',
                  cursor: 'default'
                }}
              >
                {correctAnswer}
              </div>
            ))}
          </div>
        )}

        {/* Feedback Button */}
        <FeedbackButton
          theme={theme}
          hasFeedback={hasFeedback}
          questionId={data?.id}
          feedback={data?.feedback}
          onViewFeedback={onViewFeedback}
        />
      </div>
    </div>
  );
};


// Fill in the Blank Container Component (Result View)
const FillBlankContainer = ({ theme, data, studentAnswers, onViewFeedback }) => {
  const questionText = data?.questionText || data?.question || 'Fill in the blanks';
  const contentData = Array.isArray(data?.content?.data) ? data.content.data : [];
  
  // Check if there's feedback
  const hasFeedback = data?.feedback && data.feedback.trim().length > 0;
  
  // Get student answers - could be object with positionId keys or simple array
  const studentAnswerObj = studentAnswers?.[data?.id] || {};
  
  // Parse questionText and render inputs with student answers, show correct answers next to each input if wrong
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
      
      // Get position ID
      const positionId = `pos_${match[2]}`;
      
      // Get correct answer
      const correctItem = contentData.find(item => item.positionId === positionId && item.correct);
      const correctAnswer = correctItem?.value || '';
      
      // Get student answer - check both formats
      let studentAnswer = '';
      if (typeof studentAnswerObj === 'object' && studentAnswerObj !== null) {
        studentAnswer = studentAnswerObj[positionId] || studentAnswerObj[match[2]] || '';
      } else if (typeof studentAnswerObj === 'string') {
        studentAnswer = studentAnswerObj;
      }
      
      // Compare answers (case-insensitive, trimmed)
      const isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      
      // Render the input box
      elements.push(
        <input
          key={`fill_blank_input_${inputIndex}`}
          type="text"
          value={studentAnswer}
          readOnly
          disabled
          style={{
            display: 'inline-block',
            minWidth: '120px',
            maxWidth: '200px',
            minHeight: '32px',
            padding: '4px 12px',
            margin: '0 8px',
            background: isCorrect 
              ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.15)')
              : (theme === 'sun' ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.15)'),
            border: `2px solid ${
              isCorrect 
                ? 'rgb(82, 196, 26)' 
                : 'rgb(255, 77, 79)'
            }`,
            borderRadius: '8px',
            cursor: 'not-allowed',
            outline: 'none',
            lineHeight: '1.4',
            fontSize: '14px',
            boxSizing: 'border-box',
            textAlign: 'center',
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
            fontWeight: '400',
            verticalAlign: 'middle'
          }}
        />
      );

      // Add correct answer next to input if wrong
      if (!isCorrect && studentAnswer) {
        elements.push(
          <span 
            key={`answer_${inputIndex}`}
            style={{ 
              fontSize: '15px',
              color: '#52c41a',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              marginLeft: '8px'
            }}
          >
            {correctAnswer}
          </span>
        );
      }

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
          Question {data?.orderNumber || 4}
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

        {/* Feedback Button */}
        <FeedbackButton
          theme={theme}
          hasFeedback={hasFeedback}
          questionId={data?.id}
          feedback={data?.feedback}
          onViewFeedback={onViewFeedback}
        />
      </div>
    </div>
  );
};

// Feedback Button Component
const FeedbackButton = ({ theme, hasFeedback, questionId, feedback, onViewFeedback }) => {
  if (!hasFeedback) return null;

  return (
    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
      <Button
        type="default"
        icon={<MessageOutlined />}
        onClick={() => onViewFeedback?.(questionId, feedback)}
        style={{
          borderRadius: '8px',
          fontWeight: 500,
          fontSize: '14px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: `2px solid ${theme === 'sun' ? 'rgba(113, 179, 253, 0.4)' : 'rgba(138, 122, 255, 0.4)'}`,
          background: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.1)' 
            : 'rgba(138, 122, 255, 0.1)',
          color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
        }}
      >
        View Feedback
      </Button>
    </div>
  );
};

// Feedback Modal Component
const FeedbackModal = ({ visible, feedback, questionId, onClose, theme }) => {
  if (!feedback) return null;

  return (
    <Modal
      title={
        <div style={{ 
          fontSize: '28px',
          fontWeight: '600',
          color: 'rgb(24, 144, 255)',
          textAlign: 'center',
          padding: '10px 0',
        }}>
          Teacher Feedback
        </div>
      }
      open={visible}
      onCancel={onClose}
      closeIcon={
        <CloseOutlined style={{ 
          fontSize: '18px',
          color: 'rgb(24, 144, 255)',
        }} />
      }
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>
      ]}
      width={600}
      style={{
        top: '50px',
      }}
    >
      <div style={{
        padding: '20px 0',
        minHeight: '150px',
      }}>
        <div style={{
          padding: '16px',
          background: theme === 'sun' 
            ? 'linear-gradient(135deg, rgba(240, 249, 255, 0.5) 0%, rgba(255, 255, 255, 0.8) 100%)'
            : 'linear-gradient(135deg, rgba(244, 240, 255, 0.5) 0%, rgba(255, 255, 255, 0.8) 100%)',
          borderRadius: '12px',
          border: `2px solid ${theme === 'sun' ? 'rgba(113, 179, 253, 0.3)' : 'rgba(138, 122, 255, 0.3)'}`,
          marginBottom: '16px',
        }}>
          <Typography.Text style={{
            fontSize: '15px',
            lineHeight: '1.8',
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {feedback}
          </Typography.Text>
        </div>
        <div style={{
          fontSize: '12px',
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic',
          textAlign: 'right',
        }}>
          Question ID: {questionId}
        </div>
      </div>
    </Modal>
  );
};

const StudentDailyChallengeResult = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { theme } = useTheme();
  
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
  
  // Mock student answers - simulate what student selected
  const [studentAnswers, setStudentAnswers] = useState({});
  
  // Feedback modal state
  const [feedbackModal, setFeedbackModal] = useState({
    visible: false,
    feedback: null,
    questionId: null,
  });
  
  // Score and time state
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(10);
  const [timeSpent, setTimeSpent] = useState(location.state?.timeSpent || '00:00');
  
  usePageTitle('Daily Challenge - View Result');
  
  useEffect(() => {
    // Get challenge type from location state
    const type = location.state?.challengeType || location.state?.type || 'GV';
    
    // Simulate loading delay
    setLoading(true);
    setTimeout(() => {
      setChallengeType(type);
      setChallengeInfo({
        challengeName: location.state?.challengeName || 'Daily Challenge',
        className: location.state?.lessonName || null,
      });
      
      const fakeData = generateFakeDataByType(type);
      setQuestions(fakeData.questions);
      setReadingSections(fakeData.readingSections);
      setListeningSections(fakeData.listeningSections);
      setWritingSections(fakeData.writingSections);
      setSpeakingSections(fakeData.speakingSections);
      
      // Generate mock student answers for GV questions
      const mockAnswers = {};
      fakeData.questions.forEach(q => {
        // Skip questions with 'blank' in id - these should remain unanswered (blank)
        if (q.id && q.id.includes('blank')) {
          return; // Skip this question, leave it blank
        }
        
        if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE') {
          const correctOption = q.options?.find(opt => opt.isCorrect);
          const wrongOption = q.options?.find(opt => !opt.isCorrect);
          // For questions ending with 'b': use wrong answer, otherwise use correct answer
          if (q.id.endsWith('b')) {
            // For True/False, use the text "True" or "False" instead of key
            if (q.type === 'TRUE_OR_FALSE') {
              mockAnswers[q.id] = wrongOption?.text || wrongOption?.key; // Wrong answer for demonstration
            } else {
              mockAnswers[q.id] = wrongOption?.key; // Wrong answer for demonstration
            }
          } else {
            // For True/False, use the text "True" or "False" instead of key
            if (q.type === 'TRUE_OR_FALSE') {
              mockAnswers[q.id] = correctOption?.text || correctOption?.key; // Correct answer
            } else {
              mockAnswers[q.id] = correctOption?.key; // Correct answer
            }
          }
        } else if (q.type === 'MULTIPLE_SELECT') {
          const correctKeys = q.options?.filter(opt => opt.isCorrect).map(opt => opt.key) || [];
          const incorrectKeys = q.options?.filter(opt => !opt.isCorrect).map(opt => opt.key) || [];
          // For questions ending with 'b': use wrong answer (mix of correct and incorrect), otherwise use all correct
          if (q.id.endsWith('b')) {
            const selected = [];
            // Select some correct but not all, and add at least one incorrect
            if (correctKeys.length > 1) {
              selected.push(correctKeys[0]); // Only first correct answer
            } else {
              selected.push(...correctKeys);
            }
            if (incorrectKeys.length > 0) {
              selected.push(incorrectKeys[0]); // Add one wrong answer
            }
            mockAnswers[q.id] = selected; // Wrong answer for demonstration
          } else {
            mockAnswers[q.id] = correctKeys; // All correct answers
          }
        } else if (q.type === 'FILL_IN_THE_BLANK') {
          // Get correct answers from content.data
          const contentData = q.content?.data || [];
          const fillBlankAnswers = {};
          contentData.forEach(item => {
            if (item.positionId && item.correct) {
              const positionId = item.positionId;
              // For first Fill in the Blank (gv-4): use correct answer (went)
              // For second Fill in the Blank (gv-4b): use wrong answer (ugly instead of beautiful)
              if (q.id === 'gv-4') {
                fillBlankAnswers[positionId] = 'went'; // Correct answer
              } else if (q.id === 'gv-4b') {
                fillBlankAnswers[positionId] = 'ugly'; // Wrong answer for demonstration
              }
            }
          });
          mockAnswers[q.id] = fillBlankAnswers;
        } else if (q.type === 'DROPDOWN') {
          const contentData = q.content?.data || [];
          const dropdownAnswers = {};
          contentData.forEach(item => {
            if (item.positionId && item.correct) {
              const positionId = item.positionId;
              // For first Dropdown (gv-5): use correct answer (in)
              // For second Dropdown (gv-5b): use wrong answer (on instead of at)
              if (q.id === 'gv-5') {
                dropdownAnswers[positionId] = 'in'; // Correct answer
              } else if (q.id === 'gv-5b') {
                dropdownAnswers[positionId] = 'on'; // Wrong answer for demonstration
              }
            }
          });
          mockAnswers[q.id] = dropdownAnswers;
        } else if (q.type === 'DRAG_AND_DROP') {
          const contentData = q.content?.data || [];
          const dragDropAnswers = {};
          contentData.forEach(item => {
            if (item.positionId && item.correct) {
              const positionId = item.positionId;
              // For first Drag and Drop (gv-6): use correct answers (love, enjoy)
              // For second Drag and Drop (gv-6b): use wrong answers (hears instead of listens, enjoys instead of loves)
              if (q.id === 'gv-6') {
                if (positionId === 'pos_1') {
                  dragDropAnswers[positionId] = 'love'; // Correct answer
                } else if (positionId === 'pos_2') {
                  dragDropAnswers[positionId] = 'enjoy'; // Correct answer
                }
              } else if (q.id === 'gv-6b') {
                if (positionId === 'pos_1') {
                  dragDropAnswers[positionId] = 'hears'; // Wrong answer for demonstration
                } else if (positionId === 'pos_2') {
                  dragDropAnswers[positionId] = 'enjoys'; // Wrong answer for demonstration
                }
              }
            }
          });
          mockAnswers[q.id] = dragDropAnswers;
        } else if (q.type === 'REARRANGE') {
          const contentData = q.content?.data || [];
          // Get correct order (sorted by positionId)
          const correctOrder = contentData
            .slice()
            .sort((a, b) => {
              const posA = parseInt((a.positionId || '').replace('pos_', ''));
              const posB = parseInt((b.positionId || '').replace('pos_', ''));
              return posA - posB;
            })
            .map(item => item.value)
            .filter(Boolean);
          
          // For first Reorder (gv-7): use correct order
          // For second Reorder (gv-7b): use wrong order (swap first two)
          if (q.id === 'gv-7') {
            mockAnswers[q.id] = correctOrder; // Correct order
          } else if (q.id === 'gv-7b') {
            const wrongOrder = [...correctOrder];
            if (wrongOrder.length >= 2) {
              // Swap first two items
              [wrongOrder[0], wrongOrder[1]] = [wrongOrder[1], wrongOrder[0]];
            }
            mockAnswers[q.id] = wrongOrder; // Wrong order for demonstration
          }
        } else if (q.type === 'REWRITE') {
          const contentData = q.content?.data || [];
          const correctAnswer = contentData[0]?.value || '';
          
          // For first Rewrite (gv-8): use correct answer
          // For second Rewrite (gv-8b): use wrong answer
          if (q.id === 'gv-8') {
            mockAnswers[q.id] = correctAnswer; // Correct answer
          } else if (q.id === 'gv-8b') {
            mockAnswers[q.id] = 'She said I will finish my homework.'; // Wrong answer for demonstration
          }
        }
      });
      
      // Generate mock student answers for Reading sections
      if (fakeData.readingSections && fakeData.readingSections.length > 0) {
        fakeData.readingSections.forEach((section, sectionIdx) => {
          if (section.questions && section.questions.length > 0) {
            section.questions.forEach((q, qIdx) => {
              if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE') {
                const correctOption = q.options?.find(opt => opt.isCorrect);
                const wrongOption = q.options?.find(opt => !opt.isCorrect);
                
                // For demonstration: Make first question (re-1) and third question (re-3) have wrong answers
                // This ensures we can see both correct and wrong answer displays
                const shouldUseWrongAnswer = (q.id === 're-1' || q.id === 're-3') || (q.id && q.id.endsWith('b'));
                
                if (shouldUseWrongAnswer && wrongOption) {
                  // For True/False, use the text "True" or "False" instead of key
                  if (q.type === 'TRUE_OR_FALSE') {
                    mockAnswers[q.id] = wrongOption?.text || wrongOption?.key; // Wrong answer for demonstration
                  } else {
                    mockAnswers[q.id] = wrongOption?.key; // Wrong answer for demonstration
                  }
                } else {
                  // For True/False, use the text "True" or "False" instead of key
                  if (q.type === 'TRUE_OR_FALSE') {
                    mockAnswers[q.id] = correctOption?.text || correctOption?.key; // Correct answer
                  } else {
                    mockAnswers[q.id] = correctOption?.key; // Correct answer
                  }
                }
              } else if (q.type === 'MULTIPLE_SELECT') {
                const correctKeys = q.options?.filter(opt => opt.isCorrect).map(opt => opt.key) || [];
                const incorrectKeys = q.options?.filter(opt => !opt.isCorrect).map(opt => opt.key) || [];
                
                // For demonstration: Make second question (re-2) have partial wrong answers
                // Select some correct but not all, and add at least one incorrect
                const shouldUseWrongAnswer = (q.id === 're-2') || (q.id && q.id.endsWith('b'));
                
                if (shouldUseWrongAnswer && incorrectKeys.length > 0) {
                  const selected = [];
                  // Select some correct but not all, and add at least one incorrect
                  if (correctKeys.length > 1) {
                    selected.push(correctKeys[0]); // Only first correct answer (missing others)
                  } else if (correctKeys.length > 0) {
                    selected.push(...correctKeys);
                  }
                  if (incorrectKeys.length > 0) {
                    selected.push(incorrectKeys[0]); // Add one wrong answer
                  }
                  mockAnswers[q.id] = selected; // Wrong answer for demonstration
                } else {
                  mockAnswers[q.id] = correctKeys; // All correct answers
                }
              } else if (q.type === 'FILL_IN_THE_BLANK') {
                // Get correct answers from content.data
                const contentData = q.content?.data || [];
                const fillBlankAnswers = {};
                contentData.forEach(item => {
                  if (item.positionId && item.correct) {
                    const positionId = item.positionId;
                    // For demonstration: Make first Fill in the Blank (re-4) have wrong answer
                    // This ensures we can see both correct and wrong answer displays
                    if (q.id === 're-4') {
                      // Use wrong answer for demonstration
                      const wrongAnswers = ['mind', 'head', 'body'];
                      const wrongAnswer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
                      fillBlankAnswers[positionId] = wrongAnswer; // Wrong answer for demonstration
                    } else {
                      fillBlankAnswers[positionId] = item.value; // Correct answer
                    }
                  }
                });
                mockAnswers[q.id] = fillBlankAnswers;
              } else if (q.type === 'DROPDOWN') {
                const contentData = q.content?.data || [];
                const dropdownAnswers = {};
                contentData.forEach(item => {
                  if (item.positionId && item.correct) {
                    const positionId = item.positionId;
                    // For demonstration: Make Dropdown questions have wrong answers
                    // This ensures we can see both correct and wrong answer displays
                    if (q.id === 're-5' || q.id === 're-6') {
                      // Find wrong option
                      const wrongItems = contentData.filter(it => 
                        it.positionId === positionId && !it.correct && it.value
                      );
                      if (wrongItems.length > 0) {
                        dropdownAnswers[positionId] = wrongItems[0].value; // Wrong answer for demonstration
                      } else {
                        dropdownAnswers[positionId] = item.value; // Fallback to correct if no wrong option
                      }
                    } else {
                      dropdownAnswers[positionId] = item.value; // Correct answer
                    }
                  }
                });
                mockAnswers[q.id] = dropdownAnswers;
              } else if (q.type === 'DRAG_AND_DROP') {
                const contentData = q.content?.data || [];
                const dragDropAnswers = {};
                contentData.forEach(item => {
                  if (item.positionId && item.correct) {
                    const positionId = item.positionId;
                    // For demonstration: Make Drag and Drop questions have wrong answers
                    // This ensures we can see both correct and wrong answer displays
                    if (q.id === 're-7' || q.id === 're-8') {
                      // Find wrong option for this position
                      const wrongItems = contentData.filter(it => 
                        it.positionId === positionId && !it.correct && it.value
                      );
                      if (wrongItems.length > 0) {
                        dragDropAnswers[positionId] = wrongItems[0].value; // Wrong answer for demonstration
                      } else {
                        dragDropAnswers[positionId] = item.value; // Fallback to correct if no wrong option
                      }
                    } else {
                      dragDropAnswers[positionId] = item.value; // Correct answer
                    }
                  }
                });
                mockAnswers[q.id] = dragDropAnswers;
              } else if (q.type === 'REARRANGE') {
                const contentData = q.content?.data || [];
                // Get correct order (sorted by positionId)
                const correctOrder = contentData
                  .slice()
                  .sort((a, b) => {
                    const posA = parseInt((a.positionId || '').replace('pos_', ''));
                    const posB = parseInt((b.positionId || '').replace('pos_', ''));
                    return posA - posB;
                  })
                  .map(item => item.value)
                  .filter(Boolean);
                
                // For demonstration: Make REARRANGE questions have wrong order
                // This ensures we can see both correct and wrong answer displays
                if (q.id === 're-9' || q.id === 're-10') {
                  // Use wrong order (swap first two)
                  const wrongOrder = [...correctOrder];
                  if (wrongOrder.length >= 2) {
                    // Swap first two items
                    [wrongOrder[0], wrongOrder[1]] = [wrongOrder[1], wrongOrder[0]];
                  }
                  mockAnswers[q.id] = wrongOrder; // Wrong order for demonstration
                } else {
                  mockAnswers[q.id] = correctOrder; // Correct order
                }
              }
            });
          }
        });
      }
      
      // Generate mock student answers for Writing sections
      if (fakeData.writingSections && fakeData.writingSections.length > 0) {
        fakeData.writingSections.forEach((section, sectionIdx) => {
          if (section.id) {
            // For demonstration: Create mock answers with essay text and/or images
            // First writing section has essay text
            // Second writing section has images (if exists)
            if (sectionIdx === 0) {
              mockAnswers[section.id] = {
                text: `In today's fast-paced world, effective communication skills are more important than ever before. Writing is one of the most fundamental forms of communication, allowing us to express our thoughts, share information, and connect with others across time and space.

A well-written essay demonstrates clarity of thought, logical organization, and the ability to convey complex ideas in an accessible manner. When writing an essay, it is crucial to begin with a clear thesis statement that outlines the main argument or purpose of the piece.

The body paragraphs should provide supporting evidence and examples that reinforce the central thesis. Each paragraph should focus on a single main idea, supported by relevant details and analysis. Transitional phrases help guide the reader from one idea to the next, creating a smooth flow of information.

In conclusion, writing is not just about putting words on paper—it is about crafting a coherent narrative that engages the reader and effectively communicates the intended message.`,
                essay: `In today's fast-paced world, effective communication skills are more important than ever before. Writing is one of the most fundamental forms of communication, allowing us to express our thoughts, share information, and connect with others across time and space.

A well-written essay demonstrates clarity of thought, logical organization, and the ability to convey complex ideas in an accessible manner. When writing an essay, it is crucial to begin with a clear thesis statement that outlines the main argument or purpose of the piece.

The body paragraphs should provide supporting evidence and examples that reinforce the central thesis. Each paragraph should focus on a single main idea, supported by relevant details and analysis. Transitional phrases help guide the reader from one idea to the next, creating a smooth flow of information.

In conclusion, writing is not just about putting words on paper—it is about crafting a coherent narrative that engages the reader and effectively communicates the intended message.`
              };
            } else if (sectionIdx === 1) {
              // Second writing section has uploaded image (banana.jpg)
              mockAnswers[section.id] = {
                files: [
                  {
                    id: 'file1',
                    name: 'banana.jpg',
                    type: 'image/jpeg',
                    url: '/img/banana.jpg',
                    imageUrl: '/img/banana.jpg'
                  }
                ]
              };
            } else {
              // Other writing sections might have both text and files
              mockAnswers[section.id] = {
                text: 'This is a sample essay answer for the writing section. It demonstrates how student responses are displayed in the result view.',
                files: [
                  {
                    id: 'file1',
                    name: 'handwriting_sample.jpg',
                    type: 'image/jpeg',
                    url: 'https://via.placeholder.com/800x600?text=Handwriting+Sample',
                    imageUrl: 'https://via.placeholder.com/800x600?text=Handwriting+Sample'
                  }
                ]
              };
            }
          }
        });
      }
      
      // Generate mock student answers for Speaking sections
      if (fakeData.speakingSections && fakeData.speakingSections.length > 0) {
        fakeData.speakingSections.forEach((section, sectionIdx) => {
          if (section.id) {
            // First speaking section: recorded audio
            if (sectionIdx === 0) {
              mockAnswers[section.id] = {
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
              };
            } else {
              // Second speaking section (SPEAKING_WITH_AUDIO_SECTION): recorded audio
              mockAnswers[section.id] = {
                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
                audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
              };
            }
          }
        });
      }
      
      setStudentAnswers(mockAnswers);
      
      setLoading(false);
    }, 500);
  }, [location.state]);


  const handleBack = () => {
    navigate(-1);
  };

  // Handle feedback modal
  const handleViewFeedback = (questionId, feedback) => {
    setFeedbackModal({
      visible: true,
      feedback: feedback,
      questionId: questionId,
    });
  };

  const handleCloseFeedback = () => {
    setFeedbackModal({
      visible: false,
      feedback: null,
      questionId: null,
    });
  };

  // Calculate score from student answers
  const calculateScore = useCallback(() => {
    let correctCount = 0;
    let totalCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    // Calculate score for individual questions
    questions.forEach(q => {
      if (!q.id || q.id.includes('blank')) return;
      
      const studentAnswer = studentAnswers[q.id];
      if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') return;
      
      totalCount++;
      const points = q.points || 1;
      totalPoints += points;

      let isCorrect = false;

      if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE') {
        const correctOption = q.options?.find(opt => opt.isCorrect);
        if (q.type === 'TRUE_OR_FALSE') {
          isCorrect = studentAnswer === (correctOption?.text || correctOption?.key);
        } else {
          isCorrect = studentAnswer === correctOption?.key;
        }
      } else if (q.type === 'MULTIPLE_SELECT') {
        const correctKeys = q.options?.filter(opt => opt.isCorrect).map(opt => opt.key) || [];
        const studentKeys = Array.isArray(studentAnswer) ? studentAnswer : [];
        isCorrect = correctKeys.length === studentKeys.length && 
                   correctKeys.every(key => studentKeys.includes(key));
      } else if (q.type === 'FILL_IN_THE_BLANK') {
        const contentData = q.content?.data || [];
        let allCorrect = true;
        contentData.forEach(item => {
          if (item.positionId && item.correct) {
            const studentAnswerForPosition = studentAnswer[item.positionId];
            if (studentAnswerForPosition !== item.value) {
              allCorrect = false;
            }
          }
        });
        isCorrect = allCorrect;
      } else if (q.type === 'DROPDOWN') {
        const contentData = q.content?.data || [];
        let allCorrect = true;
        contentData.forEach(item => {
          if (item.positionId && item.correct) {
            const studentAnswerForPosition = studentAnswer[item.positionId];
            if (studentAnswerForPosition !== item.value) {
              allCorrect = false;
            }
          }
        });
        isCorrect = allCorrect;
      } else if (q.type === 'DRAG_AND_DROP') {
        const contentData = q.content?.data || [];
        let allCorrect = true;
        contentData.forEach(item => {
          if (item.positionId && item.correct) {
            const studentAnswerForPosition = studentAnswer[item.positionId];
            if (studentAnswerForPosition !== item.value) {
              allCorrect = false;
            }
          }
        });
        isCorrect = allCorrect;
      } else if (q.type === 'REARRANGE') {
        const contentData = q.content?.data || [];
        const correctOrder = contentData
          .slice()
          .sort((a, b) => {
            const posA = parseInt((a.positionId || '').replace('pos_', ''));
            const posB = parseInt((b.positionId || '').replace('pos_', ''));
            return posA - posB;
          })
          .map(item => item.value)
          .filter(Boolean);
        const studentOrder = Array.isArray(studentAnswer) ? studentAnswer : [];
        isCorrect = JSON.stringify(correctOrder) === JSON.stringify(studentOrder);
      } else if (q.type === 'REWRITE') {
        const contentData = q.content?.data || [];
        const correctAnswer = contentData[0]?.value || '';
        isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      }

      if (isCorrect) {
        correctCount++;
        earnedPoints += points;
      }
    });

    // Calculate score for Reading sections
    readingSections.forEach(section => {
      if (section.questions && section.questions.length > 0) {
        section.questions.forEach(q => {
          const studentAnswer = studentAnswers[q.id];
          if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') return;
          
          totalCount++;
          const points = q.points || 1;
          totalPoints += points;

          let isCorrect = false;

          if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE') {
            const correctOption = q.options?.find(opt => opt.isCorrect);
            if (q.type === 'TRUE_OR_FALSE') {
              isCorrect = studentAnswer === (correctOption?.text || correctOption?.key);
            } else {
              isCorrect = studentAnswer === correctOption?.key;
            }
          } else if (q.type === 'MULTIPLE_SELECT') {
            const correctKeys = q.options?.filter(opt => opt.isCorrect).map(opt => opt.key) || [];
            const studentKeys = Array.isArray(studentAnswer) ? studentAnswer : [];
            isCorrect = correctKeys.length === studentKeys.length && 
                       correctKeys.every(key => studentKeys.includes(key));
          } else if (q.type === 'FILL_IN_THE_BLANK') {
            const contentData = q.content?.data || [];
            let allCorrect = true;
            contentData.forEach(item => {
              if (item.positionId && item.correct) {
                const studentAnswerForPosition = studentAnswer[item.positionId];
                if (studentAnswerForPosition !== item.value) {
                  allCorrect = false;
                }
              }
            });
            isCorrect = allCorrect;
          } else if (q.type === 'DROPDOWN') {
            const contentData = q.content?.data || [];
            let allCorrect = true;
            contentData.forEach(item => {
              if (item.positionId && item.correct) {
                const studentAnswerForPosition = studentAnswer[item.positionId];
                if (studentAnswerForPosition !== item.value) {
                  allCorrect = false;
                }
              }
            });
            isCorrect = allCorrect;
          } else if (q.type === 'DRAG_AND_DROP') {
            const contentData = q.content?.data || [];
            let allCorrect = true;
            contentData.forEach(item => {
              if (item.positionId && item.correct) {
                const studentAnswerForPosition = studentAnswer[item.positionId];
                if (studentAnswerForPosition !== item.value) {
                  allCorrect = false;
                }
              }
            });
            isCorrect = allCorrect;
          } else if (q.type === 'REARRANGE') {
            const contentData = q.content?.data || [];
            const correctOrder = contentData
              .slice()
              .sort((a, b) => {
                const posA = parseInt((a.positionId || '').replace('pos_', ''));
                const posB = parseInt((b.positionId || '').replace('pos_', ''));
                return posA - posB;
              })
              .map(item => item.value)
              .filter(Boolean);
            const studentOrder = Array.isArray(studentAnswer) ? studentAnswer : [];
            isCorrect = JSON.stringify(correctOrder) === JSON.stringify(studentOrder);
          }

          if (isCorrect) {
            correctCount++;
            earnedPoints += points;
          }
        });
      }
    });

    // Calculate score for Listening sections
    listeningSections.forEach(section => {
      if (section.questions && section.questions.length > 0) {
        section.questions.forEach(q => {
          const studentAnswer = studentAnswers[q.id];
          if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') return;
          
          totalCount++;
          const points = q.points || 1;
          totalPoints += points;

          let isCorrect = false;

          if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE') {
            const correctOption = q.options?.find(opt => opt.isCorrect);
            if (q.type === 'TRUE_OR_FALSE') {
              isCorrect = studentAnswer === (correctOption?.text || correctOption?.key);
            } else {
              isCorrect = studentAnswer === correctOption?.key;
            }
          } else if (q.type === 'MULTIPLE_SELECT') {
            const correctKeys = q.options?.filter(opt => opt.isCorrect).map(opt => opt.key) || [];
            const studentKeys = Array.isArray(studentAnswer) ? studentAnswer : [];
            isCorrect = correctKeys.length === studentKeys.length && 
                       correctKeys.every(key => studentKeys.includes(key));
          } else if (q.type === 'FILL_IN_THE_BLANK') {
            const contentData = q.content?.data || [];
            let allCorrect = true;
            contentData.forEach(item => {
              if (item.positionId && item.correct) {
                const studentAnswerForPosition = studentAnswer[item.positionId];
                if (studentAnswerForPosition !== item.value) {
                  allCorrect = false;
                }
              }
            });
            isCorrect = allCorrect;
          } else if (q.type === 'DROPDOWN') {
            const contentData = q.content?.data || [];
            let allCorrect = true;
            contentData.forEach(item => {
              if (item.positionId && item.correct) {
                const studentAnswerForPosition = studentAnswer[item.positionId];
                if (studentAnswerForPosition !== item.value) {
                  allCorrect = false;
                }
              }
            });
            isCorrect = allCorrect;
          } else if (q.type === 'DRAG_AND_DROP') {
            const contentData = q.content?.data || [];
            let allCorrect = true;
            contentData.forEach(item => {
              if (item.positionId && item.correct) {
                const studentAnswerForPosition = studentAnswer[item.positionId];
                if (studentAnswerForPosition !== item.value) {
                  allCorrect = false;
                }
              }
            });
            isCorrect = allCorrect;
          } else if (q.type === 'REARRANGE') {
            const contentData = q.content?.data || [];
            const correctOrder = contentData
              .slice()
              .sort((a, b) => {
                const posA = parseInt((a.positionId || '').replace('pos_', ''));
                const posB = parseInt((b.positionId || '').replace('pos_', ''));
                return posA - posB;
              })
              .map(item => item.value)
              .filter(Boolean);
            const studentOrder = Array.isArray(studentAnswer) ? studentAnswer : [];
            isCorrect = JSON.stringify(correctOrder) === JSON.stringify(studentOrder);
          }

          if (isCorrect) {
            correctCount++;
            earnedPoints += points;
          }
        });
      }
    });

    // Normalize score to 0-10 scale
    const normalizedScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 10 : 0;
    return {
      score: parseFloat(normalizedScore.toFixed(1)),
      maxScore: 10,
      correctCount,
      totalCount,
      earnedPoints,
      totalPoints
    };
  }, [questions, readingSections, listeningSections, studentAnswers]);

  // Update score when student answers change
  useEffect(() => {
    if (studentAnswers && Object.keys(studentAnswers).length > 0) {
      const scoreData = calculateScore();
      setTotalScore(scoreData.score);
      setMaxScore(scoreData.maxScore);
    }
  }, [studentAnswers, calculateScore]);

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
      questions.forEach((q) => {
        navigation.push({ id: `q-${q.id}`, type: 'question', title: `Question ${questionNumber++}` });
      });
    }
    return navigation;
  };

  // Custom Header Component
  const subtitle = (challengeInfo.className && challengeInfo.challengeName)
    ? `${challengeInfo.className} / ${challengeInfo.challengeName}`
    : (challengeInfo.challengeName || 'Daily Challenge');
  
  // Get score color based on score
  const getScoreColor = (score) => {
    if (score >= 8) return '#14961A'; // Green for good score (>= 8)
    if (score >= 5) return '#DFAF38'; // Yellow for average score (5-7.9)
    return '#FF4D4F'; // Red for low score (< 5)
  };

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
          
          {/* Score and Time Display - Top Right Corner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginRight: '16px'
          }}>
            {/* Time Spent */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: theme === 'sun' ? 'rgba(113, 179, 253, 0.1)' : 'rgba(138, 122, 255, 0.1)',
              border: `1px solid ${theme === 'sun' ? 'rgba(113, 179, 253, 0.3)' : 'rgba(138, 122, 255, 0.3)'}`
            }}>
              <ClockCircleOutlined style={{
                fontSize: '16px',
                color: theme === 'sun' ? '#1E40AF' : '#8A7AFF'
              }} />
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: theme === 'sun' ? '#1E40AF' : '#8A7AFF'
              }}>
                {timeSpent}
              </span>
            </div>
            
            {/* Score */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: theme === 'sun' ? 'rgba(113, 179, 253, 0.1)' : 'rgba(138, 122, 255, 0.1)',
              border: `1px solid ${theme === 'sun' ? 'rgba(113, 179, 253, 0.3)' : 'rgba(138, 122, 255, 0.3)'}`
            }}>
              <TrophyOutlined style={{
                fontSize: '16px',
                color: getScoreColor(totalScore)
              }} />
              <span style={{
                fontSize: '14px',
                fontWeight: 700,
                color: getScoreColor(totalScore)
              }}>
                {totalScore.toFixed(1)}/{maxScore}
              </span>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );

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
              <div className="questions-list">
                {/* Render Reading sections when challenge type is RE */}
                {challengeType === 'RE' && readingSections.length > 0 && (
                  readingSections.map((section, index) => (
                    <div key={`reading-wrap-${section.id || index}`} ref={el => (questionRefs.current[`reading-${index + 1}`] = el)}>
                      <SectionQuestionItem key={section.id || `section_${index}`} question={section} index={index} theme={theme} studentAnswers={studentAnswers} onViewFeedback={handleViewFeedback} />
                </div>
                  ))
                )}
                {/* Render Writing sections when challenge type is WR */}
                {challengeType === 'WR' && writingSections.length > 0 && (
                  writingSections.map((section, index) => (
                    <div key={`writing-wrap-${section.id || index}`} ref={el => (questionRefs.current[`writing-${index + 1}`] = el)}>
                      <WritingSectionItem key={section.id || `writing_${index}`} question={section} index={index} theme={theme} studentAnswers={studentAnswers} />
                    </div>
                  ))
                )}
                {/* Render Speaking sections when challenge type is SP */}
                {challengeType === 'SP' && speakingSections.length > 0 && (
                  speakingSections.map((section, index) => (
                    <div key={`speaking-wrap-${section.id || index}`} ref={el => (questionRefs.current[`speaking-${index + 1}`] = el)}>
                      {section.type === 'SPEAKING_WITH_AUDIO_SECTION' ? (
                        <SpeakingWithAudioSectionItem key={section.id || `speaking_audio_${index}`} question={section} index={index} theme={theme} studentAnswers={studentAnswers} onViewFeedback={handleViewFeedback} />
                      ) : (
                        <SpeakingSectionItem key={section.id || `speaking_${index}`} question={section} index={index} theme={theme} studentAnswers={studentAnswers} onViewFeedback={handleViewFeedback} />
                      )}
                    </div>
                  ))
                )}
                {/* Dynamic questions preview (hide complex sections) */}
                {questions.map((q, idx) => (
                  <div key={q.id} ref={el => (questionRefs.current[`q-${q.id}`] = el)}>
                    {q.type === 'MULTIPLE_CHOICE' && (
                      <MultipleChoiceContainer theme={theme} data={q} studentAnswers={studentAnswers} onViewFeedback={handleViewFeedback} />
                    )}
                    {q.type === 'MULTIPLE_SELECT' && (
                      <MultipleSelectContainer theme={theme} data={q} studentAnswers={studentAnswers} onViewFeedback={handleViewFeedback} />
                    )}
                    {q.type === 'TRUE_OR_FALSE' && (
                      <TrueFalseContainer theme={theme} data={q} studentAnswers={studentAnswers} onViewFeedback={handleViewFeedback} />
                    )}
                    {q.type === 'FILL_IN_THE_BLANK' && (
                      <FillBlankContainer theme={theme} data={q} studentAnswers={studentAnswers} onViewFeedback={handleViewFeedback} />
                    )}
                    {q.type === 'DROPDOWN' && (
                      <DropdownContainer theme={theme} data={q} studentAnswers={studentAnswers} onViewFeedback={handleViewFeedback} />
                    )}
                    {q.type === 'DRAG_AND_DROP' && (
                      <DragDropContainer theme={theme} data={q} studentAnswers={studentAnswers} onViewFeedback={handleViewFeedback} />
                    )}
                    {q.type === 'REARRANGE' && (
                      <ReorderContainer theme={theme} data={q} studentAnswers={studentAnswers} onViewFeedback={handleViewFeedback} />
                    )}
                    {q.type === 'REWRITE' && (
                      <RewriteContainer theme={theme} data={q} studentAnswers={studentAnswers} onViewFeedback={handleViewFeedback} />
                    )}
                </div>
                ))}
                {challengeType === 'LI' && listeningSections.length > 0 && (
                  listeningSections.map((section, index) => (
                    <div key={`listening-wrap-${section.id || index}`} ref={el => (questionRefs.current[`listening-${index + 1}`] = el)}>
                      <ListeningSectionItem key={section.id || `listening_${index}`} question={section} index={index} theme={theme} onViewFeedback={handleViewFeedback} />
                    </div>
                  ))
                )}
              </div>
            </LoadingWithEffect>
          </div>
        </div>
      </div>
      
      {/* Feedback Modal */}
      <FeedbackModal
        visible={feedbackModal.visible}
        feedback={feedbackModal.feedback}
        questionId={feedbackModal.questionId}
        onClose={handleCloseFeedback}
        theme={theme}
      />
    </ThemedLayout>
  );
};

export default StudentDailyChallengeResult;
