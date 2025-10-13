import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import levelManagementApi from '../apis/backend/levelManagement';

// Mock API functions - Replace with actual API calls
const mockLevels = [
  {
    id: 1,
    name: 'Little Explorer 1',
    code: 'LE1',
    description: 'Basic English for young learners aged 3-5',
    difficulty: 'beginner',
    duration: 12,
    minAge: 3,
    maxAge: 5,
    status: 'active',
    objectives: 'Introduce basic English vocabulary and simple phrases',
    prerequisites: 'No prior English knowledge required',
    learningOutcomes: 'Students will learn basic greetings, colors, numbers 1-10, and simple vocabulary',
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 2,
    name: 'Raising Star 1',
    code: 'RS1',
    description: 'Elementary English for children aged 6-8',
    difficulty: 'beginner',
    duration: 16,
    minAge: 6,
    maxAge: 8,
    status: 'active',
    objectives: 'Build foundation English skills through interactive activities',
    prerequisites: 'Basic understanding of English alphabet',
    learningOutcomes: 'Students will learn basic grammar, expand vocabulary, and develop reading skills',
    createdAt: '2024-01-20T08:00:00Z',
  },
  {
    id: 3,
    name: 'A2 KET Level 1',
    code: 'A2KET1',
    description: 'Cambridge A2 Key English Test preparation level 1',
    difficulty: 'intermediate',
    duration: 20,
    minAge: 10,
    maxAge: 14,
    status: 'active',
    objectives: 'Prepare students for Cambridge A2 KET examination',
    prerequisites: 'Basic English knowledge equivalent to A1 level',
    learningOutcomes: 'Students will master A2 level grammar, vocabulary, and exam techniques',
    createdAt: '2024-02-01T08:00:00Z',
  },
  {
    id: 4,
    name: 'B1 PET Level 1',
    code: 'B1PET1',
    description: 'Cambridge B1 Preliminary English Test preparation level 1',
    difficulty: 'intermediate',
    duration: 24,
    minAge: 12,
    maxAge: 16,
    status: 'active',
    objectives: 'Prepare students for Cambridge B1 PET examination',
    prerequisites: 'A2 level English proficiency',
    learningOutcomes: 'Students will achieve B1 level competency in all four skills',
    createdAt: '2024-02-10T08:00:00Z',
  },
  {
    id: 5,
    name: 'B2 PET Level 1',
    code: 'B2PET1',
    description: 'Cambridge B2 First Certificate in English preparation level 1',
    difficulty: 'advanced',
    duration: 28,
    minAge: 14,
    maxAge: 18,
    status: 'inactive',
    objectives: 'Prepare students for Cambridge B2 FCE examination',
    prerequisites: 'B1 level English proficiency',
    learningOutcomes: 'Students will master B2 level English for academic and professional use',
    createdAt: '2024-02-15T08:00:00Z',
  },
];

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Async thunks
export const fetchLevels = createAsyncThunk(
  'level/fetchLevels',
  async (_, { rejectWithValue }) => {
    try {
      await delay(1000); // Simulate API call
      return mockLevels;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createLevel = createAsyncThunk(
  'level/createLevel',
  async (levelData, { rejectWithValue }) => {
    try {
      console.log('Creating level with data:', levelData);
      const response = await levelManagementApi.createLevel(levelData);
      console.log('Create level response:', response);
      return response;
    } catch (error) {
      console.error('Error creating level:', error);
      return rejectWithValue(error.message || 'Failed to create level');
    }
  }
);

export const updateLevel = createAsyncThunk(
  'level/updateLevel',
  async ({ id, ...updateData }, { rejectWithValue }) => {
    try {
      console.log('Updating level with ID:', id, 'Data:', updateData);
      const response = await levelManagementApi.updateLevel(id, updateData);
      console.log('Update level response:', response);
      return response;
    } catch (error) {
      console.error('Error updating level:', error);
      return rejectWithValue(error.message || 'Failed to update level');
    }
  }
);

export const deleteLevel = createAsyncThunk(
  'level/deleteLevel',
  async (id, { rejectWithValue }) => {
    try {
      await delay(800);
      const index = mockLevels.findIndex(level => level.id === id);
      if (index !== -1) {
        mockLevels.splice(index, 1);
        return id;
      }
      throw new Error('Level not found');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateLevelStatus = createAsyncThunk(
  'level/updateLevelStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      await delay(500);
      const index = mockLevels.findIndex(level => level.id === id);
      if (index !== -1) {
        mockLevels[index].status = status;
        return mockLevels[index];
      }
      throw new Error('Level not found');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  levels: [],
  loading: false,
  error: null,
  selectedLevel: null,
};

// Slice
const levelSlice = createSlice({
  name: 'level',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    selectLevel: (state, action) => {
      state.selectedLevel = action.payload;
    },
    clearSelectedLevel: (state) => {
      state.selectedLevel = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch levels
      .addCase(fetchLevels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLevels.fulfilled, (state, action) => {
        state.loading = false;
        state.levels = action.payload;
      })
      .addCase(fetchLevels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create level
      .addCase(createLevel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLevel.fulfilled, (state, action) => {
        state.loading = false;
        state.levels.push(action.payload);
      })
      .addCase(createLevel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update level
      .addCase(updateLevel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLevel.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.levels.findIndex(level => level.id === action.payload.id);
        if (index !== -1) {
          state.levels[index] = action.payload;
        }
      })
      .addCase(updateLevel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete level
      .addCase(deleteLevel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLevel.fulfilled, (state, action) => {
        state.loading = false;
        state.levels = state.levels.filter(level => level.id !== action.payload);
      })
      .addCase(deleteLevel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update level status
      .addCase(updateLevelStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLevelStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.levels.findIndex(level => level.id === action.payload.id);
        if (index !== -1) {
          state.levels[index] = action.payload;
        }
      })
      .addCase(updateLevelStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, selectLevel, clearSelectedLevel } = levelSlice.actions;
export default levelSlice.reducer;
