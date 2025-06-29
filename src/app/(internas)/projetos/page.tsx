'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/auth/RouteGuard';

export default function ProjetosPage() {
  const { hasAccess, isLoading, isGabineteJuridico, isAdmin } = usePermissions();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Verifica se o usuário tem acesso
  if (!hasAccess('/projetos')) {
    return <AccessDenied message="Esta página é restrita ao Gabinete Jurídico." />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Navbar interna do conteúdo */}
      <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col items-start">
            <span className="text-base md:text-lg font-semibold text-gray-900">Projetos Jurídicos</span>
            <span className="text-xs text-gray-500 font-light">Área exclusiva para o Gabinete Jurídico gerenciar projetos e documentos legais</span>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Projetos Jurídicos</h1>
          <p className="text-gray-600">
            Área exclusiva para o Gabinete Jurídico gerenciar projetos e documentos legais.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Página em Desenvolvimento</h2>
            <p className="text-gray-600 mb-6">
              Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
            </p>
            
            {isAdmin() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                <h3 className="font-medium text-yellow-800 mb-2">Nota para Administradores</h3>
                <p className="text-yellow-700 text-sm">
                  Esta página foi criada temporariamente para o sistema de permissões. 
                  Implemente aqui as funcionalidades específicas do Gabinete Jurídico.
                </p>
              </div>
            )}
          </div>
        </div>

        {(isGabineteJuridico() || isAdmin()) && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-medium text-gray-900 mb-2">Projetos de Lei</h3>
              <p className="text-gray-600 text-sm">Gerencie projetos de lei em tramitação.</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-medium text-gray-900 mb-2">Pareceres Jurídicos</h3>
              <p className="text-gray-600 text-sm">Elabore e acompanhe pareceres legais.</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-medium text-gray-900 mb-2">Documentos Legais</h3>
              <p className="text-gray-600 text-sm">Organize documentos e contratos.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 