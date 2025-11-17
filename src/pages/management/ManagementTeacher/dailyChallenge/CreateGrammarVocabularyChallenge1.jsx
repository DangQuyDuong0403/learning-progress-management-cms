import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Space,
  Typography,
  message,
  Table,
  Popover,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ThemedLayout from "../../../../component/ThemedLayout";
import "./CreateGrammarVocabularyChallenge1.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Mock data cho chapters và lessons
const mockChapters = [
  {
    id: 1,
    name: "Chapter 1: Basic Grammar",
    lessons: [
      { id: 1, name: "Lesson 1.1: Present Simple Tense" },
      { id: 2, name: "Lesson 1.2: Present Continuous Tense" },
      { id: 3, name: "Lesson 1.3: Past Simple Tense" },
    ],
  },
  {
    id: 2,
    name: "Chapter 2: Advanced Grammar",
    lessons: [
      { id: 4, name: "Lesson 2.1: Present Perfect Tense" },
      { id: 5, name: "Lesson 2.2: Past Perfect Tense" },
      { id: 6, name: "Lesson 2.3: Future Tense" },
    ],
  },
  {
    id: 3,
    name: "Chapter 3: Vocabulary",
    lessons: [
      { id: 7, name: "Lesson 3.1: Business Vocabulary" },
      { id: 8, name: "Lesson 3.2: Academic Vocabulary" },
      { id: 9, name: "Lesson 3.3: Daily Vocabulary" },
    ],
  },
];

const MOCK_CHAPTERS = mockChapters;

