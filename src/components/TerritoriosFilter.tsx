'use client';

import { useState, useEffect } from 'react';
import { Filter, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';

interface TerritoriosFilterProps {
  onFilterChange: (territorio: string | null, municipios: string[]) => void;
  onShowSummary?: (territorio: string, municipios: string[]) => void;
}

export default function TerritoriosFilter({ onFilterChange, onShowSummary }: TerritoriosFilterProps) {
  const [territorios, setTerritorios] = useState<Record<string, string[]>>({});
  const [selectedTerritorio, setSelectedTerritorio] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Carrega os territórios do JSON
    fetch('/territorios.json')
      .then(response => response.json())
      .then(data => setTerritorios(data))
      .catch(error => console.error('Erro ao carregar territórios:', error));
  }, []);

  const handleTerritorioSelect = (territorio: string | null) => {
    setSelectedTerritorio(territorio);
    const municipios = territorio ? territorios[territorio] || [] : [];
    onFilterChange(territorio, municipios);
    setIsExpanded(false); // Fecha o dropdown após seleção
  };

  const handleShowSummary = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Botão de resumo clicado:', { selectedTerritorio, onShowSummary: !!onShowSummary });
    if (selectedTerritorio && onShowSummary) {
      console.log('Chamando onShowSummary com:', selectedTerritorio, territorios[selectedTerritorio]);
      onShowSummary(selectedTerritorio, territorios[selectedTerritorio] || []);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-xl border-2 border-gray-200 max-w-sm"
      style={{ minWidth: '250px' }}
    >
      {/* Cabeçalho clicável */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-blue-600" />
          <span className="font-medium text-sm text-gray-800">
            {selectedTerritorio || 'Filtrar por Território'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {selectedTerritorio && (
            <button
              onClick={handleShowSummary}
              className="p-1 hover:bg-blue-100 rounded-full transition-colors"
              title="Ver resumo do território"
            >
              <BarChart3 size={14} className="text-blue-600" />
            </button>
          )}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Lista expansível */}
      {isExpanded && (
        <div className="border-t bg-white rounded-b-lg max-h-80 overflow-y-auto">
          <div 
            className={`p-3 cursor-pointer hover:bg-blue-50 text-sm border-b ${!selectedTerritorio ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'}`}
            onClick={() => handleTerritorioSelect(null)}
          >
            <div className="font-medium">Todos os Municípios</div>
            <div className="text-xs text-gray-500 mt-1">
              {Object.values(territorios).flat().length} municípios
            </div>
          </div>
          
          {Object.keys(territorios).sort().map(territorio => (
            <div
              key={territorio}
              className={`p-3 cursor-pointer hover:bg-blue-50 text-sm border-b last:border-b-0 ${
                selectedTerritorio === territorio 
                  ? 'bg-blue-100 text-blue-800 font-medium' 
                  : 'text-gray-700'
              }`}
              onClick={() => handleTerritorioSelect(territorio)}
            >
              <div className="font-medium leading-tight">{territorio}</div>
              <div className="text-xs text-gray-500 mt-1">
                {territorios[territorio]?.length || 0} municípios
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 