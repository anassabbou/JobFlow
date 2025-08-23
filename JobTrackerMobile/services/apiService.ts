import { JobApplication } from '../types/JobApplication';
import { User } from '../types/User';

const API_BASE_URL = 'https://your-web-app-domain.com/api'; // Replace with your actual API URL

class ApiService {
  private token: string | null = null;

  setAuthToken(token: string) {
    this.token = token;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Auth methods
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  // Job Applications methods
  async getApplications(userId: string): Promise<JobApplication[]> {
    return this.makeRequest(`/applications?userId=${userId}`);
  }

  async createApplication(applicationData: Omit<JobApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<JobApplication> {
    return this.makeRequest('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  async updateApplication(id: string, updates: Partial<JobApplication>): Promise<JobApplication> {
    return this.makeRequest(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteApplication(id: string): Promise<void> {
    return this.makeRequest(`/applications/${id}`, {
      method: 'DELETE',
    });
  }

  // Mock data for development (remove when connecting to real API)
  async getMockApplications(): Promise<JobApplication[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      {
        id: '1',
        userId: 'user1',
        company: 'Google',
        position: 'Software Engineer',
        location: 'Mountain View, CA',
        status: 'interview',
        applicationDate: '2024-01-15',
        notes: 'Applied through referral',
        salary: '$120,000 - $150,000',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        userId: 'user1',
        company: 'Microsoft',
        position: 'Frontend Developer',
        location: 'Seattle, WA',
        status: 'applied',
        applicationDate: '2024-01-10',
        notes: 'Submitted via company website',
        salary: '$110,000 - $140,000',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-10T09:00:00Z',
      },
      {
        id: '3',
        userId: 'user1',
        company: 'Apple',
        position: 'iOS Developer',
        location: 'Cupertino, CA',
        status: 'offer',
        applicationDate: '2024-01-05',
        notes: 'Great interview experience',
        salary: '$130,000 - $160,000',
        createdAt: '2024-01-05T14:00:00Z',
        updatedAt: '2024-01-05T14:00:00Z',
      },
    ];
  }
}

export const apiService = new ApiService();