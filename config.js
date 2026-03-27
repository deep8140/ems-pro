// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD7nRfEqVqUuwfH6Sx-7_Jffdg_UkdL16Y",
    authDomain: "ems-pro-base.firebaseapp.com",
    projectId: "ems-pro-base",
    storageBucket: "ems-pro-base.firebasestorage.app",
    messagingSenderId: "600754696804",
    appId: "1:600754696804:web:887e6af06c74ec73bee571",
    measurementId: "G-ZB3B7Q8Y4P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };
