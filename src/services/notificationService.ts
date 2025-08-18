import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebase';
import { UserSettings } from '../types/Settings';
import { JobApplication } from '../types/JobApplication';

class NotificationService {
  private vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

  async requestPermission(): Promise<string | null> {
    if (!messaging) {
      console.warn('Firebase Messaging is not supported in this browser');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: this.vapidKey,
        });
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting notification permission:', error);
      return null;
    }
  }

  setupMessageListener(callback: (payload: any) => void): void {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      callback(payload);
      
      // Show notification if the app is in foreground
      if (payload.notification) {
        this.showLocalNotification(
          payload.notification.title || 'Job Application Update',
          payload.notification.body || '',
          payload.data
        );
      }
    });
  }

  showLocalNotification(title: string, body: string, data?: any): void {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/vite.svg',
          badge: '/vite.svg',
          data,
          actions: [
            {
              action: 'view',
              title: 'View Application',
            },
            {
              action: 'dismiss',
              title: 'Dismiss',
            },
          ],
        });
      });
    }
  }

  scheduleDeadlineReminders(applications: JobApplication[], settings: UserSettings): void {
    if (!settings.notifications.enabled || !settings.notifications.deadlineReminders) {
      return;
    }

    applications.forEach((app) => {
      // Check if application has any upcoming deadlines
      // This is a simplified example - in a real app, you'd have deadline fields
      const applicationDate = new Date(app.applicationDate);
      const daysSinceApplication = Math.floor(
        (Date.now() - applicationDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Remind about follow-ups after certain periods
      if (app.status === 'applied' && daysSinceApplication >= 7) {
        this.showLocalNotification(
          'Follow-up Reminder',
          `Consider following up on your application to ${app.company} for ${app.position}`,
          { applicationId: app.id, type: 'followup' }
        );
      }
    });
  }

  async saveNotificationToken(userId: string, token: string): Promise<void> {
    // In a real implementation, you'd save this token to Firestore
    // to send targeted notifications from your backend
    try {
      const response = await fetch('/api/save-notification-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, token }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save notification token');
      }
    } catch (error) {
      console.error('Error saving notification token:', error);
      // Fallback: save to localStorage
      localStorage.setItem(`notification_token_${userId}`, token);
    }
  }
}

export const notificationService = new NotificationService();