const CreateGrammarVocabularyChallenge = () => {
  const navigate = useNavigate();
  const scriptTextAreaRef = useRef(null);
  
  const [challengeName, setChallengeName]        = useState("");
  const [selectedChapter, setSelectedChapter]   = useState(null);
  const [selectedLesson, setSelectedLesson]     = useState(null);
  const [availableLessons, setAvailableLessons] = useState([]);
  const [script, setScript]                     = useState("");
  const [parsedContent, setParsedContent]       = useState({
    parts: [],
    currentPart: null,
    currentQuestion: null
  });
  const [showQuickSelect, setShowQuickSelect]   = useState(false);
  const [quickSelectOptions, setQuickSelectOptions] = useState([]);
  const [selectedQuickOption, setSelectedQuickOption] = useState(0);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (selectedChapter) {
      const chapter = MOCK_CHAPTERS.find(ch => ch.id === selectedChapter);
      if (chapter) {
        setAvailableLessons(chapter.lessons);
        setSelectedLesson(null);
      }
    } else {
      setAvailableLessons([]);
      setSelectedLesson(null);
    }
  }, [selectedChapter]);

  // Script parsing logic - memoized to prevent re-renders
  const parseScript = useCallback((scriptText) => {
    if (!scriptText.trim()) {
      return { parts: [], currentPart: null, currentQuestion: null };
    }

    const lines = scriptText.split('\n');
    const parts = [];
    let currentPart = null;
    let currentQuestion = null;
    let questionCounter = 0; // Counter để đánh số câu hỏi
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Phần mới
      if (line.startsWith('Phần ')) {
        if (currentPart) {
          parts.push(currentPart);
        }
        currentPart = {
          id: `part_${i}`,
          title: line,
          questions: []
        };
        currentQuestion = null;
        questionCounter = 0; // Reset counter cho phần mới
      }
      // Câu hỏi mới
      else if (line.startsWith('Câu ')) {
        questionCounter++; // Tăng counter mỗi khi gặp "Câu"
        
        if (!currentPart) {
          // Không tự động tạo phần, chỉ tạo câu hỏi độc lập
          currentQuestion = {
            id: `question_${i}`,
            title: `Câu ${questionCounter}:`, // Sử dụng counter thay vì line gốc
            originalTitle: line, // Lưu lại title gốc để tham khảo
            content: '',
            type: 'multiple-choice',
            options: [],
            correctAnswer: '',
            explanation: '',
            isStandalone: true
          };
          // Tạo một phần tạm thời để chứa câu hỏi độc lập
          currentPart = {
            id: `standalone_${i}`,
            title: '',
            questions: [currentQuestion],
            isStandalone: true
          };
        } else {
          currentQuestion = {
            id: `question_${i}`,
            title: `Câu ${questionCounter}:`, // Sử dụng counter thay vì line gốc
            originalTitle: line, // Lưu lại title gốc để tham khảo
            content: '',
            type: 'multiple-choice',
            options: [],
            correctAnswer: '',
            explanation: ''
          };
          currentPart.questions.push(currentQuestion);
        }
      }
      // Đáp án đúng
      else if (line.startsWith('Đáp án:')) {
        if (currentQuestion) {
          currentQuestion.correctAnswer = line.replace('Đáp án:', '').trim();
        }
      }
      // Lựa chọn A, B, C, D
      else if (/^\*?[A-D]\./.test(line)) {
        if (currentQuestion) {
          const isCorrect = line.startsWith('*');
          const optionText = line.replace(/^\*?[A-D]\.\s*/, '').trim();
          const label = isCorrect ? line.charAt(1) : line.charAt(0); // Bỏ qua dấu * nếu có
          currentQuestion.options.push({
            id: `option_${i}`,
            label: label,
            text: optionText,
            isCorrect: isCorrect
          });
        }
      }
      // Hướng dẫn
      else if (line.startsWith('Hướng dẫn:')) {
        if (currentQuestion) {
          currentQuestion.explanation = line.replace('Hướng dẫn:', '').trim();
        }
      }
      // Bảng
      else if (line.includes('[*') && line.includes('*]')) {
        if (currentQuestion) {
          currentQuestion.hasTable = true;
          currentQuestion.tableContent = line;
        }
      }
      // Nội dung câu hỏi
      else if (line && currentQuestion && !line.startsWith('@')) {
        if (currentQuestion.content) {
          currentQuestion.content += '\n' + line;
        } else {
          currentQuestion.content = line;
        }
      }
    }
    
    if (currentPart) {
      parts.push(currentPart);
    }
    
    return { parts, currentPart, currentQuestion };
  }, []);

  // Generate smart autocomplete suggestions based on current content
  const generateAutocompleteSuggestions = useCallback((script, currentPos, currentWord) => {
    const suggestions = [];
    
    // Get current line and surrounding context
    const lines = script.split('\n');
    const currentLineIndex = script.substring(0, currentPos).split('\n').length - 1;
    
    // Count existing questions to suggest next question number
    const questionCount = (script.match(/Câu \d+:/g) || []).length;
    const nextQuestionNumber = questionCount + 1;
    
    // Check if current word starts with 'c' (for "Câu")
    // But only if we're not in the middle of an option line
    if (currentWord.toLowerCase().startsWith('c')) {
      const currentLine = lines[currentLineIndex] || '';
      
      // Don't suggest "Câu" if we're in the middle of an option line like "C."
      if (!/^[A-D]\./.test(currentLine.trim())) {
        suggestions.push(`Câu ${nextQuestionNumber}:`);
        if (nextQuestionNumber > 1) {
          // Also suggest previous question pattern for reference
          suggestions.push(`Câu ${nextQuestionNumber - 1}:`);
        }
      }
    }
    
    // Check if current word starts with 'p' (for "Phần")
    if (currentWord.toLowerCase().startsWith('p')) {
      const partCount = (script.match(/Phần \d+:/g) || []).length;
      const nextPartNumber = partCount + 1;
      suggestions.push(`Phần ${nextPartNumber}:`);
      if (nextPartNumber > 1) {
        suggestions.push(`Phần ${nextPartNumber - 1}:`);
      }
    }
    
    // Check if current word starts with 'đ' (for "Đáp án")
    if (currentWord.toLowerCase().startsWith('đ')) {
      suggestions.push('Đáp án:');
    }
    
    // Check if current word starts with 'h' (for "Hướng dẫn")
    if (currentWord.toLowerCase().startsWith('h')) {
      suggestions.push('Hướng dẫn:');
    }
    
    // Check if current word starts with 'a', 'b', 'c', 'd' for options
    // But only suggest if not already in a complete option sequence
    if (/^[a-d]$/i.test(currentWord)) {
      const currentLine = lines[currentLineIndex] || '';
      
      // Don't suggest options if we're already in the middle of an option line
      if (!/^[A-D]\./.test(currentLine.trim())) {
        // Check if we're already in a question with complete options
        let isInCompleteQuestion = false;
        
        // Look backwards to find the question start
        let questionStartIndex = -1;
        for (let i = currentLineIndex; i >= 0; i--) {
          if (lines[i].trim().startsWith('Câu ')) {
            questionStartIndex = i;
            break;
          }
        }
        
        if (questionStartIndex !== -1) {
          // Check if we have A, B, C, D in sequence after this question
          const optionsFound = new Set();
          for (let i = questionStartIndex + 1; i <= currentLineIndex; i++) {
            const line = lines[i].trim();
            if (/^[A-D]\.$/.test(line)) {
              optionsFound.add(line.charAt(0));
            }
          }
          
          // If we have all 4 options, don't suggest more
          isInCompleteQuestion = optionsFound.size >= 4;
        }
        
        if (!isInCompleteQuestion) {
          suggestions.push(`${currentWord.toUpperCase()}. `);
          // Also suggest other options
          const allOptions = ['A', 'B', 'C', 'D'];
          allOptions.forEach(option => {
            if (option !== currentWord.toUpperCase()) {
              suggestions.push(`${option}. `);
            }
          });
        }
      }
    }
    
    // Check for table syntax
    if (currentWord.toLowerCase().startsWith('[')) {
      suggestions.push('[* | *]');
      suggestions.push('[* | * | *]');
    }
    
    return suggestions;
  }, []);


  // Handle script change with debouncing to prevent excessive re-renders
  const handleScriptChange = useCallback((e) => {
    const newScript = e.target.value;
    setScript(newScript);
    
    // Calculate cursor position for autocomplete
    const input = e.target;
    const cursorPos = input.selectionStart;
    const textBeforeCursor = newScript.substring(0, cursorPos);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1] || '';
    
    // Generate suggestions
    const suggestions = generateAutocompleteSuggestions(newScript, cursorPos, currentWord);
    
    if (suggestions.length > 0 && currentWord.length > 0) {
      setQuickSelectOptions(suggestions);
      setShowQuickSelect(true);
      setSelectedQuickOption(0);
      
      // Calculate position for autocomplete dropdown relative to textarea container
      const textareaRect = input.getBoundingClientRect();
      const container = input.closest('.script-editor-container');
      
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines[lines.length - 1];
        
        // Calculate position relative to the script editor container
        setAutocompletePosition({
          top: textareaRect.top - containerRect.top + 25 + (lines.length * 20), // Relative to container
          left: textareaRect.left - containerRect.left + (currentLine.length * 8) // Relative to container
        });
      } else {
        // Fallback to simple positioning if container not found
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines[lines.length - 1];
        
        setAutocompletePosition({
          top: 25 + (lines.length * 20), // Simple relative positioning
          left: (currentLine.length * 8) // Simple relative positioning
        });
      }
    } else {
      setShowQuickSelect(false);
    }
  }, [generateAutocompleteSuggestions]);

  // Debounced parsing effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const parsed = parseScript(script);
      setParsedContent(parsed);
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [script, parseScript]);

  const insertQuickSelectOption = useCallback((option) => {
    const textarea = scriptTextAreaRef.current;
    if (textarea && textarea.resizableTextArea) {
      const input = textarea.resizableTextArea.textArea;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      
      // Replace current word with the selected option
      const textBeforeCursor = script.substring(0, start);
      const words = textBeforeCursor.split(/\s+/);
      const currentWordLength = words[words.length - 1]?.length || 0;
      const wordStart = start - currentWordLength;
      
      const newScript = script.substring(0, wordStart) + option + script.substring(end);
      setScript(newScript);
      setShowQuickSelect(false);
      
      // Focus back to textarea and position cursor
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(wordStart + option.length, wordStart + option.length);
      }, 0);
    }
  }, [script]);

  // Smart Enter logic for auto-adding options
  const handleSmartEnter = useCallback((e) => {
    const textarea = e.target;
    const cursorPos = textarea.selectionStart;
    const lines = script.split('\n');
    const currentLineIndex = script.substring(0, cursorPos).split('\n').length - 1;
    const currentLine = lines[currentLineIndex] || '';
    
    // Check if we're in an autocomplete dropdown
    if (showQuickSelect) {
      e.preventDefault();
      if (quickSelectOptions[selectedQuickOption]) {
        insertQuickSelectOption(quickSelectOptions[selectedQuickOption]);
      }
      return;
    }
    
    // Check if current line is a question title
    if (currentLine.trim().startsWith('Câu ')) {
      e.preventDefault();
      const newScript = script.substring(0, cursorPos) + '\nA.';
      setScript(newScript);
      
      // Set cursor after A.
      setTimeout(() => {
        const newCursorPos = cursorPos + 3; // "A.\n" = 3 characters
        if (textarea.resizableTextArea) {
          const input = textarea.resizableTextArea.textArea;
          input.focus();
          input.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
      return;
    }
    
    // Check if current line is an option (A., B., C., D.)
    const optionMatch = currentLine.trim().match(/^([A-D])\.$/);
    if (optionMatch) {
      e.preventDefault();
      const currentOption = optionMatch[1];
      const nextOption = String.fromCharCode(currentOption.charCodeAt(0) + 1);
      
      if (nextOption <= 'D') {
        // Add next option
        const newScript = script.substring(0, cursorPos) + '\n' + nextOption + '.';
        setScript(newScript);
        
        // Set cursor after the new option
        setTimeout(() => {
          const newCursorPos = cursorPos + 2 + nextOption.length; // "\nX." = 3 characters
          if (textarea.resizableTextArea) {
            const input = textarea.resizableTextArea.textArea;
            input.focus();
            input.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      } else {
        // After D, add next question
        const questionCount = (script.match(/Câu \d+:/g) || []).length;
        const nextQuestionNumber = questionCount + 1;
        const newScript = script.substring(0, cursorPos) + '\n\nCâu ' + nextQuestionNumber + ':\nA.';
        setScript(newScript);
        
        // Set cursor after A. of the new question
        setTimeout(() => {
          const newCursorPos = cursorPos + 2 + 'Câu '.length + nextQuestionNumber.toString().length + 2 + 2; // "\n\nCâu X:\nA." 
          if (textarea.resizableTextArea) {
            const input = textarea.resizableTextArea.textArea;
            input.focus();
            input.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      }
      return;
    }
    
    // Default behavior for other cases - allow normal Enter
  }, [script, showQuickSelect, quickSelectOptions, selectedQuickOption, insertQuickSelectOption]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (showQuickSelect) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedQuickOption(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedQuickOption(prev => Math.min(quickSelectOptions.length - 1, prev + 1));
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (quickSelectOptions[selectedQuickOption]) {
            insertQuickSelectOption(quickSelectOptions[selectedQuickOption]);
          }
          break;
        case 'Escape':
          setShowQuickSelect(false);
          break;
        default:
          break;
      }
    } else if (e.key === 'Enter') {
      handleSmartEnter(e);
    } else if (e.key === '@') {
      setShowQuickSelect(true);
      setQuickSelectOptions([
        'Multiple choice',
        'Fill in the blank',
        'True/False',
        'Table',
        'Explanation'
      ]);
      setSelectedQuickOption(0);
    }
  }, [showQuickSelect, quickSelectOptions, selectedQuickOption, insertQuickSelectOption, handleSmartEnter]);

  // Handle cursor position changes for autocomplete
  const handleCursorMove = useCallback((e) => {
    const input = e.target;
    const cursorPos = input.selectionStart;
    const textBeforeCursor = script.substring(0, cursorPos);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1] || '';
    
    // Generate suggestions
    const suggestions = generateAutocompleteSuggestions(script, cursorPos, currentWord);
    
    if (suggestions.length > 0 && currentWord.length > 0) {
      setQuickSelectOptions(suggestions);
      setShowQuickSelect(true);
      setSelectedQuickOption(0);
      
      // Calculate position for autocomplete dropdown relative to textarea container
      const textareaRect = input.getBoundingClientRect();
      const container = input.closest('.script-editor-container');
      
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines[lines.length - 1];
        
        // Calculate position relative to the script editor container
        setAutocompletePosition({
          top: textareaRect.top - containerRect.top + 25 + (lines.length * 20), // Relative to container
          left: textareaRect.left - containerRect.left + (currentLine.length * 8) // Relative to container
        });
      } else {
        // Fallback to simple positioning if container not found
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines[lines.length - 1];
        
        setAutocompletePosition({
          top: 25 + (lines.length * 20), // Simple relative positioning
          left: (currentLine.length * 8) // Simple relative positioning
        });
      }
    } else {
      setShowQuickSelect(false);
    }
  }, [script, generateAutocompleteSuggestions]);

  // Handle option click to mark as correct answer
  const handleOptionClick = useCallback((optionLabel, questionId) => {
    const lines = script.split('\n');
    let questionCounter = 0;
    let targetQuestionCounter = -1;
    let questionStartIndex = -1;
    
    // First, find which question number this questionId corresponds to
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('Câu ')) {
        questionCounter++;
        if (`question_${i}` === questionId) {
          targetQuestionCounter = questionCounter;
          questionStartIndex = i;
          break;
        }
      }
    }
    
    if (targetQuestionCounter === -1) return;
    
    // Find all option lines for this question and remove existing * markers
    const newLines = [...lines];
    let foundTargetOption = false;
    
    for (let i = questionStartIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Stop if we hit another question or section
      if (line.startsWith('Câu ') || line.startsWith('Phần ') || line.startsWith('Đáp án:') || line.startsWith('Hướng dẫn:')) {
        break;
      }
      
      // Check if this is an option line
      if (/^\*?[A-D]\./.test(line)) {
        const optionChar = line.replace(/^\*/, '').charAt(0);
        
        // Remove * from all options first
        if (line.startsWith('*')) {
          newLines[i] = line.substring(1);
        }
        
        // Add * to the clicked option
        if (optionChar === optionLabel) {
          newLines[i] = `*${optionLabel}.`;
          foundTargetOption = true;
        }
      }
    }
    
    // If target option wasn't found, add it
    if (!foundTargetOption) {
      // Find the position after the question title to insert the option
      let insertIndex = questionStartIndex + 1;
      
      // Skip any content lines until we find options or end of question
      while (insertIndex < lines.length) {
        const line = lines[insertIndex].trim();
        if (line.startsWith('Câu ') || line.startsWith('Phần ') || line.startsWith('Đáp án:') || line.startsWith('Hướng dẫn:') || /^\*?[A-D]\./.test(line)) {
          break;
        }
        insertIndex++;
      }
      
      newLines.splice(insertIndex, 0, `*${optionLabel}.`);
    }
    
    setScript(newLines.join('\n'));
  }, [script]);

  const handleBack = () => {
    navigate("/teacher/daily-challenges");
  };

  const handleSave = () => {
    if (!challengeName || !selectedChapter || !selectedLesson) {
      message.error("Please fill in all required fields");
      return;
    }
    message.success("Challenge saved successfully!");
  };

  const handlePreview = () => {
    if (!challengeName || !selectedChapter || !selectedLesson) {
      message.error("Please fill in all required fields before preview");
      return;
    }
    message.info("Preview functionality coming soon!");
  };

  // Help content for popover
  const helpContent = (
    <div style={{ maxWidth: '350px', color: '#000' }}>
      <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#000' }}>
        Hướng dẫn sử dụng:
      </div>
      <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#000' }}>
      Gõ Phần ?: để bắt đầu một phần mới<br/>
Gõ Câu ?: để bắt đầu một câu hỏi mới<br/>
Gõ Đáp án: để tạo đáp án đúng cho câu hỏi trắc nghiệm điền khuyết<br/>
Gõ A., B., C., D., để tạo một câu trả lời mới. Thêm dấu * phía trước để chọn đáp án đúng<br/>
Gõ Hướng dẫn: để bắt đầu nhập lời giải<br/>
Gõ [* | *] để tạo bảng<br/>
Gõ Tab hoặc Enter và các phím mũi tên ↑↓→← để chọn từ bảng chọn nhanh<br/>
Gõ @ để chọn đề từ học liệu<br/>
      </div>
    </div>
  );

  // Memoized preview content to prevent unnecessary re-renders
  const previewContent = useMemo(() => {
    if (parsedContent.parts.length === 0) {
      return (
        <div className="gvc-preview-placeholder">
          <Text type="secondary">
            Start typing your script to see the preview here...
          </Text>
        </div>
      );
    }

    return (
      <div className="gvc-preview-content">
        {parsedContent.parts.map((part, partIndex) => (
          <div key={part.id} className="part-container">
            {!part.isStandalone && part.title && (
              <Title level={3} className="part-title">{part.title}</Title>
            )}
            {part.questions.map((question, questionIndex) => (
              <div key={question.id} className="question-container">
                <div className="gvc-question-header">
                  <Text strong className="question-title">{question.title}</Text>
                </div>
                
                {question.content && (
                  <div className="gvc-question-content">
                    <Text>{question.content}</Text>
                  </div>
                )}

                {question.hasTable && (
                  <div className="table-container">
                    <Table
                      size="small"
                      pagination={false}
                      dataSource={[
                        { key: '1', col1: 'Sample', col2: 'Data' }
                      ]}
                      columns={[
                        { title: 'Column 1', dataIndex: 'col1', key: 'col1' },
                        { title: 'Column 2', dataIndex: 'col2', key: 'col2' }
                      ]}
                    />
                  </div>
                )}

                {question.options.length > 0 && (
                  <div className="options-container">
                    {question.options.map((option, optionIndex) => (
                      <div 
                        key={option.id} 
                        className={`gvc-option-item ${option.isCorrect ? 'correct-option' : ''} clickable-option`}
                        onClick={() => handleOptionClick(option.label, question.id)}
                        style={{ cursor: 'pointer' }}
                        title={option.isCorrect ? `Đáp án ${option.label} đã được chọn` : `Click để chọn đáp án ${option.label}`}
                      >
                        <span className="gvc-option-label">{option.label}.</span>
                        <span className="gvc-option-text">{option.text}</span>
                        {option.isCorrect && <span className="correct-indicator">✓</span>}
                      </div>
                    ))}
                  </div>
                )}

                {question.correctAnswer && (
                  <div className="correct-answer">
                    <Text strong>Đáp án: {question.correctAnswer}</Text>
                  </div>
                )}

                {question.explanation && (
                  <div className="explanation">
                    <Text type="secondary">
                      <strong>Hướng dẫn:</strong> {question.explanation}
                    </Text>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }, [parsedContent, handleOptionClick]);

  return (
    <ThemedLayout>
      <div className="gvc-create-challenge-container">
        {/* Header */}
        <Card className="gvc-header-card">
          <Row justify="space-between">
            <Col>
              <Space align="center">
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={handleBack}
                  type="text"
                />
                <Title level={2} style={{ margin: 0, color: "#7228d9" }}>
                  Create Grammar & Vocabulary Challenge
                </Title>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button icon={<EyeOutlined />} onClick={handlePreview}>
                  Preview
                </Button>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={handleSave}
                >
                  Save Challenge
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Configuration Section */}
        <Card className="gvc-config-card">
          <Row gutter={24} align="middle">
            <Col span={8}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>Challenge Name:</Text>
                <Input
                  placeholder="Enter challenge name"
                  value={challengeName}
                  onChange={(e) => setChallengeName(e.target.value)}
                  size="large"
                />
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>Chapter:</Text>
                <Select
                  placeholder="Select chapter"
                  value={selectedChapter}
                  onChange={setSelectedChapter}
                  style={{ width: "100%" }}
                  size="large"
                 >
                   {MOCK_CHAPTERS.map((chapter) => (
                     <Option key={chapter.id} value={chapter.id}>
                       {chapter.name}
                     </Option>
                   ))}
                 </Select>
              </Space>
            </Col>
            <Col span={8}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>Lesson:</Text>
                <Select
                  placeholder="Select lesson"
                  value={selectedLesson}
                  onChange={setSelectedLesson}
                  style={{ width: "100%" }}
                  size="large"
                  disabled={!selectedChapter}
                >
                  {availableLessons.map((lesson) => (
                    <Option key={lesson.id} value={lesson.id}>
                      {lesson.name}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Main Content */}
        <div className="gvc-main-content-container">
          <Row gutter={24} style={{ height: "calc(100vh - 300px)" }}>
            {/* Preview Panel (Left) */}
              <Col span={12}>
              <Card 
                title="Preview" 
                className="gvc-preview-card"
                style={{ height: "100%" }}
                >
                <div className="preview-container">
                  {previewContent}
                </div>
              </Card>
            </Col>

              {/* Script Editor Panel (Right) */}
              <Col span={12}>
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Script Editor</span>
                      <Popover 
                        content={helpContent} 
                        title={null}
                        trigger="hover"
                        placement="bottomLeft"
                      >
                        <QuestionCircleOutlined 
                          style={{ 
                            color: '#ff6b35', 
                            cursor: 'pointer',
                            fontSize: '16px'
                          }} 
                        />
                      </Popover>
                    </div>
                  }
                  className="script-editor-card"
                  style={{ height: "calc(100vh - 300px)", minHeight: 500 }}
                >
                  <div className="script-editor-container" style={{ height: '100%' }}>
                    <div className="script-textarea-container" style={{ height: '100%' }}>
                      <TextArea
                        ref={scriptTextAreaRef}
                        value={script}
                        onChange={handleScriptChange}
                        onKeyDown={handleKeyDown}
                        onSelect={handleCursorMove}
                        onMouseUp={handleCursorMove}
                        placeholder="Nhập script của bạn ở đây..."
                        style={{ 
                          height: 'calc(100vh - 370px)', // Make textarea fill the card
                          minHeight: 475,
                          resize: 'none',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          overflow: 'auto'
                        }}
                        className="script-textarea"
                      />
                    </div>

                    {/* Smart Autocomplete Dropdown */}
                    {showQuickSelect && (
                      <div 
                        className="smart-autocomplete-dropdown"
                        style={{
                          position: 'absolute',
                          top: autocompletePosition.top,
                          left: autocompletePosition.left,
                          zIndex: 1000
                        }}
                      >
                        {quickSelectOptions.map((option, index) => (
                          <div 
                            key={index}
                            className={`autocomplete-option ${index === selectedQuickOption ? 'selected' : ''}`}
                            onClick={() => insertQuickSelectOption(option)}
                          >
                            <span className="autocomplete-icon">⚡</span>
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>
        </div>
      </div>
    </ThemedLayout>
  );
};

export default CreateGrammarVocabularyChallenge;
