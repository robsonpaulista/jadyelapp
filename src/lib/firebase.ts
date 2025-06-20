import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Verificar se todas as configurações necessárias estão presentes
const requiredConfig = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingConfig = requiredConfig.filter(key => !process.env[key]);

if (missingConfig.length > 0) {
  console.error('🔥 Firebase: Configurações faltando:', missingConfig);
  console.error('Verifique se as seguintes variáveis estão no .env.local:', missingConfig);
}

let app;
let auth;
let db;

try {
  // Initialize Firebase
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  
  console.log('🔥 Firebase inicializado com sucesso');
} catch (error) {
  console.error('🔥 Erro ao inicializar Firebase:', error);
  throw new Error('Falha na inicialização do Firebase. Verifique as configurações.');
}

export { app, auth, db }; 