// Script para debugar dados do usuário no localStorage
console.log('=== DEBUG USER DATA ===');

// Verificar todos os dados no localStorage
console.log('Todos os dados no localStorage:');
Object.keys(localStorage).forEach(key => {
  console.log(`${key}:`, localStorage.getItem(key));
});

// Verificar dados específicos do usuário
console.log('\n=== DADOS DO USUÁRIO ===');
const userData = localStorage.getItem('user');
if (userData) {
  try {
    const user = JSON.parse(userData);
    console.log('User object:', user);
    console.log('User level:', user.level);
    console.log('User level type:', typeof user.level);
    console.log('User level === "piloto":', user.level === 'piloto');
    console.log('User level === "Piloto":', user.level === 'Piloto');
    console.log('User level toLowerCase():', user.level?.toLowerCase());
  } catch (error) {
    console.error('Erro ao parsear dados do usuário:', error);
  }
} else {
  console.log('Nenhum dado de usuário encontrado no localStorage');
}

// Verificar sessionStorage
console.log('\n=== DADOS NO SESSIONSTORAGE ===');
Object.keys(sessionStorage).forEach(key => {
  console.log(`${key}:`, sessionStorage.getItem(key));
});

console.log('=== FIM DEBUG ===');
