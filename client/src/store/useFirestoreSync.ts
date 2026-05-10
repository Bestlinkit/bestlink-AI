import { useEffect, useRef, useState } from 'react';
import { useAppStore } from './useAppStore';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export type SyncStatus = 'ONLINE' | 'OFFLINE' | 'RECOVERING' | 'ERROR' | 'PERMISSION_DENIED';

const getSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('bestlink_session_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(7);
    localStorage.setItem('bestlink_session_id', id);
  }
  return id;
};

export function useFirestoreSync(isAuthReady: boolean = false) {
  // 🚨 MVP RESET: Firebase Sync Disabled for stability
  // Local storage (zustand persist) is used as the primary source of truth.
  return { status: 'OFFLINE' as SyncStatus };
}
