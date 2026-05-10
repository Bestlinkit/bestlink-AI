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
  const [status, setStatus] = useState<SyncStatus>('RECOVERING');
  const isSyncingRef = useRef<boolean>(false);
  const lastRemoteVersionRef = useRef<number>(0);
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveFailuresRef = useRef<number>(0);

  const isHydrated = useAppStore(state => state.isHydrated);

  useEffect(() => {
    // Phase 1: Guards
    if (!db || !isAuthReady || !isHydrated) {
      if (!db) {
        setStatus('OFFLINE');
        useAppStore.getState().setFirebaseStatus('OFFLINE');
      }
      return;
    }

    const sessionId = getSessionId();
    const docRef = doc(db, 'app_state', `${sessionId}_bestlink-storage-v2`);

    // 1. Initial Load & Presence Check
    const initLoad = async () => {
      setStatus('RECOVERING');
      useAppStore.getState().setFirebaseStatus('DEGRADED');
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const rawData = docSnap.data().value as string;
          const parsed = JSON.parse(rawData);
          
          if (parsed?.state?.workspaces && parsed.version > lastRemoteVersionRef.current) {
            console.log("[FirestoreSync] Cloud recovery successful. Version:", parsed.version);
            
            isSyncingRef.current = true;
            useAppStore.setState({
              workspaces: parsed.state.workspaces,
              activeWorkspaceId: parsed.state.activeWorkspaceId,
              theme: parsed.state.theme || 'dark',
              activeAgentId: parsed.state.activeAgentId || 'designer'
            });
            lastRemoteVersionRef.current = parsed.version;
            setTimeout(() => { isSyncingRef.current = false; }, 1000);
          }
        }
        setStatus('ONLINE');
        useAppStore.getState().setFirebaseStatus('ONLINE');
        consecutiveFailuresRef.current = 0;
      } catch (err: any) {
        console.error("[FirestoreSync] Initial load failed:", err);
        if (err.code === 'permission-denied') {
          setStatus('PERMISSION_DENIED');
          useAppStore.getState().setFirebaseStatus('PERMISSION_DENIED');
        } else {
          setStatus('ERROR');
          useAppStore.getState().setFirebaseStatus('OFFLINE');
        }
      }
    };

    initLoad();

    // 2. Outbound Sync (Local -> Firestore)
    const unsubStore = useAppStore.subscribe((state, prevState) => {
      if (isSyncingRef.current || status === 'PERMISSION_DENIED') return;
      
      // Deep compare to avoid unnecessary writes
      if (JSON.stringify(state.workspaces) === JSON.stringify(prevState.workspaces) && 
          state.activeWorkspaceId === prevState.activeWorkspaceId) {
        return;
      }

      if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
      
      pendingUpdateRef.current = setTimeout(async () => {
        try {
          const version = Date.now();
          const payload = {
            state: {
              workspaces: state.workspaces,
              activeWorkspaceId: state.activeWorkspaceId,
              theme: state.theme,
              activeAgentId: state.activeAgentId
            },
            version,
            source: sessionId
          };
          
          await setDoc(docRef, { 
            value: JSON.stringify(payload), 
            updatedAt: Timestamp.now(),
            version
          });
          
          lastRemoteVersionRef.current = version;
          consecutiveFailuresRef.current = 0;
          if (status !== 'ONLINE') setStatus('ONLINE');
        } catch (error: any) {
          consecutiveFailuresRef.current++;
          console.warn("[FirestoreSync] Outbound sync failed:", error.message);
          if (consecutiveFailuresRef.current > 3) setStatus('OFFLINE');
        }
      }, 5000);
    });

    // 3. Inbound Sync (Firestore -> Local)
    const unsubFirestore = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        try {
          const rawData = docSnap.data().value as string;
          const parsed = JSON.parse(rawData);
          
          if (parsed.source === sessionId) return;
          if (parsed.version <= lastRemoteVersionRef.current) return;

          console.log("[FirestoreSync] Remote change detected.");
          
          isSyncingRef.current = true;
          useAppStore.setState({ 
            workspaces: parsed.state.workspaces,
            activeWorkspaceId: parsed.state.activeWorkspaceId || useAppStore.getState().activeWorkspaceId
          });
          lastRemoteVersionRef.current = parsed.version;
          
          setTimeout(() => { isSyncingRef.current = false; }, 1000);
          setStatus('ONLINE');
        } catch (error) {
          console.error("[FirestoreSync] Inbound parse failed:", error);
        }
      }
    }, (err: any) => {
      console.warn("[FirestoreSync] Snapshot listener failed:", err.message);
      if (err.code === 'permission-denied') setStatus('PERMISSION_DENIED');
      else setStatus('OFFLINE');
    });

    return () => {
      unsubStore();
      unsubFirestore();
      if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
    };
  }, [isAuthReady, isHydrated]);

  return { status };
}
