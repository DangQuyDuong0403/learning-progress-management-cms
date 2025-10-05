// src/redux/auth.js
import { createSlice } from '@reduxjs/toolkit';

//check nếu có user và token trong localStorage
const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

const initialState = {
	user: storedUser ? JSON.parse(storedUser) : null,
	token: storedToken,
	isAuthenticated: !!storedToken, // true nếu có token
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
	},
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
