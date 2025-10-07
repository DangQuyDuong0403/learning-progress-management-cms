// src/redux/auth.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authApi from '../apis/backend/auth';

//check nếu có user và token trong localStorage
const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

// Async thunk for forgot password
export const forgotPassword = createAsyncThunk(
	'/auth/forgotPassword',
	async (username, { rejectWithValue }) => {
		try {
			const response = await authApi.forgotPassword({ username });
			return response;
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

const initialState = {
	user: storedUser ? JSON.parse(storedUser) : null,
	token: storedToken,
	refreshToken: localStorage.getItem('refreshToken'),
	isAuthenticated: !!storedToken, // true nếu có token
	forgotPasswordLoading: false,
	forgotPasswordError: null,
	forgotPasswordSuccess: false,
	refreshTokenLoading: false,
	refreshTokenError: null,
	logoutLoading: false,
	logoutError: null,
};

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		loginSuccess: (state, action) => {
			const { accessToken, refreshToken, username, role } = action.payload;
			state.user = { username, role };
			state.token = accessToken;
			state.refreshToken = refreshToken;
			state.isAuthenticated = true;
			// lưu user và token vào localStorage
			localStorage.setItem('user', JSON.stringify({ username, role }));
			localStorage.setItem('token', accessToken);
			localStorage.setItem('refreshToken', refreshToken);
		},
		logout: (state) => {
			state.user = null;
			state.token = null;
			state.refreshToken = null;
			state.isAuthenticated = false;
			// Xoá khỏi localStorage
			localStorage.removeItem('user');
			localStorage.removeItem('token');
			localStorage.removeItem('refreshToken');
		},
		clearForgotPasswordState: (state) => {
			state.forgotPasswordLoading = false;
			state.forgotPasswordError = null;
			state.forgotPasswordSuccess = false;
		},
		updateToken: (state, action) => {
			state.token = action.payload;
			localStorage.setItem('token', action.payload);
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(forgotPassword.pending, (state) => {
				state.forgotPasswordLoading = true;
				state.forgotPasswordError = null;
				state.forgotPasswordSuccess = false;
			})
			.addCase(forgotPassword.fulfilled, (state, action) => {
				state.forgotPasswordLoading = false;
				state.forgotPasswordSuccess = true;
				state.forgotPasswordError = null;
			})
			.addCase(forgotPassword.rejected, (state, action) => {
				state.forgotPasswordLoading = false;
				state.forgotPasswordError = action.payload;
				state.forgotPasswordSuccess = false;
			})
			.addCase(refreshToken.pending, (state) => {
				state.refreshTokenLoading = true;
				state.refreshTokenError = null;
			})
			.addCase(refreshToken.fulfilled, (state, action) => {
				state.refreshTokenLoading = false;
				state.refreshTokenError = null;
				// Cập nhật token mới
				if (action.payload?.accessToken) {
					state.token = action.payload.accessToken;
					localStorage.setItem('token', action.payload.accessToken);
				}
			})
			.addCase(refreshToken.rejected, (state, action) => {
				state.refreshTokenLoading = false;
				state.refreshTokenError = action.payload;
				// Nếu refresh token không hợp lệ, đăng xuất người dùng
				state.user = null;
				state.token = null;
				state.refreshToken = null;
				state.isAuthenticated = false;
				localStorage.removeItem('user');
				localStorage.removeItem('token');
				localStorage.removeItem('refreshToken');
			})
			.addCase(logoutApi.pending, (state) => {
				state.logoutLoading = true;
				state.logoutError = null;
			})
			.addCase(logoutApi.fulfilled, (state) => {
				state.logoutLoading = false;
				state.logoutError = null;
				// Xóa thông tin user và token
				state.user = null;
				state.token = null;
				state.refreshToken = null;
				state.isAuthenticated = false;
				localStorage.removeItem('user');
				localStorage.removeItem('token');
				localStorage.removeItem('refreshToken');
			})
			.addCase(logoutApi.rejected, (state, action) => {
				state.logoutLoading = false;
				state.logoutError = action.payload;
				// Vẫn xóa thông tin user và token dù API lỗi
				state.user = null;
				state.token = null;
				state.refreshToken = null;
				state.isAuthenticated = false;
				localStorage.removeItem('user');
				localStorage.removeItem('token');
				localStorage.removeItem('refreshToken');
			});
	},
});

export const { loginSuccess, logout, clearForgotPasswordState, updateToken } = authSlice.actions;
export default authSlice.reducer;
