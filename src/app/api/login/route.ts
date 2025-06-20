import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByEmail, logUserActivity } from '@/lib/db/database';
import { comparePassword } from '@/lib/hash';

export async function POST(request: Request) {
  try {
    console.log("[Login API] Iniciando processo de login");
    
    // Obtém username e senha do corpo da requisição
    const body = await request.json();
    const { username, password } = body;
    
    // Valida se foram fornecidos email e senha
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Usuário e senha são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`[Login API] Tentativa de login para: ${username}`);

    // Busca o usuário pelo email - função agora é assíncrona
    const user = await getUserByEmail(username);
    
    // Verifica se o usuário existe
    if (!user) {
      console.log(`[Login API] Usuário não encontrado: ${username}`);
      return NextResponse.json(
        { success: false, message: 'Usuário ou senha inválidos' },
        { status: 401 }
      );
    }
    
    // Verifica se o usuário está ativo
    const isUserActive = Boolean(user.active);
    if (!isUserActive) {
      console.log(`[Login API] Usuário inativo: ${username}`);
      
      // Registrar tentativa de login de usuário inativo
      await logUserActivity({
        user_id: user.id,
        action_type: 'LOGIN',
        target_type: 'SYSTEM',
        details: `Tentativa de login rejeitada: Usuário inativo (${username})`,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
      
      return NextResponse.json(
        { success: false, message: 'Usuário inativo. Entre em contato com o administrador.' },
        { status: 401 }
      );
    }
    
    // Verifica se a senha está correta usando bcrypt
    const isPasswordValid = await comparePassword(password, user.password || '');
    
    if (!isPasswordValid) {
      console.log(`[Login API] Senha inválida para: ${username}`);
      
      // Registrar tentativa de login com senha inválida
      await logUserActivity({
        user_id: user.id,
        action_type: 'LOGIN',
        target_type: 'SYSTEM',
        details: `Tentativa de login falhou: Senha inválida (${username})`,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
      
      return NextResponse.json(
        { success: false, message: 'Usuário ou senha inválidos' },
        { status: 401 }
      );
    }

    console.log(`[Login API] Login bem-sucedido para: ${username}`);
    
    // Registrar login bem-sucedido
    await logUserActivity({
      user_id: user.id,
      action_type: 'LOGIN',
      target_type: 'SYSTEM',
      details: `Login bem-sucedido: ${username}`,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    // Remove a senha do objeto do usuário antes de retornar
    const { password: _, ...userWithoutPassword } = user;

    // Cria a sessão com dados mínimos
    const session = {
      user: userWithoutPassword,
      loggedAt: Date.now().toString(),
      lastActivity: Date.now().toString()
    };

    // Define o cookie da sessão
    cookies().set({
      name: 'session',
      value: encodeURIComponent(JSON.stringify(session)),
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    });

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('[Login API] Erro ao fazer login:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 