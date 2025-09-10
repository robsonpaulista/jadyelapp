// Script para verificar e limpar operações pendentes no Firebase
// Execute com: node scripts/verificar-firebase.js

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, deleteDoc, writeBatch, query, where } = require('firebase/firestore');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Verificar se as configurações estão presentes
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Configurações do Firebase não encontradas!');
  console.error('Certifique-se de que o arquivo .env.local existe com as configurações do Firebase');
  process.exit(1);
}

console.log('✅ Configurações do Firebase carregadas com sucesso!');
console.log('📊 Project ID:', firebaseConfig.projectId);

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verificarFirebase() {
  console.log('\n🔍 Verificando estado do Firebase...\n');

  try {
    // Verificar cenários estaduais
    console.log('📋 Verificando cenários estaduais...');
    const cenariosEstaduais = await getDocs(collection(db, 'cenarios_estaduais'));
    console.log(`   - Total de cenários estaduais: ${cenariosEstaduais.size}`);
    
    cenariosEstaduais.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${doc.id}: ${data.nome} (ativo: ${data.ativo})`);
    });

    // Verificar partidos estaduais
    console.log('\n📋 Verificando partidos estaduais...');
    const partidosEstaduais = await getDocs(collection(db, 'cenarios_partidos_estaduais'));
    console.log(`   - Total de partidos estaduais: ${partidosEstaduais.size}`);

    // Verificar cenários federais
    console.log('\n📋 Verificando cenários federais...');
    const cenariosFederais = await getDocs(collection(db, 'cenarios'));
    console.log(`   - Total de cenários federais: ${cenariosFederais.size}`);
    
    cenariosFederais.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${doc.id}: ${data.nome} (ativo: ${data.ativo})`);
    });

    // Verificar partidos federais
    console.log('\n📋 Verificando partidos federais...');
    const partidosFederais = await getDocs(collection(db, 'cenarios_partidos'));
    console.log(`   - Total de partidos federais: ${partidosFederais.size}`);

    // Verificar se há múltiplos cenários ativos (problema comum)
    console.log('\n🔍 Verificando cenários ativos...');
    
    const cenariosAtivosEstaduais = await getDocs(query(collection(db, 'cenarios_estaduais'), where('ativo', '==', true)));
    console.log(`   - Cenários estaduais ativos: ${cenariosAtivosEstaduais.size}`);
    
    const cenariosAtivosFederais = await getDocs(query(collection(db, 'cenarios'), where('ativo', '==', true)));
    console.log(`   - Cenários federais ativos: ${cenariosAtivosFederais.size}`);

    if (cenariosAtivosEstaduais.size > 1) {
      console.log('⚠️  PROBLEMA: Múltiplos cenários estaduais ativos detectados!');
      console.log('   Isso pode causar conflitos. Recomenda-se corrigir.');
    }

    if (cenariosAtivosFederais.size > 1) {
      console.log('⚠️  PROBLEMA: Múltiplos cenários federais ativos detectados!');
      console.log('   Isso pode causar conflitos. Recomenda-se corrigir.');
    }

    console.log('\n✅ Verificação concluída!');
    console.log('\n💡 Se houver problemas, execute: node scripts/limpar-firebase.js');

  } catch (error) {
    console.error('❌ Erro ao verificar Firebase:', error);
    console.error('Detalhes:', error.message);
  }
}

// Executar verificação
verificarFirebase().then(() => {
  console.log('\n🏁 Script finalizado.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});




