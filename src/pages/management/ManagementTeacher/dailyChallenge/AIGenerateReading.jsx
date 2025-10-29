import React, { useCallback, useMemo, useState } from "react";
import {
  Button,
  Card,
  Divider,
  Input,
  Select,
  Tooltip,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { spaceToast } from "../../../../component/SpaceToastify";
import dailyChallengeApi from "../../../../apis/backend/dailyChallengeManagement";
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

  const challengeInfo = {
    classId: location.state?.classId || null,
    className: location.state?.className || null,
    challengeId: location.state?.challengeId || id,
    challengeName: location.state?.challengeName || null,
    challengeType: 'READING',
  };

  // Step control
  const [step, setStep] = useState(1);

  // Step 1 - Generate reading passage
  const [passagePrompt, setPassagePrompt] = useState("");
  const [numParagraphs, setNumParagraphs] = useState(1);
  const [generatingPassage, setGeneratingPassage] = useState(false);
  const [passage, setPassage] = useState("");

  // Step 2 - Configure question generation and preview
  const [promptDescription, setPromptDescription] = useState("");
  const [questionTypeConfigs, setQuestionTypeConfigs] = useState([
    { questionType: "MULTIPLE_CHOICE", numberOfQuestions: 1 },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [questions, setQuestions] = useState([]);
  // Local selections for interactive preview of Dropdown type
  const [dropdownSelections, setDropdownSelections] = useState({});

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const primaryColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
  const primaryColorWithAlpha = theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)';

  const availableQuestionTypes = useMemo(() => [
    { value: "MULTIPLE_CHOICE", label: t('dailyChallenge.multipleChoice') || 'Multiple Choice', icon: '📝', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "MULTIPLE_SELECT", label: t('dailyChallenge.multipleSelect') || 'Multiple Select', icon: '☑️', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "TRUE_OR_FALSE", label: t('dailyChallenge.trueFalse') || 'True/False', icon: '✅', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "FILL_IN_THE_BLANK", label: t('dailyChallenge.fillBlank') || 'Fill in the Blank', icon: '✏️', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "DROPDOWN", label: 'Dropdown', icon: '📋', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "DRAG_AND_DROP", label: 'Drag and Drop', icon: '🔄', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "REARRANGE", label: 'Reorder', icon: '🔀', color: primaryColor, bgColor: primaryColorWithAlpha },
  ], [t, primaryColor, primaryColorWithAlpha]);

  // Helpers (match AIGenerateQuestions behaviors)
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
          return { id: nextId(), type, title: `Question ${counter}`, question: q?.question || q?.questionText || '', options: opts, points: q?.points ?? q?.score ?? 1 };
        }
        case 'TRUE_OR_FALSE': {
          const backendOptions = Array.isArray(q?.options) ? q.options : [];
          const options = backendOptions.length ? backendOptions.map((o, i) => ({ key: toKey(i), text: o?.text ?? o?.value ?? '', isCorrect: Boolean(o?.isCorrect || o?.correct) })) : [
            { key: 'A', text: 'True', isCorrect: String(q?.correctAnswer || '').toLowerCase() === 'true' },
            { key: 'B', text: 'False', isCorrect: String(q?.correctAnswer || '').toLowerCase() === 'false' },
          ];
          return { id: nextId(), type: 'TRUE_OR_FALSE', title: `Question ${counter}`, question: q?.question || q?.questionText || '', options, points: q?.points ?? q?.score ?? 1 };
        }
        case 'FILL_IN_THE_BLANK':
        case 'DROPDOWN':
        case 'DRAG_AND_DROP':
          return { id: nextId(), type, title: `Question ${counter}`, question: q?.question || q?.questionText || '', questionText: q?.questionText || q?.question || '', content: { data: Array.isArray(q?.content?.data) ? q.content.data : [] }, points: q?.points ?? q?.score ?? 1 };
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
            points: q?.points ?? q?.score ?? 1,
          };
        }
        default:
          return null;
      }
    }).filter(Boolean).map((q, idx) => ({ ...q, id: idx + 1, title: `Question ${idx + 1}` }));
  }, []);

  // Step 1: call passage generation
  const handleGeneratePassage = useCallback(async () => {
    if (!passagePrompt.trim()) {
      spaceToast.error(t('dailyChallenge.pleaseEnterPrompt') || 'Please enter a prompt');
      return;
    }
    try {
      setGeneratingPassage(true);
      const payload = {
        challengeId: challengeInfo.challengeId,
        numberOfParagraphs: Number(numParagraphs) || 1,
        description: passagePrompt,
      };
      const res = await dailyChallengeApi.generateReadingPassage(payload);
      // Flexible extraction
      const data = res?.data?.data || res?.data || res;
      const text = data?.passage || data?.content || data?.sectionsContent || '';
      if (!text) throw new Error('No passage returned');
      setPassage(text);
      setStep(2);
      spaceToast.success('Passage generated');
    } catch (err) {
      console.error('Generate passage error:', err);
      spaceToast.error(err?.response?.data?.message || err?.message || 'Failed to generate passage');
    } finally {
      setGeneratingPassage(false);
    }
  }, [challengeInfo.challengeId, passagePrompt, numParagraphs, t]);

  // Step 2: question type config helpers
  const handleAddQuestionType = useCallback(() => {
    if (questionTypeConfigs.length >= 8) {
      spaceToast.warning(t('dailyChallenge.maxQuestionTypesReached') || 'Maximum 8 question types allowed');
      return;
    }
    const used = new Set(questionTypeConfigs.map(q => q.questionType));
    const next = availableQuestionTypes.find(qt => !used.has(qt.value));
    if (!next) {
      spaceToast.warning(t('dailyChallenge.duplicateTypesNotAllowed') || 'Each question type must be unique');
      return;
    }
    setQuestionTypeConfigs(prev => [...prev, { questionType: next.value, numberOfQuestions: 1 }]);
  }, [questionTypeConfigs, availableQuestionTypes, t]);

  const handleRemoveQuestionType = useCallback((index) => {
    if (questionTypeConfigs.length > 1) {
      setQuestionTypeConfigs(prev => prev.filter((_, i) => i !== index));
    } else {
      spaceToast.warning(t('dailyChallenge.minOneQuestionType') || 'At least one question type is required');
    }
  }, [questionTypeConfigs.length, t]);

  const handleQuestionTypeChange = useCallback((index, value) => {
    setQuestionTypeConfigs(prev => {
      const existsElsewhere = prev.some((cfg, i) => i !== index && cfg.questionType === value);
      if (existsElsewhere) {
        spaceToast.warning(t('dailyChallenge.duplicateTypesNotAllowed') || 'This question type is already selected');
        return prev;
      }
      return prev.map((item, i) => (i === index ? { ...item, questionType: value } : item));
    });
  }, [t]);

  const handleNumberOfQuestionsChange = useCallback((index, value) => {
    setQuestionTypeConfigs(prev => prev.map((item, i) => (i === index ? { ...item, numberOfQuestions: value } : item)));
  }, []);

  // Step 2: call content-based questions generation
  const handleGenerateWithAI = useCallback(async () => {
    if (!passage || !passage.trim()) {
      spaceToast.error('Passage is empty. Generate it in Step 1');
      return;
    }
    try {
      setIsGenerating(true);
      setShowPreview(false);
      const payload = {
        challengeId: challengeInfo.challengeId,
        sections: [
          {
            section: {
              id: 0,
              sectionTitle: 'Reading Section',
              sectionsUrl: '',
              sectionsContent: passage,
              orderNumber: 1,
              resourceType: 'DOCUMENT',
            },
            questionTypeConfigs: questionTypeConfigs.map((c) => ({
              questionType: c.questionType,
              numberOfQuestions: Number(c.numberOfQuestions) || 1,
            })),
          },
        ],
        description: promptDescription,
      };
      const res = await dailyChallengeApi.generateContentBasedQuestions(payload);
      let rawList = [];
      if (Array.isArray(res)) rawList = res;
      else if (Array.isArray(res?.questions)) rawList = res.questions;
      else if (Array.isArray(res?.data)) rawList = res.data;
      else if (Array.isArray(res?.data?.questions)) rawList = res.data.questions;
      else if (Array.isArray(res?.result?.questions)) rawList = res.result.questions;
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
    } catch (err) {
      console.error('Generate content-based questions error:', err);
      spaceToast.error(err?.response?.data?.message || err?.message || 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  }, [challengeInfo.challengeId, passage, questionTypeConfigs, promptDescription, t, normalizeQuestionsFromAI]);

  // Save generated questions into a section
  const handleSave = useCallback(async () => {
    if (!passage.trim()) {
      spaceToast.error('Passage is empty');
      return;
    }
    try {
      setSaving(true);
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
              score: q.points || 1,
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
              score: q.points || 1,
              questionType: q.type,
              content: { data: toData(q.content?.data) },
              toBeDeleted: false,
            };
          default:
            return { questionText: q.question || '', orderNumber, score: 1, questionType: 'MULTIPLE_CHOICE', content: { data: [] }, toBeDeleted: false };
        }
      };

      const apiQuestions = (questions || []).map((q, idx) => toApiQuestion(q, idx + 1));
      const sectionData = {
        section: {
          sectionTitle: 'AI Generated Reading',
          sectionsUrl: '',
          sectionsContent: passage,
          orderNumber: 1,
          resourceType: 'DOCUMENT',
        },
        questions: apiQuestions,
      };

      const sectionsDataArray = [sectionData];
      const resp = await dailyChallengeApi.bulkSaveSections(id, sectionsDataArray);
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
      spaceToast.error(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [id, passage, questions, navigate, user, challengeInfo, t]);

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
    setQuestions(prev => prev.filter(q => q.id !== qid));
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

  return (
    <ThemedLayout customHeader={customHeader}>
      <div className={`ai-generate-wrapper ${theme}-ai-generate-wrapper`}>
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Step 1 - Generate Passage */}
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
              marginBottom: '24px',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Title level={3} style={{ textAlign: 'center', color: theme === 'sun' ? '#1890ff' : '#8B5CF6' }}>
              Step 1: Generate passage with AI
            </Title>
             <TextArea
              value={passagePrompt}
              onChange={(e) => setPassagePrompt(e.target.value)}
              autoSize={{ minRows: 4, maxRows: 8 }}
              placeholder={t('dailyChallenge.pleaseEnterPrompt') || 'Describe the topic and difficulty (e.g., "theo IELTS 6.5")'}
              style={{
                marginTop: 12,
                fontSize: '15px',
                borderRadius: '12px',
                border: theme === 'sun'
                  ? '2px solid rgba(113, 179, 253, 0.3)'
                  : '2px solid rgba(138, 122, 255, 0.3)',
                background: theme === 'sun'
                   ? 'rgba(240, 249, 255, 0.5)'
                   : 'rgba(244, 240, 255, 0.3)',
                 outline: 'none',
                 boxShadow: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
              <span style={{
                color: theme === 'sun' ? '#000000' : '#FFFFFF',
                fontWeight: 600
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
                   marginLeft: 'auto',
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
            {passage && (
              <div className="ai-preview-scroll" style={{ marginTop: 16, padding: 16, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, background: theme === 'sun' ? '#fff' : 'rgba(255,255,255,0.05)', position: 'relative' }}>
                <Title level={4} style={{ marginTop: 0, color: theme === 'sun' ? '#000000' : '#8B5CF6' }}>Preview</Title>
                <Tooltip title={t('common.copy') || 'Copy'}>
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(passage);
                        spaceToast.success('Copied passage to clipboard');
                      } catch (e) {
                        spaceToast.error('Copy failed');
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      borderRadius: '8px',
                      color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                    }}
                  />
                </Tooltip>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: theme === 'sun' ? '#000000' : 'rgb(45, 27, 105)' }}>{passage}</div>
              </div>
            )}
          </Card>

          {/* Step 2 - Configure and Generate Questions (UI mirrors AIGenerateQuestions) */}
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
              backdropFilter: 'blur(10px)'
            }}
          >
            <Title level={3} style={{ textAlign: 'center', color: theme === 'sun' ? '#1890ff' : '#8B5CF6' }}>
              Step 2: Generate question with AI
            </Title>

            <TextArea
              value={promptDescription}
              onChange={(e) => setPromptDescription(e.target.value)}
              autoSize={{ minRows: 4, maxRows: 8 }}
              placeholder={t('dailyChallenge.pleaseEnterPrompt') || 'Provide extra instructions (optional)'}
              style={{
                marginTop: 12,
                fontSize: '15px',
                borderRadius: '12px',
                border: theme === 'sun'
                  ? '2px solid rgba(113, 179, 253, 0.3)'
                  : '2px solid rgba(138, 122, 255, 0.3)',
                background: theme === 'sun'
                  ? 'rgba(240, 249, 255, 0.5)'
                  : 'rgba(244, 240, 255, 0.3)',
                outline: 'none',
                boxShadow: 'none'
              }}
            />

            <Divider style={{ margin: '24px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <Title level={3} style={{ margin: 0, fontSize: '20px', color: theme === 'sun' ? '#1890ff' : '#8B5CF6' }}>
                {t('dailyChallenge.questionTypeConfiguration') || 'Question Type Configuration'}
              </Title>
              <Tooltip title={t('dailyChallenge.addQuestionType') || 'Add Question Type'}>
                <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddQuestionType}>{t('dailyChallenge.addQuestionType') || 'Add Question Type'}</Button>
              </Tooltip>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {questionTypeConfigs.map((config, index) => {
                const qt = availableQuestionTypes.find(x => x.value === config.questionType);
                return (
                  <div key={index} style={{ borderRadius: 12, padding: 16, border: `2px solid ${qt?.color}30`, background: theme === 'sun' ? `linear-gradient(135deg, ${qt?.bgColor}, rgba(255,255,255,0.8))` : `linear-gradient(135deg, ${qt?.bgColor}, rgba(255,255,255,0.05))` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: `${qt?.color}20`, border: `2px solid ${qt?.color}40` }}>{qt?.icon}</div>
                      <Select value={config.questionType} onChange={(v) => handleQuestionTypeChange(index, v)} style={{ flex: 1 }}>
                        {availableQuestionTypes.map(opt => (
                          <Select.Option key={opt.value} value={opt.value}><span style={{ marginRight: 8 }}>{opt.icon}</span>{opt.label}</Select.Option>
                        ))}
                      </Select>
                       <Tooltip title={t('dailyChallenge.numberOfQuestions') || 'Number of Questions'}>
                         <Input
                           type="number"
                           min={1}
                           max={100}
                           value={config.numberOfQuestions}
                           onChange={(e) => handleNumberOfQuestionsChange(index, parseInt(e.target.value) || 1)}
                           style={{
                             width: 80,
                             borderRadius: '8px',
                             border: theme === 'sun'
                               ? `2px solid ${qt?.color || '#1890ff'}40`
                               : `2px solid ${qt?.color || '#8B5CF6'}40`,
                             background: theme === 'sun' ? '#fff' : 'rgba(255, 255, 255, 0.1)',
                             fontSize: '14px',
                             fontWeight: 600
                           }}
                         />
                       </Tooltip>
                      <Tooltip title={t('dailyChallenge.removeQuestionType') || 'Remove'}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveQuestionType(index)}
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
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
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
                {isGenerating ? (t('dailyChallenge.generating') || 'Generating...') : 'Generate question'}
              </Button>
            </div>
          </Card>

          {/* Loading Animation - identical visual to AIGenerateQuestions */}
          {isGenerating && (
            <Card
              className={`loading-card ${theme}-loading-card`}
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
                marginBottom: '24px',
                backdropFilter: 'blur(10px)',
                animation: 'fadeInUp 0.5s ease-out'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '24px' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '120px', height: '120px', border: `3px solid ${primaryColor}20`, borderRadius: '50%', borderTop: `3px solid ${primaryColor}`, animation: 'spin 2s linear infinite' }} />
                  <div style={{ position: 'absolute', top: '20px', left: '20px', width: '80px', height: '80px', background: `radial-gradient(circle, ${primaryColor}30, ${primaryColor}10)`, borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '32px', color: primaryColor, animation: 'bounce 1s ease-in-out infinite' }}>🤖</div>
                </div>
                <Title level={3} style={{ marginTop: 0, marginBottom: '12px', fontSize: '24px', fontWeight: 700, color: primaryColor, animation: 'fadeInOut 2s ease-in-out infinite' }}>
                  {t('dailyChallenge.aiThinking') || 'AI is thinking...'}
                </Title>
                <div style={{ fontSize: '16px', color: theme === 'sun' ? '#666' : '#999', fontWeight: 500, marginBottom: '20px' }}>
                  {t('dailyChallenge.generatingQuestions') || 'Generating questions based on your prompt'}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: primaryColor, animation: `wave 1.4s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </Card>
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
                         question.type === 'REARRANGE' ? 'Reorder' :
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
                            if (text.includes('[[pos_')) {
                              const contentItems = Array.isArray(question.content?.data) ? question.content.data : [];
                              const positionIdToValue = new Map();
                              contentItems.forEach(item => {
                                if (item && item.positionId) positionIdToValue.set(String(item.positionId), item.value || '');
                              });
                              const parts = text.split(/(\[\[pos_[a-zA-Z0-9]+\]\])/g);
                              let blankRenderIndex = 0;
                              return parts.map((part, idx) => {
                                const isPlaceholder = /^\[\[pos_[a-zA-Z0-9]+\]\]$/.test(part);
                                if (!isPlaceholder) {
                                  return <React.Fragment key={idx}>{part}</React.Fragment>;
                                }
                                const match = part.match(/^\[\[pos_([a-zA-Z0-9]+)\]\]$/);
                                const posId = match ? match[1] : undefined;
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
                                      verticalAlign: 'middle',
                                      lineHeight: '1.4',
                                      fontSize: '14px',
                                      color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                      textAlign: 'center'
                                    }}
                                  >
                                    {displayText}
                                  </span>
                                );
                              });
                            }
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
                                      verticalAlign: 'middle',
                                      lineHeight: '1.4',
                                      fontSize: '14px',
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

                    {/* Reorder */}
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


