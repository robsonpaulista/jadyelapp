import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDatabase } from '@/lib/db/index';

// Lista de aplicações mock
const mockApplications = [
  {
    id: "acoes",
    name: "Campanhas de Positivação",
    description: "Sistema de gerenciamento de campanhas e cadastro de positivados",
    icon: "UserCheck",
    href: "/acoes",
    isActive: true
  },
  {
    id: "emendas2025",
    name: "Emendas",
    description: "Sistema de gerenciamento de emendas parlamentares",
    icon: "FileText",
    href: "/emendas2025",
    isActive: true
  },
  {
    id: "baseliderancas",
    name: "Base de Lideranças",
    description: "Dashboard de análise hierárquica da base de lideranças",
    icon: "ListTree",
    href: "/baseliderancas",
    isActive: true
  },
  {
    id: "projecao2026",
    name: "Projeção Votação 2026",
    description: "Análise de projeção de votação para as eleições de 2026",
    icon: "BarChart",
    href: "/projecao2026",
    isActive: true
  },
  {
    id: "instagram-analytics",
    name: "Análise Instagram",
    description: "Métricas de desempenho e engajamento do Instagram",
    icon: "Instagram",
    href: "/instagram-analytics",
    isActive: true
  },
  {
    id: "gerenciar-usuarios",
    name: "Gerenciar Usuários",
    description: "Gerenciamento de usuários e permissões do sistema",
    icon: "Users",
    href: "/gerenciar-usuarios",
    isActive: true
  },
  {
    id: "configuracoes",
    name: "Configurações",
    description: "Configurações do sistema e monitoramento de APIs",
    icon: "Settings",
    href: "/configuracoes",
    isActive: true
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Para evitar erros no cliente, estamos usando dados mock
    // No futuro, quando o banco de dados estiver configurado, podemos descomentar o código abaixo
    /*
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT a.* 
      FROM applications a
      INNER JOIN permissions p ON p.applicationId = a.id
      WHERE p.userId = ? AND p.canAccess = 1 AND a.isActive = 1
    `);
    const applications = stmt.all(userId);
    */
    
    // Por enquanto, retornamos todas as aplicações mock
    // Aqui você poderia filtrar com base nas permissões do usuário
    return NextResponse.json(mockApplications);
  } catch (error) {
    console.error('Erro ao buscar aplicações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 