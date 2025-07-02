'use client';

import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProps } from '@/types/Auth';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiAlertCircle, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';
// import { disableConsoleLogging } from '@/lib/logger';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();



  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setError('');
    setIsSubmitting(true);

    try {
      if (!email.trim() || !password.trim()) {
        setError('Usuário e senha são obrigatórios');
        setIsSubmitting(false);
        return;
      }

      // Verificar se Firebase está disponível
      if (!auth) {
        throw new Error('Firebase não está configurado. Verifique as variáveis de ambiente.');
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        
        // Buscar dados adicionais do usuário no Firestore
        let userRole = 'admin'; // Perfil padrão para usuários logados
        let userLevel = 'admin'; // Nível padrão para usuários logados
        let userName = firebaseUser.displayName || firebaseUser.email || '';
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
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userDataFromDb = userDoc.data();
            userRole = userDataFromDb.role || 'admin';
            userLevel = userDataFromDb.level || 'admin'; // Campo level para o sistema de permissões
            userName = userDataFromDb.name || userName; // Nome do usuário
            userPermissions = userDataFromDb.permissions || userPermissions;
          }
        } catch (firestoreError) {
          console.warn('⚠️ Erro ao acessar Firestore, usando permissões admin padrão:', firestoreError);
        }

        // Login bem-sucedido - Estrutura compatível com o sistema de permissões
        const userData: AuthProps = {
          id: firebaseUser.uid,
          username: firebaseUser.email || '',
          nome: userName,
          name: userName, // Campo adicional para o sistema de permissões
          email: firebaseUser.email || '',
          perfil: userRole,
          level: userLevel, // Campo obrigatório para o sistema de permissões
          permissions: userPermissions,
          token: await firebaseUser.getIdToken(),
        };
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userAuthenticated', 'true');
        localStorage.setItem('userPermissions', JSON.stringify(userData.permissions));
        localStorage.setItem('lastLoginTime', Date.now().toString());
        
        // Após login bem sucedido, sempre redirecionar para o painel de aplicações
        router.push('/painel-aplicacoes');
      } else {
        setError('Falha na autenticação. Usuário não encontrado.');
      }
    } catch (err) {
      const authError = err as AuthError;
      let errorMessage = 'Ocorreu um erro ao processar o login. Tente novamente.';
      
      console.error('🔥 Erro no login Firebase:', authError);
      
      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Usuário ou senha inválidos.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'O formato do e-mail é inválido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Este usuário foi desativado.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
          break;
        case 'auth/configuration-not-found':
        case 'auth/invalid-api-key':
          errorMessage = 'Erro de configuração do Firebase. Entre em contato com o suporte.';
          break;
        default:
          if (authError.message.includes('Firebase')) {
            errorMessage = 'Erro de configuração do Firebase. Verifique as configurações.';
          }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/avatar-banner.png')] bg-no-repeat bg-center opacity-5 blur-xl scale-150 transform rotate-12"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-black/5 to-transparent"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-10"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-blue-200 rounded-full mix-blend-overlay filter blur-3xl opacity-10"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-4 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center mb-6 max-w-full">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 mb-6 relative"
          >
            <Image 
              src="/avatar-banner.png" 
              alt="Avatar Banner" 
              width={192}
              height={192}
              priority
              className="w-full h-full object-contain rounded-full shadow-xl"
            />
          </motion.div>
          
          <h1 className="text-2xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-white text-center mb-2">Hub de aplicações</h1>
          <h2 className="text-xl sm:text-xl md:text-2xl lg:text-2xl font-semibold text-white/90 text-center mb-3">Deputado Federal Jadyel Alencar</h2>
          <div className="w-12 sm:w-14 md:w-16 h-1 bg-white/30 rounded-full mb-4"></div>
          <p className="text-base sm:text-lg md:text-lg lg:text-lg text-white/80 text-center mb-4">Faça login para acessar o sistema</p>
        </div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-white/10 backdrop-blur-sm border-l-4 border-red-500 rounded-r-lg text-white text-sm flex items-center"
          >
            <FiAlertCircle className="mr-2 flex-shrink-0 text-red-500" />
            <p className="font-medium">{error}</p>
          </motion.div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4 w-full">
          <div>
            <div className="relative group">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 group-hover:text-white transition-colors" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all text-white placeholder-white/50 hover:bg-white/20"
                placeholder="Digite seu email"
              />
            </div>
          </div>

          <div>
            <div className="relative group">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 group-hover:text-white transition-colors" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all text-white placeholder-white/50 hover:bg-white/20"
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white py-3 rounded-lg font-medium hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transform transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span className="ml-2">Entrando...</span>
              </div>
            ) : (
              "Entrar"
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-white/80 text-sm">
        © 2024 86 Dynamics - Todos os direitos reservados
      </div>
    </div>
  );
} 