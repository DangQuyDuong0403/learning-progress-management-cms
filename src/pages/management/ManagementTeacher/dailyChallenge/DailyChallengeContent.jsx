import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import {
  Button,
  Input,
  Space,
  Tooltip,
  Typography,
  Modal,
  Upload,
  Divider,
  Card,
  Row,
  Col,
  Dropdown,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  SwapOutlined,
  SaveOutlined,
  DownloadOutlined,
  UploadOutlined,
  ArrowLeftOutlined,
  DownOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./DailyChallengeContent.css";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useDailyChallengeMenu } from "../../../../contexts/DailyChallengeMenuContext";
import usePageTitle from "../../../../hooks/usePageTitle";
import ChallengeSettingsModal from "./ChallengeSettingsModal";
import { dailyChallengeApi } from "../../../../apis/apis";
import { useSelector } from "react-redux";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  defaultAnimateLayoutChanges,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MultipleChoiceModal,
  MultipleSelectModal,
  TrueFalseModal,
  FillBlankModal,
  DropdownModal,
  DragDropModal,
  ReorderModal,
  RewriteModal,
} from "./questionModals";

// Helper function to get full challenge type name
const getChallengeTypeName = (typeCode) => {
  const typeMap = {
    'GV': 'Grammar & Vocabulary',
    'RE': 'Reading',
    'LI': 'Listening',
    'WR': 'Writing',
    'SP': 'Speaking',
  };
  
  return typeMap[typeCode] || typeCode || 'Unknown';
};

// Helper function to optionally handle [[dur_3]] marker
const processPassageContent = (content, theme, challengeType) => {
  if (!content) return '';
  
  // For Speaking challenges, remove the marker and show plain text at top elsewhere
  if (challengeType === 'SP') {
    return content.replace(/\[\[dur_3\]\]/g, '');
  }
  
  return content;
};

