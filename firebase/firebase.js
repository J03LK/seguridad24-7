// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD_C3sJCghWpV1DHn4Qyxsa-exdcEJGst0",
  authDomain: "seguridad-24-7.firebaseapp.com",
  projectId: "seguridad-24-7",
  storageBucket: "seguridad-24-7.firebasestorage.app",
  messagingSenderId: "979899411271",
  appId: "1:979899411271:web:4d8db498a9388054a7fa62",
  measurementId: "G-XQG0KDMMX4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
