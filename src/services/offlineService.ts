import { JobApplication } from '../types/JobApplication';
import { UserSettings } from '../types/Settings';

interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: 'jobApplications' | 'userSettings';
  data: any;
  timestamp: number;
  userId: string;
}

class OfflineService {
  private readonly OFFLINE_QUEUE_KEY = 'offline_actions_queue';
  private readonly OFFLINE_DATA_KEY = 'offline_data';

  // Queue actions when offline
  queueAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): void {
    const queuedAction: OfflineAction = {
      ...action,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    const queue = this.getOfflineQueue();
    queue.push(queuedAction);
    localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  // Get queued actions
  getOfflineQueue(): OfflineAction[] {
    const queue = localStorage.getItem(this.OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  }

  // Clear processed actions
  clearProcessedActions(actionIds: string[]): void {
    const queue = this.getOfflineQueue();
    const filteredQueue = queue.filter(action => !actionIds.includes(action.id));
    localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(filteredQueue));
  }

  // Store data locally for offline access
  storeOfflineData(userId: string, applications: JobApplication[], settings?: UserSettings): void {
    const offlineData = {
      userId,
      applications,
      settings,
      lastSync: Date.now(),
    };
    localStorage.setItem(`${this.OFFLINE_DATA_KEY}_${userId}`, JSON.stringify(offlineData));
  }

  // Get offline data
  getOfflineData(userId: string): { applications: JobApplication[]; settings?: UserSettings } | null {
    const data = localStorage.getItem(`${this.OFFLINE_DATA_KEY}_${userId}`);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        applications: parsed.applications || [],
        settings: parsed.settings,
      };
    }
    return null;
  }

  // Check if device is online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Set up online/offline event listeners
  setupNetworkListeners(
    onOnline: () => void,
    onOffline: () => void
  ): () => void {
    const handleOnline = () => {
      console.log('Device is online');
      onOnline();
    };

    const handleOffline = () => {
      console.log('Device is offline');
      onOffline();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

export const offlineService = new OfflineService();