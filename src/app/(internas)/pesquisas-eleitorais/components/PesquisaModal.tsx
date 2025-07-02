import React, { Dispatch, SetStateAction, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface PesquisaEleitoral {
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

interface PesquisaModalProps {
  isOpen: boolean;
  onClose: () => void;
  pesquisa: PesquisaEleitoral | null;
  form: PesquisaEleitoral;
  setForm: Dispatch<SetStateAction<PesquisaEleitoral>>;
  onSave: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  loading: boolean;
  error: string | null;
  MUNICIPIOS_PIAUI: string[];
}

export function PesquisaModal({
  isOpen,
  onClose,
  pesquisa,
  form,
  setForm,
  onSave,
  loading,
  error,
  MUNICIPIOS_PIAUI
}: PesquisaModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Nova Pesquisa Eleitoral</h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={onSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Candidato
                    </label>
                    <input
                      type="text"
                      value={form.candidato}
                      onChange={e => setForm({ ...form, candidato: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cargo
                    </label>
                    <select
                      value={form.cargo}
                      onChange={e => setForm({ ...form, cargo: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione o cargo</option>
                      <option value="Deputado Federal">Deputado Federal</option>
                      <option value="Deputado Estadual">Deputado Estadual</option>
                      <option value="Governador">Governador</option>
                      <option value="Prefeito">Prefeito</option>
                      <option value="Presidente">Presidente</option>
                      <option value="Senador">Senador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instituto
                    </label>
                    <input
                      type="text"
                      value={form.instituto}
                      onChange={e => setForm({ ...form, instituto: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      value={form.data}
                      onChange={e => setForm({ ...form, data: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Município
                    </label>
                    <select
                      value={form.municipio}
                      onChange={e => setForm({ ...form, municipio: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione um município</option>
                      {MUNICIPIOS_PIAUI.map(municipio => (
                        <option key={municipio} value={municipio}>
                          {municipio}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Votos (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.votos}
                      onChange={e => setForm({ ...form, votos: Number(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={form.tipo}
                      onChange={e => setForm({ ...form, tipo: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="Estimulada">Estimulada</option>
                      <option value="Espontânea">Espontânea</option>
                      <option value="Rejeição">Rejeição</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apoio
                    </label>
                    <select
                      value={form.apoio}
                      onChange={e => setForm({ ...form, apoio: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione o apoio</option>
                      <option value="Sim">Sim</option>
                      <option value="Não">Não</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={form.municipioMonitorado}
                        onChange={e => setForm({ ...form, municipioMonitorado: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Município Monitorado</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 