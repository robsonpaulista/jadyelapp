// Script para replicar o partido REPUBLICANOS para todos os cenários estaduais existentes
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, setDoc, doc, writeBatch, query, where } = require('firebase/firestore');

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

// Função auxiliar para gerar IDs seguros
function safeId(partido, nome) {
  const safePartido = partido
    .replace(/[\/\\\s.,()\[\]{}&|^$*+?!@#%~`\-=;:"'<>]/g, '_')
    .toLowerCase();

  const safeNome = nome
    .replace(/[\/\\\s.,()\[\]{}&|^$*+?!@#%~`\-=;:"'<>]/g, '_')
    .toLowerCase();

  return `${safePartido}_${safeNome}`;
}

async function replicarRepublicanosEstaduais() {
  try {
    console.log('🔄 Iniciando replicação do partido REPUBLICANOS para cenários estaduais...');

    // 1. Buscar todos os cenários estaduais
    const cenariosSnapshot = await getDocs(collection(db, 'cenarios_estaduais'));
    const cenarios = cenariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`📋 Encontrados ${cenarios.length} cenários estaduais`);

    // 2. Para cada cenário, verificar se já tem REPUBLICANOS
    for (const cenario of cenarios) {
      console.log(`\n🔍 Verificando cenário: ${cenario.nome} (${cenario.id})`);

      // Verificar se já tem REPUBLICANOS
      const republicanosQuery = query(
        collection(db, 'cenarios_partidos_estaduais'),
        where('cenarioId', '==', cenario.id),
        where('partido', '==', 'REPUBLICANOS')
      );
      
      const republicanosSnapshot = await getDocs(republicanosQuery);
      
      if (!republicanosSnapshot.empty) {
        console.log(`✅ Cenário ${cenario.nome} já possui REPUBLICANOS (${republicanosSnapshot.size} candidatos)`);
        continue;
      }

      console.log(`⚠️ Cenário ${cenario.nome} não possui REPUBLICANOS. Adicionando...`);

      // 3. Adicionar REPUBLICANOS vazio ao cenário
      const batch = writeBatch(db);
      
      // Criar partido REPUBLICANOS vazio (sem candidatos inicialmente)
      const republicanosId = `${cenario.id}_${safeId('REPUBLICANOS', 'partido')}`;
      batch.set(doc(db, 'cenarios_partidos_estaduais', republicanosId), {
        cenarioId: cenario.id,
        partido: 'REPUBLICANOS',
        nome: 'PARTIDO_REPUBLICANOS', // Nome especial para identificar o partido
        votos: 0,
        genero: 'partido', // Marcar como partido
        cor: 'bg-blue-600',
        corTexto: 'text-white',
        votosLegenda: 0
      });

      await batch.commit();
      console.log(`✅ Partido REPUBLICANOS adicionado ao cenário ${cenario.nome}`);
    }

    console.log('\n🎉 Replicação concluída com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`- Cenários processados: ${cenarios.length}`);
    console.log(`- Partido REPUBLICANOS agora está disponível em todos os cenários estaduais`);

  } catch (error) {
    console.error('❌ Erro durante a replicação:', error);
    throw error;
  }
}

// Executar o script
if (require.main === module) {
  replicarRepublicanosEstaduais()
    .then(() => {
      console.log('\n✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução do script:', error);
      process.exit(1);
    });
}

module.exports = { replicarRepublicanosEstaduais };
