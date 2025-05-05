// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Required for Firebase Authentication
import { getFirestore } from "firebase/firestore"; // Required for Firestore
// Import Analytics only for the client-side
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxDxvs5HrsPtGMY5zMqPeBqGA6OaCuH_Q",
  authDomain: "giftstore-6cad5.firebaseapp.com",
  projectId: "giftstore-6cad5",
  storageBucket: "giftstore-6cad5.appspot.com", 
  messagingSenderId: "343549583469",
  appId: "1:343549583469:web:a23edc4b7d7e1c17895f64",
  measurementId: "G-L3HH6TYMJV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
const auth = getAuth(app);

// Initialize Firestore Database
const db = getFirestore(app);
const storage = getStorage(app);
// Initialize Analytics only on the client side
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app); // This will only be called on the client side
}

// Export the auth and db instances
export {storage, auth, db, analytics };
