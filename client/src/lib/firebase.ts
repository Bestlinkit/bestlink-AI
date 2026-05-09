// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyApxd8vnuqSDhe47X-uYe-3e6AxNZ0m2ik",
  authDomain: "bestlink-digital-ai.firebaseapp.com",
  projectId: "bestlink-digital-ai",
  storageBucket: "bestlink-digital-ai.firebasestorage.app",
  messagingSenderId: "450860691315",
  appId: "1:450860691315:web:34995312843093187c5f06",
  measurementId: "G-B4P78FJVZN"
};

import { getFirestore } from "firebase/firestore";

// Initialize Firebase
// Use getApps() to prevent multiple initializations in Next.js
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Analytics only on the client side and if supported
const analytics = typeof window !== "undefined" ? isSupported().then((supported) => supported ? getAnalytics(app) : null) : null;

export { app, analytics, db };
