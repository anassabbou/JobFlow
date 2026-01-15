import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserSettings } from '../types/Settings';

class SettingsService {
  private readonly COLLECTION_NAME = 'userSettings';

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const docRef = doc(db, this.COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() || docSnap.data().createdAt,
        updatedAt: docSnap.data().updatedAt?.toDate?.()?.toISOString() || docSnap.data().updatedAt,
      } as UserSettings;
    }
    
    return null;
  }

  async createDefaultSettings(userId: string): Promise<UserSettings> {
    const defaultSettings: UserSettings = {
      id: userId,
      userId,
      theme: 'system',
      notifications: {
        enabled: true,
        deadlineReminders: true,
        statusUpdates: true,
        frequency: 'daily',
        reminderDays: 3,
      },
      discordNotifications: {
        enabled: false,
        webhookUrl: '',
      },
      preferences: {
        defaultView: 'grid',
        sortBy: 'date',
        sortOrder: 'desc',
        showStats: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, this.COLLECTION_NAME, userId), {
      ...defaultSettings,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return defaultSettings;
  }

  async updateUserSettings(
    userId: string, 
    updates: Partial<Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const docRef = doc(db, this.COLLECTION_NAME, userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  // Real-time subscription for settings
  subscribeToSettings(
    userId: string, 
    callback: (settings: UserSettings | null) => void
  ): () => void {
    const docRef = doc(db, this.COLLECTION_NAME, userId);
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const settings = {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() || docSnap.data().createdAt,
          updatedAt: docSnap.data().updatedAt?.toDate?.()?.toISOString() || docSnap.data().updatedAt,
        } as UserSettings;
        callback(settings);
      } else {
        callback(null);
      }
    });
  }
}

export const settingsService = new SettingsService();
