// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Storage, Firestore, and Auth exports
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Analytics only in the browser (avoid server-side execution)
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    // Analytics may fail to initialize in some environments; log and continue
    console.warn('Firebase analytics not initialized:', err);
  }
}

export { analytics };