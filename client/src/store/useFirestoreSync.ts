import { useEffect, useRef } from 'react';
import { useAppStore } from './useAppStore';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

const getSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  // Use a stable ID per device/browser
  let id = localStorage.getItem('bestlink_session_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(7);
    localStorage.setItem('bestlink_session_id', id);
  }
  return id;
};

export function useFirestoreSync() {
  const isHydrated = useAppStore(state => !!state.activeWorkspaceId || state.workspaces.length > 0);
  const lastSyncTimeRef = useRef<number>(0);
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sessionId = getSessionId();
    const docRef = doc(db, 'app_state', `${sessionId}_bestlink-storage`);

    // 1. Initial Load from Firestore (Priority over LocalStorage)
    const initLoad = async () => {
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const rawData = docSnap.data().value as string;
          const parsed = JSON.parse(rawData);
          if (parsed?.state?.workspaces) {
            console.log("[FirestoreSync] Restoring state from cloud...");
            useAppStore.setState({
              workspaces: parsed.state.workspaces,
              activeWorkspaceId: parsed.state.activeWorkspaceId,
              theme: parsed.state.theme || 'dark',
              activeAgentId: parsed.state.activeAgentId || 'designer'
            });
            lastSyncTimeRef.current = Date.now();
          }
        }
      } catch (err) {
        console.error("[FirestoreSync] Initial load failed:", err);
      }
    };

    initLoad();

    // 2. Continuous Sync (Local -> Firestore)
    const unsubStore = useAppStore.subscribe((state) => {
      // Don't push if we just pulled from cloud
      if (Date.now() - lastSyncTimeRef.current < 2000) return;

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
            version: Date.now()
          };
          await setDoc(docRef, { 
            value: JSON.stringify(payload), 
            updatedAt: new Date().toISOString() 
          });
          console.log("[FirestoreSync] Cloud sync complete.");
        } catch (error) {
          console.warn("[FirestoreSync] Sync failed:", error);
        }
      }, 2000); // 2-second debounce to avoid rate limits
    });

    // 3. Remote Updates (Firestore -> Local)
    const unsubFirestore = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        try {
          // Ignore if we just pushed
          if (Date.now() - lastSyncTimeRef.current < 3000) return;

          const rawData = docSnap.data().value as string;
          const parsed = JSON.parse(rawData);
          
          if (parsed?.state?.workspaces) {
            const currentState = useAppStore.getState();
            const cloudWorkspaces = parsed.state.workspaces;
            
            // Basic conflict resolution: only update if cloud is newer or local is empty
            if (currentState.workspaces.length === 0 || parsed.version > (currentState.workspaces[0]?.lastActive || 0)) {
               console.log("[FirestoreSync] Remote update detected. Merging...");
               useAppStore.setState({ 
                 workspaces: cloudWorkspaces,
                 activeWorkspaceId: parsed.state.activeWorkspaceId || currentState.activeWorkspaceId
               });
               lastSyncTimeRef.current = Date.now();
            }
          }
        } catch (error) {
          console.error("[FirestoreSync] Snap parse failed:", error);
        }
      }
    });

    return () => {
      unsubStore();
      unsubFirestore();
      if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
    };
  }, []);
}
