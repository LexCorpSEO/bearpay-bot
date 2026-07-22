/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC5W1ewRXh4WZLy4afekjxvZyj1rKVWtQs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cohesive-elevator-m98sv.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cohesive-elevator-m98sv",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cohesive-elevator-m98sv.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "832575521973",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:832575521973:web:0ea107cb1dab12cc72aafc",
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, "ai-studio-bearpay-e95fc2a5-9b5f-44db-8bea-a8643f394ca9");

export { app, db };
