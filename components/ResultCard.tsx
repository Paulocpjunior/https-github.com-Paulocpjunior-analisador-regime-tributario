import React from 'react';
import { RegimeResultado } from '../types';

interface ResultCardProps {
  data: RegimeResultado;
  isRecommended: boolean;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const ResultCard: React.FC<ResultCardProps> = ({ data, isRecommended }) => {
  const { regime, impostoEstimado, aliquotaEfetiva, detalhes } = data;

  // Check for ineligibility messages to highlight them
  const isInelegivel = detalhes.toLowerCase().includes('não elegível') || 
                       detalhes.toLowerCase().includes('nao elegivel') || 
                       detalhes.toLowerCase().includes('impeditivo') ||
                       detalhes.toLowerCase().includes('inválido') ||
                       detalhes.toLowerCase().includes('inexistente');

  let borderColor = isRecommended ? 'border-green-500' : 'border-gray-200 dark:border-gray-700';
  let bgColor = isRecommended ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800';
  
  if (isInelegivel) {
    borderColor = 'border-yellow-400 dark:border-yellow-600';
    bgColor = 'bg-yellow-50 dark:bg-gray-800'; // Muted yellow for dark mode consistency
  }

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-6 shadow-md transition-all duration-300 relative overflow-hidden flex flex-col h-full`}>
      {isRecommended && (
        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
          Recomendado
        </div>
      )}
      <h3 className={`text-xl font-bold ${isInelegivel ? 'text-yellow-800 dark:text-yellow-300' : 'text-gray-800 dark:text-white'}`}>{regime}</h3>
      <div className="mt-4 space-y-3 flex-grow">
        <div className="flex justify-between items-baseline">
          <span className="text-gray-600 dark:text-gray-400">Imposto Anual Estimado:</span>
          <span className={`text-2xl font-semibold ${isInelegivel ? 'text-gray-500 dark:text-gray-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{formatCurrency(impostoEstimado)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-gray-600 dark:text-gray-400">Alíquota Efetiva:</span>
          <span className={`text-lg font-medium ${isInelegivel ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{isInelegivel ? 'N/A' : `${(aliquotaEfetiva * 100).toFixed(2)}%`}</span>
        </div>
      </div>
      <p className={`mt-4 text-sm ${isInelegivel ? 'text-yellow-700 dark:text-yellow-300 font-medium' : 'text-gray-500 dark:text-gray-400'} border-t ${isInelegivel ? 'border-yellow-300 dark:border-yellow-700' : 'border-gray-200 dark:border-gray-700'} pt-3`}>
        {isInelegivel && <i className="fa-solid fa-triangle-exclamation mr-2 text-yellow-500"></i>}
        <strong>{isInelegivel ? 'Motivo da Inelegibilidade: ' : ''}</strong>{detalhes}
      </p>
    </div>
  );
};

export default ResultCard;