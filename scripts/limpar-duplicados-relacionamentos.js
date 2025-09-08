// Script para limpar dados duplicados nos relacionamentos de deputados
// Execute com: node scripts/limpar-duplicados-relacionamentos.js

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } = require('firebase/firestore');

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

async function limparDuplicadosRelacionamentos() {
  try {
    console.log('🚀 Iniciando limpeza de dados duplicados...');

    // 1. Buscar todos os relacionamentos
    const relacionamentosSnapshot = await getDocs(collection(db, 'relacionamentos_deputados'));
    const relacionamentos = relacionamentosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📋 Encontrados ${relacionamentos.length} relacionamentos`);

    // 2. Identificar duplicatas
    const duplicatas = [];
    const pessoasPorMunicipio = {};

    relacionamentos.forEach(rel => {
      const municipio = rel.municipio;
      
      if (!pessoasPorMunicipio[municipio]) {
        pessoasPorMunicipio[municipio] = {
          prefeitos: new Set(),
          vereadores: new Set()
        };
      }

      // Verificar prefeito duplicado
      if (rel.prefeito) {
        if (pessoasPorMunicipio[municipio].prefeitos.has(rel.prefeito)) {
          duplicatas.push({
            id: rel.id,
            municipio: rel.municipio,
            deputado: rel.deputadoFederal,
            pessoa: rel.prefeito,
            cargo: 'Prefeito',
            motivo: 'Prefeito já existe em outro relacionamento'
          });
        } else {
          pessoasPorMunicipio[municipio].prefeitos.add(rel.prefeito);
        }
      }

      // Verificar vereadores duplicados
      if (rel.vereadores && rel.vereadores.length > 0) {
        rel.vereadores.forEach(vereador => {
          if (pessoasPorMunicipio[municipio].vereadores.has(vereador)) {
            duplicatas.push({
              id: rel.id,
              municipio: rel.municipio,
              deputado: rel.deputadoFederal,
              pessoa: vereador,
              cargo: 'Vereador',
              motivo: 'Vereador já existe em outro relacionamento'
            });
          } else {
            pessoasPorMunicipio[municipio].vereadores.add(vereador);
          }
        });
      }
    });

    console.log(`🔍 Encontradas ${duplicatas.length} duplicatas:`);
    duplicatas.forEach(dup => {
      console.log(`  - ${dup.pessoa} (${dup.cargo}) em ${dup.municipio} com ${dup.deputado} - ${dup.motivo}`);
    });

    if (duplicatas.length === 0) {
      console.log('✅ Nenhuma duplicata encontrada!');
      return;
    }

    // 3. Remover duplicatas (manter apenas o primeiro relacionamento)
    const idsParaRemover = [...new Set(duplicatas.map(d => d.id))];
    
    console.log(`🗑️  Removendo ${idsParaRemover.length} relacionamentos duplicados...`);

    const batch = writeBatch(db);
    idsParaRemover.forEach(id => {
      batch.delete(doc(db, 'relacionamentos_deputados', id));
    });

    await batch.commit();

    console.log('✅ Limpeza concluída com sucesso!');
    console.log(`📊 Relacionamentos removidos: ${idsParaRemover.length}`);
    console.log('📝 Duplicatas removidas:');
    duplicatas.forEach(dup => {
      console.log(`  - ${dup.pessoa} (${dup.cargo}) - ${dup.motivo}`);
    });

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  }
}

// Executar o script
limparDuplicadosRelacionamentos()
  .then(() => {
    console.log('✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro no script:', error);
    process.exit(1);
  });
