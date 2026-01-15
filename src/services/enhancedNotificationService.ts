import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebase';
import { UserSettings } from '../types/Settings';
import { JobApplication } from '../types/JobApplication';

interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  icon?: string;
  badge?: string;
}

class EnhancedNotificationService {
  private vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  private notificationQueue: NotificationPayload[] = [];
  private readonly concoursReminderWindowDays = 7;

  private async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}firebase-messaging-sw.js`
      );
      return registration;
    } catch (error) {
      console.error('Failed to register Firebase messaging service worker:', error);
      return null;
    }
  }

  async requestPermission(): Promise<string | null> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return null;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission is denied in browser settings');
      return null;
    }

    if (!messaging) {
      console.warn('Firebase Messaging is not supported in this browser');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const serviceWorkerRegistration = await this.getServiceWorkerRegistration();
        const token = await getToken(messaging, {
          vapidKey: this.vapidKey,
          serviceWorkerRegistration: serviceWorkerRegistration ?? undefined,
        });
        console.log('FCM Token:', token);
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
        this.showLocalNotification({
          title: payload.notification.title || 'Job Application Update',
          body: payload.notification.body || '',
          data: payload.data,
          icon: '/vite.svg',
          badge: '/vite.svg',
        });
      }
    });
  }

  showLocalNotification(notification: NotificationPayload): void {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/vite.svg',
          badge: notification.badge || '/vite.svg',
          data: notification.data,
          requireInteraction: true,
          tag: 'job-tracker-notification',
        });
      });
    } else {
      // Fallback for browsers without service worker
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/vite.svg',
        data: notification.data,
      });
    }
  }

  // Schedule deadline reminders based on application data
  scheduleDeadlineReminders(applications: JobApplication[], settings: UserSettings): void {
    if (!settings.notifications.enabled || !settings.notifications.deadlineReminders) {
      return;
    }

    applications.forEach((app) => {
      this.checkApplicationDeadlines(app);
    });
  }

  private checkApplicationDeadlines(app: JobApplication): void {
    const applicationDate = new Date(app.applicationDate);
    const now = new Date();
    const daysSinceApplication = Math.floor(
      (now.getTime() - applicationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    this.checkConcoursReminder(app);

    // Different reminder logic based on status
    switch (app.status) {
      case 'applied':
        if (daysSinceApplication >= 7 && daysSinceApplication % 7 === 0) {
          this.showLocalNotification({
            title: 'Follow-up Reminder',
            body: `Consider following up on your application to ${app.company} for ${app.position}`,
            data: { applicationId: app.id, type: 'followup' },
          });
        }
        break;

      case 'interview':
        // Remind about interview preparation
        this.showLocalNotification({
          title: 'Interview Preparation',
          body: `Don't forget to prepare for your interview at ${app.company}`,
          data: { applicationId: app.id, type: 'interview-prep' },
        });
        break;

      case 'offer':
        // Remind about offer response deadline (assuming 1 week)
        if (daysSinceApplication >= 5) {
          this.showLocalNotification({
            title: 'Offer Response Reminder',
            body: `Remember to respond to the offer from ${app.company}`,
            data: { applicationId: app.id, type: 'offer-response' },
          });
        }
        break;
    }
  }

  private checkConcoursReminder(app: JobApplication): void {
    if (!app.offerDate || !app.concoursDate) return;

    const offerDate = new Date(app.offerDate);
    const concoursDate = new Date(app.concoursDate);
    const daysBetween = Math.ceil(
      (concoursDate.getTime() - offerDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysBetween >= 0 && daysBetween <= this.concoursReminderWindowDays) {
      this.showLocalNotification({
        title: 'Concours Date Reminder',
        body: `Your offer at ${app.company} is ${daysBetween} day${daysBetween === 1 ? '' : 's'} away from the concours date.`,
        data: { applicationId: app.id, type: 'concours-reminder' },
      });
    }
  }

  // Schedule periodic notifications based on user preferences
  schedulePeriodicNotifications(applications: JobApplication[], settings: UserSettings): void {
    if (!settings.notifications.enabled) return;

    const { frequency } = settings.notifications;
    let intervalMs: number;

    switch (frequency) {
      case 'immediate':
        return; // No periodic notifications for immediate
      case 'daily':
        intervalMs = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'weekly':
        intervalMs = 7 * 24 * 60 * 60 * 1000; // 7 days
        break;
      default:
        return;
    }

    // Clear existing interval
    const existingInterval = localStorage.getItem('notification_interval');
    if (existingInterval) {
      clearInterval(parseInt(existingInterval));
    }

    // Set new interval
    const intervalId = setInterval(() => {
      this.sendPeriodicSummary(applications);
    }, intervalMs);

    localStorage.setItem('notification_interval', intervalId.toString());
  }

  private sendPeriodicSummary(applications: JobApplication[]): void {
    const pendingApplications = applications.filter(app => 
      app.status === 'applied' || app.status === 'interview'
    );

    if (pendingApplications.length > 0) {
      this.showLocalNotification({
        title: 'Application Summary',
        body: `You have ${pendingApplications.length} pending applications to follow up on`,
        data: { type: 'summary', count: pendingApplications.length },
      });
    }
  }

  // Queue notifications for offline scenarios
  queueNotification(notification: NotificationPayload): void {
    this.notificationQueue.push(notification);
    localStorage.setItem('notification_queue', JSON.stringify(this.notificationQueue));
  }

  // Process queued notifications when back online
  processQueuedNotifications(): void {
    const queuedNotifications = localStorage.getItem('notification_queue');
    if (queuedNotifications) {
      const notifications: NotificationPayload[] = JSON.parse(queuedNotifications);
      
      notifications.forEach(notification => {
        this.showLocalNotification(notification);
      });

      // Clear the queue
      this.notificationQueue = [];
      localStorage.removeItem('notification_queue');
    }
  }

  async saveNotificationToken(userId: string, token: string): Promise<void> {
    try {
      // In a real implementation, save to Firestore
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

  // Test notification functionality
  async testNotification(): Promise<void> {
    this.showLocalNotification({
      title: 'Test Notification',
      body: 'Your notification system is working correctly!',
      data: { type: 'test' },
    });
  }

  // Clean up intervals and listeners
  cleanup(): void {
    const intervalId = localStorage.getItem('notification_interval');
    if (intervalId) {
      clearInterval(parseInt(intervalId));
      localStorage.removeItem('notification_interval');
    }
  }
}

export const enhancedNotificationService = new EnhancedNotificationService();
