export type JobApplicationStatus = 'applied' | 'interview' | 'offer' | 'rejected';

export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  position: string;
  location: string;
  status: JobApplicationStatus;
  applicationDate: string;
  offerDate?: string;
  concoursDate?: string;
  notes?: string;
  salary?: string;
  jobUrl?: string;
  contactPerson?: string;
  contactEmail?: string;
  createdAt: string;
  updatedAt: string;
}
