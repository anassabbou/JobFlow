import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { JobApplication } from '../types/JobApplication';
import { offlineService } from './offlineService';

class EnhancedJobApplicationService {
  private readonly COLLECTION_NAME = 'jobApplications';
  private unsubscribeCallbacks: Map<string, () => void> = new Map();

  async getApplications(userId: string): Promise<JobApplication[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const applications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      })) as JobApplication[];

      // Store for offline access
      offlineService.storeOfflineData(userId, applications);
      
      return applications;
    } catch (error) {
      console.error('Error fetching applications, trying offline data:', error);
      
      // Fallback to offline data
      const offlineData = offlineService.getOfflineData(userId);
      return offlineData?.applications || [];
    }
  }

  async createApplication(
    userId: string, 
    applicationData: Omit<JobApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<JobApplication> {
    const newApplication: JobApplication = {
      id: `temp_${Date.now()}`,
      ...applicationData,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!offlineService.isOnline()) {
      // Queue for later sync
      offlineService.queueAction({
        type: 'create',
        collection: 'jobApplications',
        data: applicationData,
        userId,
      });
      
      return newApplication;
    }

    try {
      const now = Timestamp.now();
      const docData = {
        ...applicationData,
        userId,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), docData);
      
      return {
        id: docRef.id,
        ...applicationData,
        userId,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      };
    } catch (error) {
      console.error('Error creating application:', error);
      
      // Queue for later sync
      offlineService.queueAction({
        type: 'create',
        collection: 'jobApplications',
        data: applicationData,
        userId,
      });
      
      return newApplication;
    }
  }

  async updateApplication(id: string, updates: Partial<JobApplication>): Promise<JobApplication> {
    if (!offlineService.isOnline()) {
      // Queue for later sync
      offlineService.queueAction({
        type: 'update',
        collection: 'jobApplications',
        data: { id, ...updates },
        userId: updates.userId || '',
      });
      
      return { ...updates, id, updatedAt: new Date().toISOString() } as JobApplication;
    }

    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };
      
      await updateDoc(docRef, updateData);
      
      return {
        ...updates,
        id,
        updatedAt: new Date().toISOString(),
      } as JobApplication;
    } catch (error) {
      console.error('Error updating application:', error);
      
      // Queue for later sync
      offlineService.queueAction({
        type: 'update',
        collection: 'jobApplications',
        data: { id, ...updates },
        userId: updates.userId || '',
      });
      
      return { ...updates, id, updatedAt: new Date().toISOString() } as JobApplication;
    }
  }

  async deleteApplication(id: string, userId: string): Promise<void> {
    if (!offlineService.isOnline()) {
      // Queue for later sync
      offlineService.queueAction({
        type: 'delete',
        collection: 'jobApplications',
        data: { id },
        userId,
      });
      return;
    }

    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting application:', error);
      
      // Queue for later sync
      offlineService.queueAction({
        type: 'delete',
        collection: 'jobApplications',
        data: { id },
        userId,
      });
    }
  }

  // Real-time subscription with offline support
  subscribeToApplications(
    userId: string, 
    callback: (applications: JobApplication[]) => void
  ): () => void {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const applications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        })) as JobApplication[];
        
        // Store for offline access
        offlineService.storeOfflineData(userId, applications);
        callback(applications);
      },
      (error) => {
        console.error('Error in real-time subscription:', error);
        
        // Fallback to offline data
        const offlineData = offlineService.getOfflineData(userId);
        if (offlineData?.applications) {
          callback(offlineData.applications);
        }
      }
    );

    this.unsubscribeCallbacks.set(userId, unsubscribe);
    return unsubscribe;
  }

  // Sync offline actions when back online
  async syncOfflineActions(): Promise<void> {
    if (!offlineService.isOnline()) return;

    const queue = offlineService.getOfflineQueue();
    const processedIds: string[] = [];

    for (const action of queue) {
      try {
        switch (action.type) {
          case 'create':
            await this.createApplication(action.userId, action.data);
            break;
          case 'update':
            await this.updateApplication(action.data.id, action.data);
            break;
          case 'delete':
            await this.deleteApplication(action.data.id, action.userId);
            break;
        }
        processedIds.push(action.id);
      } catch (error) {
        console.error('Error syncing action:', action, error);
      }
    }

    // Clear successfully processed actions
    if (processedIds.length > 0) {
      offlineService.clearProcessedActions(processedIds);
    }
  }

  // Clean up subscriptions
  unsubscribeAll(): void {
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this.unsubscribeCallbacks.clear();
  }
}

export const enhancedJobApplicationService = new EnhancedJobApplicationService();