// src/redux/rootReducer.js
import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./auth";
import levelReducer from "./level";
import syllabusReducer from "./syllabus";

const rootReducer = combineReducers({
  auth: authReducer,
  level: levelReducer,
  syllabus: syllabusReducer,
});

export default rootReducer;
