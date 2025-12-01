import React, { useState } from 'react';
import { SavedAnalysis } from '../types';

interface SavedAnalysesProps {
  analyses: SavedAnalysis[];
  onLoad: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const SavedAnalyses: React.FC<SavedAnalysesProps> = ({ analyses, onLoad, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left font-bold text-lg text-gray-800 dark:text-white"
        aria-expanded={isOpen}
      >
        <span>
            <i className="fa-solid fa-history mr-3 text-indigo-500"></i>
            Análises Salvas
        </span>
        <i className={`fa-solid fa-chevron-down transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>
      {isOpen && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 max-h-60 overflow-y-auto">
            {analyses.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center">Nenhuma análise salva.</p>
            ) : (
                <ul className="space-y-3">
                    {analyses.map(analysis => (
                        <li key={analysis.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{analysis.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Salvo em: {analysis.date}</p>
                            </div>
                            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                                <button onClick={() => onLoad(analysis.id)} className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium transition-colors p-2 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50" title="Carregar Resultado">
                                    <i className="fa-solid fa-eye mr-1"></i> Ver
                                </button>
                                <button onClick={() => onEdit(analysis.id)} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50" title="Editar Dados">
                                    <i className="fa-solid fa-pen-to-square mr-1"></i> Editar
                                </button>
                                <button onClick={() => onDelete(analysis.id)} className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50" title="Excluir">
                                    <i className="fa-solid fa-trash-can mr-1"></i> Excluir
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