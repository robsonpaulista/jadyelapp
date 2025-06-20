import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Esta API é acessível apenas no lado do cliente
    if (typeof window !== 'undefined') {
      // Limpar o localStorage
      localStorage.clear();
      
      // Criar usuários de demonstração
      const demoUsers = [
        {
          id: '1',
          email: 'admin@exemplo.com',
          password: '123456',
          name: 'Administrador',
          role: 'admin',
          active: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          email: 'atendente@exemplo.com',
          password: '123456',
          name: 'Atendente',
          role: 'attendant',
          active: true,
          createdAt: new Date().toISOString(),
        }
      ];
      
      localStorage.setItem('dbUsers', JSON.stringify(demoUsers));
      console.log('Usuários de demonstração resetados:', demoUsers);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Usuários resetados com sucesso',
        users: demoUsers
      });
    } else {
      // No lado do servidor, não podemos acessar localStorage
      return NextResponse.json({ 
        success: false, 
        message: 'Esta API só pode ser executada no cliente' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro ao resetar usuários:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro ao resetar usuários', 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 