// Script para adicionar o partido REPUBLICANOS ao cenário base das chapas estaduais
// Execute com: node scripts/adicionar-republicanos-estaduais.js

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

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

// Função auxiliar para gerar IDs seguros
function safeId(partido, nome) {
  return `${partido}_${nome}`
    .replaceAll('/', '_')
    .replaceAll('\\', '_')
    .replaceAll(' ', '_')
    .replaceAll('.', '_')
    .replaceAll(',', '_')
    .replaceAll('(', '_')
    .replaceAll(')', '_')
    .replaceAll('[', '_')
    .replaceAll(']', '_')
    .replaceAll('{', '_')
    .replaceAll('}', '_')
    .replaceAll('!', '_')
    .replaceAll('?', '_')
    .replaceAll('@', '_')
    .replaceAll('#', '_')
    .replaceAll('$', '_')
    .replaceAll('%', '_')
    .replaceAll('^', '_')
    .replaceAll('&', '_')
    .replaceAll('*', '_')
    .replaceAll('+', '_')
    .replaceAll('=', '_')
    .replaceAll('|', '_')
    .replaceAll('~', '_')
    .replaceAll('`', '_')
    .replaceAll('"', '_')
    .replaceAll("'", '_')
    .replaceAll(':', '_')
    .replaceAll(';', '_')
    .replaceAll('<', '_')
    .replaceAll('>', '_')
    .replaceAll(',', '_')
    .toUpperCase();
}

async function adicionarRepublicanosEstaduais() {
  try {
    console.log('🚀 Iniciando adição do REPUBLICANOS ao cenário base...');

    // Verificar se o cenário base existe
    const cenarioBaseRef = doc(db, 'cenarios_estaduais', 'base');
    const cenarioBaseSnap = await getDoc(cenarioBaseRef);
    
    if (!cenarioBaseSnap.exists()) {
      console.log('❌ Cenário base não encontrado! Criando...');
      
      // Criar cenário base
      const cenarioBase = {
        id: 'base',
        nome: 'Cenário Base',
        descricao: 'Estado original das chapas eleitorais estaduais',
        tipo: 'base',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        ativo: true,
        quocienteEleitoral: 190000,
        numeroVagas: 8
      };
      
      await setDoc(cenarioBaseRef, cenarioBase);
      console.log('✅ Cenário base criado!');
    } else {
      console.log('✅ Cenário base encontrado!');
    }

    // Verificar se o REPUBLICANOS já existe
    const republicanosQuery = query(
      collection(db, 'cenarios_partidos_estaduais'),
      where('cenarioId', '==', 'base'),
      where('partido', '==', 'REPUBLICANOS')
    );
    
    const republicanosSnapshot = await getDocs(republicanosQuery);
    
    if (republicanosSnapshot.size > 0) {
      console.log('⚠️  REPUBLICANOS já existe no cenário base!');
      console.log(`📊 Encontrados ${republicanosSnapshot.size} candidatos do REPUBLICANOS`);
      return;
    }

    console.log('📝 Adicionando candidatos do REPUBLICANOS...');

    // Criar candidatos do REPUBLICANOS
    const candidatosRepublicanos = [];
    
    // 17 homens (HOMEM 1 a HOMEM 17)
    for (let i = 1; i <= 17; i++) {
      candidatosRepublicanos.push({
        cenarioId: 'base',
        partido: 'REPUBLICANOS',
        nome: `HOMEM ${i}`,
        votos: 0,
        genero: 'homem',
        cor: 'bg-green-600',
        corTexto: 'text-white'
      });
    }
    
    // 8 mulheres (MULHER 1 a MULHER 8)
    for (let i = 1; i <= 8; i++) {
      candidatosRepublicanos.push({
        cenarioId: 'base',
        partido: 'REPUBLICANOS',
        nome: `MULHER ${i}`,
        votos: 0,
        genero: 'mulher',
        cor: 'bg-green-600',
        corTexto: 'text-white'
      });
    }

    // Salvar candidatos em batch
    const batch = writeBatch(db);
    
    candidatosRepublicanos.forEach(candidato => {
      const id = `base_${safeId(candidato.partido, candidato.nome)}`;
      const docRef = doc(db, 'cenarios_partidos_estaduais', id);
      batch.set(docRef, candidato);
    });

    await batch.commit();

    console.log('✅ REPUBLICANOS adicionado com sucesso!');
    console.log(`📊 Candidatos adicionados: ${candidatosRepublicanos.length}`);
    console.log(`👨 Homens: 17 (HOMEM 1 a HOMEM 17)`);
    console.log(`👩 Mulheres: 8 (MULHER 1 a MULHER 8)`);
    console.log('🎨 Cor: Verde (bg-green-600)');

  } catch (error) {
    console.error('❌ Erro ao adicionar REPUBLICANOS:', error);
    throw error;
  }
}

// Executar o script
adicionarRepublicanosEstaduais()
  .then(() => {
    console.log('✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro no script:', error);
    process.exit(1);
  });
