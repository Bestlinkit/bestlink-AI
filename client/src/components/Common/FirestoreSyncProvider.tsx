"use client";

import { useFirestoreSync } from "@/store/useFirestoreSync";

export default function FirestoreSyncProvider({ children }: { children: React.ReactNode }) {
  useFirestoreSync();
  return <>{children}</>;
}
