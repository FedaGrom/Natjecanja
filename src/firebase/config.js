// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7djZYivfXwApeX6e1GNeeZ7weSFakaIE",
  authDomain: "sportska-trema.firebaseapp.com",
  projectId: "sportska-trema",
  storageBucket: "sportska-trema.firebasestorage.app",
  messagingSenderId: "673765735461",
  appId: "1:673765735461:web:632c587f76ca6404fcd3cc",
  measurementId: "G-VB6DHKK1BF"
};

// Initialize Firebase only if no apps exist (prevents re-initialization)
let app;
if (typeof window !== 'undefined' && getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else if (typeof window !== 'undefined') {
  app = getApps()[0];
}

// Initialize services with lazy loading
let authInstance, dbInstance;

export const getAuthInstance = () => {
  if (typeof window === 'undefined') return null;
  if (!authInstance && app) {
    authInstance = getAuth(app);
  }
  return authInstance;
};

export const getDbInstance = () => {
  if (typeof window === 'undefined') return null;
  if (!dbInstance && app) {
    dbInstance = getFirestore(app);
  }
  return dbInstance;
};

// Export instances for backward compatibility
export const auth = getAuthInstance();
export const db = getDbInstance();

export default app;