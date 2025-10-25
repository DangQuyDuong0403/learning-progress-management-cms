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

// Helper function to get question type label
const getQuestionTypeLabel = (questionType, t) => {
  const typeMap = {
    'multiple-choice': t('dailyChallenge.multipleChoice') || 'Multiple Choice',
    'multiple-select': t('dailyChallenge.multipleSelect') || 'Multiple Select',
    'true-false': t('dailyChallenge.trueFalse') || 'True/False',
    'fill-blank': t('dailyChallenge.fillBlank') || 'Fill in the Blank',
    'dropdown': t('dailyChallenge.dropdown') || 'Dropdown',
    'drag-drop': t('dailyChallenge.dragDrop') || 'Drag and Drop',
    'reorder': t('dailyChallenge.reorder') || 'Reorder',
    'rewrite': t('dailyChallenge.rewrite') || 'Rewrite',
  };
  
  return typeMap[questionType] || questionType || 'Question';
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
            <Typography.Text strong>{index + 1}. {getQuestionTypeLabel(question.type, t)}</Typography.Text>
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
          <Typography.Paragraph style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 500 }}>
            {question.question}
          </Typography.Paragraph>

          <div className="question-options">
            {question.options.map((option) => (
              <div 
                key={option.key} 
                className={`option-item ${option.isCorrect ? 'correct-answer' : ''}`}
              >
                <Typography.Text>
                  <span className="option-key">{option.key}.</span> {option.text}
                </Typography.Text>
              </div>
            ))}
          </div>
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
              type: question.questionType || 'multiple-choice',
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
  }, [id, t]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

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

  const handleModalSave = useCallback((questionData) => {
    if (editingQuestion) {
      // Update existing question
      setQuestions(prev => prev.map(q => 
        q.id === editingQuestion.id ? { ...questionData, id: editingQuestion.id } : q
      ));
      spaceToast.success(`${questionData.title} question updated successfully!`);
    } else {
      // Add new question
      setQuestions(prev => [...prev, questionData]);
      spaceToast.success(`${questionData.title} question added successfully!`);
    }
    setModalVisible(false);
    setCurrentModalType(null);
    setEditingQuestion(null);
  }, [editingQuestion]);

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
      // Update local state - remove question
      setQuestions(prev => prev.filter(q => q.id !== deleteQuestion.id));
      
      spaceToast.success('Question deleted successfully!');
      
      setIsDeleteModalVisible(false);
      setDeleteQuestion(null);
    } catch (error) {
      console.error('Error deleting question:', error);
      spaceToast.error('Failed to delete question');
    }
  }, [deleteQuestion]);

  const handleDeleteModalClose = useCallback(() => {
    setIsDeleteModalVisible(false);
    setDeleteQuestion(null);
  }, []);

  const handleSaveChanges = useCallback(() => {
    spaceToast.success('Changes saved successfully!');
  }, []);

  const handleToggleStatus = useCallback(() => {
    const newStatus = status === 'draft' ? 'published' : 'draft';
    setStatus(newStatus);
    spaceToast.success(
      newStatus === 'published' 
        ? t('dailyChallenge.publishedSuccess') || 'Challenge published successfully!'
        : t('dailyChallenge.draftSuccess') || 'Changed to draft successfully!'
    );
  }, [status, t]);

  const handleOpenSettings = useCallback(() => {
    setSettingsModalVisible(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setSettingsModalVisible(false);
  }, []);

  const handleSaveSettings = useCallback((settingsData) => {
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

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
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

            {/* Status Toggle Button */}
            <Button 
              icon={status === 'published' ? <CheckCircleOutlined /> : <FileTextOutlined />}
              className={`create-button ${theme}-create-button`}
              onClick={handleToggleStatus}
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
              {status === 'published' ? t('dailyChallenge.published') : t('dailyChallenge.draft')}
            </Button>

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
            
            {/* Save Changes - Keep original bright color */}
            <Button 
              icon={<SaveOutlined />}
              className={`create-button ${theme}-create-button`}
              onClick={handleSaveChanges}
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
              {t('common.saveChanges')}
            </Button>
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
      />
      
      <MultipleSelectModal
        visible={modalVisible && currentModalType === "multiple-select"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
        questionData={editingQuestion}
      />
      
      <TrueFalseModal
        visible={modalVisible && currentModalType === "true-false"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
        questionData={editingQuestion}
      />
      
      <FillBlankModal
        visible={modalVisible && currentModalType === "fill-blank"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
        questionData={editingQuestion}
      />
      
      <DropdownModal
        visible={modalVisible && currentModalType === "dropdown"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
        questionData={editingQuestion}
      />
      
      <DragDropModal
        visible={modalVisible && currentModalType === "drag-drop"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
        questionData={editingQuestion}
      />
      
      <ReorderModal
        visible={modalVisible && currentModalType === "reorder"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
        questionData={editingQuestion}
      />
      
      <RewriteModal
        visible={modalVisible && currentModalType === "rewrite"}
        onCancel={handleModalCancel}
        onSave={handleModalSave}
        questionData={editingQuestion}
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
        initialValues={{
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

