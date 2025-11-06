import axiosClient from '../secureAxiosClient';
import axios from 'axios';

const notificationApi = {
	// Lấy danh sách notifications
	getNotifications: (params = {}) => {
		const {
			page = 0,
			size = 20,
			unreadOnly = false,
			sortBy = 'createdAt',
			sortDir = 'desc'
		} = params;

		return axiosClient.get('/notifications', {
			params: {
				page,
				size,
				unreadOnly,
				sortBy,
				sortDir
			},
			headers: {
				'accept': '*/*'
			}
		});
	},

	// Lấy số lượng thông báo chưa đọc
	getUnreadCount: () => {
		return axiosClient.get('/notifications/unread-count', {
			headers: {
				'accept': '*/*'
			}
		});
	},

	// Kết nối SSE stream để nhận notifications real-time
	connectSSE: (onMessage, onError, onConnect) => {
		const accessToken = localStorage.getItem('accessToken');
		
		if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
			const error = new Error('No access token available');
			if (onError) onError(error);
			return null;
		}

		const baseURL = process.env.REACT_APP_API_URL || 
			'https://learning-progress-management-hndjatgmc3fva3gs.southeastasia-01.azurewebsites.net/learning-progress-management/api/v1';
		
		const url = `${baseURL}/notifications/sse/stream`;

		// Sử dụng fetch để kết nối SSE
		const abortController = new AbortController();

		let isConnected = false;

		const connect = async () => {
			try {
				const response = await fetch(url, {
					headers: {
						'Authorization': `Bearer ${accessToken}`,
						'Accept': 'text/event-stream',
					},
					signal: abortController.signal,
				});

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}

				isConnected = true;
				if (onConnect) onConnect();

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = '';
				let currentEvent = null;
				let currentData = [];

				while (true) {
					const { done, value } = await reader.read();
					
					if (done) {
						isConnected = false;
						break;
					}

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split('\n');
					buffer = lines.pop(); // Phần còn lại

					for (let line of lines) {
						line = line.trim();
						
						if (!line) {
							// Dòng trống → kết thúc event
							if (currentEvent && currentData.length > 0) {
								const dataStr = currentData.join('\n');
								handleEvent(currentEvent, dataStr);
							}
							currentEvent = null;
							currentData = [];
							continue;
						}

						if (line.startsWith('event:')) {
							// Nếu có event cũ chưa xử lý, xử lý nó trước
							if (currentEvent && currentData.length > 0) {
								handleEvent(currentEvent, currentData.join('\n'));
							}
							currentEvent = line.slice(6).trim();
							currentData = [];
						} else if (line.startsWith('data:')) {
							currentData.push(line.slice(5).trim());
						}
					}
				}

				// Xử lý event cuối cùng nếu còn
				if (currentEvent && currentData.length > 0) {
					handleEvent(currentEvent, currentData.join('\n'));
				}

			} catch (err) {
				if (err.name !== 'AbortError') {
					isConnected = false;
					if (onError) onError(err);
				}
			}
		};

		const handleEvent = (eventName, dataStr) => {
			if (eventName === 'connect') {
				// Event connect - có thể chứa thông tin userId
				try {
					const data = JSON.parse(dataStr);
					if (onMessage) {
						onMessage({
							type: 'connect',
							data: data
						});
					}
				} catch (e) {
					if (onMessage) {
						onMessage({
							type: 'connect',
							data: dataStr
						});
					}
				}
				return;
			}

			if (eventName === 'notification') {
				try {
					const notification = JSON.parse(dataStr);
					if (onMessage) {
						onMessage({
							type: 'notification',
							data: notification
						});
					}
				} catch (e) {
					console.error('Failed to parse notification data:', e);
					if (onMessage) {
						onMessage({
							type: 'notification',
							data: { raw: dataStr }
						});
					}
				}
				return;
			}

			if (eventName === 'ping') {
				// Ping event để giữ connection
				if (onMessage) {
					onMessage({
						type: 'ping',
						data: null
					});
				}
				return;
			}

			// Các event khác
			if (onMessage) {
				onMessage({
					type: eventName,
					data: dataStr
				});
			}
		};

		// Bắt đầu kết nối
		connect();

		// Trả về object để có thể disconnect
		return {
			disconnect: () => {
				abortController.abort();
				isConnected = false;
			},
			isConnected: () => isConnected
		};
	},

	// Đánh dấu notification là đã đọc
	markAsRead: (notificationId) => {
		return axiosClient.patch(`/notifications/${notificationId}/read`, {}, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*'
			}
		});
	},

	// Đánh dấu tất cả notifications là đã đọc
	markAllAsRead: () => {
		return axiosClient.patch('/notifications/read-all', {}, {
			headers: {
				'Content-Type': 'application/json',
				'accept': '*/*'
			}
		});
	},

	// Xóa mềm notification (soft delete)
	deleteNotification: (notificationId) => {
		return axiosClient.delete(`/notifications/${notificationId}`, {
			headers: {
				'accept': '*/*'
			}
		});
	}
};

export default notificationApi;

