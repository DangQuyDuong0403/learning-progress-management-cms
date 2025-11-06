import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Input, Tooltip, Typography, Upload, Space } from "antd";
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, SaveOutlined, ThunderboltOutlined, CheckOutlined, CloudUploadOutlined } from "@ant-design/icons";
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
import "./AIGenerateQuestions.css";

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

  usePageTitle('AI Question Generation');

  const challengeInfo = useMemo(() => ({
    classId: location.state?.classId || null,
    className: location.state?.className || null,
    challengeId: location.state?.challengeId || id,
    challengeName: location.state?.challengeName || null,
    challengeType: 'LISTENING',
  }), [id, location.state?.classId, location.state?.className, location.state?.challengeId, location.state?.challengeName]);

  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [questions, setQuestions] = useState([]);
  // Track dropdown selections for interactive preview (same as Reading page)
  const [dropdownSelections, setDropdownSelections] = useState({});
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const uploadInputRef = useRef(null);
  // Match AIGenerateReading behavior: null (chooser), 'manual', 'upload'
  const [questionSettingsMode, setQuestionSettingsMode] = useState(null);
  const [hierarchy, setHierarchy] = useState(null);
  // Audio upload state (listening requirement)
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [uploadedAudioFileName, setUploadedAudioFileName] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);

  const primaryColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
  const primaryColorWithAlpha = theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)';
  const MAX_FILE_MB = 10;

  const availableQuestionTypes = useMemo(() => [
    { value: "MULTIPLE_CHOICE", label: t('dailyChallenge.multipleChoice') || 'Multiple Choice', icon: '📝', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "MULTIPLE_SELECT", label: t('dailyChallenge.multipleSelect') || 'Multiple Select', icon: '☑️', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "TRUE_OR_FALSE", label: t('dailyChallenge.trueFalse') || 'True/False', icon: '✅', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "FILL_IN_THE_BLANK", label: t('dailyChallenge.fillBlank') || 'Fill in the Blank', icon: '✏️', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "DROPDOWN", label: 'Dropdown', icon: '📋', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "DRAG_AND_DROP", label: 'Drag and Drop', icon: '🔄', color: primaryColor, bgColor: primaryColorWithAlpha },
    { value: "REARRANGE", label: 'Rearrange', icon: '🔀', color: primaryColor, bgColor: primaryColorWithAlpha },
  ], [t, primaryColor, primaryColorWithAlpha]);

  const [questionTypeConfigs, setQuestionTypeConfigs] = useState(() => availableQuestionTypes.map(q => ({ questionType: q.value, numberOfQuestions: 0 })));

  const handleNumberOfQuestionsChange = useCallback((index, value) => {
    setQuestionTypeConfigs(prev => prev.map((item, i) => (i === index ? { ...item, numberOfQuestions: value } : item)));
  }, []);

  // Initialize right panel (settings/upload) from navigation state
  useEffect(() => {
    const source = location.state?.aiSource;
    if (source === 'settings') {
      setQuestionSettingsMode('manual');
    } else if (source === 'file') {
      setQuestionSettingsMode('upload');
    }
  }, [location.state?.aiSource]);

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
          const optionsSource = Array.isArray(q?.options) ? q.options : Array.isArray(q?.content?.data) ? q.content.data : [];
          const options = optionsSource.length
            ? optionsSource.map((o, i) => ({ key: toKey(i), text: o?.text ?? o?.value ?? '', isCorrect: Boolean(o?.isCorrect || o?.correct) }))
            : [ { key: 'A', text: 'True', isCorrect: String(q?.correctAnswer || '').toLowerCase() === 'true' }, { key: 'B', text: 'False', isCorrect: String(q?.correctAnswer || '').toLowerCase() === 'false' } ];
          return { id: nextId(), type: 'TRUE_OR_FALSE', title: `Question ${counter}`, question: q?.question || q?.questionText || '', options, points: q?.points ?? q?.weight ?? q?.score ?? 1 };
        }
        case 'FILL_IN_THE_BLANK':
        case 'DROPDOWN':
        case 'DRAG_AND_DROP':
          return { id: nextId(), type, title: `Question ${counter}`, question: q?.question || q?.questionText || '', questionText: q?.questionText || q?.question || '', content: { data: Array.isArray(q?.content?.data) ? q.content.data : [] }, points: q?.points ?? q?.weight ?? q?.score ?? 1 };
        case 'REARRANGE': {
          const contentItems = Array.isArray(q?.content?.data) ? q.content.data : [];
          const posToVal = new Map();
          contentItems.forEach(it => { if (it && it.positionId) posToVal.set(String(it.positionId).replace(/^pos_/, ''), it.value); });
          const text = q?.questionText || q?.question || '';
          const ids = []; const re = /\[\[pos_([a-zA-Z0-9]+)\]\]/g; let m; while ((m = re.exec(text)) !== null) { ids.push(m[1]); }
          const words = ids.map(id => posToVal.get(id)).filter(Boolean);
          return { id: nextId(), type: 'REARRANGE', title: `Question ${counter}`, question: 'Rearrange the words by dragging them into the correct order:', questionText: text, sourceItems: words, correctOrder: words, content: { data: contentItems }, points: q?.points ?? q?.weight ?? q?.score ?? 1 };
        }
        default:
          return null;
      }
    }).filter(Boolean).map((q, idx) => ({ ...q, id: idx + 1, title: `Question ${idx + 1}` }));
  }, []);

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

  const handleUploadAudio = useCallback(async (file) => {
    try {
      const allowed = ['audio/mp3', 'audio/mpeg'];
      if (!allowed.includes(file.type)) {
        spaceToast.error('Please upload an MP3 file');
        return false;
      }
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        spaceToast.error('File size must be less than 10MB');
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
      spaceToast.success(`Audio file "${file.name}" uploaded successfully!`);
    } catch (e) {
      console.error('Audio upload error:', e);
      spaceToast.error(e?.response?.data?.message || e.message || 'Audio upload failed');
    } finally {
      setIsProcessingAudio(false);
    }
    return false;
  }, []);

  const handleGenerateWithAI = useCallback(async () => {
    if (!prompt.trim()) {
      spaceToast.error(t('dailyChallenge.pleaseEnterPrompt') || 'Please enter a prompt');
      return;
    }
    try {
      setIsGenerating(true);
      setShowPreview(false);
      const payload = {
        challengeId: challengeInfo.challengeId,
        questionTypeConfigs: questionTypeConfigs
          .filter((c) => Number(c.numberOfQuestions) > 0)
          .map((c) => ({ questionType: c.questionType, numberOfQuestions: Math.max(0, Number(c.numberOfQuestions) || 0) })),
        description: prompt,
      };
      // Note: backend API for generation currently accepts description only; audio is required by UI but not sent
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
      console.error('Generate listening AI questions error:', err);
      spaceToast.error(err?.response?.data?.message || err?.message || 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, challengeInfo.challengeId, questionTypeConfigs, t, normalizeQuestionsFromAI]);

  const handleGenerateFromFile = useCallback(async () => {
    if (!uploadedFile) {
      spaceToast.error('Please upload a file first');
      return;
    }
    try {
      setIsGenerating(true);
      setShowPreview(false);
      const res = await dailyChallengeApi.parseQuestionsFromFile(uploadedFile, prompt || '');
      let rawList = [];
      if (Array.isArray(res)) rawList = res; else if (Array.isArray(res?.questions)) rawList = res.questions; else if (Array.isArray(res?.data?.questions)) rawList = res.data.questions; else if (Array.isArray(res?.data)) rawList = res.data; else if (Array.isArray(res?.result?.questions)) rawList = res.result.questions;
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
      console.error('Generate listening from file error:', err);
      spaceToast.error(err?.response?.data?.message || err?.message || 'Failed to generate from file');
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedFile, prompt, normalizeQuestionsFromAI]);

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
    setQuestions(prev => prev.filter(q => q.id !== qid));
    spaceToast.success('Question deleted successfully');
  }, []);
  const handleSaveFromModal = useCallback((updated) => {
    setQuestions(prev => prev.map(q => q.id === updated.id ? { ...q, ...updated, title: q.title } : q));
    setIsEditModalVisible(false);
    setEditingQuestion(null);
    spaceToast.success('Question updated successfully');
  }, []);

  const handleSave = useCallback(async () => {
    if (!audioUrl) {
      spaceToast.error('Please upload an MP3 audio file');
      return;
    }
    if (!prompt.trim()) {
      spaceToast.error('Prompt is empty');
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

      const toApiQuestion = (q, orderNumber) => {
        const toData = (d) => Array.isArray(d) ? d : [];
        switch (q.type) {
          case 'MULTIPLE_CHOICE':
          case 'MULTIPLE_SELECT':
          case 'TRUE_OR_FALSE':
            return { questionText: q.question || q.questionText || '', orderNumber, weight: q.points || 1, questionType: q.type === 'TRUE_OR_FALSE' ? 'TRUE_OR_FALSE' : q.type, content: { data: toData((q.options || []).map((o, idx) => ({ id: o.key || `opt${idx + 1}`, value: o.text || '', correct: o.isCorrect === true }))) }, toBeDeleted: false };
          case 'FILL_IN_THE_BLANK':
          case 'DROPDOWN':
          case 'DRAG_AND_DROP':
          case 'REARRANGE':
            return { questionText: q.questionText || q.question || '', orderNumber, weight: q.points || 1, questionType: q.type, content: { data: toData(q.content?.data) }, toBeDeleted: false };
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
      spaceToast.error(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to save');
    } finally { setSaving(false); }
  }, [id, prompt, questions, navigate, user, challengeInfo, t, audioUrl]);

  const headerSubtitle = (challengeInfo.className && challengeInfo.challengeName)
    ? `${challengeInfo.className} / ${challengeInfo.challengeName}`
    : (challengeInfo.challengeName || null);

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
                {headerSubtitle || (t('dailyChallenge.dailyChallengeManagement') + ' / ' + (t('dailyChallenge.content') || 'Content'))}
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

  return (
    <ThemedLayout customHeader={customHeader} contentMargin={10}>
      <div className={`ai-generate-wrapper allow-motion ${theme}-ai-generate-wrapper`}>
        <div style={{ padding: '24px', maxWidth: '1500px', margin: '0 auto' }}>
          {/* Hierarchy info moved inside the main container */}
          <Card
            style={{ borderRadius: '20px', border: theme === 'sun' ? '2px solid rgba(24, 144, 255, 0.35)' : '2px solid rgba(139, 92, 246, 0.35)', background: theme === 'sun' ? 'linear-gradient(180deg, rgba(255,255,255,0.60) 0%, rgba(240,249,255,0.55) 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.50) 0%, rgba(244,240,255,0.45) 100%)', backdropFilter: 'blur(6px)', boxShadow: theme === 'sun' ? '0 8px 24px rgba(24, 144, 255, 0.12)' : '0 8px 24px rgba(139, 92, 246, 0.12)', padding: 16 }}
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
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'stretch' }}>
              <Card
                className={`prompt-description-card ${theme}-prompt-description-card`}
                style={{ borderRadius: '16px', border: theme === 'sun' ? '2px solid rgba(113, 179, 253, 0.25)' : '2px solid rgba(138, 122, 255, 0.2)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', backdropFilter: 'blur(10px)', minHeight: '540px', height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <Title level={3} style={{ textAlign: 'center', color: theme === 'sun' ? '#1890ff' : '#8B5CF6', marginTop: 0, fontSize: '26px' }}>Add transcript</Title>
                {/* Audio upload (required for Listening) */}
                <div style={{ marginTop: 4, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', position: 'relative' }}>
                    <Title level={5} style={{ margin: 0, color: theme === 'sun' ? '#1E40AF' : '#8377A0', fontSize: '16px', fontWeight: '600' }}>Audio File (MP3)</Title>
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
                        Remove
                      </Button>
                    )}
                  </div>

                  {audioUrl ? (
                    <div style={{ padding: '6px', background: theme === 'sun' ? 'rgba(240, 249, 255, 0.5)' : 'rgba(244, 240, 255, 0.3)', borderRadius: '6px', border: theme === 'sun' ? '1px solid rgba(113, 179, 253, 0.3)' : '1px solid rgba(138, 122, 255, 0.3)', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: theme === 'sun' ? '#1E40AF' : '#8377A0' }}>{uploadedAudioFileName || 'Audio file uploaded'}</span>
                      </div>
                      <audio controls style={{ width: '100%', height: '26px' }} volume={1.0} onLoadedMetadata={(e) => { e.target.volume = 1.0; }}>
                        <source src={audioPreviewUrl || audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  ) : (
                    <Card hoverable style={{ opacity: isProcessingAudio ? 0.6 : 1, borderRadius: '6px', border: theme === 'sun' ? '1px dashed rgba(113, 179, 253, 0.3)' : '1px dashed rgba(138, 122, 255, 0.3)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(230, 245, 255, 0.3) 0%, rgba(186, 231, 255, 0.2) 100%)' : 'rgba(255, 255, 255, 0.3)', cursor: isProcessingAudio ? 'not-allowed' : 'pointer', textAlign: 'center', padding: '8px' }}>
                      <Upload accept=".mp3" beforeUpload={handleUploadAudio} showUploadList={false} disabled={isProcessingAudio}>
                        <Space direction="vertical" size="small">
                          <span style={{ fontSize: 18 }}>🎵</span>
                          <div>
                            <Text strong style={{ color: theme === 'sun' ? '#1E40AF' : '#8377A0', fontSize: '12px' }}>
                              {isProcessingAudio ? (uploadedAudioFileName ? `Processing "${uploadedAudioFileName}"...` : 'Processing...') : 'Upload Audio File'}
                            </Text>
                            <br />
                            <Text style={{ color: '#999', fontSize: '10px' }}>MP3 (max 10MB)</Text>
                          </div>
                        </Space>
                      </Upload>
                    </Card>
                  )}
                </div>
                {questionSettingsMode !== null && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 4, marginBottom: 8 }}>
                    <div style={{ height: 8 }} />
                  </div>
                )}
                 <TextArea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  autoSize={{ minRows: 10, maxRows: 14 }}
                  placeholder={'Please add transcript'}
                   style={{ marginTop: 6, fontSize: '15px', borderRadius: '12px', border: `2px solid ${primaryColor}99`, background: theme === 'sun' ? 'rgba(240, 249, 255, 0.5)' : 'rgba(244, 240, 255, 0.3)', outline: 'none', boxShadow: 'none', minHeight: '300px' }}
                />
              </Card>

              <Card
                className={`prompt-description-card ${theme}-prompt-description-card`}
                style={{ borderRadius: '16px', border: theme === 'sun' ? '2px solid rgba(113, 179, 253, 0.25)' : '2px solid rgba(138, 122, 255, 0.2)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', backdropFilter: 'blur(10px)', height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <Title level={3} style={{ margin: 0, fontSize: '26px', color: theme === 'sun' ? '#1890ff' : '#8B5CF6', marginTop: 0, textAlign: 'center' }}>Question Settings</Title>
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
                            Generate question from file
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
                            Generate question from settings
                          </Typography.Text>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {questionSettingsMode === 'upload' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16, width: '100%', minHeight: 540 }}>
                    <Button
                      icon={<ArrowLeftOutlined />}
                      onClick={() => setQuestionSettingsMode(null)}
                      className={`class-menu-back-button ${theme}-class-menu-back-button`}
                      style={{ height: '32px', borderRadius: '8px', fontWeight: 500, fontSize: '14px', marginBottom: 16, alignSelf: 'flex-start' }}
                    >
                      {t('common.back')}
                    </Button>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                      <label
                        htmlFor="listening-question-upload-input"
                        style={{ width: 380, height: 220, borderRadius: 20, border: `2px dashed ${theme === 'sun' ? 'rgba(24, 144, 255, 0.7)' : 'rgba(139, 92, 246, 0.7)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240, 249, 255, 0.6))' : 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(244, 240, 255, 0.6))', boxShadow: theme === 'sun' ? '0 8px 24px rgba(24, 144, 255, 0.08)' : '0 8px 24px rgba(139, 92, 246, 0.08)' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                          <CloudUploadOutlined style={{ fontSize: 56, color: theme === 'sun' ? '#1890ff' : '#8B5CF6' }} />
                          <Typography.Text style={{ fontWeight: 700, color: theme === 'sun' ? '#1E40AF' : '#6F61A8' }}>Click to upload</Typography.Text>
                          <Typography.Text style={{ fontSize: 12, opacity: 0.8, color: theme === 'sun' ? '#0f172a' : '#d1cde8' }}>
                            Supported: .doc, .docx — Max {MAX_FILE_MB}MB
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
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      loading={isGenerating}
                      disabled={!uploadedFile}
                      onClick={handleGenerateFromFile}
                      style={{ marginTop: 16, height: '40px', borderRadius: '8px', fontSize: '16px', fontWeight: 500, padding: '0 24px', background: theme === 'sun' ? 'linear-gradient(135deg, #66AEFF, #3C99FF)' : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)', border: 'none', color: '#000000' }}
                    >
                      Generate From File
                    </Button>
                  </div>
                )}

                {questionSettingsMode === 'manual' && (
                  <>
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
                    <div style={{ border: `2px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.6)' : 'rgba(139, 92, 246, 0.6)'}`, borderRadius: '16px', background: theme === 'sun' ? 'rgba(24, 144, 255, 0.06)' : 'rgba(139, 92, 246, 0.08)', padding: '12px', boxShadow: theme === 'sun' ? 'inset 0 0 0 1px rgba(24, 144, 255, 0.05)' : 'inset 0 0 0 1px rgba(139, 92, 246, 0.08)', height: '400px', overflowY: 'auto' }}>
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

          {isGenerating && (
            <Card className={`loading-card allow-motion ${theme}-loading-card`} style={{ borderRadius: '16px', border: theme === 'sun' ? '2px solid rgba(113, 179, 253, 0.25)' : '2px solid rgba(138, 92, 255, 0.2)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', marginTop: '24px', marginBottom: '24px', backdropFilter: 'blur(10px)', animation: 'fadeInUp 0.5s ease-out' }}>
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

          {showPreview && (
            <div style={{ marginTop: '24px' }}>
              {questions.map((question) => (
                <div key={question.id} className={`question-item ${theme}-question-item`} style={{ marginBottom: '24px', borderRadius: '16px', padding: '24px', border: '2px solid', borderColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', background: theme === 'sun' ? 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 249, 255, 0.95) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 240, 255, 0.95) 100%)', boxShadow: theme === 'sun' ? '0 4px 16px rgba(113, 179, 253, 0.1)' : '0 4px 16px rgba(138, 122, 255, 0.12)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', backdropFilter: 'blur(10px)' }}>
                  <div className="question-header" style={{ paddingBottom: '14px', marginBottom: '16px', borderBottom: '2px solid', borderBottomColor: theme === 'sun' ? 'rgba(113, 179, 253, 0.25)' : 'rgba(138, 122, 255, 0.2)', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Typography.Text strong style={{ fontSize: '16px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>{question.title}</Typography.Text>
                      <Typography.Text style={{ fontSize: '14px', color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                        {question.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' :
                         question.type === 'MULTIPLE_SELECT' ? 'Multiple Select' :
                         question.type === 'TRUE_OR_FALSE' ? 'True/False' :
                         question.type === 'FILL_IN_THE_BLANK' ? 'Fill in the Blank' :
                         question.type === 'DROPDOWN' ? 'Dropdown' :
                         question.type === 'DRAG_AND_DROP' ? 'Drag and Drop' :
                         question.type === 'REARRANGE' ? 'Rearrange' : question.type}
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
                        <Typography.Text style={{ fontSize: '15px', fontWeight: 350, lineHeight: '1.8', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', whiteSpace: 'pre-wrap' }}>
                          {(() => {
                            const text = question.questionText || question.question || '';
                            const blanks = question.blanks || [];
                            if (text.includes('[[pos_')) {
                              const contentItems = Array.isArray(question.content?.data) ? question.content.data : [];
                              const positionIdToValue = new Map();
                              contentItems.forEach(item => { if (item && item.positionId) positionIdToValue.set(String(item.positionId), item.value || ''); });
                              const parts = text.split(/(\[\[pos_[a-zA-Z0-9]+\]\])/g);
                              let blankRenderIndex = 0;
                              return parts.map((part, idx) => {
                                const isPlaceholder = /^\[\[pos_[a-zA-Z0-9]+\]\]$/.test(part);
                                if (!isPlaceholder) { return <React.Fragment key={idx}>{part}</React.Fragment>; }
                                const match = part.match(/^\[\[pos_([a-zA-Z0-9]+)\]\]$/);
                                const posId = match ? match[1] : undefined;
                                const mappedValue = (posId && positionIdToValue.get(String(posId))) || undefined;
                                const displayText = mappedValue || blanks[blankRenderIndex]?.answer || blanks[blankRenderIndex]?.placeholder || '';
                                const key = `blank-${idx}`;
                                blankRenderIndex += 1;
                                return (
                                  <span key={key} style={{ display: 'inline-block', minWidth: '120px', maxWidth: '200px', minHeight: '32px', padding: '4px 12px', margin: '0 8px', background: '#E9EEFF94', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`, borderRadius: '8px', cursor: 'default', verticalAlign: 'middle', lineHeight: '1.4', fontSize: '14px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', textAlign: 'center' }}>
                                    {displayText}
                                  </span>
                                );
                              });
                            }
                            return text.split('______').map((part, idx) => (
                              <React.Fragment key={idx}>
                                {part}
                                {idx < blanks.length && (
                                  <span style={{ display: 'inline-block', minWidth: '120px', maxWidth: '200px', minHeight: '32px', padding: '4px 12px', margin: '0 8px', background: '#E9EEFF94', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`, borderRadius: '8px', verticalAlign: 'middle', lineHeight: '1.4', fontSize: '14px', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', textAlign: 'center' }}>
                                    {blanks[idx]?.placeholder || ''}
                                  </span>
                                )}
                              </React.Fragment>
                            ));
                          })()}
                        </Typography.Text>
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
                            if (!match) { return <React.Fragment key={idx}>{part}</React.Fragment>; }
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
                          if (renderedAny) return rendered; return text;
                        })()}
                      </div>
                    )}

                    {question.type === 'DRAG_AND_DROP' && (
                      <>
                        <div style={{ display: 'flex', gap: '24px', minHeight: '300px' }}>
                          <div style={{ flex: '1', padding: '20px', background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}` }}>
                            <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '16px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                              Complete the sentence by dragging words into the blanks:
                            </Typography.Text>
                            <div style={{ fontSize: '15px', fontWeight: 350, lineHeight: '2.4', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', marginBottom: '16px' }}>
                              {(() => {
                                const text = question.questionText || question.sentence || '';
                                const items = Array.isArray(question.content?.data) ? question.content.data : [];
                                const posToCorrect = new Map();
                                items.filter(it => it.positionId && it.correct === true).forEach((it) => { posToCorrect.set(String(it.positionId), it.value); });
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
                                      <div key={`ddp-${idx}`} style={{ display: 'inline-block', minWidth: '120px', height: '32px', margin: '0 8px', background: theme === 'sun' ? 'rgba(24, 144, 255, 0.15)' : 'rgba(138, 122, 255, 0.18)', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`, borderRadius: '8px', padding: '4px 12px', fontSize: '15px', color: theme === 'sun' ? '#1890ff' : '#8B5CF6', verticalAlign: 'top', lineHeight: '1.4', textAlign: 'center', fontWeight: 600 }}>
                                        {val}
                                      </div>
                                    );
                                  });
                                }
                                const cleanText = text.replace(/\[\[pos_[a-zA-Z0-9]+\]\]/g, '___');
                                return cleanText;
                              })()}
                            </div>
                          </div>
                          <div style={{ flex: '1', padding: '20px', background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}` }}>
                            <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '16px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                              Available words:
                            </Typography.Text>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
                              {(() => {
                                const items = Array.isArray(question.content?.data) ? question.content.data : [];
                                const incorrect = items.length > 0 ? items.filter(it => !it.positionId || it.correct === false).map(it => it.value) : (question.availableWords || []);
                                return incorrect.map((word, wordIdx) => (
                                  <div key={wordIdx} style={{ padding: '12px 20px', background: theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)', border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`, borderRadius: '12px', fontSize: '16px', fontWeight: '600', color: theme === 'sun' ? '#1890ff' : '#8B5CF6', userSelect: 'none', minWidth: '80px', textAlign: 'center' }}>
                                    {word}
                                  </div>
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
                          {question.question || 'Rearrange the words by dragging them into the correct order:'}
                        </Typography.Text>
                        <div style={{ marginBottom: '24px', padding: '20px', background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}` }}>
                          <Typography.Text style={{ fontSize: '14px', fontWeight: 350, marginBottom: '16px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                            Drop the words here in order:
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
                            Available words:
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
  );
};

export default AIGenerateListening;


