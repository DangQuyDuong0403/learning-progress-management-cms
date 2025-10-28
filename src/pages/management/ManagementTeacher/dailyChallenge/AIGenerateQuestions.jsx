import React, { useState, useCallback } from "react";
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
  EditOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import { spaceToast } from "../../../../component/SpaceToastify";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useSelector } from "react-redux";
import usePageTitle from "../../../../hooks/usePageTitle";
import MultipleChoiceModal from "./questionModals/MultipleChoiceModal";
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
      
      // Set fake data for preview - questions are already initialized with sample data
      
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
  


  // Handle editing a question
  const handleEditQuestion = useCallback((questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      // Only open modal for Multiple Choice or Multiple Select for now
      if (question.type === 'MULTIPLE_CHOICE' || question.type === 'MULTIPLE_SELECT') {
        // Convert question data to modal format
        const modalData = {
          id: question.id,
          type: question.type,
          question: question.question,
          points: question.points,
          options: question.options || [],
        };
        
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

  // Handle updating question points
  const handleUpdateQuestionPoints = useCallback((questionId, points) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, points } : q
    ));
  }, []);

  // Handle save from edit modal
  const handleSaveFromModal = useCallback((updatedQuestion) => {
    setQuestions(prev => prev.map(q => 
      q.id === updatedQuestion.id ? { ...q, ...updatedQuestion } : q
    ));
    setIsEditModalVisible(false);
    setEditingQuestion(null);
    spaceToast.success('Question updated successfully');
  }, []);

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
                         question.type === 'REARRANGE' ? 'Reorder' :
                         question.type === 'REWRITE' ? 'Re-write' : question.type}
                      </Typography.Text>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                        <Select
                          value={question.points}
                          onChange={(value) => handleUpdateQuestionPoints(question.id, value)}
                          style={{ width: 120 }}
                          options={[
                            { value: 1, label: '1 point' },
                            { value: 2, label: '2 points' },
                            { value: 3, label: '3 points' },
                            { value: 5, label: '5 points' },
                          ]}
                        />
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
                    {question.type === 'FILL_IN_THE_BLANK' && question.blanks && (
                      <div style={{ marginBottom: '16px' }}>
                        <Typography.Text style={{ 
                          fontSize: '15px', 
                          fontWeight: 350,
                          lineHeight: '1.8',
                          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {question.question.split('______').map((part, idx) => (
                            <React.Fragment key={idx}>
                              {part}
                              {idx < question.blanks.length && (
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
                                    cursor: 'text',
                                    outline: 'none',
                                    verticalAlign: 'middle',
                                    lineHeight: '1.4',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                    color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                    textAlign: 'center'
                                  }}
                                >
                                  {question.blanks[idx]?.placeholder || ''}
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </Typography.Text>
                      </div>
                    )}

                    {/* Dropdown */}
                    {question.type === 'DROPDOWN' && question.blanks && (
                      <>
                        <Typography.Text style={{ 
                          fontSize: '15px', 
                          fontWeight: 350,
                          marginBottom: '12px',
                          display: 'block',
                          lineHeight: '1.8',
                          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
                        }}>
                          {question.question}
                        </Typography.Text>

                        <div style={{
                          fontSize: '15px', 
                          fontWeight: 350,
                          lineHeight: '1.8',
                          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                          marginBottom: '16px'
                        }}>
                          {question.sentence?.split('___').map((part, idx) => (
                            <React.Fragment key={idx}>
                              {part}
                              {idx < question.blanks.length && (
                                <select
                                  value={question.blanks[idx]?.correctAnswer || ''}
                                  style={{
                                    display: 'inline-block',
                                    minWidth: '120px',
                                    height: '32px',
                                    padding: '4px 12px',
                                    margin: '0 8px',
                                    background: theme === 'sun' 
                                      ? 'rgba(24, 144, 255, 0.08)' 
                                      : 'rgba(138, 122, 255, 0.12)',
                                    border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    textAlign: 'center'
                                  }}
                                  disabled
                                >
                                  {question.blanks[idx]?.options?.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Drag and Drop */}
                    {question.type === 'DRAG_AND_DROP' && (
                      <>
                        <Typography.Text style={{ 
                          fontSize: '15px', 
                          fontWeight: 350,
                          marginBottom: '12px',
                          display: 'block',
                          lineHeight: '1.8',
                          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
                        }}>
                          {question.question}
                        </Typography.Text>

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
                              lineHeight: '1.8',
                              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                              marginBottom: '16px'
                            }}>
                              {question.sentence?.split('___').map((part, idx) => (
                                <React.Fragment key={idx}>
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
                                        fontWeight: '350',
                                        color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                        verticalAlign: 'top',
                                        lineHeight: '1.4',
                                        boxSizing: 'border-box',
                                        textAlign: 'center'
                                      }}
                                    >
                                      {idx === 0 ? 'love' : 'enjoy'}
                                    </div>
                                  )}
                                </React.Fragment>
                              ))}
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
                              {question.availableWords
                                ?.filter(word => word !== 'love' && word !== 'enjoy')
                                .map((word, wordIdx) => (
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

                    {/* Reorder/Rearrange */}
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
                          {question.question}
                        </Typography.Text>

                        {/* Original sentence */}
                        <div style={{
                          marginBottom: '20px',
                          fontSize: '15px',
                          fontWeight: '350',
                          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                          lineHeight: '1.8'
                        }}>
                          "{question.originalSentence}"
                        </div>

                        {/* Correct Answer Display */}
                        <div style={{ marginTop: '20px' }}>
                          <Typography.Text style={{ 
                            fontSize: '14px', 
                            fontWeight: 350,
                            marginBottom: '8px',
                            display: 'block',
                            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
                          }}>
                            Correct Answer:
                          </Typography.Text>
                          <div style={{
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
                              "{question.correctAnswer}"
                            </div>
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

      {/* Edit Modal - Multiple Choice */}
      {editingQuestion && (
        <MultipleChoiceModal
          visible={isEditModalVisible}
          onCancel={handleCancelEditModal}
          onSave={handleSaveFromModal}
          questionData={editingQuestion}
          saving={false}
        />
      )}
    </ThemedLayout>
  );
};

export default AIGenerateQuestions;
