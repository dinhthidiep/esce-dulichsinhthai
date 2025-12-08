// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB3EfLHdWa1nsOLNPipA-7itBdwLG_S6fk",
  authDomain: "esce-a4b58.firebaseapp.com",
  projectId: "esce-a4b58",
  storageBucket: "esce-a4b58.firebasestorage.app",
  messagingSenderId: "352118185540",
  appId: "1:352118185540:web:e7f97ded53b029f90fe611",
  measurementId: "G-45RX7TMKYT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, analytics, storage, auth };

