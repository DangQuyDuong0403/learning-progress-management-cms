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
            <Typography.Text strong>{index + 1}. {t('dailyChallenge.multipleChoice') || 'Nhiều lựa chọn'}</Typography.Text>
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

// Mock data - danh sách câu hỏi
const mockQuestions = [
  {
    id: 1,
    question: "Hàm f(x) xác định với mọi số x với f(x) = |x+3| + |x+2|. Với giá trị nào của x thì f(x) = f(x-1) ?",
    options: [
      { key: "A", text: "-3", isCorrect: false },
      { key: "B", text: "-2", isCorrect: true },
      { key: "C", text: "-1", isCorrect: false },
      { key: "D", text: "1", isCorrect: false },
      { key: "E", text: "2", isCorrect: false },
    ],
    timeLimit: 1, // minutes
    points: 1,
  },
  {
    id: 2,
    question: "Tại đại học FPT, 40% sinh viên là thành viên của cả câu lạc bộ cờ vua và câu lạc bộ bơi lội. Nếu 20% thành viên của câu lạc bộ bơi không phải là thành viên của câu lạc bộ cờ vua, thì bao nhiêu phần trăm tổng số học sinh FPT là thành viên của câu lạc bộ bơi?",
    options: [
      { key: "A", text: "20%", isCorrect: false },
      { key: "B", text: "30%", isCorrect: false },
      { key: "C", text: "40%", isCorrect: false },
      { key: "D", text: "50%", isCorrect: true },
    ],
    timeLimit: 1,
    points: 1,
  },
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
  
  // Daily Challenge Info states
  const [challengeName, setChallengeName] = useState("");
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [timeLimit, setTimeLimit] = useState("");
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [currentModalType, setCurrentModalType] = useState(null);
  const [questionTypeModalVisible, setQuestionTypeModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteQuestion, setDeleteQuestion] = useState(null);
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
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setQuestions(mockQuestions);
        setLoading(false);
      }, 1000);
    } catch (error) {
      spaceToast.error('Error loading questions');
      setLoading(false);
    }
  }, []);

  // Fetch chapters
  const fetchChapters = useCallback(async () => {
    try {
      // TODO: Call API to fetch chapters
      // const response = await syllabusApi.getChapters();
      
      // Mock data for now
      const mockChapters = [
        { id: 1, name: 'Chapter 1: Introduction', chapterNumber: 1 },
        { id: 2, name: 'Chapter 2: Basic Grammar', chapterNumber: 2 },
        { id: 3, name: 'Chapter 3: Vocabulary', chapterNumber: 3 },
      ];
      setChapters(mockChapters);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      spaceToast.error('Error loading chapters');
    }
  }, []);

  // Fetch lessons when chapter is selected
  const fetchLessons = useCallback(async (chapterId) => {
    try {
      // TODO: Call API to fetch lessons by chapter
      // const response = await syllabusApi.getLessonsByChapter(chapterId);
      
      // Mock data for now
      const mockLessons = [
        { id: 1, name: 'Lesson 1: Greetings', lessonNumber: 1, chapterId },
        { id: 2, name: 'Lesson 2: Introductions', lessonNumber: 2, chapterId },
        { id: 3, name: 'Lesson 3: Daily Activities', lessonNumber: 3, chapterId },
      ];
      setLessons(mockLessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      spaceToast.error('Error loading lessons');
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
    fetchChapters();
  }, [fetchQuestions, fetchChapters]);

  // Fetch lessons when chapter changes
  useEffect(() => {
    if (selectedChapter) {
      fetchLessons(selectedChapter);
      setSelectedLesson(null); // Reset selected lesson
    } else {
      setLessons([]);
      setSelectedLesson(null);
    }
  }, [selectedChapter, fetchLessons]);

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

  const totalPoints = useMemo(() => {
    return filteredQuestions.reduce((sum, q) => sum + q.points, 0);
  }, [filteredQuestions]);

  const questionIds = useMemo(() => 
    filteredQuestions.map((question) => question.id), 
    [filteredQuestions]
  );

  return (
    <ThemedLayout>
      <div className={`daily-challenge-content-wrapper ${theme}-daily-challenge-content-wrapper`}>
        {/* Search and Action Section */}
        <div className="search-action-section" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px', padding: '24px 24px 0 24px' }}>
          <Input
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            className={`search-input ${theme}-search-input`}
            allowClear
          />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <Button 
              icon={<ImportOutlined />}
              className={`create-button ${theme}-create-button`}
              onClick={handleImportData}
            >
              {t('common.import')}
            </Button>
            <Button 
              icon={<ExportOutlined />}
              className={`create-button ${theme}-create-button`}
              onClick={handleExportData}
            >
              {t('common.export')}
            </Button>
            <Button 
              icon={<PlusOutlined />}
              className={`create-button ${theme}-create-button`}
              onClick={handleAddQuestion}
            >
              {t('dailyChallenge.addQuestion')}
            </Button>
            <Button 
              icon={<SaveOutlined />}
              className={`create-button ${theme}-create-button`}
              onClick={handleSaveChanges}
            >
              {t('common.saveChanges')}
            </Button>
          </div>
        </div>

        {/* Challenge Information Section */}
        <div className="challenge-info-section" style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'flex-end', 
          marginBottom: '24px', 
          padding: '0 24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1 1 0', minWidth: '200px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              fontSize: '14px'
            }}>
              {t('dailyChallenge.challengeName') || 'Challenge Name'}
            </label>
            <Input
              value={challengeName}
              onChange={(e) => setChallengeName(e.target.value)}
              className={`${theme}-challenge-info-input`}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ flex: '1 1 0', minWidth: '200px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              fontSize: '14px'
            }}>
              {t('dailyChallenge.chapter') || 'Chapter'}
            </label>
            <Select
              value={selectedChapter}
              onChange={(value) => setSelectedChapter(value)}
              placeholder={t('dailyChallenge.selectChapter') || 'Select chapter'}
              className={`${theme}-challenge-info-select`}
              style={{ width: '100%' }}
              allowClear
            >
              {chapters.map((chapter) => (
                <Select.Option key={chapter.id} value={chapter.id}>
                  {chapter.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div style={{ flex: '1 1 0', minWidth: '200px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              fontSize: '14px'
            }}>
              {t('dailyChallenge.lesson') || 'Lesson'}
            </label>
            <Select
              value={selectedLesson}
              onChange={(value) => setSelectedLesson(value)}
              placeholder={t('dailyChallenge.selectLesson') || 'Select lesson'}
              className={`${theme}-challenge-info-select`}
              style={{ width: '100%' }}
              disabled={!selectedChapter}
              allowClear
            >
              {lessons.map((lesson) => (
                <Select.Option key={lesson.id} value={lesson.id}>
                  {lesson.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div style={{ flex: '1 1 0', minWidth: '150px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              fontSize: '14px'
            }}>
              {t('dailyChallenge.timeLimit') || 'Time Limit'} ({t('dailyChallenge.minutes') || 'minutes'})
            </label>
            <Input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              className={`${theme}-challenge-info-input`}
              style={{ width: '100%' }}
              min={1}
            />
          </div>
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
    </ThemedLayout>
  );
};

export default DailyChallengeContent;

