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
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { JobApplication } from '../types/JobApplication';

class FirebaseJobApplicationService {
  private readonly COLLECTION_NAME = 'jobApplications';

  async getApplications(userId: string): Promise<JobApplication[]> {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as JobApplication[];
  }

  async createApplication(
    userId: string, 
    applicationData: Omit<JobApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<JobApplication> {
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
  }

  async updateApplication(id: string, updates: Partial<JobApplication>): Promise<JobApplication> {
    const docRef = doc(db, this.COLLECTION_NAME, id);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(docRef, updateData);
    
    // Return updated application (in a real app, you might want to fetch the updated doc)
    return {
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    } as JobApplication;
  }

  async deleteApplication(id: string): Promise<void> {
    const docRef = doc(db, this.COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }

  // Real-time subscription for applications
  subscribeToApplications(
    userId: string, 
    callback: (applications: JobApplication[]) => void
  ): () => void {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const applications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      })) as JobApplication[];
      
      callback(applications);
    });
  }
}

export const firebaseJobApplicationService = new FirebaseJobApplicationService();