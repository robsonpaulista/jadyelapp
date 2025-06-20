import { popularChapasIniciais } from '../src/services/chapasService';

popularChapasIniciais()
  .then(() => {
    console.log('Coleção chapas2026 populada!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Erro ao popular coleção:', err);
    process.exit(1);
  }); 