import React, { useState, useRef, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Select } from 'antd';
import {
	PlusOutlined,
	DeleteOutlined,
	PictureOutlined,
	AudioOutlined,
	VideoCameraOutlined,
	CheckOutlined,
	ClockCircleOutlined,
	BoldOutlined,
	ItalicOutlined,
	UnderlineOutlined,
	StrikethroughOutlined,
	FontSizeOutlined,
	FunctionOutlined,
} from '@ant-design/icons';
import './MultipleChoiceModal.css';

const MultipleChoiceModal = ({
	visible,
	onCancel,
	onSave,
	questionData = null,
}) => {
	const [form] = Form.useForm();
	const [options, setOptions] = useState(
		questionData?.options || [
			{ id: 1, text: '', isCorrect: false, color: '#1890ff' },
			{ id: 2, text: '', isCorrect: false, color: '#13c2c2' },
			{ id: 3, text: '', isCorrect: false, color: '#faad14' },
			{ id: 4, text: '', isCorrect: false, color: '#eb2f96' },
		]
	);
	const [answerType, setAnswerType] = useState('single'); // "single" or "multiple"
	const [points, setPoints] = useState(1);
	const [timeLimit, setTimeLimit] = useState(30);
	const [questionImage, setQuestionImage] = useState(null);
	const [optionImages, setOptionImages] = useState({});
	const questionImageInputRef = useRef(null);

	// Load question data when editing
	useEffect(() => {
		if (visible) {
			// Use setTimeout to ensure form is mounted
			setTimeout(() => {
				if (questionData) {
					// Edit mode - load existing data
					form.setFieldsValue({
						question: questionData.question || '',
					});
					setOptions(questionData.options || [
						{ id: 1, text: '', isCorrect: false, color: '#1890ff' },
						{ id: 2, text: '', isCorrect: false, color: '#13c2c2' },
						{ id: 3, text: '', isCorrect: false, color: '#faad14' },
						{ id: 4, text: '', isCorrect: false, color: '#eb2f96' },
					]);
					setPoints(questionData.points || 1);
					setTimeLimit(questionData.timeLimit || 30);
				} else {
					// Add mode - reset to defaults
					form.resetFields();
					setOptions([
						{ id: 1, text: '', isCorrect: false, color: '#1890ff' },
						{ id: 2, text: '', isCorrect: false, color: '#13c2c2' },
						{ id: 3, text: '', isCorrect: false, color: '#faad14' },
						{ id: 4, text: '', isCorrect: false, color: '#eb2f96' },
					]);
					setPoints(1);
					setTimeLimit(30);
					setQuestionImage(null);
					setOptionImages({});
				}
			}, 0);
		}
	}, [questionData, visible, form]);

	const handleAddOption = () => {
		const newId = Math.max(...options.map((opt) => opt.id)) + 1;
		const colors = [
			'#1890ff',
			'#13c2c2',
			'#fa8c16',
			'#eb2f96',
			'#52c41a',
			'#722ed1',
			'#f5222d',
			'#faad14',
		];
		const newColor = colors[options.length % colors.length];
		setOptions([
			...options,
			{ id: newId, text: '', isCorrect: false, color: newColor },
		]);
	};

	const handleRemoveOption = (optionId) => {
		if (options.length > 2) {
			setOptions(options.filter((opt) => opt.id !== optionId));
		} else {
			message.warning('Question must have at least 2 options');
		}
	};

	const handleOptionChange = (optionId, field, value) => {
		setOptions(
			options.map((opt) =>
				opt.id === optionId
					? { ...opt, [field]: value }
					: field === 'isCorrect' && value === true && answerType === 'single'
					? { ...opt, isCorrect: false }
					: opt
			)
		);
	};

	const handleQuestionImageUpload = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				setQuestionImage(event.target.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleOptionImageUpload = (optionId, e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				setOptionImages(prev => ({
					...prev,
					[optionId]: event.target.result
				}));
			};
			reader.readAsDataURL(file);
		}
	};

	const removeQuestionImage = () => {
		setQuestionImage(null);
	};

	const removeOptionImage = (optionId) => {
		setOptionImages(prev => {
			const newImages = { ...prev };
			delete newImages[optionId];
			return newImages;
		});
	};

	const handleSave = () => {
		form.validateFields().then((values) => {
			const hasCorrectAnswer = options.some((opt) => opt.isCorrect);
			if (!hasCorrectAnswer) {
				message.error('Please select at least one correct answer');
				return;
			}

			const hasEmptyOptions = options.some((opt) => !opt.text.trim());
			if (hasEmptyOptions) {
				message.error('Please fill in all option texts');
				return;
			}

		const newQuestionData = {
			id: questionData?.id || Date.now(),
			type: answerType === 'single' ? 'multiple-choice' : 'multiple-select',
			title: answerType === 'single' ? 'Multiple choice' : 'Multiple select',
			question: values.question,
			options: options.map((opt, index) => ({
				...opt,
				key: String.fromCharCode(65 + index), // A, B, C, D, ...
			})),
			correctAnswer: options
				.filter((opt) => opt.isCorrect)
				.map((opt) => opt.text)
				.join(', '),
		};

			onSave(newQuestionData);
			form.resetFields();
			setOptions([
				{ id: 1, text: '', isCorrect: false, color: '#1890ff' },
				{ id: 2, text: '', isCorrect: false, color: '#13c2c2' },
				{ id: 3, text: '', isCorrect: false, color: '#fa8c16' },
				{ id: 4, text: '', isCorrect: false, color: '#eb2f96' },
			]);
			setAnswerType('single');
		});
	};

	const handleCancel = () => {
		form.resetFields();
		setOptions([
			{ id: 1, text: '', isCorrect: false, color: '#1890ff' },
			{ id: 2, text: '', isCorrect: false, color: '#13c2c2' },
			{ id: 3, text: '', isCorrect: false, color: '#fa8c16' },
			{ id: 4, text: '', isCorrect: false, color: '#eb2f96' },
		]);
		setAnswerType('single');
		onCancel();
	};

	const pointsMenu = (
		<Select
			value={points}
			onChange={setPoints}
			style={{ width: 80 }}
			options={[
				{ value: 1, label: '1 điểm' },
				{ value: 2, label: '2 điểm' },
				{ value: 3, label: '3 điểm' },
				{ value: 5, label: '5 điểm' },
			]}
		/>
	);

	const timeMenu = (
		<Select
			value={timeLimit}
			onChange={setTimeLimit}
			style={{ width: 100 }}
			options={[
				{ value: 15, label: '15 giây' },
				{ value: 30, label: '30 giây' },
				{ value: 60, label: '1 phút' },
				{ value: 120, label: '2 phút' },
				{ value: 300, label: '5 phút' },
			]}
		/>
	);

	return (
		<Modal
			title='Create Multiple Choice Question'
			open={visible}
			onCancel={handleCancel}
			width={1400}
			height={800}
			footer={null}
			style={{ top: 20 }}
			bodyStyle={{ height: '85vh', overflow: 'hidden', position: 'relative' }}
			key={questionData?.id || 'new'}
			destroyOnClose>
			{/* Top Control Bar */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: 16,
					padding: '12px 16px',
					background: '#f5f5f5',
					borderRadius: 8,
					border: '1px solid #e0e0e0',
				}}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
					<Button
						type='text'
						icon={<BoldOutlined />}
						style={{ color: '#666' }}
					/>
					<Button
						type='text'
						icon={<ItalicOutlined />}
						style={{ color: '#666' }}
					/>
					<Button
						type='text'
						icon={<UnderlineOutlined />}
						style={{ color: '#666' }}
					/>
					<Button
						type='text'
						icon={<StrikethroughOutlined />}
						style={{ color: '#666' }}
					/>
					<Button
						type='text'
						icon={<FontSizeOutlined />}
						style={{ color: '#666' }}
					/>
					<div
						style={{
							width: 1,
							height: 20,
							background: '#e0e0e0',
							margin: '0 8px',
						}}
					/>
					<Button
						type='text'
						icon={<FunctionOutlined />}
						style={{ color: '#666' }}
					/>
					<span style={{ fontSize: 12, color: '#666' }}>
						Chèn kí hiệu toán học
					</span>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
						<CheckOutlined style={{ color: '#52c41a' }} />
						{pointsMenu}
					</div>

					<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
						<ClockCircleOutlined style={{ color: '#1890ff' }} />
						{timeMenu}
					</div>

					<Button
						type='primary'
						onClick={handleSave}
						style={{
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							border: 'none',
							borderRadius: 6,
						}}>
						Lưu câu hỏi
					</Button>
				</div>
			</div>

			<div
				style={{
					background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
					borderRadius: 12,
					padding: 24,
					marginBottom: 24,
					position: 'relative',
				}}>
				{/* Media Icons */}
				<div
					style={{
						position: 'absolute',
						top: 16,
						left: 16,
						display: 'flex',
						gap: 8,
						zIndex: 10,
					}}>
					<Button
						type='text'
						icon={<PictureOutlined />}
						onClick={() => questionImageInputRef.current?.click()}
						style={{
							color: 'white',
							border: '1px solid rgba(255,255,255,0.3)',
							zIndex: 11,
						}}
					/>
					<Button
						type='text'
						icon={<AudioOutlined />}
						style={{
							color: 'white',
							border: '1px solid rgba(255,255,255,0.3)',
							zIndex: 11,
						}}
					/>
					<Button
						type='text'
						icon={<VideoCameraOutlined />}
						style={{
							color: 'white',
							border: '1px solid rgba(255,255,255,0.3)',
							zIndex: 11,
						}}
					/>
				</div>

				{/* Question Container - Split Layout */}
				<div
					style={{
						display: 'flex',
						marginTop: 40,
						height: questionImage ? 200 : 120,
						alignItems: 'center',
						gap: 20,
						padding: 16,
					}}>
					
					{/* Left Side - Question Image */}
					{questionImage && (
						<div style={{ 
							flex: '0 0 15%',
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center'
						}}>
							<div style={{ position: 'relative' }}>
								<img
									src={questionImage}
									alt="Question"
									style={{
										width: 180,
										height: 180,
										objectFit: 'cover',
										borderRadius: 12,
										border: '2px solid rgba(255,255,255,0.3)',
										boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
									}}
								/>
								<Button
									type="text"
									icon={<DeleteOutlined />}
									onClick={removeQuestionImage}
									style={{
										position: 'absolute',
										top: -8,
										right: -8,
										background: 'rgba(255,0,0,0.8)',
										color: 'white',
										border: 'none',
										borderRadius: '50%',
										width: 28,
										height: 28,
										minWidth: 28,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										zIndex: 12,
									}}
								/>
							</div>
						</div>
					)}

					{/* Right Side - Question Input */}
					<div style={{ 
						flex: questionImage ? '0 0 85%' : '1',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center'
					}}>
						<Form
							form={form}
							layout='vertical'
							style={{ width: '100%' }}>
							<Form.Item
								name='question'
								rules={[
									{ required: true, message: 'Please enter the question text' },
								]}
								style={{ marginBottom: 0 }}>
								<div
									style={{
										display: 'flex',
										height: questionImage ? 175 : 135,
										alignItems: 'center',
										background: 'transparent',
										border: '1px solid #ccc',
										borderRadius: '6px',
										padding: 16,
										zIndex: 1,
									}}>
									<Input.TextArea
										placeholder='Nhập câu hỏi vào đây'
										className='question-textarea'
										style={{
											textAlign: 'center',
											background: 'transparent',
											border: 'none',
											color: 'white',
											fontSize: 16,
											resize: 'none',
											boxShadow: 'none',
											height: '100%',
											overflow: 'hidden',
											width: '100%',
										}}
									/>
								</div>
							</Form.Item>
						</Form>
					</div>
				</div>

				{/* Hidden file input for question image */}
				<input
					ref={questionImageInputRef}
					type="file"
					accept="image/*"
					onChange={handleQuestionImageUpload}
					style={{ display: 'none' }}
				/>
			</div>

			{/* Answer Options Grid */}
			<div
				style={{
					display: 'flex',
					flexDirection: 'row',
					gap: 20,
					marginBottom: 20,
					position: 'relative',
					overflowX: 'auto',
					paddingBottom: 10,
          paddingTop: 10,
					minHeight: 250,
				}}>
				{options.map((option, index) => (
					<div
						key={option.id}
						style={{
							background: `linear-gradient(135deg, ${option.color} 0%, ${option.color}dd 100%)`,
							borderRadius: 16,
							padding: 24,
							minHeight: 270,
							minWidth: 270,
							width: 270,
							position: 'relative',
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'space-between',
							boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
							border: '2px solid rgba(255,255,255,0.2)',
							transition: 'all 0.3s ease',
							cursor: 'pointer',
							flexShrink: 0,
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.transform = 'translateY(-4px)';
							e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.transform = 'translateY(0)';
							e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
						}}>
						{/* Action Icons */}
						<div
							style={{
								position: 'absolute',
								top: 16,
								left: 16,
								display: 'flex',
								gap: 8,
							}}>
							<Button
								type='text'
								icon={<DeleteOutlined />}
								onClick={(e) => {
									e.stopPropagation();
									handleRemoveOption(option.id);
								}}
								style={{
									color: 'white',
									background: 'rgba(255,255,255,0.2)',
									border: 'none',
									borderRadius: 8,
									width: 32,
									height: 32,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
								size='small'
							/>
							<Button
								type='text'
								icon={<PictureOutlined />}
								onClick={() => document.getElementById(`option-image-upload-${option.id}`).click()}
								style={{
									color: 'white',
									background: 'rgba(255,255,255,0.2)',
									border: 'none',
									borderRadius: 8,
									width: 32,
									height: 32,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
								size='small'
							/>
							<input
								id={`option-image-upload-${option.id}`}
								type="file"
								accept="image/*"
								onChange={(e) => handleOptionImageUpload(option.id, e)}
								style={{ display: 'none' }}
							/>
						</div>

						{/* Correct Answer Indicator */}
						<div
							style={{
								position: 'absolute',
								top: 16,
								right: 16,
							}}>
							<Button
								type='text'
								icon={<CheckOutlined />}
								onClick={(e) => {
									e.stopPropagation();
									handleOptionChange(option.id, 'isCorrect', !option.isCorrect);
								}}
								style={{
									color: option.isCorrect ? 'white' : 'rgba(255,255,255,0.7)',
									background: option.isCorrect
										? '#52c41a'
										: 'rgba(255,255,255,0.2)',
									border: option.isCorrect 
										? '2px solid white' 
										: '2px solid rgba(255,255,255,0.5)',
									borderRadius: '50%',
									width: 40,
									height: 40,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									transition: 'all 0.3s ease',
									boxShadow: option.isCorrect 
										? '0 2px 8px rgba(82, 196, 26, 0.4)' 
										: '0 2px 4px rgba(0,0,0,0.1)',
								}}
							/>
						</div>

						{/* Option Image */}
						{optionImages[option.id] && (
							<div style={{ 
								position: 'relative', 
								marginTop: 28,
								display: 'flex',
								justifyContent: 'center'
							}}>
								<img
									src={optionImages[option.id]}
									alt={`Option ${option.id}`}
									style={{
										width: 120,
										height: 120,
										objectFit: 'cover',
										borderRadius: 12,
										border: '2px solid rgba(255,255,255,0.3)',
										boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
									}}
								/>
								<Button
									type="text"
									icon={<DeleteOutlined />}
									onClick={() => removeOptionImage(option.id)}
									style={{
										position: 'absolute',
										top: -8,
										right: 'calc(50% - 60px - 8px)',
										background: 'rgba(255,0,0,0.8)',
										color: 'white',
										border: 'none',
										borderRadius: '50%',
										width: 24,
										height: 24,
										minWidth: 24,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								/>
							</div>
						)}

						{/* Input Field */}
						<div
							style={{
								flex: 1,
								display: 'flex',
								alignItems: 'center',
								marginTop: optionImages[option.id] ? 10 : 40,
							}}>
							<Input
								value={option.text}
								onChange={(e) =>
									handleOptionChange(option.id, 'text', e.target.value)
								}
								placeholder='Nhập tùy chọn trả lời ở đây'
								className='option-input'
								style={{
									background: 'rgba(240, 235, 235, 0.1)',
									border: '2px solid rgba(255,255,255,0.3)',
									color: 'white',
									fontSize: 15,
									fontWeight: '500',
									textAlign: 'center',
									borderRadius: 12,
									padding: '16px 20px',
									backdropFilter: 'blur(10px)',
									height: 50,
								}}
								onFocus={(e) => {
									e.target.style.background = 'rgba(255,255,255,0.2)';
									e.target.style.borderColor = 'rgba(255,255,255,0.5)';
								}}
								onBlur={(e) => {
									e.target.style.background = 'rgba(255,255,255,0.1)';
									e.target.style.borderColor = 'rgba(255,255,255,0.3)';
								}}
							/>
						</div>
					</div>
				))}

				{/* Add Option Button */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						minWidth: 80,
						minHeight: 180,
					}}>
					<Button
						type='primary'
						icon={<PlusOutlined />}
						onClick={handleAddOption}
						style={{
							width: 40,
							height: 40,
							borderRadius: '50%',
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							border: 'none',
							boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 16,
							transition: 'all 0.3s ease',
						}}
						onMouseEnter={(e) => {
							e.target.style.transform = 'scale(1.1)';
							e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
						}}
						onMouseLeave={(e) => {
							e.target.style.transform = 'scale(1)';
							e.target.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
						}}
					/>
				</div>
			</div>

			{/* Additional Options */}
			<div
				style={{
					textAlign: 'left',
				}}>
				<Button
					type='link'
					style={{
						color: '#1890ff',
						fontSize: 12,
						padding: 0,
					}}>
					Thêm giải thích cho đáp án
				</Button>
			</div>
		</Modal>
	);
};

export default MultipleChoiceModal;
