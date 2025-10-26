import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./DailyChallengeContent.css";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import usePageTitle from "../../../../hooks/usePageTitle";

// Fake data for different question types
const generateFakeQuestions = () => {
  return [
    {
      id: 1,
      type: 'SECTION',
      title: 'The Concept of Nationality',
      passage: `Nationality is a legal relationship between an individual and a nation. It is the status of belonging to a particular nation, whether by birth or naturalization. This relationship grants certain rights and responsibilities to the individual within that nation's territory.

The concept of nationality has evolved over time and varies significantly between different countries and legal systems. In some countries, nationality is determined by the place of birth (jus soli), while in others, it is determined by the nationality of one's parents (jus sanguinis). Some countries use a combination of both principles.

Nationality provides individuals with various rights, including the right to vote, the right to work without restrictions, the right to access public services, and the right to protection by their government when traveling abroad. It also comes with responsibilities such as paying taxes, obeying laws, and potentially serving in the military.

The process of acquiring nationality can happen through birth, descent, naturalization, or other legal means depending on the country's laws. Some individuals may hold multiple nationalities, while others may be stateless if they don't possess the nationality of any country.

In the modern world, nationality plays a crucial role in determining an individual's identity, legal status, and relationship with the state. It affects everything from travel documents to educational opportunities and employment prospects.`,
      questions: [
        {
          id: 1,
          question: 'What is nationality?',
          options: [
            { key: 'A', text: 'A historical event', isCorrect: false },
            { key: 'B', text: 'A legal relationship between an individual and a nation', isCorrect: true },
            { key: 'C', text: 'A cultural tradition', isCorrect: false },
            { key: 'D', text: 'A type of government', isCorrect: false },
          ],
          points: 1
        },
        {
          id: 2,
          question: 'How can nationality be acquired?',
          options: [
            { key: 'A', text: 'Only through birth', isCorrect: false },
            { key: 'B', text: 'Only through naturalization', isCorrect: false },
            { key: 'C', text: 'Through birth, descent, naturalization, or other legal means', isCorrect: true },
            { key: 'D', text: 'Only through marriage', isCorrect: false },
          ],
          points: 1
        },
        {
          id: 3,
          question: 'What rights does nationality provide?',
          options: [
            { key: 'A', text: 'Only the right to vote', isCorrect: false },
            { key: 'B', text: 'Only the right to work', isCorrect: false },
            { key: 'C', text: 'The right to vote, work, access public services, and government protection', isCorrect: true },
            { key: 'D', text: 'Only the right to travel', isCorrect: false },
          ],
          points: 1
        }
      ],
      points: 3,
      questionText: 'Read the passage and answer the questions',
    },
    {
      id: 2,
      type: 'MULTIPLE_CHOICE',
      question: 'What is the capital city of Vietnam?',
      options: [
        { key: 'A', text: 'Ho Chi Minh City', isCorrect: false },
        { key: 'B', text: 'Hanoi', isCorrect: true },
        { key: 'C', text: 'Da Nang', isCorrect: false },
        { key: 'D', text: 'Can Tho', isCorrect: false },
      ],
      points: 1,
      questionText: 'What is the capital city of Vietnam?',
    },
    {
      id: 2,
      type: 'MULTIPLE_SELECT',
      question: 'Which of the following are Southeast Asian countries? (Select all that apply)',
      options: [
        { key: 'A', text: 'Vietnam', isCorrect: true },
        { key: 'B', text: 'Thailand', isCorrect: true },
        { key: 'C', text: 'Japan', isCorrect: false },
        { key: 'D', text: 'Malaysia', isCorrect: true },
      ],
      points: 2,
      questionText: 'Which of the following are Southeast Asian countries? (Select all that apply)',
    },
    {
      id: 3,
      type: 'TRUE_OR_FALSE',
      question: 'The Earth revolves around the Sun.',
      options: [
        { key: 'True', text: 'True', isCorrect: true },
        { key: 'False', text: 'False', isCorrect: false },
      ],
      points: 1,
      questionText: 'The Earth revolves around the Sun.',
    },
    {
      id: 4,
      type: 'FILL_IN_THE_BLANK',
      questionText: 'The largest planet in our solar system is _______.',
      content: {
        data: [
          { id: 1, value: 'Jupiter', positionId: 'pos_1', correct: true }
        ]
      },
      points: 2,
    },
    {
      id: 5,
      type: 'DROPDOWN',
      questionText: 'Paris is the capital city of [[pos_1]].',
      content: {
        data: [
          { id: 1, value: 'France', positionId: 'pos_1', correct: true },
          { id: 2, value: 'Germany', positionId: 'pos_1', correct: false },
          { id: 3, value: 'Italy', positionId: 'pos_1', correct: false },
        ]
      },
      points: 2,
    },
    {
      id: 6,
      type: 'DRAG_AND_DROP',
      questionText: 'Arrange the words to form a correct sentence: [[pos_1]] [[pos_2]] [[pos_3]].',
      content: {
        data: [
          { id: 1, value: 'I', positionId: 'pos_1', correct: true },
          { id: 2, value: 'love', positionId: 'pos_2', correct: true },
          { id: 3, value: 'programming', positionId: 'pos_3', correct: true },
          { id: 4, value: 'hate', correct: false },
          { id: 5, value: 'coding', correct: false },
        ]
      },
      points: 3,
    },
    {
      id: 7,
      type: 'REARRANGE',
      questionText: 'Rearrange to form a correct sentence: [[pos_1]] [[pos_2]] [[pos_3]] [[pos_4]] beautiful.',
      content: {
        data: [
          { id: 1, value: 'The', positionId: 'pos_1', positionOrder: 1 },
          { id: 2, value: 'flower', positionId: 'pos_2', positionOrder: 2 },
          { id: 3, value: 'is', positionId: 'pos_3', positionOrder: 3 },
          { id: 4, value: 'very', positionId: 'pos_4', positionOrder: 4 },
        ]
      },
      points: 3,
    },
    {
      id: 8,
      type: 'REWRITE',
      questionText: 'Rewrite the sentence in passive voice: The teacher explains the lesson.',
      content: {
        data: [
          { id: 1, value: 'The lesson is explained by the teacher.' }
        ]
      },
      points: 5,
    },
    {
      id: 9,
      type: 'MULTIPLE_CHOICE',
      question: 'Which programming language is used for web development?',
      options: [
        { key: 'A', text: 'JavaScript', isCorrect: true },
        { key: 'B', text: 'Assembly', isCorrect: false },
        { key: 'C', text: 'Machine Code', isCorrect: false },
        { key: 'D', text: 'Binary', isCorrect: false },
      ],
      points: 1,
      questionText: 'Which programming language is used for web development?',
    },
    {
      id: 10,
      type: 'TRUE_OR_FALSE',
      question: 'React is a JavaScript library for building user interfaces.',
      options: [
        { key: 'True', text: 'True', isCorrect: true },
        { key: 'False', text: 'False', isCorrect: false },
      ],
      points: 1,
      questionText: 'React is a JavaScript library for building user interfaces.',
    },
  ];
};

