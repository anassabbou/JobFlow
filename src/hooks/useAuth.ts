import { useState, useEffect } from 'react';
import { User } from '../types/User';
import { firebaseAuthService } from '../services/firebaseAuthService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await firebaseAuthService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const user = await firebaseAuthService.login(email, password);
    setUser(user);
  };

  const register = async (name: string, email: string, password: string) => {
    const user = await firebaseAuthService.register(name, email, password);
    setUser(user);
  };

  const logout = async () => {
    await firebaseAuthService.logout();
    setUser(null);
  };

  return {
    user,
    login,
    register,
    logout,
    loading,
  };
};