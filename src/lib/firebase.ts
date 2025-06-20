import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDD1xP8ginF5MVYFaIffptmwyYLKMDE820",
  authDomain: "dynamics-integration-e05d5.firebaseapp.com",
  projectId: "dynamics-integration-e05d5",
  storageBucket: "dynamics-integration-e05d5.appspot.com",
  messagingSenderId: "641108348983",
  appId: "1:641108348983:web:8c9a6675daf79d06efefb2"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app); 