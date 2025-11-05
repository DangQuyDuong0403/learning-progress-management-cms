import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  Button,
  Input,
  Typography,
  Card,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  EditOutlined,
  CloudUploadOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useSelector } from "react-redux";
import usePageTitle from "../../../../hooks/usePageTitle";
import MultipleChoiceModal from "./questionModals/MultipleChoiceModal";
import MultipleSelectModal from "./questionModals/MultipleSelectModal";
import TrueFalseModal from "./questionModals/TrueFalseModal";
import FillBlankModal from "./questionModals/FillBlankModal";
import DropdownModal from "./questionModals/DropdownModal";
import DragDropModal from "./questionModals/DragDropModal";
import ReorderModal from "./questionModals/ReorderModal";
import RewriteModal from "./questionModals/RewriteModal";
import "./AIGenerateQuestions.css";
import dailyChallengeApi from "../../../../apis/backend/dailyChallengeManagement";

const { TextArea } = Input;
const { Title } = Typography;

const AIGenerateQuestions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [hierarchy, setHierarchy] = useState(null);
  
  // Set page title
  usePageTitle('AI Question Generation');
  
  // Get data from navigation state
  const [challengeInfo] = useState({
    classId: location.state?.classId || null,
    className: location.state?.className || null,
    challengeId: location.state?.challengeId || id,
    challengeName: location.state?.challengeName || null,
    challengeType: location.state?.challengeType || null,
    aiSource: location.state?.aiSource || null, // 'settings' or 'file'
  });
  
  // State for prompt input
  const [promptDescription, setPromptDescription] = useState("");
  
  
  // Question settings mode on the right: null (choose), 'manual', 'upload'
  // Auto-set based on aiSource from navigation state
  const [questionSettingsMode, setQuestionSettingsMode] = useState(() => {
    const aiSource = location.state?.aiSource;
    if (aiSource === 'settings') {
      return 'manual';
    } else if (aiSource === 'file') {
      return 'upload';
    }
    return null;
  });
  const uploadInputRef = useRef(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  // State for question type configurations (list all types, default quantity 0)
  const allQuestionTypes = useMemo(() => [
    'MULTIPLE_CHOICE',
    'MULTIPLE_SELECT',
    'TRUE_OR_FALSE',
    'FILL_IN_THE_BLANK',
    'DROPDOWN',
    'DRAG_AND_DROP',
    'REARRANGE',
    'REWRITE'
  ], []);
  const [questionTypeConfigs, setQuestionTypeConfigs] = useState(
    () => allQuestionTypes.map((qt) => ({ questionType: qt, numberOfQuestions: 0 }))
  );
  
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  // Local selections for interactive preview of Dropdown type
  const [dropdownSelections, setDropdownSelections] = useState({});
  
  // Modal edit states
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  
  // Question states for the 3 new questions
  const [questions, setQuestions] = useState([
    {
      id: 1,
      type: 'MULTIPLE_CHOICE',
      title: 'Question 1',
      question: 'What is the capital city of Vietnam?',
      options: [
        { key: 'A', text: 'Ho Chi Minh City', isCorrect: false },
        { key: 'B', text: 'Hanoi', isCorrect: true },
        { key: 'C', text: 'Da Nang', isCorrect: false },
        { key: 'D', text: 'Can Tho', isCorrect: false },
      ],
      points: 1
    },
    {
      id: 2,
      type: 'MULTIPLE_SELECT',
      title: 'Question 2',
      question: 'Which of the following are Southeast Asian countries? (Select all that apply)',
      options: [
        { key: 'A', text: 'Vietnam', isCorrect: true },
        { key: 'B', text: 'Thailand', isCorrect: true },
        { key: 'C', text: 'Japan', isCorrect: false },
        { key: 'D', text: 'Malaysia', isCorrect: true },
      ],
      points: 1
    },
    {
      id: 3,
      type: 'TRUE_OR_FALSE',
      title: 'Question 3',
      question: 'The Earth revolves around the Sun.',
      options: [
        { key: 'A', text: 'True', isCorrect: true },
        { key: 'B', text: 'False', isCorrect: false },
      ],
      points: 1
    },
    {
      id: 4,
      type: 'FILL_IN_THE_BLANK',
      title: 'Question 4',
      question: 'I ______ programming and ______ it very much.',
      blanks: [
        { id: 'blank_1', placeholder: 'love', correctAnswer: 'love' },
        { id: 'blank_2', placeholder: 'enjoy', correctAnswer: 'enjoy' },
      ],
      points: 1
    },
    {
      id: 5,
      type: 'DROPDOWN',
      title: 'Question 5',
      question: 'Choose the correct words to complete the sentence:',
      sentence: 'I ___ programming and ___ it very much.',
      blanks: [
        { id: 'pos_1', options: ['Select', 'love', 'like', 'enjoy', 'hate'], correctAnswer: 'love' },
        { id: 'pos_2', options: ['Select', 'love', 'like', 'enjoy', 'hate'], correctAnswer: 'enjoy' },
      ],
      points: 1
    },
    {
      id: 6,
      type: 'DRAG_AND_DROP',
      title: 'Question 6',
      question: 'Complete the sentence by dragging words into the blanks:',
      sentence: 'I ___ programming and ___ it very much.',
      availableWords: ['love', 'like', 'enjoy', 'hate'],
      correctAnswers: {
        blank_1: 'love',
        blank_2: 'enjoy'
      },
      points: 1
    },
    {
      id: 7,
      type: 'REARRANGE',
      title: 'Question 7',
      question: 'Rearrange the words by dragging them into the correct order:',
      sourceItems: ['I', 'love', 'programming', 'very', 'much'],
      correctOrder: ['I', 'love', 'programming', 'very', 'much'],
      points: 1
    },
    {
      id: 8,
      type: 'REWRITE',
      title: 'Question 8',
      question: 'Rewrite the following sentence using different words:',
      originalSentence: 'I really enjoy programming.',
      correctAnswer: 'I truly love coding.',
      points: 1
    }
  ]);
  
  // Question types available - All with same theme colors
  const primaryColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
  const primaryColorWithAlpha = theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)';
  const MAX_FILE_MB = 10;
  
  const availableQuestionTypes = React.useMemo(() => [
    { 
      value: "MULTIPLE_CHOICE", 
      label: t('dailyChallenge.multipleChoice') || 'Multiple Choice', 
      icon: '📝',
      color: primaryColor,
      bgColor: primaryColorWithAlpha
    },
    { 
      value: "MULTIPLE_SELECT", 
      label: t('dailyChallenge.multipleSelect') || 'Multiple Select', 
      icon: '☑️',
      color: primaryColor,
      bgColor: primaryColorWithAlpha
    },
    { 
      value: "TRUE_OR_FALSE", 
      label: t('dailyChallenge.trueFalse') || 'True/False', 
      icon: '✅',
      color: primaryColor,
      bgColor: primaryColorWithAlpha
    },
    { 
      value: "FILL_IN_THE_BLANK", 
      label: t('dailyChallenge.fillBlank') || 'Fill in the Blank', 
      icon: '✏️',
      color: primaryColor,
      bgColor: primaryColorWithAlpha
    },
    { 
      value: "DROPDOWN", 
      label: 'Dropdown', 
      icon: '📋',
      color: primaryColor,
      bgColor: primaryColorWithAlpha
    },
    { 
      value: "DRAG_AND_DROP", 
      label: 'Drag and Drop', 
      icon: '🔄',
      color: primaryColor,
      bgColor: primaryColorWithAlpha
    },
    { 
      value: "REARRANGE", 
      label: 'Rearrange', 
      icon: '🔀',
      color: primaryColor,
      bgColor: primaryColorWithAlpha
    },
    { 
      value: "REWRITE", 
      label: 'Re-write', 
      icon: '✍️',
      color: primaryColor,
      bgColor: primaryColorWithAlpha
    },
  ], [t, primaryColor, primaryColorWithAlpha]);

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

  // Helpers
  const stripHtml = useCallback((html) => {
    if (!html) return '';
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = String(html);
      const text = tmp.textContent || tmp.innerText || '';
      return text;
    } catch (e) {
      return String(html);
    }
  }, []);

  const removePosMarkers = useCallback((text) => {
    if (!text) return '';
    return String(text).replace(/\[\[pos_[a-zA-Z0-9]+\]\]/g, '');
  }, []);
  
  // Handle updating number of questions (manual settings)
  const handleNumberOfQuestionsChange = useCallback((index, value) => {
    setQuestionTypeConfigs(prev => prev.map((item, i) => (
      i === index ? { ...item, numberOfQuestions: Math.max(0, Number(value) || 0) } : item
    )));
  }, []);
  
  // Map backend AI response -> UI preview model for 8 supported types
  const normalizeQuestionsFromAI = useCallback((rawList) => {
    if (!Array.isArray(rawList)) return [];
    // If backend returns sections [{ section, questions: [...] }, ...], flatten to questions
    let list = rawList;
    if (rawList.length && rawList.every(it => it && Array.isArray(it.questions))) {
      list = rawList.flatMap(it => Array.isArray(it.questions) ? it.questions : []);
    }

    let counter = 0;
    const nextId = () => (++counter);
    const toOptionKey = (idx) => String.fromCharCode(65 + idx); // A, B, C ...
    return list
      .map((q) => {
        const type = String(q?.questionType || q?.type || '').toUpperCase();
        switch (type) {
          case 'MULTIPLE_CHOICE': {
            const opts = Array.isArray(q?.options)
              ? q.options
              : Array.isArray(q?.answers)
                ? q.answers
                : Array.isArray(q?.content?.data)
                  ? q.content.data
                  : [];
            const normalizedOptions = opts.map((o, i) => ({
              key: toOptionKey(i),
              text: o?.text ?? o?.value ?? o?.content ?? '',
              isCorrect: Boolean(o?.isCorrect || o?.correct),
            }));
            return {
              id: nextId(),
              type: 'MULTIPLE_CHOICE',
              title: `Question ${counter}`,
              question: q?.question || q?.questionText || q?.content || '',
              options: normalizedOptions,
              points: q?.points ?? q?.weight ?? q?.score ?? 1,
            };
          }
          case 'MULTIPLE_SELECT': {
            const opts = Array.isArray(q?.options)
              ? q.options
              : Array.isArray(q?.answers)
                ? q.answers
                : Array.isArray(q?.content?.data)
                  ? q.content.data
                  : [];
            const normalizedOptions = opts.map((o, i) => ({
              key: toOptionKey(i),
              text: o?.text ?? o?.value ?? o?.content ?? '',
              isCorrect: Boolean(o?.isCorrect || o?.correct),
            }));
            return {
              id: nextId(),
              type: 'MULTIPLE_SELECT',
              title: `Question ${counter}`,
              question: q?.question || q?.questionText || q?.content || '',
              options: normalizedOptions,
              points: q?.points ?? q?.weight ?? q?.score ?? 1,
            };
          }
          case 'TRUE_OR_FALSE': {
            // If backend gives correctAnswer: 'True'|'False'
            const correct = String(q?.correctAnswer ?? q?.answer ?? '').toLowerCase();
            const isTrue = correct === 'true' || correct === 't' || correct === '1';
            const options = [
              { key: 'A', text: 'True', isCorrect: isTrue === true },
              { key: 'B', text: 'False', isCorrect: isTrue === false },
            ];
            // Or if backend already includes options
            const backendOptions = Array.isArray(q?.options) ? q.options : [];
            const hasBackend = backendOptions.length > 0;
            const rawQuestion = q?.question || q?.questionText || '';
            const sanitizedQuestion = typeof rawQuestion === 'string' ? rawQuestion.replace(/\[\[pos_[^\]]+\]\]/g, '') : rawQuestion;
            return {
              id: nextId(),
              type: 'TRUE_OR_FALSE',
              title: `Question ${counter}`,
              question: sanitizedQuestion,
              options: hasBackend
                ? backendOptions.map((o, i) => ({ key: toOptionKey(i), text: o?.text ?? o?.value ?? '', isCorrect: Boolean(o?.isCorrect || o?.correct) }))
                : options,
              points: q?.points ?? q?.weight ?? q?.score ?? 1,
            };
          }
          case 'FILL_IN_THE_BLANK': {
            const text = q?.questionText || q?.question || '';
            // Prefer backend content.data; normalize positionId by stripping 'pos_'
            const contentItems = Array.isArray(q?.content?.data) ? q.content.data : [];
            const normalizedContent = contentItems.map((it, i) => ({
              id: it?.id || `opt${i + 1}`,
              value: it?.value ?? '',
              positionId: typeof it?.positionId === 'string' ? it.positionId.replace(/^pos_/, '') : (it?.positionId ?? null),
              correct: it?.correct === true,
            }));
            return {
              id: nextId(),
              type: 'FILL_IN_THE_BLANK',
              title: `Question ${counter}`,
              question: text,
              questionText: text,
              content: { data: normalizedContent },
              points: q?.points ?? q?.weight ?? q?.score ?? 1,
            };
          }
          case 'DROPDOWN': {
            const text = q?.questionText || q?.question || '';
            // Use content.data groups, normalize positionId keys to match [[pos_x]] -> 'x'
            const contentItems = Array.isArray(q?.content?.data) ? q.content.data : [];
            const normalizedContent = contentItems.map((it, i) => ({
              id: it?.id || `opt${i + 1}`,
              value: it?.value ?? '',
              positionId: typeof it?.positionId === 'string' ? it.positionId.replace(/^pos_/, '') : (it?.positionId ?? null),
              correct: it?.correct === true,
            }));
            return {
              id: nextId(),
              type: 'DROPDOWN',
              title: `Question ${counter}`,
              question: q?.question || 'Choose the correct words to complete the sentence:',
              questionText: text,
              content: { data: normalizedContent },
              points: q?.points ?? q?.weight ?? q?.score ?? 1,
            };
          }
          case 'DRAG_AND_DROP': {
            const text = q?.questionText || q?.question || '';
            const contentItems = Array.isArray(q?.content?.data) ? q.content.data : [];
            // correct values mapped to their position
            const correctMap = {};
            const correctValues = [];
            const blanks = [];
            contentItems.forEach(it => {
              if (it.correct && it.positionId) {
                correctMap[it.positionId.replace(/^pos_/, '')] = it.value;
                correctValues.push(it.value);
              }
              if (it.correct && it.positionId) {
                blanks.push({id: it.positionId.replace(/^pos_/, ''), value: it.value});
              }
            });
            // incorrect options: all values with correct=false or missing positionId
            const available = contentItems.filter(it => !it.correct || !it.positionId).map(it => it.value);
            return {
              id: nextId(),
              type: 'DRAG_AND_DROP',
              title: `Question ${counter}`,
              question: text,
              questionText: text,
              content: { data: contentItems },
              correctAnswers: correctMap,
              availableWords: available,
              blanks,
              points: q?.points ?? q?.weight ?? q?.score ?? 1,
            };
          }
          case 'REARRANGE': {
            // Use questionText
            const text = q?.questionText || q?.question || '';
            const contentItems = Array.isArray(q?.content?.data) ? q.content.data : [];
            // Sort contentItems by positionId if possible
            const sortedWords = [...contentItems]
              .sort((a, b) => {
                // Try numeric sort if possible
                const aNum = Number(String(a.positionId||'').replace(/\D/g, ''));
                const bNum = Number(String(b.positionId||'').replace(/\D/g, ''));
                if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                return 0;
              })
              .map(it => it.value);
            return {
              id: nextId(),
              type: 'REARRANGE',
              title: `Question ${counter}`,
              // Show human-friendly instruction; keep placeholders only in questionText
              question: 'Rearrange the words by dragging them into the correct order:',
              questionText: text || '',
              sourceItems: sortedWords,
              correctOrder: sortedWords,
              content: { data: contentItems },
              points: q?.points ?? q?.weight ?? q?.score ?? 1,
            };
          }
          case 'REWRITE': {
            const contentItems = Array.isArray(q?.content?.data) ? q.content.data : [];
            const correctVals = contentItems.filter(it => it?.correct === true).map(it => it?.value).filter(Boolean);
            // Try to compute an original sentence by stripping [[pos_x]] -> x from a candidate
            const pickBase = correctVals[0] || contentItems[0]?.value || '';
            const baseWithoutMarkers = typeof pickBase === 'string' ? pickBase.replace(/\[\[pos_([a-zA-Z0-9_]+)\]\]/g, '$1') : '';
            return {
              id: nextId(),
              type: 'REWRITE',
              title: `Question ${counter}`,
            // Use backend prompt as the visible question
            question: q?.questionText || q?.question || 'Rewrite the following sentence using different words:',
            questionText: q?.questionText || q?.question || '',
              originalSentence: q?.originalSentence || baseWithoutMarkers,
              correctAnswer: correctVals[0] || q?.correctAnswer || '',
              content: { data: contentItems },
              points: q?.points ?? q?.score ?? 1,
            };
          }
          // WRITING is not supported in current preview format — skip it
          default:
            return null;
        }
      })
      .filter(Boolean)
      .map((q, idx) => ({ ...q, id: idx + 1, title: `Question ${idx + 1}` }));
  }, []);

  // Handle AI generation
  const handleGenerateWithAI = useCallback(async () => {
    
    try {
      setIsGenerating(true);
      setShowPreview(false);
      const payload = {
        challengeId: challengeInfo.challengeId || id,
        questionTypeConfigs: (questionTypeConfigs || [])
          .filter(c => Number(c.numberOfQuestions) > 0)
          .map((c) => ({
            questionType: c.questionType,
            numberOfQuestions: Number(c.numberOfQuestions) || 1,
          })),
        description: promptDescription,
      };
      const res = await dailyChallengeApi.generateAIQuestions(payload);
      console.log('GenerateAIQuestions API - Response:', res);
      // Try common shapes:
      // - [ ... ]
      // - { questions: [ ... ] }
      // - { data: [ ... ] }
      // - { data: { questions: [ ... ] } }
      // - { result: { questions: [ ... ] } }
      let rawList = [];
      if (Array.isArray(res)) {
        rawList = res;
      } else if (Array.isArray(res?.questions)) {
        rawList = res.questions;
      } else if (Array.isArray(res?.data)) {
        rawList = res.data;
      } else if (Array.isArray(res?.data?.questions)) {
        rawList = res.data.questions;
      } else if (Array.isArray(res?.result?.questions)) {
        rawList = res.result.questions;
      } else if (Array.isArray(res?.payload?.questions)) {
        rawList = res.payload.questions;
      }
      const normalized = normalizeQuestionsFromAI(rawList);
      if (!normalized.length) {
        spaceToast.warning('AI did not return any questions');
        setQuestions([]);
        setShowPreview(false);
      } else {
        setQuestions(normalized);
        setShowPreview(true);
        spaceToast.success(t('dailyChallenge.aiQuestionsGenerated') || 'AI questions generated successfully!');
      }
      
    } catch (error) {
      console.error('Error generating AI questions:', error);
      const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to generate AI questions';
      spaceToast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [promptDescription, t, challengeInfo.challengeId, id, questionTypeConfigs, normalizeQuestionsFromAI]);

  // Generate questions from uploaded file + optional description
  const handleGenerateFromFile = useCallback(async () => {
    if (!uploadedFile) {
      spaceToast.error('Please upload a file first');
      return;
    }
    try {
      setIsGenerating(true);
      setShowPreview(false);
      const res = await dailyChallengeApi.parseQuestionsFromFile(uploadedFile, promptDescription || '');
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
      spaceToast.error(err?.response?.data?.message || err?.message || 'Failed to generate from file');
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedFile, promptDescription, normalizeQuestionsFromAI]);

  // Handle save
  const handleSave = useCallback(async () => {
    
    try {
      setSaving(true);

      // Capture existing sections BEFORE save to compute append positions and detect new ids later
      let beforeSections = [];
      try {
        const existing = await dailyChallengeApi.getSectionsByChallenge(id, { page: 0, size: 100 });
        beforeSections = Array.isArray(existing?.data) ? existing.data : (Array.isArray(existing) ? existing : []);
        console.log('[AI Save] Before save - existing sections (id -> order):', beforeSections.map(s => ({ id: s?.section?.id ?? s?.id, order: s?.section?.orderNumber ?? s?.orderNumber })));
      } catch (e) {
        beforeSections = [];
      }
      const baseOrder = beforeSections.reduce((max, item) => {
        const ord = Number(item?.section?.orderNumber ?? item?.orderNumber ?? 0);
        return Number.isFinite(ord) && ord > max ? ord : max;
      }, 0);
      console.log('[AI Save] Computed baseOrder =', baseOrder);

      // Transform current preview questions -> API schema
      const transformQuestionToApiFormat = (q, orderNumber) => {
        const toContentData = (data) => Array.isArray(data) ? data : [];
        switch (q.type) {
          case 'MULTIPLE_CHOICE':
          case 'MULTIPLE_SELECT':
            return {
              questionText: q.question || q.questionText || '',
              orderNumber,
              weight: q.points || 1,
              questionType: q.type,
              content: {
                data: (q.options || []).map((option, idx) => ({
                  id: option.key || `opt${idx + 1}`,
                  value: option.text || option.value || '',
                  correct: option.isCorrect === true,
                })),
              },
              toBeDeleted: false,
            };
          case 'TRUE_OR_FALSE':
            return {
              questionText: q.question || q.questionText || '',
              orderNumber,
              weight: q.points || 1,
              questionType: 'TRUE_OR_FALSE',
              content: {
                data: (q.options || []).map((option, idx) => ({
                  id: option.key || `opt${idx + 1}`,
                  value: option.text || option.value || '',
                  correct: option.isCorrect === true,
                })),
              },
              toBeDeleted: false,
            };
          case 'FILL_IN_THE_BLANK':
            return {
              questionText: q.questionText || q.question || '',
              orderNumber,
              weight: q.points || 1,
              questionType: 'FILL_IN_THE_BLANK',
              content: { data: toContentData(q.content?.data) },
              toBeDeleted: false,
            };
          case 'DROPDOWN':
            return {
              questionText: q.questionText || q.question || '',
              orderNumber,
              weight: q.points || 1,
              questionType: 'DROPDOWN',
              content: { data: toContentData(q.content?.data) },
              toBeDeleted: false,
            };
          case 'DRAG_AND_DROP':
            return {
              questionText: q.questionText || q.question || '',
              orderNumber,
              weight: q.points || 1,
              questionType: 'DRAG_AND_DROP',
              content: { data: toContentData(q.content?.data) },
              toBeDeleted: false,
            };
          case 'REARRANGE': {
            const rawItems = toContentData(q.content?.data);
            // sanitize: require positionId and value; normalize positionId to plain number/string
            const items = rawItems
              .filter((it) => it && it.value && it.positionId !== undefined && it.positionId !== null && String(it.positionId).trim() !== '')
              .map((it) => ({
                ...it,
                positionId: String(it.positionId).replace(/^pos_/, ''),
              }))
              .sort((a, b) => (Number(a.positionId) || 0) - (Number(b.positionId) || 0));
            // Backend requires placeholders [[pos_X]] present in questionText
            const placeholderText = items.length
              ? items
                  .map((it) => `[[pos_${it.positionId}]]`)
                  .join(' ')
              : (q.questionText || q.question || '');
            return {
              questionText: placeholderText,
              orderNumber,
              weight: q.points || 1,
              questionType: 'REARRANGE',
              content: { data: items },
              toBeDeleted: false,
            };
          }
          case 'REWRITE':
            return {
              questionText: q.questionText || q.question || '',
              orderNumber,
              weight: q.points || 1,
              questionType: 'REWRITE',
              content: { data: toContentData(q.content?.data) },
              toBeDeleted: false,
            };
          default:
            return {
              questionText: q.question || q.questionText || '',
              orderNumber,
              weight: q.points || 1,
              questionType: q.type || 'MULTIPLE_CHOICE',
              content: { data: [] },
              toBeDeleted: false,
            };
        }
      };

      const apiQuestions = (questions || []).map((q, idx) => transformQuestionToApiFormat(q, 1));

      // Each question should be saved in its own section in order
      const sectionsDataArray = apiQuestions.map((apiQ, idx) => ({
        section: {
          sectionTitle: 'AI Generated Question',
          sectionsUrl: '',
          sectionsContent: promptDescription || 'AI generated question',
          orderNumber: baseOrder + idx + 1,
          resourceType: 'NONE',
        },
        questions: [apiQ],
      }));

      console.log('[AI Save] Sections to create (orderNumbers):', sectionsDataArray.map((s, i) => ({ i, orderNumber: s.section.orderNumber })));
      console.log('Saving AI section with questions:', sectionsDataArray);
      const resp = await dailyChallengeApi.bulkSaveSections(id, sectionsDataArray);
      // After creating, force correct ordering: existing sections keep order, new ones appended
      try {
        const afterRes = await dailyChallengeApi.getSectionsByChallenge(id, { page: 0, size: 1000 });
        const afterSections = Array.isArray(afterRes?.data) ? afterRes.data : (Array.isArray(afterRes) ? afterRes : []);
        console.log('[AI Save] After save - all sections (id -> order):', afterSections.map(s => ({ id: s?.section?.id ?? s?.id, order: s?.section?.orderNumber ?? s?.orderNumber })));
        const beforeIds = new Set(beforeSections.map(s => s?.section?.id ?? s?.id));
        const existingOrdered = beforeSections
          .map(s => ({ id: s?.section?.id ?? s?.id, orderNumber: Number(s?.section?.orderNumber ?? s?.orderNumber ?? 0) }))
          .filter(x => x.id != null)
          .sort((a, b) => a.orderNumber - b.orderNumber);
        const newOnes = afterSections
          .filter(s => !beforeIds.has(s?.section?.id ?? s?.id))
          .map(s => ({
            id: s?.section?.id ?? s?.id,
            createdAt: s?.section?.createdAt ?? s?.createdAt ?? '',
          }))
          .filter(x => x.id != null)
          .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
        // Rebuild with correct sequence: first existing in their original order, then new ones
        const finalBulk = [];
        let seq = 0;
        existingOrdered.forEach(x => finalBulk.push({ id: x.id, orderNumber: ++seq }));
        newOnes.forEach(x => finalBulk.push({ id: x.id, orderNumber: ++seq }));
        console.log('[AI Save] Reorder payload:', finalBulk);
        if (finalBulk.length > 0) {
          const reorderResp = await dailyChallengeApi.bulkUpdateSections(id, finalBulk);
          console.log('[AI Save] Reorder response:', reorderResp);
        }
      } catch (reorderError) {
        console.warn('Reorder after save failed, continuing:', reorderError);
      }
      spaceToast.success(resp?.message || t('dailyChallenge.aiQuestionsGenerated') || 'AI questions generated successfully!');

      // Navigate back to content page
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
    } catch (error) {
      console.error('Error saving AI generated questions:', error);
      spaceToast.error(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save AI questions');
    } finally {
      setSaving(false);
    }
  }, [id, promptDescription, questions, navigate, user, challengeInfo, t]);
  


  // Handle editing a question
  const handleEditQuestion = useCallback((questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      // Open modal for Multiple Choice, Multiple Select, True/False, Fill in the Blank, Dropdown, Drag & Drop
      if (question.type === 'MULTIPLE_CHOICE' || question.type === 'MULTIPLE_SELECT' || question.type === 'TRUE_OR_FALSE' || question.type === 'FILL_IN_THE_BLANK' || question.type === 'DROPDOWN' || question.type === 'DRAG_AND_DROP' || question.type === 'REARRANGE' || question.type === 'REWRITE') {
        // Convert question data to modal format
        let modalData = {
          id: question.id,
          type: question.type,
          question: question.question,
          points: question.points,
          options: question.options || [],
        };

        // For TRUE_OR_FALSE, derive correctAnswer from options if available
        if (question.type === 'TRUE_OR_FALSE') {
          modalData.correctAnswer = question.options?.find(o => o.isCorrect)?.text === 'True' ? 'True'
            : question.options?.find(o => o.isCorrect)?.text === 'False' ? 'False' : null;
        }

        // For REWRITE, map original shape → modal shape
        if (question.type === 'REWRITE') {
          // Build multiple answers from content.data if available; fallback to correctAnswer
          const items = Array.isArray(question.content?.data) ? question.content.data : [];
          let contentData = [];
          if (items.length > 0) {
            contentData = items.map((it, idx) => ({
              id: it?.id || `item${idx + 1}`,
              value: it?.value || '',
              positionId: String(idx + 1),
              correct: true,
            }));
          } else if (question.correctAnswer) {
            contentData = [{ id: 'item1', value: question.correctAnswer, positionId: '1', correct: true }];
          }
          const answers = contentData.map((d, i) => ({ id: i + 1, answer: d.value }));

          modalData = {
            ...modalData,
            // questionText is the prompt shown/edited by user
            questionText: question.questionText || question.question || '',
            content: { data: contentData },
            correctAnswers: answers,
          };
        }

        // For FILL_IN_THE_BLANK, map to modal's expected structure
        if (question.type === 'FILL_IN_THE_BLANK') {
          const rawText = question.question || '';
          // If already in [[pos_X]] format, keep as is; else convert underscores to placeholders
          let computedText = rawText;
          if (!/\[\[pos_\w+\]\]/.test(rawText)) {
            let idxCounter = 0;
            computedText = rawText.replace(/_{2,}/g, () => `[[pos_${++idxCounter}]]`);
          }

          // Prefer existing structured content if present
          let contentData = question.content?.data;
          if (!Array.isArray(contentData) || contentData.length === 0) {
            contentData = (question.blanks || []).map((b, i) => ({
              id: `opt${i + 1}`,
              value: b.correctAnswer || b.placeholder || '',
              positionId: String(i + 1),
              correct: true,
            }));
          }

          modalData = {
            ...modalData,
            questionText: computedText,
            content: { data: contentData },
            blanks: question.blanks || [],
          };
        }

        // For DROPDOWN, map to modal structure: questionText with [[pos_X]] and content.data options
        if (question.type === 'DROPDOWN') {
          // Build questionText from sentence with ___ markers if not already in [[pos_]]
          const baseText = question.questionText || question.question || '';
          let computedText = baseText;
          if (!/\[\[pos_\w+\]\]/.test(baseText)) {
            const sentence = question.sentence || '';
            if (sentence) {
              let idxCounter = 0;
              computedText = sentence.replace(/_{2,}/g, () => `[[pos_${++idxCounter}]]`);
            }
          }

          // Build content data from blanks (correct + incorrect)
          let contentData = question.content?.data;
          if (!Array.isArray(contentData) || contentData.length === 0) {
            const blanks = Array.isArray(question.blanks) ? question.blanks : [];
            contentData = [];
            blanks.forEach((b, idx) => {
              const positionId = b.id ? String(b.id).replace(/^pos_/, '') : String(idx + 1);
              const options = Array.isArray(b.options) ? b.options : [];
              const correct = b.correctAnswer;
              if (correct) {
                contentData.push({
                  id: `opt${idx + 1}`,
                  value: correct,
                  positionId,
                  correct: true,
                });
              }
              options
                .filter(opt => opt && opt !== correct && opt !== 'Select')
                .forEach((opt, oIdx) => {
                  contentData.push({
                    id: `opt${idx + 1}_${oIdx + 1}`,
                    value: opt,
                    positionId,
                    correct: false,
                  });
                });
            });
          }

          modalData = {
            ...modalData,
            questionText: computedText || baseText,
            content: { data: contentData },
          };
        }

        // For DRAG_AND_DROP, map sentence/availableWords/correctAnswers → questionText + content.data
        if (question.type === 'DRAG_AND_DROP') {
          const baseText = question.questionText || question.question || '';
          let computedText = baseText;
          if (!/\[\[pos_\w+\]\]/.test(baseText)) {
            const sentence = question.sentence || '';
            if (sentence) {
              let idxCounter = 0;
              computedText = sentence.replace(/_{2,}/g, () => `[[pos_${++idxCounter}]]`);
            }
          }

          // Prefer existing structured content from AI/backend to preserve original positionId values (e.g., a1b2c3)
          let contentData = Array.isArray(question.content?.data) ? [...question.content.data] : [];

          // If no structured content yet, reconstruct from preview fields while PRESERVING position ids
          if (contentData.length === 0) {
            const correctMap = question.correctAnswers || {};
            // Build correct items using the original keys (which correspond to [[pos_<key>]])
            Object.keys(correctMap).forEach((key, idx) => {
              const positionId = String(key).replace(/^pos_/, '');
              const value = correctMap[key];
              contentData.push({
                id: `opt${idx + 1}`,
                value,
                positionId,
                correct: true,
              });
            });
            // Add incorrect options (no position)
            const correctValues = Object.values(correctMap);
            const incorrectOpts = (question.availableWords || [])
              .filter(w => !correctValues.includes(w))
              .map((w, i) => ({ id: `opt_in_${i + 1}`, value: w, positionId: null, correct: false }));
            contentData.push(...incorrectOpts);
          }

          // Derive incorrect options list for modal convenience
          const incorrectOptsForModal = contentData
            .filter(it => !it.positionId || it.correct === false)
            .map(it => ({ id: it.id, text: it.value }));

          modalData = {
            ...modalData,
            questionText: computedText,
            content: { data: contentData },
            incorrectOptions: incorrectOptsForModal,
          };
        }

        // For REARRANGE
        if (question.type === 'REARRANGE') {
          let computedText = question.questionText || '';
          let contentData = Array.isArray(question.content?.data) ? question.content.data : [];

          if (!computedText || !/\[\[pos_\w+\]\]/.test(computedText)) {
            const words = Array.isArray(question.correctOrder) && question.correctOrder.length > 0
              ? question.correctOrder
              : (Array.isArray(question.sourceItems) ? question.sourceItems : []);
            computedText = words.map((_, idx) => `[[pos_${idx + 1}]]`).join(' ');
            contentData = words.map((w, idx) => ({
              id: `opt${idx + 1}`,
              value: w,
              positionId: String(idx + 1),
              correct: true,
            }));
          }

          modalData = {
            ...modalData,
            questionText: computedText,
            content: { data: contentData },
          };
        }
        
        setEditingQuestion(modalData);
        setIsEditModalVisible(true);
      } else {
        spaceToast.info('Edit functionality for this question type is coming soon');
      }
    }
  }, [questions]);

  // Handle deleting a question
  const handleDeleteQuestion = useCallback((questionId) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    spaceToast.success('Question deleted successfully');
  }, []);

  

  // Handle save from edit modal
  const handleSaveFromModal = useCallback((updatedQuestion) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== updatedQuestion.id) return q;
      // Preserve existing title (e.g., "Question 4", "Question 5")
      const { title: _discardTitle, ...restUpdated } = updatedQuestion || {};
      // Special mapping for REARRANGE back to AI preview shape
      if (updatedQuestion?.type === 'REARRANGE') {
        const words = Array.isArray(updatedQuestion?.content?.data)
          ? updatedQuestion.content.data
              .filter(it => it && it.value)
              .map(it => it.value)
          : [];
        return {
          ...q,
          type: 'REARRANGE',
          title: q.title,
          question: q.question || 'Rearrange the words by dragging them into the correct order:',
          // Keep structured fields
          questionText: updatedQuestion.questionText,
          content: { data: Array.isArray(updatedQuestion?.content?.data) ? updatedQuestion.content.data : [] },
          points: updatedQuestion.points ?? q.points,
          sourceItems: words,
          correctOrder: words,
          shuffledWords: Array.isArray(updatedQuestion.shuffledWords) ? updatedQuestion.shuffledWords : q.shuffledWords,
          blanks: Array.isArray(updatedQuestion.blanks) ? updatedQuestion.blanks : q.blanks,
        };
      }
      // Normalize REWRITE back to preview shape (use content.data for multiple answers)
      if (updatedQuestion?.type === 'REWRITE') {
        // Normalize: one prompt (= question text) and multiple answers from content.data
        const normalizedAnswers = Array.isArray(updatedQuestion?.content?.data)
          ? updatedQuestion.content.data.map(it => it?.value).filter(Boolean)
          : (Array.isArray(updatedQuestion?.correctAnswers) ? updatedQuestion.correctAnswers.map(a => a?.answer).filter(Boolean) : []);
        const plainPrompt = removePosMarkers(stripHtml(updatedQuestion.question || updatedQuestion.questionText || ''));
        return {
          ...q,
          type: 'REWRITE',
          title: q.title,
          // Show only one prompt (instruction or edited text without markers)
          question: 'Rewrite the following sentence using different words:',
          questionText: removePosMarkers(updatedQuestion.questionText || updatedQuestion.question || ''),
          content: { data: Array.isArray(updatedQuestion?.content?.data) ? updatedQuestion.content.data : [] },
          points: updatedQuestion.points ?? q.points,
          correctAnswer: normalizedAnswers[0] || '',
          correctAnswers: normalizedAnswers,
          originalSentence: plainPrompt,
        };
      }
      return { ...q, ...restUpdated, title: q.title };
    }));
    setIsEditModalVisible(false);
    setEditingQuestion(null);
    spaceToast.success('Question updated successfully');
  }, [stripHtml, removePosMarkers]);

  // Handle cancel edit modal
  const handleCancelEditModal = useCallback(() => {
    setIsEditModalVisible(false);
    setEditingQuestion(null);
  }, []);
  
  // Handle back
  const handleBack = useCallback(() => {
    const userRole = user?.role?.toLowerCase();
    const contentPath = userRole === 'teaching_assistant'
      ? `/teaching-assistant/daily-challenges/detail/${id}/content`
      : `/teacher/daily-challenges/detail/${id}/content`;
    
    navigate(contentPath, {
      state: {
        challengeId: id,
        challengeName: challengeInfo.challengeName,
        classId: challengeInfo.classId,
        className: challengeInfo.className
      }
    });
  }, [navigate, id, challengeInfo, user]);
  
  // Custom Header Component
  const headerSubtitle = (challengeInfo.className && challengeInfo.challengeName)
    ? `${challengeInfo.className} / ${challengeInfo.challengeName}`
    : (challengeInfo.challengeName || null);

  const customHeader = (
    <header className={`themed-header ${theme}-header`}>
      <nav className="themed-navbar">
        <div className="themed-navbar-content" style={{ justifyContent: 'space-between', width: '100%' }}>
          {/* Left: Back Button + Title */}
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
              <span style={{ 
                fontSize: '24px',
                fontWeight: 300,
                opacity: 0.5
              }}>|</span>
              <span>
                {headerSubtitle
                  || (t('dailyChallenge.dailyChallengeManagement') + ' / ' + (t('dailyChallenge.content') || 'Content'))
                }
              </span>
            </div>
          </div>

          {/* Right: Save Button */}
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
  
  return (
    <ThemedLayout customHeader={customHeader}>
      <div className={`ai-generate-wrapper allow-motion ${theme}-ai-generate-wrapper`}>
        <div style={{ padding: '24px', maxWidth: '1500px', margin: '0 auto' }}>
          {/* Hierarchy info moved inside the main container */}
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
              padding: 16
            }}
            bodyStyle={{ padding: 16 }}
          >
            {/* White chips for Level/Chapter/Lesson inside container (from API) */}
            {hierarchy && (
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <div style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)', background: '#ffffff', color: '#000000', fontWeight: 600 }}>
                  Level: {hierarchy?.level?.levelName || hierarchy?.level?.name || '—'}
                </div>
                <div style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)', background: '#ffffff', color: '#000000', fontWeight: 600 }}>
                  Chapter: {hierarchy?.chapter?.chapterName || hierarchy?.chapter?.name || '—'}
                </div>
                <div style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)', background: '#ffffff', color: '#000000', fontWeight: 600 }}>
                  Lesson: {hierarchy?.lesson?.lessonName || hierarchy?.lesson?.name || '—'}
                </div>
              </div>
            )}
            {/* Two-column layout: left = Text Prompt (2/3), right = Question Settings (1/3) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'stretch' }}>
              {/* Left: Text Prompt (no passage) */}
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
                  minHeight: '540px'
                }}
              >
                <Title level={3} style={{ textAlign: 'center', color: theme === 'sun' ? '#1890ff' : '#8B5CF6', marginTop: 0, fontSize: '26px' }}>
                  Add Prompt
                </Title>
            
                <TextArea
                  value={promptDescription}
                  onChange={(e) => setPromptDescription(e.target.value)}
                  autoSize={{ minRows: 16, maxRows: 26 }}
                  placeholder={t('dailyChallenge.pleaseEnterPrompt') || 'Enter prompt here'}
                  style={{
                    marginTop: 12,
                    fontSize: '15px',
                    borderRadius: '12px',
                    border: `2px solid ${primaryColor}99`,
                    background: theme === 'sun'
                      ? 'rgba(240, 249, 255, 0.5)'
                      : 'rgba(244, 240, 255, 0.3)',
                    outline: 'none',
                    boxShadow: 'none',
                    minHeight: '460px'
                  }}
                />
              </Card>

              {/* Right: Question Settings (with Upload or Manual modes) */}
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
                  minHeight: '540px'
                }}
              >
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
                    if (f && f.size > MAX_FILE_MB * 1024 * 1024) {
                      spaceToast.error(`File too large. Max ${MAX_FILE_MB}MB`);
                      e.target.value = '';
                      setUploadedFile(null);
                      setUploadedFileName('');
                      return;
                    }
                    setUploadedFileName(f ? f.name : '');
                    setUploadedFile(f || null);
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
                          if (uploadInputRef.current) uploadInputRef.current.click();
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16, width: '100%', minHeight: 540 }}>
                    {/* Hide Back button if mode was set from modal (aiSource exists) */}
                    {!challengeInfo.aiSource && (
                      <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => setQuestionSettingsMode(null)}
                        className={`class-menu-back-button ${theme}-class-menu-back-button`}
                        style={{ height: '32px', borderRadius: '8px', fontWeight: 500, fontSize: '14px', marginBottom: 16, alignSelf: 'flex-start' }}
                      >
                        {t('common.back')}
                      </Button>
                    )}

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
                          if (f && f.size > MAX_FILE_MB * 1024 * 1024) {
                            spaceToast.error(`File too large. Max ${MAX_FILE_MB}MB`);
                            e.target.value = '';
                            setUploadedFile(null);
                            setUploadedFileName('');
                            return;
                          }
                          setUploadedFileName(f ? f.name : '');
                          setUploadedFile(f || null);
                        }}
                      />
                      {uploadedFileName && (
                        <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: theme === 'sun' ? '#1E40AF' : '#d1cde8' }}>{uploadedFileName}</div>
                      )}
                    </div>
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      loading={isGenerating}
                      disabled={!uploadedFile}
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
                  </div>
                )}

                {questionSettingsMode === 'manual' && (
                  <>
                    {/* Hide Back button if mode was set from modal (aiSource exists) */}
                    {!challengeInfo.aiSource && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 12, marginBottom: 20 }}>
                        <Button
                          icon={<ArrowLeftOutlined />}
                          onClick={() => setQuestionSettingsMode(null)}
                          className={`class-menu-back-button ${theme}-class-menu-back-button`}
                          style={{ height: '32px', borderRadius: '8px', fontWeight: 500, fontSize: '14px' }}
                        >
                          {t('common.back')}
                        </Button>
                      </div>
                    )}
                    {challengeInfo.aiSource && (
                      <div style={{ marginBottom: 20 }}></div>
                    )}

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
                        overflowY: 'auto'
                      }}
                    >
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

                    {/* Generate Questions button below Question Settings */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
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
                    </div>
                  </>
                )}
              </Card>
            </div>
          </Card>

          {/* Loading Animation */}
          {isGenerating && (
            <Card
              className={`loading-card allow-motion ${theme}-loading-card`}
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
                marginTop: '24px',
                marginBottom: '24px',
                backdropFilter: 'blur(10px)',
                animation: 'fadeInUp 0.5s ease-out'
              }}
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                padding: '40px 20px',
                textAlign: 'center'
              }}>
                {/* AI Brain Animation */}
                <div style={{
                  position: 'relative',
                  width: '120px',
                  height: '120px',
                  marginBottom: '24px'
                }}>
                  {/* Outer rotating ring */}
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '120px',
                    height: '120px',
                    border: `3px solid ${primaryColor}20`,
                    borderRadius: '50%',
                    borderTop: `3px solid ${primaryColor}`,
                    animation: 'spin 2s linear infinite'
                  }} />
                  
                  {/* Inner pulsing circle */}
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    width: '80px',
                    height: '80px',
                    background: `radial-gradient(circle, ${primaryColor}30, ${primaryColor}10)`,
                    borderRadius: '50%',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }} />
                  
                  {/* AI Icon */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '32px',
                    color: primaryColor,
                    animation: 'bounce 1s ease-in-out infinite'
                  }}>
                    🤖
                  </div>
                </div>

                {/* Loading Text */}
              <Title level={3} style={{ 
                marginTop: 0, 
                  marginBottom: '12px', 
                  fontSize: '24px', 
                fontWeight: 700,
                  color: primaryColor,
                  animation: 'fadeInOut 2s ease-in-out infinite'
                }}>
                  {t('dailyChallenge.aiThinking') || 'AI is thinking...'}
              </Title>

                <div style={{
                  fontSize: '16px',
                  color: theme === 'sun' ? '#666' : '#999',
                  fontWeight: 500,
                  marginBottom: '20px'
                }}>
                  {t('dailyChallenge.generatingQuestions') || 'Generating questions based on your prompt'}
                </div>

                {/* Progress Dots */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: primaryColor,
                        animation: `wave 1.4s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Questions Preview */}
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
                            border: '1px solid rgba(24, 144, 255, 0.2)',
                            transition: 'all 0.3s ease',
                            flexShrink: 0
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(24, 144, 255, 0.2)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(24, 144, 255, 0.1)';
                            e.currentTarget.style.transform = 'scale(1)';
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
                            border: '1px solid rgba(255, 77, 79, 0.2)',
                            transition: 'all 0.3s ease',
                            flexShrink: 0
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 77, 79, 0.2)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 77, 79, 0.1)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        />
                      </Tooltip>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
                    {/* Fill in the Blank */}
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
                            // Build options: correct first, then incorrects
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
                          // Fallback: use local blanks/sentence if content.data not present yet (AI preview data)
                          if (question.sentence && Array.isArray(question.blanks) && question.blanks.length > 0) {
                            const sentenceParts = question.sentence.split('___');
                            return sentenceParts.map((part, idx) => (
                              <React.Fragment key={`s-${idx}`}>
                                {part}
                                {idx < question.blanks.length && (() => {
                                  const blank = question.blanks[idx] || {};
                                  const correct = blank.correctAnswer;
                                  const options = Array.isArray(blank.options) ? blank.options : [];
                                  const selectKey = `${question.id}_local_${idx}`;
                                  const selectedValue = dropdownSelections[selectKey] ?? (correct || '');
                                  return (
                                    <select
                                      value={selectedValue}
                                      onChange={(e) => setDropdownSelections(prev => ({ ...prev, [selectKey]: e.target.value }))}
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
                                })()}
                              </React.Fragment>
                            ));
                          }
                          // Default: just show text
                          return text;
                        })()}
                      </div>
                    )}

                    {/* Drag and Drop */}
                    {question.type === 'DRAG_AND_DROP' && (
                      <>
                        <div style={{ display: 'flex', gap: '24px', minHeight: '300px' }}>
                          {/* Left Column - Sentence with drop zones */}
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
                                // Render by placeholder if exists, else fallback to underscores
                                if (/\[\[pos_/.test(text)) {
                                  const parts = text.split(/(\[\[pos_([a-zA-Z0-9]+)\]\])/g);
                                  return parts.map((part, idx) => {
                                    const m = part.match(/^\[\[pos_([a-zA-Z0-9]+)\]\]$/);
                                    if (!m) {
                                      // Clean the text part by removing specific unwanted patterns
                                      const cleanPart = part
                                        .replace(/[a-zA-Z0-9]{6,}/g, '') // Remove long alphanumeric strings like "a1b2c3"
                                        .replace(/[a-zA-Z]{3,}[0-9]{3,}/g, '') // Remove patterns like "abc123"
                                        .replace(/[0-9]{3,}[a-zA-Z]{3,}/g, '') // Remove patterns like "123abc"
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
                                          boxSizing: 'border-box',
                                          textAlign: 'center',
                                          fontWeight: 600,
                                        }}
                                      >{val}</div>
                                    );
                                  });
                                }
                                // Fallback legacy underscores rendering
                                // Clean text by removing position markers first
                                const cleanText = text.replace(/\[\[pos_[a-zA-Z0-9]+\]\]/g, '___');
                                return cleanText.split('___').map((part, idx) => (
                                  <React.Fragment key={`us-${idx}`}>
                                    {part}
                                    {idx < 2 && (
                                      <div
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
                                          color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                          verticalAlign: 'top',
                                          lineHeight: '1.4',
                                          boxSizing: 'border-box',
                                          textAlign: 'center',
                                          fontWeight: 600,
                                        }}
                                      >{idx === 0 ? 'love' : 'enjoy'}</div>
                                    )}
                                  </React.Fragment>
                                ));
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
                                  : (question.availableWords || []).filter(w => w !== (question.correctAnswers?.blank_1) && w !== (question.correctAnswers?.blank_2));
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
                                      transition: 'all 0.2s ease',
                                      minWidth: '80px',
                                      textAlign: 'center',
                                      boxShadow: theme === 'sun' 
                                        ? '0 2px 8px rgba(24, 144, 255, 0.15)' 
                                        : '0 2px 8px rgba(138, 122, 255, 0.15)'
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

                    {/* Multiple Choice, Multiple Select, True/False */}
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
                                {/* Radio button for Multiple Choice and True/False */}
                                {(question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_OR_FALSE') && (
                                  <input 
                                    type="radio" 
                                    name={`question-${question.id}`}
                                    checked={isCorrect}
                                    readOnly
                                    style={{ 
                                      width: '18px',
                                      height: '18px',
                                      accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                      cursor: 'pointer'
                                    }} 
                                  />
                                )}
                                
                                {/* Checkbox for Multiple Select */}
                                {isMultipleSelect && (
                                  <input 
                                    type="checkbox" 
                                    checked={isCorrect}
                                    readOnly
                                    style={{ 
                                      width: '18px',
                                      height: '18px',
                                      accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                      cursor: 'pointer'
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
                                {/* Removed extra check icon to avoid overlapping with native radio/checkbox */}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Rearrange */}
                    {question.type === 'REARRANGE' && question.sourceItems && (
                      <>
                        <Typography.Text style={{ 
                          fontSize: '15px', 
                          fontWeight: 350,
                          marginBottom: '16px',
                          display: 'block',
                          lineHeight: '1.8',
                          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
                        }}>
                          {question.question}
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
                            {question.correctOrder?.map((word, index) => (
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
                                  transition: 'all 0.2s ease',
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
                            {question.sourceItems.map((word, wordIdx) => (
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
                                  transition: 'all 0.2s ease',
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

                    {/* Rewrite */}
                    {question.type === 'REWRITE' && (
                      <>
                        <Typography.Text style={{ 
                          fontSize: '15px', 
                          fontWeight: 350,
                          marginBottom: '16px',
                          display: 'block',
                          lineHeight: '1.8',
                          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
                        }}>
                          {(() => {
                            // Show instruction if present; otherwise fallback to stripped questionText/question
                            const instruction = question.question ? stripHtml(question.question) : '';
                            if (instruction) return instruction;
                            const raw = question.questionText || '';
                            const withoutMarkers = raw.replace(/\[\[pos_[a-zA-Z0-9]+\]\]/g, '');
                            return stripHtml(withoutMarkers).trim();
                          })()}
                        </Typography.Text>
                        {/* Original sentence preview intentionally hidden for REWRITE */}

                        {/* Remove original sentence preview to avoid duplicated text */}

                            {/* Correct Answers Display (supports multiple) */}
                        <div style={{ marginTop: '20px' }}>
                          <Typography.Text style={{ 
                            fontSize: '14px', 
                            fontWeight: 350,
                            marginBottom: '8px',
                            display: 'block',
                            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
                          }}>
                            Correct Answer{Array.isArray(question.content?.data) && question.content.data.length > 1 ? 's' : ''}:
                          </Typography.Text>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}>
                            {(() => {
                              const items = Array.isArray(question.content?.data) && question.content.data.length > 0
                                ? question.content.data.map(d => d.value)
                                : [question.correctAnswer].filter(Boolean);
                              return items.map((val, idx) => (
                                <div key={idx} style={{
                                  padding: '16px 20px',
                                  background: theme === 'sun' 
                                    ? 'rgba(82, 196, 26, 0.08)' 
                                    : 'rgba(82, 196, 26, 0.12)',
                                  border: `2px solid #52c41a`,
                                  borderRadius: '12px',
                                  fontSize: '15px',
                                  fontWeight: '350',
                                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                  lineHeight: '1.6',
                                  position: 'relative',
                                  boxShadow: theme === 'sun' 
                                    ? '0 2px 8px rgba(82, 196, 26, 0.15)' 
                                    : '0 2px 8px rgba(82, 196, 26, 0.15)'
                                }}>
                                  <CheckOutlined style={{ 
                                    color: '#52c41a', 
                                    fontSize: '16px',
                                    marginRight: '8px',
                                    position: 'absolute',
                                    top: '16px',
                                    left: '16px'
                                  }} />
                                  <div style={{ paddingLeft: '32px' }}>
                                    {removePosMarkers(stripHtml(val))}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
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

      {/* Edit Modals */}
      {editingQuestion && editingQuestion.type === 'MULTIPLE_CHOICE' && (
        <MultipleChoiceModal
          visible={isEditModalVisible}
          onCancel={handleCancelEditModal}
          onSave={handleSaveFromModal}
          questionData={editingQuestion}
          saving={false}
        />
      )}
      {editingQuestion && editingQuestion.type === 'MULTIPLE_SELECT' && (
        <MultipleSelectModal
          visible={isEditModalVisible}
          onCancel={handleCancelEditModal}
          onSave={handleSaveFromModal}
          questionData={editingQuestion}
          saving={false}
        />
      )}
      {editingQuestion && editingQuestion.type === 'TRUE_OR_FALSE' && (
        <TrueFalseModal
          visible={isEditModalVisible}
          onCancel={handleCancelEditModal}
          onSave={handleSaveFromModal}
          questionData={editingQuestion}
          saving={false}
        />
      )}
      {editingQuestion && editingQuestion.type === 'FILL_IN_THE_BLANK' && (
        <FillBlankModal
          visible={isEditModalVisible}
          onCancel={handleCancelEditModal}
          onSave={handleSaveFromModal}
          questionData={editingQuestion}
        />
      )}
      {editingQuestion && editingQuestion.type === 'DROPDOWN' && (
        <DropdownModal
          visible={isEditModalVisible}
          onCancel={handleCancelEditModal}
          onSave={handleSaveFromModal}
          questionData={editingQuestion}
        />
      )}
      {editingQuestion && editingQuestion.type === 'DRAG_AND_DROP' && (
        <DragDropModal
          visible={isEditModalVisible}
          onCancel={handleCancelEditModal}
          onSave={handleSaveFromModal}
          questionData={editingQuestion}
        />
      )}
      {editingQuestion && editingQuestion.type === 'REARRANGE' && (
        <ReorderModal
          visible={isEditModalVisible}
          onCancel={handleCancelEditModal}
          onSave={handleSaveFromModal}
          questionData={editingQuestion}
        />
      )}
      {editingQuestion && editingQuestion.type === 'REWRITE' && (
        <RewriteModal
          visible={isEditModalVisible}
          onCancel={handleCancelEditModal}
          onSave={handleSaveFromModal}
          questionData={editingQuestion}
        />
      )}
    </ThemedLayout>
  );
};

export default AIGenerateQuestions;
