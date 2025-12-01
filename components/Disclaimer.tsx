import React from 'react';

const Disclaimer: React.FC = () => {
  return (
    <div className="mt-10 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-md shadow-md" role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <i className="fa-solid fa-triangle-exclamation text-yellow-500 text-xl" aria-hidden="true"></i>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">Aviso Importante</h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>
              Os resultados apresentados são estimativas geradas por Inteligência Artificial com base nos dados fornecidos. A legislação tributária é complexa e pode variar.
            </p>
            <p className="mt-1">
              Esta análise <strong className="font-semibold">não substitui</strong> a consulta e o planejamento com um profissional de contabilidade. Consulte sempre um contador para tomar a decisão final.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
