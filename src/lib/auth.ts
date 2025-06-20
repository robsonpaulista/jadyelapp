'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const checkLogin = async (email: string, password: string) => {
  // Esta função não é mais necessária com Firebase, mas mantemos para compatibilidade
  return false;
};

export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const user = localStorage.getItem('user');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (user && isLoggedIn === 'true') {
      return JSON.parse(user);
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
  }
};

export const logout = async (): Promise<boolean> => {
  // Verificar se um login está em andamento
  const loginInProgress = sessionStorage.getItem('login_in_progress') === 'true';
  if (loginInProgress) {
    console.log('Não foi possível realizar logout: Login em andamento');
    return false;
  }
  
  // Evitar múltiplos logouts em sequência (dentro de 5 segundos)
  const lastLogoutTime = localStorage.getItem('last_logout_time');
  const currentTime = Date.now();
  if (lastLogoutTime && (currentTime - parseInt(lastLogoutTime)) < 5000) {
    console.log('Ignorando tentativa de logout múltiplo (menos de 5 segundos desde o último)');
    return false;
  }
  
  // Verificar se já existe um logout em andamento
  const logoutInProgress = localStorage.getItem('logout_in_progress');
  if (logoutInProgress === 'true') {
    console.log('Já existe um processo de logout em andamento');
    return false;
  }
  
  // Marca que um logout está em andamento
  localStorage.setItem('logout_in_progress', 'true');
  localStorage.setItem('last_logout_time', currentTime.toString());
  
  try {
    console.log('Iniciando processo de logout...');
    
    // Fazer logout do Firebase
    await signOut(auth);
    
    // Limpar dados do usuário
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('userAuthenticated');
    localStorage.removeItem('userPermissions');
    localStorage.removeItem('fromAuthorizedRoute');
    localStorage.removeItem('lastLoginTime');
    
    // Limpar dados na sessionStorage
    sessionStorage.removeItem('lastRoute');
    sessionStorage.removeItem('login_in_progress');
    sessionStorage.removeItem('panelUnmounted');
    
    // Expirar cookies relacionados à sessão
    document.cookie = "fromAuthorizedRoute=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    console.log('Logout concluído com sucesso');
    return true;
  } catch (error) {
    console.error('Erro durante o processo de logout:', error);
    return false;
  } finally {
    // Sempre remover a sinalização de logout em andamento quando terminar
    localStorage.removeItem('logout_in_progress');
  }
}; 