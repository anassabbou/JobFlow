import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/User';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        apiService.setAuthToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // For development, use mock login
      const mockUser: User = {
        id: 'user1',
        name: 'John Doe',
        email: email,
        createdAt: new Date().toISOString(),
      };
      
      setUser(mockUser);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('token', 'mock-token');
      apiService.setAuthToken('mock-token');
      
      // Uncomment when connecting to real API:
      // const { user, token } = await apiService.login(email, password);
      // setUser(user);
      // await AsyncStorage.setItem('user', JSON.stringify(user));
      // await AsyncStorage.setItem('token', token);
      // apiService.setAuthToken(token);
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // For development, use mock register
      const mockUser: User = {
        id: `user_${Date.now()}`,
        name,
        email,
        createdAt: new Date().toISOString(),
      };
      
      setUser(mockUser);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('token', 'mock-token');
      apiService.setAuthToken('mock-token');
      
      // Uncomment when connecting to real API:
      // const { user, token } = await apiService.register(name, email, password);
      // setUser(user);
      // await AsyncStorage.setItem('user', JSON.stringify(user));
      // await AsyncStorage.setItem('token', token);
      // apiService.setAuthToken(token);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      apiService.setAuthToken('');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};