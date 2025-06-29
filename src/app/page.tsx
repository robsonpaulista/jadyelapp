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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
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
          className="absolute top-3/4 right-1/4 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
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

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white backdrop-blur-sm bg-opacity-80 rounded-xl shadow-2xl w-full max-w-md z-10 p-8 relative overflow-hidden border border-gray-100"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 opacity-90 z-0"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col items-center justify-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg"
            >
              <FiUser className="text-white text-2xl" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800 text-center">Hub de aplicações Deputado Federal Jadyel Alencar</h1>
            <p className="text-gray-500 mt-2 text-center">Faça login para acessar o sistema</p>
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center"
            >
              <FiAlertCircle className="mr-2 flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </motion.div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Digite seu email"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Digite sua senha"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
} 