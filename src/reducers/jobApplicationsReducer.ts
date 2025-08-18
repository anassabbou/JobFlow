import { JobApplication } from '../types/JobApplication';

const initialState: JobApplication[] = [];

export const jobApplicationsReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case 'ADD_APPLICATION':
      return [...state, action.payload];
    case 'UPDATE_APPLICATION':
      return state.map(app => 
        app.id === action.payload.id ? { ...app, ...action.payload } : app
      );
    case 'DELETE_APPLICATION':
      return state.filter(app => app.id !== action.payload.id);
    default:
      return state;
  }
};
