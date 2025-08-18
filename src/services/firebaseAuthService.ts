import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types/User';

class FirebaseAuthService {
  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        unsubscribe();
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            resolve(userDoc.data() as User);
          } else {
            // Create user document if it doesn't exist
            const userData: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
            resolve(userData);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    
    throw new Error('User data not found');
  }

  async register(name: string, email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Update Firebase Auth profile
    await updateProfile(firebaseUser, { displayName: name });
    
    // Create user document in Firestore
    const userData: User = {
      id: firebaseUser.uid,
      name,
      email,
      createdAt: new Date().toISOString(),
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    
    return userData;
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }
}

export const firebaseAuthService = new FirebaseAuthService();
