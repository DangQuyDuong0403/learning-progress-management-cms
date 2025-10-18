// src/redux/auth.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authApi from '../apis/backend/auth';

//check nếu có user và accessToken trong localStorage
const storedUser = localStorage.getItem('user');
const storedAccessToken = localStorage.getItem('accessToken');

// Async thunk for forgot password
export const forgotPassword = createAsyncThunk(
	'/auth/forgotPassword',
	async (username, { rejectWithValue }) => {
		try {
			const response = await authApi.forgotPassword({ username });
			// Return the message from the original response
			return {
				message: response.message,
				data: response.data
			};
		} catch (error) {
			return rejectWithValue(error.response.data.error || error.message);
		}
	}
);

// Async thunk for refresh token
export const refreshToken = createAsyncThunk(
	'/auth/refreshToken',
	async (refreshTokenValue, { rejectWithValue }) => {
		try {
			const response = await authApi.refreshToken(refreshTokenValue);
			return response;
		} catch (error) {
			return rejectWithValue(error.response?.data || error.message);
		}
	}
);

// Async thunk for logout
export const logoutApi = createAsyncThunk(
	'/auth/logoutApi',
	async (refreshTokenValue, { rejectWithValue }) => {
		try {
			const response = await authApi.logout(refreshTokenValue);
			return response;
		} catch (error) {
			return rejectWithValue(error.response?.data || error.message);
		}
	}
);

// Async thunk for getting user profile
export const getUserProfile = createAsyncThunk(
	'/auth/getUserProfile',
	async (_, { rejectWithValue }) => {
		try {
			const response = await authApi.getUserProfile();
			return response;
		} catch (error) {
			return rejectWithValue(error.response?.data || error.message);
		}
	}
);

// Async thunk for change password
export const changePassword = createAsyncThunk(
	'/auth/changePassword',
	async (data, { rejectWithValue }) => {
		try {
			const response = await authApi.changePassword(data);
			return response;
		} catch (error) {
			return rejectWithValue(error.response?.data || error.message);
		}
	}
);

// Async thunk for update profile
export const updateProfile = createAsyncThunk(
	'/auth/updateProfile',
	async (data, { rejectWithValue }) => {
		try {
			const response = await authApi.updateProfile(data);
			return response;
		} catch (error) {
			return rejectWithValue(error.response?.data || error.message);
		}
	}
);

// Async thunk for update email
export const updateEmail = createAsyncThunk(
	'/auth/updateEmail',
	async (data, { rejectWithValue }) => {
		try {
			const response = await authApi.updateEmail(data);
			return response;
		} catch (error) {
			return rejectWithValue(error.response?.data || error.message);
		}
	}
);

// Async thunk for upload avatar
export const uploadAvatar = createAsyncThunk(
	'/auth/uploadAvatar',
	async (file, { rejectWithValue }) => {
		try {
			const response = await authApi.updateAvatar(file);
			return response;
		} catch (error) {
			return rejectWithValue(error.response?.data || error.message);
		}
	}
);

// Async thunk for confirm email change
export const confirmEmailChange = createAsyncThunk(
	'/auth/confirmEmailChange',
	async (token, { rejectWithValue }) => {
		try {
			const response = await authApi.confirmEmailChange(token);
			return response;
		} catch (error) {
			return rejectWithValue(error.response?.data || error.message);
		}
	}
);

