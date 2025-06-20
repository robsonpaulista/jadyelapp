"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, TrendingUp, Users, MapPin } from "lucide-react";

interface MunicipioEleitores {
  municipio: string;
  populacao: number;
  eleitores_estimados: number;
  percentual_eleitores: number;
  eleitores_2022: number;
  eleitores_2024: number;
  crescimento_eleitoral: number;
}

export default function EleitoresMunicipioPage() {
  const router = useRouter();
  const [dadosEleitores, setDadosEleitores] = useState<MunicipioEleitores[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"municipio" | "eleitores" | "crescimento">("municipio");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    buscarDadosEleitores();
  }, []);

  const buscarDadosEleitores = async () => {
    try {
      const res = await fetch('/api/eleitores-municipio');
      const json = await res.json();
      if (res.ok) {
        setDadosEleitores(json.eleitores || []);
      } else {
        setError(json.error || "Erro ao buscar dados de eleitores.");
      }
    } catch (err: any) {
      setError("Erro ao buscar dados de eleitores.");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar e ordenar dados
  const dadosFiltrados = dadosEleitores
    .filter(municipio => 
      municipio.municipio.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "municipio":
          aValue = a.municipio;
          bValue = b.municipio;
          break;
        case "eleitores":
          aValue = a.eleitores_estimados;
          bValue = b.eleitores_estimados;
          break;
        case "crescimento":
          aValue = a.crescimento_eleitoral;
          bValue = b.crescimento_eleitoral;
          break;
        default:
          aValue = a.municipio;
          bValue = b.municipio;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === "asc" 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

  const handleSort = (field: "municipio" | "eleitores" | "crescimento") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const totalEleitores = dadosEleitores.reduce((sum, m) => sum + m.eleitores_estimados, 0);
  const totalPopulacao = dadosEleitores.reduce((sum, m) => sum + m.populacao, 0);
  const mediaCrescimento = dadosEleitores.reduce((sum, m) => sum + m.crescimento_eleitoral, 0) / dadosEleitores.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              title="Voltar"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <span className="text-xs text-gray-500 font-light">/ Painel / Eleitores por Município</span>
          </div>
          <Link href="/painel-aplicacoes" className="text-xs text-blue-600 hover:underline">Painel de Aplicações</Link>
        </div>
      </nav>

      {/* Conteúdo */}
      <main className="w-full px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Eleitores por Município - Piauí</h1>
          
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total de Municípios</p>
                  <p className="text-2xl font-bold text-gray-900">{dadosEleitores.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total de Eleitores</p>
                  <p className="text-2xl font-bold text-gray-900">{totalEleitores.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">População Total</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPopulacao.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Crescimento Médio</p>
                  <p className="text-2xl font-bold text-gray-900">{mediaCrescimento.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros e busca */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar município..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as any);
                    setSortOrder(order as any);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="municipio-asc">Município (A-Z)</option>
                  <option value="municipio-desc">Município (Z-A)</option>
                  <option value="eleitores-desc">Mais Eleitores</option>
                  <option value="eleitores-asc">Menos Eleitores</option>
                  <option value="crescimento-desc">Maior Crescimento</option>
                  <option value="crescimento-asc">Menor Crescimento</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabela */}
          {loading && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Carregando dados de eleitores...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("municipio")}
                      >
                        Município
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        População
                      </th>
                      <th 
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("eleitores")}
                      >
                        Eleitores Estimados
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % Eleitores
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Eleitores 2022
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Eleitores 2024
                      </th>
                      <th 
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("crescimento")}
                      >
                        Crescimento (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dadosFiltrados.map((municipio, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {municipio.municipio}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                          {municipio.populacao.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {municipio.eleitores_estimados.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                          {municipio.percentual_eleitores}%
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                          {municipio.eleitores_2022.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                          {municipio.eleitores_2024.toLocaleString()}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-right ${
                          municipio.crescimento_eleitoral > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {municipio.crescimento_eleitoral > 0 ? '+' : ''}{municipio.crescimento_eleitoral}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {dadosFiltrados.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum município encontrado com o termo de busca.</p>
                </div>
              )}
            </div>
          )}

          {/* Observações */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Observações:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Dados baseados em estimativas populacionais do IBGE</li>
              <li>• Taxa de eleitores estimada em 68% da população</li>
              <li>• Crescimento eleitoral estimado em 2% ao ano</li>
              <li>• Para dados oficiais, consulte o TSE</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
} 