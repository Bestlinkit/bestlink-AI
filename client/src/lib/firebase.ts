import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Production Config (Hardcoded for stability as per project state)
const firebaseConfig = {
  apiKey: "AIzaSyApxd8vnuqSDhe47X-uYe-3e6AxNZ0m2ik",
  authDomain: "bestlink-digital-ai.firebaseapp.com",
  projectId: "bestlink-digital-ai",
  storageBucket: "bestlink-digital-ai.firebasestorage.app",
  messagingSenderId: "450860691315",
  appId: "1:450860691315:web:34995312843093187c5f06",
  measurementId: "G-B4P78FJVZN"
};

// Singleton Logic
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

try {
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }
  
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  
  console.log("[Firebase] Infrastructure initialized successfully.");
} catch (error) {
  console.error("[Firebase] Initialization failed. System running in DEGRADED mode.", error);
}

export { app, db, auth, storage };
export default app;
