// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC7djZYivfXwApeX6e1GNeeZ7weSFakaIE",
  authDomain: "sportska-trema.firebaseapp.com",
  projectId: "sportska-trema",
  storageBucket: "sportska-trema.firebasestorage.app",
  messagingSenderId: "673765735461",
  appId: "1:673765735461:web:632c587f76ca6404fcd3cc",
  measurementId: "G-VB6DHKK1BF"
};

// Initialize Firebase only if no apps exist
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;