import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { Provider } from 'react-redux';
import store from './store';
import './index.css';
import { notificationService } from './services/notificationService';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
);


if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }

    try {
      const token = await notificationService.requestPermission();
      if (token) {
        console.log('Notification token:', token);
      }
    } catch (error) {
      console.error('Failed to get notification permission:', error);
    }
  });
}
