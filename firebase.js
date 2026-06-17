import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Beantale Orders — shared Firestore backend.
// This config is the public web-app config (not a secret key) and is safe to ship in client code.
// Data access is governed by Firestore security rules set in the Firebase console.
const firebaseConfig = {
  apiKey: "AIzaSyACYy7pCnnIvflmQ2lpPcL388SM38bXM_A",
  authDomain: "beantale-orders.firebaseapp.com",
  projectId: "beantale-orders",
  storageBucket: "beantale-orders.firebasestorage.app",
  messagingSenderId: "738309930044",
  appId: "1:738309930044:web:eb1015c814578589ac9739",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
