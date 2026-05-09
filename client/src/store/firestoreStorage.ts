import { StateStorage } from 'zustand/middleware';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

// Generate or retrieve a persistent session ID from localStorage
const getSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  let sessionId = localStorage.getItem('bestlink_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('bestlink_session_id', sessionId);
  }
  return sessionId;
};

export const firestoreStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const sessionId = getSessionId();
      const docRef = doc(db, 'app_state', `${sessionId}_${name}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().value as string;
      }
      return null;
    } catch (error) {
      console.error('Firestore getItem error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const sessionId = getSessionId();
      const docRef = doc(db, 'app_state', `${sessionId}_${name}`);
      await setDoc(docRef, { value, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Firestore setItem error:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const sessionId = getSessionId();
      const docRef = doc(db, 'app_state', `${sessionId}_${name}`);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Firestore removeItem error:', error);
    }
  }
};