// Sortable Passage Item Component
const SortablePassageItem = memo(
  ({ passage, index, onDeletePassage, onEditPassage, onDuplicatePassage, onPointsChange, theme, t, challengeType, activeDragDimensions }) => {
    const [showTranscript, setShowTranscript] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const passageContentRef = useRef(null);
    const [needsToggle, setNeedsToggle] = useState(false);
    
    // Measure if WR content overflows the collapsed container to decide showing the toggle
    useEffect(() => {
      if (challengeType !== 'WR') {
        setNeedsToggle(false);
        return;
      }
      if (!passageContentRef.current) return;
      // Only measure in collapsed state; when expanded we don't need the toggle measurement
      if (showMore) {
        setNeedsToggle(true);
        return;
      }
      const el = passageContentRef.current;
      // Allow layout to settle before measuring
      const id = window.requestAnimationFrame(() => {
        try {
          setNeedsToggle(el.scrollHeight > el.clientHeight + 1);
        } catch (_) {
          setNeedsToggle(false);
        }
      });
      return () => window.cancelAnimationFrame(id);
    }, [challengeType, passage?.content, showMore]);
    
    // Removed plain-text transcript conversion to preserve rich content (bold, images, tables)
    
    // Optimized: Only animate during active sorting/dragging to reduce lag
    const animateLayoutChanges = useCallback((args) => {
      const { isSorting, wasDragging } = args;
      if (isSorting || wasDragging) {
        return defaultAnimateLayoutChanges(args);
      }
      // Skip animation when not actively sorting to improve performance
      return false;
    }, []);

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: passage.id,
      animateLayoutChanges,
    });

    // Store ref for the item
    const itemRef = useRef(null);

    const style = useMemo(
      () => {
        const baseStyle = {
          transform: transform ? CSS.Transform.toString(transform) : undefined,
          transition: isDragging ? 'none' : (transition || undefined), // No transition when dragging to reduce lag
          opacity: isDragging ? 0.6 : 1,
          willChange: isDragging ? 'transform' : 'auto', // Optimize only when dragging
          pointerEvents: isDragging ? 'none' : 'auto', // Disable pointer events when dragging
        };
        
        // Fix stretching/shrinking by preserving dimensions when dragging
        if (isDragging && activeDragDimensions) {
          return {
            ...baseStyle,
            width: `${activeDragDimensions.width}px`,
            minWidth: `${activeDragDimensions.width}px`,
            maxWidth: `${activeDragDimensions.width}px`,
            height: `${activeDragDimensions.height}px`,
            minHeight: `${activeDragDimensions.height}px`,
            maxHeight: `${activeDragDimensions.height}px`,
            boxSizing: 'border-box',
          };
        }
        
        return baseStyle;
      },
      [transform, transition, isDragging, activeDragDimensions]
    );

    const handleEdit = useCallback(() => {
      onEditPassage(passage.id);
    }, [passage.id, onEditPassage]);

    const handleDelete = useCallback(() => {
      onDeletePassage(passage.id);
    }, [passage.id, onDeletePassage]);

    const handleDuplicate = useCallback(() => {
      onDuplicatePassage(passage.id);
    }, [passage.id, onDuplicatePassage]);

    // Removed unused handlePointChange

    return (
      <div
        ref={(node) => {
          setNodeRef(node);
          itemRef.current = node;
        }}
        data-id={passage.id}
        style={style}
        className={`passage-item ${theme}-passage-item ${isDragging ? 'dragging' : ''}`}
      >
        <div className="passage-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div className='drag-handle' {...attributes} {...listeners}>
              <SwapOutlined
                rotate={90}
                style={{
                  fontSize: '20px',
                  color: '#999',
                  cursor: 'grab',
                }}
              />
            </div>
            <Typography.Text strong>
              {challengeType === 'WR' 
                ? 'Writing Part' 
                : challengeType === 'LI' 
                  ? `Listening Passage for next ${passage.questions?.length || 0} questions`
                  : challengeType === 'SP'
                    ? `Speaking Passage`
                    : `Passage for next ${passage.questions?.length || 0} questions`}
            </Typography.Text>
          </div>
          <div className="passage-controls">
            <div
              style={{ width: 120, textAlign: 'right', fontWeight: 600 }}
            >
              {passage.weight} weight
            </div>
            <Space size="small">
              <Tooltip title="Edit">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="Delete">
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  size="small"
                  danger
                />
              </Tooltip>
              <Tooltip title="Duplicate">
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={handleDuplicate}
                  size="small"
                />
              </Tooltip>
            </Space>
          </div>
        </div>

        <div
          className="passage-content"
          style={
            (challengeType === 'RE' || challengeType === 'LI' || challengeType === 'SP')
              ? {
                  display: 'flex',
                  gap: '24px',
                  // Keep fixed minHeight for Reading/Listening, but let Speaking shrink to content
                  ...(challengeType === 'SP' ? {} : { minHeight: '500px' })
                }
              : undefined
          }
        >
          {(challengeType === 'RE' || challengeType === 'LI' || challengeType === 'SP') && (
            <style>{`
              .reading-passage-scrollbar::-webkit-scrollbar { width: 8px; }
              .reading-passage-scrollbar::-webkit-scrollbar-track { background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'}; border-radius: 4px; }
              .reading-passage-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}; border-radius: 4px; border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'}; }
              .reading-passage-scrollbar::-webkit-scrollbar-thumb:hover { background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'}; }
              .transcript-scrollbar::-webkit-scrollbar { width: 8px; }
              .transcript-scrollbar::-webkit-scrollbar-track { background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'}; border-radius: 4px; }
              .transcript-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}; border-radius: 4px; border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'}; }
              .transcript-scrollbar::-webkit-scrollbar-thumb:hover { background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'}; }
              .speaking-prompt-scrollbar::-webkit-scrollbar { width: 8px; }
              .speaking-prompt-scrollbar::-webkit-scrollbar-track { background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'}; border-radius: 4px; }
              .speaking-prompt-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}; border-radius: 4px; border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'}; }
              .speaking-prompt-scrollbar::-webkit-scrollbar-thumb:hover { background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'}; }
            `}</style>
          )}
          
          {/* For Speaking challenges, use two-column layout: Left - Prompt, Right - Recording/Upload */}
          {challengeType === 'SP' ? (
            <>
              {/* Left Section - Prompt/Question */}
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
                }}
              >
                {/* Always show plain instruction at the top for Speaking */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  marginBottom: '12px',
                  borderRadius: '10px',
                  background: theme === 'sun'
                    ? 'rgba(24, 144, 255, 0.08)'
                    : 'rgba(139, 92, 246, 0.15)',
                  border: `2px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.4)' : 'rgba(139, 92, 246, 0.4)'}`,
                  color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                  fontSize: '14px',
                  fontWeight: 600,
                  boxShadow: theme === 'sun'
                    ? '0 2px 6px rgba(24, 144, 255, 0.12)'
                    : '0 2px 6px rgba(139, 92, 246, 0.12)'
                }}>
                  <span style={{ fontSize: '16px' }}>🎤</span>
                  <span>Voice Recording 3 minutes</span>
                </div>
                {/* Audio Player if available */}
                {passage.audioUrl && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '16px',
                    background: theme === 'sun' 
                      ? 'rgba(240, 249, 255, 0.5)' 
                      : 'rgba(244, 240, 255, 0.3)',
                    borderRadius: '8px',
                    border: theme === 'sun' 
                      ? '1px solid rgba(113, 179, 253, 0.2)' 
                      : '1px solid rgba(138, 122, 255, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '16px' }}>🎵</span>
                      <span style={{ fontWeight: 500, color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>
                        Audio File
                      </span>
                    </div>
                    <audio controls style={{ width: '100%' }}>
                      <source src={passage.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                
                {/* Passage/Prompt Content */}
                <div style={{
                  fontSize: '15px',
                  lineHeight: '1.8',
                  color: theme === 'sun' ? '#333' : '#1F2937',
                  textAlign: 'justify'
                }}>
                  <div dangerouslySetInnerHTML={{ __html: processPassageContent(passage.content, theme, challengeType) }} />
                </div>
              </div>

              {/* Right Section intentionally removed for teacher view */}
            </>
          ) : (
            <>
              {/* Audio Player for Listening Passages (render here except LI, where audio is shown inside transcript box) */}
              {((passage.type === 'LISTENING_PASSAGE') && challengeType !== 'LI') && passage.audioUrl && (
                <div style={{
                  marginBottom: '16px',
                  padding: '16px',
                  background: theme === 'sun' 
                    ? 'rgba(240, 249, 255, 0.5)' 
                    : 'rgba(244, 240, 255, 0.3)',
                  borderRadius: '8px',
                  border: theme === 'sun' 
                    ? '1px solid rgba(113, 179, 253, 0.2)' 
                    : '1px solid rgba(138, 122, 255, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '16px' }}>🎵</span>
                    <span style={{ fontWeight: 500, color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>
                      Audio File
                    </span>
                  </div>
                  <audio controls style={{ width: '100%' }}>
                    <source src={passage.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Passage Text */}
              <div 
                className={(challengeType === 'RE' || challengeType === 'LI' || challengeType === 'WR') ? 'reading-passage-scrollbar' : undefined}
                style={{ 
                  marginBottom: '16px', 
                  fontSize: '15px', 
                  lineHeight: '1.8',
                  padding: '16px',
                  background: theme === 'sun' 
                    ? 'rgba(240, 249, 255, 0.5)' 
                    : 'rgba(244, 240, 255, 0.3)',
                  borderRadius: '8px',
                  border: theme === 'sun' 
                    ? '1px solid rgba(113, 179, 253, 0.2)' 
                    : '1px solid rgba(138, 122, 255, 0.2)',
                  color: '#000000',
                  ...((challengeType === 'RE' || challengeType === 'LI' || challengeType === 'WR') ? { flex: 1, overflowY: 'auto', maxHeight: '600px' } : {})
                }}
              >
            {/* For Listening, show audio player inside the left box */}
            {challengeType === 'LI' && passage.audioUrl && (
              <div style={{
                marginBottom: '16px',
                padding: '16px',
                background: theme === 'sun' 
                  ? 'rgba(255, 255, 255, 0.8)' 
                  : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: theme === 'sun' 
                  ? '1px solid rgba(113, 179, 253, 0.2)' 
                  : '1px solid rgba(138, 122, 255, 0.2)'
              }}>
                <audio controls style={{ width: '100%' }}>
                  <source src={passage.audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            
            {/* View Transcript Button for Listening */}
            {challengeType === 'LI' && (
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: theme === 'sun' 
                      ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)'
                      : 'linear-gradient(135deg, #8B5CF6 0%, #a78bfa 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    boxShadow: theme === 'sun' 
                      ? '0 4px 12px rgba(24, 144, 255, 0.3)'
                      : '0 4px 12px rgba(139, 92, 246, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme === 'sun' 
                      ? 'linear-gradient(135deg, #40a9ff 0%, #69c0ff 100%)'
                      : 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = theme === 'sun' 
                      ? '0 6px 16px rgba(24, 144, 255, 0.4)'
                      : '0 6px 16px rgba(139, 92, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme === 'sun' 
                      ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)'
                      : 'linear-gradient(135deg, #8B5CF6 0%, #a78bfa 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = theme === 'sun' 
                      ? '0 4px 12px rgba(24, 144, 255, 0.3)'
                      : '0 4px 12px rgba(139, 92, 246, 0.3)';
                  }}
                >
                  <span>View transcript</span>
                  <span style={{ 
                    transform: showTranscript ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.3s ease',
                    fontSize: '12px'
                  }}>
                    ▼
                  </span>
                </button>

                {showTranscript && (
                  <div
                    className="transcript-scrollbar"
                    style={{
                      background: theme === 'sun' ? '#ffffff' : '#ffffff',
                      borderRadius: '8px',
                      padding: '16px',
                      border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(138, 122, 255, 0.3)'}`,
                      fontSize: '15px',
                      lineHeight: '1.8',
                      color: theme === 'sun' ? '#333' : '#333',
                      textAlign: 'justify',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      scrollbarWidth: 'thin',
                      scrollbarColor: theme === 'sun' 
                        ? '#1890ff rgba(24, 144, 255, 0.2)' 
                        : '#8B5CF6 rgba(138, 122, 255, 0.2)',
                      boxShadow: theme === 'sun' 
                        ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                        : '0 2px 8px rgba(138, 122, 255, 0.2)',
                      marginTop: '16px'
                    }}
                  >
                    <style>{`
                      .transcript-content img { max-width: 100%; height: auto; }
                      .transcript-content table { width: 100%; border-collapse: collapse; }
                      .transcript-content table, .transcript-content th, .transcript-content td { border: 1px solid #e5e7eb; }
                      .transcript-content th, .transcript-content td { padding: 6px; }
                    `}</style>
                    <div
                      className="transcript-content"
                      style={{ wordBreak: 'break-word' }}
                      dangerouslySetInnerHTML={{
                        __html: passage.transcript || passage.content || 'No transcript available'
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Don't show passage.content for LI - it's shown through transcript button instead */}
            {challengeType !== 'LI' && (
              <>
                <div 
                  ref={passageContentRef}
                  className="passage-text-content"
                  style={
                    challengeType === 'WR' && !showMore
                      ? {
                          maxHeight: '150px',
                          overflow: 'hidden',
                          position: 'relative',
                        }
                      : undefined
                  }
                  dangerouslySetInnerHTML={{ __html: processPassageContent(passage.content, theme, challengeType) }} 
                />
                {challengeType === 'WR' && needsToggle && (
                  <div
                    onClick={() => setShowMore(!showMore)}
                    role="button"
                    aria-expanded={showMore}
                    style={{
                      marginTop: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                      color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                      padding: '4px 8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.firstChild && (e.currentTarget.firstChild.style.transform = 'translateY(-2px)');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.firstChild && (e.currentTarget.firstChild.style.transform = 'translateY(0)');
                    }}
                  >
                    <span style={{
                      display: 'inline-block',
                      transition: 'transform 0.2s ease',
                      fontSize: '20px',
                    }}>
                      {showMore ? '▲' : '▼'}
                    </span>
                  </div>
                )}
              </>
            )}
                  </div>
            </>
          )}


          {/* Questions inside passage */}
          {challengeType !== 'WR' && challengeType !== 'SP' && passage.questions && passage.questions.length > 0 && (
            <div style={(challengeType === 'RE' || challengeType === 'LI') 
              ? { flex: 1, background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`, overflowY: 'auto', maxHeight: '600px', padding: '20px' }
              : { marginTop: '16px' }}>
              {passage.questions.map((question, qIndex) => (
                <div 
                  key={question.id}
                  className={`question-item ${theme}-question-item`}
                  style={{
                    marginBottom: '16px',
                    padding: '16px',
                    background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: theme === 'sun' 
                      ? '1px solid rgba(0, 0, 0, 0.1)' 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: theme === 'sun' 
                      ? '0 2px 4px rgba(0, 0, 0, 0.1)' 
                      : '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <div className="question-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <Typography.Text strong>
                        {challengeType === 'WR' 
                          ? `Writing part ${qIndex + 1}` 
                          : `${qIndex + 1}. ${getQuestionTypeLabel(question.type, t)}`}
                      </Typography.Text>
                    </div>
                    <div className="question-controls">
                      <div style={{ width: 120, textAlign: 'right', fontWeight: 600 }}>
                        {question.weight} weight
                      </div>
                    </div>
                  </div>

                  <div className="question-content">
                    {/* Render question based on type with inline replacements */}
                    {question.type === 'FILL_IN_THE_BLANK' ? (
                      <div className="question-text-wrapper">
                        <div 
                          className="question-text-content"
                          style={{ 
                            marginBottom: '16px', 
                            fontSize: '15px', 
                            lineHeight: '1.8'
                          }}
                          dangerouslySetInnerHTML={{ __html: renderFillBlankQuestionInline(question, theme) }}
                        />
                      </div>
                    ) : question.type === 'DROPDOWN' ? (
                      <div className="question-text-wrapper">
                        <div 
                          className="question-text-content"
                          style={{ 
                            marginBottom: '16px', 
                            fontSize: '15px', 
                            lineHeight: '1.8'
                          }}
                          dangerouslySetInnerHTML={{ __html: renderDropdownQuestionInline(question, theme) }}
                        />
                        {question.content?.data && question.content.data.length > 0 && (
                          <div style={{ 
                            marginTop: '16px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '12px'
                          }}>
                            {/* Group options by positionId */}
                            {(() => {
                              const positionGroups = {};
                              question.content.data.forEach((item) => {
                                if (!positionGroups[item.positionId]) {
                                  positionGroups[item.positionId] = [];
                                }
                                positionGroups[item.positionId].push(item);
                              });
                              
                              return Object.keys(positionGroups).map((positionId, idx) => {
                                const group = positionGroups[positionId];
                                const correctOption = group.find(opt => opt.correct === true);
                                const incorrectOptions = group.filter(opt => opt.correct === false);
                                const allOptions = [
                                  correctOption?.value || '',
                                  ...incorrectOptions.map(opt => opt.value).filter(value => value)
                                ];
                                
                                return (
                                  <div 
                                    key={idx}
                                    style={{
                                      padding: '10px',
                                      background: theme === 'sun' 
                                        ? 'rgba(24, 144, 255, 0.05)' 
                                        : 'rgba(167, 139, 250, 0.1)',
                                      border: theme === 'sun' 
                                        ? '2px solid rgba(24, 144, 255, 0.2)' 
                                        : '2px solid rgba(167, 139, 250, 0.3)',
                                      borderRadius: '8px'
                                    }}
                                  >
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      marginBottom: '8px'
                                    }}>
                                      <span style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: theme === 'sun' ? '#1890ff' : '#A78BFA',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: 700
                                      }}>
                                        {idx + 1}
                                      </span>
                                      {/* Removed text label next to number to match request */}
                                    </div>
                                    <div style={{ marginBottom: '6px' }}>
                                      <span style={{ fontSize: '11px', color: '#52c41a', fontWeight: 600 }}>✓</span>
                                      <span style={{ 
                                        marginLeft: '6px',
                                        padding: '3px 10px',
                                        background: 'rgba(82, 196, 26, 0.1)',
                                        border: '1.5px solid rgba(82, 196, 26, 0.4)',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: theme === 'sun' ? '#333' : '#000000'
                                      }}>
                                        {correctOption?.value || ''}
                                      </span>
                                    </div>
                                    {allOptions.length > 1 && (
                                      <div>
                                        <span style={{ fontSize: '11px', color: '#666', fontWeight: 600 }}>Options:</span>
                                        <div style={{ 
                                          display: 'flex', 
                                          flexWrap: 'wrap', 
                                          gap: '4px',
                                          marginTop: '4px'
                                        }}>
                                          {allOptions.map((option, optIdx) => (
                                            <span 
                                              key={optIdx}
                                              style={{
                                                padding: '2px 8px',
                                                background: option === correctOption?.value 
                                                  ? 'rgba(82, 196, 26, 0.1)' 
                                                  : 'rgba(0, 0, 0, 0.04)',
                                                border: option === correctOption?.value
                                                  ? '1.5px solid rgba(82, 196, 26, 0.4)'
                                                  : '1.5px solid rgba(0, 0, 0, 0.1)',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                color: theme === 'sun' ? '#333' : '#000000'
                                              }}
                                            >
                                              {option}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    ) : question.type === 'DRAG_AND_DROP' ? (
                      <div className="question-text-wrapper">
                        <div 
                          className="question-text-content"
                          style={{ 
                            marginBottom: '16px', 
                            fontSize: '15px', 
                            lineHeight: '1.8'
                          }}
                          dangerouslySetInnerHTML={{ __html: renderDragDropQuestionInline(question, theme) }}
                        />
                        {question.content?.data && question.content.data.length > 0 && (
                          <div style={{ 
                            marginTop: '16px',
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '12px'
                          }}>
                            {/* Correct options - green */}
                            {question.content.data.filter(item => item.positionId && item.correct === true).map((item, idx) => (
                              <div
                                key={`correct-${idx}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: '100px',
                                  minHeight: '28px',
                                  padding: '8px 16px',
                                  background: 'rgba(82, 196, 26, 0.12)',
                                  border: '2px solid rgba(82, 196, 26, 0.5)',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: 400,
                                  color: '#000000'
                                }}
                              >
                                <span style={{ fontWeight: 400, color: 'black', marginRight: '8px' }}>
                                  ({idx + 1})
                                </span>
                                <span>{item.value}</span>
                              </div>
                            ))}
                            {/* Incorrect options - gray */}
                            {question.content.data.filter(item => !item.positionId || item.correct === false).map((item, idx) => (
                              <div
                                key={`incorrect-${idx}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: '100px',
                                  minHeight: '28px',
                                  padding: '8px 16px',
                                  background: '#f2f2f2',
                                  border: '1.5px solid rgba(0, 0, 0, 0.15)',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: 400,
                                  color: '#666'
                                }}
                              >
                                {item.value}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : question.type === 'REARRANGE' ? (
                      <div className="question-text-wrapper">
                        <div 
                          className="question-text-content"
                          style={{ 
                            marginBottom: '16px', 
                            fontSize: '15px', 
                            lineHeight: '1.8'
                          }}
                          dangerouslySetInnerHTML={{ __html: renderRearrangeQuestionInline(question, theme) }}
                        />
                        {question.content?.data && question.content.data.length > 0 && (
                          <div style={{ 
                            marginTop: '16px',
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '12px'
                          }}>
                            {question.content.data.map((item, idx) => (
                              <div 
                                key={idx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '8px 16px',
                                  background: 'rgba(82, 196, 26, 0.12)',
                                  border: '2px solid rgba(82, 196, 26, 0.5)',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: 400
                                }}
                              >
                                <span style={{ 
                                  fontWeight: 400, 
                                  color: '#000000',
                                  fontSize: '15px'
                                }}>
                                  ({idx + 1})
                                </span>
                                <span style={{ color: '#000000' }}>
                                  {item.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : question.type === 'REWRITE' ? (
                      <div className="question-text-wrapper">
                        <div 
                          className="question-text-content"
                          style={{ 
                            marginBottom: '16px', 
                            fontSize: '15px', 
                            lineHeight: '1.8'
                          }}
                          dangerouslySetInnerHTML={{ __html: question.questionText || question.question }}
                        />
                        {question.content?.data && question.content.data.length > 0 && (
                          <div style={{ 
                            background: 'rgba(82, 196, 26, 0.1)',
                            border: '2px solid rgba(82, 196, 26, 0.3)',
                            borderRadius: '12px',
                            padding: '16px'
                          }}>
                            <div style={{ 
                              fontSize: '14px', 
                              fontWeight: 600, 
                              color: '#52c41a',
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              ✓ Correct Answers:
                            </div>
                            <div style={{ 
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}>
                              {question.content.data.map((item, idx) => (
                                <div 
                                  key={item.id || idx}
                                  style={{
                                    padding: '10px 16px',
                                    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                                    border: '2px solid #22c55e',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: theme === 'sun' ? '#333' : '#000000',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px',
                                    boxShadow: '0 2px 6px rgba(34, 197, 94, 0.12)'
                                  }}
                                >
                                  <span style={{
                                    fontWeight: 700,
                                    color: '#52c41a',
                                    fontSize: '13px',
                                    minWidth: '20px',
                                    lineHeight: '1.4'
                                  }}>
                                    {idx + 1}.
                                  </span>
                    <div 
                      style={{ 
                        flex: 1,
                        lineHeight: '1.4',
                        fontWeight: 200
                      }}
                      dangerouslySetInnerHTML={{ __html: item.value }} 
                    />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div 
                          className="question-text-content"
                          style={{ 
                            marginBottom: '16px', 
                            fontSize: '15px' 
                          }}
                          dangerouslySetInnerHTML={{ __html: question.question }}
                        />
                        {question.options && (
                          <div className="question-options" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                            <style>{`.option-text p{margin:0}`}</style>
                            {question.options.map((option, idx) => {
                              const isMulti = question.type === 'MULTIPLE_SELECT';
                              const key = option.key || String.fromCharCode(65 + idx);
                              return (
                                <label
                                  key={key}
                                  className={`option-item ${option.isCorrect ? 'correct-answer' : ''}`}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '12px 14px',
                                    background: option.isCorrect 
                                      ? 'rgba(82, 196, 26, 0.08)'
                                      : (theme === 'sun' ? '#fff' : 'rgba(255,255,255,0.03)'),
                                    border: option.isCorrect
                                      ? '2px solid rgba(82, 196, 26, 0.4)'
                                      : `2px solid ${theme === 'sun' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    minHeight: '48px'
                                  }}
                                >
                                  <input
                                    type={isMulti ? 'checkbox' : 'radio'}
                                    name={`question-${question.id}`}
                                    defaultChecked={!!option.isCorrect}
                                    onChange={() => {}}
                                    style={{ width: '18px', height: '18px', accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6' }}
                                  disabled
                                  />
                                  <span style={{ fontWeight: 400 }}>{key}.</span>
                                  <span className="option-text" style={{ flex: 1, display: 'block', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: option.text }} />
                                  {option.isCorrect && (
                                    <span style={{ color: '#52c41a', fontSize: '16px' }}></span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.passage.id === nextProps.passage.id &&
      prevProps.passage.content === nextProps.passage.content &&
      prevProps.passage.weight === nextProps.passage.weight &&
      prevProps.theme === nextProps.theme &&
      prevProps.index === nextProps.index
    );
  }
);

SortablePassageItem.displayName = 'SortablePassageItem';

// Helper function to get question type label
const getQuestionTypeLabel = (type, t) => {
  switch(type) {
    case 'MULTIPLE_CHOICE':
      return t?.('dailyChallenge.multipleChoice') || 'Multiple Choice';
    case 'MULTIPLE_SELECT':
      return t?.('dailyChallenge.multipleSelect') || 'Multiple Select';
    case 'TRUE_OR_FALSE':
      return t?.('dailyChallenge.trueFalse') || 'True/False';
    case 'FILL_IN_THE_BLANK':
      return t?.('dailyChallenge.fillBlank') || 'Fill in the Blank';
    case 'DROPDOWN':
      return t?.('dailyChallenge.dropdown') || 'Dropdown';
    case 'DRAG_AND_DROP':
      return t?.('dailyChallenge.dragDrop') || 'Drag and Drop';
    case 'REARRANGE':
      return t?.('dailyChallenge.rearrange') || 'Rearrange';
    case 'REWRITE':
      return t?.('dailyChallenge.rewrite') || 'Re-write';
    default:
      return t?.('dailyChallenge.multipleChoice') || 'Multiple Choice';
  }
};

// Helper function to render Fill in the Blank question with inline replacements (answers inline in green)
const renderFillBlankQuestionInline = (question, theme) => {
  if (!question.questionText || !question.content?.data) {
    return question.questionText || question.question;
  }

  let displayText = question.questionText;
  const correctBg = 'rgba(82, 196, 26, 0.12)';
  const correctBorder = 'rgba(82, 196, 26, 0.5)';
  const correctText = '#52c41a';

  // Build map positionId -> correct value
  const posToValue = {};
  question.content.data.forEach((item) => {
    if (item.correct === true && item.positionId) {
      posToValue[item.positionId] = String(item.value || '')
        .replace(/<[^>]*>/g,' ')
        .replace(/&nbsp;/g,' ')
        .trim();
    }
  });

  Object.keys(posToValue).forEach((pid) => {
    const pattern = `[[pos_${pid}]]`;
    const value = posToValue[pid];
    displayText = displayText.replace(
      pattern,
      `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:${correctBg};border:2px solid ${correctBorder};border-radius:8px;color:black;margin:0 6px 6px 6px;">${value}</span>`
    );
  });

  return displayText;
};

// Helper function to render Dropdown question with inline replacements
const renderDropdownQuestionInline = (question, theme) => {
  if (!question.questionText || !question.content?.data) {
    return question.questionText || question.question;
  }

  let displayText = question.questionText;
  // Use correct-green styling to indicate answer is fixed
  const bg = 'rgba(82, 196, 26, 0.12)';
  const border = 'rgba(82, 196, 26, 0.5)';
  const color = '#52c41a';

  // Group options by positionId
  const positionGroups = {};
  question.content.data.forEach((item) => {
    if (!positionGroups[item.positionId]) positionGroups[item.positionId] = [];
    positionGroups[item.positionId].push(item);
  });

  // For each placeholder, inject a styled <select> with the correct answer pre-selected
  Object.keys(positionGroups).forEach((positionId, idx) => {
    const pattern = `[[pos_${positionId}]]`;
    const group = positionGroups[positionId];
    const correctValue = (group.find(it => it.correct === true)?.value || '').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').trim();
    const opts = group
      .map((it) => (it?.value ?? ''))
      .filter((v) => v !== null && v !== undefined && String(v).length > 0)
      .map(v => String(v).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').trim());
    const selectedIndex = Math.max(0, opts.findIndex(v => v === correctValue));
    const optionsHtml = opts.map(v => `<option style="white-space: normal; word-break: break-word; overflow-wrap: anywhere; line-height: 1.4;" value="${v}" ${v === correctValue ? 'selected' : ''} title="${v}">${v}</option>`).join('');
    const selectHtml = `<select data-idx="${selectedIndex}" onchange="this.selectedIndex=this.dataset.idx" style="display:inline-block;width:120px;max-width:120px;height:32px;padding:4px 12px;margin:0 8px;background:${bg};border:2px solid ${border};border-radius:8px;font-size:14px;color:black;cursor:pointer;outline:none;text-align:center;box-sizing:border-box;overflow:hidden;white-space:normal;appearance:auto;">${optionsHtml}</select>`;
    displayText = displayText.replace(pattern, selectHtml);
  });

  return displayText;
};

// Helper function to render Drag and Drop question with inline replacements
const renderDragDropQuestionInline = (question, theme) => {
  if (!question.questionText || !question.content?.data) {
    return question.questionText || question.question;
  }

  let displayText = question.questionText;

  // Show the correct answers inline inside the blanks
  const chipBg = 'rgba(82, 196, 26, 0.12)';
  const chipBorder = 'rgba(82, 196, 26, 0.5)';

  // Filter correct options (those with positionId and correct: true)
  const correctOptions = question.content.data.filter(item => 
    item.positionId && item.correct === true
  );
  
  correctOptions.forEach((item, idx) => {
    const number = idx + 1;
    const pattern = `[[pos_${item.positionId}]]`;
    const value = String(item.value || '')
      .replace(/<[^>]*>/g,' ')
      .replace(/&nbsp;/g,' ')
      .trim();

    displayText = displayText.replace(
      pattern,
      `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:${chipBg};border:2px solid ${chipBorder};border-radius:8px;color:#000000;margin:0 6px 6px 6px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:${chipBorder};color:#ffffff;font-size:11px;">${number}</span>
        <span style="white-space:normal;word-break:break-word;">${value}</span>
      </span>`
    );
  });

  return displayText;
};

// Helper function to render Rearrange question with inline replacements
const renderRearrangeQuestionInline = (question, theme) => {
  if (!question.questionText || !question.content?.data) {
    return question.questionText || question.question;
  }

  let displayText = question.questionText;

  // Filled chips with answers inline
  const chipBg = 'rgba(82, 196, 26, 0.12)';
  const chipBorder = 'rgba(82, 196, 26, 0.5)';

  // Keep the given order from data
  const sortedData = question.content.data;
  
  sortedData.forEach((item, idx) => {
    const number = idx + 1;
    const pattern = `[[pos_${item.positionId}]]`;
    const value = String(item.value || '')
      .replace(/<[^>]*>/g,' ')
      .replace(/&nbsp;/g,' ')
      .trim();
    
    displayText = displayText.replace(
      pattern,
      `<span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;margin:0 6px;background:${chipBg};border:2px solid ${chipBorder};border-radius:8px;color:#000000;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:${chipBorder};color:#ffffff;font-size:11px;">${number}</span>
        <span style="white-space:normal;word-break:break-word;">${value}</span>
      </span>`
    );
  });

  return displayText;
};

// Sortable Question Item Component
const SortableQuestionItem = memo(
  ({ question, index, onDeleteQuestion, onEditQuestion, onDuplicateQuestion, onPointsChange, theme, t, challengeType, activeDragDimensions }) => {
    // Optimized: Only animate during active sorting/dragging to reduce lag
    const animateLayoutChanges = useCallback((args) => {
      const { isSorting, wasDragging } = args;
      if (isSorting || wasDragging) {
        return defaultAnimateLayoutChanges(args);
      }
      // Skip animation when not actively sorting to improve performance
      return false;
    }, []);

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: question.id,
      animateLayoutChanges,
    });

    // Store ref for the item
    const itemRef = useRef(null);

    const style = useMemo(
      () => {
        const baseStyle = {
          transform: transform ? CSS.Transform.toString(transform) : undefined,
          transition: isDragging ? 'none' : (transition || undefined), // No transition when dragging to reduce lag
          opacity: isDragging ? 0.6 : 1,
          willChange: isDragging ? 'transform' : 'auto', // Optimize only when dragging
          pointerEvents: isDragging ? 'none' : 'auto', // Disable pointer events when dragging
        };
        
        // Fix stretching/shrinking by preserving dimensions when dragging
        if (isDragging && activeDragDimensions) {
          return {
            ...baseStyle,
            width: `${activeDragDimensions.width}px`,
            minWidth: `${activeDragDimensions.width}px`,
            maxWidth: `${activeDragDimensions.width}px`,
            height: `${activeDragDimensions.height}px`,
            minHeight: `${activeDragDimensions.height}px`,
            maxHeight: `${activeDragDimensions.height}px`,
            boxSizing: 'border-box',
          };
        }
        
        return baseStyle;
      },
      [transform, transition, isDragging, activeDragDimensions]
    );

    const handleEdit = useCallback(() => {
      onEditQuestion(question.id);
    }, [question.id, onEditQuestion]);

    const handleDelete = useCallback(() => {
      onDeleteQuestion(question.id);
    }, [question.id, onDeleteQuestion]);

    const handleDuplicate = useCallback(() => {
      onDuplicateQuestion(question.id);
    }, [question.id, onDuplicateQuestion]);

    // Removed unused handlePointChange

    // Helper function to render Fill in the Blank question
    const renderFillBlankQuestion = useCallback(() => {
      if (question.type !== 'FILL_IN_THE_BLANK' || !question.questionText) {
        return null;
      }

      // Theme colors for correct inline answers
      const correctBg = 'rgba(82, 196, 26, 0.12)';
      const correctBorder = 'rgba(82, 196, 26, 0.5)';
      const correctText = '#52c41a';

      // Parse and inline replace with correct answers
      let displayText = question.questionText;
      
      console.log('FillBlank question:', question);
      console.log('question.content:', question.content);
      
      if (question.content && question.content.data) {
        // Build map of correct answers
        const posToVal = {};
        question.content.data.forEach((item) => {
          if (item.correct === true && item.positionId) {
            posToVal[item.positionId] = String(item.value || '')
              .replace(/<[^>]*>/g,' ')
              .replace(/&nbsp;/g,' ')
              .trim();
          }
        });
        Object.keys(posToVal).forEach((pid) => {
          const pattern = `[[pos_${pid}]]`;
          const value = posToVal[pid];
          displayText = displayText.replace(
            pattern,
            `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:${correctBg};border:2px solid ${correctBorder};border-radius:8px;color:${correctText};margin:0 4px;">${value}</span>`
          );
        });
      }

      return (
        <>
          {/* Question Text with blanks */}
          <div 
            style={{ 
              marginBottom: '16px', 
              fontSize: '15px', 
              fontWeight: 500,
              lineHeight: '1.8'
            }}
            dangerouslySetInnerHTML={{ __html: displayText }}
          />
        </>
      );
    }, [question, theme]);

    // Helper function to render Dropdown question
    const renderDropdownQuestion = useCallback(() => {
      if (question.type !== 'DROPDOWN' || !question.questionText) {
        return null;
      }

      // Theme colors
      const dropdownColor = theme === 'sun' ? '#1890ff' : '#A78BFA';
      const dropdownBgStart = theme === 'sun' 
        ? 'rgba(24, 144, 255, 0.15)' 
        : 'rgba(167, 139, 250, 0.2)';
      const dropdownBgEnd = theme === 'sun' 
        ? 'rgba(24, 144, 255, 0.25)' 
        : 'rgba(167, 139, 250, 0.3)';
      const dropdownBorderColor = theme === 'sun' ? '#1890ff' : '#A78BFA';
      const cardBgColor = theme === 'sun' 
        ? 'rgba(24, 144, 255, 0.05)' 
        : 'rgba(167, 139, 250, 0.1)';
      const cardBorderColor = theme === 'sun' 
        ? 'rgba(24, 144, 255, 0.2)' 
        : 'rgba(167, 139, 250, 0.3)';
      const correctColor = theme === 'sun' ? '#52c41a' : '#73d13d';
      const correctBgColor = theme === 'sun' 
        ? 'rgba(82, 196, 26, 0.1)' 
        : 'rgba(115, 209, 61, 0.15)';
      const correctBorderColor = theme === 'sun' 
        ? 'rgba(82, 196, 26, 0.4)' 
        : 'rgba(115, 209, 61, 0.5)';
      const answerTextColor = theme === 'sun' ? '#333' : '#000000';
      const labelColor = theme === 'sun' ? '#666' : '#b0b0b0';
      const optionBgColor = theme === 'sun' 
        ? 'rgba(0, 0, 0, 0.04)' 
        : 'rgba(255, 255, 255, 0.08)';
      const optionBorderColor = theme === 'sun' 
        ? 'rgba(0, 0, 0, 0.1)' 
        : 'rgba(255, 255, 255, 0.15)';

      // Parse questionText and replace [[pos_xxx]] with styled dropdown
      let displayText = question.questionText;
      const dropdownsData = [];
      
      console.log('Dropdown question:', question);
      console.log('question.content:', question.content);
      
      if (question.content && question.content.data) {
        // Group options by positionId
        const positionGroups = {};
        question.content.data.forEach((item) => {
          if (!positionGroups[item.positionId]) {
            positionGroups[item.positionId] = [];
          }
          positionGroups[item.positionId].push(item);
        });
        
        // Process each position group
        Object.keys(positionGroups).forEach((positionId, idx) => {
          const number = idx + 1; // 1, 2, 3, 4...
          const pattern = `[[pos_${positionId}]]`;
          
          const group = positionGroups[positionId];
          const correctOption = group.find(opt => opt.correct === true);
          const incorrectOptions = group.filter(opt => opt.correct === false);
          
          // Get all options (correct + incorrect)
          const allOptions = [
            correctOption?.value || '',
            ...incorrectOptions.map(opt => opt.value).filter(value => value)
          ];
          
          // Replace pattern with dropdown display
          // Build select HTML like student preview
          const opts = allOptions.map(v => String(v).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').trim()).filter(Boolean);
          const correctVal = (correctOption?.value || '').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').trim();
          const optionsHtml = opts.map(v => `<option value="${v}" ${v === correctVal ? 'selected' : ''}>${v}</option>`).join('');
          const replaced = `<select style="display:inline-block;width:120px;height:32px;padding:4px 12px;margin:0 8px;background:rgba(24, 144, 255, 0.08);border:2px solid ${dropdownBorderColor};border-radius:8px;font-size:14px;color:${dropdownColor};cursor:pointer;outline:none;text-align:center;box-sizing:border-box;overflow:hidden;text-overflow:ellipsis;">${optionsHtml}</select>`;
          displayText = displayText.replace(pattern, replaced);
          
          // Store dropdown data
          dropdownsData.push({
            number: number,
            correctAnswer: correctOption?.value || '',
            allOptions: allOptions
          });
        });
      }

      return (
        <>
          {/* Question Text with dropdowns */}
          <div 
            style={{ 
              marginBottom: '16px', 
              fontSize: '15px', 
              fontWeight: 500,
              lineHeight: '1.8'
            }}
            dangerouslySetInnerHTML={{ __html: displayText }}
          />

          {/* Dropdowns Info */}
          {dropdownsData.length > 0 && (
            <div style={{ 
              marginTop: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px'
            }}>
              {dropdownsData.map((dropdown, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '10px',
                    background: cardBgColor,
                    border: `2px solid ${cardBorderColor}`,
                    borderRadius: '8px'
                  }}
                >
                  {/* Dropdown Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: dropdownColor,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      {dropdown.number}
                    </span>
                    {/* Removed text label, keep only the number chip */}
                  </div>

                  {/* Correct Answer */}
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: correctColor, fontWeight: 600 }}>
                      ✓
                    </span>
                    <span style={{ 
                      marginLeft: '6px',
                      padding: '3px 10px',
                      background: correctBgColor,
                      border: `1.5px solid ${correctBorderColor}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: answerTextColor
                    }}>
                      {dropdown.correctAnswer}
                    </span>
                  </div>

                  {/* All Options */}
                  {dropdown.allOptions.length > 1 && (
                    <div>
                      <span style={{ fontSize: '11px', color: labelColor, fontWeight: 600 }}>
                        Options:
                      </span>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '4px',
                        marginTop: '4px'
                      }}>
                        {dropdown.allOptions.map((option, optIdx) => (
                          <span 
                            key={optIdx}
                            style={{
                              padding: '2px 8px',
                              background: option === dropdown.correctAnswer 
                                ? correctBgColor 
                                : optionBgColor,
                              border: option === dropdown.correctAnswer
                                ? `1.5px solid ${correctBorderColor}`
                                : `1.5px solid ${optionBorderColor}`,
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: answerTextColor
                            }}
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      );
    }, [question, theme]);

    // Helper function to render Drag and Drop question
    const renderDragDropQuestion = useCallback(() => {
      if (question.type !== 'DRAG_AND_DROP' || !question.questionText) {
        return null;
      }

      // Theme colors
      const blankColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
      const blankBgColor = theme === 'sun' 
        ? 'rgba(24, 144, 255, 0.08)' 
        : 'rgba(139, 92, 246, 0.15)';
      const blankBorderColor = theme === 'sun' 
        ? 'rgba(24, 144, 255, 0.3)' 
        : 'rgba(139, 92, 246, 0.4)';
      const incorrectBgColor = theme === 'sun' 
        ? 'rgba(217, 217, 217, 0.2)' 
        : 'rgba(255, 255, 255, 0.08)';
      const incorrectBorderColor = theme === 'sun' 
        ? 'rgba(217, 217, 217, 0.5)' 
        : 'rgba(255, 255, 255, 0.2)';
      const answerTextColor = theme === 'sun' ? '#333' : '#000000';
      const incorrectTextColor = theme === 'sun' ? '#666' : '#b0b0b0';

      // Parse questionText and replace [[pos_xxx]] with styled blanks
      let displayText = question.questionText;
      const answerChoices = [];
      const incorrectOptions = [];
      
      console.log('DragDrop question:', question);
      console.log('question.content:', question.content);
      
      if (question.content && question.content.data) {
        // Filter correct options (those with positionId and correct: true)
        const correctOptions = question.content.data.filter(item => 
          item.positionId && item.correct === true
        );
         
        // Filter incorrect options (those with positionId: null or correct: false)
        const incorrectOpts = question.content.data.filter(item => 
          !item.positionId || item.correct === false
        );
        
        // Process correct options only for blanks
        correctOptions.forEach((item, idx) => {
          const number = idx + 1; // 1, 2, 3, 4...
          const pattern = `[[pos_${item.positionId}]]`;
          
          // Replace pattern with styled blank format
          displayText = displayText.replace(
            pattern,
              `<span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: linear-gradient(135deg, ${blankBgColor}, ${blankBgColor.replace('0.08', '0.15').replace('0.15', '0.25')}); border: 2px solid ${blankBorderColor}; border-radius: 8px; color: ${blankColor}; margin: 0 4px;">
              <span style="width: 18px; height: 18px; border-radius: 50%; background: ${blankColor}; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 11px;">${number}</span>
              <span style="text-decoration: underline; padding: 0 2px;">____</span>
            </span>`
          );
          
          // Add to answer choices
          answerChoices.push({
            number: number,
            value: item.value
          });
        });
        
        // Process incorrect options (only those without positionId)
        incorrectOpts.forEach(item => {
          if (!item.positionId && item.value) {
            incorrectOptions.push({
              id: item.id || Date.now(),
              text: item.value
            });
          }
        });
      }

      return (
        <>
          {/* Question Text with blanks */}
          <div 
            style={{ 
              marginBottom: '16px', 
              fontSize: '15px', 
              fontWeight: 500,
              lineHeight: '1.8'
            }}
            dangerouslySetInnerHTML={{ __html: displayText }}
          />

          {/* Correct Answer Choices */}
          {answerChoices.length > 0 && (
            <div style={{ 
              marginTop: '16px',
              marginBottom: incorrectOptions.length > 0 ? '16px' : '0'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: blankColor,
                marginBottom: '8px'
              }}>
                ✓ Correct options:
              </div>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px'
              }}>
                {answerChoices.map((choice, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: blankBgColor,
                      border: `2px solid ${blankBorderColor}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 400
                    }}
                  >
                    <span style={{ 
                      fontWeight: 700, 
                      color: blankColor,
                      fontSize: '15px'
                    }}>
                      ({choice.number})
                    </span>
                    <span style={{ color: answerTextColor }}>
                      {choice.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incorrect Options */}
          {incorrectOptions.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: incorrectTextColor,
                marginBottom: '8px'
              }}>
                ✗ Incorrect options:
              </div>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px'
              }}>
                {incorrectOptions.map((option, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 12px',
                      background: incorrectBgColor,
                      border: `1.5px solid ${incorrectBorderColor}`,
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 400,
                      color: incorrectTextColor
                    }}
                  >
                    {option.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      );
    }, [question, theme]);

    // Helper function to render Reorder question
    const renderReorderQuestion = useCallback(() => {
      if (question.type !== 'REARRANGE' || !question.content?.data) {
        return null;
      }

      // Theme colors
      const wordBgStart = theme === 'sun' 
        ? 'rgba(240, 247, 255, 0.5)' 
        : 'rgba(243, 232, 255, 0.2)';
      const wordBgEnd = theme === 'sun' 
        ? 'rgba(230, 244, 255, 0.8)' 
        : 'rgba(233, 213, 255, 0.3)';
      const wordBorderColor = theme === 'sun' ? '#1890ff' : '#A78BFA';
      const correctColor = theme === 'sun' ? '#52c41a' : '#73d13d';
      const correctBgColor = theme === 'sun' 
        ? 'rgba(82, 196, 26, 0.1)' 
        : 'rgba(115, 209, 61, 0.15)';
      const correctBorderColor = theme === 'sun' 
        ? 'rgba(82, 196, 26, 0.3)' 
        : 'rgba(115, 209, 61, 0.4)';
      const textColor = theme === 'sun' ? '#333' : '#000000';

      // Parse questionText and replace [[pos_xxx]] with styled blanks
      let displayText = question.questionText || '';
      const wordsData = [];
      
      console.log('REARRANGE question:', question);
      console.log('question.content:', question.content);
      
      if (question.content && question.content.data) {
        // Use data as is
        const sortedData = question.content.data;
        
        sortedData.forEach((item, idx) => {
          const number = idx + 1; // 1, 2, 3, 4...
          const pattern = `[[pos_${item.positionId}]]`;
          
          // Replace pattern with styled blank format
          displayText = displayText.replace(
            pattern,
            `<span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: linear-gradient(135deg, ${wordBgStart}, ${wordBgEnd}); border: 2px solid ${wordBorderColor}; border-radius: 8px; color: ${wordBorderColor}; margin: 0 4px;">
              <span style="width: 18px; height: 18px; border-radius: 50%; background: ${wordBorderColor}; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 11px;">${number}</span>
              <span style="text-decoration: underline; padding: 0 2px;">____</span>
            </span>`
          );
          
          // Add to words data
          wordsData.push({
            number: number,
            value: item.value,
            positionId: item.positionId
          });
        });
      }

      return (
        <>
          {/* Question Text with blanks */}
          <div 
            style={{ 
              marginBottom: '16px', 
              fontSize: '15px', 
              fontWeight: 500,
              lineHeight: '1.8'
            }}
            dangerouslySetInnerHTML={{ __html: displayText }}
          />

          {/* Words to Rearrange */}
          {wordsData.length > 0 && (
            <div style={{ 
              marginTop: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: wordBorderColor,
                marginBottom: '8px'
              }}>
                🔀 Words to rearrange:
              </div>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '12px'
              }}>
                {wordsData.map((word, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: 'rgba(82, 196, 26, 0.12)',
                      border: '2px solid rgba(82, 196, 26, 0.5)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 400
                    }}
                  >
                    <span style={{ 
                      fontWeight: 700, 
                      color: '#000000',
                      fontSize: '15px'
                    }}>
                      ({word.number})
                    </span>
                    <span style={{ color: '#000000' }}>
                      {word.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correct Answer */}
          <div style={{ 
            background: correctBgColor,
            border: `2px solid ${correctBorderColor}`,
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: correctColor,
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ✓ Correct Order:
            </div>
            <div 
              style={{ 
                fontSize: '15px',
                fontWeight: 400,
                color: textColor,
                lineHeight: '1.8'
              }}
            >
              {wordsData.map(word => word.value).join(' ')}
            </div>
          </div>
        </>
      );
    }, [question, theme]);

    // Helper function to render Rewrite question
    const renderRewriteQuestion = useCallback(() => {
      if (question.type !== 'REWRITE' || !question.questionText) {
        return null;
      }

      // Theme colors
      const correctColor = theme === 'sun' ? '#52c41a' : '#73d13d';
      const correctBgColor = theme === 'sun' 
        ? 'rgba(82, 196, 26, 0.1)' 
        : 'rgba(115, 209, 61, 0.15)';
      const correctBorderColor = theme === 'sun' 
        ? 'rgba(82, 196, 26, 0.3)' 
        : 'rgba(115, 209, 61, 0.4)';
      const answerBgStart = theme === 'sun' 
        ? '#dcfce7' 
        : 'rgba(220, 252, 231, 0.2)';
      const answerBgEnd = theme === 'sun' 
        ? '#bbf7d0' 
        : 'rgba(187, 247, 208, 0.3)';
      const answerBorderColor = theme === 'sun' ? '#22c55e' : '#73d13d';
      const textColor = theme === 'sun' ? '#333' : '#000000';

      // Parse questionText and remove positionId markers for display
      let displayText = question.questionText;
      if (question.content && question.content.data) {
        // Remove positionId markers like [[pos_a1b2c3]] from display
        question.content.data.forEach((item) => {
          const pattern = `[[pos_${item.positionId}]]`;
          displayText = displayText.replace(pattern, '');
        });
      }

      return (
        <>
          {/* Question Text */}
          <div 
            style={{ 
              marginBottom: '16px', 
              fontSize: '15px', 
              lineHeight: '1.8'
            }}
            dangerouslySetInnerHTML={{ __html: displayText }}
          />

          {/* Correct Answers from content.data */}
          {question.content && question.content.data && question.content.data.length > 0 && (
            <div style={{ 
              background: correctBgColor,
              border: `2px solid ${correctBorderColor}`,
              borderRadius: '12px',
              padding: '16px'
            }}>
              <style>{`.rewrite-answer p{margin-top:0;margin-bottom:0}`}</style>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: correctColor,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ✓ Correct Answers:
              </div>
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {question.content.data.map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    style={{
                      padding: '10px 16px',
                      background: `linear-gradient(135deg, ${answerBgStart} 0%, ${answerBgEnd} 100%)`,
                      border: `2px solid ${answerBorderColor}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: textColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 2px 6px rgba(34, 197, 94, 0.12)'
                    }}
                  >
                    <span style={{
                      fontWeight: 700,
                      color: correctColor,
                      textAlign: 'center',
                      
                      fontSize: '13px',
                      minWidth: '20px',
                      lineHeight: '1.4'
                    }}>
                      {idx + 1}.
                    </span>
                    <div 
                      style={{ 
                        flex: 1,
                        lineHeight: '1.4',
                        fontWeight: 400
                      }}
                      className="rewrite-answer"
                      dangerouslySetInnerHTML={{ __html: item.value }} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback: Show correctAnswers if content.data is not available */}
          {(!question.content || !question.content.data || question.content.data.length === 0) && 
           question.correctAnswers && question.correctAnswers.length > 0 && (
            <div style={{ 
              background: correctBgColor,
              border: `2px solid ${correctBorderColor}`,
              borderRadius: '12px',
              padding: '16px'
            }}>
              <style>{`.rewrite-answer p{margin-top:0;margin-bottom:0}`}</style>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: correctColor,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ✓ Correct Answers:
              </div>
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {question.correctAnswers.map((ans, idx) => (
                  <div 
                    key={ans.id || idx}
                    style={{
                      padding: '10px 16px',
                      background: `linear-gradient(135deg, ${answerBgStart} 0%, ${answerBgEnd} 100%)`,
                      border: `2px solid ${answerBorderColor}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: textColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 2px 6px rgba(34, 197, 94, 0.12)'
                    }}
                  >
                    <span style={{
                      fontWeight: 700,
                      color: correctColor,
                      textAlign: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      minWidth: '20px',
                      height: '20px',
                      lineHeight: '1.4'
                    }}>
                      {idx + 1}.
                    </span>
                    <div 
                      style={{ 
                        flex: 1,
                        lineHeight: '1.4',
                        marginBottom: '0px',
                        fontWeight: 400,
                      }}
                      className="rewrite-answer"
                      dangerouslySetInnerHTML={{ __html: ans.answer }} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      );
    }, [question, theme]);

    // Get question type label
    const getQuestionTypeLabel = useCallback(() => {
      switch(question.type) {
        case 'MULTIPLE_CHOICE':
          return t('dailyChallenge.multipleChoice') || 'Multiple Choice';
        case 'MULTIPLE_SELECT':
          return t('dailyChallenge.multipleSelect') || 'Multiple Select';
        case 'TRUE_OR_FALSE':
          return t('dailyChallenge.trueFalse') || 'True/False';
        case 'FILL_IN_THE_BLANK':
          return t('dailyChallenge.fillBlank') || 'Fill in the Blank';
        case 'DROPDOWN':
          return t('dailyChallenge.dropdown') || 'Dropdown';
        case 'DRAG_AND_DROP':
          return t('dailyChallenge.dragDrop') || 'Drag and Drop';
        case 'REARRANGE':
          return t('dailyChallenge.rearrange') || 'Rearrange';
        case 'REWRITE':
          return t('dailyChallenge.rewrite') || 'Re-write';
        default:
          return t('dailyChallenge.multipleChoice') || 'Multiple Choice';
      }
    }, [question.type, t]);

    return (
      <div
        ref={(node) => {
          setNodeRef(node);
          itemRef.current = node;
        }}
        data-id={question.id}
        style={style}
        className={`question-item ${theme}-question-item ${isDragging ? 'dragging' : ''}`}
      >
        <div className="question-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div className='drag-handle' {...attributes} {...listeners}>
              <SwapOutlined
                rotate={90}
                style={{
                  fontSize: '20px',
                  color: '#999',
                  cursor: 'grab',
                }}
              />
            </div>
            <Typography.Text strong>{index + 1}. {getQuestionTypeLabel(question.type, t)}</Typography.Text>
          </div>
          <div className="question-controls">
            <div style={{ width: 120, textAlign: 'right', fontWeight: 600 }}>
              {question.weight} weight
            </div>
            <Space size="small">
              <Tooltip title="Edit">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="Delete">
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  size="small"
                  danger
                />
              </Tooltip>
              <Tooltip title="Duplicate">
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={handleDuplicate}
                  size="small"
                />
              </Tooltip>
            </Space>
          </div>
        </div>

        <div className="question-content">
          {/* Render based on question type */}
          {question.type === 'FILL_IN_THE_BLANK' && challengeType === 'GV' ? (
            (() => {
              if (!question.questionText) return null;
              // Use green "correct" styling and place answers inline in the sentence
              const correctBg = 'rgba(82, 196, 26, 0.12)';
              const correctBorder = 'rgba(82, 196, 26, 0.5)';
              const textColor = theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)';
              let displayText = question.questionText;
              if (question.content && Array.isArray(question.content.data)) {
                // Only replace placeholders for correct items (have positionId and correct === true)
                question.content.data.forEach((item) => {
                  if (!item || !item.positionId || item.correct !== true) return;
                  const pattern = `[[pos_${item.positionId}]]`;
                  const value = String(item.value || '')
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/&nbsp;/g, ' ')
                    .trim();
                  displayText = displayText.replace(
                    pattern,
                    `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:${correctBg};border:2px solid ${correctBorder};border-radius:8px;color:black;margin:0 6px 6px 6px;">${value}</span>`
                  );
                });
              }
              return (
                <div 
                  className="question-text-content"
                  style={{ 
                    marginBottom: '16px', 
                    fontSize: '15px', 
                    fontWeight: 350,
                    lineHeight: '1.8',
                    color: textColor
                  }}
                  dangerouslySetInnerHTML={{ __html: displayText }}
                />
              );
            })()
          ) : question.type === 'FILL_IN_THE_BLANK' ? (
            renderFillBlankQuestion()
          ) : (question.type === 'DROPDOWN' && challengeType === 'GV') ? (
            (() => {
              const toPlain = (s) => (typeof s === 'string' ? s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim() : s);
              const textColor = theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)';
              const borderColor = theme === 'sun' ? '#66AEFF' : '#A78BFA';
              const bgColor = theme === 'sun' ? 'rgba(24, 144, 255, 0.06)' : 'rgba(167, 139, 250, 0.12)';
              let displayText = question.questionText || question.question || '';
              const groups = {};
              if (question.content && Array.isArray(question.content.data)) {
                question.content.data.forEach((item) => {
                  if (!groups[item.positionId]) groups[item.positionId] = [];
                  groups[item.positionId].push(item);
                });
              }
              const ordered = Object.keys(groups).map((pid, idx) => {
                const group = groups[pid];
                const correct = group.find(o => o.correct === true);
                const incorrect = group.filter(o => o.correct === false);
                const options = [correct?.value, ...incorrect.map(o => o.value).filter(Boolean)].filter(Boolean);
                return { number: idx + 1, positionId: pid, correct: correct?.value || '', options };
              });
              // Replace markers in question with actual inline <select> elements (teacher preview)
              ordered.forEach((g) => {
                const pattern = `[[pos_${g.positionId}]]`;
                const selectedIndex = g.options.findIndex((opt) => toPlain(opt) === toPlain(g.correct));
                const optionsHtml = g.options
                  .map((opt, i) => {
                    const text = toPlain(opt);
                    const isSelected = i === (selectedIndex >= 0 ? selectedIndex : 0);
                    const isCorrect = toPlain(opt) === toPlain(g.correct);
                    const color = isCorrect ? '#000000' : '#999999';
                    return `<option style=\"white-space: normal; word-break: break-word; overflow-wrap: anywhere; line-height: 1.4; color: ${color};\" value=\"${text}\" ${isSelected ? 'selected' : ''} title=\"${text}\">${text}</option>`;
                  })
                  .join('');
                const selectHtml = `<select data-idx=\"${selectedIndex >= 0 ? selectedIndex : 0}\" onchange=\"this.selectedIndex=this.dataset.idx\" style=\"display:inline-block;width:160px;max-width:160px;height:36px;padding:0 12px;margin:0 6px;background:rgba(82, 196, 26, 0.12);border:2px solid rgba(82, 196, 26, 0.5);border-radius:10px;font-size:14px;color:black;cursor:pointer;outline:none;text-align:center;box-sizing:border-box;overflow:hidden;white-space:normal;appearance:auto;\">${optionsHtml}</select>`;
                displayText = displayText.replace(pattern, selectHtml);
              });
              return (
                <div 
                  className="question-text-content"
                  style={{ 
                    marginBottom: '12px', 
                    fontSize: '15px', 
                    fontWeight: 350,
                    lineHeight: '1.8',
                    color: textColor
                  }}
                  dangerouslySetInnerHTML={{ __html: displayText }}
                />
              );
            })()
          ) : question.type === 'DROPDOWN' ? (
            renderDropdownQuestion()
          ) : (question.type === 'DRAG_AND_DROP' && challengeType === 'GV') ? (
            (() => {
              if (!question.questionText) return null;
              const borderColor = theme === 'sun' ? '#66AEFF' : '#A78BFA';
              const textColor = theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)';
              const correctBorderColor = 'rgba(82, 196, 26, 0.7)';
              const correctTextColor = '#000000';
              const correctBgColor = 'rgba(82, 196, 26, 0.12)';
              const wrongBorderColor = theme === 'sun' ? '#d9d9d9' : 'rgba(56, 56, 56, 0.75)';
              const wrongTextColor = theme === 'sun' ? 'rgba(0,0,0,0.55)' : 'rgba(56, 56, 56, 0.75)';
              const wrongBgColor = theme === 'sun' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.06)';
              // Build placeholders in question text for each correct item having positionId
              let displayText = question.questionText;
              const allChips = [];
              
              // First, collect all correct items with their order
              const correctItems = [];
              if (question.content && Array.isArray(question.content.data)) {
                question.content.data.forEach((item) => {
                  if (item && item.value) {
                    const isCorrect = Boolean(item?.correct === true || item?.positionId);
                    allChips.push({ value: item.value, isCorrect });
                    
                    // Track correct items for numbering
                    if (item.positionId && item.correct === true) {
                      correctItems.push({
                        positionId: item.positionId,
                        value: item.value,
                        index: correctItems.length + 1 // Number starts from 1
                      });
                    }
                  }
                });
                
                // Now replace placeholders with correct numbering
                correctItems.forEach((correctItem) => {
                  const pattern = `[[pos_${correctItem.positionId}]]`;
                  const value = String(correctItem.value || '')
                    .replace(/<[^>]*>/g,' ')
                    .replace(/&nbsp;/g,' ')
                    .trim();
                  displayText = displayText.replace(
                    pattern,
                    `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:${correctBgColor};border:2px solid ${correctBorderColor};border-radius:8px;color:${correctTextColor};margin:0 6px 6px 6px;">
                      <span style=\"display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:${correctBorderColor};color:#ffffff;font-size:11px;\">${correctItem.index}</span>
                      <span style=\"white-space:normal;word-break:break-word;\">${value}</span>
                    </span>`
                  );
                });
              }
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid',
                      borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)',
                      background: theme === 'sun' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.08)'
                    }}
                  >
                    <div style={{ fontSize: '14px', marginBottom: '12px', color: textColor }}>
                      Complete the sentence by dragging words into the blanks:
                    </div>
                    <div
                      className="question-text-content"
                      style={{
                        fontSize: '15px',
                        fontWeight: 350,
                        lineHeight: '1.8',
                        color: textColor
                      }}
                      dangerouslySetInnerHTML={{ __html: displayText }}
                    />
                  </div>
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid',
                      borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)',
                      background: theme === 'sun' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.08)'
                    }}
                  >
                    <div style={{ fontSize: '14px', marginBottom: '12px', color: textColor }}>
                      Drag these words to complete the sentence:
                    </div>
                    {allChips.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        {(() => { let correctCounter = 0; return allChips.map((chip, idx) => {
                          const orderNumber = chip.isCorrect ? (++correctCounter) : null;
                          return (
                          <div
                            key={idx}
                            style={{
                              padding: '10px 16px',
                              borderRadius: '10px',
                              border: `2px solid ${chip.isCorrect ? correctBorderColor : wrongBorderColor}`,
                              background: chip.isCorrect ? correctBgColor : wrongBgColor,
                              color: chip.isCorrect ? correctTextColor : wrongTextColor,
                              fontSize: '14px',
                              fontWeight: 400,
                              boxShadow: theme === 'sun' ? '0 2px 6px rgba(113,179,253,0.08)' : '0 2px 6px rgba(138,122,255,0.08)'
                            }}
                          >
                            {orderNumber && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: correctBorderColor,
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: 700,
                                marginRight: '8px'
                              }}>{orderNumber}</span>
                            )}
                            {chip.value}
                          </div>
                          );
                        }); })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : question.type === 'DRAG_AND_DROP' ? (
            renderDragDropQuestion()
          ) : (question.type === 'REARRANGE' && challengeType === 'GV') ? (
            (() => {
              const textColor = theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)';
              const borderColor = theme === 'sun' ? '#66AEFF' : '#A78BFA';
              const values = Array.isArray(question.content?.data)
                ? question.content.data.map((i) => i?.value).filter(Boolean)
                : [];
              const count = values.length || 3;
              const correctBorderColor = 'rgba(82, 196, 26, 0.7)';
              return (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {/* Slots area */}
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid',
                      borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)',
                      background: theme === 'sun' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.08)'
                    }}
                  >
                    <div style={{ fontSize: '14px', marginBottom: '12px', color: textColor }}>
                      Drop the words here in order:
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {values.map((val, idx) => (
                        <div
                          key={idx}
                          style={{
                            minWidth: '160px',
                            minHeight: '70px',
                            borderRadius: '10px',
                            border: `2px solid ${correctBorderColor}`,
                            background: 'rgba(82, 196, 26, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000000',
                            fontWeight: 500,
                            padding: '10px 16px'
                          }}
                        >
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: correctBorderColor,
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 700,
                            marginRight: '8px'
                          }}>{idx + 1}</span>
                          {val}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Source words area */}
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid',
                      borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)',
                      background: theme === 'sun' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.08)'
                    }}
                  >
                    <div style={{ fontSize: '14px', marginBottom: '12px', color: textColor }}>
                      Drag these words to the slots above:
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {values.map((val, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: '2px solid rgba(82, 196, 26, 0.5)',
                            background: 'rgba(82, 196, 26, 0.12)',
                            color: '#000000',
                            fontSize: '14px',
                            fontWeight: 500,
                            boxShadow: '0 2px 6px rgba(82,196,26,0.12)'
                          }}
                        >
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: correctBorderColor,
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 700,
                            marginRight: '8px'
                          }}>{idx + 1}</span>
                          {val}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : question.type === 'REARRANGE' ? (
            renderReorderQuestion()
          ) : question.type === 'REWRITE' ? (
            renderRewriteQuestion()
          ) : (['MULTIPLE_CHOICE','MULTIPLE_SELECT'].includes(question.type) && challengeType === 'GV') ? (
            (() => {
              const questionText = question.question || question.questionText || '';
              const optionsFromApi = Array.isArray(question.options) && question.options.length > 0 ? question.options : [];
              const isMulti = question.type === 'MULTIPLE_SELECT';
              const correctBg = theme === 'sun' ? 'rgba(82, 196, 26, 0.12)' : 'rgba(115, 209, 61, 0.15)';
              const correctBorder = theme === 'sun' ? 'rgba(82, 196, 26, 0.5)' : 'rgba(115, 209, 61, 0.5)';
              const baseBgSun = 'rgba(255, 255, 255, 0.85)';
              const baseBgMoon = 'rgba(255, 255, 255, 0.7)';
              const baseBorderSun = 'rgba(113, 179, 253, 0.2)';
              const baseBorderMoon = 'rgba(138, 122, 255, 0.15)';
              return (
                <>
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

                  <div className="question-options" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '14px', 
                    marginTop: '12px' 
                  }}>
                    {optionsFromApi.map((opt, idx) => {
                      const key = opt.key || String.fromCharCode(65 + idx);
                      const isCorrect = !!opt.isCorrect;
                      return (
                        <div
                          key={idx}
                          className={`option-item ${isCorrect ? 'correct-answer' : ''}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 18px',
                            background: isCorrect
                              ? correctBg
                              : (theme === 'sun' ? baseBgSun : baseBgMoon),
                            border: `2px solid ${isCorrect ? correctBorder : (theme === 'sun' ? baseBorderSun : baseBorderMoon)}`,
                            borderRadius: '12px',
                            boxShadow: theme === 'sun' 
                              ? '0 2px 6px rgba(113, 179, 253, 0.08)'
                              : '0 2px 6px rgba(138, 122, 255, 0.08)',
                            fontSize: '14px',
                            fontWeight: '350',
                            position: 'relative',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            minHeight: '50px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <input 
                            type={isMulti ? 'checkbox' : 'radio'} 
                            checked={isCorrect}
                            style={{ 
                              width: '18px',
                              height: '18px',
                              accentColor: '#1890ff',
                              cursor: 'not-allowed'
                            }} 
                            disabled
                          />
                          <span style={{ 
                            flexShrink: 0, 
                            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                            fontWeight: 400,
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
                          {isCorrect && (
                            <span style={{
                              position: 'absolute',
                              right: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#52c41a',
                              fontWeight: 700,
                              fontSize: '14px'
                            }}></span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()
          ) : (question.type === 'TRUE_OR_FALSE' && challengeType === 'GV') ? (
            (() => {
              const questionText = question.question || question.questionText || '';
              const optionsFromApi = Array.isArray(question.options) && question.options.length > 0
                ? question.options
                : [
                    { key: 'A', text: 'True', isCorrect: true },
                    { key: 'B', text: 'False', isCorrect: false }
                  ];
              const correctBg = theme === 'sun' ? 'rgba(82, 196, 26, 0.12)' : 'rgba(115, 209, 61, 0.15)';
              const correctBorder = theme === 'sun' ? 'rgba(82, 196, 26, 0.5)' : 'rgba(115, 209, 61, 0.5)';
              const baseBgSun = 'rgba(255, 255, 255, 0.85)';
              const baseBgMoon = 'rgba(255, 255, 255, 0.7)';
              const baseBorderSun = 'rgba(113, 179, 253, 0.2)';
              const baseBorderMoon = 'rgba(138, 122, 255, 0.15)';
              return (
                <>
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

                  <div className="question-options" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '14px', 
                    marginTop: '12px' 
                  }}>
                    {optionsFromApi.slice(0, 2).map((opt, idx) => {
                      const key = opt.key || (idx === 0 ? 'A' : 'B');
                      const isCorrect = !!opt.isCorrect;
                      return (
                        <div
                          key={idx}
                          className={`option-item ${isCorrect ? 'correct-answer' : ''}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 18px',
                            background: isCorrect
                              ? correctBg
                              : (theme === 'sun' ? baseBgSun : baseBgMoon),
                            border: `2px solid ${isCorrect ? correctBorder : (theme === 'sun' ? baseBorderSun : baseBorderMoon)}`,
                            borderRadius: '12px',
                            boxShadow: theme === 'sun' 
                              ? '0 2px 6px rgba(113, 179, 253, 0.08)'
                              : '0 2px 6px rgba(138, 122, 255, 0.08)',
                            fontSize: '14px',
                            fontWeight: '350',
                            position: 'relative',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            minHeight: '50px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <input 
                            type={'radio'} 
                            checked={isCorrect}
                            style={{ 
                              width: '18px',
                              height: '18px',
                              accentColor: '#1890ff',
                              cursor: 'not-allowed'
                            }} 
                            disabled
                          />
                          <span style={{ 
                            flexShrink: 0, 
                            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                            fontWeight: 400,
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
                          {isCorrect && (
                            <span style={{
                              position: 'absolute',
                              right: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#52c41a',
                              fontWeight: 700,
                              fontSize: '14px'
                            }}></span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()
          ) : (
            <>
              <div 
                style={{ 
                  marginBottom: '16px', 
                  fontSize: '15px', 
                  fontWeight: 500 
                }}
                dangerouslySetInnerHTML={{ __html: question.question }}
              />

              <div className="question-options" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <style>{`.option-text p{margin:0}`}</style>
                {question.options && question.options.map((option, idx) => {
                  const isMulti = question.type === 'MULTIPLE_SELECT';
                  const key = option.key || String.fromCharCode(65 + idx);
                  return (
                    <label
                      key={key}
                      className={`option-item ${option.isCorrect ? 'correct-answer' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        background: option.isCorrect 
                          ? 'rgba(82, 196, 26, 0.08)'
                          : (theme === 'sun' ? '#fff' : 'rgba(255,255,255,0.03)'),
                        border: option.isCorrect
                          ? '2px solid rgba(82, 196, 26, 0.4)'
                          : `2px solid ${theme === 'sun' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '12px',
                                    cursor: 'default',
                        minHeight: '48px'
                      }}
                    >
                      <input
                        type={isMulti ? 'checkbox' : 'radio'}
                        name={`question-${question.id}`}
                        defaultChecked={!!option.isCorrect}
                        onChange={() => {}}
                        style={{ width: '18px', height: '18px', accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6' }}
                        disabled
                      />
                      <span style={{ fontWeight: 400 }}>{key}.</span>
                      <span className="option-text" style={{ flex: 1, display: 'block', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: option.text }} />
                      {option.isCorrect && (
                        <span style={{ color: '#52c41a', fontSize: '16px' }}>✓</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.question.id === nextProps.question.id &&
      prevProps.question.question === nextProps.question.question &&
      prevProps.question.questionText === nextProps.question.questionText &&
      prevProps.question.correctAnswer === nextProps.question.correctAnswer &&
      prevProps.question.weight === nextProps.question.weight &&
      prevProps.question.type === nextProps.question.type &&
      prevProps.theme === nextProps.theme &&
      prevProps.index === nextProps.index &&
      prevProps.challengeType === nextProps.challengeType &&
      prevProps.onDeleteQuestion === nextProps.onDeleteQuestion &&
      prevProps.onEditQuestion === nextProps.onEditQuestion &&
      prevProps.onDuplicateQuestion === nextProps.onDuplicateQuestion &&
      prevProps.onPointsChange === nextProps.onPointsChange &&
      JSON.stringify(prevProps.question.shuffledWords) === JSON.stringify(nextProps.question.shuffledWords) &&
      JSON.stringify(prevProps.question.correctAnswers) === JSON.stringify(nextProps.question.correctAnswers)
    );
  }
);

SortableQuestionItem.displayName = 'SortableQuestionItem';

// Question types constant (AI options are handled separately in modal)
const questionTypes = [
  { id: 1, name: "Multiple choice", type: "multiple-choice" },
  { id: 2, name: "Multiple select", type: "multiple-select" },
  { id: 3, name: "True or false", type: "true-false" },
  { id: 4, name: "Fill in the blank", type: "fill-blank" },
  { id: 5, name: "Dropdown", type: "dropdown" },
  { id: 6, name: "Drag and drop", type: "drag-drop" },
  { id: 7, name: "Rearrange", type: "reorder" },
  { id: 8, name: "Re-write", type: "rewrite" },
];

const DailyChallengeContent = () => {
  // Helper: sentence-case a label (uppercase first char, lowercase rest)
  const sentenceCase = useCallback((text) => {
    if (!text) return text;
    const s = String(text);
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }, []);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const { enterDailyChallengeMenu, exitDailyChallengeMenu, updateChallengeCount } = useDailyChallengeMenu();
  
  // Get data from navigation state or fetch from API
  const [challengeInfo, setChallengeInfo] = useState({
    classId: location.state?.classId || null,
    className: location.state?.className || null,
    challengeId: location.state?.challengeId || id,
    challengeName: location.state?.challengeName || null,
    lessonName: location.state?.lessonName || null,
  });
  
  // Set page title
  usePageTitle('Daily Challenge Management / Content');
  
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [passages, setPassages] = useState([]);
  const [searchText, setSearchText] = useState("");
  
  // Store dimensions of item being dragged to prevent stretching/shrinking
  const [activeDragDimensions, setActiveDragDimensions] = useState(null);
  
  // Challenge Details states
  const [challengeDetails, setChallengeDetails] = useState(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  
  // Challenge Settings states
  const [challengeMode, setChallengeMode] = useState('normal'); // normal, exam
  const [durationMinutes, setDurationMinutes] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [shuffleQuestion, setShuffleQuestion] = useState(false);
  const [translateOnScreen, setTranslateOnScreen] = useState(false);
  const [antiCheatModeEnabled, setAntiCheatModeEnabled] = useState(false);
  
  // Status state
  const [status, setStatus] = useState('draft'); // 'draft' or 'published'
  const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar collapse state
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [currentModalType, setCurrentModalType] = useState(null);
  const [questionTypeModalVisible, setQuestionTypeModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteQuestion, setDeleteQuestion] = useState(null);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [importModal, setImportModal] = useState({
    visible: false,
    fileList: [],
    uploading: false
  });
  const [publishConfirmModalVisible, setPublishConfirmModalVisible] = useState(false);
  const [reLiAddQuestionModalVisible, setReLiAddQuestionModalVisible] = useState(false);

  // Memoized challenge type to use in dependencies cleanly
  const currentChallengeType = challengeDetails?.challengeType;

  // Loading states for buttons
  const [templateDownloadLoading, setTemplateDownloadLoading] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false); // Loading state for saving question
  const [exportLoading, setExportLoading] = useState(false);

  // Sensors for drag and drop - optimized for instant response (no delay like CreateReadingChallenge)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced for faster response
        delay: 0, // No delay for instant drag start
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchChallengeDetails = useCallback(async () => {
    if (!id) {
      setChallengeLoading(false);
      return;
    }

    setChallengeLoading(true);
    try {
      console.log('Fetching challenge details for ID:', id);
      
      // Call API to get challenge details
      const response = await dailyChallengeApi.getDailyChallengeById(id);
      console.log('Challenge Details API Response:', response);

      if (response && response.data) {
        const challengeData = response.data;
        setChallengeDetails(challengeData);
        
        // Update challenge settings states with API data
        setDurationMinutes(challengeData.durationMinutes);
        setStartDate(challengeData.startDate);
        setEndDate(challengeData.endDate);
        setShuffleQuestion(challengeData.shuffleQuestion || challengeData.shuffleAnswers || false);
        setTranslateOnScreen(challengeData.translateOnScreen || false);
        setAntiCheatModeEnabled(challengeData.hasAntiCheat || false);
        
        // Set challenge mode based on challengeMethod from API
        // challengeMethod: 'NORMAL' = normal mode, 'TEST' = exam mode
        const mode = challengeData.challengeMethod === 'TEST' ? 'exam' : 'normal';
        setChallengeMode(mode);
        
        // Set status based on challengeStatus (normalize to lowercase keywords)
        const apiStatus = challengeData.challengeStatus;
        let normalizedStatus = 'draft';
        if (apiStatus === 'PUBLISHED') normalizedStatus = 'published';
        else if (apiStatus === 'IN_PROGRESS') normalizedStatus = 'in-progress';
        else if (apiStatus === 'FINISHED') normalizedStatus = 'finished';
        setStatus(normalizedStatus);
        
        console.log('Challenge details loaded:', challengeData);
      }
      
      setChallengeLoading(false);
    } catch (error) {
      console.error('Error fetching challenge details:', error);
      spaceToast.error(error.response?.data?.error || 'Failed to load challenge details');
      setChallengeLoading(false);
    }
  }, [id]);

  

  const fetchQuestions = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching sections for challenge:', id);
      
      // Call API to get sections (questions) for this challenge
      const response = await dailyChallengeApi.getSectionsByChallenge(id, {
        page: 0,
        size: 100, // Get all questions for now
      });

      console.log('API Response:', response);

      // Transform API response to match component format
      if (response && response.data) {
        const apiSections = response.data;
        const mappedQuestions = [];
        const mappedPassages = [];
        
        // Process each section
        apiSections.forEach((item, index) => {
          const section = item.section || {};
          const questionsList = item.questions || [];
          
          // Check if this section is a DOCUMENT (passage) or FILE (listening/speaking passage)
          if (section.resourceType === 'DOCUMENT' || section.resourceType === 'FILE') {
            // Determine passage type based on resourceType and challengeType
            let passageType = 'READING_PASSAGE';
            if (section.resourceType === 'FILE') {
              // Check challengeType to differentiate between LISTENING and SPEAKING
              const currentChallengeType = challengeDetails?.challengeType;
              passageType = currentChallengeType === 'SP' ? 'SPEAKING_PASSAGE' : 'LISTENING_PASSAGE';
            }
            
            // Create passage object
            const totalWeight = Array.isArray(questionsList)
              ? questionsList.reduce((sum, q) => sum + (Number(q?.weight ?? q?.score ?? 0) || 0), 0)
              : 0;
            const passage = {
              id: section.id || `passage_${index}`,
              type: passageType,
              content: section.sectionsContent || '',
              audioUrl: section.resourceType === 'FILE' ? section.sectionsUrl : undefined, // Audio URL for listening passages
              weight: totalWeight, // Sum of question weights in this section
              questions: questionsList.map((question, qIndex) => {
                // Get question content - parse from content.data array
                const contentData = question.content?.data || [];
                const options = contentData.map((contentItem, idx) => ({
                  key: String.fromCharCode(65 + idx), // A, B, C, D...
                  text: contentItem.value || '',
                  isCorrect: contentItem.correct || false,
                }));

                return {
                  id: question.id || `${section.id}-${qIndex}`,
                  type: question.questionType,
                  question: question.questionText || '',
                  questionText: question.questionText || '', // Keep original questionText for FillBlank, Dropdown, etc.
                  options: options,
                  content: question.content, // Preserve original content structure for special question types
                  incorrectOptions: options.filter(opt => !opt.isCorrect).map(opt => ({
                    id: opt.key || Date.now(),
                    text: opt.text
                  })),
                  weight: question.weight || 1,
                  timeLimit: 1,
                  sectionId: section.id,
                  sectionTitle: section.sectionTitle,
                  orderNumber: question.orderNumber || qIndex + 1,
                  isFromBackend: true, // Mark as loaded from backend
                };
              }),
              sectionId: section.id,
              sectionTitle: section.sectionTitle,
              orderNumber: section.orderNumber || index + 1,
            };
            
            mappedPassages.push(passage);
            console.log('Mapped Passage:', passage);
          } else {
            // Regular question section - map each question
            const sectionQuestions = questionsList.map((question, qIndex) => {
              // Get question content - parse from content.data array
              const contentData = question.content?.data || [];
              console.log(`Question ${question.questionType} - Content Data:`, contentData);
              
              const options = contentData.map((contentItem, idx) => ({
                key: String.fromCharCode(65 + idx), // A, B, C, D...
                text: contentItem.value || '',
                isCorrect: contentItem.correct || false,
              }));
              
              console.log(`Question ${question.questionType} - Options:`, options);

              // Extract incorrect options - DRAG_AND_DROP uses same logic as other types
              // Incorrect options are those with isCorrect: false in the options array
              const incorrectOptions = options
                .filter(opt => !opt.isCorrect)
                .map(opt => ({
                  id: opt.key || Date.now(),
                  text: opt.text
                }));
              
              if (question.questionType === 'DRAG_AND_DROP') {
                console.log('=== DRAG_AND_DROP QUESTION DEBUG ===');
                console.log('Content Data:', contentData);
                console.log('Options:', options);
                console.log('Incorrect Options Extracted:', incorrectOptions);
                console.log('=====================================');
              }
              
 
              const mappedQuestion = {
                id: question.id || `${section.id}-${qIndex}`,
                type: question.questionType,
                question: question.questionText || '',
                questionText: question.questionText || '', // Add this for FillBlank
                options: options,
                content: question.content, // Preserve original content for FillBlank
                incorrectOptions: incorrectOptions,
                weight: question.weight || 1,
                timeLimit: 1,
                sectionId: section.id,
                sectionTitle: section.sectionTitle,
                orderNumber: question.orderNumber || qIndex + 1,
              };

              // Log specific question types for debugging
              if (question.questionType === 'FILL_IN_THE_BLANK') {
                console.log('FillBlank question:', mappedQuestion);
              } else if (question.questionType === 'DROPDOWN') {
                console.log('Dropdown question:', mappedQuestion);
              } else if (question.questionType === 'DRAG_AND_DROP') {
                console.log('DragDrop question:', mappedQuestion);
              } else {
                console.log(`${question.questionType} question:`, mappedQuestion);
              }

              return mappedQuestion;
            });
            
            mappedQuestions.push(...sectionQuestions);
          }
        });

        console.log('Mapped Questions:', mappedQuestions);
        console.log('Mapped Passages:', mappedPassages);

        // total count is now computed dynamically for display based on challenge type

        // Sort questions by orderNumber to ensure correct order
        const sortedQuestions = mappedQuestions.sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));
        const sortedPassages = mappedPassages.sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));
        
        console.log('Sorted Questions:', sortedQuestions);
        console.log('Sorted Passages:', sortedPassages);
        
        setQuestions(sortedQuestions);
        setPassages(sortedPassages);
      } else {
        // If API response is unexpected, set empty arrays
        setQuestions([]);
        setPassages([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      spaceToast.error(error.response?.data?.error || 'Failed to load questions');
      
      // On error, set empty arrays
      setQuestions([]);
      setPassages([]);
      setLoading(false);
    }
  }, [id, challengeDetails?.challengeType]);

  useEffect(() => {
    fetchChallengeDetails();
    fetchQuestions();
  }, [fetchChallengeDetails, fetchQuestions]);

  // Enter/exit daily challenge menu mode
  // Fetch challenge info from API if not available in state
  const fetchChallengeInfo = useCallback(async () => {
    // If we already have all info, no need to fetch
    if (challengeInfo.challengeName && challengeInfo.className) {
      return;
    }

    try {
      // Fetch challenge detail from API
      const response = await dailyChallengeApi.getDailyChallengeById(id);
      console.log('Challenge detail response:', response);
      
      const data = response?.data;
      if (data) {
        setChallengeInfo(prev => ({
          ...prev,
          challengeId: data.id || id,
          challengeName: data.challengeName || data.name || data.title || prev.challengeName,
        }));
      }
    } catch (error) {
      console.error('Error fetching challenge info:', error);
    }
  }, [id, challengeInfo.challengeName, challengeInfo.className]);

  // Fetch challenge info if needed
  useEffect(() => {
    fetchChallengeInfo();
  }, [fetchChallengeInfo]);

  useEffect(() => {
    // Determine back path based on classId
    const getBackPath = () => {
      if (challengeInfo.classId) {
        // If coming from class-specific daily challenges, go back to that list
        // Route: /teacher/classes/daily-challenges/:classId
        const userRole = user?.role?.toLowerCase();
        if (userRole === 'teacher' || userRole === 'teaching_assistant') {
          return `/teacher/classes/daily-challenges/${challengeInfo.classId}`;
        } else {
          return `/manager/classes/daily-challenges/${challengeInfo.classId}`;
        }
      } else {
        // Otherwise, go back to general daily challenges list
        const userRole = user?.role?.toLowerCase();
        return userRole === 'teacher' || userRole === 'teaching_assistant' 
          ? '/teacher/daily-challenges' 
          : '/manager/daily-challenges';
      }
    };

    // Determine subtitle for header
    const getSubtitle = () => {
      if (challengeInfo.className && challengeInfo.challengeName) {
        return `${challengeInfo.className} / ${challengeInfo.challengeName}`;
      } else if (challengeInfo.challengeName) {
        return challengeInfo.challengeName;
      }
      return null;
    };
    
    // Enter daily challenge menu mode with backPath and subtitle
    enterDailyChallengeMenu(
      questions.length, 
      getSubtitle(), 
      getBackPath(), 
      challengeInfo.className
    );
    
    return () => {
      exitDailyChallengeMenu();
    };
  }, [enterDailyChallengeMenu, exitDailyChallengeMenu, questions.length, challengeInfo, user]);

  // Update challenge count when questions and passages change
  useEffect(() => {
    const filteredQuestionCount = questions.filter((question) => {
      const matchesSearch =
        searchText === "" ||
        question.question.toLowerCase().includes(searchText.toLowerCase());
      return matchesSearch;
    }).length;

    const filteredPassageCount = passages.filter((passage) => {
      const matchesSearch =
        searchText === "" ||
        passage.content.toLowerCase().includes(searchText.toLowerCase()) ||
        (passage.questions && passage.questions.some(q => 
          q.question.toLowerCase().includes(searchText.toLowerCase())
        ));
      return matchesSearch;
    }).length;
    
    updateChallengeCount(filteredQuestionCount + filteredPassageCount);
  }, [questions, passages, searchText, updateChallengeCount]);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleAddQuestion = useCallback(() => {
    const challengeType = challengeDetails?.challengeType;
    
    if (challengeType === 'RE' || challengeType === 'LI') {
      // For Reading/Listening challenges, show modal with 3 options
      setReLiAddQuestionModalVisible(true);
    } else if (challengeType === 'WR' || challengeType === 'SP') {
      // For Writing/Speaking challenges, navigate to CreateReadingChallenge
      const userRole = user?.role?.toLowerCase();
      
      let basePath;
      if (challengeType === 'WR') {
        // Writing challenge
        basePath = userRole === 'teaching_assistant' 
          ? `/teaching-assistant/daily-challenges/create/writing/${id}`
          : `/teacher/daily-challenges/create/writing/${id}`;
      } else if (challengeType === 'SP') {
        // Speaking challenge
        basePath = userRole === 'teaching_assistant' 
          ? `/teaching-assistant/daily-challenges/create/speaking/${id}`
          : `/teacher/daily-challenges/create/speaking/${id}`;
      }
      
      navigate(basePath, {
        state: {
          challengeId: id,
          challengeName: challengeDetails?.challengeName,
          challengeType: challengeType,
          classId: challengeInfo.classId,
          className: challengeInfo.className
        }
      });
    } else {
      // For other challenge types (GV, etc.), open question type modal
      setQuestionTypeModalVisible(true);
    }
  }, [challengeDetails, id, challengeInfo, navigate, user]);


  const handleQuestionTypeClick = useCallback((questionType) => {
    // Regular question types (not AI)
    setCurrentModalType(questionType.type);
    setModalVisible(true);
    setQuestionTypeModalVisible(false);
  }, []);

  // Handler for GV AI Generate from Settings
  const handleGvAiGenerateFromSettings = useCallback(() => {
    const userRole = user?.role?.toLowerCase();
    const aiPath = userRole === 'teaching_assistant'
      ? `/teaching-assistant/daily-challenges/create/ai/${id}`
      : `/teacher/daily-challenges/create/ai/${id}`;
    
    navigate(aiPath, {
      state: {
        challengeId: id,
        challengeName: challengeDetails?.challengeName,
        challengeType: challengeDetails?.challengeType,
        classId: challengeInfo.classId,
        className: challengeInfo.className,
        aiSource: 'settings'
      }
    });
    
    setQuestionTypeModalVisible(false);
  }, [id, user, navigate, challengeDetails, challengeInfo]);

  // Handler for GV AI Generate from File
  const handleGvAiGenerateFromFile = useCallback(() => {
    const userRole = user?.role?.toLowerCase();
    const aiPath = userRole === 'teaching_assistant'
      ? `/teaching-assistant/daily-challenges/create/ai/${id}`
      : `/teacher/daily-challenges/create/ai/${id}`;
    
    navigate(aiPath, {
      state: {
        challengeId: id,
        challengeName: challengeDetails?.challengeName,
        challengeType: challengeDetails?.challengeType,
        classId: challengeInfo.classId,
        className: challengeInfo.className,
        aiSource: 'file'
      }
    });
    
    setQuestionTypeModalVisible(false);
  }, [id, user, navigate, challengeDetails, challengeInfo]);

  // Helper function to transform question data to API format
  const transformQuestionToApiFormat = useCallback((questionData, orderNumber, questionType) => {
    switch (questionType) {
      case 'MULTIPLE_CHOICE':
      case 'MULTIPLE_SELECT':
        return {
          questionText: questionData.question,
          orderNumber,
          weight: (questionData.weight ?? questionData.points ?? 0.5),
          questionType: questionType === 'MULTIPLE_SELECT' ? 'MULTIPLE_SELECT' : 'MULTIPLE_CHOICE',
          content: {
            data: questionData.options ? questionData.options.map((option, optIndex) => ({
              id: option.key ? option.key.replace('.', '') : `opt${optIndex + 1}`,
              value: option.text,
              correct: option.isCorrect || false
            })) : []
          }
        };

      case 'TRUE_OR_FALSE':
        return {
          questionText: questionData.question,
          orderNumber,
          weight: (questionData.weight ?? questionData.points ?? 0.5),
          questionType: 'TRUE_OR_FALSE',
          content: {
            data: questionData.options ? questionData.options.map((option, optIndex) => ({
              id: `opt${optIndex + 1}`,
              value: option.text,
              correct: option.isCorrect || false
            })) : []
          }
        };

      case 'FILL_IN_THE_BLANK':
        return {
          questionText: questionData.questionText || questionData.question,
          orderNumber,
          weight: (questionData.weight ?? questionData.points ?? 0.5),
          questionType: 'FILL_IN_THE_BLANK',
          content: {
            data: (questionData.content?.data || [])
          }
        };

      case 'DROPDOWN':
        return {
          questionText: questionData.questionText || questionData.question,
          orderNumber,
          weight: (questionData.weight ?? questionData.points ?? 0.5),
          questionType: 'DROPDOWN',
          content: {
            data: (questionData.content?.data || [])
          }
        };

      case 'DRAG_AND_DROP':
        return {
          questionText: questionData.questionText || questionData.question,
          orderNumber,
          weight: (questionData.weight ?? questionData.points ?? 1),
          questionType: 'DRAG_AND_DROP',
          content: {
            data: (questionData.content?.data || [])
          }
        };

      case 'REARRANGE':
        return {
          questionText: questionData.questionText || questionData.question,
          orderNumber,
          weight: (questionData.weight ?? questionData.points ?? 1),
          questionType: 'REARRANGE',
          content: {
            data: (questionData.content?.data || [])
          }
        };

      case 'REWRITE':
        return {
          questionText: questionData.questionText || questionData.question,
          orderNumber,
          weight: (questionData.weight ?? questionData.points ?? 1),
          questionType: 'REWRITE',
          content: {
            data: (questionData.content?.data || [])
          }
        };

      default:
        return {
          questionText: questionData.question,
          orderNumber,
          weight: (questionData.weight ?? questionData.points ?? 0.5),
          questionType: questionData.type ? questionData.type.toUpperCase().replace(/-/g, '_') : 'MULTIPLE_CHOICE',
          content: {
            data: questionData.options ? questionData.options.map((option, optIndex) => ({
              id: `opt${optIndex + 1}`,
              value: option.text,
              correct: option.isCorrect || false
            })) : []
          }
        };
    }
  }, []);

  // Helper function to get section content based on question type
  const getSectionContent = useCallback((questionType) => {
    const sectionContentMap = {
      'DRAG_AND_DROP': t('dailyChallenge.dragDropDesc') || 'Drag and drop the correct word into each blank to complete the passage.',
      'DROPDOWN': t('dailyChallenge.dropdownDesc') || 'Select the correct answer from the dropdown menu.',
      'FILL_IN_THE_BLANK': t('dailyChallenge.fillBlankDesc') || 'Fill in the blank with the correct answer.',
      'MULTIPLE_SELECT': t('dailyChallenge.multipleSelectDesc') || 'Select all correct answers.',
      'TRUE_OR_FALSE': t('dailyChallenge.trueFalseDesc') || 'Choose True or False.',
      'REARRANGE': t('dailyChallenge.rearrangeDesc') || 'Rearrange the words to make a correct sentence.',
      'REWRITE': t('dailyChallenge.rewriteDesc') || 'Rewrite the sentences as instructed.',
    };

    return sectionContentMap[questionType] || (t('dailyChallenge.multipleChoiceDesc') || 'Choose one correct answer.');
  }, [t]);

  // Handle creating a new question
  const handleCreateQuestion = useCallback(async (questionData) => {
    try {
      setSavingQuestion(true);

      // Transform question to API format
      // Compute next section orderNumber from existing sections:
      // - passages contain DOCUMENT/FILE sections
      // - GV sections come through questions with their own orderNumber
      // Use filtered arrays to exclude deleted items
      const visiblePassages = passages.filter(p => !p.toBeDeleted);
      const visibleQuestions = questions.filter(q => !q.toBeDeleted);
      
      // Calculate nextOrder based on total visible items + 1
      // This ensures correct ordering even when state hasn't updated yet
      const totalVisibleItems = visiblePassages.length + visibleQuestions.length;
      const nextOrder = totalVisibleItems + 1;

      // For GV, let question start at order 1 inside its section; section.orderNumber controls placement
      const questionOrder = (challengeDetails?.challengeType === 'GV') ? 1 : nextOrder;
      const apiQuestion = transformQuestionToApiFormat(questionData, questionOrder, questionData.type);
      // Use question as is
      const sanitizedApiQuestion = {
        ...apiQuestion,
        content: apiQuestion.content
      };
      
      // Get appropriate section content
      const sectionContent = getSectionContent(questionData.type);
      
      // Prepare section data
      const sectionData = {
        section: {
          sectionsContent: sectionContent,
          resourceType: 'NONE',
          orderNumber: nextOrder
        },
        questions: [sanitizedApiQuestion]
      };

      console.log('Creating new question:', sectionData);

      // Call API to save the question
      const response = await dailyChallengeApi.saveSectionWithQuestions(id, sectionData);
      
      // Refresh questions from API
      await fetchQuestions();
      
      // Only close modal when backend returns a non-empty success message
      const successMsgCreate = typeof response?.message === 'string' ? response.message.trim() : '';
      if (successMsgCreate) {
        spaceToast.success(successMsgCreate);
        // Reset modal states and close
        setModalVisible(false);
        setCurrentModalType(null);
        setEditingQuestion(null);
      } else {
        // Keep modal open if there is no explicit success message
        spaceToast.warning(t('dailyChallenge.noSuccessMessage') || 'No success message returned from server');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      spaceToast.error(error.response?.data?.error || error.message || 'Failed to create question');
      // Keep modal open on error for user to correct inputs
    } finally {
      setSavingQuestion(false);
    }
  }, [id, fetchQuestions, transformQuestionToApiFormat, getSectionContent, questions, passages, t, challengeDetails?.challengeType]);

  // Handle updating an existing question
  const handleUpdateQuestion = useCallback(async (questionData) => {
    try {
      setSavingQuestion(true);

      // Use existing order number
      const orderNumber = editingQuestion.orderNumber || 1;
      
      // Transform question to API format
      const apiQuestion = transformQuestionToApiFormat(questionData, orderNumber, questionData.type);

      // Ensure question id is included for GV (Grammar & Vocabulary) when editing
      if (currentChallengeType === 'GV' && editingQuestion?.id) {
        apiQuestion.id = editingQuestion.id;
      }
      
      // Prepare section data with updated question
      const sectionContent = getSectionContent(questionData.type);
      
      const sectionData = {
        section: {
          id: editingQuestion.sectionId, // Send sectionId to update that section
          sectionsContent: sectionContent,
          resourceType: 'NONE'
        },
        questions: [apiQuestion]
      };

      console.log('Updating existing question:', sectionData);

      // Call API to update the section
      const response = await dailyChallengeApi.saveSectionWithQuestions(id, sectionData);
      
      // Refresh questions from API
      await fetchQuestions();
      
      // Only close modal when backend returns a success message
      if (response?.message) {
        spaceToast.success(response.message || 'Question updated successfully!');
        setModalVisible(false);
        setCurrentModalType(null);
        setEditingQuestion(null);
      } else {
        spaceToast.warning(t('dailyChallenge.noSuccessMessage') || 'No success message returned from server');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      spaceToast.error(error.response?.data?.error || error.message || 'Failed to update question');
      // Keep modal open on error for user to correct inputs
    } finally {
      setSavingQuestion(false);
    }
  }, [editingQuestion, id, fetchQuestions, transformQuestionToApiFormat, getSectionContent, currentChallengeType, t]);

  // Main handler - route to create or update
  const handleModalSave = useCallback(async (questionData) => {
    if (editingQuestion) {
      await handleUpdateQuestion(questionData);
    } else {
      await handleCreateQuestion(questionData);
    }
  }, [editingQuestion, handleUpdateQuestion, handleCreateQuestion]);

  const handleModalCancel = useCallback(() => {
    setModalVisible(false);
    setCurrentModalType(null);
    setEditingQuestion(null);
  }, []);

  const handleQuestionTypeModalCancel = useCallback(() => {
    setQuestionTypeModalVisible(false);
  }, []);

  // Handlers for RE/LI Add Question Modal
  const handleReLiAddQuestionManual = useCallback(() => {
    const challengeType = challengeDetails?.challengeType;
    const userRole = user?.role?.toLowerCase();
    
    let basePath;
    if (challengeType === 'RE') {
      basePath = userRole === 'teaching_assistant' 
        ? `/teaching-assistant/daily-challenges/create/reading/${id}`
        : `/teacher/daily-challenges/create/reading/${id}`;
    } else if (challengeType === 'LI') {
      basePath = userRole === 'teaching_assistant' 
        ? `/teaching-assistant/daily-challenges/create/listening/${id}`
        : `/teacher/daily-challenges/create/listening/${id}`;
    }
    
    navigate(basePath, {
      state: {
        challengeId: id,
        challengeName: challengeDetails?.challengeName,
        challengeType: challengeType,
        classId: challengeInfo.classId,
        className: challengeInfo.className,
        isManualMode: true // Flag to indicate manual mode selected from modal
      }
    });
    
    setReLiAddQuestionModalVisible(false);
  }, [challengeDetails, id, challengeInfo, navigate, user]);

  const handleReLiAiGenerateFromSettings = useCallback(() => {
    const challengeType = challengeDetails?.challengeType;
    const userRole = user?.role?.toLowerCase();
    // Route based on challenge type:
    // - RE (Reading) → /ai-reading/:id → AIGenerateReading.jsx
    // - LI (Listening) → /ai-listening/:id → AIGenerateListening.jsx
    const aiPath = challengeType === 'LI' ? (
      userRole === 'teaching_assistant'
        ? `/teaching-assistant/daily-challenges/create/ai-listening/${id}`
        : `/teacher/daily-challenges/create/ai-listening/${id}`
    ) : (
      userRole === 'teaching_assistant'
        ? `/teaching-assistant/daily-challenges/create/ai-reading/${id}`
        : `/teacher/daily-challenges/create/ai-reading/${id}`
    );
    
    navigate(aiPath, {
      state: {
        challengeId: id,
        challengeName: challengeDetails?.challengeName,
        challengeType: challengeType,
        classId: challengeInfo.classId,
        className: challengeInfo.className,
        aiSource: 'settings'
      }
    });
    
    setReLiAddQuestionModalVisible(false);
  }, [challengeDetails, id, challengeInfo, navigate, user]);

  const handleReLiAiGenerateFromFile = useCallback(() => {
    const challengeType = challengeDetails?.challengeType;
    const userRole = user?.role?.toLowerCase();
    // Route based on challenge type:
    // - RE (Reading) → /ai-reading/:id → AIGenerateReading.jsx
    // - LI (Listening) → /ai-listening/:id → AIGenerateListening.jsx
    const aiPath = challengeType === 'LI' ? (
      userRole === 'teaching_assistant'
        ? `/teaching-assistant/daily-challenges/create/ai-listening/${id}`
        : `/teacher/daily-challenges/create/ai-listening/${id}`
    ) : (
      userRole === 'teaching_assistant'
        ? `/teaching-assistant/daily-challenges/create/ai-reading/${id}`
        : `/teacher/daily-challenges/create/ai-reading/${id}`
    );
    
    navigate(aiPath, {
      state: {
        challengeId: id,
        challengeName: challengeDetails?.challengeName,
        challengeType: challengeType,
        classId: challengeInfo.classId,
        className: challengeInfo.className,
        aiSource: 'file'
      }
    });
    
    setReLiAddQuestionModalVisible(false);
  }, [challengeDetails, id, challengeInfo, navigate, user]);

  const handleReLiAddQuestionModalCancel = useCallback(() => {
    setReLiAddQuestionModalVisible(false);
  }, []);

  const handleEditQuestion = useCallback((questionId) => {
    setQuestions(prev => {
      const question = prev.find(q => q.id === questionId);
      if (question) {
        console.log('Editing question:', question);
        
        // Map question.type to currentModalType format
        let modalType = '';
        switch(question.type) {
          case 'MULTIPLE_CHOICE':
            modalType = 'multiple-choice';
            break;
          case 'MULTIPLE_SELECT':
            modalType = 'multiple-select';
            break;
          case 'TRUE_OR_FALSE':
            modalType = 'true-false';
            break;
          case 'FILL_IN_THE_BLANK':
            modalType = 'fill-blank';
            break;
          case 'DROPDOWN':
            modalType = 'dropdown';
            break;
          case 'DRAG_AND_DROP':
            modalType = 'drag-drop';
            break;
          case 'REARRANGE':
            modalType = 'reorder';
            break;
          case 'REWRITE':
            modalType = 'rewrite';
            break;
          default:
            modalType = 'multiple-choice';
        }
        
        console.log('Modal type:', modalType);
        setEditingQuestion(question);
        setCurrentModalType(modalType);
        setModalVisible(true);
      }
      return prev;
    });
  }, []);

  const handleDeleteQuestion = useCallback((questionId) => {
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex !== -1) {
      const question = {
        ...questions[questionIndex],
        questionNumber: questionIndex + 1
      };
      setDeleteQuestion(question);
      setIsDeleteModalVisible(true);
    }
  }, [questions]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      // Mark question as toBeDeleted instead of removing it
      setQuestions(prev => prev.map(q => 
        q.id === deleteQuestion.id 
          ? { ...q, toBeDeleted: true }
          : q
      ));
      
      spaceToast.success('Question marked for deletion. Click Save to apply changes.');
      
      setIsDeleteModalVisible(false);
      setDeleteQuestion(null);
    } catch (error) {
      console.error('Error marking question for deletion:', error);
      spaceToast.error('Failed to mark question for deletion');
    }
  }, [deleteQuestion]);

  const handleDeleteModalClose = useCallback(() => {
    setIsDeleteModalVisible(false);
    setDeleteQuestion(null);
  }, []);

  const handlePublishConfirm = useCallback(() => {
    setPublishConfirmModalVisible(true);
  }, []);

  const handlePublishConfirmCancel = useCallback(() => {
    setPublishConfirmModalVisible(false);
  }, []);

  const handleSaveChanges = useCallback(async (saveAsStatus, options = { silent: false }) => {
    // Check if there are any visible questions or passages (not deleted)
    const visibleQuestions = questions.filter(q => !q.toBeDeleted);
    const visiblePassages = passages.filter(p => !p.toBeDeleted);
    

    try {
      setLoading(true);

      // Prepare bulk update data based on visible items order
      // Group questions by sectionId to get unique sections
      const sectionsMap = new Map();
      
      // Collect all sections from questions (including deleted ones)
      questions.forEach((question) => {
        if (question.sectionId !== undefined && question.sectionId !== null) {
          const sectionId = question.sectionId;
          if (!sectionsMap.has(sectionId)) {
            sectionsMap.set(sectionId, {
              id: sectionId, // This is the section ID to send to API
              toBeDeleted: false,
              hasVisibleQuestions: false
            });
          }
          
          // If this question is marked for deletion, mark the section for deletion too
          if (question.toBeDeleted) {
            sectionsMap.get(sectionId).toBeDeleted = true;
          } else {
            // If this question is not deleted, mark that section has visible questions
            sectionsMap.get(sectionId).hasVisibleQuestions = true;
          }
        }
      });
      
      // Collect all sections from passages (including deleted ones)
      passages.forEach((passage) => {
        if (passage.sectionId !== undefined && passage.sectionId !== null) {
          const sectionId = passage.sectionId;
          if (!sectionsMap.has(sectionId)) {
            sectionsMap.set(sectionId, {
              id: sectionId,
              toBeDeleted: false,
              hasVisibleQuestions: false
            });
          }
          
          // If this passage is marked for deletion, mark the section for deletion too
          if (passage.toBeDeleted) {
            sectionsMap.get(sectionId).toBeDeleted = true;
          } else {
            // If this passage is not deleted, mark that section has visible questions
            sectionsMap.get(sectionId).hasVisibleQuestions = true;
          }
        }
      });
      
      // Set order numbers for visible sections only
      let orderNumber = 1;
      const bulkUpdateData = Array.from(sectionsMap.values()).map(section => {
        const { hasVisibleQuestions, ...sectionData } = section; // Remove hasVisibleQuestions from API request
        return {
          ...sectionData,
          orderNumber: hasVisibleQuestions ? orderNumber++ : section.orderNumber
        };
      });

      console.log('Bulk update sections data:', {
        count: bulkUpdateData.length,
        sections: bulkUpdateData
      });

      // Step 1: Call bulk update API to save/reorder sections (API trong ảnh: POST /api/v1/sections/bulk/{challengeId})
      const bulkResponse = await dailyChallengeApi.bulkUpdateSections(id, bulkUpdateData);
      console.log('Bulk update response:', bulkResponse);

      // Step 2: Update challenge status only when publishing
      if (saveAsStatus === 'published') {
        console.log('Updating challenge status to PUBLISHED');
        
        // Call API to update challenge status to PUBLISHED
        await dailyChallengeApi.updateDailyChallengeStatus(id, 'PUBLISHED');
        
        // Update local status
        setStatus('published');
        
        if (!options?.silent) {
          spaceToast.success(t('dailyChallenge.savedAsPublished') || 'Saved and published successfully!');
          
          // Navigate back to Daily Challenge list after successful publish
          const getDailyChallengeListPath = () => {
            if (challengeInfo.classId) {
              // If coming from class-specific daily challenges, go back to that list
              const userRole = user?.role?.toLowerCase();
              if (userRole === 'teacher') {
                return `/teacher/classes/daily-challenges/${challengeInfo.classId}`;
              } 
            } 
          };
          
          // Navigate after a short delay to show success message
          setTimeout(() => {
            navigate(getDailyChallengeListPath());
          }, 1000);
        }
      } else if (saveAsStatus === 'draft') {
        // Save as Draft: chỉ gọi bulkUpdateSections (đã gọi ở Step 1), không cần update status
        console.log('Saved as draft (sections updated only)');
        
        if (!options?.silent) {
          spaceToast.success(t('dailyChallenge.savedAsDraft') || 'Saved as draft successfully!');
        }
      } else {
        if (!options?.silent) {
          spaceToast.success('Changes saved successfully!');
        }
      }

      // Refresh questions and passages from API to get updated data
      await fetchQuestions();
      
      // Reset isModified flags for all questions and passages
      setQuestions(prev => prev.map(q => ({ ...q, isModified: false })));
      setPassages(prev => prev.map(p => ({ ...p, isModified: false })));

    } catch (error) {
      console.error('Error saving changes:', error);
      spaceToast.error(error.response?.data?.error || error.message || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  }, [id, questions, passages, t, fetchQuestions, challengeInfo.classId, navigate, user?.role]);

  const handlePublishConfirmOk = useCallback(async () => {
    setPublishConfirmModalVisible(false);
    await handleSaveChanges('published');
  }, [handleSaveChanges]);

  const handleOpenSettings = useCallback(() => {
    setSettingsModalVisible(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setSettingsModalVisible(false);
  }, []);

  const handleSaveSettings = useCallback((settingsData) => {
    // Update local state with new settings
    setChallengeMode(settingsData.challengeMode);
    setDurationMinutes(settingsData.durationMinutes);
    setStartDate(settingsData.startDate);
    setEndDate(settingsData.endDate);
    setShuffleQuestion(settingsData.shuffleQuestion || settingsData.shuffleAnswers || false);
    setTranslateOnScreen(settingsData.translateOnScreen);
    setAntiCheatModeEnabled(settingsData.antiCheatModeEnabled);
    setSettingsModalVisible(false);
  }, []);

  // Auto-save silently every 5 minutes based on current status
  useEffect(() => {
    const intervalMs = 5 * 60 * 1000; // reduced to 1 minute for testing
    let isSaving = false;
    const timer = setInterval(async () => {
      if (loading || isSaving) return;
      const hasChanges =
        (Array.isArray(questions) && questions.some(q => q?.isModified || q?.toBeDeleted)) ||
        (Array.isArray(passages) && passages.some(p => p?.isModified || p?.toBeDeleted));
      if (!hasChanges) return;
      isSaving = true;
      try {
        const nextStatus = status === 'published' ? 'published' : 'draft';
        console.log('[AutoSave] Starting silent auto-save as', nextStatus, 'at', new Date().toISOString());
        await handleSaveChanges(nextStatus, { silent: true });
        console.log('[AutoSave] Completed silent auto-save at', new Date().toISOString());
      } catch (e) {
        // silent
      } finally {
        isSaving = false;
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [status, questions, passages, handleSaveChanges, loading]);

  // Import is disabled in this screen (export-only)

  const handleImportCancel = useCallback(() => {
    setImportModal({
      visible: false,
      fileList: [],
      uploading: false
    });
  }, []);

  const handleImportOk = useCallback(async () => {
    if (importModal.fileList.length === 0) {
      spaceToast.warning(t('dailyChallenge.selectFileToImport') || 'Please select a file to import');
      return;
    }

    setImportModal(prev => ({ ...prev, uploading: true }));
    
    try {
      const file = importModal.fileList[0];
      
      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);
      
      // TODO: Call import API with FormData
      // const response = await dailyChallengeApi.importQuestions(formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Refresh the list to get updated data
      fetchQuestions();
      
      spaceToast.success(t('dailyChallenge.importSuccess') || 'Import successful');
      setImportModal({ visible: false, fileList: [], uploading: false });
    } catch (error) {
      console.error('Error importing questions:', error);
      spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || t('dailyChallenge.importError'));
      setImportModal(prev => ({ ...prev, uploading: false }));
    }
  }, [importModal.fileList, fetchQuestions, t]);

  // Handle file selection
  const handleFileSelect = useCallback((file) => {
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    
    if (!allowedTypes.includes(file.type)) {
      spaceToast.error('Please select a valid Excel (.xlsx, .xls) file');
      return false;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      spaceToast.error('File size must be less than 10MB');
      return false;
    }
    
    setImportModal(prev => ({
      ...prev,
      fileList: [file]
    }));
    
    return false; // Prevent default upload behavior
  }, []);

  const handleDownloadTemplate = useCallback(async () => {
    setTemplateDownloadLoading(true);
    try {
      // TODO: Implement actual template download API
      // const response = await dailyChallengeApi.downloadQuestionTemplate();
      
      // Simulate download
      spaceToast.info('Template download will be implemented');
      
      // Example download logic:
      // const link = document.createElement('a');
      // link.setAttribute('href', downloadUrl);
      // link.setAttribute('download', 'daily_challenge_import_template.xlsx');
      // link.setAttribute('target', '_blank');
      // link.style.visibility = 'hidden';
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
      
      // spaceToast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to download template');
    } finally {
      setTemplateDownloadLoading(false);
    }
  }, []);

  const handleExportData = useCallback(async () => {
    if (!id || exportLoading) return;
    // Validate there is content to export
    const type = challengeDetails?.challengeType;
    const hasQuestions =
      type === 'GV'
        ? Array.isArray(questions) && questions.some(q => !q?.toBeDeleted)
        : Array.isArray(passages) && passages.some(p => !p?.toBeDeleted);
    if (!hasQuestions) {
      spaceToast.warning('There is no content to export');
      return;
    }
    try {
      setExportLoading(true);
      const res = await dailyChallengeApi.exportWorksheet(id);
      const blob = res?.data instanceof Blob ? res.data : new Blob([res?.data ?? ''], { type: res?.headers?.['content-type'] || 'application/octet-stream' });
      const contentDisposition = res?.headers?.['content-disposition'] || '';
      let filename = `daily_challenge_${id}.docx`;
      const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(contentDisposition);
      if (match) {
        const raw = decodeURIComponent(match[1] || match[2] || '').trim();
        if (raw) filename = raw;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      spaceToast.success('Exported worksheet');
    } catch (err) {
      console.error('Export worksheet error:', err);
      spaceToast.error(err?.response?.data?.error || 'Failed to export worksheet');
    } finally {
      setExportLoading(false);
    }
  }, [id, exportLoading, challengeDetails?.challengeType, questions, passages, t]);

  

  const handleDuplicateQuestion = useCallback(async (questionId) => {
    try {
      const source = questions.find(q => q.id === questionId);
      if (!source) return;

      // Persist duplicate through API for all challenge types to avoid errors
      setLoading(true);

      // Compute next section orderNumber from existing sections
      // Use filtered arrays to exclude deleted items
      const visiblePassages = passages.filter(p => !p.toBeDeleted);
      const visibleQuestions = questions.filter(q => !q.toBeDeleted);
      
      // Calculate nextOrder based on total visible items + 1
      // This ensures correct ordering even when state hasn't updated yet
      const totalVisibleItems = visiblePassages.length + visibleQuestions.length;
      const nextOrder = totalVisibleItems + 1;

      const questionOrderDup = (challengeDetails?.challengeType === 'GV') ? 1 : nextOrder;
      const apiQuestion = transformQuestionToApiFormat(
        {
          ...source,
          question: source.question || source.questionText || '',
          questionText: source.questionText || source.question || '',
        },
        questionOrderDup,
        source.type
      );

      const sectionContent = getSectionContent(source.type);

      const sectionData = {
        section: {
          sectionsContent: sectionContent,
          resourceType: 'NONE',
          orderNumber: nextOrder
        },
        questions: [apiQuestion]
      };

      await dailyChallengeApi.saveSectionWithQuestions(id, sectionData);

      // Refresh from backend so the new copy has real IDs and correct order
      await fetchQuestions();
      spaceToast.success('Duplicated question successfully');
    } catch (err) {
      console.error('Error duplicating question:', err);
      spaceToast.error(err?.response?.data?.error || 'Failed to duplicate question');
    } finally {
      setLoading(false);
    }
  }, [questions, passages, id, fetchQuestions, transformQuestionToApiFormat, getSectionContent, challengeDetails?.challengeType]);

  const handlePointsChange = useCallback((questionId, value) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, weight: value, isModified: true } : q
    ));
  }, []);

  // Passage handlers
  const handleDeletePassage = useCallback((passageId) => {
    // Mark passage as toBeDeleted instead of removing it
    setPassages(prev => prev.map(p => 
      p.id === passageId 
        ? { ...p, toBeDeleted: true }
        : p
    ));
    
    spaceToast.success('Passage marked for deletion. Click Save to apply changes.');
  }, []);

  const handleEditPassage = useCallback((passageId) => {
    // Navigate to appropriate edit screen based on challengeType
    const passage = passages.find(p => p.id === passageId);
    if (passage) {
      const userRole = user?.role?.toLowerCase();
      const challengeType = challengeDetails?.challengeType;
      
      // Determine the base path based on challengeType
      let basePath;
      if (challengeType === 'WR') {
        // Writing challenge
        basePath = userRole === 'teaching_assistant' 
          ? `/teaching-assistant/daily-challenges/create/writing/${id}`
          : `/teacher/daily-challenges/create/writing/${id}`;
      } else if (challengeType === 'SP') {
        // Speaking challenge
        basePath = userRole === 'teaching_assistant' 
          ? `/teaching-assistant/daily-challenges/create/speaking/${id}`
          : `/teacher/daily-challenges/create/speaking/${id}`;
      } else {
        // Reading or Listening challenge
        const isListeningPassage = passage.type === 'LISTENING_PASSAGE';
        basePath = userRole === 'teaching_assistant' 
          ? (isListeningPassage 
            ? `/teaching-assistant/daily-challenges/create/listening/${id}`
            : `/teaching-assistant/daily-challenges/create/reading/${id}`)
          : (isListeningPassage 
            ? `/teacher/daily-challenges/create/listening/${id}`
            : `/teacher/daily-challenges/create/reading/${id}`);
      }
      
      navigate(basePath, {
        state: {
          challengeId: id,
          challengeName: challengeDetails?.challengeName,
          challengeType: challengeDetails?.challengeType,
          classId: challengeInfo.classId,
          className: challengeInfo.className,
          editingPassage: passage
        }
      });
    }
  }, [passages, id, challengeDetails, challengeInfo, navigate, user]);

  const handleDuplicatePassage = useCallback(async (passageId) => {
    try {
      const passageToDuplicate = passages.find(p => p.id === passageId);
      if (!passageToDuplicate) return;

      setLoading(true);

      // Determine resource type and url for the section based on passage
      const isFilePassage = passageToDuplicate.type === 'LISTENING_PASSAGE' || passageToDuplicate.type === 'SPEAKING_PASSAGE';
      const resourceType = isFilePassage ? 'FILE' : 'DOCUMENT';

      // Next order number for sections
      const sectionOrderNumbers = passages
        .map(p => p?.orderNumber)
        .filter(n => typeof n === 'number');
      const nextOrder = (sectionOrderNumbers.length ? Math.max(...sectionOrderNumbers) : 0) + 1;

      // Transform questions inside this passage to API format
      const apiQuestions = Array.isArray(passageToDuplicate.questions)
        ? passageToDuplicate.questions.map((q, idx) =>
            transformQuestionToApiFormat(
              {
                ...q,
                question: q.question || q.questionText || '',
                questionText: q.questionText || q.question || '',
              },
              idx + 1,
              q.type
            )
          )
        : [];

      const sectionPayload = {
        section: {
          sectionsContent: passageToDuplicate.content || '',
          resourceType,
          orderNumber: nextOrder,
          ...(isFilePassage && passageToDuplicate.audioUrl ? { sectionsUrl: passageToDuplicate.audioUrl } : {}),
        },
        questions: apiQuestions,
      };

      await dailyChallengeApi.saveSectionWithQuestions(id, sectionPayload);

      await fetchQuestions();
      spaceToast.success('Passage duplicated successfully!');
    } catch (err) {
      console.error('Error duplicating passage:', err);
      spaceToast.error(err?.response?.data?.error || 'Failed to duplicate passage');
    } finally {
      setLoading(false);
    }
  }, [passages, id, fetchQuestions, transformQuestionToApiFormat]);

  const handlePassagePointsChange = useCallback((passageId, value) => {
    setPassages(prev => prev.map(p => 
      p.id === passageId ? { ...p, weight: value, isModified: true } : p
    ));
  }, []);

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('is-dragging');
    
    // Capture dimensions of the item being dragged to prevent stretching/shrinking
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const activeNode = document.querySelector(`[data-id="${active.id}"]`);
      if (activeNode) {
        const rect = activeNode.getBoundingClientRect();
        setActiveDragDimensions({ 
          width: rect.width, 
          height: rect.height 
        });
      }
    }, 0);
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('is-dragging');
    };
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    document.body.style.overflow = '';
    document.body.classList.remove('is-dragging');
    
    // Clear active drag dimensions
    setActiveDragDimensions(null);

    if (!over || active.id === over.id) return;

    // Optimized: Use Map for O(1) lookup instead of findIndex O(n)
    const passageIdMap = new Map(passages.map((p, idx) => [p.id, idx]));
    const questionIdMap = new Map(questions.map((q, idx) => [q.id, idx]));
    
    const isPassage = passageIdMap.has(active.id);
    
    if (isPassage) {
      // Handle passage reordering - optimized
      const oldIndex = passageIdMap.get(active.id);
      const newIndex = passageIdMap.get(over.id);
      
      if (oldIndex === undefined || newIndex === undefined) return;

      setPassages((items) => {
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Optimized: Build order map once and reuse
        const visibleOrderMap = new Map();
        let orderCounter = 1;
        newItems.forEach((item) => {
          if (!item.toBeDeleted) {
            visibleOrderMap.set(item.id, orderCounter++);
          }
        });
        
        // Update orderNumber only for visible items
        return newItems.map((passage) => {
          if (passage.toBeDeleted) return passage;
          const orderNum = visibleOrderMap.get(passage.id);
          return orderNum ? { ...passage, orderNumber: orderNum } : passage;
        });
      });
    } else {
      // Handle question reordering - optimized
      const oldIndex = questionIdMap.get(active.id);
      const newIndex = questionIdMap.get(over.id);
      
      if (oldIndex === undefined || newIndex === undefined) return;

      setQuestions((items) => {
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Optimized: Build order map once and reuse
        const visibleOrderMap = new Map();
        let orderCounter = 1;
        newItems.forEach((item) => {
          if (!item.toBeDeleted) {
            visibleOrderMap.set(item.id, orderCounter++);
          }
        });
        
        // Update orderNumber only for visible items
        return newItems.map((question) => {
          if (question.toBeDeleted) return question;
          const orderNum = visibleOrderMap.get(question.id);
          return orderNum ? { ...question, orderNumber: orderNum } : question;
        });
      });
    }
  }, [passages, questions]);

  // Filter questions (exclude deleted ones and apply search filter)
  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      // Exclude deleted questions
      if (question.toBeDeleted) {
        return false;
      }
      
      // Apply search filter
      const matchesSearch =
        searchText === "" ||
        question.question.toLowerCase().includes(searchText.toLowerCase());
      return matchesSearch;
    });
  }, [questions, searchText]);

  // Filter passages (exclude deleted ones and apply search filter)
  const filteredPassages = useMemo(() => {
    return passages.filter((passage) => {
      // Exclude deleted passages
      if (passage.toBeDeleted) {
        return false;
      }
      
      // Apply search filter
      const matchesSearch =
        searchText === "" ||
        passage.content.toLowerCase().includes(searchText.toLowerCase()) ||
        (passage.questions && passage.questions.some(q => 
          q.question.toLowerCase().includes(searchText.toLowerCase())
        ));
      return matchesSearch;
    });
  }, [passages, searchText]);

  const questionIds = useMemo(() => 
    filteredQuestions.map((question) => question.id), 
    [filteredQuestions]
  );

  const passageIds = useMemo(() => 
    filteredPassages.map((passage) => passage.id), 
    [filteredPassages]
  );

  // Compute display totals and label based on challenge type
  const displayTotals = useMemo(() => {
    const type = challengeDetails?.challengeType;
    let count = 0;
    let label = 'questions';

    if (type === 'GV') {
      count = filteredQuestions.length;
      label = 'questions';
    } else if (type === 'RE') {
      count = filteredPassages.length;
      label = 'reading sections';
    } else if (type === 'LI') {
      count = filteredPassages.filter(p => p.type === 'LISTENING_PASSAGE').length;
      label = 'listening sections';
    } else if (type === 'WR') {
      count = filteredPassages.length;
      label = 'writing';
    } else if (type === 'SP') {
      count = filteredPassages.filter(p => p.type === 'SPEAKING_PASSAGE').length;
      label = 'speaking';
    } else {
      count = filteredQuestions.length;
      label = 'questions';
    }

    const remaining = Math.max(0, 100 - (Number(count) || 0));
    return { count, label, remaining };
  }, [challengeDetails?.challengeType, filteredQuestions, filteredPassages]);

  // Handle back button click - Navigate to Performance page with state
  const handleBackToDailyChallenges = () => {
    navigate(`/teacher/daily-challenges/detail/${id}`, {
      state: challengeInfo
    });
  };

  // Only export is exposed in UI; import actions are disabled/hidden

  // Custom Header Component
  const customHeader = (
    <header className={`themed-header ${theme}-header`}>
      <nav className="themed-navbar">
        <div className="themed-navbar-content" style={{ justifyContent: 'space-between', width: '100%' }}>
          {/* Left: Back Button + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToDailyChallenges}
              className={`class-menu-back-button ${theme}-class-menu-back-button`}
              style={{
                height: '32px',
                borderRadius: '8px',
                fontWeight: '500',
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
              color: theme === 'sun' ? '#1E40AF' : '#FFFFFF',
              textShadow: theme === 'sun' ? 'none' : '0 0 10px rgba(134, 134, 134, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ 
                fontSize: '24px',
                fontWeight: 300,
                opacity: 0.5
              }}>|</span>
              <span>
                {challengeInfo.className && challengeInfo.challengeName 
                  ? `${challengeInfo.className} / ${challengeInfo.challengeName}` 
                  : challengeInfo.challengeName 
                  ? challengeInfo.challengeName
                  : `${t('dailyChallenge.dailyChallengeManagement')} / ${t('dailyChallenge.content')}`
                }
              </span>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Status Display - Text Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '8px',
              background: status === 'published'
                ? 'rgba(82, 196, 26, 0.1)'
                : status === 'in-progress'
                ? 'rgba(24, 144, 255, 0.1)'
                : status === 'finished'
                ? 'rgba(229, 79, 79, 0.1)'
                : 'rgba(250, 173, 20, 0.1)',
              border: status === 'published'
                ? '2px solid rgba(82, 196, 26, 0.3)'
                : status === 'in-progress'
                ? '2px solid rgba(24, 144, 255, 0.3)'
                : status === 'finished'
                ? '2px solid rgba(229, 79, 79, 0.3)'
                : '2px solid rgba(250, 173, 20, 0.3)',
            }}>
              {status === 'published' ? (
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
              ) : status === 'in-progress' ? (
                <FileTextOutlined style={{ color: 'rgb(24, 144, 255)', fontSize: '18px' }} />
              ) : status === 'finished' ? (
                <FileTextOutlined style={{ color: 'rgb(229, 79, 79)', fontSize: '18px' }} />
              ) : (
                <FileTextOutlined style={{ color: '#faad14', fontSize: '18px' }} />
              )}
              <span style={{
                fontWeight: 600,
                fontSize: '14px',
                color: status === 'published'
                  ? '#52c41a'
                  : status === 'in-progress'
                  ? 'rgb(24, 144, 255)'
                  : status === 'finished'
                  ? 'rgb(229, 79, 79)'
                  : '#faad14'
              }}>
                {status === 'published' 
                  ? t('dailyChallenge.published') 
                  : status === 'in-progress'
                  ? t('dailyChallenge.inProgress') || 'In Progress'
                  : status === 'finished'
                  ? t('dailyChallenge.finished') || 'Finished'
                  : t('dailyChallenge.draft')}
              </span>
            </div>

            {/* Export button only */}
            <Button 
              icon={<UploadOutlined />}
              loading={exportLoading}
              disabled={exportLoading}
              onClick={handleExportData}
              className={`create-button ${theme}-create-button`}
              style={{
                height: '40px',
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '16px',
                padding: '0 24px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                transition: 'all 0.3s ease',
                background: '#ffffff',
                color: '#000000',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
              }}
            >
              {t('common.export') || 'Export'}
            </Button>

            {/* Preview Button - Only visible for TEACHER role */}
            {user?.role?.toLowerCase() === 'teacher' && (
              <Button 
                icon={<EyeOutlined />}
                className={`create-button ${theme}-create-button`}
                onClick={() => {
                  navigate(`/teacher/daily-challenges/detail/${id}/preview`, {
                    state: {
                      challengeId: id,
                      challengeName: challengeDetails?.challengeName,
                      classId: challengeInfo.classId,
                      className: challengeInfo.className,
                    }
                  });
                }}
                style={{
                  height: '40px',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '16px',
                  padding: '0 24px',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  transition: 'all 0.3s ease',
                  background: '#ffffff',
                  color: '#000000',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                }}
              >
                {t('dailyChallenge.preview')}
              </Button>
            )}

            {/* Add Question/Passage Button - only visible in draft */}
            {status === 'draft' && (
              <Button 
                icon={<PlusOutlined />}
                className={`create-button ${theme}-create-button`}
                onClick={handleAddQuestion}
                style={{
                  height: '40px',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '16px',
                  padding: '0 24px',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  transition: 'all 0.3s ease',
                  background: '#ffffff',
                  color: '#000000',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                }}
              >
                {t('dailyChallenge.addQuestion')}
              </Button>
            )}
            
            {/* Save Dropdown - hidden when IN_PROGRESS or FINISHED */}
            {status !== 'finished' && status !== 'in-progress' && (
            <Dropdown
              menu={{ 
                items: (
                  status === 'published'
                    ? [
                        {
                          key: 'published',
                          label: <span style={{ color: '#000000' }}>{t('dailyChallenge.saveAsPublished') || 'Save as Published'}</span>,
                          icon: <CheckCircleOutlined style={{ color: '#000000' }} />,
                          onClick: handlePublishConfirm,
                        },
                      ]
                    : [
                        {
                          key: 'draft',
                          label: <span style={{ color: '#000000' }}>{t('dailyChallenge.saveAsDraft') || 'Save as Draft'}</span>,
                          icon: <FileTextOutlined style={{ color: '#000000' }} />,
                          onClick: () => handleSaveChanges('draft'),
                        },
                        {
                          key: 'published',
                          label: <span style={{ color: '#000000' }}>{t('dailyChallenge.saveAsPublished') || 'Save as Published'}</span>,
                          icon: <CheckCircleOutlined style={{ color: '#000000' }} />,
                          onClick: handlePublishConfirm,
                        },
                      ]
                )
              }}
              trigger={['click']}
            >
              <Button 
                icon={<SaveOutlined />}
                className={`create-button ${theme}-create-button`}
                style={{
                  height: '40px',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '16px',
                  padding: '0 24px',
                  border: 'none',
                  transition: 'all 0.3s ease',
                  background: theme === 'sun' 
                    ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                    : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                  color: '#000000',
                  boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)'
                }}
              >
                {t('common.save') || 'Lưu'} <DownOutlined />
              </Button>
            </Dropdown>
            )}
          </div>
        </div>
      </nav>
    </header>
  );

  return (
    <ThemedLayout customHeader={customHeader}>
      <div className={`daily-challenge-content-wrapper ${theme}-daily-challenge-content-wrapper`}>
        <div style={{ padding: '24px' }}>

          <Row gutter={24}>
            {/* Left Section - Settings (View Only) */}
            <Col 
              xs={24} 
              lg={isCollapsed ? 2 : 6}
              style={{ 
                transition: 'all 0.3s ease'
              }}
            >
              <div className="settings-scroll-container" style={{ 
                position: 'sticky', 
                top: '0px', 
                height: isCollapsed ? 'calc(100vh - 40px)' : 'auto',
                maxHeight: 'calc(100vh - 40px)', 
                overflowY: isCollapsed ? 'hidden' : 'auto', 
                paddingBottom: isCollapsed ? '0px' : '80px', 
                paddingLeft: isCollapsed ? '12px' : '24px', 
                paddingRight: isCollapsed ? '0px' : '24px', 
                transition: 'all 0.3s ease',
                display: isCollapsed ? 'flex' : 'block',
                alignItems: isCollapsed ? 'center' : 'flex-start',
                justifyContent: isCollapsed ? 'flex-start' : 'flex-start'
              }}>
                {/* Collapsed State - Show only toggle button */}
                {isCollapsed ? (
                  <Tooltip title={t('common.expand') || 'Expand'} placement="right">
                    <div
                      onClick={() => setIsCollapsed(false)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        flexShrink: 0,
                        background: theme === 'sun'
                          ? 'linear-gradient(135deg, rgba(102, 174, 255, 0.2), rgba(60, 153, 255, 0.2))'
                          : 'linear-gradient(135deg, rgba(181, 176, 192, 0.25), rgba(131, 119, 160, 0.25))',
                        border: theme === 'sun'
                          ? '2px solid rgba(102, 174, 255, 0.4)'
                          : '2px solid rgba(181, 176, 192, 0.4)',
                        boxShadow: theme === 'sun'
                          ? '0 2px 8px rgba(60, 153, 255, 0.2)'
                          : '0 2px 8px rgba(131, 119, 160, 0.25)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.background = theme === 'sun'
                          ? 'linear-gradient(135deg, rgba(102, 174, 255, 0.35), rgba(60, 153, 255, 0.35))'
                          : 'linear-gradient(135deg, rgba(181, 176, 192, 0.4), rgba(131, 119, 160, 0.4))';
                        e.currentTarget.style.boxShadow = theme === 'sun'
                          ? '0 4px 12px rgba(60, 153, 255, 0.35)'
                          : '0 4px 12px rgba(131, 119, 160, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = theme === 'sun'
                          ? 'linear-gradient(135deg, rgba(102, 174, 255, 0.2), rgba(60, 153, 255, 0.2))'
                          : 'linear-gradient(135deg, rgba(181, 176, 192, 0.25), rgba(131, 119, 160, 0.25))';
                        e.currentTarget.style.boxShadow = theme === 'sun'
                          ? '0 2px 8px rgba(60, 153, 255, 0.2)'
                          : '0 2px 8px rgba(131, 119, 160, 0.25)';
                      }}
                    >
                      <MenuUnfoldOutlined
                        style={{
                          fontSize: '20px',
                          color: theme === 'sun' ? '#1890ff' : '#8377A0',
                        }}
                      />
                          </div>
                  </Tooltip>
                ) : (
                  /* Expanded State - Show full settings */
                  <Card
                    className={`settings-container-card ${theme}-settings-container-card`}
                    style={{
                      borderRadius: '16px',
                      border: theme === 'sun' 
                        ? '2px solid rgba(113, 179, 253, 0.25)' 
                        : '2px solid rgba(138, 122, 255, 0.2)',
                      boxShadow: theme === 'sun' 
                        ? '0 4px 16px rgba(113, 179, 253, 0.1)' 
                        : '0 4px 16px rgba(138, 122, 255, 0.12)',
                      background: theme === 'sun'
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
                      backdropFilter: 'blur(10px)'
                    }}
                    loading={challengeLoading}
                  >
                    {/* Settings Header with Icons */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px',
                      paddingBottom: '16px',
                      borderBottom: theme === 'sun' 
                        ? '2px solid rgba(113, 179, 253, 0.15)' 
                        : '2px solid rgba(138, 122, 255, 0.15)'
                    }}>
                      {/* Settings Icon - Left */}
                      <Tooltip title={t('dailyChallenge.editSettings') || 'Edit Settings'} placement="right">
                        <div
                          onClick={handleOpenSettings}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'rotate(90deg) scale(1.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                          }}
                        >
                          <SettingOutlined
                            style={{
                              fontSize: '24px',
                              color: theme === 'sun' ? '#1890ff' : '#8377A0',
                            }}
                          />
                          </div>
                      </Tooltip>

                      {/* Collapse Icon - Right */}
                      <Tooltip title={t('common.collapse') || 'Collapse'} placement="left">
                        <div
                          onClick={() => setIsCollapsed(true)}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            background: theme === 'sun'
                              ? 'linear-gradient(135deg, rgba(102, 174, 255, 0.15), rgba(60, 153, 255, 0.15))'
                              : 'linear-gradient(135deg, rgba(181, 176, 192, 0.2), rgba(131, 119, 160, 0.2))',
                            border: theme === 'sun'
                              ? '2px solid rgba(102, 174, 255, 0.3)'
                              : '2px solid rgba(181, 176, 192, 0.3)',
                            boxShadow: theme === 'sun'
                              ? '0 2px 8px rgba(60, 153, 255, 0.15)'
                              : '0 2px 8px rgba(131, 119, 160, 0.2)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.background = theme === 'sun'
                              ? 'linear-gradient(135deg, rgba(102, 174, 255, 0.25), rgba(60, 153, 255, 0.25))'
                              : 'linear-gradient(135deg, rgba(181, 176, 192, 0.3), rgba(131, 119, 160, 0.3))';
                            e.currentTarget.style.boxShadow = theme === 'sun'
                              ? '0 4px 12px rgba(60, 153, 255, 0.3)'
                              : '0 4px 12px rgba(131, 119, 160, 0.35)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.background = theme === 'sun'
                              ? 'linear-gradient(135deg, rgba(102, 174, 255, 0.15), rgba(60, 153, 255, 0.15))'
                              : 'linear-gradient(135deg, rgba(181, 176, 192, 0.2), rgba(131, 119, 160, 0.2))';
                            e.currentTarget.style.boxShadow = theme === 'sun'
                              ? '0 2px 8px rgba(60, 153, 255, 0.15)'
                              : '0 2px 8px rgba(131, 119, 160, 0.2)';
                          }}
                        >
                          <MenuFoldOutlined
                            style={{
                              fontSize: '18px',
                              color: theme === 'sun' ? '#1890ff' : '#8377A0',
                            }}
                          />
                              </div>
                      </Tooltip>
                            </div>

                  {/* Challenge Mode (View Only) */}
                  <div style={{ marginBottom: '16px' }}>
                    <Typography.Title level={5} style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px', fontWeight: 600, textAlign: 'center', color: 'rgb(24, 144, 255)' }}>
                      {t('dailyChallenge.mode')}
                  </Typography.Title>
                    <div style={{ 
                      padding: '12px', 
                      background: challengeMode === 'normal' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '8px',
                      border: challengeMode === 'normal' ? '2px solid #8B5CF6' : '2px solid #EF4444'
                    }}>
                      <Typography.Text strong style={{ fontSize: '14px' }}>
                        {challengeMode === 'normal' ? t('dailyChallenge.normalMode') : t('dailyChallenge.examMode')}
                                  </Typography.Text>
                              </div>
                            </div>

                  <Divider style={{ margin: '16px 0' }} />

                  {/* Challenge Configuration (View Only) */}
                  <div style={{ marginBottom: '16px' }}>
                    <Typography.Title level={5} style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px', fontWeight: 600, textAlign: 'center', color: 'rgb(24, 144, 255)' }}>
                      {t('dailyChallenge.configuration')}
                  </Typography.Title>
                  <div>
                      {/* Challenge Name */}
                      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                        <Typography.Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                          {t('dailyChallenge.challengeName')}
                                </Typography.Text>
                        <Typography.Text strong style={{ fontSize: '14px' }}>
                          {challengeDetails?.challengeName || t('common.notSet')}
                                </Typography.Text>
                            </div>

                      {/* Challenge Type */}
                      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                        <Typography.Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                          {t('dailyChallenge.questionType')}
                                </Typography.Text>
                        <Typography.Text strong style={{ fontSize: '14px', color: 'rgb(223, 175, 56)' }}>
                          {challengeDetails?.challengeType ? getChallengeTypeName(challengeDetails.challengeType) : t('common.notSet')}
                                </Typography.Text>
                            </div>

                      {/* Duration */}
                      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                        <Typography.Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                          {t('dailyChallenge.duration')}
                                </Typography.Text>
                        <Typography.Text strong style={{ fontSize: '14px' }}>
                          {durationMinutes ? `${durationMinutes} ${t('dailyChallenge.minutes')}` : t('common.notSet')}
                                </Typography.Text>
                            </div>

                      {/* Start Date */}
                      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                        <Typography.Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                          {t('dailyChallenge.startDate')}
                                  </Typography.Text>
                        <Typography.Text strong style={{ fontSize: '14px' }}>
                          {startDate ? new Date(startDate).toLocaleDateString('vi-VN') : t('common.notSet')}
                                  </Typography.Text>
                            </div>

                      {/* End Date */}
                      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                        <Typography.Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                          {t('dailyChallenge.endDate')}
                                </Typography.Text>
                        <Typography.Text strong style={{ fontSize: '14px' }}>
                          {endDate ? new Date(endDate).toLocaleDateString('vi-VN') : t('common.notSet')}
                                </Typography.Text>
                              </div>
                            </div>
                                </div>

                  <Divider style={{ margin: '16px 0' }} />

                  {/* Settings (View Only) */}
                  <div>
                    <Typography.Title level={5} style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px', fontWeight: 600, textAlign: 'center', color: 'rgb(24, 144, 255)' }}>
                      {t('common.settings')}
                  </Typography.Title>
                  <div>
                      {/* Translate On Screen */}
                      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography.Text style={{ fontSize: '13px' }}>
                          {t('dailyChallenge.translateOnScreen')}
                                    </Typography.Text>
                        <Typography.Text strong style={{ 
                          fontSize: '13px',
                          color: translateOnScreen ? '#52c41a' : '#d9d9d9'
                        }}>
                          {translateOnScreen ? '✓ ON' : '✗ OFF'}
                                  </Typography.Text>
                            </div>

                      {/* Shuffle Questions */}
                      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography.Text style={{ fontSize: '13px' }}>
                          {t('dailyChallenge.shuffleQuestion') || t('dailyChallenge.shuffleAnswers')}
                                  </Typography.Text>
                        <Typography.Text strong style={{ 
                          fontSize: '13px',
                          color: shuffleQuestion ? '#52c41a' : '#d9d9d9'
                        }}>
                          {shuffleQuestion ? '✓ ON' : '✗ OFF'}
                                  </Typography.Text>
                            </div>

                      {/* Anti-Cheat Mode */}
                      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography.Text style={{ fontSize: '13px' }}>
                           {t('dailyChallenge.antiCheatMode')}
                                  </Typography.Text>
                        <Typography.Text strong style={{ 
                          fontSize: '13px',
                          color: antiCheatModeEnabled ? '#52c41a' : '#d9d9d9'
                        }}>
                          {antiCheatModeEnabled ? '✓ ON' : '✗ OFF'}
                                  </Typography.Text>
                              </div>
                            </div>
                  </div>
                </Card>
                )}
              </div>
            </Col>

            {/* Right Section - Questions List */}
            <Col 
              xs={24} 
              lg={isCollapsed ? 22 : 18}
              style={{ 
                transition: 'all 0.3s ease'
              }}
            >
              {/* Search Section */}
              <div style={{ paddingLeft: '24px', paddingRight: '24px', marginBottom: '24px' }}>
                <Card 
                  className={`search-card ${theme}-search-card`}
                  style={{
                    borderRadius: '16px',
                    border: theme === 'sun' 
                      ? '2px solid rgba(113, 179, 253, 0.25)' 
                      : '2px solid rgba(138, 122, 255, 0.2)',
                    boxShadow: theme === 'sun' 
                      ? '0 4px 16px rgba(113, 179, 253, 0.1)' 
                      : '0 4px 16px rgba(138, 122, 255, 0.12)',
                    background: theme === 'sun'
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography.Text style={{ fontWeight: 400, color: '#000', whiteSpace: 'nowrap', fontSize: '16px' }}>
                <span style={{ fontWeight: 700 }}>Total:</span> {displayTotals.count} questions • <span style={{ fontWeight: 700 }}>Remaining:</span> {displayTotals.remaining} questions
              </Typography.Text>
              <Input
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={`search-input ${theme}-search-input`}
                    style={{ 
                      width: '100%', 
                      height: '40px', 
                      fontSize: '16px',
                      border: theme === 'sun' ? '2px solid rgba(113, 179, 253, 0.3)' : undefined,
                      background: theme === 'sun'
                        ? 'linear-gradient(135deg, rgba(230, 245, 255, 0.95) 0%, rgba(186, 231, 255, 0.85) 100%)'
                        : undefined
                    }}
              allowClear
                />
            </div>
                </Card>
        </div>

        {/* Questions and Passages List */}
        <div className="questions-content">
          <LoadingWithEffect loading={loading} message={t('dailyChallenge.loadingQuestions') || 'Đang tải câu hỏi...'}>
            <div className="questions-list">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={
                    // For Listening and Speaking challenges, only sort/render passages (which already include their questions)
                    ((challengeDetails?.challengeType === 'LI' || challengeDetails?.challengeType === 'SP') && filteredPassages.length > 0)
                      ? [...passageIds]
                      : [...passageIds, ...questionIds]
                  }
                  strategy={verticalListSortingStrategy}
                >
                  {/* Render Passages first */}
                  {filteredPassages.map((passage, index) => (
                    <SortablePassageItem
                      key={passage.id}
                      passage={passage}
                      index={index}
                      onDeletePassage={handleDeletePassage}
                      onEditPassage={handleEditPassage}
                      onDuplicatePassage={handleDuplicatePassage}
                      onPointsChange={handlePassagePointsChange}
                      theme={theme}
                      t={t}
                      challengeType={challengeDetails?.challengeType}
                      activeDragDimensions={activeDragDimensions}
                    />
                  ))}

                  {/* Then render individual Questions (skip for LI and SP to group under passages) */}
                  {challengeDetails?.challengeType !== 'LI' && challengeDetails?.challengeType !== 'SP' && 
                   filteredQuestions.map((question, index) => (
                    <SortableQuestionItem
                      key={question.id}
                      question={question}
                      index={index + filteredPassages.length}
                      onDeleteQuestion={handleDeleteQuestion}
                      onEditQuestion={handleEditQuestion}
                      onDuplicateQuestion={handleDuplicateQuestion}
                      onPointsChange={handlePointsChange}
                      theme={theme}
                      t={t}
                      challengeType={challengeDetails?.challengeType}
                      activeDragDimensions={activeDragDimensions}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {filteredQuestions.length === 0 && filteredPassages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <Typography.Text>{t('dailyChallenge.noQuestions') || 'Chưa có câu hỏi nào'}</Typography.Text>
                </div>
              )}
            </div>
          </LoadingWithEffect>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Question Type Selection Modal */}
      <Modal
        title={
          <div style={{ 
            fontSize: '22px', 
            fontWeight: 700, 
            color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
            display: 'block', 
            textAlign: 'center',
            marginBottom: '4px'
          }}>
            {t('dailyChallenge.chooseQuestionType') || 'Choose a question type'}
          </div>
        }
        open={questionTypeModalVisible}
        onCancel={handleQuestionTypeModalCancel}
        footer={null}
        width={720}
        className={`gvc-question-type-modal ${theme}-question-type-modal`}
      >
        <div className="question-type-modal-container">
          {/* Question Types */}
          <div className="question-type-category">
            <div className="category-grid">
              {questionTypes.map((questionType) => (
                <div
                  key={questionType.id}
                  className={`question-type-card ${theme}-question-type-card`}
                  onClick={() => handleQuestionTypeClick(questionType)}
                >
                  <div className="question-type-icon-wrapper">
                    {questionType.type === "multiple-choice" && "📝"}
                    {questionType.type === "multiple-select" && "☑️"}
                    {questionType.type === "true-false" && "✅"}
                    {questionType.type === "fill-blank" && "✏️"}
                    {questionType.type === "dropdown" && "📋"}
                    {questionType.type === "drag-drop" && "🔄"}
                    {questionType.type === "reorder" && "🔀"}
                    {questionType.type === "rewrite" && "✍️"}
                  </div>
                  <div className="question-type-name">
                    {questionType.type === 'multiple-choice' && (t('dailyChallenge.multipleChoice') || 'Multiple Choice')}
                    {questionType.type === 'multiple-select' && (t('dailyChallenge.multipleSelect') || 'Multiple Select')}
                    {questionType.type === 'true-false' && (t('dailyChallenge.trueFalse') || 'True/False')}
                    {questionType.type === 'fill-blank' && (t('dailyChallenge.fillBlank') || 'Fill in the Blank')}
                    {questionType.type === 'dropdown' && (t('dailyChallenge.dropdown') || 'Dropdown')}
                    {questionType.type === 'drag-drop' && (t('dailyChallenge.dragDrop') || 'Drag and Drop')}
                    {questionType.type === 'reorder' && (t('dailyChallenge.rearrange') || 'Rearrange')}
                    {questionType.type === 'rewrite' && (t('dailyChallenge.rewrite') || 'Re-write')}
                  </div>
                  <div className="question-type-description">
                    {questionType.type === 'multiple-choice' && (t('dailyChallenge.multipleChoiceDesc') || 'Choose one correct answer')}
                    {questionType.type === 'multiple-select' && (t('dailyChallenge.multipleSelectDesc') || 'Select all correct answers')}
                    {questionType.type === 'true-false' && (t('dailyChallenge.trueFalseDesc') || 'Choose True or False')}
                    {questionType.type === 'fill-blank' && (t('dailyChallenge.fillBlankDesc') || 'Fill in the blank with the correct answer')}
                    {questionType.type === 'dropdown' && (t('dailyChallenge.dropdownDesc') || 'Select the correct answer from the dropdown menu')}
                    {questionType.type === 'drag-drop' && (t('dailyChallenge.dragDropDesc') || 'Drag and drop the correct word into each blank to complete the passage.')}
                    {questionType.type === 'reorder' && (t('dailyChallenge.rearrangeDesc') || 'Rearrange the words to make a correct sentence')}
                    {questionType.type === 'rewrite' && (t('dailyChallenge.rewriteDesc') || 'Rewrite the sentences as instructed')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Features */}
          <div className="question-type-category">
            <h3 className="category-title">{t('dailyChallenge.aiFeatures', { defaultValue: 'AI Features' })}</h3>
            <div className="category-grid">
              {/* AI Generate from Settings */}
              <div
                className={`question-type-card ${theme}-question-type-card question-type-card-featured`}
                onClick={handleGvAiGenerateFromSettings}
              >
                <div className="question-type-icon-wrapper featured-icon">
                  <img 
                    src="/img/ai-icon.png" 
                    alt="AI" 
                    style={{ width: '44px', height: '44px', filter: theme === 'sun' ? 'none' : 'brightness(0.9)' }} 
                  />
                </div>
                <div className="question-type-name">
                  {t('dailyChallenge.aiGenerateFromSettings') || 'AI Generate Question from Settings'}
                </div>
                <div className="question-type-description">
                  {t('dailyChallenge.aiGenerateFromSettingsDesc') || 'Generate questions automatically using challenge settings'}
                </div>
                <div className="featured-badge">✨ {t('dailyChallenge.aiPowered', { defaultValue: 'AI Powered' })}</div>
              </div>

              {/* AI Generate from File */}
              <div
                className={`question-type-card ${theme}-question-type-card question-type-card-featured`}
                onClick={handleGvAiGenerateFromFile}
              >
                <div className="question-type-icon-wrapper featured-icon">
                  <UploadOutlined style={{ fontSize: '32px' }} />
                </div>
                <div className="question-type-name">
                  {t('dailyChallenge.aiGenerateFromFile') || 'AI Generate Question from File'}
                </div>
                <div className="question-type-description">
                  {t('dailyChallenge.aiGenerateFromFileDesc') || 'Upload a file and let AI generate questions from it'}
                </div>
                <div className="featured-badge">✨ {t('dailyChallenge.aiPowered', { defaultValue: 'AI Powered' })}</div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* RE/LI Add Question Modal */}
      <Modal
        title={
          <div style={{ 
            fontSize: '22px', 
            fontWeight: 700, 
            color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
            display: 'block', 
            textAlign: 'center',
            marginBottom: '4px'
          }}>
            {t('dailyChallenge.addQuestion') || 'Add Question'}
          </div>
        }
        open={reLiAddQuestionModalVisible}
        onCancel={handleReLiAddQuestionModalCancel}
        footer={null}
        width={720}
        className={`gvc-question-type-modal ${theme}-question-type-modal`}
      >
        <div className="question-type-modal-container">
          {/* Manual Option */}
          <div className="question-type-category">
            <div className="category-grid">
              <div
                className={`question-type-card ${theme}-question-type-card`}
                onClick={handleReLiAddQuestionManual}
              >
                <div className="question-type-icon-wrapper">
                  <FileTextOutlined style={{ fontSize: '32px' }} />
                </div>
                <div className="question-type-name">
                  {t('dailyChallenge.addQuestionManual') || 'Add Question Manual'}
                </div>
                <div className="question-type-description">
                  {t('dailyChallenge.addQuestionManualDesc') || 'Create questions manually with full control over content and format'}
                </div>
              </div>
            </div>
          </div>

          {/* AI Features */}
          <div className="question-type-category">
            <h3 className="category-title">{t('dailyChallenge.aiFeatures', { defaultValue: 'AI Features' })}</h3>
            <div className="category-grid">
              {/* AI Generate from Settings */}
              <div
                className={`question-type-card ${theme}-question-type-card question-type-card-featured`}
                onClick={handleReLiAiGenerateFromSettings}
              >
                <div className="question-type-icon-wrapper featured-icon">
                  <img 
                    src="/img/ai-icon.png" 
                    alt="AI" 
                    style={{ width: '44px', height: '44px', filter: theme === 'sun' ? 'none' : 'brightness(0.9)' }} 
                  />
                </div>
                <div className="question-type-name">
                  {t('dailyChallenge.aiGenerateFromSettings') || 'AI Generate Question from Settings'}
                </div>
                <div className="question-type-description">
                  {t('dailyChallenge.aiGenerateFromSettingsDesc') || 'Generate questions automatically using challenge settings'}
                </div>
                <div className="featured-badge">✨ {t('dailyChallenge.aiPowered', { defaultValue: 'AI Powered' })}</div>
              </div>

              {/* AI Generate from File */}
              <div
                className={`question-type-card ${theme}-question-type-card question-type-card-featured`}
                onClick={handleReLiAiGenerateFromFile}
              >
                <div className="question-type-icon-wrapper featured-icon">
                  <UploadOutlined style={{ fontSize: '32px' }} />
                </div>
                <div className="question-type-name">
                  {t('dailyChallenge.aiGenerateFromFile') || 'AI Generate Question from File'}
                </div>
                <div className="question-type-description">
                  {t('dailyChallenge.aiGenerateFromFileDesc') || 'Upload a file and let AI generate questions from it'}
                </div>
                <div className="featured-badge">✨ {t('dailyChallenge.aiPowered', { defaultValue: 'AI Powered' })}</div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Question Modals */}
      <MultipleChoiceModal
        visible={modalVisible && currentModalType === "multiple-choice"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
        questionData={editingQuestion}
        saving={savingQuestion}
      />
      
      <MultipleSelectModal
        visible={modalVisible && currentModalType === "multiple-select"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
        questionData={editingQuestion}
        saving={savingQuestion}
      />
      
      <TrueFalseModal
        visible={modalVisible && currentModalType === "true-false"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
        questionData={editingQuestion}
        saving={savingQuestion}
      />
      
      <FillBlankModal
        visible={modalVisible && currentModalType === "fill-blank"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
        questionData={editingQuestion}
        saving={savingQuestion}
      />
      
      <DropdownModal
        visible={modalVisible && currentModalType === "dropdown"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
        questionData={editingQuestion}
        saving={savingQuestion}
      />
      
      <DragDropModal
        visible={modalVisible && currentModalType === "drag-drop"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
        questionData={editingQuestion}
        saving={savingQuestion}
      />
      
      <ReorderModal
        visible={modalVisible && currentModalType === "reorder"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
        questionData={editingQuestion}
        saving={savingQuestion}
      />
      
      <RewriteModal
        visible={modalVisible && currentModalType === "rewrite"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
        questionData={editingQuestion}
        saving={savingQuestion}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#1890ff',
            textAlign: 'center',
            padding: '10px 0'
          }}>
            {t('dailyChallenge.confirmDelete')}
          </div>
        }
        open={isDeleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteModalClose}
        okText={t('common.confirm')}
        cancelText="Cancel"
        width={500}
        centered
        bodyStyle={{
          padding: '30px 40px',
          fontSize: '16px',
          lineHeight: '1.6',
          textAlign: 'center'
        }}
        okButtonProps={{
          style: {
            backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
            background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
            borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
            color: theme === 'sun' ? '#000000' : '#ffffff',
            fontWeight: '500',
            height: '40px',
            borderRadius: '6px',
            padding: '0 30px'
          }
        }}
        cancelButtonProps={{
          style: {
            height: '40px',
            borderRadius: '6px',
            padding: '0 30px'
          }
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            fontSize: '48px',
            color: '#ff4d4f',
            marginBottom: '10px'
          }}>
            ⚠️
          </div>
          <p style={{
            fontSize: '18px',
            color: '#333',
            margin: 0,
            fontWeight: '500'
          }}>
            {t('dailyChallenge.confirmDeleteMessage')}
          </p>
          {deleteQuestion && (
            <p style={{
              fontSize: '20px',
              color: '#1890ff',
              margin: 0,
              fontWeight: '600'
            }}>
              <strong>{t('dailyChallenge.questionNumber', { number: deleteQuestion.questionNumber })}</strong>
            </p>
          )}
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        title={
          <div
            style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#000000',
              textAlign: 'center',
              padding: '10px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}>
            <DownloadOutlined style={{ color: '#000000' }} />
            {t('dailyChallenge.importQuestions') || 'Import Questions'}
          </div>
        }
        open={importModal.visible}
        onOk={handleImportOk}
        onCancel={handleImportCancel}
        okText={t('dailyChallenge.import') || 'Import'}
        cancelText="Cancel"
        width={600}
        centered
        confirmLoading={importModal.uploading}
        okButtonProps={{
          disabled: importModal.fileList.length === 0,
          style: {
            backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
            background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
            borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
            color: theme === 'sun' ? '#000000' : '#ffffff',
            height: '40px',
            fontSize: '16px',
            fontWeight: '500',
            minWidth: '120px',
          },
        }}
        cancelButtonProps={{
          style: {
            height: '40px',
            fontSize: '16px',
            fontWeight: '500',
            minWidth: '100px',
          },
        }}>
        <div style={{ padding: '20px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Button
              type="dashed"
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
              loading={templateDownloadLoading}
              disabled={templateDownloadLoading}
              style={{
                borderColor: '#1890ff',
                color: '#1890ff',
                height: '36px',
                fontSize: '14px',
                fontWeight: '500',
              }}>
              {t('dailyChallenge.downloadTemplate') || 'Download Template'}
            </Button>
          </div>

          <Typography.Title
            level={5}
            style={{
              textAlign: 'center',
              marginBottom: '20px',
              color: '#666',
            }}>
            {t('dailyChallenge.importInstructions') || 'Select an Excel file to import questions'}
          </Typography.Title>

          <Upload.Dragger
            name="file"
            multiple={false}
            beforeUpload={handleFileSelect}
            showUploadList={false}
            accept=".xlsx,.xls"
            style={{
              marginBottom: '20px',
              border: '2px dashed #d9d9d9',
              borderRadius: '8px',
              background: '#fafafa',
              padding: '40px',
              textAlign: 'center',
            }}>
            <p
              className='ant-upload-drag-icon'
              style={{ fontSize: '48px', color: '#1890ff' }}>
              <DownloadOutlined />
            </p>
            <p
              className='ant-upload-text'
              style={{ fontSize: '16px', fontWeight: '500' }}>
              {t('dailyChallenge.clickOrDragFile') || 'Click or drag file to this area to upload'}
            </p>
            <p className='ant-upload-hint' style={{ color: '#999' }}>
              {t('dailyChallenge.supportedFormats') || 'Supported formats'}: Excel (.xlsx, .xls)
            </p>
          </Upload.Dragger>

          <Divider />

          {importModal.fileList.length > 0 && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <div>
                <Typography.Text style={{ color: '#1890ff', fontWeight: '500' }}>
                  ✅ {t('dailyChallenge.fileSelected') || 'File selected'}:{' '}
                  {importModal.fileList[0].name}
                </Typography.Text>
                <br />
                <Typography.Text style={{ color: '#666', fontSize: '12px' }}>
                  Size: {importModal.fileList[0].size < 1024 * 1024 
                    ? `${(importModal.fileList[0].size / 1024).toFixed(1)} KB`
                    : `${(importModal.fileList[0].size / 1024 / 1024).toFixed(2)} MB`
                  }
                </Typography.Text>
              </div>
              <Button
                type="text"
                size="small"
                onClick={() => setImportModal(prev => ({ ...prev, fileList: [] }))}
                style={{ color: '#ff4d4f' }}>
                {t('common.delete') || 'Remove'}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Challenge Settings Modal */}
      <ChallengeSettingsModal
        visible={settingsModalVisible}
        onCancel={handleCloseSettings}
        onSave={handleSaveSettings}
        challengeId={id}
        initialValues={{
          challengeName: challengeDetails?.challengeName,
          description: challengeDetails?.description,
          challengeType: challengeDetails?.challengeType,
          challengeMode,
          durationMinutes,
          startDate,
          endDate,
          shuffleQuestion: shuffleQuestion,
          shuffleAnswers: shuffleQuestion, // Keep for backward compatibility
          translateOnScreen,
          antiCheatModeEnabled,
        }}
      />

      {/* Publish Confirmation Modal */}
      <Modal
        title={
          <div style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: theme === 'sun' ? 'rgb(113, 179, 253)' : 'rgb(138, 122, 255)',
            textAlign: 'center',
            padding: '10px 0'
          }}>
            {t('dailyChallenge.confirmPublishChallenge') || 'Confirm publish challenge'}
          </div>
        }
        open={publishConfirmModalVisible}
        onOk={handlePublishConfirmOk}
        onCancel={handlePublishConfirmCancel}
        okText={t('dailyChallenge.publishNow') || 'Publish now'}
        cancelText={t('common.cancel') || 'Cancel'}
        width={600}
        centered
        okButtonProps={{
          style: {
            backgroundColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
            background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, rgb(90, 31, 184) 0%, rgb(138, 122, 255) 100%)',
            borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : 'transparent',
            color: theme === 'sun' ? '#000000' : '#ffffff',
            fontWeight: '500',
            height: '40px',
            borderRadius: '6px',
            padding: '0 30px'
          }
        }}
        cancelButtonProps={{
          style: {
            height: '40px',
            borderRadius: '6px',
            padding: '0 30px'
          }
        }}
      >
        <div style={{ padding: '8px 4px' }}>
          <Typography.Paragraph style={{ marginBottom: 12, textAlign: 'center' }}>
            {t('dailyChallenge.publishWarning') || 'You are about to publish this challenge. Please verify the following settings:'}
          </Typography.Paragraph>
          
          {/* Challenge Configuration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Card size="small" style={{ background: theme === 'sun' ? '#fafafa' : 'rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Text strong>{t('dailyChallenge.mode') || 'Challenge Mode'}</Typography.Text>
                <span style={{ 
                  color: challengeMode === 'exam' ? '#ff4d4f' : '#52c41a',
                  fontSize: '13px'
                }}>
                  {challengeMode === 'exam' 
                    ? t('dailyChallenge.examMode') || 'Exam Mode'
                    : t('dailyChallenge.normalMode') || 'Normal Mode'}
                </span>
              </div>
            </Card>
            <Card size="small" style={{ background: theme === 'sun' ? '#fafafa' : 'rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Text strong>{t('dailyChallenge.duration') || 'Duration'}</Typography.Text>
                <span style={{  fontSize: '13px', color: theme === 'sun' ? '#333' : '#000000' }}>
                  {durationMinutes 
                    ? `${durationMinutes} ${t('dailyChallenge.minutes') || 'minutes'}`
                    : t('common.notSet') || 'Not Set'}
                </span>
              </div>
            </Card>
            <Card size="small" style={{ background: theme === 'sun' ? '#fafafa' : 'rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Text strong>{t('dailyChallenge.startDate') || 'Start Date'}</Typography.Text>
                <span style={{  fontSize: '13px', color: theme === 'sun' ? '#333' : '#000000' }}>
                  {startDate 
                    ? new Date(startDate).toLocaleDateString('vi-VN', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : t('common.notSet') || 'Not Set'}
                </span>
              </div>
            </Card>
            <Card size="small" style={{ background: theme === 'sun' ? '#fafafa' : 'rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Text strong>{t('dailyChallenge.endDate') || 'End Date'}</Typography.Text>
                <span style={{ fontSize: '13px', color: theme === 'sun' ? '#333' : '#000000' }}>
                  {endDate 
                    ? new Date(endDate).toLocaleDateString('vi-VN', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : t('common.notSet') || 'Not Set'}
                </span>
              </div>
            </Card>
          </div>

          {/* Settings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Card size="small" style={{ background: theme === 'sun' ? '#fafafa' : 'rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Text strong>{sentenceCase(t('dailyChallenge.shuffleQuestion') || t('dailyChallenge.shuffleAnswers') || 'Shuffle questions')}</Typography.Text>
                <span style={{color: shuffleQuestion ? '#52c41a' : '#ff4d4f' }}>
                  {shuffleQuestion ? sentenceCase(t('common.on') || 'ON') : sentenceCase(t('common.off') || 'OFF')}
                </span>
              </div>
            </Card>
            <Card size="small" style={{ background: theme === 'sun' ? '#fafafa' : 'rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Text strong>{sentenceCase(t('dailyChallenge.antiCheatMode') || 'Anti-cheat mode')}</Typography.Text>
                <span style={{color: antiCheatModeEnabled ? '#52c41a' : '#ff4d4f' }}>
                  {antiCheatModeEnabled ? sentenceCase(t('common.on') || 'ON') : sentenceCase(t('common.off') || 'OFF')}
                </span>
              </div>
            </Card>
            <Card size="small" style={{ gridColumn: '1 / span 2', background: theme === 'sun' ? '#fafafa' : 'rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Text strong>{sentenceCase(t('dailyChallenge.translateOnScreen') || 'Translate on screen')}</Typography.Text>
                <span style={{ color: translateOnScreen ? '#52c41a' : '#ff4d4f' }}>
                  {translateOnScreen ? sentenceCase(t('common.on') || 'ON') : sentenceCase(t('common.off') || 'OFF')}
                </span>
              </div>
            </Card>
          </div>

          <Typography.Paragraph style={{ marginTop: 12, textAlign: 'center', fontStyle: 'italic' }}>
            {t('dailyChallenge.publishWarningMessage') || 'Once published, students will be able to access this challenge. This action cannot be undone.'}
          </Typography.Paragraph>
        </div>
      </Modal>
    </ThemedLayout>
  );
};

export default DailyChallengeContent;

