import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import {
  Button,
  Card,
  Input,
  Tooltip,
  Typography,
} from "antd";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  CloudUploadOutlined,
  FileTextOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { spaceToast } from "../../../../component/SpaceToastify";
import dailyChallengeApi from "../../../../apis/backend/dailyChallengeManagement";
import levelManagementApi from "../../../../apis/backend/levelManagement";
import usePageTitle from "../../../../hooks/usePageTitle";
import MultipleChoiceModal from "./questionModals/MultipleChoiceModal";
import MultipleSelectModal from "./questionModals/MultipleSelectModal";
import TrueFalseModal from "./questionModals/TrueFalseModal";
import FillBlankModal from "./questionModals/FillBlankModal";
import DropdownModal from "./questionModals/DropdownModal";
import DragDropModal from "./questionModals/DragDropModal";
import ReorderModal from "./questionModals/ReorderModal";
// Rewrite is not used on this page
import "./AIGenerateQuestions.css";
import TableSpinner from "../../../../component/spinner/TableSpinner";

const { Title } = Typography;
const { TextArea } = Input;

const AIGenerateReading = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);

  // Page title same as AI Questions page
  usePageTitle('AI Question Generation');

  const challengeInfo = useMemo(() => ({
    classId: location.state?.classId || null,
    className: location.state?.className || null,
    challengeId: location.state?.challengeId || id,
    challengeName: location.state?.challengeName || null,
    challengeType: 'READING',
    aiSource: location.state?.aiSource || null, // 'settings' or 'file'
  }), [
    id,
    location.state?.classId,
    location.state?.className,
    location.state?.challengeId,
    location.state?.challengeName,
    location.state?.aiSource,
  ]);

  // Single prompt input used for both passage generation and question generation
  const [passagePrompt, setPassagePrompt] = useState("");
  const [numParagraphs, setNumParagraphs] = useState(1);
  const [generatingPassage, setGeneratingPassage] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [passage, setPassage] = useState("");
  // passage input mode: null (not chosen), 'generate' shows paragraphs and generate button; 'manual' hides them
  const [passageMode, setPassageMode] = useState(null);

  // Configure question generation and preview: list all types, quantities default 0
  const allQuestionTypes = useMemo(() => [
    'MULTIPLE_CHOICE',
    'MULTIPLE_SELECT',
    'TRUE_OR_FALSE',
    'FILL_IN_THE_BLANK',
    'DROPDOWN',
    'DRAG_AND_DROP',
    'REARRANGE',
  ], []);
  const [questionTypeConfigs, setQuestionTypeConfigs] = useState(
    () => allQuestionTypes.map((qt) => ({ questionType: qt, numberOfQuestions: 0 }))
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [questions, setQuestions] = useState([]);
  // Local selections for interactive preview of Dropdown type
  const [dropdownSelections, setDropdownSelections] = useState({});
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  // Question settings mode on the right: null (choose), 'manual', 'upload'
  const [questionSettingsMode, setQuestionSettingsMode] = useState(null);
  const uploadInputRef = useRef(null);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [hierarchy, setHierarchy] = useState(null);
  const [showSpinner, setShowSpinner] = useState(true);
  const [spinnerCompleted, setSpinnerCompleted] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  // Helper function to extract backend error messages
  const getBackendMessage = useCallback((resOrErr) => {
    try {
      // Error object (axios error)
      if (resOrErr?.response?.data) {
        return (
          resOrErr.response.data.error ||
          resOrErr.response.data.message ||
          resOrErr.response.data.data?.message ||
          null
        );
      }
      // Axios response (success response)
      if (resOrErr?.data) {
        return (
           resOrErr.message ||
          resOrErr.data.message ||
          resOrErr.data.data?.message ||
          resOrErr.data.error ||
          null
        );
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // State for new API fields
  const [levelType, setLevelType] = useState(null); // 'system', 'academic', 'cefr'
  const [selectedLevel, setSelectedLevel] = useState(null); // Selected level value/id
  const [vocabularyList, setVocabularyList] = useState(""); // Vocabulary list text (only for passage generation)
  const [description, setDescription] = useState(""); // Description field
  const [systemLevels, setSystemLevels] = useState([]); // Fetched Camkey levels (published levels)
  
  // Dropdown menu states
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const [hoveredLevelType, setHoveredLevelType] = useState(null);

  const primaryColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
  const primaryColorWithAlpha = theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)';
  const MAX_FILE_MB = 10; // max upload size shown and validated on client
  useEffect(() => {
    const spinnerTimer = setTimeout(() => setSpinnerCompleted(true), 1200);
    return () => clearTimeout(spinnerTimer);
  }, []);

  const handleSpinnerAnimationEnd = useCallback(() => {
    setShowSpinner(false);
    setContentVisible(true);
  }, []);


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

  // CKEditor config for passage editor
  const passageEditorConfig = useMemo(() => ({
    toolbar: {
      items: [
        'undo', 'redo', '|',
        'heading', '|',
        'bold', 'italic', 'underline', '|',
        'bulletedList', 'numberedList', '|',
        'link', 'imageUpload', '|',
        'blockQuote', 'insertTable', '|',
        'alignment', '|',
        'fontSize', 'fontColor', 'fontBackgroundColor'
      ]
    },
    removePlugins: ['StickyToolbar'],
    extraPlugins: [CustomUploadAdapterPlugin]
  }), []);

  const availableQuestionTypes = useMemo(() => [
    { value: "MULTIPLE_CHOICE", label: t('dailyChallenge.multipleChoice') || 'Multiple Choice', icon: '📝', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "MULTIPLE_SELECT", label: t('dailyChallenge.multipleSelect') || 'Multiple Select', icon: '☑️', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "TRUE_OR_FALSE", label: t('dailyChallenge.trueFalse') || 'True/False', icon: '✅', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "FILL_IN_THE_BLANK", label: t('dailyChallenge.fillBlank') || 'Fill in the Blank', icon: '✏️', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "DROPDOWN", label: 'Dropdown', icon: '📋', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "DRAG_AND_DROP", label: 'Drag and Drop', icon: '🔄', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "REARRANGE", label: 'Rearrange', icon: '🔀', color: primaryColor, bgColor: primaryColorWithAlpha },
  ], [t, primaryColor, primaryColorWithAlpha]);

  // Level options constants
  const academicLevels = useMemo(() => [
    { value: 'L1', label: 'L1 - Level 1 - Elementary Grade 1' },
    { value: 'L2', label: 'L2 - Level 2 - Elementary Grade 2' },
    { value: 'L3', label: 'L3 - Level 3 - Elementary Grade 3' },
    { value: 'L4', label: 'L4 - Level 4 - Elementary Grade 4' },
    { value: 'L5', label: 'L5 - Level 5 - Elementary Grade 5' },
    { value: 'L6', label: 'L6 - Level 6 - Middle School Grade 6' },
    { value: 'L7', label: 'L7 - Level 7 - Middle School Grade 7' },
    { value: 'L8', label: 'L8 - Level 8 - Middle School Grade 8' },
    { value: 'L9', label: 'L9 - Level 9 - High School Grade 9' },
    { value: 'L10', label: 'L10 - Level 10 - High School Grade 10' },
    { value: 'L11', label: 'L11 - Level 11 - High School Grade 11' },
    { value: 'L12', label: 'L12 - Level 12 - High School Grade 12' },
    { value: 'UNIVERSITY', label: 'University Level - Academic English for higher education' },
  ], []);

  const cefrLevels = useMemo(() => [
    { value: 'A1', label: 'A1 - Beginner' },
    { value: 'A2', label: 'A2 - Elementary' },
    { value: 'B1', label: 'B1 - Intermediate' },
    { value: 'B2', label: 'B2 - Upper Intermediate' },
    { value: 'C1', label: 'C1 - Advanced' },
    { value: 'C2', label: 'C2 - Proficiency' },
  ], []);


  // Initialize right panel (settings/upload) from navigation state
  useEffect(() => {
    const source = location.state?.aiSource;
    if (source === 'settings') {
      setQuestionSettingsMode('manual');
    } else if (source === 'file') {
      setQuestionSettingsMode('upload');
    }
  }, [location.state?.aiSource]);

  // Helpers (match AIGenerateQuestions behaviors) - unused utilities removed

  // Normalizer borrowed from AIGenerateQuestions (slightly trimmed to fit)
  const normalizeQuestionsFromAI = useCallback((rawList) => {
    if (!Array.isArray(rawList)) return [];
    let list = rawList;
    if (rawList.length && rawList.every(it => it && Array.isArray(it.questions))) {
      list = rawList.flatMap(it => Array.isArray(it.questions) ? it.questions : []);
    }
    let counter = 0; const nextId = () => (++counter); const toKey = (i) => String.fromCharCode(65 + i);
    return list.map((q) => {
      const type = String(q?.questionType || q?.type || '').toUpperCase();
      switch (type) {
        case 'MULTIPLE_CHOICE':
        case 'MULTIPLE_SELECT': {
          const optionsSource = Array.isArray(q?.options) ? q.options : Array.isArray(q?.content?.data) ? q.content.data : [];
          const opts = optionsSource.map((o, i) => ({ key: toKey(i), text: o?.text ?? o?.value ?? '', isCorrect: Boolean(o?.isCorrect || o?.correct) }));
          return { id: nextId(), type, title: `Question ${counter}`, question: q?.question || q?.questionText || '', options: opts, points: q?.points ?? q?.weight ?? q?.score ?? 1 };
        }
        case 'TRUE_OR_FALSE': {
          // Prefer backend-provided options if present; otherwise synthesize both True/False
          const backendOptions = Array.isArray(q?.options) ? q.options : [];
          const hasBackend = backendOptions.length > 0;
          const correct = String(q?.correctAnswer ?? q?.answer ?? '').toLowerCase();
          const isTrue = correct === 'true' || correct === 't' || correct === '1';
          const fallback = [
            { key: 'A', text: 'True', isCorrect: isTrue === true },
            { key: 'B', text: 'False', isCorrect: isTrue === false },
          ];
          const options = hasBackend
            ? backendOptions.map((o, i) => ({ key: toKey(i), text: o?.text ?? o?.value ?? '', isCorrect: Boolean(o?.isCorrect || o?.correct) }))
            : fallback;
          const rawQuestion = q?.question || q?.questionText || '';
          const sanitizedQuestion = typeof rawQuestion === 'string'
            ? rawQuestion.replace(/\[\[pos_[^\]]+\]\]/g, '')
            : rawQuestion;
          return {
            id: nextId(),
            type: 'TRUE_OR_FALSE',
            title: `Question ${counter}`,
            question: sanitizedQuestion,
            options,
            points: q?.points ?? q?.weight ?? q?.score ?? 1,
          };
        }
        case 'FILL_IN_THE_BLANK':
        case 'DROPDOWN':
        case 'DRAG_AND_DROP':
          return { id: nextId(), type, title: `Question ${counter}`, question: q?.question || q?.questionText || '', questionText: q?.questionText || q?.question || '', content: { data: Array.isArray(q?.content?.data) ? q.content.data : [] }, points: q?.points ?? q?.weight ?? q?.score ?? 1 };
        case 'REARRANGE': {
          const contentItems = Array.isArray(q?.content?.data) ? q.content.data : [];
          // Map positionId -> value
          const posToVal = new Map();
          contentItems.forEach(it => { if (it && it.positionId) posToVal.set(String(it.positionId).replace(/^pos_/, ''), it.value); });
          // Determine order from placeholders in questionText
          const text = q?.questionText || q?.question || '';
          const ids = [];
          const re = /\[\[pos_([a-zA-Z0-9]+)\]\]/g;
          let m; while ((m = re.exec(text)) !== null) { ids.push(m[1]); }
          const words = ids.map(id => posToVal.get(id)).filter(Boolean);
          return {
            id: nextId(),
            type: 'REARRANGE',
            title: `Question ${counter}`,
            // Human-friendly instruction (do not show placeholders)
            question: 'Rearrange the words by dragging them into the correct order:',
            questionText: text,
            sourceItems: words,
            correctOrder: words,
            content: { data: contentItems },
            points: q?.points ?? q?.weight ?? q?.score ?? 1,
          };
        }
        default:
          return null;
      }
    }).filter(Boolean).map((q, idx) => ({ ...q, id: idx + 1, title: `Question ${idx + 1}` }));
  }, []);

  // Fetch hierarchy info (level/chapter/lesson) for the header info bar
  useEffect(() => {
    let mounted = true;
    const fetchHierarchy = async () => {
      try {
        const res = await dailyChallengeApi.getChallengeHierarchy(id);
        const data = res?.data?.data || res?.data || res;
        if (mounted) setHierarchy(data || null);
      } catch (e) {
        if (mounted) setHierarchy(null);
      }
    };
    if (id) fetchHierarchy();
    return () => { mounted = false; };
  }, [id]);

  // Set default level from hierarchy when both hierarchy and systemLevels are available
  useEffect(() => {
    // Only set if selectedLevel is not already set (to avoid overwriting user selection)
    if (selectedLevel) return;
    
    if (hierarchy?.level) {
      const levelId = String(hierarchy.level.id || '');
      const levelCode = hierarchy.level.levelCode || '';
      const levelName = hierarchy.level.levelName || '';
      
      // Try to find in systemLevels first (by id)
      const foundInSystem = systemLevels.find(l => l.value === levelId);
      if (foundInSystem) {
        setSelectedLevel(levelId);
        setLevelType('system');
        return;
      }
      
      // Try to find in academicLevels (by value/code)
      const foundInAcademic = academicLevels.find(l => 
        l.value === levelCode || 
        l.value === levelName ||
        l.label.toLowerCase().includes(levelName.toLowerCase())
      );
      if (foundInAcademic) {
        setSelectedLevel(foundInAcademic.value);
        setLevelType('academic');
        return;
      }
      
      // Try to find in cefrLevels (by value/code)
      const foundInCefr = cefrLevels.find(l => 
        l.value === levelCode || 
        l.value === levelName ||
        l.label.toLowerCase().includes(levelName.toLowerCase())
      );
      if (foundInCefr) {
        setSelectedLevel(foundInCefr.value);
        setLevelType('cefr');
        return;
      }
      
      // If not found in any list but has levelId, assume it's a system level
      if (levelId) {
        setSelectedLevel(levelId);
        setLevelType('system');
      }
    }
  }, [hierarchy, systemLevels, selectedLevel, academicLevels, cefrLevels]);

  // Fetch Camkey levels (system levels)
  useEffect(() => {
    let mounted = true;
    const fetchSystemLevels = async () => {
      try {
        const res = await levelManagementApi.getPublishedLevels({ params: { page: 0, size: 1000 } });
        const data = res?.data?.data || res?.data || res;
        const levels = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : []);
        if (mounted) {
          setSystemLevels(levels.map(level => ({
            value: String(level.id || level.levelId || ''),
            label: level.levelName || level.name || `Level ${level.id || level.levelId || ''}`
          })));
        }
      } catch (e) {
        console.error('Error fetching Camkey levels:', e);
        if (mounted) setSystemLevels([]);
      }
    };
    fetchSystemLevels();
    return () => { mounted = false; };
  }, []);

  // Step 1: call passage generation
  const handleGeneratePassage = useCallback(async () => {
    if (!selectedLevel) {
      spaceToast.error('Please select a level');
      return;
    }
    try {
      setGeneratingPassage(true);
      setGenerationProgress(0);
      const payload = {
        challengeId: challengeInfo.challengeId,
        numberOfParagraphs: Number(numParagraphs) || 1,
        description: description || passagePrompt,
        level: selectedLevel,
        vocabularyList: vocabularyList || '',
      };
      const res = await dailyChallengeApi.generateReadingPassage(payload);
      // Flexible extraction
      const data = res?.data?.data || res?.data || res;
      const text = data?.passage || data?.content || data?.sectionsContent || '';
      if (!text) throw new Error('No passage returned');
      // Keep generated passage internally; do not overwrite the user's prompt
      setGenerationProgress(100);
      // Small delay to show 100% before closing
      await new Promise(resolve => setTimeout(resolve, 300));
      setPassage(text);
      spaceToast.success('Passage generated');
    } catch (err) {
      console.error('Generate passage error:', err);
      const beErr = getBackendMessage(err);
      spaceToast.error(beErr || err?.response?.data?.error || 'Failed to generate passage');
    } finally {
      setGeneratingPassage(false);
      setGenerationProgress(0);
    }
  }, [challengeInfo.challengeId, description, passagePrompt, numParagraphs, selectedLevel, vocabularyList, getBackendMessage]);

  // Quantity change handler

  const handleNumberOfQuestionsChange = useCallback((index, value) => {
    setQuestionTypeConfigs(prev => prev.map((item, i) => (i === index ? { ...item, numberOfQuestions: value } : item)));
  }, []);

  // Step 2: call content-based questions generation
  const handleGenerateWithAI = useCallback(async () => {
    // Validate: Check if at least one question type is selected
    const selectedConfigs = (questionTypeConfigs || [])
      .filter((c) => Number(c.numberOfQuestions) > 0);
    
    if (selectedConfigs.length === 0) {
      spaceToast.error('At least one question type config is required');
      return;
    }
    
    // Use current prompt content as passage source if local passage is empty
    const sourcePassage = (passage && passage.trim()) ? passage : (passagePrompt || '').trim();
    if (!sourcePassage) {
      spaceToast.error('Passage is empty. Please generate or paste passage in the prompt box');
      return;
    }
    // Enforce total questions limit <= 100
    const totalRequested = (questionTypeConfigs || []).reduce((sum, c) => sum + (Number(c.numberOfQuestions) || 0), 0);
    if (totalRequested > 100) {
      spaceToast.error(t('dailyChallenge.max100Questions') || 'You can request at most 100 questions in total');
      return;
    }
    const mappedConfigs = selectedConfigs.map((c) => ({
      questionType: c.questionType,
      numberOfQuestions: Math.max(0, Number(c.numberOfQuestions) || 0),
    }));
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setShowPreview(false);
      // Prepare level value: for Camkey levels, send ID as string; for others, send the value directly
      const levelValue = selectedLevel ? String(selectedLevel) : '';
      const payload = {
        challengeId: challengeInfo.challengeId,
        sections: [
          {
            section: {
              id: 0,
              sectionTitle: 'Reading Section',
              sectionsUrl: '',
              sectionsContent: sourcePassage,
              orderNumber: 1,
              resourceType: 'DOCUMENT',
            },
            questionTypeConfigs: mappedConfigs,
          },
        ],
        description: description || '',
        level: levelValue,
      };
      const res = await dailyChallengeApi.generateContentBasedQuestions(payload);
      let rawList = [];
      if (Array.isArray(res)) rawList = res;
      else if (Array.isArray(res?.questions)) rawList = res.questions;
      else if (Array.isArray(res?.data)) rawList = res.data;
      else if (Array.isArray(res?.data?.questions)) rawList = res.data.questions;
      else if (Array.isArray(res?.result?.questions)) rawList = res.result.questions;
      const normalized = normalizeQuestionsFromAI(rawList);
      setGenerationProgress(100);
      // Small delay to show 100% before closing
      await new Promise(resolve => setTimeout(resolve, 300));
      if (!normalized.length) {
        spaceToast.warning('AI did not return any questions');
        setQuestions([]);
        setShowPreview(false);
      } else {
        setQuestions(normalized);
        setShowPreview(true);
        spaceToast.success(t('dailyChallenge.aiQuestionsGenerated') || 'AI questions generated successfully!');
      }
    } catch (err) {
      console.error('Generate content-based questions error:', err);
      const beErr = getBackendMessage(err);
      spaceToast.error(beErr || err?.response?.data?.error || 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [challengeInfo.challengeId, passage, passagePrompt, questionTypeConfigs, t, normalizeQuestionsFromAI, selectedLevel, description, getBackendMessage]);

  // Simulate progress when generating
  useEffect(() => {
    let progressInterval = null;
    if (isGenerating || generatingPassage) {
      setGenerationProgress(0);
      progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) {
            return prev; // Stop at 90% until API call completes
          }
          // Increment progress with decreasing speed
          const increment = prev < 30 ? 3 : prev < 60 ? 2 : 1;
          return Math.min(prev + increment, 90);
        });
      }, 200);
    }
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isGenerating, generatingPassage]);

  // Save generated questions into a section
  const handleSave = useCallback(async () => {
    const currentPassage = (passageMode === 'manual') ? (passagePrompt || '') : (passage || '');
    if (!currentPassage.trim()) {
      spaceToast.error('Passage is empty');
      return;
    }
    try {
      setSaving(true);
      // Capture existing sections BEFORE save to compute append positions and detect new ids later
      let beforeSections = [];
      try {
        const existing = await dailyChallengeApi.getSectionsByChallenge(id, { page: 0, size: 100 });
        beforeSections = Array.isArray(existing?.data) ? existing.data : (Array.isArray(existing) ? existing : []);
        console.log('[AI Reading Save] Before save - existing sections (id -> order):', beforeSections.map(s => ({ id: s?.section?.id ?? s?.id, order: s?.section?.orderNumber ?? s?.orderNumber })));
      } catch (e) {
        beforeSections = [];
      }
      const baseOrder = beforeSections.reduce((max, item) => {
        const ord = Number(item?.section?.orderNumber ?? item?.orderNumber ?? 0);
        return Number.isFinite(ord) && ord > max ? ord : max;
      }, 0);
      console.log('[AI Reading Save] Computed baseOrder =', baseOrder);

      // Transform preview questions -> API schema (reuse simplified mapping)
      const toApiQuestion = (q, orderNumber) => {
        const toData = (d) => Array.isArray(d) ? d : [];
        switch (q.type) {
          case 'MULTIPLE_CHOICE':
          case 'MULTIPLE_SELECT':
          case 'TRUE_OR_FALSE':
            return {
              questionText: q.question || q.questionText || '',
              orderNumber,
              weight: q.points || 1,
              questionType: q.type === 'TRUE_OR_FALSE' ? 'TRUE_OR_FALSE' : q.type,
              content: { data: toData((q.options || []).map((o, idx) => ({ id: o.key || `opt${idx + 1}`, value: o.text || '', correct: o.isCorrect === true }))) },
              toBeDeleted: false,
            };
          case 'FILL_IN_THE_BLANK':
          case 'DROPDOWN':
          case 'DRAG_AND_DROP':
          case 'REARRANGE':
          case 'REWRITE':
            return {
              questionText: q.questionText || q.question || '',
              orderNumber,
              weight: q.points || 1,
              questionType: q.type,
              content: { data: toData(q.content?.data) },
              toBeDeleted: false,
            };
          default:
            return { questionText: q.question || '', orderNumber, weight: 1, questionType: 'MULTIPLE_CHOICE', content: { data: [] }, toBeDeleted: false };
        }
      };
      // For reading: one section contains multiple questions, each question has its own orderNumber
      const apiQuestions = (questions || []).map((q, idx) => toApiQuestion(q, idx + 1));
      const sectionData = {
        section: {
          sectionTitle: 'AI Generated Reading',
          sectionsUrl: '',
          sectionsContent: currentPassage,
          orderNumber: baseOrder + 1,
          resourceType: 'DOCUMENT',
        },
        questions: apiQuestions,
      };
      console.log('[AI Reading Save] Section to create (orderNumber):', sectionData.section.orderNumber, 'questions:', apiQuestions.length);
      const resp = await dailyChallengeApi.saveSectionWithQuestions(id, sectionData);
      // After creating, force correct ordering: existing sections keep order, new ones appended
      try {
        const afterRes = await dailyChallengeApi.getSectionsByChallenge(id, { page: 0, size: 100 });
        const afterSections = Array.isArray(afterRes?.data) ? afterRes.data : (Array.isArray(afterRes) ? afterRes : []);
        console.log('[AI Reading Save] After save - all sections (id -> order):', afterSections.map(s => ({ id: s?.section?.id ?? s?.id, order: s?.section?.orderNumber ?? s?.orderNumber })));
        const beforeIds = new Set(beforeSections.map(s => s?.section?.id ?? s?.id));
        const existingOrdered = beforeSections
          .map(s => ({ id: s?.section?.id ?? s?.id, orderNumber: Number(s?.section?.orderNumber ?? s?.orderNumber ?? 0) }))
          .filter(x => x.id != null)
          .sort((a, b) => a.orderNumber - b.orderNumber);
        const newOnes = afterSections
          .filter(s => !beforeIds.has(s?.section?.id ?? s?.id))
          .map(s => ({ id: s?.section?.id ?? s?.id, createdAt: s?.section?.createdAt ?? s?.createdAt ?? '' }))
          .filter(x => x.id != null)
          .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
        const finalBulk = [];
        let seq = 0;
        existingOrdered.forEach(x => finalBulk.push({ id: x.id, orderNumber: ++seq }));
        newOnes.forEach(x => finalBulk.push({ id: x.id, orderNumber: ++seq }));
        console.log('[AI Reading Save] Reorder payload:', finalBulk);
        if (finalBulk.length > 0) {
          const reorderResp = await dailyChallengeApi.bulkUpdateSections(id, finalBulk);
          console.log('[AI Reading Save] Reorder response:', reorderResp);
        }
      } catch (reorderError) {
        console.warn('[AI Reading Save] Reorder after save failed, continuing:', reorderError);
      }
      spaceToast.success(resp?.message || t('dailyChallenge.saveSuccess') || 'Saved successfully');

      const userRole = user?.role?.toLowerCase();
      const contentPath = userRole === 'teaching_assistant'
        ? `/teaching-assistant/daily-challenges/detail/${id}/content`
        : `/teacher/daily-challenges/detail/${id}/content`;
      navigate(contentPath, {
        state: {
          challengeId: id,
          challengeName: challengeInfo.challengeName,
          classId: challengeInfo.classId,
          className: challengeInfo.className,
        },
      });
    } catch (err) {
      console.error('Save AI reading section error:', err);
      const beErr = getBackendMessage(err);
      spaceToast.error(beErr || err?.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [id, passage, passagePrompt, passageMode, questions, navigate, user, challengeInfo, t, getBackendMessage]);

  // Parse questions from uploaded file using OpenAI service
  const handleGenerateFromFile = useCallback(async () => {
    if (!uploadedFile) {
      spaceToast.error('Please select a file to generate questions');
      return;
    }
    try {
      setIsGenerating(true);
      setShowPreview(false);
      const res = await dailyChallengeApi.parseQuestionsFromFile(uploadedFile, passagePrompt || '');
      let rawList = [];
      if (Array.isArray(res)) rawList = res;
      else if (Array.isArray(res?.questions)) rawList = res.questions;
      else if (Array.isArray(res?.data?.questions)) rawList = res.data.questions;
      else if (Array.isArray(res?.data)) rawList = res.data;
      else if (Array.isArray(res?.result?.questions)) rawList = res.result.questions;
      const normalized = normalizeQuestionsFromAI(rawList);
      if (!normalized.length) {
        spaceToast.warning('No questions parsed from file');
        setQuestions([]);
        setShowPreview(false);
      } else {
        setQuestions(normalized);
        setShowPreview(true);
        spaceToast.success('Questions generated from file');
      }
    } catch (err) {
      console.error('Generate from file error:', err);
      const beErr = getBackendMessage(err);
      spaceToast.error(beErr || err?.response?.data?.error || 'Failed to generate from file');
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedFile, passagePrompt, normalizeQuestionsFromAI, getBackendMessage]);

  const handleBack = useCallback(() => {
    const userRole = user?.role?.toLowerCase();
    const contentPath = userRole === 'teaching_assistant'
      ? `/teaching-assistant/daily-challenges/detail/${id}/content`
      : `/teacher/daily-challenges/detail/${id}/content`;
    navigate(contentPath, { state: { challengeId: id, challengeName: challengeInfo.challengeName, classId: challengeInfo.classId, className: challengeInfo.className } });
  }, [navigate, id, challengeInfo, user]);

  // Edit modal plumbing (reuse minimal subset)
  const handleEditQuestion = useCallback((qid) => {
    const q = questions.find(x => x.id === qid);
    if (!q) return;
    setEditingQuestion({ ...q });
    setIsEditModalVisible(true);
  }, [questions]);

  const handleDeleteQuestion = useCallback((qid) => {
    setQuestions(prev => {
      const filtered = prev.filter(q => q.id !== qid);
      // Re-index questions after deletion
      return filtered.map((q, index) => ({
        ...q,
        id: index + 1,
        title: `Question ${index + 1}`
      }));
    });
    spaceToast.success('Question deleted successfully');
  }, []);

  const handleSaveFromModal = useCallback((updated) => {
    setQuestions(prev => prev.map(q => q.id === updated.id ? { ...q, ...updated, title: q.title } : q));
    setIsEditModalVisible(false);
    setEditingQuestion(null);
    spaceToast.success('Question updated successfully');
  }, []);

  const headerSubtitle = (challengeInfo.className && challengeInfo.challengeName)
    ? `${challengeInfo.className} / ${challengeInfo.challengeName}`
    : (challengeInfo.challengeName || null);

  const customHeader = (
    <header className={`themed-header ${theme}-header`}>
      <nav className="themed-navbar">
        <div className="themed-navbar-content" style={{ justifyContent: 'space-between', width: '100%' }}>
          {/* Left: Back Button + Title (identical structure) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
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
              <span style={{ fontSize: '24px', fontWeight: 300, opacity: 0.5 }}>|</span>
              <span>
                {headerSubtitle
                  || (t('dailyChallenge.dailyChallengeManagement') + ' / ' + (t('dailyChallenge.content') || 'Content'))
                }
              </span>
            </div>
          </div>

          {/* Right: Save Button (identical visual) */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button 
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
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
              {t('common.save')}
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );

  const mainContentStyle = {
    opacity: contentVisible ? 1 : 0,
    transition: 'opacity 0.45s ease',
    pointerEvents: contentVisible ? 'auto' : 'none'
  };

  return (
    <ThemedLayout customHeader={customHeader} contentMargin={10}>
      {showSpinner && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 4000,
            background: theme === 'sun'
              ? 'rgba(255, 255, 255, 0.92)'
              : 'rgba(7, 7, 12, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <TableSpinner
            message="Loading..."
            isCompleted={spinnerCompleted}
            onAnimationEnd={handleSpinnerAnimationEnd}
          />
        </div>
      )}
      <style>
        {`
          @keyframes astroBounce {
            0%, 100% {
              transform: translateY(-50%) translateY(0);
            }
            50% {
              transform: translateY(-50%) translateY(-8px);
            }
          }
        `}
      </style>
      <div
        className={`ai-generate-wrapper allow-motion ${theme}-ai-generate-wrapper`}
        style={mainContentStyle}
      >
        <div style={{ padding: '24px', maxWidth: '1500px', margin: '0 auto' }}>
        {/* Moved hierarchy chips inside main container below */}
        {/* Frosted outer frame around both containers and the button */}
        <Card
          style={{
            borderRadius: '20px',
            border: theme === 'sun'
              ? '2px solid rgba(24, 144, 255, 0.35)'
              : '2px solid rgba(139, 92, 246, 0.35)',
            background: theme === 'sun'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.60) 0%, rgba(240,249,255,0.55) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.50) 0%, rgba(244,240,255,0.45) 100%)',
            backdropFilter: 'blur(6px)',
            boxShadow: theme === 'sun'
              ? '0 8px 24px rgba(24, 144, 255, 0.12)'
              : '0 8px 24px rgba(139, 92, 246, 0.12)',
            padding: 16,
            animation: 'none',
            maxWidth: challengeInfo.aiSource === 'file' ? '650px' : '100%',
            width: challengeInfo.aiSource === 'file' ? 'auto' : '100%',
            margin: challengeInfo.aiSource === 'file' ? '0 auto' : '0'
          }}
          bodyStyle={{ padding: 16 }}
        >
        {/* Two-column layout: left = Generate with AI (2/3), right = Question Type Configuration (1/3) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: challengeInfo.aiSource === 'file' ? '1fr' : '2fr 1fr', 
          gap: '20px', 
          alignItems: 'stretch',
          width: '100%'
        }}>
          {/* Left: Generate with AI */}
          {challengeInfo.aiSource !== 'file' && (
          <Card
            className={`prompt-description-card ${theme}-prompt-description-card`}
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
              backdropFilter: 'blur(10px)',
              animation: 'none'
            }}
            bodyStyle={{ 
              padding: '20px', 
              maxHeight: '600px', 
              overflowY: isLevelDropdownOpen ? 'visible' : 'auto', 
              overflowX: 'visible', 
              position: 'relative' 
            }}
          >
            <Title level={3} style={{ textAlign: 'center', color: theme === 'sun' ? '#1890ff' : '#8B5CF6', marginTop: 0, fontSize: '26px', marginBottom: '20px' }}>
              AI Generation Settings
            </Title>

            {/* Initial mode selector centered */}
            {passageMode === null && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 12, minHeight: '460px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
                  {/* Option: Add text & media manually */}
                  <Card
                    hoverable
                    onClick={() => { setPassageMode('manual'); setPassage(''); }}
                    bodyStyle={{ padding: '16px' }}
                    style={{
                      borderRadius: '12px',
                      border: theme === 'sun'
                        ? '2px solid rgba(113, 179, 253, 0.3)'
                        : '2px solid rgba(138, 122, 255, 0.3)',
                      background: theme === 'sun'
                        ? 'linear-gradient(135deg, rgba(230, 245, 255, 0.5) 0%, rgba(186, 231, 255, 0.4) 100%)'
                        : 'rgba(255, 255, 255, 0.5)',
                      cursor: 'pointer',
                      marginBottom: 16,
                      position: 'relative',
                      willChange: 'auto',
                      animation: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <FileTextOutlined style={{ fontSize: 24, color: '#000000' }} />
                      <Typography.Text strong style={{ color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>
                        Add passage manually
                      </Typography.Text>
                    </div>
                  </Card>

                  {/* Option: Generate with AI (Generate passage) */}
                  <Card
                    hoverable
                    onClick={() => setPassageMode('generate')}
                    bodyStyle={{ padding: '16px' }}
                    style={{
                      borderRadius: '12px',
                      border: theme === 'sun'
                        ? '2px solid rgba(250, 173, 20, 0.3)'
                        : '2px solid rgba(138, 122, 255, 0.3)',
                      background: theme === 'sun'
                        ? 'linear-gradient(135deg, rgba(255, 251, 230, 0.5) 0%, rgba(255, 236, 179, 0.4) 100%)'
                        : 'rgba(255, 255, 255, 0.5)',
                      cursor: 'pointer',
                      position: 'relative',
                      willChange: 'auto',
                      animation: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 22 }}>✨</span>
                      <Typography.Text strong style={{ color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>
                        Generate passage with AI
                      </Typography.Text>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {passageMode !== null && (
              <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => setPassageMode(null)}
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
            </div>

                {/* Chapter and Lesson - Side by Side (Read-only) - Moved to top */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  {/* Chapter - Read-only */}
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Typography.Text style={{ display: 'block', marginBottom: '8px', color: theme === 'sun' ? '#999' : '#999', fontSize: '16px', fontWeight: 400 }}>
                      Chapter
                    </Typography.Text>
                    <div
                      style={{
                        width: '100%',
                        minHeight: '36px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: `2px solid ${theme === 'sun' ? '#d9d9d9' : '#666'}`,
                        background: theme === 'sun' ? '#f5f5f5' : 'rgba(100, 100, 100, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        zIndex: 10,
                        cursor: 'default',
                        opacity: 0.6
                      }}
                    >
                      <span style={{ 
                        color: hierarchy?.chapter?.chapterName || hierarchy?.chapter?.name
                          ? (theme === 'sun' ? '#666' : '#999') 
                          : (theme === 'sun' ? '#999' : '#999'),
                        fontSize: '14px',
                        fontWeight: 400
                      }}>
                        {hierarchy?.chapter?.chapterName || hierarchy?.chapter?.name || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Lesson - Read-only */}
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Typography.Text style={{ display: 'block', marginBottom: '8px', color: theme === 'sun' ? '#999' : '#999', fontSize: '16px', fontWeight: 400 }}>
                      Lesson
                    </Typography.Text>
                    <div
                      style={{
                        width: '100%',
                        minHeight: '36px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: `2px solid ${theme === 'sun' ? '#d9d9d9' : '#666'}`,
                        background: theme === 'sun' ? '#f5f5f5' : 'rgba(100, 100, 100, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        zIndex: 10,
                        cursor: 'default',
                        opacity: 0.6
                      }}
                    >
                      <span style={{ 
                        color: hierarchy?.lesson?.lessonName || hierarchy?.lesson?.name
                          ? (theme === 'sun' ? '#666' : '#999') 
                          : (theme === 'sun' ? '#999' : '#999'),
                        fontSize: '14px',
                        fontWeight: 400
                      }}>
                        {hierarchy?.lesson?.lessonName || hierarchy?.lesson?.name || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Level and Additional Description - Side by Side */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  {/* Level Selection */}
                  <div style={{ flex: 1 }}>
                    {/* Level Selection - Custom 2-Level Dropdown */}
                    <div className="level-dropdown-container" style={{ position: 'relative', zIndex: 1000, overflow: 'visible' }}>
                    <Typography.Text style={{ display: 'block', marginBottom: '8px', color: theme === 'sun' ? '#1E40AF' : '#8377A0', fontSize: '16px', fontWeight: 400 }}>
                      Level <span style={{ color: 'red' }}>*</span>
                    </Typography.Text>
                
                {/* Input Field */}
                <div
                  onClick={() => setIsLevelDropdownOpen(!isLevelDropdownOpen)}
                  style={{
                    width: '100%',
                    minHeight: '36px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: `2px solid ${primaryColor}60`,
                    background: theme === 'sun' ? '#fff' : 'rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = primaryColor;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${primaryColor}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${primaryColor}60`;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ 
                    color: selectedLevel 
                      ? (theme === 'sun' ? '#000' : '#fff') 
                      : (theme === 'sun' ? '#999' : '#999'),
                    fontSize: '14px',
                    fontWeight: selectedLevel ? 600 : 400
                  }}>
                    {selectedLevel 
                      ? (() => {
                          const allOptions = [
                            ...systemLevels.map(l => ({ ...l, type: 'system' })),
                            ...academicLevels.map(l => ({ ...l, type: 'academic' })),
                            ...cefrLevels.map(l => ({ ...l, type: 'cefr' }))
                          ];
                          const found = allOptions.find(o => o.value === selectedLevel);
                          return found ? found.label : 'Selected';
                        })()
                      : 'Select level type and level'}
                  </span>
                  <span style={{ 
                    transform: isLevelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    fontSize: '12px',
                    color: primaryColor
                  }}>▼</span>
                </div>

                {/* Dropdown Menu */}
                {isLevelDropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      onClick={() => {
                        setIsLevelDropdownOpen(false);
                        setHoveredLevelType(null);
                      }}
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 998
                      }}
                    />
                    
                    {/* Dropdown Panel */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '8px',
                        display: 'flex',
                        width: '100%',
                        maxHeight: '300px',
                        background: theme === 'sun' 
                          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 249, 255, 0.98) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '16px',
                        border: `2px solid ${primaryColor}40`,
                        boxShadow: theme === 'sun'
                          ? '0 8px 32px rgba(24, 144, 255, 0.2)'
                          : '0 8px 32px rgba(139, 92, 246, 0.2)',
                        zIndex: 999,
                        overflow: 'hidden'
                      }}
                      onMouseLeave={(e) => {
                        const relatedTarget = e.relatedTarget;
                        if (!relatedTarget || (relatedTarget instanceof Node && !e.currentTarget.contains(relatedTarget))) {
                          if (!levelType) {
                            setHoveredLevelType(null);
                          }
                        }
                      }}
                    >
                      {/* Left Panel - Level Types */}
                      <div
                        style={{
                          width: '180px',
                          borderRight: `2px solid ${primaryColor}20`,
                          background: theme === 'sun' 
                            ? 'rgba(240, 249, 255, 0.5)'
                            : 'rgba(244, 240, 255, 0.5)',
                          overflowY: 'auto',
                          maxHeight: '300px',
                          scrollbarWidth: 'thin',
                          scrollbarColor: `${primaryColor}40 transparent`
                        }}
                      >
                        {[
                          { value: 'system', label: 'Camkey Level' },
                          { value: 'academic', label: 'Academic Level' },
                          { value: 'cefr', label: 'CEFR Level (A1-C2)' },
                        ].map((type) => (
                          <div
                            key={type.value}
                            onMouseEnter={() => {
                              setHoveredLevelType(type.value);
                              setLevelType(type.value);
                              setSelectedLevel(null);
                            }}
                            style={{
                              padding: '12px 8px',
                              cursor: 'pointer',
                              borderBottom: `1px solid ${primaryColor}10`,
                              background: levelType === type.value
                                ? primaryColorWithAlpha
                                : hoveredLevelType === type.value
                                ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(139, 92, 246, 0.12)')
                                : 'transparent',
                              borderLeft: levelType === type.value
                                ? `4px solid ${primaryColor}`
                                : hoveredLevelType === type.value
                                ? `4px solid ${primaryColor}80`
                                : '4px solid transparent',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <span style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: levelType === type.value
                                ? primaryColor
                                : (theme === 'sun' ? '#000' : '#000')
                            }}>
                              {type.label}
                            </span>
                            {levelType === type.value && (
                              <span style={{ marginLeft: 'auto', color: primaryColor, fontSize: '14px' }}>✓</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Right Panel - Level Options */}
                      <div
                        style={{
                          flex: 1,
                          padding: '16px',
                          overflowY: 'auto',
                          maxHeight: '300px',
                          background: theme === 'sun' ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                          scrollbarWidth: 'thin',
                          scrollbarColor: `${primaryColor}40 transparent`
                        }}
                      >
                        {(hoveredLevelType || levelType) ? (
                          <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {(() => {
                                const activeType = hoveredLevelType || levelType;
                                const options = 
                                  activeType === 'system' ? systemLevels :
                                  activeType === 'academic' ? academicLevels :
                                  activeType === 'cefr' ? cefrLevels :
                                  [];
                                
                                if (!options || options.length === 0) {
                                  return (
                                    <div style={{
                                      padding: '20px',
                                      textAlign: 'center',
                                      color: theme === 'sun' ? '#999' : '#999',
                                      fontSize: '14px'
                                    }}>
                                      {levelType === 'system' ? 'Loading Camkey levels...' : 'No levels available'}
                                    </div>
                                  );
                                }
                                
                                return options.map((option) => (
                                  <div
                                    key={option.value}
                                    onMouseEnter={(e) => {
                                      if (selectedLevel !== option.value) {
                                        e.currentTarget.style.background = theme === 'sun'
                                          ? 'rgba(24, 144, 255, 0.1)'
                                          : 'rgba(139, 92, 246, 0.15)';
                                        e.currentTarget.style.borderColor = `${primaryColor}60`;
                                      }
                                    }}
                                    onClick={() => {
                                      setSelectedLevel(option.value);
                                      setLevelType(hoveredLevelType || levelType);
                                      setIsLevelDropdownOpen(false);
                                      setHoveredLevelType(null);
                                    }}
              style={{
                                      padding: '12px 16px',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      background: selectedLevel === option.value
                                        ? primaryColorWithAlpha
                                        : (theme === 'sun' ? 'rgba(240, 249, 255, 0.5)' : 'rgba(244, 240, 255, 0.3)'),
                                      border: `2px solid ${
                                        selectedLevel === option.value
                                          ? primaryColor
                                          : `${primaryColor}30`
                                      }`,
                                      transition: 'all 0.2s ease',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between'
                                    }}
                                    onMouseLeave={(e) => {
                                      if (selectedLevel !== option.value) {
                                        e.currentTarget.style.background = theme === 'sun'
                                          ? 'rgba(240, 249, 255, 0.5)'
                                          : 'rgba(244, 240, 255, 0.3)';
                                        e.currentTarget.style.borderColor = `${primaryColor}30`;
                                      }
                                    }}
                                  >
                                    <span style={{
                                      fontSize: '14px',
                                      fontWeight: 400,
                                      color: selectedLevel === option.value
                                        ? primaryColor
                                        : (theme === 'sun' ? '#000' : '#000')
                                    }}>
                                      {option.label}
                                    </span>
                                    {selectedLevel === option.value && (
                                      <span style={{ color: primaryColor, fontSize: '16px', fontWeight: 400 }}>✓</span>
                                    )}
                                  </div>
                                ));
                              })()}
                            </div>
                          </>
                        ) : (
                          <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: theme === 'sun' ? '#999' : '#999',
                            fontSize: '14px'
                          }}>
                            Hover over a level type to see options
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                    </div>
                  </div>

                  {/* Additional Description */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography.Text style={{ display: 'block', marginBottom: '8px', color: theme === 'sun' ? '#1E40AF' : '#8377A0', fontSize: '16px', fontWeight: 400 }}>
                      Additional Description
                    </Typography.Text>
                    <TextArea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      autoSize={{ minRows: 4, maxRows: 8 }}
                      placeholder="Optional: Add any additional instructions or context..."
                      style={{
                        width: '100%',
                        fontSize: '14px',
                        borderRadius: '8px',
                        border: `2px solid ${primaryColor}99`,
                        background: theme === 'sun'
                          ? 'rgba(240, 249, 255, 0.5)'
                          : 'rgba(244, 240, 255, 0.3)',
                        outline: 'none',
                        boxShadow: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Vocabulary List (only for generate mode) */}
                {passageMode === 'generate' && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Typography.Text style={{ display: 'block', color: theme === 'sun' ? '#1E40AF' : '#8377A0', fontSize: '16px', fontWeight: 400 }}>
                        Vocabulary List
                      </Typography.Text>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: theme === 'sun' ? 'rgba(24, 144, 255, 0.15)' : 'rgba(139, 92, 246, 0.2)',
                        color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                        fontWeight: 600,
                        border: `1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`
                      }}>
                        Passage Only
                      </span>
                    </div>
                    <TextArea
                      value={vocabularyList}
                      onChange={(e) => setVocabularyList(e.target.value)}
                      autoSize={{ minRows: 4, maxRows: 8 }}
                      placeholder="new word..."
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        border: `2px solid ${primaryColor}60`,
                        background: theme === 'sun' ? '#fff' : 'rgba(255, 255, 255, 0.1)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                {/* Manual mode: show CKEditor for manual input */}
                {passageMode === 'manual' && (
                  <div className={`passage-ckeditor-wrapper ${theme}-passage-ckeditor-wrapper`} style={{
                    marginTop: 23,
                    borderRadius: '12px',
                    border: `2px solid ${primaryColor}99`,
                    background: theme === 'sun'
                      ? 'rgba(240, 249, 255, 0.5)'
                      : 'rgba(244, 240, 255, 0.3)',
                    padding: '12px',
                    overflow: 'hidden'
                  }}>
                    <CKEditor
                      editor={ClassicEditor}
                      data={passagePrompt}
                      onChange={(event, editor) => {
                        const data = editor.getData();
                        setPassagePrompt(data);
                      }}
                      config={{
                        ...passageEditorConfig,
                        placeholder: (t('dailyChallenge.pleaseEnterPassage') !== 'dailyChallenge.pleaseEnterPassage' && t('dailyChallenge.pleaseEnterPassage')) || 'Please enter a passage'
                      }}
                      onReady={(editor) => {
                        try {
                          const el = editor.ui?.getEditableElement?.();
                          if (el) {
                            el.style.minHeight = '300px';
                            el.style.color = '#000000';
                            el.style.fontSize = '15px';
                          }
                        } catch (e) {
                          console.error('CKEditor onReady error:', e);
                        }
                      }}
                    />
                  </div>
                )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', marginTop: 16 }}>
              {passageMode === 'generate' && (
                <>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      color: theme === 'sun' ? '#000000' : '#FFFFFF',
                      fontWeight: 600,
                      marginRight: 8
                    }}>Paragraphs:</span>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      style={{
                        width: 100,
                        borderRadius: '8px',
                        border: theme === 'sun'
                          ? '2px solid rgba(113, 179, 253, 0.5)'
                          : '2px solid rgba(138, 122, 255, 0.5)',
                        background: theme === 'sun' ? '#fff' : 'rgba(255, 255, 255, 0.1)',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                      value={numParagraphs}
                      onChange={(e) => setNumParagraphs(parseInt(e.target.value) || 1)}
                    />
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      loading={generatingPassage}
                      onClick={handleGeneratePassage}
                      style={{
                        height: '40px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 500,
                        padding: '0 24px',
                        background: theme === 'sun'
                          ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                          : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                        border: 'none',
                        color: '#000000',
                        boxShadow: theme === 'sun'
                          ? '0 2px 8px rgba(60, 153, 255, 0.3)'
                          : '0 2px 8px rgba(131, 119, 160, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {generatingPassage ? (t('dailyChallenge.generating') || 'Generating...') : 'Generate Passage'}
                    </Button>
                  </div>
                  <Typography.Text
                    style={{
                      fontSize: '12px',
                      fontStyle: 'italic',
                      color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.6)',
                      textAlign: 'right'
                    }}
                  >
                    The generated content is for reference only.
                  </Typography.Text>
                </>
              )}
            </div>

            {/* Generated passage display - Only show after generation, below Generate Passage button */}
            {passageMode === 'generate' && passage && passage.trim() && (
              <>
                <div className={`passage-ckeditor-wrapper ${theme}-passage-ckeditor-wrapper`} style={{
                  marginTop: 0,
                  borderRadius: '12px',
                  border: theme === 'sun'
                    ? '2px solid rgba(113, 179, 253, 0.25)'
                    : '2px solid rgba(138, 122, 255, 0.2)',
                  background: theme === 'sun'
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
                  padding: '12px',
                  overflow: 'hidden'
                }}>
                  <CKEditor
                  editor={ClassicEditor}
                  data={passage}
                  onChange={(event, editor) => {
                    const data = editor.getData();
                    setPassage(data);
                  }}
                  config={passageEditorConfig}
                  onReady={(editor) => {
                    try {
                      const el = editor.ui?.getEditableElement?.();
                      if (el) {
                        el.style.minHeight = '400px';
                        el.style.height = 'auto';
                        el.style.color = '#000000';
                        el.style.fontSize = '15px';
                        el.style.lineHeight = '1.6';
                      }
                      // Also set for the main container
                      const mainEl = editor.ui?.getEditableElement?.()?.closest('.ck-editor__main');
                      if (mainEl) {
                        mainEl.style.minHeight = '400px';
                      }
                        } catch (e) {
                      console.error('CKEditor onReady error:', e);
                        }
                      }}
                    />
                </div>
              </>
            )}
            </>
            )}
          </Card>
          )}

          {/* Right: Question Type Configuration */}
          <Card
            className={`prompt-description-card ${theme}-prompt-description-card`}
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
              backdropFilter: 'blur(10px)',
              animation: 'none'
            }}
          >
            {/* Title on its own line to align with left card title */}
            <Title level={3} style={{ margin: 0, fontSize: '26px', color: theme === 'sun' ? '#1890ff' : '#8B5CF6', marginTop: 0, textAlign: 'center' }}>
              Question Settings
            </Title>
            {/* Hidden input to allow direct upload from the option card */}
            <input
              ref={uploadInputRef}
              type="file"
              accept=".doc,.docx"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files && e.target.files[0];
                if (!f) {
                  setUploadedFile(null);
                  setUploadedFileName('');
                  return;
                }

                const fileExtension = f.name.split('.').pop().toLowerCase();
                if (!['doc', 'docx'].includes(fileExtension)) {
                  spaceToast.error(`Unsupported file type: .${fileExtension}. Supported types: .doc, .docx`);
                  e.target.value = '';
                  setUploadedFile(null);
                  setUploadedFileName('');
                  return;
                }

                if (f.size > MAX_FILE_MB * 1024 * 1024) {
                  spaceToast.error(`File too large. Max ${MAX_FILE_MB}MB`);
                  e.target.value = '';
                  setUploadedFile(null);
                  setUploadedFileName('');
                  return;
                }
                setUploadedFileName(f.name);
                setUploadedFile(f);
              }}
            />
            {/* Mode chooser for right side */}
            {questionSettingsMode === null && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 12, minHeight: '460px' }}>
                <div style={{ width: '100%' }}>
                  {/* Option: Upload File */}
                  <Card
                    hoverable
                    onClick={() => {
                      setQuestionSettingsMode('upload');
                      if (uploadInputRef.current) {
                        uploadInputRef.current.click();
                      }
                    }}
                    style={{
                      borderRadius: '12px',
                      border: theme === 'sun'
                        ? '2px solid rgba(82, 196, 26, 0.3)'
                        : '2px solid rgba(138, 122, 255, 0.3)',
                      background: theme === 'sun'
                        ? 'linear-gradient(135deg, rgba(237, 250, 230, 0.5) 0%, rgba(207, 244, 192, 0.4) 100%)'
                        : 'rgba(255, 255, 255, 0.5)',
                      cursor: 'pointer',
                      marginBottom: 16
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <CloudUploadOutlined style={{ fontSize: 24, color: '#000000' }} />
                      <Typography.Text strong style={{ color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>
                        Generate question from file
                      </Typography.Text>
                    </div>
                  </Card>
                  {uploadedFileName && (
                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8, textAlign: 'center' }}>{uploadedFileName}</div>
                  )}

                  {/* Option: Settings Manually */}
                  <Card
                    hoverable
                    onClick={() => setQuestionSettingsMode('manual')}
                    style={{
                      borderRadius: '12px',
                      border: theme === 'sun'
                        ? '2px solid rgba(113, 179, 253, 0.3)'
                        : '2px solid rgba(138, 122, 255, 0.3)',
                      background: theme === 'sun'
                        ? 'linear-gradient(135deg, rgba(230, 245, 255, 0.5) 0%, rgba(186, 231, 255, 0.4) 100%)'
                        : 'rgba(255, 255, 255, 0.5)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <EditOutlined style={{ fontSize: 24, color: '#000000' }} />
                      <Typography.Text strong style={{ color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>
                        Generate question from settings
                      </Typography.Text>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {questionSettingsMode === 'upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16, width: '100%', minHeight: 536 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <label
                    htmlFor="question-upload-input"
                    style={{
                      width: 380,
                      height: 220,
                      borderRadius: 20,
                      border: `2px dashed ${theme === 'sun' ? 'rgba(24, 144, 255, 0.7)' : 'rgba(139, 92, 246, 0.7)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240, 249, 255, 0.6))' : 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(244, 240, 255, 0.6))',
                      boxShadow: theme === 'sun' ? '0 8px 24px rgba(24, 144, 255, 0.08)' : '0 8px 24px rgba(139, 92, 246, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <CloudUploadOutlined style={{ fontSize: 56, color: theme === 'sun' ? '#1890ff' : '#8B5CF6' }} />
                      <Typography.Text style={{ fontWeight: 700, color: theme === 'sun' ? '#1E40AF' : '#6F61A8' }}>Click to upload</Typography.Text>
                      <Typography.Text style={{ fontSize: 12, opacity: 0.8, color: theme === 'sun' ? '#0f172a' : '#d1cde8' }}>
                        Supported: .doc, .docx — Max {MAX_FILE_MB}MB
                      </Typography.Text>
                    </div>
                  </label>
                  <input
                    id="question-upload-input"
                    type="file"
                    accept=".doc,.docx"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (!f) {
                        setUploadedFile(null);
                        setUploadedFileName('');
                        return;
                      }

                      const fileExtension = f.name.split('.').pop().toLowerCase();
                      if (!['doc', 'docx'].includes(fileExtension)) {
                        spaceToast.error(`Unsupported file type: .${fileExtension}. Supported types: .doc, .docx`);
                        e.target.value = '';
                        setUploadedFile(null);
                        setUploadedFileName('');
                        return;
                      }

                      if (f.size > MAX_FILE_MB * 1024 * 1024) {
                        spaceToast.error(`File too large. Max ${MAX_FILE_MB}MB`);
                        e.target.value = '';
                        setUploadedFile(null);
                        setUploadedFileName('');
                        return;
                      }
                      setUploadedFileName(f.name);
                      setUploadedFile(f);
                    }}
                  />
                  {uploadedFileName && (
                    <div style={{ 
                      marginTop: 10, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(139, 92, 246, 0.15)',
                      border: `1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`
                    }}>
                      <Typography.Text style={{ 
                        fontSize: 13, 
                        fontWeight: 600, 
                        color: theme === 'sun' ? '#1E40AF' : '#d1cde8',
                        flex: 1
                      }}>
                        {uploadedFileName}
                      </Typography.Text>
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                          setUploadedFileName('');
                          const input = document.getElementById('question-upload-input');
                          if (input) input.value = '';
                        }}
                        style={{
                          color: theme === 'sun' ? '#ff4d4f' : '#ff7875',
                          padding: '0 4px',
                          minWidth: 'auto',
                          height: 'auto'
                        }}
                      />
                    </div>
                  )}
                </div>
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  loading={isGenerating}
                  onClick={handleGenerateFromFile}
                  style={{
                    marginTop: 16,
                    height: '40px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 500,
                    padding: '0 24px',
                    background: theme === 'sun'
                      ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                      : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                    border: 'none',
                    color: '#000000',
                  }}
                >
                  Generate From File
                </Button>
                <Typography.Text
                  style={{
                    display: 'block',
                    marginTop: '8px',
                    fontSize: '12px',
                    fontStyle: 'italic',
                    color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'center',
                    width: '100%'
                  }}
                >
                  The generated content is for reference only.
                </Typography.Text>
              </div>
            )}

            {questionSettingsMode === 'manual' && (
            <>
            {/* Outer container to hold the question types */}
            <div
              style={{
                border: `2px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.6)' : 'rgba(139, 92, 246, 0.6)'}`,
                borderRadius: '16px',
                background: theme === 'sun' ? 'rgba(24, 144, 255, 0.06)' : 'rgba(139, 92, 246, 0.08)',
                padding: '12px',
                boxShadow: theme === 'sun' 
                  ? 'inset 0 0 0 1px rgba(24, 144, 255, 0.05)'
                  : 'inset 0 0 0 1px rgba(139, 92, 246, 0.08)',
                height: '400px',
                overflowY: 'auto',
                marginTop: '12px'
              }}
            >
              {/* Scroll container: show all types with quantity 0-10 */}
              <div className="question-settings-scroll" style={{ height: '360px', overflowY: 'auto', paddingRight: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '16px' }}>
                {availableQuestionTypes.map((qt) => {
                  const cfgIndex = questionTypeConfigs.findIndex(c => c.questionType === qt.value);
                  const current = cfgIndex >= 0 ? questionTypeConfigs[cfgIndex] : { numberOfQuestions: 0 };
                  return (
                    <div key={qt.value} style={{ borderRadius: 12, padding: 16, border: `2px solid ${qt?.color}30`, background: theme === 'sun' ? `linear-gradient(135deg, ${qt?.bgColor}, rgba(255,255,255,0.8))` : `linear-gradient(135deg, ${qt?.bgColor}, rgba(255,255,255,0.05))` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: `${qt?.color}20`, border: `2px solid ${qt?.color}40` }}>{qt?.icon}</div>
                        <div style={{ flex: 1, fontWeight: 600, color: '#000000' }}>{qt.label}</div>
                        <Tooltip title={t('dailyChallenge.numberOfQuestions') || 'Number of Questions'}>
                          <Input
                            type="number"
                            min={0}
                            value={current.numberOfQuestions}
                            onChange={(e) => handleNumberOfQuestionsChange(cfgIndex, Math.max(0, parseInt(e.target.value) || 0))}
                            style={{
                              width: 80,
                              borderRadius: '8px',
                              border: theme === 'sun'
                                ? `2px solid ${qt?.color || '#1890ff'}40`
                                : `2px solid ${qt?.color || '#8B5CF6'}40`,
                              background: theme === 'sun' ? '#fff' : 'rgba(255, 255, 255, 0.1)',
                              fontSize: '14px',
                              color: '#000000',
                              fontWeight: 600
                            }}
                          />
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
            </>
            )}

            {/* Generate Questions button below Question Settings */}
            {questionSettingsMode === 'manual' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', marginTop: 16, justifyContent: 'center' }}>
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  loading={isGenerating}
                  onClick={handleGenerateWithAI}
                  style={{
                    height: '40px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 500,
                    padding: '0 24px',
                    background: theme === 'sun'
                      ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                      : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                    border: 'none',
                    color: '#000000',
                    boxShadow: theme === 'sun'
                      ? '0 2px 8px rgba(60, 153, 255, 0.3)'
                      : '0 2px 8px rgba(131, 119, 160, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isGenerating ? (t('dailyChallenge.generating') || 'Generating...') : 'Generate Questions'}
                </Button>
                <Typography.Text
                  style={{
                    fontSize: '12px',
                    fontStyle: 'italic',
                    color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'center'
                  }}
                >
                  The generated content is for reference only.
                </Typography.Text>
              </div>
            )}
          </Card>
        </div>
        </Card>

          {/* Full-screen loading overlay */}
          {(isGenerating || generatingPassage) && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme === 'sun'
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(240,249,255,0.92))'
                  : 'linear-gradient(135deg, rgba(18, 18, 27, 0.92), rgba(34, 27, 60, 0.92))',
                backdropFilter: 'blur(8px)',
                transition: 'none',
                animation: 'none'
              }}
            >
              <Card
                style={{
                  width: '520px',
                  maxWidth: '90vw',
                  borderRadius: '24px',
                  border: theme === 'sun'
                    ? `2px solid ${primaryColor}40`
                    : `2px solid ${primaryColor}50`,
                  background: theme === 'sun'
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 249, 255, 0.98) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)',
                  boxShadow: theme === 'sun'
                    ? '0 12px 48px rgba(24, 144, 255, 0.2)'
                    : '0 12px 48px rgba(139, 92, 246, 0.3)',
                  padding: '32px',
                  transition: 'none',
                  animation: 'none',
                  transform: 'none'
                }}
                bodyStyle={{ padding: 0 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px' }}>
                  {/* AI Icon */}
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: theme === 'sun'
                        ? `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`
                        : `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}15)`,
                      border: `3px solid ${primaryColor}40`,
                      boxShadow: theme === 'sun'
                        ? `0 8px 24px ${primaryColor}20`
                        : `0 8px 24px ${primaryColor}30`,
                      animation: 'none',
                      transition: 'none',
                      transform: 'none'
                    }}
                  >
                    <span style={{ fontSize: '48px' }}>🤖</span>
                  </div>

                  {/* Title */}
                  <div>
                    <Title level={3} style={{ margin: 0, marginBottom: '8px', fontSize: '24px', fontWeight: 700, color: primaryColor }}>
                      {t('dailyChallenge.aiThinking') || 'AI is thinking...'}
                    </Title>
                    <div style={{ fontSize: '15px', color: theme === 'sun' ? '#64748b' : '#94a3b8', fontWeight: 500 }}>
                      {generatingPassage 
                        ? 'Generating passage based on your settings'
                        : (t('dailyChallenge.generatingQuestions') || 'Generating questions based on your prompt')}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', padding: '0 8px' }}>
                    <div style={{ position: 'relative', width: '100%', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: '100%',
                          height: '32px',
                          borderRadius: '16px',
                          background: theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(139, 92, 246, 0.15)',
                          position: 'relative',
                          overflow: 'visible',
                          border: `2px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(139, 92, 246, 0.2)'}`
                        }}
                      >
                        <div
                          style={{
                            width: `${generationProgress}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
                            borderRadius: '14px',
                            transition: 'width 0.3s ease',
                            position: 'relative',
                            boxShadow: '0 2px 8px rgba(255, 165, 0, 0.3)',
                            overflow: 'visible'
                          }}
                        >
                          {generationProgress > 0 && (
                            <div
                              style={{
                                position: 'absolute',
                                right: '-20px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '48px',
                                height: '48px',
                                zIndex: 10,
                                animation: 'astroBounce 1s ease-in-out infinite'
                              }}
                            >
                              <img
                                src="/img/astro.png"
                                alt="Astro"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          fontSize: '14px',
                          fontWeight: 700,
                          color: theme === 'sun' ? '#0F172A' : '#FFFFFF',
                          textShadow: theme === 'sun'
                            ? '0 1px 2px rgba(255, 255, 255, 0.9)'
                            : '0 1px 2px rgba(0, 0, 0, 0.6)',
                          zIndex: 5,
                          pointerEvents: 'none'
                        }}
                      >
                        {generationProgress}%
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: theme === 'sun' ? '#94a3b8' : '#64748b', 
                      fontWeight: 400,
                      marginTop: '4px',
                      textAlign: 'center'
                    }}>
                      {generatingPassage 
                        ? (generationProgress < 30 ? 'Analyzing settings...' :
                           generationProgress < 60 ? 'Creating passage...' :
                           generationProgress < 90 ? 'Finalizing content...' :
                           'Almost done...')
                        : (generationProgress < 30 ? 'Analyzing passage...' :
                           generationProgress < 60 ? 'Creating questions...' :
                           generationProgress < 90 ? 'Finalizing content...' :
                           'Almost done...')}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Preview (exact UI reused from AIGenerateQuestions) */}
          {showPreview && (
            <div style={{ marginTop: '24px' }}>
              {questions.map((question) => (
                <div
                  key={question.id}
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
                  {/* Header with Edit/Delete buttons */}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Typography.Text strong style={{ 
                        fontSize: '16px', 
                        color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
                      }}>
                        {question.title}
                      </Typography.Text>
                      <Typography.Text style={{ 
                        fontSize: '14px', 
                        color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                        fontStyle: 'italic'
                      }}>
                        {question.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' :
                         question.type === 'MULTIPLE_SELECT' ? 'Multiple Select' :
                         question.type === 'TRUE_OR_FALSE' ? 'True/False' :
                         question.type === 'FILL_IN_THE_BLANK' ? 'Fill in the Blank' :
                         question.type === 'DROPDOWN' ? 'Dropdown' :
                         question.type === 'DRAG_AND_DROP' ? 'Drag and Drop' :
                         question.type === 'REARRANGE' ? 'Rearrange' :
                         question.type === 'REWRITE' ? 'Re-write' : question.type}
                      </Typography.Text>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                        <Typography.Text style={{ fontSize: '14px', fontWeight: 600 }}>
                          {question.points} {question.points === 1 ? 'point' : 'points'}
                        </Typography.Text>
                      </div>
                      <Tooltip title={t('common.edit') || 'Edit Question'}>
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEditQuestion(question.id)}
                          style={{ 
                            width: '40px', 
                            height: '40px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            color: '#1890ff',
                            background: 'rgba(24, 144, 255, 0.1)',
                            border: '1px solid rgba(24, 144, 255, 0.2)'
                          }}
                        />
                      </Tooltip>
                      <Tooltip title={t('dailyChallenge.deleteQuestion') || 'Delete Question'}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteQuestion(question.id)}
                          style={{ 
                            width: '40px', 
                            height: '40px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            color: '#ff4d4f',
                            background: 'rgba(255, 77, 79, 0.1)',
                            border: '1px solid rgba(255, 77, 79, 0.2)'
                          }}
                        />
                      </Tooltip>
                    </div>
                  </div>

                  {/* Content Area (copied behaviors) */}
                  <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
                    {/* Fill in the Blank (match AIGenerateQuestions rendering) */}
                    {question.type === 'FILL_IN_THE_BLANK' && (Array.isArray(question.blanks) || Array.isArray(question.content?.data)) && (
                      <div style={{ marginBottom: '16px' }}>
                        <Typography.Text style={{ 
                          fontSize: '15px', 
                          fontWeight: 350,
                          lineHeight: '1.8',
                          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {(() => {
                            const text = question.questionText || question.question || '';
                            const blanks = question.blanks || [];
                            // Support both legacy underscores and [[pos_X]] placeholders
                            if (text.includes('[[pos_')) {
                              // Build lookup map from content.data by positionId
                              const contentItems = Array.isArray(question.content?.data) ? question.content.data : [];
                              const positionIdToValue = new Map();
                              contentItems.forEach(item => {
                                if (item && item.positionId) positionIdToValue.set(String(item.positionId), item.value || '');
                              });

                              const parts = text.split(/(\[\[pos_[a-zA-Z0-9]+\]\])/g);
                              let blankRenderIndex = 0; // Fallback ordering
                              return parts.map((part, idx) => {
                                const isPlaceholder = /^\[\[pos_[a-zA-Z0-9]+\]\]$/.test(part);
                                if (!isPlaceholder) {
                                  return <React.Fragment key={idx}>{part}</React.Fragment>;
                                }
                                const match = part.match(/^\[\[pos_([a-zA-Z0-9]+)\]\]$/);
                                const posId = match ? match[1] : undefined;
                                // Prefer exact match via content map; fallback to blanks by order
                                const mappedValue = (posId && positionIdToValue.get(String(posId))) || undefined;
                                const displayText = mappedValue
                                  || blanks[blankRenderIndex]?.answer
                                  || blanks[blankRenderIndex]?.placeholder
                                  || '';
                                const key = `blank-${idx}`;
                                blankRenderIndex += 1;
                                return (
                                  <span
                                    key={key}
                                    style={{
                                      display: 'inline-block',
                                      minWidth: '120px',
                                      maxWidth: '200px',
                                      minHeight: '32px',
                                      padding: '4px 12px',
                                      margin: '0 8px',
                                      background: '#E9EEFF94',
                                      border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                      borderRadius: '8px',
                                      cursor: 'default',
                                      outline: 'none',
                                      verticalAlign: 'middle',
                                      lineHeight: '1.4',
                                      fontSize: '14px',
                                      boxSizing: 'border-box',
                                      color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                      textAlign: 'center'
                                    }}
                                  >
                                    {displayText}
                                  </span>
                                );
                              });
                            }
                            // Legacy rendering using underscores
                            return text.split('______').map((part, idx) => (
                              <React.Fragment key={idx}>
                                {part}
                                {idx < blanks.length && (
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      minWidth: '120px',
                                      maxWidth: '200px',
                                      minHeight: '32px',
                                      padding: '4px 12px',
                                      margin: '0 8px',
                                      background: '#E9EEFF94',
                                      border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                      borderRadius: '8px',
                                      cursor: 'default',
                                      outline: 'none',
                                      verticalAlign: 'middle',
                                      lineHeight: '1.4',
                                      fontSize: '14px',
                                      boxSizing: 'border-box',
                                      color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                      textAlign: 'center'
                                    }}
                                  >
                                    {blanks[idx]?.placeholder || ''}
                                  </span>
                                )}
                              </React.Fragment>
                            ));
                          })()}
                        </Typography.Text>
                      </div>
                    )}

                    {/* Dropdown */}
                    {question.type === 'DROPDOWN' && (
                      <div style={{
                        fontSize: '15px', 
                        fontWeight: 350,
                        lineHeight: '1.8',
                        color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                        marginBottom: '16px'
                      }}>
                        {(() => {
                          const text = question.questionText || question.question || '';
                          const contentItems = Array.isArray(question.content?.data) ? question.content.data : [];
                          const positionIdToGroup = new Map();
                          contentItems.forEach(item => {
                            if (!positionIdToGroup.has(String(item.positionId))) positionIdToGroup.set(String(item.positionId), []);
                            positionIdToGroup.get(String(item.positionId)).push(item);
                          });
                          const parts = text.split(/(\[\[pos_[a-zA-Z0-9]+\]\])/g);
                          let encounteredIndex = 0;
                          let renderedAny = false;
                          const rendered = parts.map((part, idx) => {
                            const match = part.match(/^\[\[pos_([a-zA-Z0-9]+)\]\]$/);
                            if (!match) {
                              return <React.Fragment key={idx}>{part}</React.Fragment>;
                            }
                            const posId = match[1];
                            const group = positionIdToGroup.get(String(posId)) || [];
                            const correct = group.find(opt => opt.correct === true)?.value || '';
                            const incorrects = group.filter(opt => opt.correct === false).map(opt => opt.value).filter(Boolean);
                            const options = [correct, ...incorrects];
                            renderedAny = true;
                            const selectKey = `${question.id}_${encounteredIndex++}`;
                            const selectedValue = dropdownSelections[selectKey] ?? (correct || '');
                            return (
                              <select
                                key={`dd-${idx}`}
                                value={selectedValue}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setDropdownSelections(prev => ({ ...prev, [selectKey]: value }));
                                }}
                                style={{
                                  display: 'inline-block',
                                  minWidth: '140px',
                                  height: '36px',
                                  padding: '4px 12px',
                                  margin: '0 8px',
                                  background: theme === 'sun' 
                                    ? 'rgba(24, 144, 255, 0.08)' 
                                    : 'rgba(138, 122, 255, 0.12)',
                                  border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: selectedValue === correct ? 'rgb(24, 144, 255)' : (theme === 'sun' ? '#1890ff' : '#8B5CF6'),
                                  cursor: 'pointer',
                                  outline: 'none',
                                  textAlign: 'center'
                                }}
                              >
                                {options.map(opt => (
                                  <option key={opt} value={opt} style={{ color: opt === correct ? 'rgb(24, 144, 255)' : '#000000' }}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            );
                          });
                          if (renderedAny) return rendered;
                          return text;
                        })()}
                      </div>
                    )}

                    {/* Drag and Drop */}
                    {question.type === 'DRAG_AND_DROP' && (
                      <>
                        <div style={{ display: 'flex', gap: '24px', minHeight: '300px' }}>
                          <div style={{
                            flex: '1',
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
                              Complete the sentence by dragging words into the blanks:
                            </Typography.Text>

                            <div style={{ 
                              fontSize: '15px', 
                              fontWeight: 350,
                              lineHeight: '2.4',
                              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                              marginBottom: '16px'
                            }}>
                              {(() => {
                                const text = question.questionText || question.sentence || '';
                                const items = Array.isArray(question.content?.data) ? question.content.data : [];
                                const posToCorrect = new Map();
                                items.filter(it => it.positionId && it.correct === true).forEach((it) => {
                                  posToCorrect.set(String(it.positionId), it.value);
                                });
                                if (/\[\[pos_/.test(text)) {
                                  const parts = text.split(/(\[\[pos_([a-zA-Z0-9]+)\]\])/g);
                                  return parts.map((part, idx) => {
                                    const m = part.match(/^\[\[pos_([a-zA-Z0-9]+)\]\]$/);
                                    if (!m) {
                                      const cleanPart = part
                                        .replace(/[a-zA-Z0-9]{6,}/g, '')
                                        .replace(/[a-zA-Z]{3,}[0-9]{3,}/g, '')
                                        .replace(/[0-9]{3,}[a-zA-Z]{3,}/g, '')
                                        .trim();
                                      return <React.Fragment key={idx}>{cleanPart}</React.Fragment>;
                                    }
                                    const val = posToCorrect.get(m[1]) || '';
                                    return (
                                      <div key={`ddp-${idx}`}
                                        style={{
                                          display: 'inline-block',
                                          minWidth: '120px',
                                          height: '32px',
                                          margin: '0 8px',
                                          background: theme === 'sun' ? 'rgba(24, 144, 255, 0.15)' : 'rgba(138, 122, 255, 0.18)',
                                          border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                          borderRadius: '8px',
                                          padding: '4px 12px',
                                          fontSize: '15px',
                                          color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                          verticalAlign: 'top',
                                          lineHeight: '1.4',
                                          textAlign: 'center',
                                          fontWeight: 600,
                                        }}
                                      >{val}</div>
                                    );
                                  });
                                }
                                const cleanText = text.replace(/\[\[pos_[a-zA-Z0-9]+\]\]/g, '___');
                                return cleanText;
                              })()}
                            </div>
                          </div>

                          {/* Right Column - Available words */}
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
                              {(() => {
                                const items = Array.isArray(question.content?.data) ? question.content.data : [];
                                const incorrect = items.length > 0
                                  ? items.filter(it => !it.positionId || it.correct === false).map(it => it.value)
                                  : (question.availableWords || []);
                                return incorrect.map((word, wordIdx) => (
                                  <div
                                    key={wordIdx}
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
                                      userSelect: 'none',
                                      minWidth: '80px',
                                      textAlign: 'center',
                                    }}
                                  >
                                    {word}
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* MCQ, MULTISELECT, TRUE/FALSE */}
                    {(question.type === 'MULTIPLE_CHOICE' || question.type === 'MULTIPLE_SELECT' || question.type === 'TRUE_OR_FALSE') && question.options && (
                      <>
                        <div 
                          style={{ 
                            fontSize: '15px', 
                            fontWeight: 350,
                            marginBottom: '12px',
                            display: 'block',
                            lineHeight: '1.8',
                            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
                          }}
                          className="html-content"
                          dangerouslySetInnerHTML={{ __html: question.question }}
                        />

                        <div className="question-options" style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(2, 1fr)', 
                          gap: '14px', 
                          marginTop: '12px' 
                        }}>
                          {question.options.map((option, idx) => {
                            const isCorrect = option.isCorrect;
                            const isMultipleSelect = question.type === 'MULTIPLE_SELECT';
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
                                    ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.08)' : 'rgba(82, 196, 26, 0.12)')
                                    : theme === 'sun'
                                      ? 'rgba(255, 255, 255, 0.85)'
                                      : 'rgba(255, 255, 255, 0.7)',
                                  border: `2px solid ${
                                    isCorrect
                                      ? '#52c41a'
                                      : theme === 'sun' 
                                        ? 'rgba(113, 179, 253, 0.2)' 
                                        : 'rgba(138, 122, 255, 0.15)'
                                  }`,
                                  borderRadius: '12px',
                                  fontSize: '14px',
                                  position: 'relative',
                                  cursor: 'pointer',
                                  minHeight: '50px',
                                  boxSizing: 'border-box'
                                }}
                              >
                                {(question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_OR_FALSE') && (
                                  <input 
                                    type="radio" 
                                    name={`question-${question.id}`}
                                    checked={isCorrect}
                                    readOnly
                                    style={{ 
                                      width: '18px',
                                      height: '18px',
                                      accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6'
                                    }} 
                                  />
                                )}
                                {isMultipleSelect && (
                                  <input 
                                    type="checkbox" 
                                    checked={isCorrect}
                                    readOnly
                                    style={{ 
                                      width: '18px',
                                      height: '18px',
                                      accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6'
                                    }} 
                                  />
                                )}
                                <span style={{ 
                                  flexShrink: 0, 
                                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                                  fontWeight: '600',
                                  fontSize: '16px'
                                }}>
                                  {option.key}.
                                </span>
                                <div
                                  style={{ 
                                    fontSize: '14px',
                                    color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                    fontWeight: '350',
                                    flex: 1
                                  }}
                                  className="html-content"
                                  dangerouslySetInnerHTML={{ __html: option.text }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Rearrange */}
                    {question.type === 'REARRANGE' && (
                      <>
                        <Typography.Text style={{ 
                          fontSize: '15px', 
                          fontWeight: 350,
                          marginBottom: '16px',
                          display: 'block',
                          lineHeight: '1.8',
                          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
                        }}>
                          {question.question || 'Rearrange the words by dragging them into the correct order:'}
                        </Typography.Text>
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
                            {(() => {
                              // Build posId → value map
                              const items = Array.isArray(question.content?.data) ? question.content.data : [];
                              const posToVal = new Map();
                              items.forEach(it => { if (it && it.positionId) posToVal.set(String(it.positionId), it.value); });
                              // Extract placeholder order from questionText
                              const text = question.questionText || '';
                              const placeholderOrder = [];
                              const re = /\[\[pos_([a-zA-Z0-9]+)\]\]/g;
                              let m;
                              while ((m = re.exec(text)) !== null) {
                                placeholderOrder.push(m[1]);
                              }
                              // Render each value as chip in correct order
                              return placeholderOrder.map((posId, index) => (
                                <div
                                  key={index}
                                  style={{
                                    padding: '12px 20px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                    borderRadius: '12px',
                                    background: theme === 'sun' 
                                      ? 'rgba(24, 144, 255, 0.08)' 
                                      : 'rgba(138, 122, 255, 0.12)',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                    cursor: 'not-allowed',
                                    userSelect: 'none',
                                    minWidth: '80px',
                                    textAlign: 'center',
                                    boxShadow: theme === 'sun' 
                                      ? '0 2px 8px rgba(24, 144, 255, 0.15)' 
                                      : '0 2px 8px rgba(138, 122, 255, 0.15)'
                                  }}
                                >
                                  {posToVal.get(posId) || ''}
                                </div>
                              ));
                            })()}
                          </div>
                        </div>

                        {/* Source Words */}
                        <div style={{
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
                            {(question.sourceItems || []).map((word, wordIdx) => (
                              <div
                                key={wordIdx}
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
                                  cursor: 'not-allowed',
                                  userSelect: 'none',
                                  minWidth: '80px',
                                  textAlign: 'center',
                                  boxShadow: theme === 'sun' 
                                    ? '0 2px 8px rgba(24, 144, 255, 0.15)' 
                                    : '0 2px 8px rgba(138, 122, 255, 0.15)'
                                }}
                              >
                                {word}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Rewrite not supported on this page */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modals */}
      {editingQuestion && editingQuestion.type === 'MULTIPLE_CHOICE' && (
        <MultipleChoiceModal visible={isEditModalVisible} onCancel={() => { setIsEditModalVisible(false); setEditingQuestion(null); }} onSave={handleSaveFromModal} questionData={editingQuestion} />
      )}
      {editingQuestion && editingQuestion.type === 'MULTIPLE_SELECT' && (
        <MultipleSelectModal visible={isEditModalVisible} onCancel={() => { setIsEditModalVisible(false); setEditingQuestion(null); }} onSave={handleSaveFromModal} questionData={editingQuestion} />
      )}
      {editingQuestion && editingQuestion.type === 'TRUE_OR_FALSE' && (
        <TrueFalseModal visible={isEditModalVisible} onCancel={() => { setIsEditModalVisible(false); setEditingQuestion(null); }} onSave={handleSaveFromModal} questionData={editingQuestion} />
      )}
      {editingQuestion && editingQuestion.type === 'FILL_IN_THE_BLANK' && (
        <FillBlankModal visible={isEditModalVisible} onCancel={() => { setIsEditModalVisible(false); setEditingQuestion(null); }} onSave={handleSaveFromModal} questionData={editingQuestion} />
      )}
      {editingQuestion && editingQuestion.type === 'DROPDOWN' && (
        <DropdownModal visible={isEditModalVisible} onCancel={() => { setIsEditModalVisible(false); setEditingQuestion(null); }} onSave={handleSaveFromModal} questionData={editingQuestion} />
      )}
      {editingQuestion && editingQuestion.type === 'DRAG_AND_DROP' && (
        <DragDropModal visible={isEditModalVisible} onCancel={() => { setIsEditModalVisible(false); setEditingQuestion(null); }} onSave={handleSaveFromModal} questionData={editingQuestion} />
      )}
      {editingQuestion && editingQuestion.type === 'REARRANGE' && (
        <ReorderModal visible={isEditModalVisible} onCancel={() => { setIsEditModalVisible(false); setEditingQuestion(null); }} onSave={handleSaveFromModal} questionData={editingQuestion} />
      )}
      {/* Rewrite modal not used on this page */}
    </ThemedLayout>
  );
};

export default AIGenerateReading;


