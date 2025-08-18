import { createStore, combineReducers } from 'redux';
import { jobApplicationsReducer } from './reducers/jobApplicationsReducer';
import { userReducer } from './reducers/userReducer';

const rootReducer = combineReducers({
  jobApplications: jobApplicationsReducer,
  user: userReducer,
});

const store = createStore(rootReducer);

export default store;
