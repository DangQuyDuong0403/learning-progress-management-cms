// src/redux/auth.js
import { createSlice } from '@reduxjs/toolkit';

//check nếu có user và token trong localStorage
const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

const initialState = {
	user: null,
	token: null,
	isAuthenticated: !!storedToken, // true nếu có token
};

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		loginSuccess: (state, action) => {
			state.user = action.payload.user;
			state.token = action.payload.token;
			state.isAuthenticated = true;
			// lưu user và token vào localStr hoặc có thể lưu = sessionStr
			localStorage.setItem('user', JSON.stringify(action.payload.user));
			localStorage.setItem('token', action.payload.token);
		},
		logout: (state) => {
			state.user = null;
			state.token = null;
			state.isAuthenticated = false;
			// Xoá khỏi localStorage
			localStorage.removeItem('user');
			localStorage.removeItem('token');
		},
	},
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
