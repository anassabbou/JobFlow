import { JobApplication } from '../types/JobApplication';

export const addApplication = (application: JobApplication) => ({
  type: 'ADD_APPLICATION',
  payload: application,
});

export const updateApplication = (application: JobApplication) => ({
  type: 'UPDATE_APPLICATION',
  payload: application,
});

export const deleteApplication = (id: string) => ({
  type: 'DELETE_APPLICATION',
  payload: { id },
});
