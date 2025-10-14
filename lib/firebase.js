// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7djZYivfXwApeX6e1GNeeZ7weSFakaIE",
  authDomain: "sportska-trema.firebaseapp.com",
  projectId: "sportska-trema",
  storageBucket: "sportska-trema.firebasestorage.app",
  messagingSenderId: "701880501063",
  appId: "1:701880501063:web:ba0e07756ddae31fea8262",
  measurementId: "G-XL0EBV5NV8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;