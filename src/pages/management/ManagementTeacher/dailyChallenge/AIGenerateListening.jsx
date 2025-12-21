import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Input, Tooltip, Typography, Upload, Space, Modal, Spin } from "antd";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, SaveOutlined, ThunderboltOutlined, CheckOutlined, CloudUploadOutlined, CloseOutlined } from "@ant-design/icons";
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
import "./AIGenerateQuestions.css";
import TableSpinner from "../../../../component/spinner/TableSpinner";

const { Title } = Typography;
const { Text } = Typography;
const { TextArea } = Input;

const AIGenerateListening = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  
  const titleParts = [];
  
  const initialAiSource = useMemo(() => {
    try {
      const search = new URLSearchParams(location.search || '');
      const fromQuery = search.get('source');
      if (fromQuery === 'settings' || fromQuery === 'file') {
        return fromQuery;
      }
    } catch {
      // ignore
    }
    return location.state?.aiSource || null;
  }, [location.search, location.state?.aiSource]);

  const challengeInfo = useMemo(() => {
    const params = new URLSearchParams(location.search || '');
    const info = {
      classId: location.state?.classId || params.get('classId') || null,
      className: location.state?.className || params.get('className') || null,
      challengeId: location.state?.challengeId || id,
      challengeName: location.state?.challengeName || params.get('challengeName') || null,
      challengeType: 'LISTENING',
      aiSource: initialAiSource, // 'settings' or 'file'
    };
    titleParts.length = 0;
    if (info.className) titleParts.push(info.className);
    if (info.challengeName) titleParts.push(info.challengeName);
    return info;
  }, [id, location.state?.classId, location.state?.className, location.state?.challengeId, location.state?.challengeName, initialAiSource, location.search]);
  
  usePageTitle(titleParts.length ? titleParts : '');

  const [prompt, setPrompt] = useState(""); // Transcript content
  const [description, setDescription] = useState(""); // Description field
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [questions, setQuestions] = useState([]);
  // Track dropdown selections for interactive preview (same as Reading page)
  const [dropdownSelections, setDropdownSelections] = useState({});
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
const [warningVisible, setWarningVisible] = useState(false);
const [warningMessage, setWarningMessage] = useState('');
const warningActionRef = useRef(null);
const [errorVisible, setErrorVisible] = useState(false);
const [errorMessage, setErrorMessage] = useState('');
  const uploadInputRef = useRef(null);
  // Match AIGenerateReading behavior: null (chooser), 'manual', 'upload'
  const [questionSettingsMode, setQuestionSettingsMode] = useState(null);
  const [hierarchy, setHierarchy] = useState(null);
  // Audio upload state (listening requirement)
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [uploadedAudioFileName, setUploadedAudioFileName] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [showSpinner, setShowSpinner] = useState(true);
  const [spinnerCompleted, setSpinnerCompleted] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  
  // State for new API fields
  const [levelType, setLevelType] = useState(null); // 'system', 'academic', 'cefr'
  const [selectedLevel, setSelectedLevel] = useState(null); // Selected level value/id
  const [systemLevels, setSystemLevels] = useState([]); // Fetched Camkey levels (published levels)
  
  // Dropdown menu states
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const [hoveredLevelType, setHoveredLevelType] = useState(null);

  const primaryColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
  const primaryColorWithAlpha = theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)';
  const MAX_FILE_MB = 10;
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

  // CKEditor config for transcript editor
  const transcriptEditorConfig = useMemo(() => ({
    toolbar: {
      items: [
        'undo', 'redo', '|',
        'heading', '|',
        'bold', 'italic', 'underline', '|',
        'bulletedList', 'numberedList', '|',
        'link', 'imageUpload', '|',
        'blockQuote', '|',
        'alignment', '|',
        'fontSize', 'fontColor', 'fontBackgroundColor'
      ],
      shouldNotGroupWhenFull: true, // Disable toolbar collapse/grouping
      removeItems: ['insertTable'] // Remove table button
    },
    removePlugins: ['StickyToolbar', 'Table', 'TableToolbar', 'TableProperties', 'TableCellProperties'],
    extraPlugins: [CustomUploadAdapterPlugin],
    // Disable floating toolbar behavior
    ui: {
      viewportOffset: {
        top: 0
      }
    }
  }), []);

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

  const availableQuestionTypes = useMemo(() => [
    { value: "MULTIPLE_CHOICE", label: t('dailyChallenge.multipleChoice') || 'Multiple Choice', icon: '📝', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "MULTIPLE_SELECT", label: t('dailyChallenge.multipleSelect') || 'Multiple Select', icon: '☑️', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "TRUE_OR_FALSE", label: t('dailyChallenge.trueFalse') || 'True/False', icon: '✅', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "FILL_IN_THE_BLANK", label: t('dailyChallenge.fillBlank') || 'Fill in the Blank', icon: '✏️', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "DROPDOWN", label: t('dailyChallenge.dropdown') || 'Dropdown', icon: '📋', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "DRAG_AND_DROP", label: t('dailyChallenge.dragAndDrop') || 'Drag and Drop', icon: '🔄', color: primaryColor, bgColor: primaryColorWithAlpha },
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


  const [questionTypeConfigs, setQuestionTypeConfigs] = useState(() => availableQuestionTypes.map(q => ({ questionType: q.value, numberOfQuestions: 0 })));

  const handleNumberOfQuestionsChange = useCallback((index, value) => {
    setQuestionTypeConfigs(prev => prev.map((item, i) => (i === index ? { ...item, numberOfQuestions: value } : item)));
  }, []);

  // Initialize right panel (settings/upload) from aiSource (URL query or navigation state)
  useEffect(() => {
    const search = new URLSearchParams(location.search || '');
    const sourceFromQuery = search.get('source');
    const source = sourceFromQuery || location.state?.aiSource || null;
    if (source === 'settings') {
      setQuestionSettingsMode('manual');
    } else if (source === 'file') {
      setQuestionSettingsMode('upload');
    }
  }, [location.search, location.state?.aiSource]);

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

  // Fetch Camkey levels (published levels) for level dropdown
  useEffect(() => {
    let mounted = true;
    const fetchCamkeyLevels = async () => {
      try {
        const params = {
          page: 0,
          size: 1000, // Get all published levels
        };
        
        const res = await levelManagementApi.getPublishedLevels({ params });
        
        // Handle different response structures
        let levelsData = [];
        if (res && res.data) {
          // Check if it's a paginated response with content array
          if (res.data.content && Array.isArray(res.data.content)) {
            levelsData = res.data.content;
          } else if (Array.isArray(res.data)) {
            levelsData = res.data;
          } else if (res.data.data && Array.isArray(res.data.data)) {
            levelsData = res.data.data;
          }
        }
        
        // Filter only PUBLISHED levels (though API should already return only published)
        const publishedLevels = levelsData.filter(level => 
          level.status === 'PUBLISHED' || !level.status // Include if status is PUBLISHED or undefined
        );
        
        if (mounted) {
          setSystemLevels(publishedLevels.map(level => ({
            value: String(level.id || level.levelId),
            label: level.levelName || level.name || `Level ${level.id || level.levelId}`,
          })));
        }
      } catch (e) {
        console.error('Error fetching Camkey levels:', e);
        if (mounted) setSystemLevels([]);
      }
    };
    fetchCamkeyLevels();
    return () => { mounted = false; };
  }, []);

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
          // Check both q?.options and q?.content?.data (backend may use either)
          const backendOptionsFromOptions = Array.isArray(q?.options) ? q.options : [];
          const backendOptionsFromContent = Array.isArray(q?.content?.data) ? q.content.data : [];
          const backendOptions = backendOptionsFromOptions.length > 0 ? backendOptionsFromOptions : backendOptionsFromContent;
          const hasBackend = backendOptions.length > 0;
          
          // Fallback if no backend options
          const correct = String(q?.correctAnswer ?? q?.answer ?? '').toLowerCase();
          const isTrue = correct === 'true' || correct === 't' || correct === '1';
          const fallbackOptions = [
            { key: 'A', text: 'True', isCorrect: isTrue === true },
            { key: 'B', text: 'False', isCorrect: isTrue === false },
          ];
          
          const options = hasBackend
            ? backendOptions.map((o, i) => ({ key: toKey(i), text: o?.text ?? o?.value ?? '', isCorrect: Boolean(o?.isCorrect || o?.correct) }))
            : fallbackOptions;
          return { id: nextId(), type: 'TRUE_OR_FALSE', title: `Question ${counter}`, question: q?.question || q?.questionText || '', options, points: q?.points ?? q?.weight ?? q?.score ?? 1 };
        }
        case 'FILL_IN_THE_BLANK':
        case 'DROPDOWN':
        case 'DRAG_AND_DROP': {
          const textRaw = q?.questionText || q?.question || '';
          const contentItems = Array.isArray(q?.content?.data) ? q.content.data : [];
          // Collect all positionIds from content.data to remove stray tokens
          const positionIds = new Set();
          contentItems.forEach(it => {
            if (it?.positionId) {
              // Add both with and without "pos_" prefix
              const posId = String(it.positionId);
              positionIds.add(posId);
              positionIds.add(posId.replace(/^pos_/, ''));
            }
          });
          // Clean rare backend artifacts like literal "positionId" tokens or positionId tokens appearing as standalone words
          const cleanArtifacts = (val) => {
            let cleaned = String(val || '')
              // drop the literal word positionId
              .replace(/\bpositionId\b/gi, '');
            
            // Remove positionId tokens that appear as standalone words (not in [[pos_xxx]] placeholders)
            if (positionIds.size > 0) {
              positionIds.forEach(posId => {
                // Escape special regex characters
                const escaped = posId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Remove as whole word only (not part of placeholder)
                cleaned = cleaned.replace(new RegExp(`\\b${escaped}\\b`, 'g'), '');
              });
            }
            
            return cleaned
              .replace(/\s+/g, ' ')
              .trim();
          };
          const text = cleanArtifacts(textRaw);
          return {
            id: nextId(),
            type,
            title: `Question ${counter}`,
            question: text,
            questionText: text,
            content: { data: contentItems },
            points: q?.points ?? q?.weight ?? q?.score ?? 1
          };
        }
        case 'REARRANGE': {
          // Use questionText
          const text = q?.questionText || q?.question || '';
          const contentItems = Array.isArray(q?.content?.data) ? q.content.data : [];
          
          // Extract position order from questionText (e.g., [[pos_a1b2]] [[pos_c3d4]] ...)
          const positionOrder = [];
          const positionMatches = text.matchAll(/\[\[pos_([a-zA-Z0-9]+)\]\]/g);
          for (const match of positionMatches) {
            positionOrder.push(match[1]);
          }
          
          // Build a map of positionId -> item for quick lookup
          const positionMap = new Map();
          contentItems.forEach(item => {
            if (item?.positionId) {
              positionMap.set(String(item.positionId), item);
            }
          });
          
          // Sort contentItems according to the order in questionText
          const sortedItems = [];
          positionOrder.forEach(posId => {
            const item = positionMap.get(String(posId));
            if (item) {
              sortedItems.push(item);
            }
          });
          
          // If there are items not in questionText, append them at the end
          contentItems.forEach(item => {
            if (item?.positionId && !positionOrder.includes(String(item.positionId))) {
              sortedItems.push(item);
            }
          });
          
          // Use sorted items to get correct order
          const words = sortedItems.length > 0 
            ? sortedItems.map(it => it.value)
            : contentItems.map(it => it.value);
          
          // Shuffle for sourceItems (available words)
          const shuffledWords = (() => {
            const copy = [...words];
            for (let i = copy.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
          })();
          
          return {
            id: nextId(),
            type: 'REARRANGE',
            title: `Question ${counter}`,
            // Show human-friendly instruction; keep placeholders only in questionText
            question: t('dailyChallenge.rearrangeWordsByDragging', 'Rearrange the words by dragging them into the correct order:'),
            questionText: text || '',
            sourceItems: shuffledWords, // Available words (được shuffle)
            correctOrder: words,        // Thứ tự đúng theo questionText
            content: { data: sortedItems.length > 0 ? sortedItems : contentItems },
            points: q?.points ?? q?.weight ?? q?.score ?? 1,
          };
        }
        default:
          return null;
      }
    }).filter(Boolean).map((q, idx) => ({ ...q, id: idx + 1, title: `Question ${idx + 1}` }));
  }, [t]);

  const handleUploadAudio = useCallback(async (file) => {
    try {
      const allowed = ['audio/mp3', 'audio/mpeg'];
      if (!allowed.includes(file.type)) {
        spaceToast.error(t('dailyChallenge.pleaseUploadMp3File', 'Please upload an MP3 file'));
        return false;
      }
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        spaceToast.error(t('dailyChallenge.fileSizeMustBeLessThan10MB', 'File size must be less than 10MB'));
        return false;
      }
      setIsProcessingAudio(true);
      setUploadedAudioFileName(file.name);
      const res = await dailyChallengeApi.uploadFile(file);
      let url = null;
      if (res?.data?.url) url = res.data.url; else if (res?.data) url = res.data; else if (typeof res === 'string') url = res;
      if (!url) throw new Error('Upload failed: No URL returned');
      const preview = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioPreviewUrl(preview);
      spaceToast.success(t('dailyChallenge.audioFileUploadedSuccessfully', 'Audio file "{{fileName}}" uploaded successfully!', { fileName: file.name }));
    } catch (e) {
      console.error('Audio upload error:', e);
      const beErr = getBackendMessage(e);
      spaceToast.error(beErr || e?.message || 'Audio upload failed');
    } finally {
      setIsProcessingAudio(false);
    }
    return false;
  }, [getBackendMessage, t]);

  const handleGenerateWithAI = useCallback(async () => {
    // Validate: Check if at least one question type is selected
    const selectedConfigs = (questionTypeConfigs || [])
      .filter((c) => Number(c.numberOfQuestions) > 0);
    
    if (selectedConfigs.length === 0) {
      spaceToast.error(t('dailyChallenge.atLeastOneQuestionTypeConfig', 'At least one question type config is required'));
      return;
    }
    
    // Validate total number of questions does not exceed 50
    const totalQuestions = selectedConfigs.reduce((sum, c) => sum + (Number(c.numberOfQuestions) || 0), 0);
    if (totalQuestions > 50) {
      spaceToast.error(t('dailyChallenge.maxQuestionsExceeded', 'Maximum total of 50 questions is allowed'));
      return;
    }
    
    if (!prompt.trim()) {
      const enterPromptMsg = t('dailyChallenge.pleaseEnterPrompt', {
        defaultValue: 'Please enter a prompt',
      });
      spaceToast.error(enterPromptMsg);
      return;
    }
    try {
      setIsGenerating(true);
      setShowPreview(false);
      // Prepare level value: for Camkey levels, send ID as string; for others, send the value directly
      const levelValue = selectedLevel ? String(selectedLevel) : '';
      
      // Backend requires sections array. Align with Reading generator payload structure
      const payload = {
        challengeId: challengeInfo.challengeId,
        sections: [
          {
            section: {
              id: 0,
              sectionTitle: 'Listening Section',
              sectionsUrl: audioUrl || '',
              sectionsContent: prompt,
              orderNumber: 1,
              resourceType: 'FILE',
            },
            questionTypeConfigs: selectedConfigs.map((c) => ({
              questionType: c.questionType,
              numberOfQuestions: Math.max(0, Number(c.numberOfQuestions) || 0),
            })),
          },
        ],
        description: description || '',
        level: levelValue,
      };
      // Note: backend API for generation currently accepts description only; audio is required by UI but not sent
      const res = await dailyChallengeApi.generateContentBasedQuestions(payload);
      // axiosClient already unwraps response.data, so res is already the data object
      const responseData = res?.data || res;
      
      // Handle error field: if error is not null, show error modal
      if (responseData?.error != null) {
        const errorMsg = typeof responseData.error === 'string' 
          ? responseData.error 
          : (responseData.error?.message || JSON.stringify(responseData.error));
        setErrorMessage(errorMsg);
        setErrorVisible(true);
        setIsGenerating(false);
        return;
      }
      
      // Handle warning field: if error is null and warning exists, show confirmation modal
      // Check if error is null/undefined and warning has a value
      if (responseData?.error == null && responseData?.warning) {
        const warningMsg = typeof responseData.warning === 'string' 
          ? responseData.warning 
          : (responseData.warning?.message || JSON.stringify(responseData.warning));
        warningActionRef.current = () => processQuestionsResponse(responseData);
        setWarningMessage(warningMsg);
        setWarningVisible(true);
        return;
      }
      
      // No error and no warning, process normally
      await processQuestionsResponse(responseData);
      
      async function processQuestionsResponse(data) {
        // Extract sections/questions from response
        let rawList = [];
        if (Array.isArray(data?.sections)) {
          rawList = data.sections;
        } else if (Array.isArray(data)) {
          rawList = data;
        } else if (Array.isArray(data?.questions)) {
          rawList = data.questions;
        } else if (Array.isArray(data?.data)) {
          rawList = data.data;
        } else if (Array.isArray(data?.data?.questions)) {
          rawList = data.data.questions;
        } else if (Array.isArray(data?.result?.questions)) {
          rawList = data.result.questions;
        }
        
        const normalized = normalizeQuestionsFromAI(rawList);
        // Small delay to show 100% before closing
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!normalized.length) {
          spaceToast.warning(t('dailyChallenge.aiDidNotReturnQuestions', 'AI did not return any questions'));
          setQuestions([]);
          setShowPreview(false);
        } else {
          setQuestions(normalized);
          setShowPreview(true);
          const successMsg = t('dailyChallenge.aiQuestionsGenerated', {
            defaultValue: 'AI questions generated successfully!',
          });
          spaceToast.success(successMsg);
        }
        setIsGenerating(false);
      }
    } catch (err) {
      console.error('Generate listening AI questions error:', err);
      const beErr = getBackendMessage(err);
      spaceToast.error(beErr || err?.response?.data?.error || t('dailyChallenge.failedToGenerateQuestions', 'Failed to generate questions'));
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, description, challengeInfo.challengeId, questionTypeConfigs, t, normalizeQuestionsFromAI, selectedLevel, audioUrl, getBackendMessage]);

  const handleGenerateFromFile = useCallback(async () => {
    if (!uploadedFile) {
      spaceToast.error(t('dailyChallenge.pleaseSelectFileToGenerate', 'Please select a file to generate questions'));
      return;
    }
    try {
      setIsGenerating(true);
      setShowPreview(false);
      const res = await dailyChallengeApi.parseQuestionsFromFile(uploadedFile, prompt || '');
      // axiosClient already unwraps response.data, so res is already the data object
      const responseData = res?.data || res;
      
      // Handle error field: if error is not null, show error modal
      if (responseData?.error != null) {
        const errorMsg = typeof responseData.error === 'string' 
          ? responseData.error 
          : (responseData.error?.message || JSON.stringify(responseData.error));
        setErrorMessage(errorMsg);
        setErrorVisible(true);
        setIsGenerating(false);
        return;
      }
      
      // Handle warning field: if error is null and warning exists, show confirmation modal
      // Check if error is null/undefined and warning has a value
      if (responseData?.error == null && responseData?.warning) {
        const warningMsg = typeof responseData.warning === 'string' 
          ? responseData.warning 
          : (responseData.warning?.message || JSON.stringify(responseData.warning));
        warningActionRef.current = () => processFileQuestionsResponse(responseData);
        setWarningMessage(warningMsg);
        setWarningVisible(true);
        return;
      }
      
      // No error and no warning, process normally
      await processFileQuestionsResponse(responseData);
      
      async function processFileQuestionsResponse(data) {
        // Extract transcript/content returned by backend so the section can be saved
        const detectedTranscript =
          data?.transcript ||
          data?.content ||
          data?.sectionsContent ||
          '';
        const fallbackTranscript = prompt || '';
        const finalTranscript = (detectedTranscript && String(detectedTranscript).trim()) || fallbackTranscript;
        if (finalTranscript) {
          setPrompt(finalTranscript);
        }
        
        // Extract sections/questions from response
        let rawList = [];
        if (Array.isArray(data?.sections)) {
          rawList = data.sections;
        } else if (Array.isArray(data)) {
          rawList = data;
        } else if (Array.isArray(data?.questions)) {
          rawList = data.questions;
        } else if (Array.isArray(data?.data?.questions)) {
          rawList = data.data.questions;
        } else if (Array.isArray(data?.data)) {
          rawList = data.data;
        } else if (Array.isArray(data?.result?.questions)) {
          rawList = data.result.questions;
        }
        
        const normalized = normalizeQuestionsFromAI(rawList);
        // Small delay to show 100% before closing
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!normalized.length) {
          spaceToast.warning(t('dailyChallenge.noQuestionsParsedFromFile', 'No questions parsed from file'));
          setQuestions([]);
          setShowPreview(false);
        } else {
          setQuestions(normalized);
          setShowPreview(true);
          spaceToast.success(t('dailyChallenge.questionsGeneratedFromFile', 'Questions generated from file'));
        }
        setIsGenerating(false);
      }
    } catch (err) {
      console.error('Generate listening from file error:', err);
      const beErr = getBackendMessage(err);
      spaceToast.error(beErr || err?.response?.data?.error || t('dailyChallenge.failedToGenerateFromFile', 'Failed to generate from file'));
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedFile, prompt, normalizeQuestionsFromAI, getBackendMessage, t]);


  const handleBack = useCallback(() => {
    const userRole = user?.role?.toLowerCase();
    const contentPath = userRole === 'teaching_assistant'
      ? `/teaching-assistant/daily-challenges/detail/${id}/content`
      : `/teacher/daily-challenges/detail/${id}/content`;
    navigate(contentPath, { state: { challengeId: id, challengeName: challengeInfo.challengeName, classId: challengeInfo.classId, className: challengeInfo.className } });
  }, [navigate, id, challengeInfo, user]);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
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
    spaceToast.success(t('dailyChallenge.questionDeletedSuccessfully', 'Question deleted successfully'));
  }, [t]);
  const handleSaveFromModal = useCallback((updated) => {
    setQuestions(prev => prev.map(q => q.id === updated.id ? { ...q, ...updated, title: q.title } : q));
    setIsEditModalVisible(false);
    setEditingQuestion(null);
    spaceToast.success(t('dailyChallenge.questionUpdatedSuccessfully', 'Question updated successfully'));
  }, [t]);

  const handleSave = useCallback(async () => {
    if (!audioUrl) {
      spaceToast.error(t('dailyChallenge.pleaseUploadMp3AudioFile', 'Please upload an MP3 audio file'));
      return;
    }
    if (!prompt.trim()) {
      spaceToast.error(t('dailyChallenge.promptIsEmpty', 'Prompt is empty'));
      return;
    }
    try {
      setSaving(true);
      let beforeSections = [];
      try {
        const existing = await dailyChallengeApi.getSectionsByChallenge(id, { page: 0, size: 100 });
        beforeSections = Array.isArray(existing?.data) ? existing.data : (Array.isArray(existing) ? existing : []);
      } catch (e) { beforeSections = []; }
      const baseOrder = beforeSections.reduce((max, item) => {
        const ord = Number(item?.section?.orderNumber ?? item?.orderNumber ?? 0);
        return Number.isFinite(ord) && ord > max ? ord : max;
      }, 0);

      const sanitizeFillContent = (data) => {
        const items = Array.isArray(data) ? data : [];
        const correctItems = items.filter((it) => it && it.correct === true);
        if (correctItems.length > 0) {
          // Keep only the first correct answer; drop incorrect/extra
          return [correctItems[0]];
        }
        return items;
      };

      const toApiQuestion = (q, orderNumber) => {
        const toData = (d, { forFill } = {}) => {
          const items = Array.isArray(d) ? d : [];
          if (forFill) return sanitizeFillContent(items);
          return items;
        };
        switch (q.type) {
          case 'MULTIPLE_CHOICE':
          case 'MULTIPLE_SELECT':
          case 'TRUE_OR_FALSE':
            return { questionText: q.question || q.questionText || '', orderNumber, weight: q.points || 1, questionType: q.type === 'TRUE_OR_FALSE' ? 'TRUE_OR_FALSE' : q.type, content: { data: toData((q.options || []).map((o, idx) => ({ id: o.key || `opt${idx + 1}`, value: o.text || '', correct: o.isCorrect === true }))) }, toBeDeleted: false };
          case 'FILL_IN_THE_BLANK':
          case 'DROPDOWN':
          case 'DRAG_AND_DROP':
            return { questionText: q.questionText || q.question || '', orderNumber, weight: q.points || 1, questionType: q.type, content: { data: toData(q.content?.data, { forFill: q.type === 'FILL_IN_THE_BLANK' }) }, toBeDeleted: false };
          case 'REARRANGE': {
            const rawItems = toData(q.content?.data);
            // sanitize: require positionId and value; normalize positionId to plain number/string
            const sanitizedItems = rawItems
              .filter((it) => it && it.value && it.positionId !== undefined && it.positionId !== null && String(it.positionId).trim() !== '')
              .map((it) => ({
                ...it,
                positionId: String(it.positionId).replace(/^pos_/, ''),
              }));
            
            // Get order from questionText if it contains placeholders, otherwise use correctOrder
            let sortedItems = sanitizedItems;
            const questionTextWithPlaceholders = q.questionText || q.question || '';
            
            if (/\[\[pos_/.test(questionTextWithPlaceholders)) {
              // Parse position order from questionText
              const positionOrder = [];
              const positionMatches = questionTextWithPlaceholders.matchAll(/\[\[pos_([a-zA-Z0-9]+)\]\]/g);
              for (const match of positionMatches) {
                positionOrder.push(match[1]);
              }
              
              // Build a map of positionId -> item for quick lookup
              const positionMap = new Map();
              sanitizedItems.forEach(item => {
                if (item?.positionId) {
                  positionMap.set(String(item.positionId), item);
                }
              });
              
              // Sort items according to the order in questionText
              sortedItems = [];
              positionOrder.forEach(posId => {
                const item = positionMap.get(String(posId));
                if (item) {
                  sortedItems.push(item);
                }
              });
              
              // If there are items not in questionText, append them at the end
              sanitizedItems.forEach(item => {
                if (item?.positionId && !positionOrder.includes(String(item.positionId))) {
                  sortedItems.push(item);
                }
              });
            } else if (Array.isArray(q.correctOrder) && q.correctOrder.length > 0) {
              // Fallback: use correctOrder to determine sequence
              const valueToItem = new Map();
              sanitizedItems.forEach(item => {
                if (item?.value) {
                  valueToItem.set(String(item.value), item);
                }
              });
              
              sortedItems = [];
              q.correctOrder.forEach(value => {
                const item = valueToItem.get(String(value));
                if (item) {
                  sortedItems.push(item);
                }
              });
              
              // Append any remaining items
              sanitizedItems.forEach(item => {
                if (!q.correctOrder.includes(item.value)) {
                  sortedItems.push(item);
                }
              });
            }
            
            // Backend requires placeholders [[pos_X]] present in questionText
            const placeholderText = sortedItems.length
              ? sortedItems
                  .map((it) => `[[pos_${it.positionId}]]`)
                  .join(' ')
              : (questionTextWithPlaceholders || '');
            
            return {
              questionText: placeholderText,
              orderNumber,
              weight: q.points || 1,
              questionType: 'REARRANGE',
              content: { data: sortedItems },
              toBeDeleted: false,
            };
          }
          default:
            return { questionText: q.question || '', orderNumber, weight: 1, questionType: 'MULTIPLE_CHOICE', content: { data: [] }, toBeDeleted: false };
        }
      };
      const apiQuestions = (questions || []).map((q, idx) => toApiQuestion(q, idx + 1));
      const sectionData = { section: { sectionTitle: 'AI Generated Listening', sectionsUrl: audioUrl || '', sectionsContent: prompt, orderNumber: baseOrder + 1, resourceType: 'FILE' }, questions: apiQuestions };
      const resp = await dailyChallengeApi.saveSectionWithQuestions(id, sectionData);
      try {
        const afterRes = await dailyChallengeApi.getSectionsByChallenge(id, { page: 0, size: 100 });
        const afterSections = Array.isArray(afterRes?.data) ? afterRes.data : (Array.isArray(afterRes) ? afterRes : []);
        const beforeIds = new Set(beforeSections.map(s => s?.section?.id ?? s?.id));
        const existingOrdered = beforeSections.map(s => ({ id: s?.section?.id ?? s?.id, orderNumber: Number(s?.section?.orderNumber ?? s?.orderNumber ?? 0) })).filter(x => x.id != null).sort((a, b) => a.orderNumber - b.orderNumber);
        const newOnes = afterSections.filter(s => !beforeIds.has(s?.section?.id ?? s?.id)).map(s => ({ id: s?.section?.id ?? s?.id, createdAt: s?.section?.createdAt ?? s?.createdAt ?? '' })).filter(x => x.id != null).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
        const finalBulk = []; let seq = 0; existingOrdered.forEach(x => finalBulk.push({ id: x.id, orderNumber: ++seq })); newOnes.forEach(x => finalBulk.push({ id: x.id, orderNumber: ++seq }));
        if (finalBulk.length > 0) await dailyChallengeApi.bulkUpdateSections(id, finalBulk);
      } catch (reorderError) { /* ignore */ }
      spaceToast.success(resp?.message || t('dailyChallenge.saveSuccess') || 'Saved successfully');
      const userRole = user?.role?.toLowerCase();
      const contentPath = userRole === 'teaching_assistant' ? `/teaching-assistant/daily-challenges/detail/${id}/content` : `/teacher/daily-challenges/detail/${id}/content`;
      navigate(contentPath, { state: { challengeId: id, challengeName: challengeInfo.challengeName, classId: challengeInfo.classId, className: challengeInfo.className } });
    } catch (err) {
      console.error('Save AI listening section error:', err);
      const beErr = getBackendMessage(err);
      spaceToast.error(beErr || err?.response?.data?.error || t('dailyChallenge.failedToSaveChallenge', 'Failed to save'));
    } finally { setSaving(false); }
  }, [id, prompt, questions, navigate, user, challengeInfo, t, audioUrl, getBackendMessage]);

  const headerSubtitle = useMemo(() => {
    const classNameFromState = challengeInfo.className;
    const challengeNameFromState = challengeInfo.challengeName;

    const classNameFromHierarchy =
      hierarchy?.className ||
      hierarchy?.class?.name ||
      hierarchy?.clazz?.name ||
      null;
    const challengeNameFromHierarchy =
      hierarchy?.challengeName ||
      hierarchy?.challenge?.challengeName ||
      hierarchy?.challenge?.name ||
      null;

    const finalClassName = classNameFromState || classNameFromHierarchy;
    const finalChallengeName = challengeNameFromState || challengeNameFromHierarchy;

    if (finalClassName && finalChallengeName) {
      return `${finalClassName} / ${finalChallengeName}`;
    }
    if (finalChallengeName) {
      return finalChallengeName;
    }
    return null;
  }, [challengeInfo.className, challengeInfo.challengeName, hierarchy]);

  const customHeader = (
    <header className={`themed-header ${theme}-header`}>
      <nav className="themed-navbar">
        <div className="themed-navbar-content" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className={`class-menu-back-button ${theme}-class-menu-back-button`}
              style={{ height: '32px', borderRadius: '8px', fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(0, 0, 0, 0.1)', background: '#ffffff', color: '#000000', backdropFilter: 'blur(10px)', transition: 'all 0.3s ease' }}
            >
              {t('common.back')}
            </Button>
            <div style={{ fontSize: '18px', fontWeight: 600, color: theme === 'sun' ? '#1E40AF' : '#FFFFFF', textShadow: theme === 'sun' ? 'none' : '0 0 10px rgba(134, 134, 134, 0.5)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px', fontWeight: 300, opacity: 0.5 }}>|</span>
              <span>
                {headerSubtitle || t('dailyChallenge.aiQuestionGeneration', 'AI Question Generation')}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button 
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              className={`create-button ${theme}-create-button`}
              style={{ height: '40px', borderRadius: '8px', fontWeight: 500, fontSize: '16px', padding: '0 24px', border: 'none', transition: 'all 0.3s ease', background: theme === 'sun' ? 'linear-gradient(135deg, #66AEFF, #3C99FF)' : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)', color: '#000000', boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)' }}
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
    <>
      <Modal
        title={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 0',
            }}
          >
            <span
              style={{
                fontSize: '30px',
                lineHeight: 1,
              }}
            >
              ⚠️
            </span>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: 'rgb(24, 144, 255)',
              }}
            >
              {t('dailyChallenge.warning', 'Warning')}
            </span>
          </div>
        }
        open={warningVisible}
        centered
        maskClosable={false}
        okText={t('dailyChallenge.continue', 'Continue')}
        cancelText={t('dailyChallenge.cancel', 'Cancel')}
        width={500}
        bodyStyle={{
          padding: '30px 40px',
          fontSize: '16px',
          lineHeight: '1.6',
          textAlign: 'center'
        }}
        okButtonProps={{
          style: {
            background: theme === 'sun' ? 'rgb(113, 179, 253)' : 'linear-gradient(135deg, #7228d9 0%, #9c88ff 100%)',
            borderColor: theme === 'sun' ? 'rgb(113, 179, 253)' : '#7228d9',
            color: theme === 'sun' ? '#000' : '#fff',
            borderRadius: '6px',
            height: '40px',
            fontWeight: '500',
            fontSize: '16px',
            padding: '0 30px',
            transition: 'all 0.3s ease',
            boxShadow: 'none'
          }
        }}
        cancelButtonProps={{
          style: {
            height: '40px',
            fontWeight: '500',
            fontSize: '16px',
            padding: '0 30px',
            borderRadius: '6px'
          }
        }}
        onOk={async () => {
          try {
            if (typeof warningActionRef.current === 'function') {
              await warningActionRef.current();
            }
          } finally {
            setWarningVisible(false);
          }
        }}
        onCancel={() => {
          setWarningVisible(false);
          setIsGenerating(false);
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            {warningMessage}
          </Typography.Paragraph>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Are you sure you want to continue?
          </Typography.Paragraph>
        </div>
      </Modal>
      <Modal
        title={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 0',
            }}
          >
            <span
              style={{
                fontSize: '30px',
                lineHeight: 1,
              }}
            >
              ❌
            </span>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#ff4d4f',
              }}
            >
              {t('dailyChallenge.error', 'Error')}
            </span>
          </div>
        }
        open={errorVisible}
        centered
        maskClosable={false}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setErrorVisible(false);
              setIsGenerating(false);
            }}
            style={{
              background: theme === 'sun' ? '#ff4d4f' : '#ff7875',
              borderColor: theme === 'sun' ? '#ff4d4f' : '#ff7875',
              color: '#fff',
              borderRadius: '6px',
              height: '40px',
              fontWeight: '500',
              fontSize: '16px',
              padding: '0 30px',
              transition: 'all 0.3s ease',
              boxShadow: 'none'
            }}
          >
            {t('common.close', 'Close')}
          </Button>
        ]}
        width={500}
        bodyStyle={{
          padding: '30px 40px',
          fontSize: '16px',
          lineHeight: '1.6',
          textAlign: 'center'
        }}
        onCancel={() => {
          setErrorVisible(false);
          setIsGenerating(false);
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            {errorMessage}
          </Typography.Paragraph>
        </div>
      </Modal>
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
          /* Fix CKEditor toolbar position - prevent floating/sticky behavior */
          .transcript-ckeditor-wrapper .ck-editor {
            position: relative !important;
          }
          
          .transcript-ckeditor-wrapper .ck-editor__top {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            transform: none !important;
            transition: none !important;
            z-index: auto !important;
            width: 100% !important;
          }
          
          .transcript-ckeditor-wrapper .ck-toolbar {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            transform: none !important;
            transition: none !important;
            z-index: auto !important;
            width: 100% !important;
          }
          
          .transcript-ckeditor-wrapper .ck-sticky-panel {
            position: relative !important;
          }
          
          .transcript-ckeditor-wrapper .ck-sticky-panel__content {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            transform: none !important;
            transition: none !important;
          }
          
          /* Fix text color and background for CKEditor content */
          .transcript-ckeditor-wrapper .ck-content {
            color: #000000 !important;
            background: #ffffff !important;
            min-height: 450px !important;
            max-height: 450px !important;
            overflow-y: scroll !important;
            overflow-x: hidden !important;
          }
          
          .transcript-ckeditor-wrapper .ck-editor__editable {
            color: #000000 !important;
            background: #ffffff !important;
            min-height: 450px !important;
            max-height: 450px !important;
            overflow-y: scroll !important;
            overflow-x: hidden !important;
            height: 450px !important;
          }
          
          .transcript-ckeditor-wrapper .ck-editor__main {
            min-height: 450px !important;
            max-height: 450px !important;
            overflow-y: scroll !important;
            overflow-x: hidden !important;
            height: 450px !important;
          }
          
          /* Force scrollbar to always show */
          .transcript-ckeditor-wrapper .ck-content::-webkit-scrollbar,
          .transcript-ckeditor-wrapper .ck-editor__editable::-webkit-scrollbar,
          .transcript-ckeditor-wrapper .ck-editor__main::-webkit-scrollbar {
            width: 12px !important;
            display: block !important;
          }
          
          .transcript-ckeditor-wrapper .ck-content::-webkit-scrollbar-track,
          .transcript-ckeditor-wrapper .ck-editor__editable::-webkit-scrollbar-track,
          .transcript-ckeditor-wrapper .ck-editor__main::-webkit-scrollbar-track {
            background: #f1f1f1 !important;
            border-radius: 6px !important;
          }
          
          .transcript-ckeditor-wrapper .ck-content::-webkit-scrollbar-thumb,
          .transcript-ckeditor-wrapper .ck-editor__editable::-webkit-scrollbar-thumb,
          .transcript-ckeditor-wrapper .ck-editor__main::-webkit-scrollbar-thumb {
            background: #888 !important;
            border-radius: 6px !important;
          }
          
          .transcript-ckeditor-wrapper .ck-content::-webkit-scrollbar-thumb:hover,
          .transcript-ckeditor-wrapper .ck-editor__editable::-webkit-scrollbar-thumb:hover,
          .transcript-ckeditor-wrapper .ck-editor__main::-webkit-scrollbar-thumb:hover {
            background: #555 !important;
          }
        `}
      </style>
      <div
        className={`ai-generate-wrapper allow-motion ${theme}-ai-generate-wrapper`}
        style={mainContentStyle}
      >
        <div style={{ padding: '24px', maxWidth: '1500px', margin: '0 auto' }}>
          {/* Hierarchy info moved inside the main container */}
          <Card
            style={{ 
              borderRadius: '20px', 
              border: theme === 'sun' ? '2px solid rgba(24, 144, 255, 0.35)' : '2px solid rgba(139, 92, 246, 0.35)', 
              background: theme === 'sun' ? 'linear-gradient(180deg, rgba(255,255,255,0.60) 0%, rgba(240,249,255,0.55) 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.50) 0%, rgba(244,240,255,0.45) 100%)', 
              backdropFilter: 'blur(6px)', 
              boxShadow: theme === 'sun' ? '0 8px 24px rgba(24, 144, 255, 0.12)' : '0 8px 24px rgba(139, 92, 246, 0.12)', 
              padding: 16,
              width: '100%'
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr', 
              gap: '20px', 
              alignItems: 'stretch',
              width: '100%'
            }}>
              {/* Left column: AI Generation Settings / Transcript & Audio (for file mode) */}
              {challengeInfo.aiSource !== 'file' ? (
              <Card
                className={`prompt-description-card ${theme}-prompt-description-card`}
                style={{ borderRadius: '16px', border: theme === 'sun' ? '2px solid rgba(113, 179, 253, 0.25)' : '2px solid rgba(138, 122, 255, 0.2)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', backdropFilter: 'blur(10px)', minHeight: '540px', height: '100%', display: 'flex', flexDirection: 'column' }}
                bodyStyle={{ padding: '20px', maxHeight: '600px', overflowY: 'auto' }}
              >
                <Title level={3} style={{ textAlign: 'center', color: theme === 'sun' ? '#1890ff' : '#8B5CF6', marginTop: 0, fontSize: '26px', marginBottom: '20px' }}>{t('dailyChallenge.aiGenerationSettings', 'AI Generation Settings')}</Title>
                
                {/* Chapter and Lesson - Side by Side (Read-only) - Moved to top */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  {/* Chapter - Read-only */}
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Typography.Text style={{ display: 'block', marginBottom: '8px', color: theme === 'sun' ? '#999' : '#999', fontSize: '16px', fontWeight: 400 }}>
                      {t('dailyChallenge.chapter', 'Chapter')}
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
                      {t('dailyChallenge.lesson', 'Lesson')}
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
                    <div style={{ position: 'relative' }}>
                    <Typography.Text style={{ display: 'block', marginBottom: '8px', color: theme === 'sun' ? '#1E40AF' : '#8377A0', fontSize: '16px', fontWeight: 400 }}>
                      {t('dailyChallenge.level', 'Level')} <span style={{ color: 'red' }}>*</span>
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
                        : t('dailyChallenge.selectLevelTypeAndLevel', 'Select level type and level')}
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
                            { value: 'system', label: t('dailyChallenge.camkeyLevel', 'Camkey Level') },
                            { value: 'academic', label: t('dailyChallenge.academicLevel', 'Academic Level') },
                            { value: 'cefr', label: t('dailyChallenge.cefrLevel', 'CEFR Level (A1-C2)') },
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
                                        {levelType === 'system' ? t('dailyChallenge.loadingCamkeyLevels', 'Loading Camkey levels...') : t('dailyChallenge.noLevelsAvailable', 'No levels available')}
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
                              {t('dailyChallenge.hoverOverLevelType', 'Hover over a level type to see options')}
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
                      {t('dailyChallenge.additionalDescription', 'Additional Description')}
                    </Typography.Text>
                    <TextArea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      autoSize={{ minRows: 4, maxRows: 8 }}
                      placeholder={t('dailyChallenge.optionalAddInstructions', 'Optional: Add any additional instructions or context...')}
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

                {/* Audio upload (required for Listening) */}
                <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', position: 'relative' }}>
                    <Title level={5} style={{ margin: 0, color: theme === 'sun' ? '#1E40AF' : '#8377A0', fontSize: '16px', fontWeight: '600' }}>{t('dailyChallenge.audioFileMp3', 'Audio File (MP3)')}</Title>
                    {audioUrl && (
                      <Button
                        type="text"
                        danger
                        size="small"
                        style={{ fontSize: '12px', padding: '0 8px', position: 'absolute', right: 0 }}
                        onClick={() => {
                          if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
                          setUploadedAudioFileName('');
                          setAudioUrl(null);
                          setAudioPreviewUrl(null);
                        }}
                      >
                        {t('dailyChallenge.remove', 'Remove')}
                      </Button>
                    )}
                  </div>

                  {audioUrl ? (
                    <div style={{ padding: '6px', background: theme === 'sun' ? 'rgba(240, 249, 255, 0.5)' : 'rgba(244, 240, 255, 0.3)', borderRadius: '6px', border: theme === 'sun' ? '1px solid rgba(113, 179, 253, 0.3)' : '1px solid rgba(138, 122, 255, 0.3)', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>{uploadedAudioFileName || t('dailyChallenge.audioFileUploaded', 'Audio file uploaded')}</span>
                      </div>
                      <audio controls style={{ width: '100%', height: '26px' }} volume={1.0} onLoadedMetadata={(e) => { e.target.volume = 1.0; }}>
                        <source src={audioPreviewUrl || audioUrl} type="audio/mpeg" />
                        {t('dailyChallenge.yourBrowserDoesNotSupport', 'Your browser does not support the audio element.')}
                      </audio>
                    </div>
                  ) : (
                    <Card hoverable style={{ opacity: isProcessingAudio ? 0.6 : 1, borderRadius: '6px', border: theme === 'sun' ? '1px dashed rgba(113, 179, 253, 0.3)' : '1px dashed rgba(138, 122, 255, 0.3)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(230, 245, 255, 0.3) 0%, rgba(186, 231, 255, 0.2) 100%)' : 'rgba(255, 255, 255, 0.3)', cursor: isProcessingAudio ? 'not-allowed' : 'pointer', textAlign: 'center', padding: '8px' }}>
                      <Upload accept=".mp3" beforeUpload={handleUploadAudio} showUploadList={false} disabled={isProcessingAudio}>
                        <Space direction="vertical" size="small">
                          <span style={{ fontSize: 18 }}>🎵</span>
                          <div>
                            <Text strong style={{ color: theme === 'sun' ? '#1E40AF' : '#8377A0', fontSize: '12px' }}>
                              {isProcessingAudio ? (uploadedAudioFileName ? t('dailyChallenge.processingAudioFile', 'Processing "{{fileName}}"...', { fileName: uploadedAudioFileName }) : t('dailyChallenge.processing', 'Processing...')) : t('dailyChallenge.uploadAudioFile', 'Upload Audio File')}
                            </Text>
                            <br />
                            <Text style={{ color: '#999', fontSize: '10px' }}>{t('dailyChallenge.mp3Max10MB', 'MP3 (max 10MB)')}</Text>
                          </div>
                        </Space>
                      </Upload>
                    </Card>
                  )}
                </div>

                {/* Transcript */}
                <div style={{ marginTop: '16px' }}>
                  <Typography.Text style={{ display: 'block', marginBottom: '8px', color: theme === 'sun' ? '#1E40AF' : '#8377A0', fontSize: '16px', fontWeight: 400 }}>
                    {t('dailyChallenge.transcript', 'Transcript')}
                  </Typography.Text>
                  <div className={`transcript-ckeditor-wrapper ${theme}-transcript-ckeditor-wrapper`} style={{
                    marginTop: 0,
                    borderRadius: '12px',
                    border: `2px solid ${primaryColor}99`,
                    background: theme === 'sun'
                      ? 'rgba(240, 249, 255, 0.5)'
                      : 'rgba(244, 240, 255, 0.3)',
                    padding: '12px',
                    overflow: 'visible',
                    position: 'relative'
                  }}>
                    <CKEditor
                      editor={ClassicEditor}
                      data={prompt}
                      onChange={(event, editor) => {
                        const data = editor.getData();
                        setPrompt(data);
                      }}
                      config={{
                        ...transcriptEditorConfig,
                        placeholder: t('dailyChallenge.pleaseAddTranscript', 'Please add transcript')
                      }}
                      onReady={(editor) => {
                        try {
                          const el = editor.ui?.getEditableElement?.();
                          if (el) {
                            el.style.minHeight = '450px';
                            el.style.maxHeight = '450px';
                            el.style.height = '450px';
                            el.style.overflowY = 'scroll';
                            el.style.overflowX = 'hidden';
                            el.style.color = '#000000';
                            el.style.fontSize = '15px';
                            el.style.background = '#ffffff';
                          }
                          // Also set height for the main editor container
                          const mainElement = editor.ui?.getEditableElement?.()?.closest('.ck-editor__main');
                          if (mainElement) {
                            mainElement.style.height = '450px';
                            mainElement.style.maxHeight = '450px';
                            mainElement.style.overflowY = 'scroll';
                            mainElement.style.overflowX = 'hidden';
                          }
                          // Fix toolbar position - prevent floating/sticky behavior
                          const toolbar = editor.ui?.view?.toolbar?.element;
                          if (toolbar) {
                            toolbar.style.position = 'relative';
                            toolbar.style.top = 'auto';
                            toolbar.style.zIndex = 'auto';
                            toolbar.style.transform = 'none';
                            toolbar.style.transition = 'none';
                          }
                          // Also fix the editor container
                          const editorElement = editor.sourceElement?.parentElement;
                          if (editorElement) {
                            const ckeditorElement = editorElement.closest('.ck-editor');
                            if (ckeditorElement) {
                              ckeditorElement.style.position = 'relative';
                            }
                          }
                        } catch (e) {
                          console.error('CKEditor onReady error:', e);
                        }
                      }}
                    />
                  </div>
                </div>
              </Card>
              ) : (
                // File mode: Show Transcript and Audio upload on the left
                <Card
                  className={`prompt-description-card ${theme}-prompt-description-card`}
                  style={{ borderRadius: '16px', border: theme === 'sun' ? '2px solid rgba(113, 179, 253, 0.25)' : '2px solid rgba(138, 122, 255, 0.2)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', backdropFilter: 'blur(10px)', minHeight: '540px', height: '100%', display: 'flex', flexDirection: 'column' }}
                  bodyStyle={{ padding: '20px', maxHeight: '600px', overflowY: 'auto' }}
                >
                  <Title level={3} style={{ textAlign: 'center', color: theme === 'sun' ? '#1890ff' : '#8B5CF6', marginTop: 0, fontSize: '26px', marginBottom: '20px' }}>
                    {t('dailyChallenge.transcriptAndAudio', 'Transcript & Audio')}
                  </Title>

                  {/* Chapter and Lesson - Read-only */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    {/* Chapter - Read-only */}
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Typography.Text style={{ display: 'block', marginBottom: '8px', color: theme === 'sun' ? '#999' : '#999', fontSize: '16px', fontWeight: 400 }}>
                        {t('dailyChallenge.chapter', 'Chapter')}
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
                        {t('dailyChallenge.lesson', 'Lesson')}
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

                  {/* Audio upload (required for Listening) */}
                  <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', position: 'relative' }}>
                      <Title level={5} style={{ margin: 0, color: theme === 'sun' ? '#1E40AF' : '#8377A0', fontSize: '16px', fontWeight: '600' }}>{t('dailyChallenge.audioFileMp3', 'Audio File (MP3)')}</Title>
                      {audioUrl && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          style={{ fontSize: '12px', padding: '0 8px', position: 'absolute', right: 0 }}
                          onClick={() => {
                            if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
                            setUploadedAudioFileName('');
                            setAudioUrl(null);
                            setAudioPreviewUrl(null);
                          }}
                        >
                          {t('dailyChallenge.remove', 'Remove')}
                        </Button>
                      )}
                    </div>

                    {audioUrl ? (
                      <div style={{ padding: '6px', background: theme === 'sun' ? 'rgba(240, 249, 255, 0.5)' : 'rgba(244, 240, 255, 0.3)', borderRadius: '6px', border: theme === 'sun' ? '1px solid rgba(113, 179, 253, 0.3)' : '1px solid rgba(138, 122, 255, 0.3)', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 500, color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>{uploadedAudioFileName || t('dailyChallenge.audioFileUploaded', 'Audio file uploaded')}</span>
                        </div>
                        <audio controls style={{ width: '100%', height: '26px' }} volume={1.0} onLoadedMetadata={(e) => { e.target.volume = 1.0; }}>
                          <source src={audioPreviewUrl || audioUrl} type="audio/mpeg" />
                          {t('dailyChallenge.yourBrowserDoesNotSupport', 'Your browser does not support the audio element.')}
                        </audio>
                      </div>
                    ) : (
                      <Card hoverable style={{ opacity: isProcessingAudio ? 0.6 : 1, borderRadius: '6px', border: theme === 'sun' ? '1px dashed rgba(113, 179, 253, 0.3)' : '1px dashed rgba(138, 122, 255, 0.3)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(230, 245, 255, 0.3) 0%, rgba(186, 231, 255, 0.2) 100%)' : 'rgba(255, 255, 255, 0.3)', cursor: isProcessingAudio ? 'not-allowed' : 'pointer', textAlign: 'center', padding: '8px' }}>
                        <Upload accept=".mp3" beforeUpload={handleUploadAudio} showUploadList={false} disabled={isProcessingAudio}>
                          <Space direction="vertical" size="small">
                            <span style={{ fontSize: 18 }}>🎵</span>
                            <div>
                              <Text strong style={{ color: theme === 'sun' ? '#1E40AF' : '#8377A0', fontSize: '12px' }}>
                                {isProcessingAudio ? (uploadedAudioFileName ? t('dailyChallenge.processingAudioFile', 'Processing "{{fileName}}"...', { fileName: uploadedAudioFileName }) : t('dailyChallenge.processing', 'Processing...')) : t('dailyChallenge.uploadAudioFile', 'Upload Audio File')}
                              </Text>
                              <br />
                              <Text style={{ color: '#999', fontSize: '10px' }}>{t('dailyChallenge.mp3Max10MB', 'MP3 (max 10MB)')}</Text>
                            </div>
                          </Space>
                        </Upload>
                      </Card>
                    )}
                  </div>

                  {/* Transcript */}
                  <div style={{ marginTop: '16px' }}>
                    <Typography.Text style={{ display: 'block', marginBottom: '8px', color: theme === 'sun' ? '#1E40AF' : '#8377A0', fontSize: '16px', fontWeight: 400 }}>
                      {t('dailyChallenge.transcript', 'Transcript')}
                    </Typography.Text>
                    <div className={`transcript-ckeditor-wrapper ${theme}-transcript-ckeditor-wrapper`} style={{
                      marginTop: 0,
                      borderRadius: '12px',
                      border: `2px solid ${primaryColor}99`,
                      background: theme === 'sun'
                        ? 'rgba(240, 249, 255, 0.5)'
                        : 'rgba(244, 240, 255, 0.3)',
                      padding: '12px',
                      overflow: 'visible',
                      position: 'relative'
                    }}>
                      <CKEditor
                        editor={ClassicEditor}
                        data={prompt}
                        onChange={(event, editor) => {
                          const data = editor.getData();
                          setPrompt(data);
                        }}
                        config={{
                          ...transcriptEditorConfig,
                          placeholder: t('dailyChallenge.pleaseAddTranscript', 'Please add transcript')
                        }}
                        onReady={(editor) => {
                          try {
                            const el = editor.ui?.getEditableElement?.();
                            if (el) {
                              el.style.minHeight = '300px';
                              el.style.color = '#000000';
                              el.style.fontSize = '15px';
                            }
                            // Fix toolbar position - prevent floating/sticky behavior
                            const toolbar = editor.ui?.view?.toolbar?.element;
                            if (toolbar) {
                              toolbar.style.position = 'relative';
                              toolbar.style.top = 'auto';
                              toolbar.style.zIndex = 'auto';
                              toolbar.style.transform = 'none';
                              toolbar.style.transition = 'none';
                            }
                            // Also fix the editor container
                            const editorElement = editor.sourceElement?.parentElement;
                            if (editorElement) {
                              const ckeditorElement = editorElement.closest('.ck-editor');
                              if (ckeditorElement) {
                                ckeditorElement.style.position = 'relative';
                              }
                            }
                          } catch (e) {
                            console.error('CKEditor onReady error:', e);
                          }
                        }}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Right column: Question Type Configuration / Upload */}
              <Card
                className={`prompt-description-card ${theme}-prompt-description-card`}
                style={{ borderRadius: '16px', border: theme === 'sun' ? '2px solid rgba(113, 179, 253, 0.25)' : '2px solid rgba(138, 122, 255, 0.2)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', backdropFilter: 'blur(10px)', height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <Title level={3} style={{ margin: 0, fontSize: '26px', color: theme === 'sun' ? '#1890ff' : '#8B5CF6', marginTop: 0, textAlign: 'center' }}>
                  {questionSettingsMode === 'upload' 
                    ? t('dailyChallenge.generateQuestionsFromFile', 'Generate Questions from File')
                    : questionSettingsMode === 'manual'
                    ? t('dailyChallenge.questionSettings', 'Question Settings')
                    : t('dailyChallenge.questionSettings', 'Question Settings')}
                </Title>
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
                      spaceToast.error(t('dailyChallenge.unsupportedFileType', 'Unsupported file type: .{{extension}}. Supported types: .doc, .docx', { extension: fileExtension }));
                      e.target.value = '';
                      setUploadedFile(null);
                      setUploadedFileName('');
                      return;
                    }

                    if (f.size > MAX_FILE_MB * 1024 * 1024) {
                      spaceToast.error(t('dailyChallenge.fileTooLarge', 'File too large. Max {{max}}MB', { max: MAX_FILE_MB }));
                      e.target.value = '';
                      setUploadedFile(null);
                      setUploadedFileName('');
                      return;
                    }
                    setUploadedFileName(f.name);
                    setUploadedFile(f);
                  }}
                />

                {questionSettingsMode === null && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 12, minHeight: '460px' }}>
                    <div style={{ width: '100%' }}>
                      <Card
                        hoverable
                        onClick={() => {
                          setQuestionSettingsMode('upload');
                          if (uploadInputRef.current) uploadInputRef.current.click();
                        }}
                        style={{ borderRadius: '12px', border: theme === 'sun' ? '2px solid rgba(82, 196, 26, 0.3)' : '2px solid rgba(138, 122, 255, 0.3)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(237, 250, 230, 0.5) 0%, rgba(207, 244, 192, 0.4) 100%)' : 'rgba(255, 255, 255, 0.5)', cursor: 'pointer', marginBottom: 16 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <CloudUploadOutlined style={{ fontSize: 24, color: '#000000' }} />
                          <Typography.Text strong style={{ color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>
                            {t('dailyChallenge.generateQuestionFromFile', 'Generate question from file')}
                          </Typography.Text>
                        </div>
                      </Card>
                      {uploadedFileName && (
                        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8, textAlign: 'center' }}>{uploadedFileName}</div>
                      )}

                      <Card
                        hoverable
                        onClick={() => setQuestionSettingsMode('manual')}
                        style={{ borderRadius: '12px', border: theme === 'sun' ? '2px solid rgba(113, 179, 253, 0.3)' : '2px solid rgba(138, 122, 255, 0.3)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(230, 245, 255, 0.5) 0%, rgba(186, 231, 255, 0.4) 100%)' : 'rgba(255, 255, 255, 0.5)', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <EditOutlined style={{ fontSize: 24, color: '#000000' }} />
                          <Typography.Text strong style={{ color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>
                            {t('dailyChallenge.generateQuestionFromSettings', 'Generate question from settings')}
                          </Typography.Text>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {questionSettingsMode === 'upload' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16, width: '100%', minHeight: 540 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                      <label
                        htmlFor="listening-question-upload-input"
                        style={{ width: 380, height: 220, borderRadius: 20, border: `2px dashed ${theme === 'sun' ? 'rgba(24, 144, 255, 0.7)' : 'rgba(139, 92, 246, 0.7)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240, 249, 255, 0.6))' : 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(244, 240, 255, 0.6))', boxShadow: theme === 'sun' ? '0 8px 24px rgba(24, 144, 255, 0.08)' : '0 8px 24px rgba(139, 92, 246, 0.08)' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                          <CloudUploadOutlined style={{ fontSize: 56, color: theme === 'sun' ? '#1890ff' : '#8B5CF6' }} />
                          <Typography.Text style={{ fontWeight: 700, color: theme === 'sun' ? '#1E40AF' : '#6F61A8' }}>{t('dailyChallenge.clickToUpload', 'Click to upload')}</Typography.Text>
                          <Typography.Text style={{ fontSize: 12, opacity: 0.8, color: theme === 'sun' ? '#0f172a' : '#d1cde8' }}>
                            {t('dailyChallenge.supportedDocxMax', 'Supported: .doc, .docx — Max {{max}}MB', { max: MAX_FILE_MB })}
                          </Typography.Text>
                        </div>
                      </label>
                    </div>
                    <input
                      id="listening-question-upload-input"
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
                          spaceToast.error(t('dailyChallenge.unsupportedFileType', 'Unsupported file type: .{{extension}}. Supported types: .doc, .docx', { extension: fileExtension }));
                          e.target.value = '';
                          setUploadedFile(null);
                          setUploadedFileName('');
                          return;
                        }

                        if (f.size > MAX_FILE_MB * 1024 * 1024) {
                          spaceToast.error(t('dailyChallenge.fileTooLarge', 'File too large. Max {{max}}MB', { max: MAX_FILE_MB }));
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
                            const input = document.getElementById('listening-question-upload-input');
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
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      loading={isGenerating}
                      onClick={handleGenerateFromFile}
                      style={{ marginTop: 16, height: '40px', borderRadius: '8px', fontSize: '16px', fontWeight: 500, padding: '0 24px', background: theme === 'sun' ? 'linear-gradient(135deg, #66AEFF, #3C99FF)' : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)', border: 'none', color: '#000000' }}
                    >
                      {t('dailyChallenge.generateFromFile', 'Generate From File')}
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
                      {t('dailyChallenge.generatedContentForReference', 'The generated content is for reference only.')}
                    </Typography.Text>
                  </div>
                )}

                {questionSettingsMode === 'manual' && (
                  <>
                    <div style={{ border: `2px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.6)' : 'rgba(139, 92, 246, 0.6)'}`, borderRadius: '16px', background: theme === 'sun' ? 'rgba(24, 144, 255, 0.06)' : 'rgba(139, 92, 246, 0.08)', padding: '12px', boxShadow: theme === 'sun' ? 'inset 0 0 0 1px rgba(24, 144, 255, 0.05)' : 'inset 0 0 0 1px rgba(139, 92, 246, 0.08)', height: '400px', overflowY: 'auto', marginTop: '12px' }}>
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
                                      style={{ width: 80, borderRadius: '8px', border: theme === 'sun' ? `2px solid ${qt?.color || '#1890ff'}40` : `2px solid ${qt?.color || '#8B5CF6'}40`, background: theme === 'sun' ? '#fff' : 'rgba(255, 255, 255, 0.1)', fontSize: '14px', color: '#000000', fontWeight: 600 }}
                                    />
                                  </Tooltip>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Generate Questions button below Question Settings */}
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
                        {isGenerating ? (t('dailyChallenge.generating') || 'Generating...') : t('dailyChallenge.generateQuestions', 'Generate Questions')}
                      </Button>
                      <Typography.Text
                        style={{
                          fontSize: '12px',
                          fontStyle: 'italic',
                          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.6)',
                          textAlign: 'center'
                        }}
                      >
                        {t('dailyChallenge.generatedContentForReference', 'The generated content is for reference only.')}
                      </Typography.Text>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </Card>

          {isGenerating && (
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
                      {t('dailyChallenge.generatingQuestions') || 'Generating questions based on your prompt'}
                    </div>
                  </div>

                  {/* Loading Spinner */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <Spin 
                      size="large" 
                      style={{ 
                        color: primaryColor 
                      }}
                    />
                    <div style={{ 
                      fontSize: '14px', 
                      color: theme === 'sun' ? '#64748b' : '#94a3b8', 
                      fontWeight: 400,
                      textAlign: 'center'
                    }}>
                      {t('dailyChallenge.pleaseWait', 'Please wait...')}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {showPreview && (
            <div style={{ marginTop: '24px' }}>
              {questions.map((question) => (
                <div key={question.id} className={`question-item ${theme}-question-item`} style={{ marginBottom: '24px', borderRadius: '16px', padding: '24px', border: '2px solid', borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', backdropFilter: 'blur(10px)' }}>
                  <div className="question-header" style={{ paddingBottom: '14px', marginBottom: '16px', borderBottom: '2px solid', borderBottomColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Typography.Text strong style={{ fontSize: '16px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>{question.title}</Typography.Text>
                      <Typography.Text style={{ fontSize: '14px', color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                        {question.type === 'MULTIPLE_CHOICE' ? t('dailyChallenge.multipleChoice', 'Multiple Choice') :
                         question.type === 'MULTIPLE_SELECT' ? t('dailyChallenge.multipleSelect', 'Multiple Select') :
                         question.type === 'TRUE_OR_FALSE' ? t('dailyChallenge.trueFalse', 'True/False') :
                         question.type === 'FILL_IN_THE_BLANK' ? t('dailyChallenge.fillBlank', 'Fill in the Blank') :
                         question.type === 'DROPDOWN' ? t('dailyChallenge.dropdown', 'Dropdown') :
                         question.type === 'DRAG_AND_DROP' ? t('dailyChallenge.dragAndDrop', 'Drag and Drop') :
                         question.type === 'REARRANGE' ? t('dailyChallenge.rearrange', 'Rearrange') : question.type}
                      </Typography.Text>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                        <Typography.Text style={{ fontSize: '14px', fontWeight: 600 }}>
                          {t('dailyChallenge.weight', 'Weight')}: {question.points}
                        </Typography.Text>
                      </div>
                      <Tooltip title={t('common.edit') || 'Edit Question'}>
                        <Button type="text" icon={<EditOutlined />} onClick={() => handleEditQuestion(question.id)} style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#1890ff', background: 'rgba(24, 144, 255, 0.1)', border: '1px solid rgba(24, 144, 255, 0.2)' }} />
                      </Tooltip>
                      <Tooltip title={t('dailyChallenge.deleteQuestion') || 'Delete Question'}>
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteQuestion(question.id)} style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#ff4d4f', background: 'rgba(255, 77, 79, 0.1)', border: '1px solid rgba(255, 77, 79, 0.2)' }} />
                      </Tooltip>
                    </div>
                  </div>

                  <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
                    {(question.type === 'FILL_IN_THE_BLANK' && (Array.isArray(question.blanks) || Array.isArray(question.content?.data))) && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 350, lineHeight: '1.8', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                          {(() => {
                            const text = question.questionText || question.question || '';
                            const blanks = question.blanks || [];
                            if (text.includes('[[pos_')) {
                              const contentItems = Array.isArray(question.content?.data) ? question.content.data : [];
                              const positionIdToValue = new Map();
                              // Group các option theo positionId để ưu tiên đáp án correct=true
                              const groupedByPos = new Map();
                              contentItems.forEach(item => {
                                if (!item || !item.positionId) return;
                                const key = String(item.positionId);
                                if (!groupedByPos.has(key)) groupedByPos.set(key, []);
                                groupedByPos.get(key).push(item);
                              });
                              // Chọn item correct=true cho mỗi positionId, nếu không có thì lấy item đầu tiên
                              groupedByPos.forEach((items, key) => {
                                const correctItem = items.find(it => it.correct === true) || items[0];
                                positionIdToValue.set(key, correctItem?.value || '');
                              });
                              const parts = text.split(/(\[\[pos_[a-zA-Z0-9]+\]\])/g);
                              let blankRenderIndex = 0;
                              return parts.map((part, idx) => {
                                const isPlaceholder = /^\[\[pos_[a-zA-Z0-9]+\]\]$/.test(part);
                                if (!isPlaceholder) { return <span key={idx} className="html-content" dangerouslySetInnerHTML={{ __html: part }} />; }
                                const match = part.match(/^\[\[pos_([a-zA-Z0-9]+)\]\]$/);
                                const posId = match ? match[1] : undefined;
                                // Map theo positionId, đã ưu tiên đáp án đúng
                                const mappedValue = (posId && positionIdToValue.get(String(posId))) || undefined;
                                const displayText = mappedValue || blanks[blankRenderIndex]?.answer || blanks[blankRenderIndex]?.placeholder || '';
                                const key = `blank-${idx}`;
                                blankRenderIndex += 1;
                                return (
                                  <span key={key} style={{ display: 'inline-block', minWidth: '120px', maxWidth: '200px', minHeight: '32px', padding: '4px 12px', margin: '0 8px', background: '#E9EEFF94', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`, borderRadius: '8px', cursor: 'default', verticalAlign: 'middle', lineHeight: '1.4', fontSize: '14px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', textAlign: 'center' }} className="html-content" dangerouslySetInnerHTML={{ __html: displayText }} />
                                );
                              });
                            }
                            return text.split('______').map((part, idx) => (
                              <React.Fragment key={idx}>
                                <span className="html-content" dangerouslySetInnerHTML={{ __html: part }} />
                                {idx < blanks.length && (
                                  <span style={{ display: 'inline-block', minWidth: '120px', maxWidth: '200px', minHeight: '32px', padding: '4px 12px', margin: '0 8px', background: '#E9EEFF94', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`, borderRadius: '8px', verticalAlign: 'middle', lineHeight: '1.4', fontSize: '14px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', textAlign: 'center' }} className="html-content" dangerouslySetInnerHTML={{ __html: blanks[idx]?.placeholder || '' }} />
                                )}
                              </React.Fragment>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {question.type === 'DROPDOWN' && (
                      <div style={{ fontSize: '15px', fontWeight: 350, lineHeight: '1.8', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', marginBottom: '16px' }}>
                        {(() => {
                          const text = question.questionText || question.question || '';
                          const contentItems = Array.isArray(question.content?.data) ? question.content.data : [];
                          const positionIdToGroup = new Map();
                          contentItems.forEach(item => { if (!positionIdToGroup.has(String(item.positionId))) positionIdToGroup.set(String(item.positionId), []); positionIdToGroup.get(String(item.positionId)).push(item); });
                          const parts = text.split(/(\[\[pos_[a-zA-Z0-9]+\]\])/g);
                          let encounteredIndex = 0; let renderedAny = false;
                          const rendered = parts.map((part, idx) => {
                            const match = part.match(/^\[\[pos_([a-zA-Z0-9]+)\]\]$/);
                            if (!match) { return <span key={idx} className="html-content" dangerouslySetInnerHTML={{ __html: part }} />; }
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
                                onChange={(e) => { const value = e.target.value; setDropdownSelections(prev => ({ ...prev, [selectKey]: value })); }}
                                style={{ display: 'inline-block', minWidth: '140px', height: '36px', padding: '4px 12px', margin: '0 8px', background: theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`, borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: selectedValue === correct ? 'rgb(24, 144, 255)' : (theme === 'sun' ? '#1890ff' : '#8B5CF6'), cursor: 'pointer', outline: 'none', textAlign: 'center' }}
                              >
                                {options.map(opt => (
                                  <option key={opt} value={opt} style={{ color: opt === correct ? 'rgb(24, 144, 255)' : '#000000' }}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            );
                          });
                          if (renderedAny) return rendered; return <span className="html-content" dangerouslySetInnerHTML={{ __html: text }} />;
                        })()}
                      </div>
                    )}

                    {question.type === 'DRAG_AND_DROP' && (
                      <>
                        <div style={{ display: 'flex', gap: '24px', minHeight: '300px' }}>
                          <div style={{ flex: '1', padding: '20px', background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}` }}>
                           
                            <div style={{ fontSize: '15px', fontWeight: 350, lineHeight: '2.4', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', marginBottom: '16px' }}>
                              {(() => {
                                const text = question.questionText || question.sentence || '';
                                const items = Array.isArray(question.content?.data) ? question.content.data : [];
                                const posToCorrect = new Map();
                                items.filter(it => it.positionId && it.correct === true).forEach((it) => { posToCorrect.set(String(it.positionId), it.value); });
                                if (/\[\[pos_/.test(text)) {
                                  // Use non-capturing group to avoid including capturing groups in split result
                                  const parts = text.split(/(\[\[pos_[a-zA-Z0-9]+\]\])/g);
                                  return parts.map((part, idx) => {
                                    const m = part.match(/^\[\[pos_([a-zA-Z0-9]+)\]\]$/);
                                    if (!m) {
                                      return <span key={idx} className="html-content" dangerouslySetInnerHTML={{ __html: part }} />;
                                    }
                                    const val = posToCorrect.get(m[1]) || '';
                                    return (
                                      <div key={`ddp-${idx}`} style={{ display: 'inline-block', minWidth: '120px', height: '32px', margin: '0 8px', background: theme === 'sun' ? 'rgba(24, 144, 255, 0.15)' : 'rgba(138, 122, 255, 0.18)', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`, borderRadius: '8px', padding: '4px 12px', fontSize: '15px', color: theme === 'sun' ? '#1890ff' : '#8B5CF6', verticalAlign: 'top', lineHeight: '1.4', textAlign: 'center', fontWeight: 600 }} className="html-content" dangerouslySetInnerHTML={{ __html: val }} />
                                    );
                                  });
                                }
                                // Fallback: replace placeholders with underscores if no placeholders match
                                const cleanText = text.replace(/\[\[pos_[a-zA-Z0-9]+\]\]/g, '___');
                                return <span className="html-content" dangerouslySetInnerHTML={{ __html: cleanText }} />;
                              })()}
                            </div>
                          </div>
                          <div style={{ flex: '1', padding: '20px', background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}` }}>
                            <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '16px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                              {t('dailyChallenge.availableWords', 'Available words:')}
                            </Typography.Text>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
                              {(() => {
                                const items = Array.isArray(question.content?.data) ? question.content.data : [];
                                const incorrect = items.length > 0 ? items.filter(it => !it.positionId || it.correct === false).map(it => it.value) : (question.availableWords || []);
                                return incorrect.map((word, wordIdx) => (
                                  <div key={wordIdx} style={{ padding: '12px 20px', background: theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`, borderRadius: '12px', fontSize: '16px', fontWeight: '600', color: theme === 'sun' ? '#1890ff' : '#8B5CF6', userSelect: 'none', minWidth: '80px', textAlign: 'center' }} className="html-content" dangerouslySetInnerHTML={{ __html: word }} />
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {question.type === 'REARRANGE' && (
                      <>
                        <Typography.Text style={{ fontSize: '15px', fontWeight: 350, marginBottom: '16px', display: 'block', lineHeight: '1.8', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                          {question.question || t('dailyChallenge.rearrangeWordsByDragging', 'Rearrange the words by dragging them into the correct order:')}
                        </Typography.Text>
                        <div style={{ marginBottom: '24px', padding: '20px', background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}` }}>
                          <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '16px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                            {t('dailyChallenge.dropWordsHereInOrder', 'Drop the words here in order:')}
                          </Typography.Text>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {(() => {
                              const items = Array.isArray(question.content?.data) ? question.content.data : [];
                              const posToVal = new Map();
                              items.forEach(it => { if (it && it.positionId) posToVal.set(String(it.positionId), it.value); });
                              const text = question.questionText || '';
                              const placeholderOrder = []; const re = /\[\[pos_([a-zA-Z0-9]+)\]\]/g; let m; while ((m = re.exec(text)) !== null) { placeholderOrder.push(m[1]); }
                              return placeholderOrder.map((posId, index) => (
                                <div key={index} style={{ padding: '12px 20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`, borderRadius: '12px', background: theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)', fontSize: '16px', fontWeight: '600', color: theme === 'sun' ? '#1890ff' : '#8B5CF6', cursor: 'not-allowed', userSelect: 'none', minWidth: '80px', textAlign: 'center', boxShadow: theme === 'sun' ? '0 2px 8px rgba(24, 144, 255, 0.15)' : '0 2px 8px rgba(138, 122, 255, 0.15)' }}>
                                  {posToVal.get(posId) || ''}
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                        <div style={{ padding: '20px', background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}` }}>
                          <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '16px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                            {t('dailyChallenge.availableWords', 'Available words:')}
                          </Typography.Text>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
                            {(question.sourceItems || []).map((word, wordIdx) => (
                              <div key={wordIdx} style={{ padding: '12px 20px', background: theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`, borderRadius: '12px', fontSize: '16px', fontWeight: '600', color: theme === 'sun' ? '#1890ff' : '#8B5CF6', cursor: 'not-allowed', userSelect: 'none', minWidth: '80px', textAlign: 'center', boxShadow: theme === 'sun' ? '0 2px 8px rgba(24, 144, 255, 0.15)' : '0 2px 8px rgba(138, 122, 255, 0.15)' }}>
                                {word}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {(question.type === 'MULTIPLE_CHOICE' || question.type === 'MULTIPLE_SELECT' || question.type === 'TRUE_OR_FALSE') && question.options && (
                      <>
                        <div style={{ fontSize: '15px', fontWeight: 350, marginBottom: '12px', display: 'block', lineHeight: '1.8', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }} className="html-content" dangerouslySetInnerHTML={{ __html: question.question }} />
                        <div className="question-options" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginTop: '12px' }}>
                          {question.options.map((option, idx) => {
                            const isCorrect = option.isCorrect;
                            const isMultipleSelect = question.type === 'MULTIPLE_SELECT';
                            return (
                              <div key={idx} className={`option-item ${isCorrect ? 'correct-answer' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: isCorrect ? (theme === 'sun' ? 'rgba(82, 196, 26, 0.08)' : 'rgba(82, 196, 26, 0.12)') : theme === 'sun' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.7)', border: `2px solid ${isCorrect ? '#52c41a' : (theme === 'sun' ? 'rgba(113, 179, 253, 0.2)' : 'rgba(138, 122, 255, 0.15)')}`, borderRadius: '12px', fontSize: '14px', position: 'relative', cursor: 'pointer', minHeight: '50px', boxSizing: 'border-box' }}>
                                {(question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_OR_FALSE') && (
                                  <input type="radio" name={`question-${question.id}`} checked={isCorrect} readOnly style={{ width: '18px', height: '18px', accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6' }} />
                                )}
                                {isMultipleSelect && (
                                  <input type="checkbox" checked={isCorrect} readOnly style={{ width: '18px', height: '18px', accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6' }} />
                                )}
                                <span style={{ flexShrink: 0, color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', fontWeight: '600', fontSize: '16px' }}>{option.key}.</span>
                                <div style={{ fontSize: '14px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', fontWeight: '350', flex: 1 }} className="html-content" dangerouslySetInnerHTML={{ __html: option.text }} />
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
    </ThemedLayout>
    </>
  );
};

export default AIGenerateListening;


