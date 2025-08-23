import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBkDUyt8SB3YOGK2tJ41EBt50wS_ii5twM",
  authDomain: "jobflow-8bf97.firebaseapp.com",
  projectId: "jobflow-8bf97",
  storageBucket: "jobflow-8bf97.firebasestorage.app",
  messagingSenderId: "670232247500",
  appId: "1:670232247500:web:ffe17002807f77aba59669"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);

// Initialize Auth with AsyncStorage persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export default app;