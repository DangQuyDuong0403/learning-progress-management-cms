import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  Button,
  Input,
  Space,
  Select,
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
  ImportOutlined,
  ExportOutlined,
  DownloadOutlined,
  ArrowLeftOutlined,
  DownOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
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

// Sortable Question Item Component
const SortableQuestionItem = memo(
  ({ question, index, onDeleteQuestion, onEditQuestion, onDuplicateQuestion, onPointsChange, theme, t }) => {
    const animateLayoutChanges = useCallback((args) => {
      const { isSorting, wasDragging } = args;
      if (isSorting || wasDragging) {
        return defaultAnimateLayoutChanges(args);
      }
      return true;
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

    const style = useMemo(
      () => ({
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        transition: transition || undefined,
        opacity: isDragging ? 0.5 : 1,
        willChange: 'transform',
      }),
      [transform, transition, isDragging]
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

    const handlePointChange = useCallback((value) => {
      onPointsChange(question.id, value);
    }, [question.id, onPointsChange]);

    // Helper function to render Fill in the Blank question
    const renderFillBlankQuestion = useCallback(() => {
      if (question.type !== 'fill-blank' || !question.questionText) {
        return null;
      }

      // Parse questionText and replace [[pos_xxx]] with (a)____, (b)____, etc.
      let displayText = question.questionText;
      const answerChoices = [];
      
      if (question.content && question.content.data) {
        question.content.data.forEach((item, idx) => {
          const letter = String.fromCharCode(97 + idx); // a, b, c, d...
          const pattern = `[[pos_${item.positionId}]]`;
          
          // Replace pattern with (a)____ format
          displayText = displayText.replace(
            pattern,
            `<span style="color: #1890ff; font-weight: 600;">(${letter})</span><span style="text-decoration: underline; padding: 0 2px;">____</span>`
          );
          
          // Add to answer choices
          answerChoices.push({
            letter: letter,
            value: item.value
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

          {/* Answer Choices - No header, just show answers */}
          {answerChoices.length > 0 && (
            <div style={{ 
              marginTop: '16px',
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
                    background: 'rgba(24, 144, 255, 0.08)',
                    border: '2px solid rgba(24, 144, 255, 0.3)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  <span style={{ 
                    fontWeight: 700, 
                    color: '#1890ff',
                    fontSize: '15px'
                  }}>
                    ({choice.letter})
                  </span>
                  <span style={{ color: '#333' }}>
                    {choice.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      );
    }, [question]);

    // Get question type label
    const getQuestionTypeLabel = useCallback(() => {
      switch(question.type) {
        case 'multiple-choice':
          return t('dailyChallenge.multipleChoice') || 'Multiple Choice';
        case 'multiple-select':
          return t('dailyChallenge.multipleSelect') || 'Multiple Select';
        case 'true-false':
          return t('dailyChallenge.trueFalse') || 'True/False';
        case 'fill-blank':
          return t('dailyChallenge.fillBlank') || 'Fill in the Blank';
        case 'dropdown':
          return 'Dropdown';
        case 'drag-drop':
          return 'Drag and Drop';
        case 'reorder':
          return 'Reorder';
        case 'rewrite':
          return 'Re-write';
        default:
          return t('dailyChallenge.multipleChoice') || 'Multiple Choice';
      }
    }, [question.type, t]);

    return (
      <div
        ref={setNodeRef}
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
            <Typography.Text strong>{index + 1}. {getQuestionTypeLabel()}</Typography.Text>
          </div>
          <div className="question-controls">
            <Select
              value={question.points}
              onChange={handlePointChange}
              style={{ width: 100 }}
              size="small"
            >
              <Select.Option value={1}>1 {t('dailyChallenge.point') || 'điểm'}</Select.Option>
              <Select.Option value={2}>2 {t('dailyChallenge.point') || 'điểm'}</Select.Option>
              <Select.Option value={3}>3 {t('dailyChallenge.point') || 'điểm'}</Select.Option>
              <Select.Option value={5}>5 {t('dailyChallenge.point') || 'điểm'}</Select.Option>
            </Select>
            <Space size="small">
              <Tooltip title={t('common.edit') || 'Chỉnh sửa'}>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                  size="small"
                />
              </Tooltip>
              <Tooltip title={t('common.delete') || 'Xóa'}>
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  size="small"
                  danger
                />
              </Tooltip>
              <Tooltip title={t('common.duplicate') || 'Nhân bản'}>
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
          {question.type === 'fill-blank' ? (
            renderFillBlankQuestion()
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

              <div className="question-options">
                {question.options && question.options.map((option) => (
                  <div 
                    key={option.key} 
                    className={`option-item ${option.isCorrect ? 'correct-answer' : ''}`}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}
                  >
                    <span className="option-key" style={{ flexShrink: 0 }}>{option.key}.</span>
                    <div 
                      style={{ flex: 1 }}
                      dangerouslySetInnerHTML={{ __html: option.text }} 
                    />
                  </div>
                ))}
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
      prevProps.question.points === nextProps.question.points &&
      prevProps.theme === nextProps.theme &&
      prevProps.index === nextProps.index &&
      prevProps.onDeleteQuestion === nextProps.onDeleteQuestion &&
      prevProps.onEditQuestion === nextProps.onEditQuestion &&
      prevProps.onDuplicateQuestion === nextProps.onDuplicateQuestion &&
      prevProps.onPointsChange === nextProps.onPointsChange
    );
  }
);

SortableQuestionItem.displayName = 'SortableQuestionItem';

// Question types constant
const questionTypes = [
  { id: 1, name: "Multiple choice", type: "multiple-choice" },
  { id: 2, name: "Multiple select", type: "multiple-select" },
  { id: 3, name: "True or false", type: "true-false" },
  { id: 4, name: "Fill in the blank", type: "fill-blank" },
  { id: 5, name: "Dropdown", type: "dropdown" },
  { id: 6, name: "Drag and drop", type: "drag-drop" },
  { id: 7, name: "Reorder", type: "reorder" },
  { id: 8, name: "Re-write", type: "rewrite" },
];

const DailyChallengeContent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { id } = useParams();
  const { enterDailyChallengeMenu, exitDailyChallengeMenu, updateChallengeCount } = useDailyChallengeMenu();
  
  // Set page title
  usePageTitle('Daily Challenge Management / Content');
  
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [searchText, setSearchText] = useState("");
  
  // Challenge Details states
  const [challengeDetails, setChallengeDetails] = useState(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  
  // Challenge Settings states
  const [challengeMode, setChallengeMode] = useState('normal'); // normal, exam
  const [durationMinutes, setDurationMinutes] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [shuffleAnswers, setShuffleAnswers] = useState(false);
  const [translateOnScreen, setTranslateOnScreen] = useState(false);
  const [aiFeedbackEnabled, setAiFeedbackEnabled] = useState(false);
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

  // Loading states for buttons
  const [templateDownloadLoading, setTemplateDownloadLoading] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false); // Loading state for saving question

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 0,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        setShuffleAnswers(challengeData.shuffleAnswers || false);
        setTranslateOnScreen(challengeData.translateOnScreen || false);
        setAiFeedbackEnabled(challengeData.aiFeedbackEnabled || false);
        setAntiCheatModeEnabled(challengeData.hasAntiCheat || false);
        
        // Set challenge mode based on challengeType or other logic
        setChallengeMode('normal'); // Default to normal mode
        
        // Set status based on challengeStatus
        setStatus(challengeData.challengeStatus === 'PUBLISHED' ? 'published' : 'draft');
        
        console.log('Challenge details loaded:', challengeData);
      }
      
      setChallengeLoading(false);
    } catch (error) {
      console.error('Error fetching challenge details:', error);
      spaceToast.error(error.response?.data?.message || 'Failed to load challenge details');
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
        const apiQuestions = response.data;
        
        // Map API data to question format
        const mappedQuestions = apiQuestions.map((item, index) => {
          // Get section info
          const section = item.section || {};
          
          // Get questions from this section
          const questionsList = item.questions || [];
          
          // Map each question
          return questionsList.map((question, qIndex) => {
            // Get question content - parse from content.data array
            const contentData = question.content?.data || [];
            const options = contentData.map((contentItem, idx) => ({
              key: String.fromCharCode(65 + idx), // A, B, C, D...
              text: contentItem.value || '',
              isCorrect: contentItem.correct || false,
            }));

            return {
              id: question.id || `${section.id}-${qIndex}`,
              type: question.questionType ,
              question: question.questionText || '',
              options: options,
              points: question.score || 1,
              timeLimit: 1,
              sectionId: section.id,
              sectionTitle: section.sectionTitle,
              orderNumber: question.orderNumber || qIndex + 1,
            };
          });
        }).flat(); // Flatten the array to get all questions

        console.log('Mapped Questions:', mappedQuestions);

        if (mappedQuestions.length > 0) {
          setQuestions(mappedQuestions);
        } else {
          // If no questions, set empty array
          setQuestions([]);
        }
      } else {
        // If API response is unexpected, set empty array
        setQuestions([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      spaceToast.error(error.response?.data?.message);
      
      // On error, set empty array
      setQuestions([]);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchChallengeDetails();
    fetchQuestions();
  }, [fetchChallengeDetails, fetchQuestions]);

  // Enter/exit daily challenge menu mode
  useEffect(() => {
    // Back to Performance page (detail page)
    enterDailyChallengeMenu(questions.length, null, `/teacher/daily-challenges/detail/${id}`);
    
    return () => {
      exitDailyChallengeMenu();
    };
  }, [enterDailyChallengeMenu, exitDailyChallengeMenu, questions.length, id]);

  // Update challenge count when questions change
  useEffect(() => {
    const filteredCount = questions.filter((question) => {
      const matchesSearch =
        searchText === "" ||
        question.question.toLowerCase().includes(searchText.toLowerCase());
      return matchesSearch;
    }).length;
    
    updateChallengeCount(filteredCount);
  }, [questions, searchText, updateChallengeCount]);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleAddQuestion = useCallback(() => {
    setQuestionTypeModalVisible(true);
  }, []);

  const handleQuestionTypeClick = useCallback((questionType) => {
    setCurrentModalType(questionType.type);
    setModalVisible(true);
    setQuestionTypeModalVisible(false);
  }, []);

  const handleModalSave = useCallback(async (questionData) => {
    try {
      if (editingQuestion) {
        // Update existing question - chỉ update local state, chưa gọi API update
        setQuestions(prev => prev.map(q => 
          q.id === editingQuestion.id ? { ...questionData, id: editingQuestion.id } : q
        ));
        spaceToast.success(`${questionData.title} question updated successfully!`);
        
        // Close modal immediately for edit mode
        setModalVisible(false);
        setCurrentModalType(null);
        setEditingQuestion(null);
      } else {
        // Add new question - Gọi API để lưu vào database ngay
        setSavingQuestion(true);
        
        // Close modal immediately to show loading on the list
        setModalVisible(false);
        
        // Transform question to API format based on question type
        let apiQuestion;
        
        if (questionData.type === 'FILL_BLANK' || questionData.type === 'FILL_BLANK') {
          // Fill in the blank question
          apiQuestion = {
            questionText: questionData.questionText || questionData.question,
            orderNumber: 1, // Always use 1 for resourceType NONE
            score: questionData.points || 0.5,
            questionType: 'FILLBLANK',
            content: {
              data: questionData.content?.data || []
            }
          };
        } else if (questionData.type === 'TRUE_OR_FALSE') {
          // True/False question
          apiQuestion = {
            questionText: questionData.question,
            orderNumber: 1, // Always use 1 for resourceType NONE
            score: questionData.points || 0.5,
            questionType: 'TRUE_OR_FALSE',
            content: {
              data: questionData.options ? questionData.options.map((option, optIndex) => ({
                id: `opt${optIndex + 1}`,
                value: option.text,
                positionOrder: optIndex + 1,
                correct: option.isCorrect || false
              })) : []
            }
          };
        } else {
          // Multiple choice, Multiple select, or other types
          apiQuestion = {
            questionText: questionData.question,
            orderNumber: 1, // Always use 1 for resourceType NONE
            score: questionData.points || 0.5,
            questionType: questionData.type ? questionData.type.toUpperCase().replace(/-/g, '_') : 'MULTIPLE_CHOICE',
            content: {
              data: questionData.options ? questionData.options.map((option, optIndex) => ({
                id: option.key ? `opt${optIndex + 1}` : `opt${optIndex + 1}`,
                value: option.text,
                positionOrder: optIndex + 1,
                correct: option.isCorrect || false
              })) : []
            }
          };
        }

        // Create section data with single question
        const sectionData = {
          section: {
            sectionsContent: 'Choose one correct answer.',
            resourceType: 'NONE'
          },
          questions: [apiQuestion]
        };

        console.log('Saving new question to API:', sectionData);

        // Call API to save the question
        const response = await dailyChallengeApi.saveSectionWithQuestions(id, sectionData);
        
        // Refresh questions from API to get the saved question with ID
        await fetchQuestions();
        
        spaceToast.success(response.message);
        
        // Reset modal states
        setCurrentModalType(null);
        setEditingQuestion(null);
      }
    } catch (error) {
      console.error('Error saving question:', error);
      spaceToast.error(error.response?.data?.error || error.message || 'Failed to save question');
      
      // Reset modal states even on error
      setModalVisible(false);
      setCurrentModalType(null);
      setEditingQuestion(null);
    } finally {
      // Always reset loading state
      setSavingQuestion(false);
    }
  }, [editingQuestion, id, fetchQuestions]);

  const handleModalCancel = useCallback(() => {
    setModalVisible(false);
    setCurrentModalType(null);
    setEditingQuestion(null);
  }, []);

  const handleQuestionTypeModalCancel = useCallback(() => {
    setQuestionTypeModalVisible(false);
  }, []);

  const handleEditQuestion = useCallback((questionId) => {
    setQuestions(prev => {
      const question = prev.find(q => q.id === questionId);
      if (question) {
        setEditingQuestion(question);
        setCurrentModalType(question.type);
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

  const handleSaveChanges = useCallback(async (saveAsStatus) => {
    // Check if there are any visible questions (not deleted)
    const visibleQuestions = questions.filter(q => !q.toBeDeleted);
    
    if (visibleQuestions.length === 0) {
      spaceToast.warning('Please add at least one question before saving');
      return;
    }

    try {
      setLoading(true);

      // Prepare bulk update data based on visible questions order
      // Use sectionId instead of question id
      const bulkUpdateData = visibleQuestions
        .filter(question => question.sectionId !== undefined && question.sectionId !== null) // Only include questions with sectionId
        .map((question, index) => {
          return {
            id: question.sectionId, // Use sectionId for bulk update
            orderNumber: index + 1,
            toBeDeleted: question.toBeDeleted || false
          };
        });

      console.log('Bulk update sections data:', {
        count: bulkUpdateData.length,
        sections: bulkUpdateData
      });

      // Step 1: Call bulk update API to save/reorder sections
      const bulkResponse = await dailyChallengeApi.bulkUpdateSections(id, bulkUpdateData);
      console.log('Bulk update response:', bulkResponse);

      // Step 2: Update challenge status if saveAsStatus is provided
      if (saveAsStatus) {
        // Convert saveAsStatus to API format (DRAFT or PUBLISHED)
        const challengeStatus = saveAsStatus === 'published' ? 'PUBLISHED' : 'DRAFT';
        
        console.log('Updating challenge status:', challengeStatus);
        
        // Call API to update challenge status
        await dailyChallengeApi.updateDailyChallengeStatus(id, challengeStatus);
        
        // Update local status
        setStatus(saveAsStatus);
        
        spaceToast.success(
          saveAsStatus === 'published' 
            ? t('dailyChallenge.savedAsPublished') || 'Saved and published successfully!'
            : t('dailyChallenge.savedAsDraft') || 'Saved as draft successfully!'
        );
      } else {
        spaceToast.success('Changes saved successfully!');
      }

      // Refresh questions from API to get updated data
      await fetchQuestions();

    } catch (error) {
      console.error('Error saving changes:', error);
      spaceToast.error(error.response?.data?.error || error.message || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  }, [id, questions, t, fetchQuestions]);

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
    setShuffleAnswers(settingsData.shuffleAnswers);
    setTranslateOnScreen(settingsData.translateOnScreen);
    setAiFeedbackEnabled(settingsData.aiFeedbackEnabled);
    setAntiCheatModeEnabled(settingsData.antiCheatModeEnabled);
    setSettingsModalVisible(false);
  }, []);

  const handleImportData = useCallback(() => {
    setImportModal({
      visible: true,
      fileList: [],
      uploading: false
    });
  }, []);

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

  const handleExportData = useCallback(() => {
    spaceToast.info('Export data feature will be implemented');
  }, []);

  const handleDuplicateQuestion = useCallback((questionId) => {
    setQuestions(prev => {
      const questionToDuplicate = prev.find(q => q.id === questionId);
    if (questionToDuplicate) {
      const newQuestion = {
        ...questionToDuplicate,
          id: Math.max(...prev.map(q => q.id)) + 1,
        question: `${questionToDuplicate.question} (Copy)`,
      };
        return [...prev, newQuestion];
    }
      return prev;
    });
  }, []);

  const handlePointsChange = useCallback((questionId, value) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, points: value } : q
    ));
  }, []);

  const handleDragStart = useCallback(() => {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('is-dragging');
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

    if (active.id !== over?.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return items;

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update orderNumber based on visible items (not deleted)
        const visibleItems = newItems.filter(q => !q.toBeDeleted);
        return newItems.map((question) => {
          if (question.toBeDeleted) {
            return question; // Keep deleted items as-is
          }
          
          // Update orderNumber based on visible items order
          const visibleIndex = visibleItems.findIndex(item => item.id === question.id);
          return {
            ...question,
            orderNumber: visibleIndex + 1,
          };
        });
      });
    }
  }, []);

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

  const questionIds = useMemo(() => 
    filteredQuestions.map((question) => question.id), 
    [filteredQuestions]
  );

  // Handle back button click
  const handleBackToDailyChallenges = () => {
    navigate('/teacher/daily-challenges/detail/' + id);
  };

  // Import/Export dropdown menu items
  const importExportMenuItems = [
    {
      key: 'import',
      label: <span style={{ color: '#000000' }}>{t('common.import')}</span>,
      icon: <ImportOutlined style={{ color: '#000000' }} />,
      onClick: handleImportData,
    },
    {
      key: 'export',
      label: <span style={{ color: '#000000' }}>{t('common.export')}</span>,
      icon: <ExportOutlined style={{ color: '#000000' }} />,
      onClick: handleExportData,
    },
  ];

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
              <span>{t('dailyChallenge.dailyChallengeManagement')} / {t('dailyChallenge.content')}</span>
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
                : 'rgba(250, 173, 20, 0.1)',
              border: status === 'published'
                ? '2px solid rgba(82, 196, 26, 0.3)'
                : '2px solid rgba(250, 173, 20, 0.3)',
            }}>
              {status === 'published' ? (
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
              ) : (
                <FileTextOutlined style={{ color: '#faad14', fontSize: '18px' }} />
              )}
              <span style={{
                fontWeight: 600,
                fontSize: '14px',
                color: status === 'published' ? '#52c41a' : '#faad14'
              }}>
                {status === 'published' ? t('dailyChallenge.published') : t('dailyChallenge.draft')}
              </span>
            </div>

            {/* Import/Export Dropdown */}
            <Dropdown
              menu={{ items: importExportMenuItems }}
              trigger={['click']}
            >
              <Button 
                icon={<DownloadOutlined />}
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
                    ? 'linear-gradient(135deg, rgba(102, 174, 255, 0.6), rgba(60, 153, 255, 0.6))'
                    : 'linear-gradient(135deg, rgba(181, 176, 192, 0.7), rgba(163, 158, 187, 0.7), rgba(131, 119, 160, 0.7), rgba(172, 165, 192, 0.7), rgba(109, 95, 143, 0.7))',
                  color: theme === 'sun' ? '#000000' : '#000000',
                  boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.2)' : '0 2px 8px rgba(131, 119, 160, 0.3)',
                  opacity: 0.9
                }}
              >
                {t('dailyChallenge.importExport')} <DownOutlined />
            </Button>
            </Dropdown>

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
                border: 'none',
                transition: 'all 0.3s ease',
                background: theme === 'sun' 
                  ? 'linear-gradient(135deg, rgba(102, 174, 255, 0.6), rgba(60, 153, 255, 0.6))'
                  : 'linear-gradient(135deg, rgba(181, 176, 192, 0.7), rgba(163, 158, 187, 0.7), rgba(131, 119, 160, 0.7), rgba(172, 165, 192, 0.7), rgba(109, 95, 143, 0.7))',
                color: theme === 'sun' ? '#000000' : '#000000',
                boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.2)' : '0 2px 8px rgba(131, 119, 160, 0.3)',
                opacity: 0.9
              }}
            >
              {t('dailyChallenge.addQuestion')}
            </Button>
            
            {/* Save Dropdown - Save as Draft or Published */}
            <Dropdown
              menu={{ 
                items: [
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
                    onClick: () => handleSaveChanges('published'),
                  },
                ]
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
                {t('common.save') || 'Save'} <DownOutlined />
              </Button>
            </Dropdown>
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
                    <Typography.Title level={5} style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px', fontWeight: 600, textAlign: 'center' }}>
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
                    <Typography.Title level={5} style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px', fontWeight: 600, textAlign: 'center' }}>
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
                        <Typography.Text strong style={{ fontSize: '14px' }}>
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
                    <Typography.Title level={5} style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px', fontWeight: 600, textAlign: 'center' }}>
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

                      {/* AI Feedback */}
                      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography.Text style={{ fontSize: '13px' }}>
                          {t('dailyChallenge.aiFeedback')}
                                  </Typography.Text>
                        <Typography.Text strong style={{ 
                          fontSize: '13px',
                          color: aiFeedbackEnabled ? '#52c41a' : '#d9d9d9'
                        }}>
                          {aiFeedbackEnabled ? '✓ ON' : '✗ OFF'}
                                </Typography.Text>
                            </div>

                      {/* Shuffle Answers */}
                      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography.Text style={{ fontSize: '13px' }}>
                          {t('dailyChallenge.shuffleAnswers')}
                                  </Typography.Text>
                        <Typography.Text strong style={{ 
                          fontSize: '13px',
                          color: shuffleAnswers ? '#52c41a' : '#d9d9d9'
                        }}>
                          {shuffleAnswers ? '✓ ON' : '✗ OFF'}
                                  </Typography.Text>
                            </div>

                      {/* Anti-Cheat Mode */}
                      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography.Text style={{ fontSize: '13px' }}>
                          🔒 {t('dailyChallenge.antiCheatMode')}
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
                </Card>
        </div>

        {/* Questions List */}
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
                  items={questionIds}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredQuestions.map((question, index) => (
                    <SortableQuestionItem
                      key={question.id}
                      question={question}
                      index={index}
                      onDeleteQuestion={handleDeleteQuestion}
                      onEditQuestion={handleEditQuestion}
                      onDuplicateQuestion={handleDuplicateQuestion}
                      onPointsChange={handlePointsChange}
                      theme={theme}
                      t={t}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {filteredQuestions.length === 0 && (
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
        title="Chọn loại câu hỏi"
        open={questionTypeModalVisible}
        onCancel={handleQuestionTypeModalCancel}
        footer={null}
        width={800}
        className="gvc-question-type-modal"
      >
        <div className="gvc-question-types-grid">
          {questionTypes.map((questionType) => (
            <div
              key={questionType.id}
              className="gvc-question-type-card"
              onClick={() => handleQuestionTypeClick(questionType)}
            >
              <div className="gvc-question-type-icon">
                {questionType.type === "multiple-choice" && "📝"}
                {questionType.type === "multiple-select" && "☑️"}
                {questionType.type === "true-false" && "✅"}
                {questionType.type === "fill-blank" && "✏️"}
                {questionType.type === "dropdown" && "📋"}
                {questionType.type === "drag-drop" && "🔄"}
                {questionType.type === "reorder" && "🔀"}
                {questionType.type === "rewrite" && "✍️"}
              </div>
              <div className="gvc-question-type-name">{questionType.name}</div>
              <div className="gvc-question-type-description">
                {questionType.type === "multiple-choice" && "Chọn một đáp án đúng"}
                {questionType.type === "multiple-select" && "Chọn nhiều đáp án đúng"}
                {questionType.type === "true-false" && "Đúng hoặc Sai"}
                {questionType.type === "fill-blank" && "Điền vào chỗ trống"}
                {questionType.type === "dropdown" && "Chọn từ danh sách"}
                {questionType.type === "drag-drop" && "Kéo thả để sắp xếp"}
                {questionType.type === "reorder" && "Sắp xếp lại thứ tự"}
                {questionType.type === "rewrite" && "Viết lại câu"}
              </div>
            </div>
          ))}
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
        cancelText={t('common.cancel')}
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
        cancelText={t('common.cancel')}
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
          shuffleAnswers,
          translateOnScreen,
          aiFeedbackEnabled,
          antiCheatModeEnabled,
        }}
      />
    </ThemedLayout>
  );
};

export default DailyChallengeContent;

