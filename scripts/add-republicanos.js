require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, setDoc, doc, writeBatch, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addRepublicanos() {
  try {
    console.log('Adicionando REPUBLICANOS...');
    
    const batch = writeBatch(db);
    
    // 17 homens
    for (let i = 1; i <= 17; i++) {
      const id = `base_REPUBLICANOS_HOMEM_${i}`;
      const docRef = doc(db, 'cenarios_partidos_estaduais', id);
      batch.set(docRef, {
        cenarioId: 'base',
        partido: 'REPUBLICANOS',
        nome: `HOMEM ${i}`,
        votos: 0,
        genero: 'homem',
        cor: 'bg-green-600',
        corTexto: 'text-white'
      });
    }
    
    // 8 mulheres
    for (let i = 1; i <= 8; i++) {
      const id = `base_REPUBLICANOS_MULHER_${i}`;
      const docRef = doc(db, 'cenarios_partidos_estaduais', id);
      batch.set(docRef, {
        cenarioId: 'base',
        partido: 'REPUBLICANOS',
        nome: `MULHER ${i}`,
        votos: 0,
        genero: 'mulher',
        cor: 'bg-green-600',
        corTexto: 'text-white'
      });
    }
    
    await batch.commit();
    console.log('REPUBLICANOS adicionado com sucesso!');
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

addRepublicanos();
