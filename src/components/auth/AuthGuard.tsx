'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuário está logado no Firebase
        setUser(user);
        
        // Buscar dados adicionais do usuário no Firestore
        let userRole = 'admin'; // Perfil padrão para usuários logados
        let userPermissions: string[] = [
          'painel-aplicacoes',
          'acoes',
          'obras_demandas',
          'emendas2025',
          'baseliderancas',
          'projecao2026',
          'instagram-analytics',
          'gerenciar-usuarios',
          'configuracoes',
          'cadastro',
          'pacientes',
          'usuarios',
          'tipos-acao',
          'pessoas',
          'chapas',
          'consultar-tetos',
          'eleicoes-anteriores',
          'monitoramento-noticias',
          'pesquisas-eleitorais',
          'eleitores-municipio',
          'emendas',
          'criaremendas',
          'dashboardemendas',
          'relatorios'
        ]; // Todas as permissões por padrão

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userDataFromDb = userDoc.data();
            userRole = userDataFromDb.role || 'admin';
            userPermissions = userDataFromDb.permissions || userPermissions;
            console.log('📄 Dados do Firestore carregados:', { role: userRole, permissions: userPermissions });
          } else {
            console.log('📄 Usuário não encontrado no Firestore, usando permissões admin padrão');
          }
        } catch (firestoreError) {
          console.warn('⚠️ Erro ao acessar Firestore, usando permissões admin padrão:', firestoreError);
        }
        
        // Salvar dados do usuário no localStorage para compatibilidade
        const userData = {
          id: user.uid,
          username: user.email || '',
          nome: user.displayName || user.email || '',
          email: user.email || '',
          perfil: userRole,
          role: userRole,
          permissions: userPermissions,
          token: '',
        };
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userAuthenticated', 'true');
        localStorage.setItem('userPermissions', JSON.stringify(userPermissions));
        localStorage.setItem('lastLoginTime', Date.now().toString());
        
        console.log('✅ Usuário configurado:', { 
          email: user.email, 
          role: userRole, 
          permissionsCount: userPermissions.length 
        });
        
        setLoading(false);
      } else {
        // Usuário não está logado, limpar dados e redirecionar
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        localStorage.removeItem('userAuthenticated');
        localStorage.removeItem('userPermissions');
        localStorage.removeItem('lastLoginTime');
        
        router.push('/');
      }
    });

    // Limpar o listener quando o componente for desmontado
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-lg font-medium text-gray-700">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se o usuário estiver logado, renderiza as páginas filhas
  return <>{children}</>;
};

export default AuthGuard; 