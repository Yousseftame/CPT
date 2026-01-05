import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // لو هتتعامل مع DB
import { getStorage } from "firebase/storage"; // لو هتتعامل مع ملفات
import { getAnalytics } from "firebase/analytics"; 
import { getFunctions } from 'firebase/functions';


const firebaseConfig = {
  apiKey: "AIzaSyBtPa7wVgTwTcsdq8h0FOPJ7sUNKNoXr5M",
  authDomain: "thinkstudio-cpt.firebaseapp.com",
  projectId: "thinkstudio-cpt",
  storageBucket: "thinkstudio-cpt.firebasestorage.app",
  messagingSenderId: "607618516836",
  appId: "1:607618516836:web:ca70e2d7b546ee7b109c71",
  measurementId: "G-PFV1NG6K55"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app); 
export const functions = getFunctions(app);
