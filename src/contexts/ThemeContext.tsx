import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { settingsService } from '../services/settingsService';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>('system');
  const [loading, setLoading] = useState(true);

  // Get actual theme based on system preference
  const getActualTheme = (themePreference: Theme): 'light' | 'dark' => {
    if (themePreference === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themePreference;
  };

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => 
    getActualTheme(theme)
  );

  // Load theme from Firebase when user changes
  useEffect(() => {
    const loadTheme = async () => {
      if (user) {
        try {
          const settings = await settingsService.getUserSettings(user.id);
          if (settings) {
            setThemeState(settings.theme);
          }
        } catch (error) {
          console.error('Failed to load theme:', error);
        }
      } else {
        // Load from localStorage for non-authenticated users
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
          setThemeState(savedTheme);
        }
      }
      setLoading(false);
    };

    loadTheme();
  }, [user]);

  // Update actual theme when theme preference changes
  useEffect(() => {
    const newActualTheme = getActualTheme(theme);
    setActualTheme(newActualTheme);

    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newActualTheme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setActualTheme(getActualTheme('system'));
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);

    if (user) {
      try {
        await settingsService.updateUserSettings(user.id, { theme: newTheme });
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    } else {
      localStorage.setItem('theme', newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};