// Script para criar coleções estaduais no Firestore
// Copie e cole este código no console do navegador (F12)

async function criarColecoesEstaduais() {
  console.log('🚀 Criando coleções para chapas estaduais...');

  try {
    // Importar Firebase (se não estiver disponível)
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase não encontrado. Execute este script na página da aplicação.');
      return;
    }

    const db = firebase.firestore();
    const batch = db.batch();

    // 1. Criar coleção 'cenarios_estaduais'
    console.log('📁 Criando coleção: cenarios_estaduais');
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
    batch.set(db.collection('cenarios_estaduais').doc('base'), cenarioBase);

    // 2. Criar coleção 'cenarios_partidos_estaduais' com dados de exemplo
    console.log('📁 Criando coleção: cenarios_partidos_estaduais');
    
    // Dados de exemplo para PT
    const candidatosPT = [
      { nome: 'João Silva', votos: 45000, genero: 'homem' },
      { nome: 'Maria Santos', votos: 42000, genero: 'mulher' },
      { nome: 'Pedro Costa', votos: 38000, genero: 'homem' },
      { nome: 'Ana Oliveira', votos: 35000, genero: 'mulher' }
    ];

    candidatosPT.forEach((candidato) => {
      const id = `base_pt_${candidato.nome.toLowerCase().replace(/\s+/g, '_')}`;
      batch.set(db.collection('cenarios_partidos_estaduais').doc(id), {
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

    candidatosMDB.forEach((candidato) => {
      const id = `base_mdb_${candidato.nome.toLowerCase().replace(/\s+/g, '_')}`;
      batch.set(db.collection('cenarios_partidos_estaduais').doc(id), {
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

    candidatosPP.forEach((candidato) => {
      const id = `base_pp_${candidato.nome.toLowerCase().replace(/\s+/g, '_')}`;
      batch.set(db.collection('cenarios_partidos_estaduais').doc(id), {
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
    console.log('📁 Criando coleção: quociente_eleitoral_estadual');
    batch.set(db.collection('quociente_eleitoral_estadual').doc('atual'), {
      valor: 190000,
      atualizadoEm: new Date().toISOString()
    });

    // Executar o batch
    console.log('⚡ Executando batch...');
    await batch.commit();
    
    console.log('✅ Coleções criadas com sucesso!');
    console.log('📋 Coleções criadas:');
    console.log('   - cenarios_estaduais');
    console.log('   - cenarios_partidos_estaduais');
    console.log('   - quociente_eleitoral_estadual');
    console.log('📊 Dados de exemplo incluídos para PT, MDB e PP');
    console.log('🎯 Agora você pode usar a página de chapas estaduais!');

  } catch (error) {
    console.error('❌ Erro ao criar coleções:', error);
  }
}

// Executar o script
criarColecoesEstaduais(); 