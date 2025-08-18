import { JobApplication } from '../types/JobApplication';

class JobApplicationService {
  private readonly STORAGE_KEY = 'job_applications';

  async getApplications(userId: string): Promise<JobApplication[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const allApplications = this.getStoredApplications();
    return allApplications.filter(app => app.userId === userId);
  }

  async createApplication(userId: string, applicationData: Omit<JobApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<JobApplication> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const newApplication: JobApplication = {
      ...applicationData,
      id: `app_${Date.now()}`,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allApplications = this.getStoredApplications();
    allApplications.push(newApplication);
    this.saveApplications(allApplications);

    return newApplication;
  }

  async updateApplication(id: string, updates: Partial<JobApplication>): Promise<JobApplication> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const allApplications = this.getStoredApplications();
    const index = allApplications.findIndex(app => app.id === id);
    
    if (index === -1) {
      throw new Error('Application not found');
    }

    const updatedApplication = {
      ...allApplications[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    allApplications[index] = updatedApplication;
    this.saveApplications(allApplications);

    return updatedApplication;
  }

  async deleteApplication(id: string): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const allApplications = this.getStoredApplications();
    const filteredApplications = allApplications.filter(app => app.id !== id);
    this.saveApplications(filteredApplications);
  }

  private getStoredApplications(): JobApplication[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveApplications(applications: JobApplication[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(applications));
  }
}

export const jobApplicationService = new JobApplicationService();