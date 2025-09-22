// Script para verificar o estado atual dos cenários estaduais e REPUBLICANOS
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Configuração do Firebase
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

async function verificarRepublicanosEstaduais() {
  try {
    console.log('🔍 Verificando estado atual dos cenários estaduais...');

    // 1. Buscar todos os cenários estaduais
    const cenariosSnapshot = await getDocs(collection(db, 'cenarios_estaduais'));
    const cenarios = cenariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`\n📋 Cenários encontrados: ${cenarios.length}`);
    
    if (cenarios.length === 0) {
      console.log('ℹ️ Nenhum cenário encontrado. Isso é normal se ainda não foram criados cenários.');
      return;
    }

    // 2. Para cada cenário, verificar partidos
    for (const cenario of cenarios) {
      console.log(`\n🔍 Cenário: ${cenario.nome} (${cenario.id})`);
      
      // Buscar partidos do cenário
      const partidosQuery = query(
        collection(db, 'cenarios_partidos_estaduais'),
        where('cenarioId', '==', cenario.id)
      );
      
      const partidosSnapshot = await getDocs(partidosQuery);
      const partidos = partidosSnapshot.docs.map(doc => doc.data());
      
      // Agrupar por partido
      const partidosUnicos = [...new Set(partidos.map(p => p.partido))];
      
      console.log(`  📊 Partidos encontrados: ${partidosUnicos.join(', ')}`);
      console.log(`  👥 Total de candidatos: ${partidos.length}`);
      
      // Verificar especificamente REPUBLICANOS
      const temRepublicanos = partidosUnicos.includes('REPUBLICANOS');
      console.log(`  ${temRepublicanos ? '✅' : '❌'} REPUBLICANOS: ${temRepublicanos ? 'SIM' : 'NÃO'}`);
      
      if (temRepublicanos) {
        const candidatosRepublicanos = partidos.filter(p => p.partido === 'REPUBLICANOS');
        console.log(`    👤 Candidatos REPUBLICANOS: ${candidatosRepublicanos.length}`);
      }
    }

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
    throw error;
  }
}

// Executar o script
if (require.main === module) {
  verificarRepublicanosEstaduais()
    .then(() => {
      console.log('\n✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução do script:', error);
      process.exit(1);
    });
}

module.exports = { verificarRepublicanosEstaduais };
