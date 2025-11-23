import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Modal, Button, InputNumber, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { spaceToast } from '../../../../../component/SpaceToastify';
import {
	CheckOutlined,
	ThunderboltOutlined,
	SaveOutlined,
} from '@ant-design/icons';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import './MultipleChoiceModal.css';

const TrueFalseModal = ({ visible, onCancel, onSave, questionData = null, saving = false }) => {
	const { t } = useTranslation();
	
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
	
	const [correctAnswer, setCorrectAnswer] = useState(
		questionData?.correctAnswer || null
	);
    const [weight, setWeight] = useState(1);
    const [editorData, setEditorData] = useState('');
    const editorRef = useRef(null);
    const editorDataRef = useRef('');
    const hasLoadedDataRef = useRef(false);

	// Helper to strip HTML and normalize text for comparison
	const stripHtml = useCallback((html) => {
		if (!html) return '';
		const tmp = document.createElement('div');
		tmp.innerHTML = html;
		return (tmp.textContent || tmp.innerText || '').trim();
	}, []);

	// Allow image-only content detection for question
	const containsImage = useCallback((html) => {
		if (!html) return false;
		return /<img\b/i.test(html);
	}, []);

	const hasContent = useCallback((html) => {
		return !!stripHtml(html) || containsImage(html);
	}, [stripHtml, containsImage]);

	// Sun theme colors (fixed)
	const primaryColor = '#1890ff';

	// Memoize CKEditor config to prevent re-creation on each render
	const questionEditorConfig = useMemo(() => ({
		placeholder: t('dailyChallenge.enterYourQuestionHere', 'Enter your question here...'),
		extraPlugins: [CustomUploadAdapterPlugin],
		toolbar: {
			items: [
				'heading',
				'|',
				'bold',
				'italic',
				'underline',
				'|',
				'insertTable',
				'imageUpload',
				'|',
				'bulletedList',
				'numberedList',
				'|',
				'link',
				'|',
				'undo',
				'redo'
			],
			shouldNotGroupWhenFull: false
		},
		heading: {
			options: [
				{ model: 'paragraph', title: t('dailyChallenge.paragraph', 'Paragraph'), class: 'ck-heading_paragraph' },
				{ model: 'heading1', view: 'h1', title: t('dailyChallenge.heading1', 'Heading 1'), class: 'ck-heading_heading1' },
				{ model: 'heading2', view: 'h2', title: t('dailyChallenge.heading2', 'Heading 2'), class: 'ck-heading_heading2' },
				{ model: 'heading3', view: 'h3', title: t('dailyChallenge.heading3', 'Heading 3'), class: 'ck-heading_heading3' }
			]
		},
		table: {
			contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
		},
		image: {
			toolbar: [
				'imageTextAlternative',
				'|',
				'imageStyle:alignLeft',
				'imageStyle:full',
				'imageStyle:alignRight'
			],
			styles: [
				'full',
				'alignLeft',
				'alignRight'
			]
		}
	}), [t]);

	// Load question data when editing
	useEffect(() => {
    if (visible) {
			// Reset flag when modal opens
			hasLoadedDataRef.current = false;
			setTimeout(() => {
				if (questionData) {
					// Edit mode - load existing data
					console.log('TrueFalseModal - Loading question data:', questionData);
                    // Read from question or questionText field
                    const q = questionData.question || questionData.questionText || '';
                    console.log('TrueFalseModal - Question text:', q, 'Length:', q.length);
                    setEditorData(q);
                    editorDataRef.current = q;
					hasLoadedDataRef.current = true;
					// Set data into editor if editor is already ready
					if (editorRef.current) {
						try {
							editorRef.current.setData(q);
							console.log('TrueFalseModal - Set data to editor directly (editor already ready)');
						} catch (e) {
							console.error('TrueFalseModal - Error setting data to editor:', e);
						}
					}
					// Determine correct answer from various possible shapes
					let derivedAnswer = null;
					const correctAnswerValue = questionData.correctAnswer;
					console.log('TrueFalseModal - correctAnswer value:', correctAnswerValue, 'type:', typeof correctAnswerValue);
					if (correctAnswerValue === true || correctAnswerValue === 'True') {
						derivedAnswer = 'True';
					} else if (correctAnswerValue === false || correctAnswerValue === 'False') {
						derivedAnswer = 'False';
					}

					// Fallback: infer from options array (mapped from BE)
					if (!derivedAnswer && Array.isArray(questionData.options)) {
						const correctOpt = questionData.options.find(o => o.isCorrect);
						if (correctOpt) {
							const text = stripHtml(correctOpt.text).toLowerCase();
							if (text === 'true') derivedAnswer = 'True';
							else if (text === 'false') derivedAnswer = 'False';
						}
					}

					// Fallback: infer from content.data if present
					if (!derivedAnswer && questionData.content && Array.isArray(questionData.content.data)) {
						const correctItem = questionData.content.data.find(d => d.correct === true);
						if (correctItem) {
							const text = stripHtml(correctItem.value).toLowerCase();
							if (text === 'true') derivedAnswer = 'True';
							else if (text === 'false') derivedAnswer = 'False';
						}
					}

					setCorrectAnswer(derivedAnswer);
					console.log('TrueFalseModal - Derived correctAnswer:', derivedAnswer);
                    setWeight((questionData && (questionData.weight ?? questionData.points)) || 1);
				} else {
					// Add mode - reset to defaults
                    setEditorData('');
                    editorDataRef.current = '';
					hasLoadedDataRef.current = false;
					setCorrectAnswer(null);
                    setWeight(1);
				}
			}, 0);
		} else {
			// Modal closed, reset flag
			hasLoadedDataRef.current = false;
		}
	}, [questionData, visible, stripHtml]);

	// Sync editorData to editor when editor becomes ready and we have data to load
	// This only runs once when modal opens and editor is ready
	useEffect(() => {
		if (visible && editorRef.current && hasLoadedDataRef.current && editorDataRef.current) {
			// Small delay to ensure editor is fully ready
			const timeoutId = setTimeout(() => {
				if (editorRef.current && hasLoadedDataRef.current && editorDataRef.current) {
					try {
						const dataToSet = editorDataRef.current;
						editorRef.current.setData(dataToSet);
						console.log('TrueFalseModal - Synced editorData to editor (editor ready, data loaded)');
						// Mark as loaded so we don't keep setting
						hasLoadedDataRef.current = false;
					} catch (e) {
						console.error('TrueFalseModal - Error syncing data to editor:', e);
					}
				}
			}, 200);
			
			return () => clearTimeout(timeoutId);
		}
	}, [visible]); // Only depend on visible, not editorData to avoid re-setting when user types

	// Debounced editor change handler for main question
	const editorChangeTimeoutRef = useRef(null);
    const handleEditorChange = useCallback((event, editor) => {
		if (editorChangeTimeoutRef.current) {
			clearTimeout(editorChangeTimeoutRef.current);
		}
		editorChangeTimeoutRef.current = setTimeout(() => {
			const data = editor.getData();
			const plainText = stripHtml(data);
			setEditorData(prevData => {
				// Enforce max length of 600 characters (based on plain text)
				if (plainText.length > 600) {
					spaceToast.warning('Maximum 600 characters allowed for the question');
					if (editor) {
						editor.setData(prevData || '');
					}
					return prevData;
				}
				// Only update if data actually changed
				if (prevData !== data) {
                    editorDataRef.current = data;
                    return data;
				}
				return prevData;
			});
		}, 150);
	}, [stripHtml]);

	// Cleanup timeouts on unmount
	useEffect(() => {
		const editorTimeout = editorChangeTimeoutRef.current;
		return () => {
			if (editorTimeout) {
				clearTimeout(editorTimeout);
			}
		};
	}, []);

	// Clear data when modal closes (visible changes from true to false)
	useEffect(() => {
		if (!visible) {
			// Modal is closed, clear all data
			setEditorData('');
			editorDataRef.current = '';
			hasLoadedDataRef.current = false;
			setCorrectAnswer(null);
        setWeight(1);
			// Clear editor content if editor instance exists
			if (editorRef.current) {
				try {
					editorRef.current.setData('');
				} catch (e) {
					// Editor might not be ready, ignore error
				}
			}
		}
	}, [visible]);

const handleSave = async () => {
		// Validate question content: allow text or image-only
		if (!hasContent(editorData)) {
			spaceToast.warning(t('dailyChallenge.pleaseAddQuestionContent', 'Please add question content (text or image)'));
			return;
		}

		if (!correctAnswer) {
			spaceToast.warning(t('dailyChallenge.pleaseSelectCorrectAnswer', 'Please select the correct answer (True or False)'));
			return;
		}

		const newQuestionData = {
			id: questionData?.id || Date.now(),
			type: 'TRUE_OR_FALSE',
			title: t('dailyChallenge.trueFalse', 'True or false'),
			question: editorData,
            weight: weight,
			options: [
				{ id: 1, text: t('dailyChallenge.true', 'True'), isCorrect: correctAnswer === 'True', key: 'A' },
				{ id: 2, text: t('dailyChallenge.false', 'False'), isCorrect: correctAnswer === 'False', key: 'B' },
			],
			correctAnswer: correctAnswer,
		};

		// Await parent save to keep inputs intact while saving
		await onSave(newQuestionData);
	};

	const handleCancel = () => {
		// Clear all state and refs
		setEditorData('');
		editorDataRef.current = '';
		setCorrectAnswer(null);
        setWeight(1);
		// Clear editor content if editor instance exists
		if (editorRef.current) {
			try {
				editorRef.current.setData('');
			} catch (e) {
				console.error('Error clearing editor:', e);
			}
		}
		onCancel();
	};

    const pointsMenu = (
		<InputNumber
            value={weight}
            onChange={(v) => setWeight(Number(v) || 0)}
			min={0}
			max={100}
			style={{ width: 100 }}
		/>
	);

	return (
		<Modal
			title={
				<div style={{ 
					display: 'flex', 
					alignItems: 'center', 
					justifyContent: 'center',
					gap: '12px'
				}}>
					<ThunderboltOutlined style={{ 
						fontSize: '30px', 
						color: primaryColor,
						animation: 'pulse 2s infinite'
					}} />
					<span style={{ fontSize: '24px', fontWeight: 600 }}>
						{questionData ? t('dailyChallenge.editTrueFalseQuestion', 'Edit True/False Question') : t('dailyChallenge.createTrueFalseQuestion', 'Create True/False Question')}
					</span>
				</div>
			}
			open={visible}
			onCancel={handleCancel}
			width={1600}
			footer={null}
			style={{ top: 10 }}
			bodyStyle={{ 
				maxHeight: 'calc(100vh - 120px)',
				overflow: 'hidden', 
				position: 'relative',
				padding: 0,
				background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%)'
			}}
			key={questionData?.id || 'new'}
			destroyOnClose>
			{/* Modern Top Toolbar */}
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
				<div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {/* Weight & Save Button */}
					<div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<CheckOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#666' }}>{t('dailyChallenge.weight', 'Weight')}</span>
							{pointsMenu}
						</div>

						<Button
							type='primary'
							onClick={handleSave}
							size="large"
							className="save-question-btn"
							loading={saving}
							disabled={saving}
							style={{
								height: '44px',
								borderRadius: '12px',
								fontWeight: 600,
								fontSize: '16px',
								padding: '0 32px',
								border: 'none',
								transition: 'all 0.3s ease',
								background: 'linear-gradient(135deg, #66AEFF, #3C99FF)',
								color: '#000000',
								boxShadow: '0 4px 16px rgba(60, 153, 255, 0.4)',
							}}
						>
							<SaveOutlined /> {t('common.save', 'Save')} {t('dailyChallenge.question', 'Question')}
						</Button>
					</div>
				</div>
			</div>

			{/* Main Split Layout */}
			<div style={{ 
				display: 'flex', 
				height: 'calc(100vh - 210px)', 
				padding: '24px',
				gap: '24px'
			}}>
				{/* Left Panel - Question Editor */}
				<div style={{ 
					flex: '0 0 38%',
					display: 'flex',
					flexDirection: 'column',
					gap: '16px',
					minHeight: 0
				}}>
					{/* Question Card */}
					<div style={{
						flex: 1,
						background: 'rgba(255, 255, 255, 0.95)',
						borderRadius: '20px',
						padding: '24px',
						boxShadow: '0 8px 32px rgba(24, 144, 255, 0.15)',
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
								borderRadius: '12px',
								border: '2px solid rgba(24, 144, 255, 0.2)',
								overflow: 'hidden',
								background: 'rgba(240, 247, 255, 0.5)',
								position: 'relative',
								display: 'flex',
								flexDirection: 'column'
							}}>
                            <CKEditor
                                key={`main-question-editor-${questionData?.id || 'new'}-${visible}`}
                                editor={ClassicEditor}
                                /* Do not pass data on each render to avoid caret jumps */
                                config={questionEditorConfig}
                                onChange={handleEditorChange}
                                onReady={(editor) => {
                                    editorRef.current = editor;
                                    console.log('TrueFalseModal - Editor ready, editorDataRef:', editorDataRef.current ? 'has data' : 'empty', 'hasLoadedDataRef:', hasLoadedDataRef.current);
                                    
                                    // Set initial data from ref if available (for edit mode)
                                    const initialData = editorDataRef.current || editorData || '';
                                    if (initialData) {
                                        try { 
                                            editor.setData(initialData);
                                            console.log('TrueFalseModal - Editor ready, set initial data (length):', initialData.length);
                                            hasLoadedDataRef.current = false;
                                        } catch (e) {
                                            console.error('TrueFalseModal - Error setting initial data:', e);
                                        }
                                    } else if (hasLoadedDataRef.current) {
                                        // Data might be loading, try again after a short delay
                                        setTimeout(() => {
                                            if (editorRef.current && editorDataRef.current) {
                                                try {
                                                    editorRef.current.setData(editorDataRef.current);
                                                    console.log('TrueFalseModal - Editor ready, set data after delay (length):', editorDataRef.current.length);
                                                    hasLoadedDataRef.current = false;
                                                } catch (e) {
                                                    console.error('TrueFalseModal - Error setting data after delay:', e);
                                                }
                                            }
                                        }, 300);
                                    } else {
                                        console.log('TrueFalseModal - Editor ready, no data to set (new question)');
                                    }
                                }}
                            />
							{/* Character Counter for Question */}
							<div style={{
								position: 'absolute',
								bottom: '8px',
								right: '16px',
								fontSize: '12px',
								fontWeight: 600,
								color: stripHtml(editorData).length > 600 ? '#ff4d4f' : '#595959',
								pointerEvents: 'none',
								zIndex: 10,
								background: 'rgba(240, 247, 255, 0.9)',
								padding: '2px 6px',
								borderRadius: '4px',
							}}>
								{`${Math.min(stripHtml(editorData).length, 600)}/600`}
							</div>
							</div>
						</div>
					</div>
				</div>


				{/* Right Panel - True/False Options */}
				<div style={{ 
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					gap: '16px',
					position: 'relative'
				}}>
					{/* Options Grid Header */}
					<div style={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						padding: '0 4px'
					}}>
						<span style={{ 
							fontSize: '16px', 
							fontWeight: 600,
							color: '#1890ff'
						}}>
							Select Correct Answer
						</span>
					</div>

					{/* True/False Options Container */}
					<div style={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						gap: '24px',
						flex: 1,
						padding: '4px'
					}}>
						{/* True Option */}
						<div
							onClick={() => setCorrectAnswer('True')}
							style={{
								background: 'linear-gradient(135deg, #B8E6B8cc 0%, #B8E6B8 100%)',
								borderRadius: '16px',
								padding: '40px',
								minHeight: '320px',
								minWidth: '280px',
								position: 'relative',
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
								alignItems: 'center',
								boxShadow: correctAnswer === 'True'
									? '0 12px 32px rgba(184, 230, 184, 0.6)'
									: '0 4px 16px rgba(0,0,0,0.08)',
								border: correctAnswer === 'True'
									? '3px solid #52c41a'
									: '2px solid rgba(255,255,255,0.5)',
								transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
								transform: correctAnswer === 'True' ? 'translateY(-4px) scale(1.05)' : 'translateY(0) scale(1)',
								cursor: 'pointer',
								overflow: 'visible'
							}}
							onMouseEnter={(e) => {
								if (correctAnswer !== 'True') {
									e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
									e.currentTarget.style.boxShadow = '0 12px 32px rgba(184, 230, 184, 0.4)';
								}
							}}
							onMouseLeave={(e) => {
								if (correctAnswer !== 'True') {
									e.currentTarget.style.transform = 'translateY(0) scale(1)';
									e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
								}
							}}
						>
							{/* Correct Answer Badge */}
							<Tooltip title={correctAnswer === 'True' ? t('dailyChallenge.correctAnswer', 'Correct Answer') : t('dailyChallenge.markAsCorrect', 'Mark as Correct')}>
								<div
									style={{
										position: 'absolute',
										top: '20px',
										right: '20px',
										background: correctAnswer === 'True' ? '#52c41a' : 'rgba(255,255,255,0.3)',
										color: 'white',
										padding: '8px 16px',
										borderRadius: '20px',
										fontSize: '14px',
										fontWeight: 600,
										display: 'flex',
										alignItems: 'center',
										gap: '6px',
										boxShadow: correctAnswer === 'True' ? '0 2px 8px rgba(82, 196, 26, 0.5)' : 'none'
									}}
								>
									<CheckOutlined />
									{correctAnswer === 'True' ? t('dailyChallenge.correct', 'Correct') : t('dailyChallenge.mark', 'Mark')}
								</div>
							</Tooltip>

							<div style={{
								fontSize: '72px',
								marginBottom: '16px'
							}}>
								✅
							</div>
							<div style={{ 
								color: '#2d5f2d', 
								fontSize: '32px', 
								fontWeight: 'bold',
								textAlign: 'center',
								textShadow: '0 2px 4px rgba(0,0,0,0.1)'
							}}>
								TRUE
							</div>
						</div>

						{/* False Option */}
						<div
							onClick={() => setCorrectAnswer('False')}
							style={{
								background: 'linear-gradient(135deg, #FFB3B3cc 0%, #FFB3B3 100%)',
								borderRadius: '16px',
								padding: '40px',
								minHeight: '320px',
								minWidth: '280px',
								position: 'relative',
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
								alignItems: 'center',
								boxShadow: correctAnswer === 'False'
									? '0 12px 32px rgba(255, 179, 179, 0.6)'
									: '0 4px 16px rgba(0,0,0,0.08)',
								border: correctAnswer === 'False'
									? '3px solid #f5222d'
									: '2px solid rgba(255,255,255,0.5)',
								transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
								transform: correctAnswer === 'False' ? 'translateY(-4px) scale(1.05)' : 'translateY(0) scale(1)',
								cursor: 'pointer',
								overflow: 'visible'
							}}
							onMouseEnter={(e) => {
								if (correctAnswer !== 'False') {
									e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
									e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 179, 179, 0.4)';
								}
							}}
							onMouseLeave={(e) => {
								if (correctAnswer !== 'False') {
									e.currentTarget.style.transform = 'translateY(0) scale(1)';
									e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
								}
							}}
						>
							{/* Correct Answer Badge */}
							<Tooltip title={correctAnswer === 'False' ? t('dailyChallenge.correctAnswer', 'Correct Answer') : t('dailyChallenge.markAsCorrect', 'Mark as Correct')}>
								<div
									style={{
										position: 'absolute',
										top: '20px',
										right: '20px',
										background: correctAnswer === 'False' ? '#f5222d' : 'rgba(255,255,255,0.3)',
										color: 'white',
										padding: '8px 16px',
										borderRadius: '20px',
										fontSize: '14px',
										fontWeight: 600,
										display: 'flex',
										alignItems: 'center',
										gap: '6px',
										boxShadow: correctAnswer === 'False' ? '0 2px 8px rgba(245, 34, 45, 0.5)' : 'none'
									}}
								>
									<CheckOutlined />
									{correctAnswer === 'False' ? t('dailyChallenge.correct', 'Correct') : t('dailyChallenge.mark', 'Mark')}
								</div>
							</Tooltip>

							<div style={{
								fontSize: '72px',
								marginBottom: '16px'
							}}>
								❌
							</div>
							<div style={{ 
								color: '#8b2e2e', 
								fontSize: '32px', 
								fontWeight: 'bold',
								textAlign: 'center',
								textShadow: '0 2px 4px rgba(0,0,0,0.1)'
							}}>
								FALSE
							</div>
						</div>
					</div>
				</div>
			</div>
		</Modal>
	);
};

export default TrueFalseModal;
