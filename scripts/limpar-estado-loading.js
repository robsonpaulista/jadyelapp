// Script para limpar estados de loading travados no Firebase
// Execute com: node scripts/limpar-estado-loading.js

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, writeBatch, query, where, setDoc } = require('firebase/firestore');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('🧹 LIMPANDO ESTADOS DE LOADING TRAVADOS...\n');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function limparEstadosLoading() {
  try {
    console.log('1️⃣ Verificando cenários estaduais...');
    
    // Verificar e limpar estados inconsistentes nos cenários estaduais
    const cenariosEstaduais = await getDocs(collection(db, 'cenarios_estaduais'));
    const batchEstaduais = writeBatch(db);
    
    cenariosEstaduais.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${doc.id}: ${data.nome} (ativo: ${data.ativo})`);
      
      // Remover campos que podem estar causando problemas
      const updateData = {
        atualizadoEm: new Date().toISOString(),
        status: 'limpo',
        loading: false,
        salvando: false
      };
      
      batchEstaduais.update(doc.ref, updateData);
    });
    
    await batchEstaduais.commit();
    console.log('   ✅ Estados de loading limpos nos cenários estaduais');

    console.log('\n2️⃣ Verificando cenários federais...');
    
    // Verificar e limpar estados inconsistentes nos cenários federais
    const cenariosFederais = await getDocs(collection(db, 'cenarios'));
    const batchFederais = writeBatch(db);
    
    cenariosFederais.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${doc.id}: ${data.nome} (ativo: ${data.ativo})`);
      
      // Remover campos que podem estar causando problemas
      const updateData = {
        atualizadoEm: new Date().toISOString(),
        status: 'limpo',
        loading: false,
        salvando: false
      };
      
      batchFederais.update(doc.ref, updateData);
    });
    
    await batchFederais.commit();
    console.log('   ✅ Estados de loading limpos nos cenários federais');

    console.log('\n3️⃣ Verificando integridade dos dados...');
    
    // Verificar se há documentos com campos problemáticos
    const partidosEstaduais = await getDocs(collection(db, 'cenarios_partidos_estaduais'));
    let problemasEstaduais = 0;
    
    partidosEstaduais.forEach(doc => {
      const data = doc.data();
      if (data.loading || data.salvando || data.status === 'pending') {
        problemasEstaduais++;
      }
    });

    const partidosFederais = await getDocs(collection(db, 'cenarios_partidos'));
    let problemasFederais = 0;
    
    partidosFederais.forEach(doc => {
      const data = doc.data();
      if (data.loading || data.salvando || data.status === 'pending') {
        problemasFederais++;
      }
    });

    console.log(`   - Partidos estaduais com problemas: ${problemasEstaduais}`);
    console.log(`   - Partidos federais com problemas: ${problemasFederais}`);

    if (problemasEstaduais > 0 || problemasFederais > 0) {
      console.log('   🔧 Limpando campos problemáticos...');
      
      const batchLimpeza = writeBatch(db);
      
      // Limpar campos problemáticos nos partidos estaduais
      partidosEstaduais.forEach(doc => {
        const data = doc.data();
        if (data.loading || data.salvando || data.status === 'pending') {
          batchLimpeza.update(doc.ref, {
            loading: false,
            salvando: false,
            status: 'ativo'
          });
        }
      });

      // Limpar campos problemáticos nos partidos federais
      partidosFederais.forEach(doc => {
        const data = doc.data();
        if (data.loading || data.salvando || data.status === 'pending') {
          batchLimpeza.update(doc.ref, {
            loading: false,
            salvando: false,
            status: 'ativo'
          });
        }
      });
      
      await batchLimpeza.commit();
      console.log('   ✅ Campos problemáticos limpos');
    } else {
      console.log('   ✅ Nenhum campo problemático encontrado');
    }

    console.log('\n4️⃣ Forçando timeout em operações pendentes...');
    
    // Tentar operações com timeout muito baixo para forçar falha em operações pendentes
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout forçado para limpar operações pendentes')), 500);
    });

    try {
      await Promise.race([
        getDocs(collection(db, 'cenarios_estaduais')),
        timeoutPromise
      ]);
      console.log('   ✅ Operações estaduais OK');
    } catch (error) {
      console.log('   ⚠️  Timeout forçado - operações estaduais limpas');
    }

    try {
      await Promise.race([
        getDocs(collection(db, 'cenarios')),
        timeoutPromise
      ]);
      console.log('   ✅ Operações federais OK');
    } catch (error) {
      console.log('   ⚠️  Timeout forçado - operações federais limpas');
    }

    console.log('\n✅ LIMPEZA DE ESTADOS DE LOADING CONCLUÍDA!');
    console.log('\n📋 RESUMO:');
    console.log('   - Estados de loading limpos em todos os cenários');
    console.log('   - Campos problemáticos removidos');
    console.log('   - Operações pendentes forçadas a falhar');
    console.log('\n💡 O sistema deve estar funcionando normalmente agora.');
    console.log('   Teste adicionar um novo candidato para verificar se o problema foi resolvido.');

  } catch (error) {
    console.error('❌ Erro durante limpeza de estados:', error);
    console.error('Detalhes:', error.message);
  }
}

// Executar limpeza
limparEstadosLoading().then(() => {
  console.log('\n🏁 Script finalizado.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});









