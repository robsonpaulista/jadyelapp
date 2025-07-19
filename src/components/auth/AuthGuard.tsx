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
    // Verificar primeiro se já temos dados no localStorage (mais rápido)
    const existingUserData = localStorage.getItem('user');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (existingUserData && isLoggedIn === 'true') {
      try {
        const userData = JSON.parse(existingUserData);
        setUser(userData);
        setLoading(false);
        return;
      } catch (error) {
        // Se os dados estão corrompidos, limpar e continuar
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Verificar novamente se os dados já existem no localStorage
        const existingUserData = localStorage.getItem('user');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        if (existingUserData && isLoggedIn === 'true') {
          setLoading(false);
          return;
        }
        
        // Se não há dados, buscar no Firestore
        let userRole = 'admin';
        let userLevel = 'admin';
        let userName = user.displayName || user.email || '';
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
        ];

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userDataFromDb = userDoc.data();
            userRole = userDataFromDb.role || 'admin';
            userLevel = userDataFromDb.level || 'admin';
            userName = userDataFromDb.name || userName;
            userPermissions = userDataFromDb.permissions || userPermissions;
          }
        } catch (firestoreError) {
          console.warn('Erro ao acessar Firestore:', firestoreError);
        }
        
        // Salvar dados com estrutura compatível com sistema de permissões
        const userData = {
          id: user.uid,
          username: user.email || '',
          nome: userName,
          name: userName, // Campo obrigatório para sistema de permissões
          email: user.email || '',
          perfil: userRole,
          level: userLevel, // Campo obrigatório para sistema de permissões
          permissions: userPermissions,
          token: await user.getIdToken(),
        };
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userAuthenticated', 'true');
        localStorage.setItem('userPermissions', JSON.stringify(userPermissions));
        localStorage.setItem('lastLoginTime', Date.now().toString());
        
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

  return <>{children}</>;
};

export default AuthGuard; 