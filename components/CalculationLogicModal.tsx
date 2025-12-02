
import React from 'react';

interface CalculationLogicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalculationLogicModal: React.FC<CalculationLogicModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all scale-100">
        
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <i className="fa-solid fa-calculator text-indigo-600"></i>
            Como calculamos?
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          
           <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
             <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Nota sobre ISS e ICMS</h3>
             <p className="text-sm text-blue-700 dark:text-blue-200">
               Os impostos estaduais (ICMS) e municipais (ISS) variam de acordo com o estado e município da sua empresa. 
               Como não temos a localização exata, <strong>a inteligência artificial realiza uma estimativa média</strong> baseada nas alíquotas padrão nacionais para compor o custo total tributário.
             </p>
           </div>

          <section>
            <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-2 border-l-4 border-green-500 pl-3">
              Simples Nacional
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              O cálculo baseia-se nos Anexos (I a V) definidos pelo seu CNAE (atividade).
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              <li><strong>Fator R:</strong> Para atividades de serviço (Anexo V), verificamos se a sua folha de pagamento (incluindo Pró-Labore) é igual ou superior a 28% do faturamento. Se for, a empresa pode ser tributada pelo Anexo III (mais barato).</li>
              <li><strong>Monofásico:</strong> Se você revende produtos monofásicos (bebidas, autopeças, etc.), descontamos a parcela do PIS/COFINS da alíquota total.</li>
              <li><strong>Alíquota Efetiva:</strong> Calculada progressivamente conforme a faixa de faturamento dos últimos 12 meses. O ISS/ICMS já está embutido na guia única (DAS).</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2 border-l-4 border-blue-500 pl-3">
              Lucro Presumido
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Ideal para empresas com margens de lucro altas ou poucas despesas dedutíveis.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              <li><strong>Base de Cálculo:</strong> O governo "presume" seu lucro (Ex: 8% para comércio, 32% para serviços) e aplica IRPJ (15% + adicional) e CSLL (9%) sobre essa base.</li>
              <li><strong>PIS/COFINS:</strong> Calculados no regime cumulativo (3,65% sobre o faturamento total), exceto para produtos monofásicos (alíquota zero).</li>
              <li><strong>ISS/ICMS:</strong> Calculados separadamente (fora da guia federal) e estimados pela IA neste relatório.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-2 border-l-4 border-purple-500 pl-3">
              Lucro Real
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Geralmente vantajoso para empresas com margens de lucro baixas ou prejuízo.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              <li><strong>Lucro Líquido Real:</strong> Subtraímos todas as suas despesas dedutíveis (Folha, Aluguel, Energia, etc.) do Faturamento. O IRPJ e CSLL incidem apenas sobre o que sobrar.</li>
              <li><strong>PIS/COFINS:</strong> Regime não-cumulativo (9,25%). <strong>Atenção:</strong> Você abate desse valor os créditos gerados por insumos, energia e aluguel. No nosso formulário, marque as despesas como "Dedutível" para que a IA considere esse crédito.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-2 border-l-4 border-orange-500 pl-3">
              MEI (Microempreendedor Individual)
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              Opção mais simples. Pagamento fixo mensal (DAS) independente do faturamento, desde que dentro do limite anual (R$ 81.000,00) e atividades permitidas.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculationLogicModal;