// Helper function to get question type label
const getQuestionTypeLabel = (type) => {
  switch(type) {
    case 'SECTION':
      return 'Reading Section';
    case 'MULTIPLE_CHOICE':
      return 'Multiple Choice';
    case 'MULTIPLE_SELECT':
      return 'Multiple Select';
    case 'TRUE_OR_FALSE':
      return 'True/False';
    case 'FILL_IN_THE_BLANK':
      return 'Fill in the Blank';
    case 'DROPDOWN':
      return 'Dropdown';
    case 'DRAG_AND_DROP':
      return 'Drag and Drop';
    case 'REARRANGE':
      return 'Rearrange';
    case 'REWRITE':
      return 'Re-write';
    default:
      return 'Multiple Choice';
  }
};

// Section Question Component for Reading/Listening sections
const SectionQuestionItem = ({ question, index, theme }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isMouseInQuestionArea, setIsMouseInQuestionArea] = useState(false);

  const handleAnswerSelect = (questionId, optionKey) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionKey
    }));
  };

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < question.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, question.questions.length]);

  const handlePrevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);


  // Add global wheel event listener
  useEffect(() => {
    const handleGlobalWheel = (e) => {
      if (isMouseInQuestionArea) {
        if (e.deltaY > 0) {
          // Scroll down - next question
          handleNextQuestion();
        } else {
          // Scroll up - previous question
          handlePrevQuestion();
        }
        
        // Prevent default scroll behavior and stop propagation
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('wheel', handleGlobalWheel, { passive: false });
    
    return () => {
      document.removeEventListener('wheel', handleGlobalWheel);
    };
  }, [isMouseInQuestionArea, handleNextQuestion, handlePrevQuestion]);

  const currentQuestion = question.questions[currentQuestionIndex];

  return (
    <div
      className={`section-question-item ${theme}-section-question-item`}
      style={{
        marginBottom: '24px',
        background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        border: theme === 'sun' 
          ? '2px solid rgba(0, 0, 0, 0.1)' 
          : '2px solid rgba(255, 255, 255, 0.1)',
        boxShadow: theme === 'sun' 
          ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)',
        borderBottom: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`
      }}>
        <Typography.Text strong style={{ fontSize: '16px' }}>
          {index + 1}. {getQuestionTypeLabel(question.type)}
        </Typography.Text>
        <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
          ({question.points} {question.points > 1 ? 'points' : 'point'})
        </Typography.Text>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'flex', height: '600px' }}>
        {/* Left Column - Reading Passage */}
        <div style={{
          flex: '1',
          padding: '24px',
          background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
          borderRight: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
          overflowY: 'auto'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <Typography.Title level={4} style={{ 
              margin: 0, 
              color: theme === 'sun' ? '#1E40AF' : '#FFFFFF',
              fontSize: '20px',
              fontWeight: 600
            }}>
              {question.title}
            </Typography.Title>
          </div>
          <div style={{
            fontSize: '15px',
            lineHeight: '1.8',
            color: theme === 'sun' ? '#333' : '#E5E7EB',
            textAlign: 'justify'
          }}>
            {question.passage}
          </div>
        </div>

        {/* Right Column - Questions */}
        <div style={{
          flex: '1',
          background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Scrollable Question Container */}
          <div 
            style={{
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              overflow: 'hidden'
            }}
            onMouseEnter={() => setIsMouseInQuestionArea(true)}
            onMouseLeave={() => setIsMouseInQuestionArea(false)}
          >
          {/* Question Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            padding: '12px 16px',
            background: theme === 'sun' ? '#f0f8ff' : 'rgba(24, 144, 255, 0.1)',
            borderRadius: '8px',
            border: `1px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`
          }}>
            <Button
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              size="small"
              style={{
                background: currentQuestionIndex === 0 ? 'transparent' : (theme === 'sun' ? '#1890ff' : '#8B5CF6'),
                color: currentQuestionIndex === 0 ? (theme === 'sun' ? '#999' : '#666') : '#ffffff',
                border: `1px solid ${currentQuestionIndex === 0 ? (theme === 'sun' ? '#d9d9d9' : '#666') : 'transparent'}`,
                borderRadius: '6px'
              }}
            >
              ← Previous
            </Button>
            <Typography.Text style={{ 
              fontSize: '14px', 
              fontWeight: 600,
              color: theme === 'sun' ? '#1890ff' : '#8B5CF6'
            }}>
              Question {currentQuestionIndex + 1} of {question.questions.length}
            </Typography.Text>
            <Button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === question.questions.length - 1}
              size="small"
              style={{
                background: currentQuestionIndex === question.questions.length - 1 ? 'transparent' : (theme === 'sun' ? '#1890ff' : '#8B5CF6'),
                color: currentQuestionIndex === question.questions.length - 1 ? (theme === 'sun' ? '#999' : '#666') : '#ffffff',
                border: `1px solid ${currentQuestionIndex === question.questions.length - 1 ? (theme === 'sun' ? '#d9d9d9' : '#666') : 'transparent'}`,
                borderRadius: '6px'
              }}
            >
              Next →
            </Button>
          </div>
          
          {/* Scroll hint */}
          <div style={{
            marginBottom: '20px',
            padding: '8px 12px',
            background: theme === 'sun' ? '#f6f8fa' : 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            border: `1px solid ${theme === 'sun' ? '#e1e4e8' : 'rgba(255, 255, 255, 0.1)'}`,
            textAlign: 'center'
          }}>
            <Typography.Text style={{ 
              fontSize: '12px', 
              color: theme === 'sun' ? '#666' : '#999',
              fontStyle: 'italic'
            }}>
              💡 Use mouse wheel to navigate between questions
            </Typography.Text>
          </div>

          {/* Current Question */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '20px',
              background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              marginBottom: '20px',
              border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`
            }}>
              <Typography.Text style={{ 
                fontSize: '16px', 
                fontWeight: 600,
                color: theme === 'sun' ? '#1E40AF' : '#FFFFFF',
                display: 'block',
                marginBottom: '16px'
              }}>
                {currentQuestion.question}
              </Typography.Text>
            </div>

            {/* Answer Options */}
            <div style={{ flex: 1 }}>
              {currentQuestion.options?.map((option) => (
                <div 
                  key={option.key} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '12px',
                    marginBottom: '12px',
                    padding: '16px',
                    background: selectedAnswers[currentQuestion.id] === option.key 
                      ? (theme === 'sun' ? '#e6f7ff' : 'rgba(24, 144, 255, 0.2)')
                      : (theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.03)'),
                    borderRadius: '8px',
                    border: `2px solid ${
                      selectedAnswers[currentQuestion.id] === option.key 
                        ? (theme === 'sun' ? '#1890ff' : '#8B5CF6')
                        : (theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)')
                    }`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => handleAnswerSelect(currentQuestion.id, option.key)}
                  onMouseEnter={(e) => {
                    if (selectedAnswers[currentQuestion.id] !== option.key) {
                      e.currentTarget.style.background = theme === 'sun' ? '#f0f8ff' : 'rgba(24, 144, 255, 0.1)';
                      e.currentTarget.style.borderColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedAnswers[currentQuestion.id] !== option.key) {
                      e.currentTarget.style.background = theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  <input 
                    type="radio" 
                    name={`question-${currentQuestion.id}`} 
                    checked={selectedAnswers[currentQuestion.id] === option.key}
                    onChange={() => handleAnswerSelect(currentQuestion.id, option.key)}
                    style={{ marginTop: '4px' }} 
                  />
                  <span style={{ flexShrink: 0, fontWeight: 600, fontSize: '16px' }}>
                    {option.key}.
                  </span>
                  <div 
                    style={{ flex: 1, fontSize: '15px', color: theme === 'sun' ? '#333' : '#E5E7EB' }}
                    dangerouslySetInnerHTML={{ __html: option.text }} 
                  />
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Question Item Component for Student View
const StudentQuestionItem = ({ question, index, theme }) => {

  // Helper function to render Fill in the Blank question
  const renderFillBlankQuestion = () => {
    if (question.type !== 'FILL_IN_THE_BLANK' || !question.questionText) {
      return null;
    }

    const blankColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
    
    let displayText = question.questionText;
    const answerChoices = [];
    
    if (question.content?.data) {
      question.content.data.forEach((item, idx) => {
        const number = idx + 1;
        const pattern = `[[pos_${item.positionId}]]`;
        
        displayText = displayText.replace(
          pattern,
          `<span style="display: inline-block; min-width: 150px; height: 40px; padding: 8px 12px; margin: 0 8px; border: 2px solid ${blankColor}; border-radius: 8px; background: ${theme === 'sun' ? '#f0f8ff' : '#f5f0ff'};"></span>`
        );
        
        answerChoices.push({
          number: number,
          value: item.value
        });
      });
    }

    return (
      <>
        <div 
          style={{ 
            marginBottom: '16px', 
            fontSize: '16px', 
            fontWeight: 500,
            lineHeight: '1.8'
          }}
          dangerouslySetInnerHTML={{ __html: displayText }}
        />
        {answerChoices.length > 0 && (
          <div style={{ 
            marginTop: '16px',
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px'
          }}>
            <Typography.Text style={{ fontSize: '14px', fontWeight: 600, marginRight: '8px' }}>
              Answer choices:
            </Typography.Text>
            {answerChoices.map((choice, idx) => (
              <span 
                key={idx}
                style={{
                  padding: '6px 16px',
                  background: theme === 'sun' 
                    ? 'rgba(24, 144, 255, 0.1)' 
                    : 'rgba(139, 92, 246, 0.15)',
                  border: `2px solid ${blankColor}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                ({choice.number}) {choice.value}
              </span>
            ))}
          </div>
        )}
      </>
    );
  };

  // Helper function to render Dropdown question
  const renderDropdownQuestion = () => {
    if (question.type !== 'DROPDOWN' || !question.questionText) {
      return null;
    }

    const dropdownColor = theme === 'sun' ? '#1890ff' : '#A78BFA';
    let displayText = question.questionText;
    const dropdownsData = [];
    
    if (question.content?.data) {
      const positionGroups = {};
      question.content.data.forEach((item) => {
        if (!positionGroups[item.positionId]) {
          positionGroups[item.positionId] = [];
        }
        positionGroups[item.positionId].push(item);
      });
      
      Object.keys(positionGroups).forEach((positionId, idx) => {
        const number = idx + 1;
        const pattern = `[[pos_${positionId}]]`;
        
        displayText = displayText.replace(
          pattern,
          `<select style="display: inline-block; min-width: 120px; height: 40px; padding: 8px 12px; margin: 0 8px; border: 2px solid ${dropdownColor}; border-radius: 8px; background: ${theme === 'sun' ? '#f0f8ff' : '#f5f0ff'}; font-size: 14px;">
             <option value="">Select...</option>
           </select>`
        );
        
        dropdownsData.push({
          number: number,
          options: positionGroups[positionId].map(item => item.value)
        });
      });
    }

    return (
      <>
        <div 
          style={{ 
            marginBottom: '16px', 
            fontSize: '16px', 
            fontWeight: 500,
            lineHeight: '1.8'
          }}
          dangerouslySetInnerHTML={{ __html: displayText }}
        />
        {dropdownsData.length > 0 && (
          <div style={{ 
            marginTop: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {dropdownsData.map((dropdown, idx) => (
              <div key={idx}>
                <Typography.Text style={{ fontSize: '13px', marginRight: '6px' }}>
                  Dropdown {dropdown.number}:
                </Typography.Text>
                <select style={{
                  padding: '6px 12px',
                  border: `2px solid ${dropdownColor}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                }}>
                  {dropdown.options.map((opt, optIdx) => (
                    <option key={optIdx} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  // Helper function to render Drag and Drop question
  const renderDragDropQuestion = () => {
    if (question.type !== 'DRAG_AND_DROP' || !question.questionText) {
      return null;
    }

    const blankColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
    let displayText = question.questionText;
    
    if (question.content?.data) {
      const correctOptions = question.content.data.filter(item => item.positionId);
      correctOptions.forEach((item) => {
        const pattern = `[[pos_${item.positionId}]]`;
        displayText = displayText.replace(
          pattern,
          `<span style="display: inline-block; min-width: 150px; height: 40px; padding: 8px 12px; margin: 0 8px; border: 2px solid ${blankColor}; border-radius: 8px; background: ${theme === 'sun' ? '#f0f8ff' : '#f5f0ff'};"></span>`
        );
      });
    }

    const draggableOptions = question.content?.data?.filter(item => !item.positionId) || [];

    return (
      <>
        <div 
          style={{ 
            marginBottom: '16px', 
            fontSize: '16px', 
            fontWeight: 500,
            lineHeight: '1.8'
          }}
          dangerouslySetInnerHTML={{ __html: displayText }}
        />
        {draggableOptions.length > 0 && (
          <div style={{ 
            marginTop: '16px',
            padding: '16px',
            background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: `2px solid ${blankColor}`,
          }}>
            <Typography.Text style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'block' }}>
              Draggable options:
            </Typography.Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {draggableOptions.map((option, idx) => (
                <span 
                  key={idx}
                  style={{
                    padding: '8px 16px',
                    background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
                    border: `2px solid ${blankColor}`,
                    borderRadius: '8px',
                    cursor: 'move',
                    fontSize: '14px',
                  }}
                >
                  {option.value}
                </span>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  // Helper function to render Reorder question
  const renderReorderQuestion = () => {
    if (question.type !== 'REARRANGE' || !question.content?.data) {
      return null;
    }

    const wordColor = theme === 'sun' ? '#1890ff' : '#A78BFA';
    const sortedData = question.content.data.sort((a, b) => (a.positionOrder || 0) - (b.positionOrder || 0));
    
    return (
      <>
        <div style={{ 
          marginBottom: '16px', 
          fontSize: '16px', 
          fontWeight: 500,
        }}>
          {question.questionText}
        </div>
        <div style={{ 
          padding: '16px',
          background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          border: `2px solid ${wordColor}`,
        }}>
          <Typography.Text style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'block' }}>
            Drag to reorder:
          </Typography.Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {sortedData.map((word, idx) => (
              <span 
                key={idx}
                style={{
                  padding: '8px 16px',
                  background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${wordColor}`,
                  borderRadius: '8px',
                  cursor: 'move',
                  fontSize: '14px',
                }}
              >
                {word.value}
              </span>
            ))}
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: theme === 'sun' ? '#e6f7ff' : 'rgba(24, 144, 255, 0.1)', borderRadius: '8px' }}>
            Your answer: <input type="text" style={{ width: '100%', padding: '8px', marginTop: '8px', border: `2px solid ${wordColor}`, borderRadius: '6px' }} />
          </div>
        </div>
      </>
    );
  };

  // Helper function to render Rewrite question
  const renderRewriteQuestion = () => {
    if (question.type !== 'REWRITE' || !question.questionText) {
      return null;
    }

    const textColor = theme === 'sun' ? '#333' : '#000000';
    
    return (
      <>
        <div 
          style={{ 
            marginBottom: '16px', 
            fontSize: '16px', 
            fontWeight: 500,
          }}
        >
          {question.questionText}
        </div>
        <textarea 
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'inherit',
            background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
            color: textColor,
          }}
          placeholder="Type your answer here..."
        />
      </>
    );
  };

  return (
    <div
      className={`question-item ${theme}-question-item`}
      style={{
        marginBottom: '24px',
        padding: '24px',
        background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        border: theme === 'sun' 
          ? '2px solid rgba(0, 0, 0, 0.1)' 
          : '2px solid rgba(255, 255, 255, 0.1)',
        boxShadow: theme === 'sun' 
          ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
          : '0 2px 8px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <Typography.Text strong style={{ fontSize: '16px' }}>
          {index + 1}. {getQuestionTypeLabel(question.type)}
        </Typography.Text>
        <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
          ({question.points} {question.points > 1 ? 'points' : 'point'})
        </Typography.Text>
      </div>

      <div>
        {question.type === 'FILL_IN_THE_BLANK' ? (
          renderFillBlankQuestion()
        ) : question.type === 'DROPDOWN' ? (
          renderDropdownQuestion()
        ) : question.type === 'DRAG_AND_DROP' ? (
          renderDragDropQuestion()
        ) : question.type === 'REARRANGE' ? (
          renderReorderQuestion()
        ) : question.type === 'REWRITE' ? (
          renderRewriteQuestion()
        ) : (
          <>
            <div 
              style={{ 
                marginBottom: '16px', 
                fontSize: '16px', 
                fontWeight: 500 
              }}
              dangerouslySetInnerHTML={{ __html: question.question || question.questionText }}
            />
            <div className="question-options">
              {question.options?.map((option) => (
                <div 
                  key={option.key} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '12px',
                    marginBottom: '12px',
                    padding: '12px',
                    background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme === 'sun' ? '#f0f8ff' : 'rgba(24, 144, 255, 0.1)';
                    e.currentTarget.style.borderColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <input type="radio" name={`question-${question.id}`} style={{ marginTop: '4px' }} />
                  <span className="option-key" style={{ flexShrink: 0, fontWeight: 600 }}>{option.key}.</span>
                  <div 
                    style={{ flex: 1, fontSize: '15px' }}
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
};

const StudentPreview = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  
  usePageTitle('Daily Challenge Preview');
  
  useEffect(() => {
    // Load fake data
    const fakeQuestions = generateFakeQuestions();
    setQuestions(fakeQuestions);
    
    // Simulate loading
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  // Custom Header Component
  const customHeader = (
    <header className={`themed-header ${theme}-header`}>
      <nav className="themed-navbar">
        <div className="themed-navbar-content" style={{ justifyContent: 'space-between', width: '100%' }}>
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
              <span>Daily Challenge Preview - Student View</span>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );

  return (
    <ThemedLayout customHeader={customHeader}>
      <div className={`daily-challenge-content-wrapper ${theme}-daily-challenge-content-wrapper`}>
        <div style={{ padding: '24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <LoadingWithEffect loading={loading} message="Loading questions...">
              <div className="questions-list">
                {questions.map((question, index) => (
                  question.type === 'SECTION' ? (
                    <SectionQuestionItem
                      key={question.id}
                      question={question}
                      index={index}
                      theme={theme}
                    />
                  ) : (
                    <StudentQuestionItem
                      key={question.id}
                      question={question}
                      index={index}
                      theme={theme}
                    />
                  )
                ))}
              </div>
            </LoadingWithEffect>
          </div>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default StudentPreview;
