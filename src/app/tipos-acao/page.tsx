'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { CampaignType } from '@/lib/types';
import { 
  getAllCampaignTypes, 
  getCampaignTypeById, 
  saveCampaignType, 
  deleteCampaignType,
  initializeStorage 
} from '@/lib/storage';
import { FaChevronLeft } from 'react-icons/fa';

export default function TiposAcaoPage() {
  const router = useRouter();
  
  const [isClient, setIsClient] = useState(false);
  const [campaignTypes, setCampaignTypes] = useState<CampaignType[]>([]);
  const [editingType, setEditingType] = useState<CampaignType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    setIsClient(true);
    
    // Verifica se o usuário está logado
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    
    // Inicializa o storage se necessário
    initializeStorage();
    
    // Carrega os tipos de campanha
    const allCampaignTypes = getAllCampaignTypes();
    setCampaignTypes(allCampaignTypes);
  }, [router]);

  // Função para atualizar a lista de tipos de campanha
  const refreshCampaignTypes = () => {
    const allCampaignTypes = getAllCampaignTypes();
    setCampaignTypes(allCampaignTypes);
  };

  // Função para criar ou editar um tipo de campanha
  const handleSubmit = (values: any, { resetForm }: any) => {
    try {
      const campaignType: CampaignType = {
        id: values.id || uuidv4(),
        name: values.name,
        description: values.description || '',
        color: values.color || '#6366F1',
        active: values.active === 'true' || values.active === true,
        createdAt: values.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      saveCampaignType(campaignType);
      toast.success(values.id ? 'Tipo de ação atualizado com sucesso!' : 'Tipo de ação criado com sucesso!');
      resetForm();
      setShowModal(false);
      refreshCampaignTypes();
    } catch (error) {
      console.error('Erro ao salvar tipo de ação:', error);
      toast.error('Erro ao salvar tipo de ação.');
    }
  };

  // Função para editar um tipo de campanha existente
  const handleEdit = (id: string) => {
    const campaignType = getCampaignTypeById(id);
    if (campaignType) {
      setEditingType(campaignType);
      setModalMode('edit');
      setShowModal(true);
    }
  };

  // Função para excluir um tipo de campanha
  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este tipo de ação?')) {
      try {
        deleteCampaignType(id);
        toast.success('Tipo de ação excluído com sucesso!');
        refreshCampaignTypes();
      } catch (error) {
        console.error('Erro ao excluir tipo de ação:', error);
        toast.error('Erro ao excluir tipo de ação.');
      }
    }
  };

  // Valores iniciais para o formulário
  const initialValues = editingType || {
    id: '',
    name: '',
    description: '',
    color: '#6366F1',
    active: true,
    createdAt: '',
    updatedAt: ''
  };

  // Schema de validação
  const validationSchema = Yup.object({
    name: Yup.string().required('Nome é obrigatório'),
    color: Yup.string().required('Cor é obrigatória')
  });

  // Se ainda não carregou no cliente, mostra uma mensagem de carregamento
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-blue-800 to-indigo-900 text-white shadow-md p-4">
        <div className="container mx-auto px-2">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Tipos de Ações</h1>
            <button 
              onClick={() => router.push('/acoes')}
              className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto p-4 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tipos de Ação</h1>
              <p className="text-secondary-foreground mt-1">
                Crie e gerencie tipos de ação para suas campanhas
              </p>
            </div>
            <button
              onClick={() => {
                setEditingType(null);
                setModalMode('create');
                setShowModal(true);
              }}
              className="btn btn-primary flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Tipo de Ação
            </button>
          </div>

          {/* Lista de tipos de campanha */}
          <div className="bg-card rounded-xl shadow-sm border border-border/40">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">
                      Descrição
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">
                      Cor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-foreground uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {campaignTypes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Nenhum tipo de ação cadastrado
                      </td>
                    </tr>
                  ) : (
                    campaignTypes.map((type) => (
                      <tr key={type.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-foreground">{type.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-secondary-foreground">{type.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-6 h-6 rounded-full mr-2" 
                              style={{ backgroundColor: type.color }}
                            />
                            <span className="text-sm text-secondary-foreground">{type.color}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {type.active ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(type.id)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(type.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal para criar/editar tipo de campanha */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg shadow-lg max-w-lg w-full mx-4">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    {modalMode === 'create' ? 'Novo Tipo de Ação' : 'Editar Tipo de Ação'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <Formik
                  initialValues={initialValues}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                  enableReinitialize
                >
                  {({ isSubmitting, errors, touched }) => (
                    <Form className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1">Nome *</label>
                        <Field
                          name="name"
                          type="text"
                          className={`input w-full ${errors.name && touched.name ? 'border-destructive' : ''}`}
                          placeholder="Nome do tipo de ação"
                        />
                        <ErrorMessage name="name" component="div" className="mt-1 text-sm text-destructive" />
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição</label>
                        <Field
                          as="textarea"
                          name="description"
                          rows={3}
                          className="input w-full"
                          placeholder="Descrição detalhada do tipo de ação"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="color" className="block text-sm font-medium mb-1">Cor *</label>
                          <div className="flex items-center">
                            <Field
                              name="color"
                              type="color"
                              className={`input-color h-10 w-10 rounded ${errors.color && touched.color ? 'border-destructive' : ''}`}
                            />
                            <Field
                              name="color"
                              type="text"
                              className={`input ml-2 flex-1 ${errors.color && touched.color ? 'border-destructive' : ''}`}
                              placeholder="#000000"
                            />
                          </div>
                          <ErrorMessage name="color" component="div" className="mt-1 text-sm text-destructive" />
                        </div>
                        
                        <div>
                          <label htmlFor="active" className="block text-sm font-medium mb-1">Status</label>
                          <Field
                            as="select"
                            name="active"
                            className="input w-full"
                          >
                            <option value="true">Ativo</option>
                            <option value="false">Inativo</option>
                          </Field>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4 border-t border-border/40">
                        <button
                          type="button"
                          onClick={() => setShowModal(false)}
                          className="btn btn-secondary"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="btn btn-primary"
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Salvando...
                            </>
                          ) : (
                            modalMode === 'create' ? 'Criar Tipo' : 'Atualizar Tipo'
                          )}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 