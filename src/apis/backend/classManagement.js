import axiosClient from '../index.js';

const classManagementApi = {
	// Lấy danh sách classes với phân trang và search
	getClasses: (params) => {
		const queryParams = new URLSearchParams();
		
		// Thêm các tham số nếu có
		if (params.page !== undefined) queryParams.append('page', params.page);
		if (params.size !== undefined) queryParams.append('size', params.size);
		if (params.searchText && params.searchText.trim()) {
			queryParams.append('searchText', params.searchText.trim());
		}

		const url = `/class${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
		console.log('GetClasses API - URL:', url);
		console.log('GetClasses API - Params:', params);
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Tạo class mới
	createClass: (classData) => {
		const url = `/class`;
		console.log('CreateClass API - URL:', url);
		console.log('CreateClass API - Data:', JSON.stringify(classData, null, 2));
		
		return axiosClient.post(url, classData, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'application/json',
			}
		}).catch(error => {
			console.error('CreateClass API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Cập nhật class
	updateClass: (classId, classData) => {
		const url = `/class/${classId}`;
		console.log('UpdateClass API - URL:', url);
		console.log('UpdateClass API - Data:', JSON.stringify(classData, null, 2));
		
		return axiosClient.put(url, classData, {
			headers: {
				'accept': '*/*',
				'Content-Type': 'application/json',
			}
		}).catch(error => {
			console.error('UpdateClass API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Xóa class
	deleteClass: (classId) => {
		const url = `/class/${classId}`;
		console.log('DeleteClass API - URL:', url);
		console.log('DeleteClass API - Params:', { classId });
		
		return axiosClient.delete(url, {
			headers: {
				'accept': '*/*',
			}
		}).catch(error => {
			console.error('DeleteClass API Error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			throw error;
		});
	},

	// Lấy thông tin chi tiết class
	getClassDetail: (classId) => {
		const url = `/class/${classId}`;
		console.log('GetClassDetail API - URL:', url);
		console.log('GetClassDetail API - Params:', { classId });
		
		return axiosClient.get(url, {
			headers: {
				'accept': '*/*',
			}
		});
	},

	// Cập nhật trạng thái class (ACTIVE/INACTIVE)
	updateClassStatus: (classId, status) => {
		const url = `/class/${classId}/status?status=${status}`;
		console.log('UpdateClassStatus API - URL:', url);
		console.log('UpdateClassStatus API - Params:', { classId, status });
		
		return axiosClient.patch(url, {}, {
			headers: {
				'accept': '*/*',
			}
		});
	},
};

export default classManagementApi;
