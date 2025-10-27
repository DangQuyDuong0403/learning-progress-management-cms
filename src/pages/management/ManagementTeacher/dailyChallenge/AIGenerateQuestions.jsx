import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  Button,
  Input,
  Select,
  Typography,
  Card,
  Tooltip,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useSelector } from "react-redux";
import usePageTitle from "../../../../hooks/usePageTitle";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import "./AIGenerateQuestions.css";

const { TextArea } = Input;
const { Title } = Typography;

const AIGenerateQuestions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  
  // Set page title
  usePageTitle('AI Question Generation');
  
  // Get data from navigation state
  const [challengeInfo] = useState({
    classId: location.state?.classId || null,
    className: location.state?.className || null,
    challengeId: location.state?.challengeId || id,
    challengeName: location.state?.challengeName || null,
    challengeType: location.state?.challengeType || null,
  });
  
  // State for prompt input
  const [promptDescription, setPromptDescription] = useState("");
  const [isTextAreaFocused, setIsTextAreaFocused] = useState(false);
  
  // State for question type configurations
  const [questionTypeConfigs, setQuestionTypeConfigs] = useState([
    { questionType: "MULTIPLE_CHOICE", numberOfQuestions: 1 }
  ]);
  
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Question editor states
  const [questionEditorData, setQuestionEditorData] = useState('');
  const [questionOptions, setQuestionOptions] = useState([
    { id: 1, text: '', isCorrect: false, color: '#A3D5FF' },
    { id: 2, text: '', isCorrect: false, color: '#B8E6B8' },
    { id: 3, text: '', isCorrect: false, color: '#FFD6A5' },
    { id: 4, text: '', isCorrect: false, color: '#FFB3D9' },
  ]);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [points, setPoints] = useState(1);
  const editorRef = useRef(null);
  
  // Question 2 (Multiple Select) states
  const [question2EditorData, setQuestion2EditorData] = useState('');
  const [question2Options, setQuestion2Options] = useState([
    { id: 1, text: '', isCorrect: false, color: '#A3D5FF' },
    { id: 2, text: '', isCorrect: false, color: '#B8E6B8' },
    { id: 3, text: '', isCorrect: false, color: '#FFD6A5' },
    { id: 4, text: '', isCorrect: false, color: '#FFB3D9' },
  ]);
  const [hoveredOption2, setHoveredOption2] = useState(null);
  const [points2, setPoints2] = useState(1);
  const editor2Ref = useRef(null);
  
  // Question types available - All with same theme colors
  const primaryColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
  const primaryColorWithAlpha = theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(139, 92, 246, 0.1)';
  
  const availableQuestionTypes = [
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
      label: 'Reorder', 
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
  ];
  
  // Handle adding a new question type configuration
  const handleAddQuestionType = useCallback(() => {
    if (questionTypeConfigs.length < 8) {
      setQuestionTypeConfigs(prev => [...prev, { questionType: "MULTIPLE_CHOICE", numberOfQuestions: 1 }]);
    } else {
      spaceToast.warning(t('dailyChallenge.maxQuestionTypesReached') || 'Maximum 8 question types allowed');
    }
  }, [questionTypeConfigs.length, t]);
  
  // Handle removing a question type configuration
  const handleRemoveQuestionType = useCallback((index) => {
    if (questionTypeConfigs.length > 1) {
      setQuestionTypeConfigs(prev => prev.filter((_, i) => i !== index));
    } else {
      spaceToast.warning(t('dailyChallenge.minOneQuestionType') || 'At least one question type is required');
    }
  }, [questionTypeConfigs.length, t]);
  
  // Handle updating question type
  const handleQuestionTypeChange = useCallback((index, value) => {
    setQuestionTypeConfigs(prev => prev.map((item, i) => 
      i === index ? { ...item, questionType: value } : item
    ));
  }, []);
  
  // Handle updating number of questions
  const handleNumberOfQuestionsChange = useCallback((index, value) => {
    setQuestionTypeConfigs(prev => prev.map((item, i) => 
      i === index ? { ...item, numberOfQuestions: value } : item
    ));
  }, []);
  
  // Handle AI generation
  const handleGenerateWithAI = useCallback(async () => {
    // Validation
    if (!promptDescription.trim()) {
      spaceToast.error(t('dailyChallenge.pleaseEnterPrompt') || 'Please enter a prompt description');
      return;
    }
    
    try {
      setIsGenerating(true);
      setShowPreview(false);
      
      // Simulate AI generation process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set fake data for preview
      setQuestionEditorData('<p>What is the capital city of Vietnam?</p>');
      setQuestionOptions([
        { id: 1, text: '<p>Ho Chi Minh City</p>', isCorrect: false, color: '#A3D5FF' },
        { id: 2, text: '<p>Hanoi</p>', isCorrect: true, color: '#B8E6B8' },
        { id: 3, text: '<p>Da Nang</p>', isCorrect: false, color: '#FFD6A5' },
        { id: 4, text: '<p>Hue</p>', isCorrect: false, color: '#FFB3D9' },
      ]);
      setPoints(2);

      // Set fake data for Question 2 (Multiple Select)
      setQuestion2EditorData('<p>Which of the following are programming languages?</p>');
      setQuestion2Options([
        { id: 1, text: '<p>JavaScript</p>', isCorrect: true, color: '#A3D5FF' },
        { id: 2, text: '<p>Python</p>', isCorrect: true, color: '#B8E6B8' },
        { id: 3, text: '<p>HTML</p>', isCorrect: false, color: '#FFD6A5' },
        { id: 4, text: '<p>Java</p>', isCorrect: true, color: '#FFB3D9' },
      ]);
      setPoints2(3);
      
      setShowPreview(true);
      
      spaceToast.success(t('dailyChallenge.aiQuestionsGenerated') || 'AI questions generated successfully!');
      
    } catch (error) {
      console.error('Error generating AI questions:', error);
      spaceToast.error(error.message || 'Failed to generate AI questions');
    } finally {
      setIsGenerating(false);
    }
  }, [promptDescription, t]);

  // Handle save
  const handleSave = useCallback(async () => {
    // Validation
    if (!promptDescription.trim()) {
      spaceToast.error(t('dailyChallenge.pleaseEnterPrompt') || 'Please enter a prompt description');
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare AI generation request data
      const requestData = {
        challengeId: id,
        prompt: promptDescription,
        questionTypeConfigs
      };
      
      console.log('AI Generation Request Data:', requestData);
      
      // TODO: Call AI generation API
      // const response = await dailyChallengeApi.generateAIQuestions(requestData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      spaceToast.success(t('dailyChallenge.aiQuestionsGenerated') || 'AI questions generated successfully!');
      
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
          className: challengeInfo.className
        }
      });
      
    } catch (error) {
      console.error('Error generating AI questions:', error);
      spaceToast.error(error.response?.data?.error || error.message || 'Failed to generate AI questions');
    } finally {
      setSaving(false);
    }
  }, [id, promptDescription, questionTypeConfigs, navigate, user, challengeInfo, t]);
  
  // Custom upload adapter for CKEditor
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

  // Get option colors
  const getOptionColors = useCallback(() => {
    return [
      '#A3D5FF', // Pastel Blue
      '#B8E6B8', // Pastel Green
      '#FFD6A5', // Pastel Orange
      '#FFB3D9', // Pastel Pink
      '#A8E6E6', // Pastel Cyan
      '#D4B5E6', // Pastel Purple
      '#FFCCAA', // Pastel Peach
      '#B3C7FF', // Pastel Periwinkle
    ];
  }, []);

  // CKEditor configuration
  const questionEditorConfig = useMemo(() => ({
    placeholder: 'Enter your question here...',
    extraPlugins: [CustomUploadAdapterPlugin],
    toolbar: {
      items: [
        'bold', 'italic', '|',
        'bulletedList', 'numberedList', '|',
        'undo', 'redo', '|',
        'more'
      ],
      shouldNotGroupWhenFull: false
    },
    heading: {
      options: [
        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
      ]
    }
  }), []);

  const optionEditorConfig = useMemo(() => ({
    placeholder: 'Type your answer here...',
    extraPlugins: [CustomUploadAdapterPlugin],
    toolbar: {
      items: [
        'bold', 'italic', '|',
        'undo', 'redo', '|',
        'more'
      ],
      shouldNotGroupWhenFull: false
    }
  }), []);

  // Question editor handlers
  const handleEditorChange = useCallback((event, editor) => {
    const data = editor.getData();
    setQuestionEditorData(data);
  }, []);

  const handleAddOption = useCallback(() => {
    setQuestionOptions(prevOptions => {
      const newId = Math.max(...prevOptions.map((opt) => opt.id)) + 1;
      const colors = getOptionColors();
      const newColor = colors[prevOptions.length % colors.length];
      return [
        ...prevOptions,
        { id: newId, text: '', isCorrect: false, color: newColor },
      ];
    });
  }, [getOptionColors]);

  const handleRemoveOption = useCallback((optionId) => {
    setQuestionOptions(prevOptions => {
      if (prevOptions.length > 2) {
        return prevOptions.filter((opt) => opt.id !== optionId);
      } else {
        spaceToast.warning('Question must have at least 2 options');
        return prevOptions;
      }
    });
  }, []);

  const handleOptionChange = useCallback((optionId, field, value) => {
    setQuestionOptions(prevOptions => {
      return prevOptions.map((opt) =>
        opt.id === optionId
          ? { ...opt, [field]: value }
          : field === 'isCorrect' && value === true
          ? { ...opt, isCorrect: false }
          : opt
      );
    });
  }, []);

  const handleOptionEditorChange = useCallback((optionId, event, editor) => {
    const data = editor.getData();
    handleOptionChange(optionId, 'text', data);
  }, [handleOptionChange]);

  // Question 2 handlers
  const handleEditor2Change = useCallback((event, editor) => {
    const data = editor.getData();
    setQuestion2EditorData(data);
  }, []);

  const handleAddOption2 = useCallback(() => {
    setQuestion2Options(prevOptions => {
      const newId = Math.max(...prevOptions.map((opt) => opt.id)) + 1;
      const colors = getOptionColors();
      const newColor = colors[prevOptions.length % colors.length];
      return [
        ...prevOptions,
        { id: newId, text: '', isCorrect: false, color: newColor },
      ];
    });
  }, [getOptionColors]);

  const handleRemoveOption2 = useCallback((optionId) => {
    setQuestion2Options(prevOptions => {
      if (prevOptions.length > 2) {
        return prevOptions.filter((opt) => opt.id !== optionId);
      } else {
        spaceToast.warning('Question must have at least 2 options');
        return prevOptions;
      }
    });
  }, []);

  const handleOption2Change = useCallback((optionId, field, value) => {
    setQuestion2Options(prevOptions => {
      return prevOptions.map((opt) =>
        opt.id === optionId
          ? { ...opt, [field]: value }
          : opt
      );
    });
  }, []);

  const handleOption2EditorChange = useCallback((optionId, event, editor) => {
    const data = editor.getData();
    handleOption2Change(optionId, 'text', data);
  }, [handleOption2Change]);

  // Delete question
  const handleDeleteQuestion = useCallback(() => {
    setShowPreview(false);
    setQuestionEditorData('');
    setQuestionOptions([
      { id: 1, text: '', isCorrect: false, color: '#A3D5FF' },
      { id: 2, text: '', isCorrect: false, color: '#B8E6B8' },
      { id: 3, text: '', isCorrect: false, color: '#FFD6A5' },
      { id: 4, text: '', isCorrect: false, color: '#FFB3D9' },
    ]);
    setPoints(1);
    setHoveredOption(null);
    
    // Reset Question 2
    setQuestion2EditorData('');
    setQuestion2Options([
      { id: 1, text: '', isCorrect: false, color: '#A3D5FF' },
      { id: 2, text: '', isCorrect: false, color: '#B8E6B8' },
      { id: 3, text: '', isCorrect: false, color: '#FFD6A5' },
      { id: 4, text: '', isCorrect: false, color: '#FFB3D9' },
    ]);
    setPoints2(1);
    setHoveredOption2(null);
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
              <span>{t('dailyChallenge.createWithAI') || 'Tạo câu hỏi bằng AI'}</span>
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
      <div className={`ai-generate-wrapper ${theme}-ai-generate-wrapper`}>
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Prompt Description Card */}
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
            <Title level={3} style={{ 
              marginTop: 0, 
              marginBottom: '16px', 
              fontSize: '22px', 
              fontWeight: 700,
              textAlign: 'center',
              color: theme === 'sun' ? '#1890ff' : '#8B5CF6'
            }}>
              {t('dailyChallenge.createReading') || 'Create Questions with AI'}
            </Title>
            
            <TextArea
              value={promptDescription}
              onChange={(e) => setPromptDescription(e.target.value)}
              onFocus={() => setIsTextAreaFocused(true)}
              onBlur={() => setIsTextAreaFocused(false)}
              autoSize={{ minRows: 6, maxRows: 10 }}
              style={{
                fontSize: '15px',
                borderRadius: '12px',
                border: isTextAreaFocused
                  ? theme === 'sun'
                    ? '2px solid rgba(24, 144, 255, 0.6)'
                    : '2px solid rgba(139, 92, 246, 0.6)'
                  : theme === 'sun'
                  ? '2px solid rgba(113, 179, 253, 0.3)'
                  : '2px solid rgba(138, 122, 255, 0.3)',
                background: theme === 'sun'
                  ? 'rgba(240, 249, 255, 0.5)'
                  : 'rgba(244, 240, 255, 0.3)',
                outline: 'none',
              }}
            />
            
            <Divider style={{ margin: '24px 0' }} />
            
            {/* Question Type Configuration Section */}
            <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <Title level={3} style={{ 
                marginTop: 0, 
                marginBottom: 0, 
                fontSize: '20px', 
                fontWeight: 700,
                color: theme === 'sun' ? '#1890ff' : '#8B5CF6'
              }}>
                {t('dailyChallenge.questionTypeConfiguration') || 'Question Type Configuration'}
              </Title>
              
              <Tooltip title={t('dailyChallenge.addQuestionType') || 'Add Question Type'}>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddQuestionType}
                  style={{
                    borderRadius: '8px',
                    border: theme === 'sun'
                      ? '2px dashed rgba(113, 179, 253, 0.5)'
                      : '2px dashed rgba(138, 122, 255, 0.5)',
                    color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                    height: '38px',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  {t('dailyChallenge.addQuestionType') || 'Add Question Type'}
                </Button>
              </Tooltip>
            </div>
            
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
               {questionTypeConfigs.map((config, index) => {
                 const questionType = availableQuestionTypes.find(qt => qt.value === config.questionType);
                 
                 return (
                   <div
                     key={index}
                     style={{
                       borderRadius: '12px',
                       border: `2px solid ${questionType?.color}30`,
                       background: theme === 'sun'
                         ? `linear-gradient(135deg, ${questionType?.bgColor}, rgba(255, 255, 255, 0.8))`
                         : `linear-gradient(135deg, ${questionType?.bgColor}, rgba(255, 255, 255, 0.05))`,
                       padding: '16px',
                       boxShadow: theme === 'sun'
                         ? `0 4px 16px ${questionType?.color}20`
                         : `0 4px 16px ${questionType?.color}30`,
                       transition: 'all 0.3s ease',
                       position: 'relative',
                       overflow: 'hidden'
                     }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.transform = 'translateY(-2px)';
                       e.currentTarget.style.boxShadow = theme === 'sun'
                         ? `0 8px 24px ${questionType?.color}30`
                         : `0 8px 24px ${questionType?.color}40`;
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.transform = 'translateY(0)';
                       e.currentTarget.style.boxShadow = theme === 'sun'
                         ? `0 4px 16px ${questionType?.color}20`
                         : `0 4px 16px ${questionType?.color}30`;
                     }}
                   >
                     {/* Background Pattern */}
                     <div
                       style={{
                         position: 'absolute',
                         top: '-20px',
                         right: '-20px',
                         width: '80px',
                         height: '80px',
                         borderRadius: '50%',
                         background: `radial-gradient(circle, ${questionType?.color}15, transparent)`,
                         opacity: 0.6
                       }}
                     />
                     
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                       {/* Question Type Icon & Select */}
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 auto', minWidth: 0 }}>
                         <div
                           style={{
                             width: '44px',
                             height: '44px',
                             borderRadius: '12px',
                             background: `linear-gradient(135deg, ${questionType?.color}20, ${questionType?.color}40)`,
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'center',
                             fontSize: '22px',
                             boxShadow: `0 4px 12px ${questionType?.color}30`,
                             border: `2px solid ${questionType?.color}40`,
                             transition: 'all 0.3s ease',
                             flexShrink: 0
                           }}
                           onMouseEnter={(e) => {
                             e.currentTarget.style.transform = 'scale(1.05) rotate(5deg)';
                             e.currentTarget.style.boxShadow = `0 6px 16px ${questionType?.color}40`;
                           }}
                           onMouseLeave={(e) => {
                             e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                             e.currentTarget.style.boxShadow = `0 4px 12px ${questionType?.color}30`;
                           }}
                         >
                           {questionType?.icon}
                         </div>
                         <Select
                           value={config.questionType}
                           onChange={(value) => handleQuestionTypeChange(index, value)}
                           style={{ 
                             flex: '1 1 auto',
                             minWidth: 0,
                             borderRadius: '10px'
                           }}
                           size="default"
                         >
                           {availableQuestionTypes.map(qt => (
                             <Select.Option key={qt.value} value={qt.value}>
                               <span style={{ marginRight: '8px', fontSize: '16px' }}>{qt.icon}</span>
                               {qt.label}
                             </Select.Option>
                           ))}
                         </Select>
                       </div>
                       
                       {/* Number of Questions */}
                       <Tooltip title={t('dailyChallenge.numberOfQuestions') || 'Number of Questions'}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto' }}>
                           <Input
                             type="number"
                             value={config.numberOfQuestions}
                             onChange={(e) => handleNumberOfQuestionsChange(index, parseInt(e.target.value) || 1)}
                             placeholder="#"
                             style={{ 
                               width: '70px', 
                               borderRadius: '8px',
                               border: `1px solid ${questionType?.color}40`,
                               background: theme === 'sun' ? '#fff' : 'rgba(255, 255, 255, 0.1)',
                               fontSize: '14px',
                               fontWeight: '600'
                             }}
                             size="default"
                             min={1}
                             max={100}
                           />
                         </div>
                       </Tooltip>
                       
                       {/* Delete Button */}
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
            
            {/* Generate Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleGenerateWithAI}
                loading={isGenerating}
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
                {isGenerating ? (t('dailyChallenge.generating') || 'Generating...') : (t('dailyChallenge.generateWithAI') || 'Generate with AI')}
              </Button>
            </div>
          </div>
          </Card>

          {/* Loading Animation */}
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

          {/* Question Editor */}
          {showPreview && (
            <>
                      <div style={{ 
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%)',
              borderRadius: '16px',
              border: '2px solid rgba(24, 144, 255, 0.1)',
              overflow: 'hidden'
            }}>
              {/* Top Toolbar */}
              <div style={{
                position: 'sticky',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderBottom: '2px solid rgba(24, 144, 255, 0.1)',
                padding: '16px 24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                    <span style={{ fontSize: '24px', fontWeight: 600 }}>
                      {t('dailyChallenge.question1') || 'Câu 1'}: {t('dailyChallenge.multipleChoice') || 'Multiple Choice'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                      <Select
                        value={points}
                        onChange={setPoints}
                        style={{ width: 120 }}
                        options={[
                          { value: 1, label: '1 point' },
                          { value: 2, label: '2 points' },
                          { value: 3, label: '3 points' },
                          { value: 5, label: '5 points' },
                        ]}
                      />
                    </div>

                    <Tooltip title={t('dailyChallenge.deleteQuestion') || 'Delete Question'}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleDeleteQuestion}
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
              </div>

              {/* Main Split Layout */}
                      <div style={{ 
                        display: 'flex', 
                padding: '16px',
                gap: '16px'
              }}>
                {/* Left Panel - Question Editor */}
                <div style={{ 
                  flex: '0 0 40%',
                  display: 'flex',
                  flexDirection: 'column',
                        gap: '12px', 
                  minHeight: 0
                }}>
                  {/* Question Card */}
                  <div style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 4px 16px rgba(24, 144, 255, 0.1)',
                    border: '2px solid rgba(24, 144, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                            display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: 0
                  }}>
                    {/* Decorative background elements */}
                          <div style={{ 
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: '200px',
                      height: '200px',
                      background: primaryColor,
                      opacity: 0.05,
                      borderRadius: '50%',
                      filter: 'blur(40px)'
                    }} />

                    {/* Question Input - CKEditor */}
                    <div style={{ 
                      flex: 1, 
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      zIndex: 1,
                      minHeight: 0,
                      overflow: 'hidden'
                    }}>
                          <div style={{ 
                        flex: 1,
                        borderRadius: '8px',
                        border: '1px solid rgba(24, 144, 255, 0.2)',
                        overflow: 'hidden',
                        background: 'rgba(240, 247, 255, 0.5)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <CKEditor
                          key="main-question-editor"
                          editor={ClassicEditor}
                          data={questionEditorData}
                          config={questionEditorConfig}
                          onChange={handleEditorChange}
                          onReady={(editor) => {
                            editorRef.current = editor;
                          }}
                        />
                      </div>
                          </div>
                        </div>
                      </div>

                {/* Right Panel - Answer Options Grid */}
                        <div style={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative'
                }}>
                  {/* Options Grid Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center', 
                    padding: '0 4px'
                  }}>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 600,
                      color: '#1890ff'
                    }}>
                      Answer Options ({questionOptions.length})
                    </span>
                    <Button
                      icon={<PlusOutlined />}
                      onClick={handleAddOption}
                      size="small"
                                style={{
                        height: '32px',
                        borderRadius: '6px',
                        fontWeight: 500,
                        fontSize: '14px',
                        padding: '0 16px',
                        border: 'none',
                        transition: 'all 0.3s ease',
                        background: 'linear-gradient(135deg, rgba(102, 174, 255, 0.6), rgba(60, 153, 255, 0.6))',
                        color: '#000000',
                        boxShadow: '0 2px 8px rgba(60, 153, 255, 0.2)',
                      }}
                    >
                      Add
                    </Button>
                              </div>

                  {/* Options Grid Container - 2x2 Layout */}
                          <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    flex: 1,
                    overflowY: 'auto',
                    padding: '4px'
                  }}>
                    {questionOptions.map((option, index) => (
                      <div
                        key={option.id}
                        onMouseEnter={() => setHoveredOption(option.id)}
                        onMouseLeave={() => setHoveredOption(null)}
                        style={{
                          background: `linear-gradient(135deg, ${option.color}cc 0%, ${option.color} 100%)`,
                          borderRadius: '12px',
                            padding: '12px',
                          minHeight: '200px',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: hoveredOption === option.id
                            ? `0 8px 24px ${option.color}80`
                            : '0 2px 8px rgba(0,0,0,0.08)',
                          border: option.isCorrect
                            ? '2px solid #52c41a'
                            : '1px solid rgba(255,255,255,0.5)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: hoveredOption === option.id ? 'translateY(-4px)' : 'translateY(0)',
                          transformOrigin: 'center',
                          cursor: 'pointer',
                          overflow: 'visible',
                          zIndex: hoveredOption === option.id ? 10 : 1
                        }}>
                        {/* Option Label */}
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.95)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                            fontSize: '14px',
                          color: '#333',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          border: `1px solid ${option.color}`
                        }}>
                          {String.fromCharCode(65 + index)}
              </div>

              {/* Action Buttons */}
              <div style={{ 
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                display: 'flex', 
                          gap: '6px',
                          alignItems: 'center'
                        }}>
                          {/* Correct Answer Badge */}
                          <Tooltip title={option.isCorrect ? "Correct Answer" : "Mark as Correct"}>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOptionChange(option.id, 'isCorrect', !option.isCorrect);
                  }}
                  style={{
                                background: option.isCorrect ? '#52c41a' : 'rgba(255,255,255,0.3)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: option.isCorrect ? '0 2px 8px rgba(82, 196, 26, 0.5)' : 'none'
                              }}
                            >
                              <CheckOutlined />
                              {option.isCorrect ? 'Correct' : 'Mark'}
                            </div>
                          </Tooltip>
                          
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            transition: 'opacity 0.2s ease'
                          }}>
                            <Tooltip title="Delete Option">
                <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveOption(option.id);
                                }}
                  style={{
                                  background: 'rgba(255, 77, 79, 0.9)',
                                  color: 'white',
                    border: 'none',
                                  borderRadius: '6px',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px'
                                }}
                              />
                            </Tooltip>
                          </div>
                        </div>

                        {/* Input Field - CKEditor */}
                        <div style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          marginTop: '36px',
                          marginBottom: '4px',
                          position: 'relative',
                          zIndex: 1
                        }}>
                          <div 
                            className={`option-editor option-editor-${option.id}`}
                            style={{
                              borderRadius: '8px',
                              overflow: 'hidden',
                              background: 'rgba(255, 255, 255, 0.98)',
                              border: '1px solid rgba(255,255,255,0.95)',
                              backdropFilter: 'blur(10px)',
                              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)'
                            }}
                          >
                            <CKEditor
                              key={`option-editor-${option.id}`}
                              editor={ClassicEditor}
                              data={option.text}
                              config={optionEditorConfig}
                              onChange={(event, editor) => handleOptionEditorChange(option.id, event, editor)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Question 2 - Multiple Select */}
            <div style={{ 
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%)',
              borderRadius: '16px',
              border: '2px solid rgba(24, 144, 255, 0.1)',
              overflow: 'hidden'
            }}>
              {/* Top Toolbar */}
              <div style={{
                position: 'sticky',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderBottom: '2px solid rgba(24, 144, 255, 0.1)',
                padding: '16px 24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '24px', fontWeight: 600 }}>
                      {t('dailyChallenge.question2') || 'Câu 2'}: {t('dailyChallenge.multipleSelect') || 'Multiple Select'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                      <Select
                        value={points2}
                        onChange={setPoints2}
                        style={{ width: 120 }}
                        options={[
                          { value: 1, label: '1 point' },
                          { value: 2, label: '2 points' },
                          { value: 3, label: '3 points' },
                          { value: 5, label: '5 points' },
                        ]}
                      />
                    </div>

                    <Tooltip title={t('dailyChallenge.deleteQuestion') || 'Delete Question'}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleDeleteQuestion}
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
              </div>

              {/* Main Split Layout */}
              <div style={{ 
                display: 'flex', 
                padding: '16px',
                gap: '16px'
              }}>
                {/* Left Panel - Question Editor */}
                <div style={{ 
                  flex: '0 0 40%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px', 
                  minHeight: 0
                }}>
                  {/* Question Card */}
                  <div style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 4px 16px rgba(24, 144, 255, 0.1)',
                    border: '2px solid rgba(24, 144, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: 0
                  }}>
                    {/* Decorative background elements */}
                    <div style={{ 
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: '200px',
                      height: '200px',
                      background: primaryColor,
                      opacity: 0.05,
                      borderRadius: '50%',
                      filter: 'blur(40px)'
                    }} />

                    {/* Question Input - CKEditor */}
                    <div style={{ 
                      flex: 1, 
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      zIndex: 1,
                      minHeight: 0,
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        flex: 1,
                        borderRadius: '8px',
                        border: '1px solid rgba(24, 144, 255, 0.2)',
                        overflow: 'hidden',
                        background: 'rgba(240, 247, 255, 0.5)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <CKEditor
                          key="question2-editor"
                          editor={ClassicEditor}
                          data={question2EditorData}
                          config={questionEditorConfig}
                          onChange={handleEditor2Change}
                          onReady={(editor) => {
                            editor2Ref.current = editor;
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Answer Options Grid */}
                <div style={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative'
                }}>
                  {/* Options Grid Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center', 
                    padding: '0 4px'
                  }}>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 600,
                      color: '#1890ff'
                    }}>
                      Answer Options ({question2Options.length})
                    </span>
                    <Button
                      icon={<PlusOutlined />}
                      onClick={handleAddOption2}
                      size="small"
                      style={{
                        height: '32px',
                        borderRadius: '6px',
                        fontWeight: 500,
                        fontSize: '14px',
                        padding: '0 16px',
                        border: 'none',
                        transition: 'all 0.3s ease',
                        background: 'linear-gradient(135deg, rgba(102, 174, 255, 0.6), rgba(60, 153, 255, 0.6))',
                        color: '#000000',
                        boxShadow: '0 2px 8px rgba(60, 153, 255, 0.2)',
                      }}
                    >
                      Add
                    </Button>
                  </div>

                  {/* Options Grid Container - 2x2 Layout */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    flex: 1,
                    overflowY: 'auto',
                    padding: '4px'
                  }}>
                    {question2Options.map((option, index) => (
                      <div
                        key={option.id}
                        onMouseEnter={() => setHoveredOption2(option.id)}
                        onMouseLeave={() => setHoveredOption2(null)}
                        style={{
                          background: `linear-gradient(135deg, ${option.color}cc 0%, ${option.color} 100%)`,
                          borderRadius: '12px',
                          padding: '12px',
                          minHeight: '200px',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: hoveredOption2 === option.id
                            ? `0 8px 24px ${option.color}80`
                            : '0 2px 8px rgba(0,0,0,0.08)',
                          border: option.isCorrect
                            ? '2px solid #52c41a'
                            : '1px solid rgba(255,255,255,0.5)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: hoveredOption2 === option.id ? 'translateY(-4px)' : 'translateY(0)',
                          transformOrigin: 'center',
                          cursor: 'pointer',
                          overflow: 'visible',
                          zIndex: hoveredOption2 === option.id ? 10 : 1
                        }}>
                        {/* Option Label */}
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.95)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px',
                          color: '#333',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          border: `1px solid ${option.color}`
                        }}>
                          {String.fromCharCode(65 + index)}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ 
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          display: 'flex', 
                          gap: '6px',
                          alignItems: 'center'
                        }}>
                          {/* Correct Answer Badge */}
                          <Tooltip title={option.isCorrect ? "Correct Answer" : "Mark as Correct"}>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOption2Change(option.id, 'isCorrect', !option.isCorrect);
                              }}
                              style={{
                                background: option.isCorrect ? '#52c41a' : 'rgba(255,255,255,0.3)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: option.isCorrect ? '0 2px 8px rgba(82, 196, 26, 0.5)' : 'none'
                              }}
                            >
                              <CheckOutlined />
                              {option.isCorrect ? 'Correct' : 'Mark'}
                            </div>
                          </Tooltip>
                          
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            transition: 'opacity 0.2s ease'
                          }}>
                            <Tooltip title="Delete Option">
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveOption2(option.id);
                                }}
                                style={{
                                  background: 'rgba(255, 77, 79, 0.9)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px'
                                }}
                              />
                            </Tooltip>
                          </div>
                        </div>

                        {/* Input Field - CKEditor */}
                        <div style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          marginTop: '36px',
                          marginBottom: '4px',
                          position: 'relative',
                          zIndex: 1
                        }}>
                          <div 
                            className={`option-editor option-editor-${option.id}`}
                            style={{
                              borderRadius: '8px',
                              overflow: 'hidden',
                              background: 'rgba(255, 255, 255, 0.98)',
                              border: '1px solid rgba(255,255,255,0.95)',
                              backdropFilter: 'blur(10px)',
                              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)'
                            }}
                          >
                            <CKEditor
                              key={`option2-editor-${option.id}`}
                              editor={ClassicEditor}
                              data={option.text}
                              config={optionEditorConfig}
                              onChange={(event, editor) => handleOption2EditorChange(option.id, event, editor)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </ThemedLayout>
  );
};

export default AIGenerateQuestions;
