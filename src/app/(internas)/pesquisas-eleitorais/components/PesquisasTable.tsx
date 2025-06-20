import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PesquisaEleitoral {
  id?: string;
  apoio: string;
  candidato: string;
  cargo: string;
  criadoEm: string;
  data: string;
  instituto: string;
  municipio: string;
  municipioMonitorado: boolean;
  tipo: string;
  votos: number;
}

interface PesquisasTableProps {
  pesquisas: PesquisaEleitoral[];
  onEdit: (pesquisa: PesquisaEleitoral) => void;
  onDelete: (id: string) => void;
}

export function PesquisasTable({ pesquisas, onEdit, onDelete }: PesquisasTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Data
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Candidato
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cargo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Município
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Instituto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Votos (%)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pesquisas.map((pesquisa, index) => (
            <motion.tr
              key={pesquisa.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="hover:bg-gray-50"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(pesquisa.data).toLocaleDateString('pt-BR')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {pesquisa.candidato}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {pesquisa.cargo}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {pesquisa.municipio}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {pesquisa.instituto}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {pesquisa.votos.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex space-x-3">
                  <button
                    onClick={() => onEdit(pesquisa)}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => pesquisa.id && onDelete(pesquisa.id)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 