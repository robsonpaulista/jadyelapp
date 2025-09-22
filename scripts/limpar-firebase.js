// Script para limpar operações pendentes e corrigir problemas no Firebase
// Execute com: node scripts/limpar-firebase.js

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, deleteDoc, writeBatch, query, where, setDoc } = require('firebase/firestore');

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

async function limparFirebase() {
  console.log('\n🧹 Iniciando limpeza do Firebase...\n');

  try {
    // 1. Corrigir múltiplos cenários ativos estaduais
    console.log('🔧 Corrigindo cenários estaduais ativos...');
    const cenariosAtivosEstaduais = await getDocs(query(collection(db, 'cenarios_estaduais'), where('ativo', '==', true)));
    
    if (cenariosAtivosEstaduais.size > 1) {
      console.log(`   - Encontrados ${cenariosAtivosEstaduais.size} cenários ativos. Corrigindo...`);
      
      const batch = writeBatch(db);
      let primeiro = true;
      
      cenariosAtivosEstaduais.forEach(doc => {
        if (primeiro) {
          console.log(`   - Mantendo ativo: ${doc.id}`);
          primeiro = false;
        } else {
          console.log(`   - Desativando: ${doc.id}`);
          batch.update(doc.ref, { ativo: false, atualizadoEm: new Date().toISOString() });
        }
      });
      
      await batch.commit();
      console.log('   ✅ Cenários estaduais corrigidos!');
    } else {
      console.log('   ✅ Cenários estaduais já estão corretos.');
    }

    // 2. Corrigir múltiplos cenários ativos federais
    console.log('\n🔧 Corrigindo cenários federais ativos...');
    const cenariosAtivosFederais = await getDocs(query(collection(db, 'cenarios'), where('ativo', '==', true)));
    
    if (cenariosAtivosFederais.size > 1) {
      console.log(`   - Encontrados ${cenariosAtivosFederais.size} cenários ativos. Corrigindo...`);
      
      const batch = writeBatch(db);
      let primeiro = true;
      
      cenariosAtivosFederais.forEach(doc => {
        if (primeiro) {
          console.log(`   - Mantendo ativo: ${doc.id}`);
          primeiro = false;
        } else {
          console.log(`   - Desativando: ${doc.id}`);
          batch.update(doc.ref, { ativo: false, atualizadoEm: new Date().toISOString() });
        }
      });
      
      await batch.commit();
      console.log('   ✅ Cenários federais corrigidos!');
    } else {
      console.log('   ✅ Cenários federais já estão corretos.');
    }

    // 3. Verificar e limpar documentos órfãos
    console.log('\n🔍 Verificando documentos órfãos...');
    
    // Verificar partidos estaduais órfãos
    const partidosEstaduais = await getDocs(collection(db, 'cenarios_partidos_estaduais'));
    const cenariosEstaduais = await getDocs(collection(db, 'cenarios_estaduais'));
    const cenariosEstaduaisIds = new Set(cenariosEstaduais.docs.map(doc => doc.id));
    
    let orfaosEstaduais = 0;
    const batchEstaduais = writeBatch(db);
    
    partidosEstaduais.forEach(doc => {
      const data = doc.data();
      if (!cenariosEstaduaisIds.has(data.cenarioId)) {
        console.log(`   - Partido órfão encontrado: ${doc.id} (cenário: ${data.cenarioId})`);
        batchEstaduais.delete(doc.ref);
        orfaosEstaduais++;
      }
    });
    
    if (orfaosEstaduais > 0) {
      await batchEstaduais.commit();
      console.log(`   ✅ ${orfaosEstaduais} partidos estaduais órfãos removidos!`);
    } else {
      console.log('   ✅ Nenhum partido estadual órfão encontrado.');
    }

    // Verificar partidos federais órfãos
    const partidosFederais = await getDocs(collection(db, 'cenarios_partidos'));
    const cenariosFederais = await getDocs(collection(db, 'cenarios'));
    const cenariosFederaisIds = new Set(cenariosFederais.docs.map(doc => doc.id));
    
    let orfaosFederais = 0;
    const batchFederais = writeBatch(db);
    
    partidosFederais.forEach(doc => {
      const data = doc.data();
      if (!cenariosFederaisIds.has(data.cenarioId)) {
        console.log(`   - Partido órfão encontrado: ${doc.id} (cenário: ${data.cenarioId})`);
        batchFederais.delete(doc.ref);
        orfaosFederais++;
      }
    });
    
    if (orfaosFederais > 0) {
      await batchFederais.commit();
      console.log(`   ✅ ${orfaosFederais} partidos federais órfãos removidos!`);
    } else {
      console.log('   ✅ Nenhum partido federal órfão encontrado.');
    }

    // 4. Garantir que existe pelo menos um cenário ativo
    console.log('\n🔧 Verificando cenários ativos...');
    
    const cenariosAtivosEstaduaisFinal = await getDocs(query(collection(db, 'cenarios_estaduais'), where('ativo', '==', true)));
    if (cenariosAtivosEstaduaisFinal.size === 0) {
      console.log('   - Nenhum cenário estadual ativo encontrado. Ativando o primeiro...');
      const todosCenariosEstaduais = await getDocs(collection(db, 'cenarios_estaduais'));
      if (todosCenariosEstaduais.size > 0) {
        const primeiroCenario = todosCenariosEstaduais.docs[0];
        await setDoc(doc(db, 'cenarios_estaduais', primeiroCenario.id), 
          { ativo: true, atualizadoEm: new Date().toISOString() }, 
          { merge: true }
        );
        console.log(`   ✅ Cenário estadual ativado: ${primeiroCenario.id}`);
      }
    }

    const cenariosAtivosFederaisFinal = await getDocs(query(collection(db, 'cenarios'), where('ativo', '==', true)));
    if (cenariosAtivosFederaisFinal.size === 0) {
      console.log('   - Nenhum cenário federal ativo encontrado. Ativando o primeiro...');
      const todosCenariosFederais = await getDocs(collection(db, 'cenarios'));
      if (todosCenariosFederais.size > 0) {
        const primeiroCenario = todosCenariosFederais.docs[0];
        await setDoc(doc(db, 'cenarios', primeiroCenario.id), 
          { ativo: true, atualizadoEm: new Date().toISOString() }, 
          { merge: true }
        );
        console.log(`   ✅ Cenário federal ativado: ${primeiroCenario.id}`);
      }
    }

    console.log('\n✅ Limpeza concluída com sucesso!');
    console.log('\n💡 Execute: node scripts/verificar-firebase.js para confirmar que tudo está correto.');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    console.error('Detalhes:', error.message);
  }
}

// Executar limpeza
limparFirebase().then(() => {
  console.log('\n🏁 Script finalizado.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});






