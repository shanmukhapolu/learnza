import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: "AIzaSyDZlch7IbLtXYQI0SfnIig46mjqfMmPkpI",
  authDomain: "learnza-e4704.firebaseapp.com",
  projectId: "learnza-e4704",
  databaseURL: "https://learnza-e4704-default-rtdb.firebaseio.com",
  storageBucket: "learnza-e4704.firebasestorage.app",
  messagingSenderId: "434856829266",
  appId: "1:434856829266:web:48f250694691ced67cda8b",
  measurementId: "G-989DHYT770",
};

export const FIREBASE_API_KEY = firebaseConfig.apiKey;
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_DATABASE_URL = firebaseConfig.databaseURL;

// Initialize Firebase app (singleton-safe for Next.js)
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Analytics only in browser environments
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      getAnalytics(firebaseApp);
    }
  });
}
