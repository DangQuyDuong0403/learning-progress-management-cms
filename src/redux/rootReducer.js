// src/redux/rootReducer.js
import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./auth";
import levelReducer from "./level";

const rootReducer = combineReducers({
  auth: authReducer,
  level: levelReducer,
});

export default rootReducer;
