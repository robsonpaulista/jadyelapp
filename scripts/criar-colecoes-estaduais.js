const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, writeBatch } = require('firebase/firestore');

// Configuração do Firebase (substitua pelos seus dados)
const firebaseConfig = {
  // Adicione sua configuração do Firebase aqui
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function criarColecoesEstaduais() {
  console.log('Criando coleções para chapas estaduais...');

  try {
    const batch = writeBatch(db);

    // 1. Criar coleção 'cenarios_estaduais'
    console.log('Criando coleção: cenarios_estaduais');
    const cenarioBase = {
      id: 'base',
      nome: 'Cenário Base',
      descricao: 'Estado original das chapas eleitorais estaduais',
      tipo: 'base',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      ativo: true,
      quocienteEleitoral: 190000
    };
    batch.set(doc(db, 'cenarios_estaduais', 'base'), cenarioBase);

    // 2. Criar coleção 'cenarios_partidos_estaduais' com dados de exemplo
    console.log('Criando coleção: cenarios_partidos_estaduais');
    
    // Dados de exemplo para PT
    const candidatosPT = [
      { nome: 'João Silva', votos: 45000, genero: 'homem' },
      { nome: 'Maria Santos', votos: 42000, genero: 'mulher' },
      { nome: 'Pedro Costa', votos: 38000, genero: 'homem' },
      { nome: 'Ana Oliveira', votos: 35000, genero: 'mulher' }
    ];

    candidatosPT.forEach((candidato, index) => {
      const id = `base_pt_${candidato.nome.toLowerCase().replace(/\s+/g, '_')}`;
      batch.set(doc(db, 'cenarios_partidos_estaduais', id), {
        cenarioId: 'base',
        partido: 'PT',
        nome: candidato.nome,
        votos: candidato.votos,
        genero: candidato.genero,
        cor: 'bg-red-600',
        corTexto: 'text-white',
        votosLegenda: 25000
      });
    });

    // Dados de exemplo para MDB
    const candidatosMDB = [
      { nome: 'Carlos Lima', votos: 52000, genero: 'homem' },
      { nome: 'Fernanda Rocha', votos: 48000, genero: 'mulher' },
      { nome: 'Roberto Alves', votos: 41000, genero: 'homem' },
      { nome: 'Juliana Ferreira', votos: 39000, genero: 'mulher' }
    ];

    candidatosMDB.forEach((candidato, index) => {
      const id = `base_mdb_${candidato.nome.toLowerCase().replace(/\s+/g, '_')}`;
      batch.set(doc(db, 'cenarios_partidos_estaduais', id), {
        cenarioId: 'base',
        partido: 'MDB',
        nome: candidato.nome,
        votos: candidato.votos,
        genero: candidato.genero,
        cor: 'bg-yellow-400',
        corTexto: 'text-gray-900',
        votosLegenda: 30000
      });
    });

    // Dados de exemplo para PP
    const candidatosPP = [
      { nome: 'Marcos Pereira', votos: 38000, genero: 'homem' },
      { nome: 'Lucia Mendes', votos: 35000, genero: 'mulher' },
      { nome: 'Ricardo Souza', votos: 32000, genero: 'homem' },
      { nome: 'Patricia Lima', votos: 29000, genero: 'mulher' }
    ];

    candidatosPP.forEach((candidato, index) => {
      const id = `base_pp_${candidato.nome.toLowerCase().replace(/\s+/g, '_')}`;
      batch.set(doc(db, 'cenarios_partidos_estaduais', id), {
        cenarioId: 'base',
        partido: 'PP',
        nome: candidato.nome,
        votos: candidato.votos,
        genero: candidato.genero,
        cor: 'bg-sky-400',
        corTexto: 'text-white',
        votosLegenda: 20000
      });
    });

    // 3. Criar coleção 'quociente_eleitoral_estadual'
    console.log('Criando coleção: quociente_eleitoral_estadual');
    batch.set(doc(db, 'quociente_eleitoral_estadual', 'atual'), {
      valor: 190000,
      atualizadoEm: new Date().toISOString()
    });

    // Executar o batch
    console.log('Executando batch...');
    await batch.commit();
    
    console.log('✅ Coleções criadas com sucesso!');
    console.log('📋 Coleções criadas:');
    console.log('   - cenarios_estaduais');
    console.log('   - cenarios_partidos_estaduais');
    console.log('   - quociente_eleitoral_estadual');
    console.log('📊 Dados de exemplo incluídos para PT, MDB e PP');

  } catch (error) {
    console.error('❌ Erro ao criar coleções:', error);
  }
}

// Executar o script
criarColecoesEstaduais()
  .then(() => {
    console.log('Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro no script:', error);
    process.exit(1);
  }); 