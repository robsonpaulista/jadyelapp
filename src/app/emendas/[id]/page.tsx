"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FaArrowLeft, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { getEmendaById, updateEmenda } from "@/lib/storage";
import toast, { Toaster } from "react-hot-toast";

// Interface para a Emenda
interface Emenda {
  id: string;
  emenda: string;
  classificacao_emenda: string;
  tipo: string;
  cnpj_beneficiario: string;
  municipio: string;
  objeto: string;
  gnd: string;
  nroproposta: string;
  portaria_convenio: string;
  ordemprioridade: string;
  objeto_obra: string;
  elaboracao: string;
  valor_indicado: number;
  alteracao: string;
  empenho: string;
  valor_empenho: number;
  dataempenho: string;
  valoraempenhar: number;
  pagamento: string;
  valorpago: number;
  valoraserpago: number;
  status_situacao: string;
  dataultimaatualizacao?: string;
}

export default function EmendaDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : "";
  
  const [emenda, setEmenda] = useState<Emenda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Emenda | null>(null);

  useEffect(() => {
    if (id) {
      fetchEmenda();
    } else {
      router.push("/dashboardemendas");
    }
  }, [id]);

  const fetchEmenda = () => {
    setIsLoading(true);
    try {
      if (!id) {
        toast.error("ID da emenda não fornecido");
        router.push("/dashboardemendas");
        return;
      }
      
      const data = getEmendaById(id);
      if (data) {
        setEmenda(data);
        setFormData(data);
      } else {
        toast.error("Emenda não encontrada");
        router.push("/dashboardemendas");
      }
    } catch (error) {
      console.error("Erro ao buscar emenda:", error);
      toast.error("Erro ao carregar dados da emenda");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData({
        ...formData,
        [name]: name.includes("valor") ? parseFloat(value) || 0 : value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !id) return;

    try {
      updateEmenda(id, formData);
      setEmenda(formData);
      setIsEditing(false);
      toast.success("Emenda atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar emenda:", error);
      toast.error("Erro ao atualizar emenda");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!emenda) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Emenda não encontrada</h2>
          <button
            onClick={() => router.push("/dashboardemendas")}
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Voltar para Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      <div className="container mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">Detalhes da Emenda</h1>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSubmit}
                    className="bg-green-500 text-white p-2 rounded"
                    title="Salvar"
                  >
                    <FaSave />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(emenda);
                    }}
                    className="bg-red-500 text-white p-2 rounded"
                    title="Cancelar"
                  >
                    <FaTimes />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-yellow-500 text-white p-2 rounded"
                  title="Editar"
                >
                  <FaEdit />
                </button>
              )}
              <button
                onClick={() => router.push("/dashboardemendas")}
                className="bg-blue-500 text-white p-2 rounded"
                title="Voltar"
              >
                <FaArrowLeft />
              </button>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Emenda</label>
                <input
                  type="text"
                  name="emenda"
                  value={isEditing ? formData?.emenda : emenda.emenda}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Classificação da Emenda</label>
                <input
                  type="text"
                  name="classificacao_emenda"
                  value={isEditing ? formData?.classificacao_emenda : emenda.classificacao_emenda}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <input
                  type="text"
                  name="tipo"
                  value={isEditing ? formData?.tipo : emenda.tipo}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">CNPJ do Beneficiário</label>
                <input
                  type="text"
                  name="cnpj_beneficiario"
                  value={isEditing ? formData?.cnpj_beneficiario : emenda.cnpj_beneficiario}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Município</label>
                <input
                  type="text"
                  name="municipio"
                  value={isEditing ? formData?.municipio : emenda.municipio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Objeto</label>
                <input
                  type="text"
                  name="objeto"
                  value={isEditing ? formData?.objeto : emenda.objeto}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">GND</label>
                <input
                  type="text"
                  name="gnd"
                  value={isEditing ? formData?.gnd : emenda.gnd}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Número da Proposta</label>
                <input
                  type="text"
                  name="nroproposta"
                  value={isEditing ? formData?.nroproposta : emenda.nroproposta}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Portaria/Convênio</label>
                <input
                  type="text"
                  name="portaria_convenio"
                  value={isEditing ? formData?.portaria_convenio : emenda.portaria_convenio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ordem de Prioridade</label>
                <input
                  type="text"
                  name="ordemprioridade"
                  value={isEditing ? formData?.ordemprioridade : emenda.ordemprioridade}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Objeto da Obra</label>
                <input
                  type="text"
                  name="objeto_obra"
                  value={isEditing ? formData?.objeto_obra : emenda.objeto_obra}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Elaboração</label>
                <input
                  type="text"
                  name="elaboracao"
                  value={isEditing ? formData?.elaboracao : emenda.elaboracao}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valor Indicado</label>
                <input
                  type="number"
                  name="valor_indicado"
                  value={isEditing ? formData?.valor_indicado : emenda.valor_indicado}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Alteração</label>
                <input
                  type="text"
                  name="alteracao"
                  value={isEditing ? formData?.alteracao : emenda.alteracao}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Empenho</label>
                <input
                  type="text"
                  name="empenho"
                  value={isEditing ? formData?.empenho : emenda.empenho}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valor do Empenho</label>
                <input
                  type="number"
                  name="valor_empenho"
                  value={isEditing ? formData?.valor_empenho : emenda.valor_empenho}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Data do Empenho</label>
                <input
                  type="date"
                  name="dataempenho"
                  value={isEditing ? formData?.dataempenho : emenda.dataempenho}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valor a Empenhar</label>
                <input
                  type="number"
                  name="valoraempenhar"
                  value={isEditing ? formData?.valoraempenhar : emenda.valoraempenhar}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Pagamento</label>
                <input
                  type="text"
                  name="pagamento"
                  value={isEditing ? formData?.pagamento : emenda.pagamento}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valor Pago</label>
                <input
                  type="number"
                  name="valorpago"
                  value={isEditing ? formData?.valorpago : emenda.valorpago}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valor a Ser Pago</label>
                <input
                  type="number"
                  name="valoraserpago"
                  value={isEditing ? formData?.valoraserpago : emenda.valoraserpago}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status/Situação</label>
                <input
                  type="text"
                  name="status_situacao"
                  value={isEditing ? formData?.status_situacao : emenda.status_situacao}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 