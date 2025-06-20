'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  ChevronLeft,
  Save,
  X,
  Check,
  AlignLeft
} from 'lucide-react';
import {
  User as UserType,
  Application,
  Permission,
  Role,
  getCurrentUser,
  getUsers,
  saveUser,
  deleteUser,
  getApplications,
  getPermissions,
  savePermission,
  deletePermission,
  hasApplicationPermission
} from '@/lib/storage';

// Componente Modal base
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        
        <motion.div
          className="relative bg-blue-900 border border-blue-700 rounded-xl shadow-xl w-full max-w-md z-10"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <div className="flex items-center justify-between p-4 border-b border-blue-800">
            <h3 className="text-lg font-medium">{title}</h3>
            <button onClick={onClose} className="text-blue-300 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default function UsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado do usuário que está sendo editado
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  // Estado para o gerenciamento de permissões
  const [permissionUserId, setPermissionUserId] = useState<string | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState<{[key: string]: {canAccess: boolean, canEdit: boolean}}>({});

  useEffect(() => {
    // Verificar se o usuário está logado e tem permissão
    const loggedUser = getCurrentUser();
    if (!loggedUser) {
      toast.error('Sessão expirada. Por favor, faça login novamente.');
      router.push('/');
      return;
    }

    // Verificar se o usuário tem permissão para gerenciar usuários
    if (loggedUser.role !== 'admin' && !hasApplicationPermission(loggedUser.id, '2', true)) {
      toast.error('Você não tem permissão para acessar esta página.');
      router.push('/painel-aplicacoes');
      return;
    }

    setCurrentUser(loggedUser);
    refreshData();
  }, [router]);

  // Função para atualizar os dados
  const refreshData = () => {
    setUsers(getUsers());
    setApplications(getApplications());
    setPermissions(getPermissions());
  };

  // Filtrar usuários pelo termo de busca
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir modal para adicionar novo usuário
  const handleAddUser = () => {
    const newUser: UserType = {
      id: uuidv4(),
      name: '',
      email: '',
      password: '',
      role: 'user' as Role,
      createdAt: new Date().toISOString()
    };
    
    setEditingUser(newUser);
    // Inicializar permissões vazias para o novo usuário
    const permsObj: {[key: string]: {canAccess: boolean, canEdit: boolean}} = {};
    applications.forEach(app => {
      permsObj[app.id] = { canAccess: false, canEdit: false };
    });
    setUserPermissions(permsObj);
    setIsUserModalOpen(true);
  };

  // Abrir modal para editar usuário
  const handleEditUser = (user: UserType) => {
    setEditingUser({ ...user });
    // Buscar permissões atuais do usuário
    const userPerms = permissions.filter(p => p.userId === user.id);
    const permsObj: {[key: string]: {canAccess: boolean, canEdit: boolean}} = {};
    
    // Inicializar com todas as aplicações sem permissão
    applications.forEach(app => {
      permsObj[app.id] = { canAccess: false, canEdit: false };
    });
    
    // Atualizar com as permissões existentes
    userPerms.forEach(perm => {
      permsObj[perm.applicationId] = {
        canAccess: perm.canAccess,
        canEdit: perm.canEdit
      };
    });
    
    setUserPermissions(permsObj);
    setIsUserModalOpen(true);
  };

  // Salvar usuário
  const handleSaveUser = () => {
    if (!editingUser) return;
    
    if (!editingUser.name.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }
    
    if (!editingUser.email.trim()) {
      toast.error('O email é obrigatório');
      return;
    }
    
    if (!editingUser.password.trim() && !users.some(u => u.id === editingUser.id)) {
      toast.error('A senha é obrigatória para novos usuários');
      return;
    }
    
    try {
      // Prepara o usuário para salvar
      const userToSave = {
        ...editingUser,
        active: true,
        createdAt: editingUser.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Salvar usuário
      saveUser(userToSave);

      // Salvar permissões
      Object.entries(userPermissions).forEach(([appId, perm]) => {
        if (perm.canAccess) {
          savePermission({
            userId: userToSave.id,
            applicationId: appId,
            canAccess: perm.canAccess,
            canEdit: perm.canEdit
          });
        } else {
          deletePermission(userToSave.id, appId);
        }
      });
      
      toast.success(users.some(u => u.id === editingUser.id) ? 'Usuário atualizado com sucesso' : 'Usuário criado com sucesso');
      setIsUserModalOpen(false);
      refreshData();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error('Ocorreu um erro ao salvar o usuário');
    }
  };

  // Excluir usuário
  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('Você não pode excluir seu próprio usuário');
      return;
    }
    
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteUser(userId);
      toast.success('Usuário excluído com sucesso');
      refreshData();
    }
  };

  // Abrir modal de gerenciamento de permissões
  const handleOpenPermissions = (userId: string) => {
    // Buscar as permissões atuais do usuário
    const userPerms = permissions.filter(p => p.userId === userId);
    
    // Preparar o objeto de permissões para o estado
    const permsObj: {[key: string]: {canAccess: boolean, canEdit: boolean}} = {};
    
    // Inicializar com todas as aplicações sem permissão
    applications.forEach(app => {
      permsObj[app.id] = { canAccess: false, canEdit: false };
    });
    
    // Atualizar com as permissões existentes
    userPerms.forEach(perm => {
      permsObj[perm.applicationId] = {
        canAccess: perm.canAccess,
        canEdit: perm.canEdit
      };
    });
    
    setPermissionUserId(userId);
    setUserPermissions(permsObj);
    setIsPermissionModalOpen(true);
  };

  // Salvar permissões
  const handleSavePermissions = () => {
    if (!permissionUserId) return;
    
    // Para cada aplicação, salvar ou excluir a permissão
    applications.forEach(app => {
      const perm = userPermissions[app.id];
      
      if (perm.canAccess) {
        // Salvar permissão
        savePermission({
          userId: permissionUserId,
          applicationId: app.id,
          canAccess: perm.canAccess,
          canEdit: perm.canEdit
        });
      } else {
        // Excluir permissão
        deletePermission(permissionUserId, app.id);
      }
    });
    
    toast.success('Permissões atualizadas com sucesso');
    setIsPermissionModalOpen(false);
    refreshData();
  };

  // Encontrar o nome do usuário para o qual estamos gerenciando permissões
  const permissionUserName = permissionUserId 
    ? users.find(u => u.id === permissionUserId)?.name 
    : '';

  // Função para formatar o nome da função do usuário
  const formatUserRole = (role: Role) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'attendant':
        return 'Atendente';
      case 'manager':
        return 'Gerente';
      default:
        return 'Usuário';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
      <header className="bg-blue-950 p-4 border-b border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
            <Link href="/painel-aplicacoes" className="flex items-center mr-4 px-4 py-2 bg-blue-900/50 hover:bg-blue-800 rounded-lg">
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Voltar ao Painel</span>
            </Link>
            <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
              </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded bg-blue-800/50 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            
            <button 
              onClick={handleAddUser}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </button>
          </div>
        </div>
      </header>
      
      <div className="p-4 md:p-8">
        {/* Tabela de usuários */}
        <div className="bg-blue-900/30 border border-blue-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="bg-blue-900/50 border-b border-blue-800">
                  <th className="text-left py-3 px-4">Nome</th>
                  <th className="text-left py-3 px-4 hidden md:table-cell">Email</th>
                  <th className="text-center py-3 px-4 hidden lg:table-cell">Função</th>
                  <th className="text-right py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-blue-800/50 hover:bg-blue-800/20">
                    <td className="py-3 px-4">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-blue-300 text-sm md:hidden">{user.email}</div>
                      </td>
                    <td className="py-3 px-4 hidden md:table-cell">{user.email}</td>
                    <td className="py-3 px-4 text-center hidden lg:table-cell">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-red-900/30 text-red-300 border border-red-800/30' 
                          : user.role === 'attendant'
                          ? 'bg-green-900/30 text-green-300 border border-green-800/30'
                          : user.role === 'manager'
                          ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-800/30'
                          : 'bg-blue-900/30 text-blue-300 border border-blue-800/30'
                      }`}>
                        {formatUserRole(user.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenPermissions(user.id)}
                          className="p-1 hover:bg-blue-700 rounded"
                          title="Gerenciar permissões"
                        >
                          <Shield className="h-5 w-5" />
                        </button>
                          <button
                          onClick={() => handleEditUser(user)}
                          className="p-1 hover:bg-blue-700 rounded"
                            title="Editar usuário"
                          >
                          <Edit className="h-5 w-5" />
                          </button>
                          <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 hover:bg-red-700 rounded"
                            title="Excluir usuário"
                          >
                          <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-blue-300">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>
        </div>
      </div>
      
      {/* Modal de edição de usuário */}
      <Modal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        title={editingUser?.id ? "Editar Usuário" : "Adicionar Usuário"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              type="text"
              value={editingUser?.name || ''}
              onChange={e => setEditingUser({ ...editingUser!, name: e.target.value })}
              className="w-full px-3 py-2 bg-blue-800/30 border border-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome completo"
            />
          </div>
            
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={editingUser?.email || ''}
              onChange={e => setEditingUser({ ...editingUser!, email: e.target.value })}
              className="w-full px-3 py-2 bg-blue-800/30 border border-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@exemplo.com"
            />
          </div>
            
          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input
              type="password"
              value={editingUser?.password || ''}
              onChange={e => setEditingUser({ ...editingUser!, password: e.target.value })}
              className="w-full px-3 py-2 bg-blue-800/30 border border-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
            
          <div>
            <label className="block text-sm font-medium mb-1">Função</label>
            <select
              value={editingUser?.role || 'user'}
              onChange={e => setEditingUser({ ...editingUser!, role: e.target.value as Role })}
              className="w-full px-3 py-2 bg-blue-800/30 border border-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
              <option value="attendant">Atendente</option>
              <option value="manager">Gerente</option>
            </select>
          </div>

          {/* Seção de Permissões */}
          <div>
            <label className="block text-sm font-medium mb-2">Permissões de Acesso</label>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {/* Portal de Aplicações */}
              <div className="border border-blue-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">Portal de Aplicações</p>
                    <p className="text-sm text-blue-300">Central de Gestão de Atendimentos</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userPermissions['1']?.canAccess || false}
                        onChange={e => {
                          const hasAccess = e.target.checked;
                          const newPermissions = { ...userPermissions };
                          
                          // Atualiza a permissão do Portal de Aplicações
                          newPermissions['1'] = {
                            canAccess: hasAccess,
                            canEdit: hasAccess ? userPermissions['1']?.canEdit || false : false
                          };
                          
                          // Se desmarcar o Portal, remove acesso a todos os cards
                          if (!hasAccess) {
                            applications.forEach(app => {
                              if (app.id !== '1') {
                                newPermissions[app.id] = {
                                  canAccess: false,
                                  canEdit: false
                                };
                              }
                            });
                          }
                          
                          setUserPermissions(newPermissions);
                        }}
                        className="sr-only"
                      />
                      <div className={`h-6 w-10 rounded-full transition ${
                        userPermissions['1']?.canAccess 
                          ? 'bg-green-600' 
                          : 'bg-blue-900'
                      }`}>
                        <div className={`transform transition-transform h-5 w-5 rounded-full bg-white m-0.5 ${
                          userPermissions['1']?.canAccess 
                            ? 'translate-x-4' 
                            : 'translate-x-0'
                        }`} />
                      </div>
                      <span className="ml-2 text-sm">
                        {userPermissions['1']?.canAccess ? 'Pode acessar' : 'Sem acesso'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Cards do Portal (só mostra se tiver acesso ao Portal) */}
                {userPermissions['1']?.canAccess && (
                  <div className="ml-4 space-y-3 border-l-2 border-blue-800 pl-4">
                    {applications.filter(app => app.id !== '1').map(app => (
                      <div key={app.id} className="flex items-center justify-between p-2 bg-blue-800/20 rounded">
                        <div>
                          <p className="font-medium">{app.name}</p>
                          <p className="text-sm text-blue-300">{app.description}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={userPermissions[app.id]?.canAccess || false}
                              onChange={e => setUserPermissions({
                                ...userPermissions,
                                [app.id]: { 
                                  ...userPermissions[app.id], 
                                  canAccess: e.target.checked,
                                  canEdit: e.target.checked ? userPermissions[app.id]?.canEdit || false : false 
                                }
                              })}
                              className="sr-only"
                            />
                            <div className={`h-6 w-10 rounded-full transition ${
                              userPermissions[app.id]?.canAccess 
                                ? 'bg-green-600' 
                                : 'bg-blue-900'
                            }`}>
                              <div className={`transform transition-transform h-5 w-5 rounded-full bg-white m-0.5 ${
                                userPermissions[app.id]?.canAccess 
                                  ? 'translate-x-4' 
                                  : 'translate-x-0'
                              }`} />
                            </div>
                            <span className="ml-2 text-sm">
                              {userPermissions[app.id]?.canAccess ? 'Pode acessar' : 'Sem acesso'}
                            </span>
                          </label>

                          {userPermissions[app.id]?.canAccess && (
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={userPermissions[app.id]?.canEdit || false}
                                onChange={e => setUserPermissions({
                                  ...userPermissions,
                                  [app.id]: { 
                                    ...userPermissions[app.id], 
                                    canEdit: e.target.checked 
                                  }
                                })}
                                className="sr-only"
                              />
                              <div className={`h-5 w-9 rounded-full transition ${
                                userPermissions[app.id]?.canEdit 
                                  ? 'bg-orange-500' 
                                  : 'bg-blue-900'
                              }`}>
                                <div className={`transform transition-transform h-4 w-4 rounded-full bg-white m-0.5 ${
                                  userPermissions[app.id]?.canEdit 
                                    ? 'translate-x-4' 
                                    : 'translate-x-0'
                                }`} />
                              </div>
                              <span className="ml-2 text-sm">
                                {userPermissions[app.id]?.canEdit ? 'Pode editar' : 'Apenas visualizar'}
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
            
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveUser}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Modal de gerenciamento de permissões */}
      <Modal 
        isOpen={isPermissionModalOpen} 
        onClose={() => setIsPermissionModalOpen(false)} 
        title="Gerenciar Permissões"
      >
        <div className="space-y-4">
          <p className="text-blue-300 text-sm">
            Defina quais aplicações o usuário pode acessar e editar
          </p>
          
          <div className="max-h-64 overflow-y-auto pr-2">
            {applications.map(app => (
              <div key={app.id} className="mb-3 border-b border-blue-800 pb-3 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">{app.name}</div>
            <div>
                    <label className="inline-flex items-center cursor-pointer">
              <input
                        type="checkbox"
                        checked={userPermissions[app.id]?.canAccess || false}
                        onChange={e => setUserPermissions({
                          ...userPermissions,
                          [app.id]: { 
                            ...userPermissions[app.id], 
                            canAccess: e.target.checked,
                            // Se desmarcar acesso, também desmarca edição
                            canEdit: e.target.checked ? userPermissions[app.id]?.canEdit || false : false 
                          }
                        })}
                        className="sr-only"
                      />
                      <div className={`h-6 w-10 rounded-full transition ${
                        userPermissions[app.id]?.canAccess 
                          ? 'bg-green-600' 
                          : 'bg-blue-900'
                      }`}>
                        <div className={`transform transition-transform h-5 w-5 rounded-full bg-white m-0.5 ${
                          userPermissions[app.id]?.canAccess 
                            ? 'translate-x-4' 
                            : 'translate-x-0'
                        }`} />
            </div>
                      <span className="ml-2 text-sm">
                        {userPermissions[app.id]?.canAccess ? 'Pode acessar' : 'Sem acesso'}
                      </span>
              </label>
                  </div>
            </div>
            
                {userPermissions[app.id]?.canAccess && (
                  <div className="flex justify-between items-center pl-4 mt-2">
                    <div className="text-sm text-blue-300">Permissão para editar</div>
                    <div>
                      <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                          checked={userPermissions[app.id]?.canEdit || false}
                          onChange={e => setUserPermissions({
                            ...userPermissions,
                            [app.id]: { 
                              ...userPermissions[app.id], 
                              canEdit: e.target.checked 
                            }
                          })}
                  className="sr-only"
                        />
                        <div className={`h-5 w-9 rounded-full transition ${
                          userPermissions[app.id]?.canEdit 
                            ? 'bg-orange-500' 
                            : 'bg-blue-900'
                        }`}>
                          <div className={`transform transition-transform h-4 w-4 rounded-full bg-white m-0.5 ${
                            userPermissions[app.id]?.canEdit 
                              ? 'translate-x-4' 
                              : 'translate-x-0'
                          }`} />
                </div>
                        <span className="ml-2 text-sm">
                          {userPermissions[app.id]?.canEdit ? 'Pode editar' : 'Apenas visualizar'}
                        </span>
              </label>
            </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => setIsPermissionModalOpen(false)}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleSavePermissions}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded flex items-center"
            >
              <Check className="h-4 w-4 mr-2" />
              Salvar Permissões
            </button>
          </div>
      </div>
      </Modal>
    </div>
  );
} 