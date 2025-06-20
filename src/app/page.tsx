'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProps } from '@/types/Auth';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiAlertCircle } from 'react-icons/fi';
import { disableConsoleLogging } from '@/lib/logger';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Desabilitar logs globalmente para proteção de dados
    if (typeof window !== 'undefined') {
      disableConsoleLogging();
    }
    
    if (isSubmitting) return; // Evitar múltiplos envios
    
    setError('');
    setIsSubmitting(true);
    
    // Marcar que o login está em andamento para evitar logout automático
    sessionStorage.setItem('login_in_progress', 'true');
    
    try {
      // Validação básica
      if (!username.trim() || !password.trim()) {
        setError('Usuário e senha são obrigatórios');
        sessionStorage.removeItem('login_in_progress');
        setIsSubmitting(false);
        return;
      }
      
      // Fazer a requisição de login usando a API dedicada
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Login bem-sucedido
        const userData: AuthProps = {
          id: data.user.id,
          username: data.user.email,
          nome: data.user.name,
          email: data.user.email,
          perfil: data.user.role,
          permissions: data.user.permissions || [],
          token: 'session-cookie-auth', // Usamos cookies para sessão
        };
        
        // Salvar os dados do usuário
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userAuthenticated', 'true');
        localStorage.setItem('userPermissions', JSON.stringify(userData.permissions));
        localStorage.setItem('lastLoginTime', Date.now().toString());
        
        // Remover o marcador de login em andamento após login bem-sucedido
        sessionStorage.removeItem('login_in_progress');
        
        // Redirecionar para o painel
        router.push('/painel-aplicacoes');
      } else {
        // Login falhou
        setError(data.message || 'Falha na autenticação');
        sessionStorage.removeItem('login_in_progress');
      }
    } catch (err) {
      // Erro silencioso - não exibir logs por segurança
      setError('Ocorreu um erro ao processar o login. Tente novamente.');
      sessionStorage.removeItem('login_in_progress');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Cabeçalho */}
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 tracking-tight">
              86 Dynamics Integration
            </h1>
            <p className="text-xs text-gray-600 uppercase tracking-widest font-medium">
              HUB DE APLICAÇÕES DEP FEDERAL JADYEL ALENCAR
            </p>
          </div>
        </motion.div>
        
        {/* Formulário de login */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100 p-8 shadow-xl backdrop-blur-sm bg-opacity-90"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Acesso ao Sistema</h2>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full p-3 mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg flex items-center gap-2"
            >
              <FiAlertCircle className="flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={handleUsernameChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  autoComplete="current-password"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-lg text-sm font-medium uppercase tracking-wider hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  PROCESSANDO...
                </span>
              ) : (
                'ENTRAR'
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
} 