const initialState = {
	user: storedUser ? JSON.parse(storedUser) : null,
	accessToken: storedAccessToken,
	refreshToken: localStorage.getItem('refreshToken'),
	isAuthenticated: !!storedAccessToken, // true nếu có accessToken
	forgotPasswordLoading: false,
	forgotPasswordError: null,
	forgotPasswordSuccess: false,
	forgotPasswordData: null,
	refreshTokenLoading: false,
	refreshTokenError: null,
	logoutLoading: false,
	logoutError: null,
	profileLoading: false,
	profileError: null,
	profileData: null,
	changePasswordLoading: false,
	changePasswordError: null,
	changePasswordSuccess: false,
	updateProfileLoading: false,
	updateProfileError: null,
	updateProfileSuccess: false,
	updateEmailLoading: false,
	updateEmailError: null,
	updateEmailSuccess: false,
	uploadAvatarLoading: false,
	uploadAvatarError: null,
	uploadAvatarSuccess: false,
	confirmEmailChangeLoading: false,
	confirmEmailChangeError: null,
	confirmEmailChangeSuccess: false,
};

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		loginSuccess: (state, action) => {
			const { accessToken, refreshToken, username, role } = action.payload;
			state.user = { username, role };
			state.accessToken = accessToken;
			state.refreshToken = refreshToken;
			state.isAuthenticated = true;
			// lưu user và accessToken vào localStorage
			localStorage.setItem('user', JSON.stringify({ username, role }));
			localStorage.setItem('accessToken', accessToken);
			localStorage.setItem('refreshToken', refreshToken);
		},
		syncAuthState: (state, action) => {
			// Sync state từ localStorage mà không lưu lại localStorage (tránh vòng lặp)
			const { accessToken, refreshToken, username, role } = action.payload;
			state.user = { username, role };
			state.accessToken = accessToken;
			state.refreshToken = refreshToken;
			state.isAuthenticated = true;
			// Không lưu vào localStorage để tránh trigger storage event
		},
		logout: (state) => {
			state.user = null;
			state.accessToken = null;
			state.refreshToken = null;
			state.isAuthenticated = false;
			// Xoá khỏi localStorage - chỉ xóa khi thực sự logout
			localStorage.removeItem('user');
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
			localStorage.removeItem('mustChangePassword');
			localStorage.removeItem('mustUpdateProfile');
		},
		clearForgotPasswordState: (state) => {
			state.forgotPasswordLoading = false;
			state.forgotPasswordError = null;
			state.forgotPasswordSuccess = false;
			state.forgotPasswordData = null;
		},
		clearChangePasswordState: (state) => {
			state.changePasswordLoading = false;
			state.changePasswordError = null;
			state.changePasswordSuccess = false;
		},
		clearUpdateProfileState: (state) => {
			state.updateProfileLoading = false;
			state.updateProfileError = null;
			state.updateProfileSuccess = false;
		},
		clearUpdateEmailState: (state) => {
			state.updateEmailLoading = false;
			state.updateEmailError = null;
			state.updateEmailSuccess = false;
			state.confirmEmailChangeLoading = false;
			state.confirmEmailChangeError = null;
			state.confirmEmailChangeSuccess = false;
		},
		updateToken: (state, action) => {
			state.accessToken = action.payload;
			localStorage.setItem('accessToken', action.payload);
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(forgotPassword.pending, (state) => {
				state.forgotPasswordLoading = true;
				state.forgotPasswordError = null;
				state.forgotPasswordSuccess = false;
				state.forgotPasswordMessage = null;
			})
			.addCase(forgotPassword.fulfilled, (state, action) => {
				state.forgotPasswordLoading = false;
				state.forgotPasswordSuccess = true;
				state.forgotPasswordError = null;
				state.forgotPasswordData = action.payload.data; // Lưu email từ response
			})
			.addCase(forgotPassword.rejected, (state, action) => {
				state.forgotPasswordLoading = false;
				state.forgotPasswordError = action.payload;
				state.forgotPasswordSuccess = false;
				state.forgotPasswordMessage = null;
			})
			.addCase(refreshToken.pending, (state) => {
				state.refreshTokenLoading = true;
				state.refreshTokenError = null;
			})
			.addCase(refreshToken.fulfilled, (state, action) => {
				state.refreshTokenLoading = false;
				state.refreshTokenError = null;
				// Cập nhật cả accessToken và refreshToken mới
				if (action.payload?.accessToken) {
					state.accessToken = action.payload.accessToken;
					localStorage.setItem('accessToken', action.payload.accessToken);
					console.log('✅ Redux: Updated accessToken');
				}
				if (action.payload?.refreshToken) {
					state.refreshToken = action.payload.refreshToken;
					localStorage.setItem('refreshToken', action.payload.refreshToken);
					console.log('✅ Redux: Updated refreshToken');
				}
			})
			.addCase(refreshToken.rejected, (state, action) => {
				state.refreshTokenLoading = false;
				state.refreshTokenError = action.payload;
				// Nếu refresh token không hợp lệ, đăng xuất người dùng
				state.user = null;
				state.accessToken = null;
				state.refreshToken = null;
				state.isAuthenticated = false;
				localStorage.removeItem('user');
				localStorage.removeItem('accessToken');
				localStorage.removeItem('refreshToken');
			})
			.addCase(logoutApi.pending, (state) => {
				state.logoutLoading = true;
				state.logoutError = null;
			})
			.addCase(logoutApi.fulfilled, (state) => {
				state.logoutLoading = false;
				state.logoutError = null;
				// Xóa thông tin user và accessToken
				state.user = null;
				state.accessToken = null;
				state.refreshToken = null;
				state.isAuthenticated = false;
				localStorage.removeItem('user');
				localStorage.removeItem('accessToken');
				localStorage.removeItem('refreshToken');
			})
			.addCase(logoutApi.rejected, (state, action) => {
				state.logoutLoading = false;
				state.logoutError = action.payload;
				// Vẫn xóa thông tin user và accessToken dù API lỗi
				state.user = null;
				state.accessToken = null;
				state.refreshToken = null;
				state.isAuthenticated = false;
				localStorage.removeItem('user');
				localStorage.removeItem('accessToken');
				localStorage.removeItem('refreshToken');
			})
			.addCase(getUserProfile.pending, (state) => {
				state.profileLoading = true;
				state.profileError = null;
			})
			.addCase(getUserProfile.fulfilled, (state, action) => {
				state.profileLoading = false;
				state.profileData = action.payload.data;
				state.profileError = null;
			})
			.addCase(getUserProfile.rejected, (state, action) => {
				state.profileLoading = false;
				state.profileError = action.payload;
			})
			.addCase(changePassword.pending, (state) => {
				state.changePasswordLoading = true;
				state.changePasswordError = null;
				state.changePasswordSuccess = false;
			})
			.addCase(changePassword.fulfilled, (state, action) => {
				state.changePasswordLoading = false;
				state.changePasswordSuccess = true;
				state.changePasswordError = null;
			})
			.addCase(changePassword.rejected, (state, action) => {
				state.changePasswordLoading = false;
				state.changePasswordError = action.payload;
				state.changePasswordSuccess = false;
			})
			.addCase(updateProfile.pending, (state) => {
				state.updateProfileLoading = true;
				state.updateProfileError = null;
				state.updateProfileSuccess = false;
			})
			.addCase(updateProfile.fulfilled, (state, action) => {
				state.updateProfileLoading = false;
				state.updateProfileSuccess = true;
				state.updateProfileError = null;
				// Cập nhật profileData với dữ liệu mới
				if (action.payload?.data) {
					state.profileData = action.payload.data;
				}
			})
			.addCase(updateProfile.rejected, (state, action) => {
				state.updateProfileLoading = false;
				state.updateProfileError = action.payload;
				state.updateProfileSuccess = false;
			})
			.addCase(updateEmail.pending, (state) => {
				state.updateEmailLoading = true;
				state.updateEmailError = null;
				state.updateEmailSuccess = false;
			})
			.addCase(updateEmail.fulfilled, (state, action) => {
				state.updateEmailLoading = false;
				state.updateEmailSuccess = true;
				state.updateEmailError = null;
				// Cập nhật email trong profileData
				if (action.payload?.data && state.profileData) {
					state.profileData.email = action.payload.data.email;
				}
			})
			.addCase(uploadAvatar.pending, (state) => {
				state.uploadAvatarLoading = true;
				state.uploadAvatarError = null;
				state.uploadAvatarSuccess = false;
			})
			.addCase(uploadAvatar.fulfilled, (state, action) => {
				state.uploadAvatarLoading = false;
				state.uploadAvatarSuccess = true;
				state.uploadAvatarError = null;
				// Cập nhật avatarUrl trong profileData
				if (action.payload?.data && state.profileData) {
					state.profileData.avatarUrl = action.payload.data.avatarUrl;
				}
			})
			.addCase(uploadAvatar.rejected, (state, action) => {
				state.uploadAvatarLoading = false;
				state.uploadAvatarError = action.payload;
				state.uploadAvatarSuccess = false;
			})
			.addCase(confirmEmailChange.pending, (state) => {
				state.confirmEmailChangeLoading = true;
				state.confirmEmailChangeError = null;
				state.confirmEmailChangeSuccess = false;
			})
			.addCase(confirmEmailChange.fulfilled, (state, action) => {
				state.confirmEmailChangeLoading = false;
				state.confirmEmailChangeSuccess = true;
				state.confirmEmailChangeError = null;
			})
			.addCase(confirmEmailChange.rejected, (state, action) => {
				state.confirmEmailChangeLoading = false;
				state.confirmEmailChangeError = action.payload;
				state.confirmEmailChangeSuccess = false;
			});
	},
});

export const { loginSuccess, logout, clearForgotPasswordState, clearChangePasswordState, clearUpdateProfileState, clearUpdateEmailState, updateToken, syncAuthState } = authSlice.actions;
export default authSlice.reducer;
