'use client';

export const checkLogin = async (email: string, password: string) => {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Erro ao verificar login:', error);
    return false;
  }
};

export const isUserLoggedIn = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('isLoggedIn') === 'true';
};

export const getCurrentUser = async () => {
  try {
    const response = await fetch('/api/auth', {
      method: 'GET',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.isLoggedIn ? data.user : null;
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
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
    
    // Informar o servidor sobre o logout
    let serverNotified = false;
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      serverNotified = response.ok;
      console.log(`Servidor notificado sobre o logout - Status: ${serverNotified ? 'Sucesso' : 'Falha'}`);
    } catch (apiError) {
      console.error('Erro ao notificar servidor sobre logout:', apiError);
      // Continuamos com o logout mesmo se falhar a notificação ao servidor
    }
    
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