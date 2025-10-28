import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  MenuOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import ThemedLayout from "../../../../component/teacherlayout/ThemedLayout";
import LoadingWithEffect from "../../../../component/spinner/LoadingWithEffect";
import "./DailyChallengeContent.css";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../../contexts/ThemeContext";
import usePageTitle from "../../../../hooks/usePageTitle";
import { dailyChallengeApi } from "../../../../apis/apis";

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

In the modern world, nationality plays a crucial role in determining an individual's identity, legal status, and relationship with the state. It affects everything from travel documents to educational opportunities and employment prospects.

Throughout history, the concept of nationality has been shaped by various factors including wars, migrations, colonial periods, and political changes. The formation of nation-states in Europe during the 19th century marked a significant turning point in how nationality was understood and implemented. Before this period, people's identities were often tied to their local communities, religious affiliations, or feudal relationships rather than to a specific nation.

The French Revolution played a particularly important role in developing modern concepts of citizenship and nationality. The revolutionary government introduced the idea that all citizens were equal before the law, regardless of their social status or birth. This principle influenced many other countries and helped establish the foundation for modern nationality laws.

In the 20th century, two world wars and numerous conflicts led to massive population movements and changes in national boundaries. These events forced many countries to reconsider their nationality laws and policies. The Holocaust, in particular, highlighted the dangers of statelessness and led to international efforts to protect refugees and stateless persons.

Today, globalization has created new challenges for nationality laws. Increased international travel, migration, and the rise of multinational corporations have made it more common for people to have connections to multiple countries. Some countries have responded by allowing dual or multiple citizenship, while others maintain stricter policies.

The digital age has also introduced new considerations for nationality. Online communities, virtual citizenship programs, and digital nomad visas are challenging traditional concepts of territorial-based nationality. Some countries are experimenting with digital citizenship programs that allow people to participate in governance and access services without physically residing in the country.

Climate change is another factor that may influence nationality laws in the future. As sea levels rise and extreme weather events become more frequent, some island nations may face existential threats. This could lead to new forms of nationality or citizenship arrangements for displaced populations.

International organizations like the United Nations have developed various conventions and protocols to address issues related to nationality, statelessness, and refugee protection. These international frameworks help ensure that nationality laws respect human rights and provide protection for vulnerable populations.

The future of nationality will likely continue to evolve as societies adapt to new challenges and opportunities. Technological advances, environmental changes, and shifting political landscapes will all play a role in shaping how we understand and implement nationality in the years to come.`,
      questions: [
        {
          id: 1,
          type: 'MULTIPLE_CHOICE',
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
          type: 'MULTIPLE_SELECT',
          question: 'Which of the following are ways to acquire nationality? (Select all that apply)',
          options: [
            { key: 'A', text: 'Birth', isCorrect: true },
            { key: 'B', text: 'Descent', isCorrect: true },
            { key: 'C', text: 'Naturalization', isCorrect: true },
            { key: 'D', text: 'Marriage only', isCorrect: false },
          ],
          points: 2
        },
        {
          id: 3,
          type: 'TRUE_OR_FALSE',
          question: 'The French Revolution played a particularly important role in developing modern concepts of citizenship and nationality.',
          options: [
            { key: 'True', text: 'True', isCorrect: true },
            { key: 'False', text: 'False', isCorrect: false },
          ],
          points: 1
        },
        {
          id: 4,
          type: 'FILL_IN_THE_BLANK',
          questionText: 'Nationality is a legal relationship between an individual and a _______.',
          content: {
            data: [
              { id: 1, value: 'nation', positionId: 'pos_1', correct: true }
            ]
          },
          points: 2
        },
        {
          id: 5,
          type: 'DROPDOWN',
          questionText: 'Complete the sentence: Nationality can be acquired through _______ or naturalization.',
          content: {
            data: [
              { id: 1, value: 'birth', positionId: 'pos_1', correct: true },
              { id: 2, value: 'death', positionId: 'pos_1', correct: false },
              { id: 3, value: 'marriage', positionId: 'pos_1', correct: false },
              { id: 4, value: 'travel', positionId: 'pos_1', correct: false },
            ]
          },
          points: 2
        },
        {
          id: 6,
          type: 'DRAG_AND_DROP',
          questionText: 'Complete the sentence: I _______ programming and _______ it very much.',
          content: {
            data: [
              { id: 1, value: 'love', positionId: 'pos_1', correct: true },
              { id: 2, value: 'enjoy', positionId: 'pos_2', correct: true },
              { id: 3, value: 'like', correct: false },
              { id: 4, value: 'hate', correct: false },
            ]
          },
          points: 3
        },
        {
          id: 7,
          type: 'REARRANGE',
          questionText: 'Rearrange the words to form a correct sentence:',
          content: {
            data: [
              { id: 1, value: 'The', positionId: 'pos_1', positionOrder: 1 },
              { id: 2, value: 'flower', positionId: 'pos_2', positionOrder: 2 },
              { id: 3, value: 'is', positionId: 'pos_3', positionOrder: 3 },
              { id: 4, value: 'very', positionId: 'pos_4', positionOrder: 4 },
              { id: 5, value: 'much', positionId: 'pos_5', positionOrder: 5 },
            ]
          },
          points: 3
        }
      ],
      points: 11,
      questionText: 'Read the passage and answer the questions',
    },
    {
      id: 2,
      type: 'LISTENING_SECTION',
      title: 'Climate Change and Environmental Protection',
      audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder audio URL
      duration: '2:45',
      transcript: `Climate change is one of the most pressing issues of our time. It refers to long-term shifts in global temperatures and weather patterns. While climate variations are natural, human activities have been the main driver of climate change since the 1800s, primarily due to burning fossil fuels like coal, oil, and gas.

The greenhouse effect is a natural process that warms the Earth's surface. When the Sun's energy reaches the Earth's atmosphere, some of it is reflected back to space, and the rest is absorbed and re-radiated by greenhouse gases. These gases include water vapor, carbon dioxide, methane, nitrous oxide, and ozone. However, human activities have increased the concentration of these gases in the atmosphere, particularly carbon dioxide, which has increased by about 50% since the Industrial Revolution.

The consequences of climate change are already visible and will become more severe over time. Rising global temperatures lead to more frequent and intense heatwaves, droughts, and wildfires. Melting glaciers and ice sheets contribute to rising sea levels, threatening coastal communities worldwide. Changes in precipitation patterns affect agriculture and water supplies, while ocean acidification threatens marine ecosystems.

To address climate change, countries around the world have committed to reducing greenhouse gas emissions. The Paris Agreement, adopted in 2015, aims to limit global temperature rise to well below 2 degrees Celsius above pre-industrial levels, with efforts to limit it to 1.5 degrees. This requires transitioning to renewable energy sources, improving energy efficiency, and implementing sustainable practices across all sectors.

Individual actions also matter in the fight against climate change. People can reduce their carbon footprint by using public transportation, cycling, or walking instead of driving. Energy conservation at home, such as using LED light bulbs and improving insulation, can significantly reduce energy consumption. Choosing sustainable products and reducing waste through recycling and composting are other ways individuals can contribute.

The transition to a sustainable future requires innovation, investment, and international cooperation. Renewable energy technologies like solar and wind power are becoming increasingly cost-effective and widespread. Electric vehicles are gaining popularity as battery technology improves. Green building practices and sustainable agriculture methods are being adopted worldwide.

Education and awareness are crucial for addressing climate change. Understanding the science behind climate change helps people make informed decisions about their lifestyle choices and support policies that promote environmental protection. Young people, in particular, are playing an important role in climate activism, demanding action from governments and corporations.

The future of our planet depends on the actions we take today. While the challenges are significant, there is still hope if we act decisively and collectively. By working together, we can create a more sustainable world for future generations.`,
      questions: [
        {
          id: 8,
          type: 'MULTIPLE_CHOICE',
          question: 'What is the main cause of climate change since the 1800s?',
          options: [
            { key: 'A', text: 'Natural climate variations', isCorrect: false },
            { key: 'B', text: 'Human activities, particularly burning fossil fuels', isCorrect: true },
            { key: 'C', text: 'Solar radiation changes', isCorrect: false },
            { key: 'D', text: 'Volcanic eruptions', isCorrect: false },
          ],
          points: 1
        },
        {
          id: 9,
          type: 'MULTIPLE_SELECT',
          question: 'Which of the following are consequences of climate change? (Select all that apply)',
          options: [
            { key: 'A', text: 'Rising sea levels', isCorrect: true },
            { key: 'B', text: 'More frequent heatwaves', isCorrect: true },
            { key: 'C', text: 'Ocean acidification', isCorrect: true },
            { key: 'D', text: 'Decreased global temperatures', isCorrect: false },
          ],
          points: 2
        },
        {
          id: 10,
          type: 'TRUE_OR_FALSE',
          question: 'The Paris Agreement aims to limit global temperature rise to well below 2 degrees Celsius.',
          options: [
            { key: 'True', text: 'True', isCorrect: true },
            { key: 'False', text: 'False', isCorrect: false },
          ],
          points: 1
        },
        {
          id: 11,
          type: 'FILL_IN_THE_BLANK',
          questionText: 'The greenhouse effect is a _______ process that warms the Earth\'s surface.',
          content: {
            data: [
              { id: 1, value: 'natural', positionId: 'pos_1', correct: true }
            ]
          },
          points: 2
        }
      ],
      points: 6,
      questionText: 'Listen to the audio and answer the questions',
    },
    {
      id: 3,
      type: 'SPEAKING_SECTION',
      title: 'Describe Your Hometown',
      prompt: `Please describe your hometown in English. Your response should include:

**Requirements:**
- Minimum 60 seconds
- Speak clearly and at a moderate pace
- Use proper pronunciation
- Cover the following topics: location, notable places, and what you like about it

**Topic Focus:**
Discuss:
1. Location and basic information about your hometown
2. Notable places or landmarks
3. What you like most about your hometown
4. Any interesting facts or personal experiences

**Tips for Success:**
- Plan your answer before recording
- Use transition words (first, secondly, finally, etc.)
- Speak naturally and confidently
- Make sure to speak for at least 60 seconds

**Time Limit:** 3 minutes to record

Good luck with your speaking!`,
      timeLimit: 60,
      points: 15,
      questionText: 'Record your speaking response',
    },
    {
      id: 4,
      type: 'SPEAKING_WITH_AUDIO_SECTION',
      title: 'Speaking Based on Audio',
      audioUrl: '/audio/sample-speaking-audio.mp3',
      transcript: `Phiên âm tiếng Anh của "quả chuối" (banana) là /bəˈnɑːnə/. Từ này có trọng âm rơi vào âm tiết thứ hai.

**Từ vựng:** Banana
**Phiên âm:** /bəˈnɑːnə/
**Trọng âm:** Nhấn vào âm tiết thứ hai

![Banana](/img/banana.jpg)`,
      timeLimit: 180,
      points: 20,
      questionText: 'Listen to the audio and answer the questions',
    },
    {
      id: 5,
      type: 'WRITING_SECTION',
      title: 'Environmental Conservation Essay',
      prompt: `Write an essay about environmental conservation. Your essay should include:

**Requirements:**
- Minimum 300 words
- Use proper essay structure (introduction, body paragraphs, conclusion)
- Include specific examples of environmental issues
- Suggest practical solutions
- Use formal academic language

**Topic Focus:**
Choose one of the following environmental issues to focus on:
1. Climate change and its global impact
2. Deforestation and loss of biodiversity
3. Water pollution and scarcity
4. Renewable energy solutions
5. Sustainable living practices

**Evaluation Criteria:**
- Content and ideas (40%)
- Organization and structure (25%)
- Language use and vocabulary (20%)
- Grammar and mechanics (15%)

**Tips for Success:**
- Plan your essay before writing
- Use clear topic sentences for each paragraph
- Support your arguments with evidence
- Proofread your work before submitting
- Stay within the word limit

**Time Limit:** 60 minutes

