import React, { useState, useMemo } from 'react';
import { SavedAnalysis } from '../types';

interface SavedAnalysesProps {
  analyses: SavedAnalysis[];
  onLoad: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';

const SavedAnalyses: React.FC<SavedAnalysesProps> = ({ analyses, onLoad, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');

  const filteredAndSortedAnalyses = useMemo(() => {
    let result = [...analyses];

    // Filter
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        a => 
          a.name.toLowerCase().includes(lowerTerm) || 
          a.inputs.nomeEmpresa.toLowerCase().includes(lowerTerm) ||
          a.inputs.cnpj.includes(lowerTerm)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          // id is ISO date string in this app's logic, or we use date string parsing
          return new Date(b.id).getTime() - new Date(a.id).getTime();
        case 'date-asc':
          return new Date(a.id).getTime() - new Date(b.id).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return result;
  }, [analyses, searchTerm, sortOption]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-colors duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left font-bold text-lg text-gray-800 dark:text-white focus:outline-none"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
            <i className="fa-solid fa-history text-indigo-500"></i>
            Análises Salvas
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {analyses.length}
            </span>
        </span>
        <i className={`fa-solid fa-chevron-down transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>
      
      {isOpen && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 max-h-[500px] overflow-y-auto">
            {analyses.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mb-4 sticky top-0 bg-white dark:bg-gray-800 pb-2 z-10">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-search text-gray-400 text-sm"></i>
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por nome ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  />
                </div>
                <div className="flex-shrink-0">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="block w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  >
                    <option value="date-desc">Mais recentes</option>
                    <option value="date-asc">Mais antigas</option>
                    <option value="name-asc">Nome (A-Z)</option>
                    <option value="name-desc">Nome (Z-A)</option>
                  </select>
                </div>
              </div>
            )}

            {filteredAndSortedAnalyses.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fa-regular fa-folder-open text-4xl text-gray-300 dark:text-gray-600 mb-2"></i>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Nenhuma análise encontrada para sua busca.' : 'Nenhuma análise salva ainda.'}
                  </p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {filteredAndSortedAnalyses.map(analysis => (
                        <li key={analysis.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700">
                            <div className="mb-3 sm:mb-0">
                                <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">{analysis.name}</p>
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                  <span><i className="fa-regular fa-calendar mr-1"></i> {analysis.date}</span>
                                  <span className="hidden sm:inline">•</span>
                                  <span>{analysis.inputs.nomeEmpresa || 'Empresa s/ Nome'}</span>
                                  {analysis.inputs.cnpj && (
                                    <>
                                      <span className="hidden sm:inline">•</span>
                                      <span>CNPJ: {analysis.inputs.cnpj}</span>
                                    </>
                                  )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 w-full sm:w-auto">
                                <button onClick={() => onLoad(analysis.id)} className="flex-1 sm:flex-none text-sm bg-white dark:bg-gray-800 text-green-600 border border-green-200 dark:border-green-900 hover:bg-green-50 dark:hover:bg-green-900/30 font-medium transition-colors py-1.5 px-3 rounded-md shadow-sm" title="Carregar Resultado">
                                    <i className="fa-solid fa-eye mr-1"></i> Ver
                                </button>
                                <button onClick={() => onEdit(analysis.id)} className="flex-1 sm:flex-none text-sm bg-white dark:bg-gray-800 text-blue-600 border border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium transition-colors py-1.5 px-3 rounded-md shadow-sm" title="Editar Dados">
                                    <i className="fa-solid fa-pen-to-square mr-1"></i> Editar
                                </button>
                                <button onClick={() => onDelete(analysis.id)} className="flex-1 sm:flex-none text-sm bg-white dark:bg-gray-800 text-red-600 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/30 font-medium transition-colors py-1.5 px-3 rounded-md shadow-sm" title="Excluir">
                                    <i className="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
      )}
    </div>
  );
};

export default SavedAnalyses;