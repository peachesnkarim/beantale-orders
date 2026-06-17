import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Beantale Orders — shared Firestore backend.
// This config is the public web-app config (not a secret key) and is safe to ship in client code —
// Firebase's actual access boundary is enforced by Firestore security rules, not by hiding this value.
// It's still pulled from env vars (set in .env locally, and in Vercel's Project Settings → Environment
// Variables for deploys) so the literal key string isn't checked into source control / flagged by
// secret scanners.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