Good luck with your writing!`,
      wordLimit: 300,
      timeLimit: 60,
      points: 25,
      questionText: 'Write an essay based on the given prompt',
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


// Section Question Component for Reading/Listening sections
const SectionQuestionItem = ({ question, index, theme }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [droppedItems, setDroppedItems] = useState({});
  const [availableItems, setAvailableItems] = useState({});
  const [dragOverPosition, setDragOverPosition] = useState({});
  const [reorderStates, setReorderStates] = useState({});

  const toPlainText = (html) => {
    if (!html) return '';
    return String(html)
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Initialize availableItems for drag and drop questions
  useEffect(() => {
    if (question.questions) {
      setAvailableItems(prev => {
        const newItems = { ...prev };
        let hasChanges = false;
        
        question.questions.forEach(q => {
          if (q.type === 'DRAG_AND_DROP' && q.content?.data && !newItems[q.id]) {
            const dragDropItems = q.content.data.filter(item => !item.positionId).map(item => item.value);
            if (dragDropItems.length > 0) {
              newItems[q.id] = dragDropItems;
              hasChanges = true;
            }
          }
        });
        
        return hasChanges ? newItems : prev;
      });
    }
  }, [question.questions]);

  const handleAnswerSelect = (questionId, optionKey) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionKey
    }));
  };

  return (
    <>
      <style>
        {`
          .reading-passage-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .reading-passage-scrollbar::-webkit-scrollbar-track {
            background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'};
            border-radius: 4px;
          }
          .reading-passage-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'};
            border-radius: 4px;
            border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'};
          }
          .reading-passage-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'};
          }
        `}
      </style>
      <div
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
      {/* Header */}
      <div className="question-header" style={{
        paddingBottom: '14px',
        marginBottom: '16px',
        borderBottom: '2px solid',
        borderBottomColor: theme === 'sun' 
          ? 'rgba(113, 179, 253, 0.25)' 
          : 'rgba(138, 122, 255, 0.2)',
        position: 'relative'
      }}>
        <Typography.Text strong style={{ 
          fontSize: '20px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          {index + 1}. Reading Section
        </Typography.Text>
        <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
          ({question.points} {question.points > 1 ? 'points' : 'point'})
        </Typography.Text>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'flex', gap: '24px', minHeight: '500px' }}>
        {/* Left Column - Reading Passage */}
        <div 
          className="reading-passage-scrollbar"
          style={{
            flex: '1',
            padding: '20px',
            background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
            overflowY: 'auto',
            maxHeight: '600px',
            scrollbarWidth: 'thin',
            scrollbarColor: theme === 'sun' 
              ? '#1890ff rgba(24, 144, 255, 0.2)' 
              : '#8B5CF6 rgba(138, 122, 255, 0.2)'
          }}>
          <div style={{ marginBottom: '16px' }}>
            <Typography.Title level={4} style={{ 
              margin: 0, 
              color: theme === 'sun' ? '#1E40AF' : '#1F2937',
              fontSize: '20px',
              fontWeight: 600
            }}>
              {question.title}
            </Typography.Title>
          </div>
          <div style={{
            fontSize: '15px',
            lineHeight: '1.8',
            color: theme === 'sun' ? '#333' : '#1F2937',
            textAlign: 'justify'
          }}>
            {toPlainText(question.passage)}
          </div>
        </div>

        {/* Right Column - Questions */}
        <div style={{
          flex: '1',
          background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
          overflowY: 'auto',
          maxHeight: '600px'
        }}>
          <div style={{ padding: '20px' }}>
            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {question.questions.map((q, qIndex) => (
                <div key={q.id} style={{
                  padding: '16px',
                  background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`
                }}>
                  {/* Answer Options */}
                  {q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_OR_FALSE' || q.type === 'MULTIPLE_SELECT' ? (
                    (() => {
                      const options = (q.options && q.options.length ? q.options : (q.content?.data || []).map((d, idx) => ({
                        key: String.fromCharCode(65 + idx),
                        text: d.value
                      })));
                      const isMulti = q.type === 'MULTIPLE_SELECT';
                      const selected = selectedAnswers[q.id] || (isMulti ? [] : null);
                      const isChecked = (k) => isMulti ? (selected || []).includes(k) : selected === k;
                      const toggle = (k) => {
                        if (isMulti) {
                          setSelectedAnswers(prev => ({
                            ...prev,
                            [q.id]: (prev[q.id] || []).includes(k)
                              ? (prev[q.id] || []).filter(x => x !== k)
                              : [ ...(prev[q.id] || []), k ]
                          }));
                        } else {
                          setSelectedAnswers(prev => ({ ...prev, [q.id]: k }));
                        }
                      };
                      return (
                        <div style={{ 
                          marginBottom: '16px',
                          fontSize: '15px', 
                          fontWeight: 350,
                          lineHeight: '1.8',
                          color: '#000000'
                        }}>
                          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                            Question {qIndex + 1}:
                          </div>
                          <div style={{ marginBottom: '10px' }}>
                            {toPlainText(q.questionText || q.question || '')}
                          </div>
                          <div className="question-options" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr', 
                            gap: '12px'
                          }}>
                            {options.map((opt, idx) => {
                              const key = opt.key || String.fromCharCode(65 + idx);
                              const checked = isChecked(key);
                              return (
                                <label key={key} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '12px 14px',
                                  background: checked
                                    ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                                    : (theme === 'sun' ? '#fff' : 'rgba(255,255,255,0.03)'),
                                  border: `2px solid ${checked ? (theme === 'sun' ? '#1890ff' : '#8B5CF6') : (theme === 'sun' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)')}`,
                                  borderRadius: '12px',
                                  cursor: 'pointer'
                                }}>
                                  <input
                                    type={isMulti ? 'checkbox' : 'radio'}
                                    name={`reading-q-${q.id}`}
                                    checked={checked}
                                    onChange={() => toggle(key)}
                                    style={{ width: '18px', height: '18px', accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6' }}
                                  />
                                  <span style={{ fontWeight: 600 }}>{key}.</span>
                                  <span style={{ flex: 1 }}>{toPlainText(opt.text || opt.value || '')}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  ) : q.type === 'DROPDOWN' ? (
                    // Dropdown
                    <div style={{ 
                      marginBottom: '16px',
                      fontSize: '15px', 
                      fontWeight: 350,
                      lineHeight: '1.8',
                      color: '#000000'
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                        Question {qIndex + 1}:
                      </div>
                      <div>
                        {(() => {
                          const text = q.questionText || q.question || '';
                          const parts = [];
                          const regex = /\[\[pos_(.*?)\]\]/g;
                          let last = 0; let match; let idx = 0;
                          while ((match = regex.exec(text)) !== null) {
                            if (match.index > last) parts.push(text.slice(last, match.index));
                            const positionId = match[1];
                            const optionsForPosition = q.content?.data?.filter(opt => opt.positionId === positionId) || [];
                            parts.push(
                            <select
                                key={`dd_${q.id}_${idx++}`}
                                value={selectedAnswers[`${q.id}_pos_${positionId}`] || ''}
                              onChange={(e) => setSelectedAnswers(prev => ({
                                ...prev,
                                  [`${q.id}_pos_${positionId}`]: e.target.value
                              }))}
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
                            >
                              <option value="">Select</option>
                                {optionsForPosition.map((item) => (
                                  <option key={item.id} value={toPlainText(item.value)}>
                                    {toPlainText(item.value)}
                                </option>
                              ))}
                            </select>
                            );
                            last = match.index + match[0].length;
                          }
                          if (last < text.length) parts.push(text.slice(last));
                          return parts;
                        })()}
                      </div>
                    </div>
                  ) : q.type === 'DRAG_AND_DROP' ? (
                    // Drag and Drop
                    (() => {
                      const qDroppedItems = droppedItems[q.id] || {};
                      // Get all unique items from content.data (both correct and incorrect)
                      const allItems = [...new Set((q.content?.data || [])
                        .map(item => item.value)
                        .filter(Boolean)
                      )];
                      
                      // Initialize availableItems if not set
                      if (availableItems[q.id] === undefined && allItems.length > 0) {
                        setAvailableItems(prev => ({
                          ...prev,
                          [q.id]: allItems
                        }));
                      }
                      
                      const qAvailableItems = availableItems[q.id] || allItems;
                      
                      const handleDragStart = (e, item, isDropped = false, positionId = null) => {
                        e.dataTransfer.setData('text/plain', item);
                        e.dataTransfer.setData('isDropped', isDropped);
                        e.dataTransfer.setData('positionId', positionId || '');
                        e.dataTransfer.setData('questionId', q.id);
                      };

                      const handleDrop = (e, positionId) => {
                        e.preventDefault();
                        const item = e.dataTransfer.getData('text/plain');
                        const isDropped = e.dataTransfer.getData('isDropped') === 'true';
                        const fromPositionId = e.dataTransfer.getData('positionId');
                        const questionId = e.dataTransfer.getData('questionId');
                        
                        if (questionId !== q.id.toString()) return;
                        
                        setDroppedItems(prev => {
                          const newItems = { ...prev };
                          if (!newItems[q.id]) newItems[q.id] = {};
                          const currentItem = newItems[q.id][positionId];
                          
                          // Clear drag over state
                          setDragOverPosition(prev => ({
                            ...prev,
                            [q.id]: null
                          }));
                          
                          // If moving from one position to another
                          if (fromPositionId && fromPositionId !== positionId) {
                            newItems[q.id][positionId] = item;
                            if (fromPositionId in newItems[q.id]) {
                              delete newItems[q.id][fromPositionId];
                            }
                            // Return the old item from target position to available list
                            if (currentItem) {
                              setAvailableItems(prev => ({
                                ...prev,
                                [q.id]: [...(prev[q.id] || []), currentItem]
                              }));
                            }
                            return newItems;
                          }
                          
                          // If dropping from available items (not from another position)
                          if (!isDropped) {
                            newItems[q.id][positionId] = item;
                            // Remove from available items
                            setAvailableItems(prev => ({
                              ...prev,
                              [q.id]: (prev[q.id] || []).filter(i => i !== item)
                            }));
                          }
                          
                          return newItems;
                        });
                      };

                      const handleDragStartFromDropped = (e, item, positionId) => {
                        handleDragStart(e, item, true, positionId);
                        
                        // Remove from dropped items immediately
                        setDroppedItems(prev => {
                          const newItems = { ...prev };
                          if (newItems[q.id]) {
                            delete newItems[q.id][positionId];
                          }
                          return newItems;
                        });
                        
                        // Add back to available items
                        setAvailableItems(prev => ({
                          ...prev,
                          [q.id]: [...(prev[q.id] || []), item]
                        }));
                      };

                      const handleDragOver = (e, positionId) => {
                        e.preventDefault();
                        setDragOverPosition(prev => ({
                          ...prev,
                          [q.id]: positionId
                        }));
                      };

                      const handleDragLeave = (e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          setDragOverPosition(prev => ({
                            ...prev,
                            [q.id]: null
                          }));
                        }
                      };

                      // Parse question text with [[pos_xxx]] placeholders
                      const text = q.questionText || q.question || '';
                      const parts = [];
                      const regex = /\[\[pos_(.*?)\]\]/g;
                      let last = 0; let match; let idx = 0;
                      const positions = [];
                      
                      while ((match = regex.exec(text)) !== null) {
                        if (match.index > last) parts.push({ type: 'text', content: text.slice(last, match.index) });
                        const posId = match[1];
                        positions.push(posId);
                        parts.push({ type: 'position', positionId: posId, index: idx++ });
                        last = match.index + match[0].length;
                      }
                      if (last < text.length) parts.push({ type: 'text', content: text.slice(last) });

                      return (
                        <div style={{ marginBottom: '16px' }}>
                          {/* Stacked Layout: Sentence on top, draggable words below */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '200px' }}>
                            {/* Sentence with drop zones */}
                            <div style={{
                              padding: '16px',
                              background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
                              borderRadius: '8px',
                              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
                            }}>
                              <div style={{ 
                                fontSize: '15px', 
                                fontWeight: 350,
                                lineHeight: '1.8',
                                color: '#000000',
                                marginBottom: '12px'
                              }}>
                                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                                  Question {qIndex + 1}:
                                </div>
                                <div>
                                  {parts.map((part, pIdx) => (
                                    <React.Fragment key={pIdx}>
                                      {part.type === 'text' ? (
                                        part.content
                                      ) : (
                                        qDroppedItems[part.positionId] ? (
                                          <span
                                            draggable
                                            onDragStart={(e) => handleDragStartFromDropped(e, qDroppedItems[part.positionId], part.positionId)}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              minWidth: '100px',
                                              minHeight: '28px',
                                              height: 'auto',
                                              padding: '4px 8px',
                                              margin: '0 6px',
                                              background: theme === 'sun' ? 'rgba(24, 144, 255, 0.15)' : 'rgba(138, 122, 255, 0.18)',
                                              border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                              borderRadius: '6px',
                                              fontSize: '14px',
                                              fontWeight: '350',
                                              color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                              cursor: 'grab',
                                              transition: 'all 0.2s ease',
                                              verticalAlign: 'baseline',
                                              lineHeight: '1.5',
                                              boxSizing: 'border-box',
                                              textAlign: 'center',
                                              maxWidth: '280px',
                                              whiteSpace: 'normal',
                                              wordBreak: 'break-word',
                                              overflowWrap: 'anywhere'
                                            }}
                                          >
                                            {toPlainText(qDroppedItems[part.positionId])}
                                          </span>
                                        ) : (
                                          <span
                                            onDrop={(e) => handleDrop(e, part.positionId)}
                                            onDragOver={(e) => handleDragOver(e, part.positionId)}
                                            onDragLeave={handleDragLeave}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              minWidth: '100px',
                                              minHeight: '28px',
                                              height: 'auto',
                                              padding: '4px 8px',
                                              margin: '0 6px',
                                              background: dragOverPosition[q.id] === part.positionId 
                                                ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.25)')
                                                : '#ffffff',
                                              border: `2px ${dragOverPosition[q.id] === part.positionId ? 'solid' : 'dashed'} ${dragOverPosition[q.id] === part.positionId ? (theme === 'sun' ? '#1890ff' : '#8B5CF6') : 'rgba(0, 0, 0, 0.5)'}`,
                                              borderRadius: '6px',
                                              fontSize: '14px',
                                              fontWeight: '350',
                                              color: dragOverPosition[q.id] === part.positionId ? (theme === 'sun' ? '#1890ff' : '#8B5CF6') : 'rgba(0, 0, 0, 0.5)',
                                              cursor: 'pointer',
                                              transition: 'all 0.3s ease',
                                              verticalAlign: 'baseline',
                                              lineHeight: '1.5',
                                              boxSizing: 'border-box',
                                              marginTop: '4px',
                                              transform: dragOverPosition[q.id] === part.positionId ? 'scale(1.05)' : 'scale(1)',
                                              boxShadow: dragOverPosition[q.id] === part.positionId 
                                                ? (theme === 'sun' ? '0 4px 12px rgba(24, 144, 255, 0.3)' : '0 4px 12px rgba(138, 122, 255, 0.3)')
                                                : 'none',
                                              textAlign: 'center',
                                              maxWidth: '280px',
                                              whiteSpace: 'normal',
                                              wordBreak: 'break-word',
                                              overflowWrap: 'anywhere'
                                            }}
                                          >
                                            {dragOverPosition[q.id] === part.positionId ? 'Drop here!' : 'Drop here'}
                                          </span>
                                        )
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Available words for dragging (below) */}
                            <div style={{
                              padding: '16px',
                              background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                              borderRadius: '8px',
                              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
                            }}>
                              <Typography.Text style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', display: 'block', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
                                Drag these words:
                              </Typography.Text>
                              <div style={{ 
                                display: 'flex', 
                                gap: '8px',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '80px'
                              }}>
                                {qAvailableItems.map((item, idx) => (
                                  <span
                                    key={idx}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item)}
                                    style={{
                                      padding: '8px 12px',
                                      background: theme === 'sun' 
                                        ? 'rgba(24, 144, 255, 0.08)' 
                                        : 'rgba(138, 122, 255, 0.12)',
                                      border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                      borderRadius: '8px',
                                      fontSize: '13px',
                                      fontWeight: '600',
                                      color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                      cursor: 'grab',
                                      userSelect: 'none',
                                      transition: 'all 0.2s ease',
                                      minWidth: '60px',
                                      textAlign: 'center',
                                      boxShadow: theme === 'sun' 
                                        ? '0 2px 6px rgba(24, 144, 255, 0.15)' 
                                        : '0 2px 6px rgba(138, 122, 255, 0.15)'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'scale(1.05)';
                                      e.currentTarget.style.boxShadow = theme === 'sun' 
                                        ? '0 4px 10px rgba(24, 144, 255, 0.25)' 
                                        : '0 4px 10px rgba(138, 122, 255, 0.25)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                      e.currentTarget.style.boxShadow = theme === 'sun' 
                                        ? '0 2px 6px rgba(24, 144, 255, 0.15)' 
                                        : '0 2px 6px rgba(138, 122, 255, 0.15)';
                                    }}
                                  >
                                    {toPlainText(item)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : q.type === 'FILL_IN_THE_BLANK' ? (
                    // Fill in the Blank
                    <div style={{ 
                      marginBottom: '16px',
                      fontSize: '15px', 
                      fontWeight: 350,
                      lineHeight: '1.8',
                      color: '#000000'
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                        Question {qIndex + 1}:
                      </div>
                      <div>
                        {(() => {
                          const text = q.questionText || q.question || '';
                          const parts = [];
                          const regex = /\[\[pos_(.*?)\]\]/g;
                          let last = 0; let match; let idx = 0;
                          while ((match = regex.exec(text)) !== null) {
                            if (match.index > last) parts.push(text.slice(last, match.index));
                            parts.push(
                            <span
                                key={`fib_${q.id}_${idx++}`}
                              className="paragraph-input"
                              contentEditable
                                suppressContentEditableWarning
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '120px',
                                maxWidth: '200px',
                                minHeight: '32px',
                                padding: '4px 12px',
                                margin: '0 8px',
                                background: theme === 'sun' ? '#E9EEFF94' : 'rgba(255, 255, 255, 0.1)',
                                border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                borderRadius: '8px',
                                cursor: 'text',
                                outline: 'none',
                                verticalAlign: 'top',
                                lineHeight: '1.4',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'pre-wrap',
                                color: '#000000',
                                textAlign: 'center'
                              }}
                            />
                            );
                            last = match.index + match[0].length;
                          }
                          if (last < text.length) parts.push(text.slice(last));
                          return parts;
                        })()}
                      </div>
                    </div>
                  ) : q.type === 'REARRANGE' ? (
                    // Reorder Question
                    (() => {
                      const questionId = `reorder_${q.id}`;
                      const currentState = reorderStates[questionId] || {
                        sourceItems: q.content?.data?.map(item => item.value) || [],
                        droppedItems: {},
                        dragOverIndex: null,
                        draggedItem: null,
                        isDraggingFromSource: false,
                        wasDropped: false
                      };

                      const handleDragStartFromSource = (e, item) => {
                        setReorderStates(prev => ({
                          ...prev,
                          [questionId]: {
                            ...currentState,
                            draggedItem: item,
                            isDraggingFromSource: true
                          }
                        }));
                        e.dataTransfer.effectAllowed = 'move';
                      };

                      const handleDragStartFromSlot = (e, index) => {
                        const item = currentState.droppedItems[index];
                        setReorderStates(prev => ({
                          ...prev,
                          [questionId]: {
                            ...currentState,
                            draggedItem: item,
                            isDraggingFromSource: false,
                            wasDropped: false,
                            dragOverIndex: index
                          }
                        }));
                        e.dataTransfer.effectAllowed = 'move';
                      };

                      const handleDropOnSlot = (e, index) => {
                        e.preventDefault();
                        const newState = {
                          ...currentState,
                          wasDropped: true,
                          dragOverIndex: null
                        };
                        
                        if (currentState.draggedItem) {
                          const currentItem = currentState.droppedItems[index];
                          
                          // If there's already an item in this slot, return it to source
                          if (currentItem) {
                            newState.sourceItems = [...currentState.sourceItems, currentItem];
                          }
                          
                          // If moving from another slot, clear the old slot first
                          if (!currentState.isDraggingFromSource) {
                            const oldIndex = Object.keys(currentState.droppedItems).find(i => currentState.droppedItems[i] === currentState.draggedItem && parseInt(i) !== index);
                            if (oldIndex !== undefined) {
                              delete newState.droppedItems[parseInt(oldIndex)];
                            }
                          } else {
                            // Remove from source if it was from source
                            newState.sourceItems = currentState.sourceItems.filter(item => item !== currentState.draggedItem);
                          }
                          
                          // Place the new item in the slot
                          newState.droppedItems = {
                            ...currentState.droppedItems,
                            [index]: currentState.draggedItem
                          };
                        }
                        
                        newState.draggedItem = null;
                        newState.isDraggingFromSource = false;
                        
                        setReorderStates(prev => ({
                          ...prev,
                          [questionId]: newState
                        }));
                      };

                      const handleDragOverSlot = (e, index) => {
                        e.preventDefault();
                        setReorderStates(prev => ({
                          ...prev,
                          [questionId]: {
                            ...currentState,
                            dragOverIndex: index
                          }
                        }));
                        e.dataTransfer.dropEffect = 'move';
                      };

                      const handleDragLeaveSlot = () => {
                        setReorderStates(prev => ({
                          ...prev,
                          [questionId]: {
                            ...currentState,
                            dragOverIndex: null
                          }
                        }));
                      };

                      const handleDragEnd = (e) => {
                        // If we're dragging from a slot (not from source) and not dropped in a slot or source area,
                        // return the item to source
                        if (currentState.draggedItem && !currentState.isDraggingFromSource && !currentState.wasDropped) {
                          const newState = { ...currentState };
                          
                          // Only add if not already in source to avoid duplicates
                          if (!newState.sourceItems.includes(currentState.draggedItem)) {
                            newState.sourceItems = [...newState.sourceItems, currentState.draggedItem];
                          }
                          
                          // Remove from the slot
                          const oldIndex = Object.keys(currentState.droppedItems).find(i => currentState.droppedItems[i] === currentState.draggedItem);
                          if (oldIndex !== undefined) {
                            delete newState.droppedItems[oldIndex];
                          }
                          
                          newState.draggedItem = null;
                          newState.isDraggingFromSource = false;
                          newState.dragOverIndex = null;
                          newState.wasDropped = false;
                          
                          setReorderStates(prev => ({
                            ...prev,
                            [questionId]: newState
                          }));
                        }
                      };

                      return (
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                            Question {qIndex + 1}:
                          </div>
                          <div style={{ 
                            fontSize: '15px', 
                            fontWeight: 350,
                            marginBottom: '16px',
                            lineHeight: '1.8',
                            color: '#000000'
                          }}>
                            {q.questionText}
                          </div>

                          {/* Slots Row */}
                          <div style={{
                            marginBottom: '16px',
                            padding: '16px',
                            background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '8px',
                            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
                          }}>
                            <div style={{ 
                              fontSize: '14px', 
                              fontWeight: 350,
                              marginBottom: '12px',
                              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
                            }}>
                              Drop the words here in order:
                            </div>
                            
                            <div style={{ 
                              display: 'flex', 
                              flexWrap: 'wrap',
                              gap: '8px'
                            }}>
                              {[0, 1, 2, 3, 4].map((index) => (
                                <div
                                  key={index}
                                  onDrop={(e) => handleDropOnSlot(e, index)}
                                  onDragOver={(e) => handleDragOverSlot(e, index)}
                                  onDragLeave={handleDragLeaveSlot}
                                  onDragEnd={handleDragEnd}
                                  style={{
                                    minWidth: '80px',
                                    height: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: currentState.droppedItems[index] 
                                      ? `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}` // Solid border when item is present
                                      : currentState.dragOverIndex === index 
                                        ? `3px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}` // Solid border when dragging over
                                        : `2px dashed rgba(0, 0, 0, 0.5)`, // Dashed border when empty - gray
                                    borderRadius: '6px',
                                    background: currentState.droppedItems[index]
                                      ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)') // Different background when item is present
                                      : currentState.dragOverIndex === index
                                        ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.15)' : 'rgba(138, 122, 255, 0.15)')
                                        : '#ffffff', // White background when empty
                                    position: 'relative',
                                    transition: 'all 0.3s ease',
                                    transform: currentState.dragOverIndex === index ? 'scale(1.05)' : 'scale(1)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {currentState.droppedItems[index] ? (
                                    <div
                                      draggable
                                      onDragStart={(e) => handleDragStartFromSlot(e, index)}
                                      onDragEnd={handleDragEnd}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '6px 8px',
                                        background: theme === 'sun' ? 'rgba(24, 144, 255, 0.15)' : 'rgba(138, 122, 255, 0.18)',
                                        border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                        borderRadius: '4px',
                                        cursor: 'grab',
                                        userSelect: 'none',
                                        gap: '4px'
                                      }}
                                    >
                                      <span style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        background: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        fontWeight: '700',
                                        flexShrink: 0
                                      }}>
                                        {index + 1}
                                      </span>
                                      <span style={{ 
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                        textAlign: 'center'
                                      }}>
                                        {currentState.droppedItems[index]}
                                      </span>
                                    </div>
                                  ) : (
                                    <div style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '2px'
                                    }}>
                                      <span style={{
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        color: 'rgba(0, 0, 0, 0.5)'
                                      }}>
                                        {index + 1}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Source Words */}
                          <div
                            onDrop={(e) => {
                              e.preventDefault();
                              const newState = { ...currentState, wasDropped: true };
                              // If dropping from slot back to source
                              if (currentState.draggedItem && !currentState.isDraggingFromSource) {
                                if (!newState.sourceItems.includes(currentState.draggedItem)) {
                                  newState.sourceItems = [...newState.sourceItems, currentState.draggedItem];
                                }
                                // Remove from slot
                                const oldIndex = Object.keys(currentState.droppedItems).find(i => currentState.droppedItems[i] === currentState.draggedItem);
                                if (oldIndex) {
                                  delete newState.droppedItems[oldIndex];
                                }
                                newState.draggedItem = null;
                                newState.isDraggingFromSource = false;
                                newState.dragOverIndex = null;
                                
                                setReorderStates(prev => ({
                                  ...prev,
                                  [questionId]: newState
                                }));
                              }
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                            }}
                            style={{
                              padding: '16px',
                              background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                              borderRadius: '8px',
                              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
                            }}
                          >
                            <div style={{ 
                              fontSize: '14px', 
                              fontWeight: 350,
                              marginBottom: '12px',
                              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
                            }}>
                              Drag these words to the slots above:
                            </div>
                            
                            <div style={{ 
                              display: 'flex', 
                              flexWrap: 'wrap',
                              gap: '8px'
                            }}>
                              {currentState.sourceItems.map((item, idx) => (
                                <div
                                  key={`${item}-${idx}`}
                                  draggable
                                  onDragStart={(e) => handleDragStartFromSource(e, item)}
                                  onDragEnd={handleDragEnd}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    background: theme === 'sun' 
                                      ? 'rgba(24, 144, 255, 0.08)' 
                                      : 'rgba(138, 122, 255, 0.12)',
                                    border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                    cursor: 'grab',
                                    userSelect: 'none',
                                    transition: 'all 0.2s ease',
                                    boxShadow: theme === 'sun' 
                                      ? '0 2px 6px rgba(24, 144, 255, 0.15)' 
                                      : '0 2px 6px rgba(138, 122, 255, 0.15)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = theme === 'sun' 
                                      ? '0 4px 10px rgba(24, 144, 255, 0.25)' 
                                      : '0 4px 10px rgba(138, 122, 255, 0.25)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = theme === 'sun' 
                                      ? '0 2px 6px rgba(24, 144, 255, 0.15)' 
                                      : '0 2px 6px rgba(138, 122, 255, 0.15)';
                                  }}
                                >
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <Typography.Text style={{ 
                          fontSize: '16px', 
                          fontWeight: 600,
                          color: '#000000',
                          display: 'block',
                          marginBottom: '8px'
                        }}>
                          Question {qIndex + 1}:
                        </Typography.Text>
                        <Typography.Text style={{ 
                          fontSize: '15px', 
                          fontWeight: 350,
                          color: '#000000',
                          display: 'block',
                          lineHeight: '1.8'
                        }}>
                          {q.question || q.questionText}
                        </Typography.Text>
                      </div>

                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px' 
                    }}>
                      {q.type === 'MULTIPLE_SELECT' ? (
                      // Multiple Select (Checkbox)
                      q.options?.map((option) => (
                        <div 
                          key={option.key} 
                          className={`option-item ${selectedAnswers[q.id]?.includes(option.key) ? 'selected-answer' : ''}`}
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 18px',
                            background: selectedAnswers[q.id]?.includes(option.key)
                              ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                              : theme === 'sun'
                                ? 'rgba(255, 255, 255, 0.85)'
                                : 'rgba(255, 255, 255, 0.7)',
                            border: `2px solid ${
                              selectedAnswers[q.id]?.includes(option.key)
                                ? (theme === 'sun' ? 'rgb(24, 144, 255)' : 'rgb(138, 122, 255)')
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
                          onClick={() => {
                            const currentAnswers = selectedAnswers[q.id] || [];
                            const newAnswers = currentAnswers.includes(option.key)
                              ? currentAnswers.filter(key => key !== option.key)
                              : [...currentAnswers, option.key];
                            setSelectedAnswers(prev => ({
                              ...prev,
                              [q.id]: newAnswers
                            }));
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedAnswers[q.id]?.includes(option.key) || false}
                            onChange={() => {}}
                            style={{ 
                              width: '18px',
                              height: '18px',
                              accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                              cursor: 'pointer'
                            }} 
                          />
                          <span style={{ 
                            flexShrink: 0, 
                            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                            fontWeight: '600',
                            fontSize: '16px'
                          }}>
                            {option.key}.
                          </span>
                          <Typography.Text style={{ 
                            fontSize: '14px',
                            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                            fontWeight: '350',
                            flex: 1
                          }}>
                            {option.text}
                          </Typography.Text>
                        </div>
                      ))
                    ) : (
                      // Multiple Choice (Radio) or True/False
                      q.options?.map((option) => (
                        <div 
                          key={option.key} 
                          className={`option-item ${selectedAnswers[q.id] === option.key ? 'selected-answer' : ''}`}
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 18px',
                            background: selectedAnswers[q.id] === option.key 
                              ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                              : theme === 'sun'
                                ? 'rgba(255, 255, 255, 0.85)'
                                : 'rgba(255, 255, 255, 0.7)',
                            border: `2px solid ${
                              selectedAnswers[q.id] === option.key 
                                ? (theme === 'sun' ? 'rgb(24, 144, 255)' : 'rgb(138, 122, 255)')
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
                          onClick={() => handleAnswerSelect(q.id, option.key)}
                        >
                          <input 
                            type="radio" 
                            name={`question-${q.id}`} 
                            checked={selectedAnswers[q.id] === option.key}
                            onChange={() => handleAnswerSelect(q.id, option.key)}
                            style={{ 
                              width: '18px',
                              height: '18px',
                              accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                              cursor: 'pointer'
                            }} 
                          />
                          {q.type === 'TRUE_OR_FALSE' ? (
                            <Typography.Text style={{ 
                              fontSize: '14px',
                              color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                              fontWeight: '350',
                              flex: 1
                            }}>
                              {option.text}
                            </Typography.Text>
                          ) : (
                            <>
                              <span style={{ 
                                flexShrink: 0, 
                                color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                                fontWeight: '600',
                                fontSize: '16px'
                              }}>
                                {option.key}.
                              </span>
                              <Typography.Text style={{ 
                                fontSize: '14px',
                                color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                fontWeight: '350',
                                flex: 1
                              }}>
                                {option.text}
                              </Typography.Text>
                            </>
                          )}
                        </div>
                      ))
                    )}
                    </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

// Listening Section Component
const ListeningSectionItem = ({ question, index, theme }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioRef, setAudioRef] = useState(null);

  const handleAnswerSelect = (questionId, optionKey) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionKey
    }));
  };

  const handlePlayPause = () => {
    if (audioRef) {
      if (isPlaying) {
        audioRef.pause();
      } else {
        audioRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
  };

  const handleLoadedMetadata = (e) => {
    setDuration(e.target.duration);
  };

  const handleSeek = (e) => {
    if (audioRef) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      audioRef.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef) {
      audioRef.volume = newVolume;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <style>
        {`
          .listening-passage-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .listening-passage-scrollbar::-webkit-scrollbar-track {
            background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'};
            border-radius: 4px;
          }
          .listening-passage-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'};
            border-radius: 4px;
            border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'};
          }
          .listening-passage-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'};
          }
          .transcript-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .transcript-scrollbar::-webkit-scrollbar-track {
            background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'};
            border-radius: 4px;
          }
          .transcript-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'};
            border-radius: 4px;
            border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'};
          }
          .transcript-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'};
          }
        `}
      </style>
      <div
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
        {/* Header */}
        <div className="question-header" style={{
          paddingBottom: '14px',
          marginBottom: '16px',
          borderBottom: '2px solid',
          borderBottomColor: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.25)' 
            : 'rgba(138, 122, 255, 0.2)',
          position: 'relative'
        }}>
          <Typography.Text strong style={{ 
            fontSize: '20px', 
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
          }}>
            {index + 1}. Listening Section
          </Typography.Text>
          <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
            ({question.points} {question.points > 1 ? 'points' : 'point'})
          </Typography.Text>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'flex', gap: '24px', minHeight: '500px' }}>
          {/* Left Column - Audio Player and Transcript */}
          <div 
            className="listening-passage-scrollbar"
            style={{
              flex: '1',
              padding: '20px',
              background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
              overflowY: 'auto',
              maxHeight: '600px',
              scrollbarWidth: 'thin',
              scrollbarColor: theme === 'sun' 
                ? '#1890ff rgba(24, 144, 255, 0.2)' 
                : '#8B5CF6 rgba(138, 122, 255, 0.2)'
            }}>
            
            {/* Audio Title */}
            <div style={{ marginBottom: '20px' }}>
              <Typography.Title level={4} style={{ 
                margin: 0, 
                color: theme === 'sun' ? '#1E40AF' : '#1F2937',
                fontSize: '20px',
                fontWeight: 600
              }}>
                {question.title}
              </Typography.Title>
            </div>

            {/* Audio Player */}
            <div style={{
              background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
              boxShadow: theme === 'sun' 
                ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                : '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              <audio
                ref={setAudioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                style={{ display: 'none' }}
              >
                <source src={question.audioUrl} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>

              {/* Audio Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                {/* Play/Pause Button */}
                <button
                  onClick={handlePlayPause}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: 'none',
                    background: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: theme === 'sun' 
                      ? '0 4px 12px rgba(24, 144, 255, 0.3)' 
                      : '0 4px 12px rgba(138, 122, 255, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>

                {/* Time Display */}
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme === 'sun' ? '#333' : '#1F2937',
                  minWidth: '80px'
                }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    flex: 1,
                    height: '6px',
                    background: theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={handleSeek}
                >
                  <div
                    style={{
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                      height: '100%',
                      background: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                      borderRadius: '3px',
                      transition: 'width 0.1s ease'
                    }}
                  />
                </div>

                {/* Volume Control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '16px',
                    color: theme === 'sun' ? '#666' : '#ccc'
                  }}>🔊</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    style={{
                      width: '60px',
                      accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Transcript Section */}
            <div>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: theme === 'sun' 
                    ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)'
                    : 'linear-gradient(135deg, #8B5CF6 0%, #a78bfa 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  transition: 'all 0.3s ease',
                  boxShadow: theme === 'sun' 
                    ? '0 4px 12px rgba(24, 144, 255, 0.3)'
                    : '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme === 'sun' 
                    ? 'linear-gradient(135deg, #40a9ff 0%, #69c0ff 100%)'
                    : 'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = theme === 'sun' 
                    ? '0 6px 16px rgba(24, 144, 255, 0.4)'
                    : '0 6px 16px rgba(139, 92, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme === 'sun' 
                    ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)'
                    : 'linear-gradient(135deg, #8B5CF6 0%, #a78bfa 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = theme === 'sun' 
                    ? '0 4px 12px rgba(24, 144, 255, 0.3)'
                    : '0 4px 12px rgba(139, 92, 246, 0.3)';
                }}
              >
                <span>View transcript</span>
                <span style={{ 
                  transform: showTranscript ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.3s ease',
                  fontSize: '12px'
                }}>
                  ▼
                </span>
              </button>

              {showTranscript && (
                <div
                  className="transcript-scrollbar"
                  style={{
                    background: theme === 'sun' ? '#ffffff' : '#ffffff',
                    borderRadius: '8px',
                    padding: '16px',
                    border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(138, 122, 255, 0.3)'}`,
                    fontSize: '15px',
                    lineHeight: '1.8',
                    color: theme === 'sun' ? '#333' : '#333',
                    textAlign: 'justify',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: theme === 'sun' 
                      ? '#1890ff rgba(24, 144, 255, 0.2)' 
                      : '#8B5CF6 rgba(138, 122, 255, 0.2)',
                    boxShadow: theme === 'sun' 
                      ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                      : '0 2px 8px rgba(138, 122, 255, 0.2)'
                  }}>
                  {question.transcript}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Questions */}
          <div style={{
            flex: '1',
            background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
            overflowY: 'auto',
            maxHeight: '600px'
          }}>
            <div style={{ padding: '20px' }}>
              {/* Questions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {question.questions.map((q, qIndex) => (
                  <div key={q.id} style={{
                    padding: '16px',
                    background: theme === 'sun' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`
                  }}>
                    {/* Answer Options - Same as SectionQuestionItem */}
                    {q.type === 'DROPDOWN' ? (
                      // Dropdown
                      <div style={{ 
                        marginBottom: '16px',
                        fontSize: '15px', 
                        fontWeight: 350,
                        lineHeight: '1.8',
                        color: '#000000'
                      }}>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                          Question {qIndex + 1}:
                        </div>
                        <div>
                          {q.questionText?.split('_______').map((part, index, array) => (
                          <React.Fragment key={index}>
                            {part}
                            {index < array.length - 1 && (
                              <select
                                value={selectedAnswers[`${q.id}_pos_1`] || ''}
                                onChange={(e) => setSelectedAnswers(prev => ({
                                  ...prev,
                                  [`${q.id}_pos_1`]: e.target.value
                                }))}
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
                              >
                                <option value="">Select</option>
                                {q.content?.data?.map((item) => (
                                  <option key={item.id} value={item.value}>
                                    {item.value}
                                  </option>
                                ))}
                              </select>
                            )}
                          </React.Fragment>
                        ))}
                        </div>
                      </div>
                    ) : q.type === 'FILL_IN_THE_BLANK' ? (
                      // Fill in the Blank
                      <div style={{ 
                        marginBottom: '16px',
                        fontSize: '15px', 
                        fontWeight: 350,
                        lineHeight: '1.8',
                        color: '#000000'
                      }}>
                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                          Question {qIndex + 1}:
                        </div>
                        <div>
                          {q.questionText?.split('_______').map((part, index, array) => (
                          <React.Fragment key={index}>
                            {part}
                            {index < array.length - 1 && (
                              <span
                                className="paragraph-input"
                                contentEditable
                                data-input-key={`input_${q.id}_${index}`}
                                id={`fill_blank_input_${q.id}_${index}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: '120px',
                                  maxWidth: '200px',
                                  minHeight: '32px',
                                  padding: '4px 12px',
                                  margin: '0 8px',
                                  background: theme === 'sun' ? '#E9EEFF94' : 'rgba(255, 255, 255, 0.1)',
                                  border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                                  borderRadius: '8px',
                                  cursor: 'text',
                                  outline: 'none',
                                  verticalAlign: 'top',
                                  lineHeight: '1.4',
                                  fontSize: '14px',
                                  boxSizing: 'border-box',
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  color: '#000000',
                                  textAlign: 'center'
                                }}
                              />
                            )}
                          </React.Fragment>
                        ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ marginBottom: '16px' }}>
                          <Typography.Text style={{ 
                            fontSize: '16px', 
                            fontWeight: 600,
                            color: '#000000',
                            display: 'block',
                            marginBottom: '8px'
                          }}>
                            Question {qIndex + 1}:
                          </Typography.Text>
                          <Typography.Text style={{ 
                            fontSize: '15px', 
                            fontWeight: 350,
                            color: '#000000',
                            display: 'block',
                            lineHeight: '1.8'
                          }}>
                            {q.question || q.questionText}
                          </Typography.Text>
                        </div>

                        <div style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px' 
                        }}>
                          {q.type === 'MULTIPLE_SELECT' ? (
                          // Multiple Select (Checkbox)
                          q.options?.map((option) => (
                            <div 
                              key={option.key} 
                              className={`option-item ${selectedAnswers[q.id]?.includes(option.key) ? 'selected-answer' : ''}`}
                              style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 18px',
                                background: selectedAnswers[q.id]?.includes(option.key)
                                  ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                                  : theme === 'sun'
                                    ? 'rgba(255, 255, 255, 0.85)'
                                    : 'rgba(255, 255, 255, 0.7)',
                                border: `2px solid ${
                                  selectedAnswers[q.id]?.includes(option.key)
                                    ? (theme === 'sun' ? 'rgb(24, 144, 255)' : 'rgb(138, 122, 255)')
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
                              onClick={() => {
                                const currentAnswers = selectedAnswers[q.id] || [];
                                const newAnswers = currentAnswers.includes(option.key)
                                  ? currentAnswers.filter(key => key !== option.key)
                                  : [...currentAnswers, option.key];
                                setSelectedAnswers(prev => ({
                                  ...prev,
                                  [q.id]: newAnswers
                                }));
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={selectedAnswers[q.id]?.includes(option.key) || false}
                                onChange={() => {}}
                                style={{ 
                                  width: '18px',
                                  height: '18px',
                                  accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                  cursor: 'pointer'
                                }} 
                              />
                              <span style={{ 
                                flexShrink: 0, 
                                color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                                fontWeight: '600',
                                fontSize: '16px'
                              }}>
                                {option.key}.
                              </span>
                              <Typography.Text style={{ 
                                fontSize: '14px',
                                color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                fontWeight: '350',
                                flex: 1
                              }}>
                                {option.text}
                              </Typography.Text>
                            </div>
                          ))
                        ) : (
                          // Multiple Choice (Radio) or True/False
                          q.options?.map((option) => (
                            <div 
                              key={option.key} 
                              className={`option-item ${selectedAnswers[q.id] === option.key ? 'selected-answer' : ''}`}
                              style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 18px',
                                background: selectedAnswers[q.id] === option.key 
                                  ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                                  : theme === 'sun'
                                    ? 'rgba(255, 255, 255, 0.85)'
                                    : 'rgba(255, 255, 255, 0.7)',
                                border: `2px solid ${
                                  selectedAnswers[q.id] === option.key 
                                    ? (theme === 'sun' ? 'rgb(24, 144, 255)' : 'rgb(138, 122, 255)')
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
                              onClick={() => handleAnswerSelect(q.id, option.key)}
                            >
                              <input 
                                type="radio" 
                                name={`question-${q.id}`} 
                                checked={selectedAnswers[q.id] === option.key}
                                onChange={() => handleAnswerSelect(q.id, option.key)}
                                style={{ 
                                  width: '18px',
                                  height: '18px',
                                  accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                                  cursor: 'pointer'
                                }} 
                              />
                              {q.type === 'TRUE_OR_FALSE' ? (
                                <Typography.Text style={{ 
                                  fontSize: '14px',
                                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                  fontWeight: '350',
                                  flex: 1
                                }}>
                                  {option.text}
                                </Typography.Text>
                              ) : (
                                <>
                                  <span style={{ 
                                    flexShrink: 0, 
                                    color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                                    fontWeight: '600',
                                    fontSize: '16px'
                                  }}>
                                    {option.key}.
                                  </span>
                                  <Typography.Text style={{ 
                                    fontSize: '14px',
                                    color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                                    fontWeight: '350',
                                    flex: 1
                                  }}>
                                    {option.text}
                                  </Typography.Text>
                                </>
                              )}
                            </div>
                          ))
                        )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Writing Section Component
const WritingSectionItem = ({ question, index, theme }) => {
  const [essayText, setEssayText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [wordCount, setWordCount] = useState(0);
  const [writingMode, setWritingMode] = useState(null); // null or 'handwriting'

  // Word count effect
  useEffect(() => {
    const words = essayText.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [essayText]);


  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };


  return (
    <>
      <style>
        {`
          .writing-prompt-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .writing-prompt-scrollbar::-webkit-scrollbar-track {
            background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'};
            border-radius: 4px;
          }
          .writing-prompt-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'};
            border-radius: 4px;
            border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'};
          }
          .writing-prompt-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'};
          }
        `}
      </style>
      <div
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
        {/* Header */}
        <div className="question-header" style={{
          paddingBottom: '14px',
          marginBottom: '16px',
          borderBottom: '2px solid',
          borderBottomColor: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.25)' 
            : 'rgba(138, 122, 255, 0.2)',
          position: 'relative'
        }}>
          <Typography.Text strong style={{ 
            fontSize: '16px', 
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
          }}>
            {index + 1}. Writing Section
          </Typography.Text>
          <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
            ({question.points} {question.points > 1 ? 'points' : 'point'})
          </Typography.Text>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'flex', gap: '24px', minHeight: '600px' }}>
          {/* Left Column - Writing Prompt */}
          <div 
            className="writing-prompt-scrollbar"
            style={{
              flex: '1',
              padding: '20px',
              background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
              overflowY: 'auto',
              maxHeight: '600px',
              scrollbarWidth: 'thin',
              scrollbarColor: theme === 'sun' 
                ? '#1890ff rgba(24, 144, 255, 0.2)' 
                : '#8B5CF6 rgba(138, 122, 255, 0.2)'
            }}>
            
            {/* Writing Title */}
            <div style={{ marginBottom: '20px' }}>
              <Typography.Title level={4} style={{ 
                margin: 0, 
                color: theme === 'sun' ? '#1E40AF' : '#1F2937',
                fontSize: '20px',
                fontWeight: 600
              }}>
                {question.title}
              </Typography.Title>
            </div>

            {/* Writing Prompt */}
            <div style={{
              fontSize: '15px',
              lineHeight: '1.8',
              color: theme === 'sun' ? '#333' : '#1F2937',
              textAlign: 'justify'
            }}>
              {question.prompt.split('\n').map((line, idx) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                  return (
                    <div key={idx} style={{
                      fontWeight: '600',
                      fontSize: '16px',
                      margin: '16px 0 8px 0',
                      color: theme === 'sun' ? '#1E40AF' : '#1F2937'
                    }}>
                      {line.replace(/\*\*/g, '')}
                    </div>
                  );
                } else if (line.startsWith('- ')) {
                  return (
                    <div key={idx} style={{
                      margin: '4px 0',
                      paddingLeft: '16px',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '0',
                        color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                        fontWeight: 'bold'
                      }}>•</span>
                      {line.substring(2)}
                    </div>
                  );
                } else if (line.match(/^\d+\./)) {
                  return (
                    <div key={idx} style={{
                      margin: '4px 0',
                      paddingLeft: '16px',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '0',
                        color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                        fontWeight: 'bold'
                      }}>{line.match(/^\d+\./)[0]}</span>
                      {line.replace(/^\d+\.\s*/, '')}
                    </div>
                  );
                } else if (line.trim() === '') {
                  return <div key={idx} style={{ height: '8px' }} />;
                } else {
                  return (
                    <div key={idx} style={{ margin: '8px 0' }}>
                      {line}
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Right Column - Writing Area */}
          <div style={{
            flex: '1',
            background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
            overflowY: 'auto',
            maxHeight: '600px'
          }}>
            <div style={{ padding: '20px' }}>
              {writingMode === null ? (
                /* Show 2 options initially */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Handwriting Option */}
                  <div
                    onClick={() => setWritingMode('handwriting')}
                    style={{
                      padding: '24px',
                      background: theme === 'sun' 
                        ? 'linear-gradient(135deg, rgba(230, 245, 255, 0.5) 0%, rgba(186, 231, 255, 0.4) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(244, 240, 255, 0.5) 100%)',
                      border: `2px solid ${theme === 'sun' 
                        ? 'rgba(24, 144, 255, 0.3)' 
                        : 'rgba(138, 122, 255, 0.3)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = theme === 'sun' 
                        ? '0 4px 12px rgba(24, 144, 255, 0.2)'
                        : '0 4px 12px rgba(138, 122, 255, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>✍️</div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600',
                      color: theme === 'sun' ? '#1E40AF' : '#8377A0',
                      marginBottom: '4px'
                    }}>
                      Write Essay Here
                    </div>
                    <div style={{ 
                      fontSize: '13px',
                      color: theme === 'sun' ? '#666' : '#999'
                    }}>
                      Type your essay directly in the text area
                    </div>
                  </div>

                  {/* Upload File Option */}
                  <div style={{
                    position: 'relative'
                  }}>
                    <input
                      type="file"
                      id="upload-option"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="upload-option"
                      style={{
                        display: 'block',
                        padding: '24px',
                        background: theme === 'sun' 
                          ? 'linear-gradient(135deg, rgba(237, 250, 230, 0.5) 0%, rgba(207, 244, 192, 0.4) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(244, 240, 255, 0.5) 100%)',
                        border: `2px solid ${theme === 'sun' 
                          ? 'rgba(82, 196, 26, 0.3)' 
                          : 'rgba(138, 122, 255, 0.3)'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = theme === 'sun' 
                          ? '0 4px 12px rgba(82, 196, 26, 0.2)'
                          : '0 4px 12px rgba(138, 122, 255, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '600',
                        color: theme === 'sun' ? '#1E40AF' : '#8377A0',
                        marginBottom: '4px'
                      }}>
                        Upload
                      </div>
                      <div style={{ 
                        fontSize: '13px',
                        color: theme === 'sun' ? '#666' : '#999'
                      }}>
                        Upload image of your handwritten essay (Max 5MB)
                      </div>
                    </label>
                  </div>
                </div>
              ) : writingMode === 'handwriting' ? (
                /* Show textarea when handwriting mode */
                <div>
                  <button
                    onClick={() => {
                      setWritingMode(null);
                      setEssayText('');
                    }}
                    style={{
                      padding: '6px 12px',
                      marginBottom: '16px',
                      background: 'none',
                      border: `1px solid ${theme === 'sun' ? '#d9d9d9' : 'rgba(255, 255, 255, 0.2)'}`,
                      borderRadius: '6px',
                      color: theme === 'sun' ? '#1E40AF' : '#8B5CF6',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    ← Back to options
                  </button>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <label style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: theme === 'sun' ? '#333' : '#1F2937'
                      }}>
                        Your Essay:
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ 
                          fontSize: '16px', 
                          fontWeight: '500',
                          color: theme === 'sun' ? '#666' : '#999',
                          letterSpacing: '0.3px'
                        }}>
                          {wordCount}
                        </span>
                        <span style={{ 
                          fontSize: '16px',
                          color: theme === 'sun' ? '#999' : '#777',
                          fontWeight: '400'
                        }}>
                          words
                        </span>
                      </div>
                    </div>
                    <textarea
                      value={essayText}
                      onChange={(e) => setEssayText(e.target.value)}
                      placeholder="Start writing your essay here..."
                      style={{
                        width: '100%',
                        minHeight: '400px',
                        padding: '16px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        border: `2px solid ${theme === 'sun' 
                          ? 'rgba(24, 144, 255, 0.2)' 
                          : 'rgba(138, 122, 255, 0.3)'}`,
                        borderRadius: '8px',
                        background: theme === 'sun' 
                          ? 'linear-gradient(135deg, #ffffff 0%, rgba(24, 144, 255, 0.02) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(138, 122, 255, 0.05) 100%)',
                        color: theme === 'sun' ? '#333' : '#1F2937',
                        resize: 'vertical',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        boxShadow: theme === 'sun' 
                          ? '0 2px 8px rgba(24, 144, 255, 0.1)'
                          : '0 2px 8px rgba(138, 122, 255, 0.15)'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = theme === 'sun' ? '#1890ff' : '#8B5CF6';
                        e.target.style.boxShadow = theme === 'sun' 
                          ? '0 4px 12px rgba(24, 144, 255, 0.2)'
                          : '0 4px 12px rgba(138, 122, 255, 0.25)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = theme === 'sun' 
                          ? 'rgba(24, 144, 255, 0.2)' 
                          : 'rgba(138, 122, 255, 0.3)';
                        e.target.style.boxShadow = theme === 'sun' 
                          ? '0 2px 8px rgba(24, 144, 255, 0.1)'
                          : '0 2px 8px rgba(138, 122, 255, 0.15)';
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {/* Show uploaded files below options */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: theme === 'sun' ? '#333' : '#1F2937'
                  }}>
                    Uploaded Files:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          background: theme === 'sun' 
                            ? 'linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(64, 169, 255, 0.05) 100%)'
                            : 'linear-gradient(135deg, rgba(138, 122, 255, 0.12) 0%, rgba(167, 139, 250, 0.08) 100%)',
                          border: `1px solid ${theme === 'sun' 
                            ? 'rgba(24, 144, 255, 0.2)' 
                            : 'rgba(138, 122, 255, 0.25)'}`,
                          borderRadius: '6px',
                          fontSize: '12px',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <span>📄</span>
                        <span style={{ color: theme === 'sun' ? '#333' : '#1F2937' }}>
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeFile(file.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ff4d4f',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '2px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Speaking Section Component
const SpeakingSectionItem = ({ question, index, theme }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
        };

        mediaRecorder.start();
        setIsRecording(true);
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
        alert('Could not access microphone. Please check permissions.');
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const removeRecording = () => {
    setAudioUrl(null);
  };

  return (
    <>
      <style>
        {`
          .speaking-prompt-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .speaking-prompt-scrollbar::-webkit-scrollbar-track {
            background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'};
            border-radius: 4px;
          }
          .speaking-prompt-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'};
            border-radius: 4px;
            border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'};
          }
          .speaking-prompt-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'};
          }
        `}
      </style>
      <div
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
        {/* Header */}
        <div className="question-header" style={{
          paddingBottom: '14px',
          marginBottom: '16px',
          borderBottom: '2px solid',
          borderBottomColor: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.25)' 
            : 'rgba(138, 122, 255, 0.2)',
          position: 'relative'
        }}>
          <Typography.Text strong style={{ 
            fontSize: '20px', 
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
          }}>
            {index + 1}. Speaking Section
          </Typography.Text>
          <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
            ({question.points} {question.points > 1 ? 'points' : 'point'})
          </Typography.Text>
        </div>

        {/* Layout: Left - Prompt, Right - Recording */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Left Section - Prompt */}
          <div 
            className="speaking-prompt-scrollbar"
            style={{
              flex: '1',
              padding: '20px',
              background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
              overflowY: 'auto',
              maxHeight: '500px',
              scrollbarWidth: 'thin',
              scrollbarColor: theme === 'sun' 
                ? '#1890ff rgba(24, 144, 255, 0.2)' 
                : '#8B5CF6 rgba(138, 122, 255, 0.2)'
            }}>
            
            <div style={{ marginBottom: '16px' }}>
              <Typography.Title level={4} style={{ 
                margin: 0, 
                color: theme === 'sun' ? '#1E40AF' : '#1F2937',
                fontSize: '20px',
                fontWeight: 600
              }}>
                {question.title}
              </Typography.Title>
            </div>

            <div style={{
              fontSize: '15px',
              lineHeight: '1.8',
              color: theme === 'sun' ? '#333' : '#1F2937',
              textAlign: 'justify'
            }}>
              {question.prompt.split('\n').map((line, idx) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                  return (
                    <div key={idx} style={{
                      fontWeight: '600',
                      fontSize: '16px',
                      margin: '16px 0 8px 0',
                      color: theme === 'sun' ? '#1E40AF' : '#1F2937'
                    }}>
                      {line.replace(/\*\*/g, '')}
                    </div>
                  );
                } else if (line.startsWith('- ')) {
                  return (
                    <div key={idx} style={{
                      margin: '4px 0',
                      paddingLeft: '16px',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '0',
                        color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                        fontWeight: 'bold'
                      }}>•</span>
                      {line.substring(2)}
                    </div>
                  );
                } else if (line.match(/^\d+\./)) {
                  return (
                    <div key={idx} style={{
                      margin: '4px 0',
                      paddingLeft: '16px',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '0',
                        color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                        fontWeight: 'bold'
                      }}>{line.match(/^\d+\./)[0]}</span>
                      {line.replace(/^\d+\.\s*/, '')}
                    </div>
                  );
                } else if (line.trim() === '') {
                  return <div key={idx} style={{ height: '8px' }} />;
                } else {
                  return (
                    <div key={idx} style={{ margin: '8px 0' }}>
                      {line}
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Right Section - Recording Area */}
          <div style={{
            flex: '1',
            padding: '24px',
            background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
            textAlign: 'center'
          }}>
            {/* Recorded Audio Display */}
            {audioUrl && (
              <div style={{ marginBottom: '20px' }}>
                <audio controls style={{ width: '100%', height: '40px' }}>
                  <source src={audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                <button
                  onClick={removeRecording}
                  style={{
                    marginTop: '8px',
                    padding: '6px 16px',
                    background: theme === 'sun' 
                      ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                      : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ✕ Remove Recording
                </button>
              </div>
            )}

            {/* Mic Button - Large and Centered */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: 'none',
                background: isRecording 
                  ? '#ff4d4f'
                  : 'rgb(227, 244, 255)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: isRecording
                  ? '0 0 20px rgba(255, 77, 79, 0.5)'
                  : '0 4px 12px rgba(24, 144, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isRecording) {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 6px 16px rgba(24, 144, 255, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isRecording) {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.3)';
                }
              }}
            >
              <img 
                src="/img/icon-mic.png" 
                alt="Microphone" 
                style={{ 
                  width: '60px',
                  height: '60px',
                  filter: 'none'
                }} 
              />
            </button>

            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: theme === 'sun' ? '#1E40AF' : '#8B5CF6',
              marginBottom: '8px'
            }}>
              {isRecording ? 'Recording...' : 'Click to start recording'}
            </div>
            <div style={{
              fontSize: '12px',
              color: theme === 'sun' ? '#666' : '#999'
            }}>
              {isRecording ? 'Click the microphone again to stop' : 'Press the microphone to record your response'}
            </div>

            {/* Upload Section - Similar to Writing */}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.2)'}` }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '600',
                color: theme === 'sun' ? '#333' : '#1F2937',
                marginBottom: '16px'
              }}>
                Upload Audio File (Optional):
              </div>
              
              <div style={{
                position: 'relative'
              }}>
                <input
                  type="file"
                  id="speaking-audio-upload"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="speaking-audio-upload"
                  style={{
                    display: 'block',
                    padding: '20px',
                    background: theme === 'sun' 
                      ? 'linear-gradient(135deg, rgba(237, 250, 230, 0.5) 0%, rgba(207, 244, 192, 0.4) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(244, 240, 255, 0.5) 100%)',
                    border: `2px solid ${theme === 'sun' 
                      ? 'rgba(82, 196, 26, 0.3)' 
                      : 'rgba(138, 122, 255, 0.3)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = theme === 'sun' 
                      ? '0 4px 12px rgba(82, 196, 26, 0.2)'
                      : '0 4px 12px rgba(138, 122, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: theme === 'sun' ? '#1E40AF' : '#8377A0',
                    marginBottom: '4px'
                  }}>
                    Upload Audio
                  </div>
                  <div style={{ 
                    fontSize: '13px',
                    color: theme === 'sun' ? '#666' : '#999'
                  }}>
                    Upload MP3 audio file (Max 5MB)
                  </div>
                </label>
              </div>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: theme === 'sun' 
                          ? 'linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(64, 169, 255, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(138, 122, 255, 0.12) 0%, rgba(167, 139, 250, 0.08) 100%)',
                        border: `1px solid ${theme === 'sun' 
                          ? 'rgba(24, 144, 255, 0.2)' 
                          : 'rgba(138, 122, 255, 0.25)'}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span>🎵</span>
                      <span style={{ color: theme === 'sun' ? '#333' : '#1F2937' }}>
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(file.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff4d4f',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '2px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Speaking With Audio Section Component
const SpeakingWithAudioSectionItem = ({ question, index, theme }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
        };

        mediaRecorder.start();
        setIsRecording(true);
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
        alert('Could not access microphone. Please check permissions.');
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const removeRecording = () => {
    setAudioUrl(null);
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <style>
        {`
          .speaking-audio-prompt-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .speaking-audio-prompt-scrollbar::-webkit-scrollbar-track {
            background: ${theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)'};
            border-radius: 4px;
          }
          .speaking-audio-prompt-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme === 'sun' ? '#1890ff' : '#8B5CF6'};
            border-radius: 4px;
            border: 1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.2)'};
          }
          .speaking-audio-prompt-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'sun' ? '#40a9ff' : '#a78bfa'};
          }
        `}
      </style>
      <div
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
        {/* Header */}
        <div className="question-header" style={{
          paddingBottom: '14px',
          marginBottom: '16px',
          borderBottom: '2px solid',
          borderBottomColor: theme === 'sun' 
            ? 'rgba(113, 179, 253, 0.25)' 
            : 'rgba(138, 122, 255, 0.2)',
          position: 'relative'
        }}>
          <Typography.Text strong style={{ 
            fontSize: '20px', 
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
          }}>
            {index + 1}. Speaking With Audio Section
          </Typography.Text>
          <Typography.Text style={{ marginLeft: '12px', fontSize: '14px', opacity: 0.7 }}>
            ({question.points} {question.points > 1 ? 'points' : 'point'})
          </Typography.Text>
        </div>

        {/* Layout: Left - Audio Player, Right - Recording */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Left Section - Audio Player */}
          <div 
            className="speaking-audio-prompt-scrollbar"
            style={{
              flex: '1',
              padding: '20px',
              background: theme === 'sun' ? '#f9f9f9' : 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
              overflowY: 'auto',
              maxHeight: '500px',
              scrollbarWidth: 'thin',
              scrollbarColor: theme === 'sun' 
                ? '#1890ff rgba(24, 144, 255, 0.2)' 
                : '#8B5CF6 rgba(138, 122, 255, 0.2)'
            }}>
            
            <div style={{ marginBottom: '16px' }}>
              <Typography.Title level={4} style={{ 
                margin: 0, 
                color: theme === 'sun' ? '#1E40AF' : '#1F2937',
                fontSize: '20px',
                fontWeight: 600
              }}>
                {question.title}
              </Typography.Title>
            </div>

            {/* Audio Player */}
            <div style={{
              background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
              boxShadow: theme === 'sun' 
                ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                : '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              <audio
                ref={audioRef}
                src={question.audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                style={{ display: 'none' }}
              >
                <source src={question.audioUrl} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>

              {/* Audio Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                {/* Play/Pause Button */}
                <button
                  onClick={togglePlayPause}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: 'none',
                    background: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: theme === 'sun' 
                      ? '0 4px 12px rgba(24, 144, 255, 0.3)' 
                      : '0 4px 12px rgba(138, 122, 255, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>

                {/* Time Display */}
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme === 'sun' ? '#333' : '#1F2937',
                  minWidth: '80px'
                }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    flex: 1,
                    height: '6px',
                    background: theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={handleSeek}
                >
                  <div
                    style={{
                      width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                      height: '100%',
                      background: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                      borderRadius: '3px',
                      transition: 'width 0.1s ease'
                    }}
                  />
                </div>

                {/* Volume Control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '16px',
                    color: theme === 'sun' ? '#666' : '#ccc'
                  }}>🔊</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    style={{
                      width: '60px',
                      accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Transcript Content */}
            <div style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '16px',
              border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(138, 122, 255, 0.3)'}`,
              fontSize: '15px',
              lineHeight: '1.8',
              color: '#333',
              textAlign: 'justify',
              boxShadow: theme === 'sun' 
                ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                : '0 2px 8px rgba(138, 122, 255, 0.2)'
            }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '600',
                marginBottom: '12px',
                color: theme === 'sun' ? '#1E40AF' : '#8B5CF6'
              }}>
                Từ vựng: Banana
              </div>
              <div style={{ marginBottom: '8px', color: '#333' }}>
                <strong>Phiên âm:</strong> /bəˈnɑːnə/
              </div>
              <div style={{ marginBottom: '16px', color: '#333' }}>
                <strong>Trọng âm:</strong> Nhấn vào âm tiết thứ hai
              </div>
              <div style={{ marginBottom: '8px', color: '#666', fontSize: '14px' }}>
                Phiên âm tiếng Anh của "quả chuối" (banana) là /bəˈnɑːnə/. Từ này có trọng âm rơi vào âm tiết thứ hai.
              </div>
              <img 
                src="/img/banana.jpg" 
                alt="Banana" 
                style={{ 
                  width: '100%',
                  maxWidth: '300px',
                  borderRadius: '8px',
                  marginTop: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }} 
              />
            </div>
          </div>

          {/* Right Section - Recording Area */}
          <div style={{
            flex: '1',
            padding: '24px',
            background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
            textAlign: 'center'
          }}>
            {/* Recorded Audio Display */}
            {audioUrl && (
              <div style={{ marginBottom: '20px' }}>
                <audio controls style={{ width: '100%', height: '40px' }}>
                  <source src={audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                <button
                  onClick={removeRecording}
                  style={{
                    marginTop: '8px',
                    padding: '6px 16px',
                    background: theme === 'sun' 
                      ? 'linear-gradient(135deg, #66AEFF, #3C99FF)'
                      : 'linear-gradient(135deg, #B5B0C0 19%, #A79EBB 64%, #8377A0 75%, #ACA5C0 97%, #6D5F8F 100%)',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    boxShadow: theme === 'sun' ? '0 2px 8px rgba(60, 153, 255, 0.3)' : '0 2px 8px rgba(131, 119, 160, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ✕ Remove Recording
                </button>
              </div>
            )}

            {/* Mic Button - Large and Centered */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: 'none',
                background: isRecording 
                  ? '#ff4d4f'
                  : 'rgb(227, 244, 255)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: isRecording
                  ? '0 0 20px rgba(255, 77, 79, 0.5)'
                  : '0 4px 12px rgba(24, 144, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!isRecording) {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 6px 16px rgba(24, 144, 255, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isRecording) {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.3)';
                }
              }}
            >
              <img 
                src="/img/icon-mic.png" 
                alt="Microphone" 
                style={{ 
                  width: '60px',
                  height: '60px',
                  filter: 'none'
                }} 
              />
            </button>

            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: theme === 'sun' ? '#1E40AF' : '#8B5CF6',
              marginBottom: '8px'
            }}>
              {isRecording ? 'Recording...' : 'Click to start recording'}
            </div>
            <div style={{
              fontSize: '12px',
              color: theme === 'sun' ? '#666' : '#999'
            }}>
              {isRecording ? 'Click the microphone again to stop' : 'Press the microphone to record your response'}
            </div>

            {/* Upload Section - Similar to Writing */}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.2)'}` }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '600',
                color: theme === 'sun' ? '#333' : '#1F2937',
                marginBottom: '16px'
              }}>
                Upload Audio File (Optional):
              </div>
              
              <div style={{
                position: 'relative'
              }}>
                <input
                  type="file"
                  id="speaking-with-audio-upload"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="speaking-with-audio-upload"
                  style={{
                    display: 'block',
                    padding: '20px',
                    background: theme === 'sun' 
                      ? 'linear-gradient(135deg, rgba(237, 250, 230, 0.5) 0%, rgba(207, 244, 192, 0.4) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(244, 240, 255, 0.5) 100%)',
                    border: `2px solid ${theme === 'sun' 
                      ? 'rgba(82, 196, 26, 0.3)' 
                      : 'rgba(138, 122, 255, 0.3)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = theme === 'sun' 
                      ? '0 4px 12px rgba(82, 196, 26, 0.2)'
                      : '0 4px 12px rgba(138, 122, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: theme === 'sun' ? '#1E40AF' : '#8377A0',
                    marginBottom: '4px'
                  }}>
                    Upload Audio
                  </div>
                  <div style={{ 
                    fontSize: '13px',
                    color: theme === 'sun' ? '#666' : '#999'
                  }}>
                    Upload MP3 audio file (Max 5MB)
                  </div>
                </label>
              </div>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: theme === 'sun' 
                          ? 'linear-gradient(135deg, rgba(24, 144, 255, 0.08) 0%, rgba(64, 169, 255, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(138, 122, 255, 0.12) 0%, rgba(167, 139, 250, 0.08) 100%)',
                        border: `1px solid ${theme === 'sun' 
                          ? 'rgba(24, 144, 255, 0.2)' 
                          : 'rgba(138, 122, 255, 0.25)'}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span>🎵</span>
                      <span style={{ color: theme === 'sun' ? '#333' : '#1F2937' }}>
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(file.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff4d4f',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '2px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Multiple Choice Container Component
const MultipleChoiceContainer = ({ theme, data }) => {
  const [selectedAnswer, setSelectedAnswer] = React.useState(null);
  const toPlain = (s) => (typeof s === 'string' ? s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim() : s);
  const questionText = toPlain(data?.question || data?.questionText || 'What is the capital city of Vietnam?');
  const optionsFromApi = Array.isArray(data?.options) && data.options.length > 0
    ? data.options
    : null;

  return (
    <div
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
      {/* Header */}
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
        <Typography.Text strong style={{ 
          fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question 1
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          Multiple Choice
        </Typography.Text>
      </div>

      {/* Content Area */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        <Typography.Text style={{ 
          fontSize: '15px', 
          fontWeight: 350,
          marginBottom: '12px',
          display: 'block',
          lineHeight: '1.8',
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
        }}>
          {questionText}
        </Typography.Text>

        {/* Options */}
        <div className="question-options" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '14px', 
          marginTop: '12px' 
        }}>
          {(optionsFromApi || ['A','B','C','D'].map((k, i) => ({ key: k, text: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho'][i] }))).map((opt, idx) => {
            const key = opt.key || String.fromCharCode(65 + idx);
            const isSelected = selectedAnswer === key;
            return (
              <div
                key={idx}
                onClick={() => setSelectedAnswer(key)}
                className={`option-item ${isSelected ? 'selected-answer' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: isSelected
                    ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                    : theme === 'sun'
                      ? 'rgba(255, 255, 255, 0.85)'
                      : 'rgba(255, 255, 255, 0.7)',
                  border: `2px solid ${
                    isSelected
                      ? (theme === 'sun' ? 'rgb(24, 144, 255)' : 'rgb(138, 122, 255)')
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
                <input 
                  type="radio" 
                  name="question-1"
                  checked={isSelected}
                  onChange={() => setSelectedAnswer(key)}
                  style={{ 
                    width: '18px',
                    height: '18px',
                    accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                    cursor: 'pointer'
                  }} 
                />
                <span style={{ 
                  flexShrink: 0, 
                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                  fontWeight: '600',
                  fontSize: '16px'
                }}>
                  {key}.
                </span>
                <Typography.Text style={{ 
                  fontSize: '14px',
                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                  fontWeight: '350',
                  flex: 1
                }}>
                  {toPlain(opt.text)}
                </Typography.Text>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Multiple Select Container Component
const MultipleSelectContainer = ({ theme, data }) => {
  const [selectedAnswers, setSelectedAnswers] = React.useState([]);
  const questionText = data?.question || data?.questionText || 'Which of the following are Southeast Asian countries? (Select all that apply)';
  const optionsFromApi = Array.isArray(data?.options) && data.options.length > 0 ? data.options : null;

  const toggleAnswer = (key) => {
    if (selectedAnswers.includes(key)) {
      setSelectedAnswers(selectedAnswers.filter(k => k !== key));
    } else {
      setSelectedAnswers([...selectedAnswers, key]);
    }
  };

  return (
    <div
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
      {/* Header */}
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
        <Typography.Text strong style={{ 
          fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question 2
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          Multiple Select
        </Typography.Text>
      </div>

      {/* Content Area */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        <Typography.Text style={{ 
          fontSize: '15px', 
          fontWeight: 350,
          marginBottom: '12px',
          display: 'block',
          lineHeight: '1.8',
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
        }}>
          {questionText}
        </Typography.Text>

        {/* Options */}
        <div className="question-options" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '14px', 
          marginTop: '12px' 
        }}>
          {(optionsFromApi || ['A','B','C','D'].map((k,i)=>({ key:k, text: ['Vietnam','Thailand','Japan','Malaysia'][i] }))).map((opt, idx) => {
            const key = opt.key || String.fromCharCode(65 + idx);
            const isSelected = selectedAnswers.includes(key);
            return (
              <div
                key={idx}
                onClick={() => toggleAnswer(key)}
                className={`option-item ${isSelected ? 'selected-answer' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: isSelected
                    ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                    : theme === 'sun'
                      ? 'rgba(255, 255, 255, 0.85)'
                      : 'rgba(255, 255, 255, 0.7)',
                  border: `2px solid ${
                    isSelected
                      ? (theme === 'sun' ? 'rgb(24, 144, 255)' : 'rgb(138, 122, 255)')
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
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => toggleAnswer(key)}
                  style={{ 
                    width: '18px',
                    height: '18px',
                    accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                    cursor: 'pointer'
                  }} 
                />
                <span style={{ 
                  flexShrink: 0, 
                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                  fontWeight: '600',
                  fontSize: '16px'
                }}>
                  {key}.
                </span>
          <Typography.Text style={{ 
                  fontSize: '14px',
                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                  fontWeight: '350',
                  flex: 1
                }}>
                  {opt.text}
                </Typography.Text>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// True/False Container Component
const TrueFalseContainer = ({ theme, data }) => {
  const [selectedAnswer, setSelectedAnswer] = React.useState(null);
  const questionText = data?.question || data?.questionText || 'The Earth revolves around the Sun.';

  return (
    <div
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
      {/* Header */}
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
        <Typography.Text strong style={{ 
            fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question 3
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          True/False
        </Typography.Text>
      </div>

      {/* Content Area */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        <Typography.Text style={{ 
          fontSize: '15px', 
            fontWeight: 350,
          marginBottom: '12px',
          display: 'block',
            lineHeight: '1.8',
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
        }}>
          {questionText}
        </Typography.Text>

        {/* Options */}
        <div className="question-options" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '14px', 
          marginTop: '12px' 
        }}>
          {['True', 'False'].map((option) => {
            const isSelected = selectedAnswer === option;
            return (
              <div
                key={option}
                onClick={() => setSelectedAnswer(option)}
                className={`option-item ${isSelected ? 'selected-answer' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: isSelected
                    ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)')
                    : theme === 'sun'
                      ? 'rgba(255, 255, 255, 0.85)'
                      : 'rgba(255, 255, 255, 0.7)',
                  border: `2px solid ${
                    isSelected
                      ? (theme === 'sun' ? 'rgb(24, 144, 255)' : 'rgb(138, 122, 255)')
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
                <input 
                  type="radio" 
                  name="question-3"
                  checked={isSelected}
                  onChange={() => setSelectedAnswer(option)}
                  style={{ 
                    width: '18px',
                    height: '18px',
                    accentColor: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                    cursor: 'pointer'
                  }} 
                />
                <span style={{ 
                  flexShrink: 0, 
                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)', 
                  fontWeight: '600',
                  fontSize: '16px'
                }}>
                  {option === 'True' ? 'A' : 'B'}.
                </span>
                <Typography.Text style={{ 
                  fontSize: '14px',
                  color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
                  fontWeight: '350',
                  flex: 1
                }}>
                  {option}
                </Typography.Text>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Dropdown Container Component
const DropdownContainer = ({ theme, data }) => {
  const [selectedAnswers, setSelectedAnswers] = React.useState({});
  const questionText = data?.questionText || data?.question || 'Choose the correct words to complete the sentence:';
  const contentData = Array.isArray(data?.content?.data) ? data.content.data : [];

  const handleDropdownChange = (positionId, value) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [positionId]: value
    }));
  };

  return (
    <div
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
      {/* Header */}
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
        <Typography.Text strong style={{ 
          fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question 5
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          Dropdown
        </Typography.Text>
      </div>

      {/* Content Area */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        {/* Inline HTML from questionText with [[pos_]] placeholders */}
        <div
          style={{
          fontSize: '15px', 
          fontWeight: 350,
          lineHeight: '1.8',
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
          marginBottom: '16px'
          }}
          dangerouslySetInnerHTML={{ __html: (data?.questionText || '')
            .replace(/\[\[pos_(.*?)\]\]/g, (_m, pid) => {
              const opts = contentData
                .filter(it => String(it.positionId) === String(pid))
                .map(it => it.value)
                .filter(Boolean);
              const optionsHtml = ['<option value="">Select</option>', ...opts.map(v => `<option value="${v}">${v}</option>`)].join('');
              return `<select class="dropdown-select" style="display:inline-block;min-width:120px;height:32px;padding:4px 12px;margin:0 8px;background:${theme === 'sun' ? 'rgba(24, 144, 255, 0.08)' : 'rgba(138, 122, 255, 0.12)'};border:2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'};border-radius:8px;font-size:14px;font-weight:600;color:${theme === 'sun' ? '#1890ff' : '#8B5CF6'};">${optionsHtml}</select>`;
            }) }}
        />

      </div>
      <style>
        {`
          .dropdown-select option {
            text-align: center;
          }
        `}
      </style>
    </div>
  );
};

// Drag and Drop Container Component
const DragDropContainer = ({ theme, data }) => {
  const [droppedItems, setDroppedItems] = React.useState({});
  const [availableItems, setAvailableItems] = React.useState(() => {
    const incorrect = (data?.content?.data || []).filter(it => !it.positionId || it.correct === false).map(it => it.value).filter(Boolean);
    const correct = (data?.content?.data || []).filter(it => it.positionId && it.correct === true).map(it => it.value).filter(Boolean);
    const combined = Array.from(new Set([...incorrect, ...correct]));
    return combined.length ? combined : ['love','like','enjoy','hate'];
  });
  const [dragOverPosition, setDragOverPosition] = React.useState(null);

  const handleDragStart = (e, item, isDropped = false, positionId = null) => {
    e.dataTransfer.setData('text/plain', item);
    e.dataTransfer.setData('isDropped', isDropped);
    e.dataTransfer.setData('positionId', positionId || '');
  };

  const handleDrop = (e, positionId) => {
    e.preventDefault();
    setDragOverPosition(null);
    const item = e.dataTransfer.getData('text/plain');
    const isDropped = e.dataTransfer.getData('isDropped') === 'true';
    const fromPositionId = e.dataTransfer.getData('positionId');
    
    setDroppedItems(prev => {
      const newItems = { ...prev };
      const currentItem = newItems[positionId];
      
      // If dropping from another position
      if (fromPositionId && fromPositionId !== positionId) {
        newItems[positionId] = item;
        if (fromPositionId in newItems) {
          delete newItems[fromPositionId];
        }
        // Return the old item from target position to available list
        if (currentItem) {
          setAvailableItems(prev => [...prev, currentItem]);
        }
        return newItems;
      }
      
      // If dropping from available list
      if (!isDropped) {
        newItems[positionId] = item;
        setAvailableItems(prev => prev.filter(i => i !== item));
      }
      
      return newItems;
    });
  };

  const handleDragStartFromDropped = (e, item, positionId) => {
    handleDragStart(e, item, true, positionId);
    
    // Remove from dropped items immediately
    setDroppedItems(prev => {
      const newItems = { ...prev };
      delete newItems[positionId];
      return newItems;
    });
    
    // Add back to available items
    setAvailableItems(prev => [...prev, item]);
  };

  const handleDragOver = (e, positionId) => {
    e.preventDefault();
    setDragOverPosition(positionId);
  };

  const handleDragLeave = (e) => {
    // Only clear if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverPosition(null);
    }
  };

  return (
    <div
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
      {/* Header */}
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
        <Typography.Text strong style={{ 
          fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question 6
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          Drag and Drop
        </Typography.Text>
      </div>

      {/* Content Area */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        <Typography.Text style={{ 
          fontSize: '15px', 
          fontWeight: 350,
          marginBottom: '12px',
          display: 'block',
          lineHeight: '1.8',
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
        }}>
          Complete the sentence by dragging words into the blanks:
        </Typography.Text>

        {/* Two Column Layout */}
        <div style={{ display: 'flex', gap: '24px', minHeight: '300px' }}>
          {/* Left Column - Question with drop zones */}
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
              I 
              {droppedItems.pos_1 ? (
                <div
                  draggable
                  onDragStart={(e) => handleDragStartFromDropped(e, droppedItems.pos_1, 'pos_1')}
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
                    cursor: 'grab',
                    transition: 'all 0.2s ease',
                    verticalAlign: 'top',
                    lineHeight: '1.4',
                    boxSizing: 'border-box',
                    textAlign: 'center'
                  }}
                >
                  {droppedItems.pos_1}
                </div>
              ) : (
                <div
                  onDrop={(e) => handleDrop(e, 'pos_1')}
                  onDragOver={(e) => handleDragOver(e, 'pos_1')}
                  onDragLeave={handleDragLeave}
                  style={{
                    minWidth: '120px',
                    height: '32px',
                    margin: '0 8px',
                    background: dragOverPosition === 'pos_1' 
                      ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.25)')
                      : '#ffffff',
                    border: `2px ${dragOverPosition === 'pos_1' ? 'solid' : 'dashed'} ${dragOverPosition === 'pos_1' ? (theme === 'sun' ? '#1890ff' : '#8B5CF6') : 'rgba(0, 0, 0, 0.5)'}`,
                    borderRadius: '8px',
                    display: 'inline-block',
                    padding: '4px 12px',
                    fontSize: '15px',
                    fontWeight: '350',
                    color: dragOverPosition === 'pos_1' ? (theme === 'sun' ? '#1890ff' : '#8B5CF6') : 'rgba(0, 0, 0, 0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    verticalAlign: 'top',
                    lineHeight: '1.4',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    transform: dragOverPosition === 'pos_1' ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: dragOverPosition === 'pos_1' 
                      ? (theme === 'sun' ? '0 4px 12px rgba(24, 144, 255, 0.3)' : '0 4px 12px rgba(138, 122, 255, 0.3)')
                      : 'none'
                  }}
                >
                  {dragOverPosition === 'pos_1' ? 'Drop here!' : 'Drop here'}
                </div>
              )}
              programming and 
              {droppedItems.pos_2 ? (
                <div
                  draggable
                  onDragStart={(e) => handleDragStartFromDropped(e, droppedItems.pos_2, 'pos_2')}
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
                    cursor: 'grab',
                    transition: 'all 0.2s ease',
                    verticalAlign: 'top',
                    lineHeight: '1.4',
                    boxSizing: 'border-box',
                    textAlign: 'center'
                  }}
                >
                  {droppedItems.pos_2}
                </div>
              ) : (
                <div
                  onDrop={(e) => handleDrop(e, 'pos_2')}
                  onDragOver={(e) => handleDragOver(e, 'pos_2')}
                  onDragLeave={handleDragLeave}
                  style={{
                    minWidth: '120px',
                    height: '32px',
                    margin: '0 8px',
                    background: dragOverPosition === 'pos_2' 
                      ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.2)' : 'rgba(138, 122, 255, 0.25)')
                      : '#ffffff',
                    border: `2px ${dragOverPosition === 'pos_2' ? 'solid' : 'dashed'} ${dragOverPosition === 'pos_2' ? (theme === 'sun' ? '#1890ff' : '#8B5CF6') : 'rgba(0, 0, 0, 0.5)'}`,
                    borderRadius: '8px',
                    display: 'inline-block',
                    padding: '4px 12px',
                    fontSize: '15px',
                    fontWeight: '350',
                    color: dragOverPosition === 'pos_2' ? (theme === 'sun' ? '#1890ff' : '#8B5CF6') : 'rgba(0, 0, 0, 0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    verticalAlign: 'top',
                    lineHeight: '1.4',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    transform: dragOverPosition === 'pos_2' ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: dragOverPosition === 'pos_2' 
                      ? (theme === 'sun' ? '0 4px 12px rgba(24, 144, 255, 0.3)' : '0 4px 12px rgba(138, 122, 255, 0.3)')
                      : 'none'
                  }}
                >
                  {dragOverPosition === 'pos_2' ? 'Drop here!' : 'Drop here'}
                </div>
              )}
              it very much.
            </div>
          </div>

          {/* Right Column - Available words for dragging */}
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
              Drag these words to complete the sentence:
            </Typography.Text>
            
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '120px'
            }}>
              {availableItems.map((item, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
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
                    cursor: 'grab',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                    minWidth: '80px',
                    textAlign: 'center',
                    boxShadow: theme === 'sun' 
                      ? '0 2px 8px rgba(24, 144, 255, 0.15)' 
                      : '0 2px 8px rgba(138, 122, 255, 0.15)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = theme === 'sun' 
                      ? '0 4px 12px rgba(24, 144, 255, 0.25)' 
                      : '0 4px 12px rgba(138, 122, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = theme === 'sun' 
                      ? '0 2px 8px rgba(24, 144, 255, 0.15)' 
                      : '0 2px 8px rgba(138, 122, 255, 0.15)';
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reorder Container Component
const ReorderContainer = ({ theme, data }) => {
  const [sourceItems, setSourceItems] = React.useState(() => {
    const words = (data?.content?.data || [])
      .sort((a,b)=>(a.positionOrder||0)-(b.positionOrder||0))
      .map(it => it.value)
      .filter(Boolean);
    return words.length ? words : ['I','love','programming','very','much'];
  });
  const [droppedItems, setDroppedItems] = React.useState({});
  const [dragOverIndex, setDragOverIndex] = React.useState(null);
  const [draggedItem, setDraggedItem] = React.useState(null);
  const [isDraggingFromSource, setIsDraggingFromSource] = React.useState(false);
  const [wasDropped, setWasDropped] = React.useState(false);

  const handleDragStartFromSource = (e, item) => {
    setDraggedItem(item);
    setIsDraggingFromSource(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStartFromSlot = (e, index) => {
    const item = droppedItems[index];
    setDraggedItem(item);
    setIsDraggingFromSource(false);
    setWasDropped(false);
    setDragOverIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnSlot = (e, index) => {
    e.preventDefault();
    setWasDropped(true);
    setDragOverIndex(null);
    
    if (draggedItem) {
      const currentItem = droppedItems[index];
      
      // If there's already an item in this slot, return it to source
      if (currentItem) {
        setSourceItems(prev => [...prev, currentItem]);
      }
      
      // If moving from another slot, clear the old slot first
      if (!isDraggingFromSource) {
        const oldIndex = Object.keys(droppedItems).find(i => droppedItems[i] === draggedItem && parseInt(i) !== index);
        if (oldIndex !== undefined) {
          setDroppedItems(prev => {
            const newItems = { ...prev };
            delete newItems[parseInt(oldIndex)];
            return newItems;
          });
        }
      } else {
        // Remove from source if it was from source
        setSourceItems(prev => prev.filter(item => item !== draggedItem));
      }
      
      // Place the new item in the slot
      setDroppedItems(prev => ({
        ...prev,
        [index]: draggedItem
      }));
    }
    
    setDraggedItem(null);
    setIsDraggingFromSource(false);
  };

  const handleDragOverSlot = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeaveSlot = () => {
    setDragOverIndex(null);
  };

  const handleDragEnd = (e) => {
    // If we're dragging from a slot (not from source) and not dropped in a slot or source area,
    // return the item to source
    if (draggedItem && !isDraggingFromSource && !wasDropped) {
      setSourceItems(prev => {
        // Only add if not already in source to avoid duplicates
        if (!prev.includes(draggedItem)) {
          return [...prev, draggedItem];
        }
        return prev;
      });
      
      // Remove from the slot
      const oldIndex = Object.keys(droppedItems).find(i => droppedItems[i] === draggedItem);
      if (oldIndex !== undefined) {
        setDroppedItems(prev => {
          const newItems = { ...prev };
          delete newItems[oldIndex];
          return newItems;
        });
      }
    }
    
    setDraggedItem(null);
    setIsDraggingFromSource(false);
    setDragOverIndex(null);
    setWasDropped(false);
  };

  return (
    <div
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
      {/* Header */}
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
        <Typography.Text strong style={{ 
          fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question 7
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          Reorder
        </Typography.Text>
      </div>

      {/* Content Area */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        <Typography.Text style={{ 
          fontSize: '15px', 
          fontWeight: 350,
          marginBottom: '16px',
          display: 'block',
          lineHeight: '1.8',
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
        }}>
          Rearrange the words by dragging them into the correct order:
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
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                onDrop={(e) => handleDropOnSlot(e, index)}
                onDragOver={(e) => handleDragOverSlot(e, index)}
                onDragLeave={handleDragLeaveSlot}
                onDragEnd={handleDragEnd}
                style={{
                  minWidth: '100px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: droppedItems[index] 
                    ? `1px solid ${theme === 'sun' ? 'rgba(24, 144, 255, 0.3)' : 'rgba(138, 122, 255, 0.3)'}` // Lighter border when item is present
                    : dragOverIndex === index 
                      ? `3px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}` // Solid border when dragging over
                      : `2px dashed rgba(0, 0, 0, 0.5)`, // Dashed border when empty - gray
                  borderRadius: '8px',
                  background: droppedItems[index]
                    ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.1)' : 'rgba(138, 122, 255, 0.1)') // Different background when item is present
                    : dragOverIndex === index
                      ? (theme === 'sun' ? 'rgba(24, 144, 255, 0.15)' : 'rgba(138, 122, 255, 0.15)')
                      : '#ffffff', // White background when empty
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  transform: dragOverIndex === index ? 'scale(1.05)' : 'scale(1)',
                  cursor: 'pointer'
                }}
              >
                {droppedItems[index] ? (
                  <div
                    draggable
                    onDragStart={(e) => handleDragStartFromSlot(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'grab',
                      userSelect: 'none'
                    }}
                  >
                    <span style={{ 
                      fontSize: '14px',
                      fontWeight: '600',
                      color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                      textAlign: 'center'
                    }}>
                      {droppedItems[index]}
                    </span>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'rgba(0, 0, 0, 0.5)'
                    }}>
                      {index + 1}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Source Words */}
        <div
          onDrop={(e) => {
            e.preventDefault();
            setWasDropped(true);
            // If dropping from slot back to source
            if (draggedItem && !isDraggingFromSource) {
              setSourceItems(prev => {
                if (!prev.includes(draggedItem)) {
                  return [...prev, draggedItem];
                }
                return prev;
              });
              // Remove from slot
              const oldIndex = Object.keys(droppedItems).find(i => droppedItems[i] === draggedItem);
              if (oldIndex) {
                setDroppedItems(prev => {
                  const newItems = { ...prev };
                  delete newItems[oldIndex];
                  return newItems;
                });
              }
              setDraggedItem(null);
              setIsDraggingFromSource(false);
              setDragOverIndex(null);
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          style={{
            padding: '20px',
            background: theme === 'sun' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'sun' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.1)'}`,
          }}
        >
          <Typography.Text style={{ 
            fontSize: '14px', 
            fontWeight: 350,
            marginBottom: '16px',
            display: 'block',
            color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
          }}>
            Drag these words to the slots above:
          </Typography.Text>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {sourceItems.map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                draggable
                onDragStart={(e) => handleDragStartFromSource(e, item)}
                onDragEnd={handleDragEnd}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '10px 18px',
                  background: theme === 'sun' 
                    ? 'rgba(24, 144, 255, 0.08)' 
                    : 'rgba(138, 122, 255, 0.12)',
                  border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme === 'sun' ? '#1890ff' : '#8B5CF6',
                  cursor: 'grab',
                  userSelect: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: theme === 'sun' 
                    ? '0 2px 8px rgba(24, 144, 255, 0.15)' 
                    : '0 2px 8px rgba(138, 122, 255, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = theme === 'sun' 
                    ? '0 4px 12px rgba(24, 144, 255, 0.25)' 
                    : '0 4px 12px rgba(138, 122, 255, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = theme === 'sun' 
                    ? '0 2px 8px rgba(24, 144, 255, 0.15)' 
                    : '0 2px 8px rgba(138, 122, 255, 0.15)';
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Rewrite Container Component
const RewriteContainer = ({ theme, data }) => {
  const [answer, setAnswer] = React.useState('');
  const questionText = data?.questionText || data?.question || 'Rewrite the following sentence using different words:';

  return (
    <div
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
      {/* Header */}
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
        <Typography.Text strong style={{ 
          fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question 8
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          Rewrite
        </Typography.Text>
      </div>

      {/* Content Area */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        <Typography.Text style={{ 
          fontSize: '15px', 
          fontWeight: 350,
          marginBottom: '16px',
          display: 'block',
          lineHeight: '1.8',
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)'
        }}>
          {questionText}
        </Typography.Text>

        {/* Original sentence */}
        <div style={{
          marginBottom: '20px',
          fontSize: '15px',
          fontWeight: '350',
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)',
          lineHeight: '1.8'
        }}>
          {(data?.content?.data && data.content.data[0]?.value) || '"I really enjoy programming."'}
        </div>

        {/* Answer textarea */}
        <div style={{ marginTop: '20px' }}>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your rewritten sentence here..."
            rows={4}
            style={{
              width: '100%',
              fontSize: '14px',
              padding: '12px 16px',
              resize: 'vertical',
              border: `2px solid ${theme === 'sun' ? '#1890ff' : '#8B5CF6'}`,
              borderRadius: '8px',
              backgroundColor: theme === 'sun' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.85)',
              color: theme === 'sun' ? '#000000' : '#FFFFFF',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
          />
        </div>
      </div>
    </div>
  );
};


// Fill in the Blank Container Component
const FillBlankContainer = ({ theme, data }) => {
  const questionText = data?.questionText || data?.question || 'Fill in the blanks';
  // Parse questionText and render editable spans where [[pos_x]] appears
  const renderWithInputs = () => {
    const elements = [];
    const regex = /(\[\[pos_(.*?)\]\])/g;
    let lastIndex = 0;
    let match;
    let inputIndex = 0;
    while ((match = regex.exec(questionText)) !== null) {
      if (match.index > lastIndex) {
        elements.push(questionText.slice(lastIndex, match.index));
      }
      inputIndex += 1;
      elements.push(
        <span
          key={`fill_blank_input_${inputIndex}`}
          className="paragraph-input"
          contentEditable
          suppressContentEditableWarning
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
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
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            textAlign: 'center'
          }}
        />
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < questionText.length) {
      elements.push(questionText.slice(lastIndex));
    }
    return elements;
  };

  return (
    <div
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
      {/* Header */}
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
        <Typography.Text strong style={{ 
          fontSize: '16px', 
          color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' 
        }}>
          Question 4
        </Typography.Text>
        <Typography.Text style={{ 
          fontSize: '14px', 
          color: theme === 'sun' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          fontStyle: 'italic'
        }}>
          Fill in the Blank
        </Typography.Text>
      </div>

      {/* Content Area - Fill in the blank question */}
      <div className="question-content" style={{ paddingLeft: '36px', marginTop: '16px' }}>
        {/* Question Content - render blanks for [[pos_]] tokens */}
        <div style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 350, lineHeight: '1.8', color: theme === 'sun' ? 'rgb(15, 23, 42)' : 'rgb(45, 27, 105)' }}>
          {renderWithInputs()}
        </div>
      </div>
    </div>
  );
};


const StudentPreview = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [readingSections, setReadingSections] = useState([]);
  const [challengeType, setChallengeType] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const questionRefs = useRef({});
  
  usePageTitle('Daily Challenge Preview');
  
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!id) return;
    setLoading(true);
      try {
        // get challenge details for type
        const detailRes = await dailyChallengeApi.getDailyChallengeById(id);
        const cType = detailRes?.data?.challengeType || null;
        setChallengeType(cType);

        const response = await dailyChallengeApi.getSectionsByChallenge(id, { page: 0, size: 100 });
        const apiSections = response?.data || [];

        const mapped = [];
        const mappedReading = [];
        apiSections.forEach((item, idx) => {
          const section = item.section || {};
          const questionsList = item.questions || [];

          // If Reading challenge and DOCUMENT resource, prepare a reading section
          if (cType === 'RE' && section.resourceType === 'DOCUMENT') {
            const transformedQuestions = questionsList.map((q, qIndex) => {
              const contentData = q.content?.data || [];
              const options = contentData.map((contentItem, optIdx) => ({
                key: String.fromCharCode(65 + optIdx),
                text: contentItem.value || "",
                isCorrect: contentItem.correct || false,
              }));
              return {
                id: q.id || `${section.id}-${qIndex}`,
                type: q.questionType,
                question: q.questionText || "",
                questionText: q.questionText || "",
                options,
                content: q.content,
                points: q.score || 1,
                orderNumber: q.orderNumber || qIndex + 1,
              };
            });
            mappedReading.push({
              id: section.id || `section_${idx}`,
              type: 'SECTION',
              title: section.sectionTitle || `Reading ${idx + 1}`,
              passage: section.sectionsContent || '',
              questions: transformedQuestions,
              points: transformedQuestions.reduce((s,q)=>s+(q.points||0),0)
            });
            return; // skip flattening these reading questions into single list
          }

          // Otherwise flatten questions into single list
          questionsList.forEach((q, qIndex) => {
            const contentData = q.content?.data || [];
            const options = contentData.map((contentItem, optIdx) => ({
              key: String.fromCharCode(65 + optIdx),
              text: contentItem.value || "",
              isCorrect: contentItem.correct || false,
            }));

            mapped.push({
              id: q.id || `${section.id}-${qIndex}`,
              type: q.questionType,
              question: q.questionText || "",
              questionText: q.questionText || "",
              options,
              content: q.content,
              points: q.score || 1,
              orderNumber: q.orderNumber || qIndex + 1,
            });
          });
        });

        // Sort by orderNumber
        mapped.sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));
        setQuestions(mapped);
        setReadingSections(mappedReading);
      } catch (e) {
        console.error("Preview fetch questions error", e);
      } finally {
      setLoading(false);
      }
    };

    fetchQuestions();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  // Navigate to question
  const scrollToQuestion = (questionId) => {
    const element = questionRefs.current[questionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Build question navigation list (only single questions)
  const getQuestionNavigation = () => {
    const navigation = [];
    let questionNumber = 1;
    // Reading sections
    if (readingSections.length > 0) {
      const total = readingSections.reduce((acc, s) => acc + (s.questions?.length || 0), 0);
      navigation.push({ id: 'reading-1', type: 'section', title: `Reading 1: Question 1-${total}` });
      questionNumber += total;
    }
    // Listening placeholder if any passages were mapped (future)
    // For now, show range based on remaining questions when challengeType is LI
    if (challengeType === 'LI' && questions.length > 0) {
      const start = questionNumber;
      const end = start + questions.length - 1;
      navigation.push({ id: 'listening-1', type: 'section', title: `Listening 1: Question ${start}-${end}` });
      questionNumber = end + 1;
    }
    // Individual questions (GV etc.)
    if (!(challengeType === 'LI' || challengeType === 'SP')) {
      questions.forEach((q) => {
        navigation.push({ id: `q-${q.id}`, type: 'question', title: `Question ${questionNumber++}` });
      });
    }
    return navigation;
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
                fontWeight: '350',
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
              color: theme === 'sun' ? '#1E40AF' : '#1F2937',
              textShadow: theme === 'sun' ? 'none' : '0 0 10px rgba(134, 134, 134, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ 
                fontSize: '24px',
                fontWeight: 350,
                opacity: 0.5
              }}>|</span>
              <span>Daily Challenge Preview - Student View</span>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );

  const questionNav = getQuestionNavigation();

  return (
    <ThemedLayout customHeader={customHeader}>
      <div className={`daily-challenge-content-wrapper ${theme}-daily-challenge-content-wrapper`}>
        {/* Sidebar Toggle Button */}
        <button
          className={`question-sidebar-toggle ${theme}-question-sidebar-toggle ${isSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            position: 'fixed',
            left: isSidebarOpen ? '200px' : '0',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1001,
            background: theme === 'sun' ? 'rgba(113, 179, 253, 0.9)' : 'rgba(138, 122, 255, 0.9)',
            border: 'none',
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px',
            padding: '10px 8px',
            cursor: 'pointer',
            transition: 'left 0.3s ease',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isSidebarOpen ? <CloseOutlined /> : <MenuOutlined />}
        </button>

        {/* Question Sidebar */}
        <div className={`question-sidebar ${theme}-question-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="question-sidebar-header">
            <h3 style={{ fontSize: '20px', fontWeight: 700, textAlign: 'center', color: '#000000' }}>Questions</h3>
          </div>
          <div className="question-sidebar-list">
            {questionNav.map((item) => (
              <div
                key={item.id}
                className={`question-sidebar-item ${item.type === 'section' ? 'question-sidebar-section' : ''}`}
                onClick={() => scrollToQuestion(item.id)}
                style={{ fontWeight: 'normal', textAlign: 'center', color: '#000000' }}
              >
                {item.title}
              </div>
            ))}
          </div>
        </div>

        <div className={`question-content-container ${isSidebarOpen ? 'with-sidebar' : ''}`} style={{ padding: '24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <LoadingWithEffect loading={loading} message="Loading questions...">
              <div className="questions-list">
                {/* Render Reading sections when challenge type is RE */}
                {challengeType === 'RE' && readingSections.length > 0 && (
                  <div ref={el => (questionRefs.current['reading-1'] = el)}>
                    {readingSections.map((section, index) => (
                      <SectionQuestionItem key={section.id} question={section} index={index} theme={theme} />
                    ))}
                </div>
                )}
                {/* Dynamic questions preview (hide complex sections) */}
                {questions.map((q, idx) => (
                  <div key={q.id} ref={el => (questionRefs.current[`q-${q.id}`] = el)}>
                    {q.type === 'MULTIPLE_CHOICE' && (
                      <MultipleChoiceContainer theme={theme} data={q} />
                    )}
                    {q.type === 'MULTIPLE_SELECT' && (
                      <MultipleSelectContainer theme={theme} data={q} />
                    )}
                    {q.type === 'TRUE_OR_FALSE' && (
                      <TrueFalseContainer theme={theme} data={q} />
                    )}
                    {q.type === 'FILL_IN_THE_BLANK' && (
                      <FillBlankContainer theme={theme} data={q} />
                    )}
                    {q.type === 'DROPDOWN' && (
                      <DropdownContainer theme={theme} data={q} />
                    )}
                    {q.type === 'DRAG_AND_DROP' && (
                      <DragDropContainer theme={theme} data={q} />
                    )}
                    {q.type === 'REARRANGE' && (
                      <ReorderContainer theme={theme} data={q} />
                    )}
                    {q.type === 'REWRITE' && (
                      <RewriteContainer theme={theme} data={q} />
                    )}
                </div>
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
