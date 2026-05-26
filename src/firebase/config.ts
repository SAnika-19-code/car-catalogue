import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD1LLK5Mnp6Ruc4goeurfeQ7Rqgi-p7vtY",
  authDomain: "car-catalogue-fdce6.firebaseapp.com",
  projectId: "car-catalogue-fdce6",
  storageBucket: "car-catalogue-fdce6.firebasestorage.app",
  messagingSenderId: "350430244534",
  appId: "1:350430244534:web:52099c83bba2d64cd00017"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);