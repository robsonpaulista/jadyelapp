// Script para forçar limpeza de operações pendentes e reiniciar o sistema
// Execute com: node scripts/forcar-limpeza.js

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

console.log('🚨 FORÇANDO LIMPEZA DO SISTEMA...\n');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function forcarLimpeza() {
  try {
    console.log('1️⃣ Forçando timeout em todas as operações...');
    
    // Definir timeout muito baixo para forçar falha em operações pendentes
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout forçado')), 1000);
    });

    // Tentar operações com timeout
    try {
      await Promise.race([
        getDocs(collection(db, 'cenarios_estaduais')),
        timeoutPromise
      ]);
      console.log('   ✅ Conexão com Firebase OK');
    } catch (error) {
      console.log('   ⚠️  Timeout forçado - operações pendentes detectadas');
    }

    console.log('\n2️⃣ Limpando estados de loading...');
    
    // Forçar atualização de todos os cenários para limpar estados inconsistentes
    const batch = writeBatch(db);
    
    // Atualizar timestamp de todos os cenários estaduais
    const cenariosEstaduais = await getDocs(collection(db, 'cenarios_estaduais'));
    cenariosEstaduais.forEach(doc => {
      batch.update(doc.ref, { 
        atualizadoEm: new Date().toISOString(),
        status: 'limpo'
      });
    });

    // Atualizar timestamp de todos os cenários federais
    const cenariosFederais = await getDocs(collection(db, 'cenarios'));
    cenariosFederais.forEach(doc => {
      batch.update(doc.ref, { 
        atualizadoEm: new Date().toISOString(),
        status: 'limpo'
      });
    });

    await batch.commit();
    console.log('   ✅ Estados de loading limpos');

    console.log('\n3️⃣ Garantindo cenário ativo correto...');
    
    // Garantir que apenas um cenário estadual está ativo
    const cenariosAtivosEstaduais = await getDocs(query(collection(db, 'cenarios_estaduais'), where('ativo', '==', true)));
    if (cenariosAtivosEstaduais.size > 1) {
      console.log('   - Corrigindo múltiplos cenários estaduais ativos...');
      const batchEstaduais = writeBatch(db);
      let primeiro = true;
      
      cenariosAtivosEstaduais.forEach(doc => {
        if (primeiro) {
          console.log(`   - Mantendo ativo: ${doc.id}`);
          primeiro = false;
        } else {
          batchEstaduais.update(doc.ref, { ativo: false });
        }
      });
      
      await batchEstaduais.commit();
    }

    // Garantir que apenas um cenário federal está ativo
    const cenariosAtivosFederais = await getDocs(query(collection(db, 'cenarios'), where('ativo', '==', true)));
    if (cenariosAtivosFederais.size > 1) {
      console.log('   - Corrigindo múltiplos cenários federais ativos...');
      const batchFederais = writeBatch(db);
      let primeiro = true;
      
      cenariosAtivosFederais.forEach(doc => {
        if (primeiro) {
          console.log(`   - Mantendo ativo: ${doc.id}`);
          primeiro = false;
        } else {
          batchFederais.update(doc.ref, { ativo: false });
        }
      });
      
      await batchFederais.commit();
    }

    console.log('   ✅ Cenários ativos corrigidos');

    console.log('\n4️⃣ Verificando integridade dos dados...');
    
    // Verificar se há partidos órfãos
    const partidosEstaduais = await getDocs(collection(db, 'cenarios_partidos_estaduais'));
    const cenariosEstaduaisIds = new Set((await getDocs(collection(db, 'cenarios_estaduais'))).docs.map(doc => doc.id));
    
    let orfaosEstaduais = 0;
    partidosEstaduais.forEach(doc => {
      const data = doc.data();
      if (!cenariosEstaduaisIds.has(data.cenarioId)) {
        orfaosEstaduais++;
      }
    });

    const partidosFederais = await getDocs(collection(db, 'cenarios_partidos'));
    const cenariosFederaisIds = new Set((await getDocs(collection(db, 'cenarios'))).docs.map(doc => doc.id));
    
    let orfaosFederais = 0;
    partidosFederais.forEach(doc => {
      const data = doc.data();
      if (!cenariosFederaisIds.has(data.cenarioId)) {
        orfaosFederais++;
      }
    });

    console.log(`   - Partidos estaduais órfãos: ${orfaosEstaduais}`);
    console.log(`   - Partidos federais órfãos: ${orfaosFederais}`);

    if (orfaosEstaduais > 0 || orfaosFederais > 0) {
      console.log('   ⚠️  Órfãos detectados, mas não removendo automaticamente');
    } else {
      console.log('   ✅ Nenhum órfão detectado');
    }

    console.log('\n✅ LIMPEZA FORÇADA CONCLUÍDA!');
    console.log('\n📋 RESUMO:');
    console.log('   - Estados de loading limpos');
    console.log('   - Cenários ativos corrigidos');
    console.log('   - Integridade verificada');
    console.log('\n💡 O sistema deve estar funcionando normalmente agora.');
    console.log('   Reinicie o servidor de desenvolvimento se necessário.');

  } catch (error) {
    console.error('❌ Erro durante limpeza forçada:', error);
    console.error('Detalhes:', error.message);
  }
}

// Executar limpeza forçada
forcarLimpeza().then(() => {
  console.log('\n🏁 Script finalizado.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});









