// Script para copiar dados do REPUBLICANOS para PODEMOS em todos os cenários
// Execute com: node scripts/copiar-podemos.js

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, setDoc, doc, writeBatch, query, where } = require('firebase/firestore');

// Configuração do Firebase - use as mesmas variáveis do projeto
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
  console.error('Configurações encontradas:', {
    apiKey: firebaseConfig.apiKey ? '✅' : '❌',
    projectId: firebaseConfig.projectId ? '✅' : '❌',
    authDomain: firebaseConfig.authDomain ? '✅' : '❌'
  });
  process.exit(1);
}

console.log('✅ Configurações do Firebase carregadas com sucesso!');
console.log('📊 Project ID:', firebaseConfig.projectId);

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função auxiliar para gerar IDs seguros
function safeId(partido, nome) {
  const safePartido = partido
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toUpperCase()
    .trim();
    
  const safeNome = nome
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toUpperCase()
    .trim();
    
  return `${safePartido}_${safeNome}`;
}

async function copiarRepublicanosParaPodemos() {
  try {
    console.log('🚀 Iniciando cópia dos dados do REPUBLICANOS para PODEMOS...');
    
    // 1. Listar todos os cenários
    const cenariosSnapshot = await getDocs(collection(db, 'cenarios'));
    const cenarios = cenariosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📋 Encontrados ${cenarios.length} cenários:`, cenarios.map(c => c.id));
    
    // 2. Para cada cenário, copiar dados do REPUBLICANOS para PODEMOS
    for (const cenario of cenarios) {
      console.log(`\n🔄 Processando cenário: ${cenario.id}`);
      
      // Buscar todos os candidatos do REPUBLICANOS neste cenário
      const republicanosQuery = query(
        collection(db, 'cenarios_partidos'),
        where('cenarioId', '==', cenario.id),
        where('partido', '==', 'REPUBLICANOS')
      );
      
      const republicanosSnapshot = await getDocs(republicanosQuery);
      const republicanos = republicanosSnapshot.docs.map(doc => doc.data());
      
      console.log(`📊 Encontrados ${republicanos.length} candidatos do REPUBLICANOS`);
      
      if (republicanos.length === 0) {
        console.log(`⚠️  Nenhum candidato do REPUBLICANOS encontrado no cenário ${cenario.id}`);
        continue;
      }
      
      // 3. Criar batch para inserir os dados do PODEMOS
      const batch = writeBatch(db);
      
      // Configuração do PODEMOS (cor roxa)
      const corPodemos = 'bg-purple-600';
      const corTextoPodemos = 'text-white';
      
      // Copiar cada candidato do REPUBLICANOS para PODEMOS
      republicanos.forEach(candidato => {
        const idPodemos = `${cenario.id}_${safeId('PODEMOS', candidato.nome)}`;
        
        batch.set(doc(db, 'cenarios_partidos', idPodemos), {
          cenarioId: cenario.id,
          partido: 'PODEMOS',
          nome: candidato.nome,
          votos: candidato.votos,
          genero: candidato.genero,
          cor: corPodemos,
          corTexto: corTextoPodemos,
          votosLegenda: candidato.votosLegenda || 0
        });
      });
      
      // 4. Executar o batch
      await batch.commit();
      console.log(`✅ Dados do PODEMOS copiados com sucesso para o cenário ${cenario.id}`);
    }
    
    console.log('\n🎉 Processo concluído com sucesso!');
    console.log('📝 Todos os cenários agora possuem dados do PODEMOS baseados no REPUBLICANOS');
    
  } catch (error) {
    console.error('❌ Erro durante o processo:', error);
    throw error;
  }
}

// Executar o script
copiarRepublicanosParaPodemos()
  .then(() => {
    console.log('✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro no script:', error);
    process.exit(1);
  });
