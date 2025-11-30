import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "",
  authDomain: "gympeak-4f511.firebaseapp.com",
  projectId: "gympeak-4f511",
  storageBucket: "gympeak-4f511.firebasestorage.app",
  messagingSenderId: "755633397648",
  appId: "1:755633397648:web:cfce4ad1d4889986811d15",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
