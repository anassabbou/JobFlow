import { User } from '../types/User';

class AuthService {
  private readonly STORAGE_KEY = 'job_tracker_user';

  async getCurrentUser(): Promise<User | null> {
    const userData = localStorage.getItem(this.STORAGE_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  }

  async login(email: string, password: string): Promise<User> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check existing users
    const users = this.getStoredUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      throw new Error('User not found');
    }

    const storedPassword = localStorage.getItem(`password_${user.id}`);
    if (storedPassword !== password) {
      throw new Error('Invalid password');
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  async register(name: string, email: string, password: string): Promise<User> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user already exists
    const users = this.getStoredUsers();
    if (users.some(u => u.email === email)) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      createdAt: new Date().toISOString(),
    };

    // Store user and password
    users.push(newUser);
    localStorage.setItem('job_tracker_users', JSON.stringify(users));
    localStorage.setItem(`password_${newUser.id}`, password);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newUser));

    return newUser;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private getStoredUsers(): User[] {
    const usersData = localStorage.getItem('job_tracker_users');
    return usersData ? JSON.parse(usersData) : [];
  }
}

export const authService = new AuthService();
