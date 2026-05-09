import { useEffect, useRef } from 'react';
import { useAppStore } from './useAppStore';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const getSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  return localStorage.getItem('bestlink_session_id') || 'session_default';
};

export function useFirestoreSync() {
  const isHydrated = useAppStore(state => state.workspaces.length > 0);
  const lastSyncTimeRef = useRef<number>(Date.now());
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isHydrated) return;

    const sessionId = getSessionId();
    const docRef = doc(db, 'app_state', `${sessionId}_bestlink-storage`);

    // 1. Listen for local Zustand state changes and push to Firestore
    const unsubStore = useAppStore.subscribe((state) => {
      if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
      
      pendingUpdateRef.current = setTimeout(async () => {
        try {
          const payload = {
            state: {
              workspaces: state.workspaces,
              activeWorkspaceId: state.activeWorkspaceId,
              theme: state.theme,
              activeAgentId: state.activeAgentId
            },
            version: 0
          };
          lastSyncTimeRef.current = Date.now();
          await setDoc(docRef, { value: JSON.stringify(payload), updatedAt: new Date().toISOString() });
        } catch (error) {
          console.error("Failed to upload state to Firestore:", error);
        }
      }, 1000); // 1-second debounce
    });

    // 2. Listen for remote Firestore changes and merge down
    const unsubFirestore = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        try {
          // Ignore remote snapshots that just echoed our own recent upload
          if (Date.now() - lastSyncTimeRef.current < 2000) return;

          const rawData = docSnap.data().value as string;
          const parsed = JSON.parse(rawData);
          
          if (parsed && parsed.state && parsed.state.workspaces) {
            const currentState = useAppStore.getState();
            const cloudWorkspaces = parsed.state.workspaces;
            const activeId = currentState.activeWorkspaceId || parsed.state.activeWorkspaceId;
            
            const localActive = currentState.workspaces.find(w => w.id === activeId);
            const cloudActive = cloudWorkspaces.find((w: any) => w.id === activeId);
            
            if (!localActive || (cloudActive && cloudActive.lastActive > localActive.lastActive)) {
               useAppStore.setState({ 
                 workspaces: cloudWorkspaces,
                 activeWorkspaceId: parsed.state.activeWorkspaceId || currentState.activeWorkspaceId
               });
            }
          }
        } catch (error) {
          console.error("Failed to parse Firestore snapshot:", error);
        }
      }
    });

    return () => {
      unsubStore();
      unsubFirestore();
      if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
    };
  }, [isHydrated]);
}
