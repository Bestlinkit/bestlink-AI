"use client";

import { useEffect, useState } from "react";
import { useFirestoreSync } from "@/store/useFirestoreSync";
import { auth } from "@/lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { Loader2, ShieldAlert, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FirestoreSyncProvider({ children }: { children: React.ReactNode }) {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { status: syncStatus } = useFirestoreSync(isAuthReady);

  useEffect(() => {
    if (!auth) {
      setAuthError("Firebase Auth failed to initialize.");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("[Auth] Session active:", user.uid);
        setIsAuthReady(true);
      } else {
        console.log("[Auth] No session. Attempting anonymous login...");
        try {
          await signInAnonymously(auth);
        } catch (err: any) {
          console.error("[Auth] Anonymous login failed:", err);
          setAuthError(err.message || "Authentication failed.");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (authError) {
    return (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-[2.5rem] bg-red-500/5 border border-red-500/10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Authorization Failure</h2>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
              {authError}
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {!isAuthReady && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center space-y-8"
          >
            <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-2xl shadow-blue-500/20 relative">
              <Zap className="w-10 h-10 text-white fill-current animate-pulse" />
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Initializing Secure Session
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {isAuthReady && children}
    </>
  );
}
