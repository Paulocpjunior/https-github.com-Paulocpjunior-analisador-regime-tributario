
import React, { useState, useCallback, useEffect } from 'react';
import Input from './components/Input';
import Select from './components/Select';
import ResultCard from './components/ResultCard';
import ComparisonChart from './components/ComparisonChart';
import Disclaimer from './components/Disclaimer';
import Logo from './components/Logo';
import SavedAnalyses from './components/SavedAnalyses';
import IconPicker from './components/IconPicker';
import CalculationLogicModal from './components/CalculationLogicModal'; // Importação do Modal
import { analisarRegimeTributario } from './services/geminiService';
import { getSavedAnalyses, saveAnalysis, deleteAnalysis } from './services/storageService';
import { fetchCnaeDescription } from './services/cnaeService';
import type { AnaliseTributaria, AnalysisInputs, SavedAnalysis } from './types';
import { validateCnpj, validateCnae } from './utils/validators';

// Declara a variável global html2pdf para que o TypeScript a reconheça
declare const html2pdf: any;

const App: React.FC = () => {
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [email, setEmail] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [periodoAnalise, setPeriodoAnalise] = useState('Anual');
  const [anoReferencia, setAnoReferencia] = useState('2026');
  const [faturamento, setFaturamento] = useState('');
  const [faturamentoMonofasico, setFaturamentoMonofasico] = useState('');
  const [folhaPagamento, setFolhaPagamento] = useState('');
  const [proLabore, setProLabore] = useState('');
  const [prejuizoFiscal, setPrejuizoFiscal] = useState(''); // Novo estado para prejuízo fiscal
  const [tipoEmpresa, setTipoEmpresa] = useState('');
  
  const [dynamicExpenses, setDynamicExpenses] = useState<{id: number, name: string, value: string, icon: string, isDeductible: boolean}[]>([
    { id: Date.now(), name: 'Impostos Federais (IRPJ, CSLL, PIS, COFINS)', value: '', icon: 'fa-file-invoice-dollar', isDeductible: true },
    { id: Date.now() + 1, name: '', value: '', icon: 'fa-dollar-sign', isDeductible: true }
  ]);
  
  const [cnaes, setCnaes] = useState<{id: number, value: string, error: string | null, description: string | null, loading: boolean}[]>([
    { id: Date.now(), value: '', error: null, description: null, loading: false }
  ]);

  const [resultado, setResultado] = useState<AnaliseTributaria | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false); // Estado para o modal de lógica

  const [cnpjError, setCnpjError] = useState<string | null>(null);
  
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark') {
      return 'dark';
    }
    if (typeof window !== 'undefined' && !('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const cnaeTooltipText = 
    "A atividade (CNAE) define o anexo do Simples Nacional:\n" +
    "• Anexo I: Comércio (lojas, revendas)\n" +
    "• Anexo II: Indústria (fábricas)\n" +
    "• Anexo III: Serviços de instalação, reparos, contabilidade, viagens\n" +
    "• Anexo IV: Serviços de limpeza, vigilância, obras, advocacia\n" +
    "• Anexo V: Serviços intelectuais/tecnologia (sujeito ao Fator R)";

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.error("Could not save theme to localStorage", e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    setSavedAnalyses(getSavedAnalyses());
  }, []);
  
  const formatCnpj = (value: string) => {
      return value
        .replace(/\D/g, '') // Remove non-digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18); // Max length for formatted CNPJ
  };
   const formatCnae = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d)(\d{2})/, '$1/$2')
            .slice(0, 9);
    };

  const handleCnpjBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) { // Only validate if there is a value
      setCnpjError(validateCnpj(value));
    } else {
      setCnpjError(null);
    }
  };
  
  const handleCnaeBlur = async (id: number) => {
    const cnaeIndex = cnaes.findIndex(c => c.id === id);
    if (cnaeIndex === -1) return;

    const cnaeItem = cnaes[cnaeIndex];
    
    if (!cnaeItem.value) {
        setCnaes(cnaes.map(c => c.id === id ? { ...c, error: null, description: null, loading: false } : c));
        return;
    }

    let updatedCnaes = cnaes.map(c => c.id === id ? { ...c, error: null, description: null, loading: true } : c);
    setCnaes(updatedCnaes);
    
    const formatError = validateCnae(cnaeItem.value);
    if (formatError) {
        setCnaes(prevCnaes => prevCnaes.map(c => c.id === id ? { ...c, error: formatError, loading: false } : c));
        return;
    }

    try {
        const description = await fetchCnaeDescription(cnaeItem.value);
        setCnaes(prevCnaes => prevCnaes.map(c => 
          c.id === id ? { ...c, description, loading: false, error: null } : c
        ));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setCnaes(prevCnaes => prevCnaes.map(c => 
          c.id === id ? { ...c, error: errorMessage, loading: false, description: null } : c
        ));
    }
  };

  const handleAddCnae = () => {
    setCnaes([...cnaes, { id: Date.now(), value: '', error: null, description: null, loading: false }]);
  };

  const handleRemoveCnae = (id: number) => {
     if (cnaes.length > 1) {
      setCnaes(cnaes.filter(c => c.id !== id));
    }
  };

   const handleCnaeChange = (id: number, value: string) => {
        const formattedValue = formatCnae(value);
        setCnaes(cnaes.map(c => c.id === id ? { ...c, value: formattedValue } : c));
   };

  const handleAddExpense = () => {
    setDynamicExpenses([...dynamicExpenses, { id: Date.now(), name: '', value: '', icon: 'fa-dollar-sign', isDeductible: true }]);
  };

  const handleRemoveExpense = (id: number) => {
    if (dynamicExpenses.length > 1) {
        setDynamicExpenses(dynamicExpenses.filter(e => e.id !== id));
    }
  };

  const handleExpenseChange = (id: number, field: 'name' | 'value' | 'icon' | 'isDeductible', fieldValue: string | boolean) => {
    setDynamicExpenses(dynamicExpenses.map(exp => 
        exp.id === id ? { ...exp, [field]: fieldValue } : exp
    ));
  };
  
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResultado(null);
    setLoading(true);

    if (!faturamento || !tipoEmpresa || cnaes.some(c => !c.value || c.error)) {
        setError("Preencha todos os campos obrigatórios e corrija os erros de CNAE antes de continuar.");
        setLoading(false);
        return;
    }

    const faturamentoNum = parseFloat(faturamento);
    const faturamentoMonofasicoNum = parseFloat(faturamentoMonofasico) || 0;

    if (faturamentoMonofasicoNum > faturamentoNum) {
        setError("O Faturamento Monofásico não pode ser maior que o Faturamento Total.");
        setLoading(false);
        return;
    }

    const allExpenses = [...dynamicExpenses];
    if (proLabore && parseFloat(proLabore) > 0) {
      allExpenses.push({ id: 0, name: 'Pró-Labore', value: proLabore, icon: 'fa-user-tie', isDeductible: true });
    }

    try {
        const cnaesValidos = cnaes.map(c => c.value).filter(Boolean);
        const result = await analisarRegimeTributario(
            faturamentoNum,
            faturamentoMonofasicoNum,
            allExpenses.map(d => ({...d, value: d.value || '0', name: d.name || 'Despesa'})),
            parseFloat(folhaPagamento) || 0,
            parseFloat(prejuizoFiscal) || 0, // Passa o prejuízo fiscal para o serviço
            tipoEmpresa,
            nomeEmpresa || "Empresa Exemplo",
            periodoAnalise,
            cnaesValidos,
            anoReferencia || '2026'
        );
        setResultado(result);
    } catch (err) {
        setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
    } finally {
        setLoading(false);
        setTimeout(() => {
            document.getElementById('resultado')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
  };

  const handleSaveAnalysis = () => {
    const trimmedName = saveName.trim();
    if (resultado && trimmedName) {
      const inputs: AnalysisInputs = {
        nomeEmpresa, email, cnpj, periodoAnalise, anoReferencia, faturamento, faturamentoMonofasico, folhaPagamento, proLabore, prejuizoFiscal, tipoEmpresa, 
        dynamicExpenses: dynamicExpenses.map(({id, ...rest}) => rest),
        cnaes: cnaes.map(c => c.value)
      };
      if (saveAnalysis(trimmedName, inputs, resultado)) {
        setSavedAnalyses(getSavedAnalyses());
      }
      setIsSaveModalOpen(false);
      setSaveName('');
    }
  };

  const loadAnalysis = (id: string) => {
    const analysisToLoad = savedAnalyses.find(a => a.id === id);
    if (analysisToLoad) {
        const { inputs, result } = analysisToLoad;
        setNomeEmpresa(inputs.nomeEmpresa || '');
        setEmail(inputs.email || '');
        setCnpj(inputs.cnpj || '');
        setPeriodoAnalise(inputs.periodoAnalise || 'Anual');
        setAnoReferencia(inputs.anoReferencia || '2026');
        setFaturamento(inputs.faturamento || '');
        setFaturamentoMonofasico(inputs.faturamentoMonofasico || '');
        setFolhaPagamento(inputs.folhaPagamento || '');
        setProLabore(inputs.proLabore || '');
        setPrejuizoFiscal(inputs.prejuizoFiscal || '');
        setTipoEmpresa(inputs.tipoEmpresa || '');
        
        const loadedExpenses = inputs.dynamicExpenses && inputs.dynamicExpenses.length > 0
          ? inputs.dynamicExpenses.map((exp, index) => ({ id: Date.now() + index, ...exp }))
          : [{ id: Date.now(), name: '', value: '', icon: 'fa-dollar-sign', isDeductible: true }];
        setDynamicExpenses(loadedExpenses);
        
        const loadedCnaes = inputs.cnaes && inputs.cnaes.length > 0
          ? inputs.cnaes.map((cnae, index) => ({ id: Date.now() + index, value: cnae, error: null, description: null, loading: false }))
          : [{ id: Date.now(), value: '', error: null, description: null, loading: false }];
        setCnaes(loadedCnaes);
        
        setResultado(result);
        window.scrollTo(0, 0);
    }
  };

  const handleDeleteAnalysis = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta análise?")) {
      deleteAnalysis(id);
      setSavedAnalyses(getSavedAnalyses());
    }
  };

  const handleExportPDF = () => {
    setExportingPDF(true);
    // Rolagem para o topo para evitar que o html2canvas corte o conteúdo devido ao scroll
    window.scrollTo(0, 0);
    
    setTimeout(() => {
        const element = document.getElementById('resultado-imprimivel');
        if (element) {
            const opt = {
                margin:       [0.5, 0.3, 0.5, 0.3], // Margens: Topo, Dir, Base, Esq
                filename:     `analise-tributaria-${nomeEmpresa || 'empresa'}-${anoReferencia}.pdf`,
                image:        { type: 'jpeg', quality: 1.0 }, // Máxima qualidade
                html2canvas:  { scale: 2, useCORS: true, scrollY: 0 }, 
                jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
                pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
            };
            html2pdf().from(element).set(opt).save().then(() => {
                setExportingPDF(false);
            }).catch((err: any) => {
                console.error("Erro ao exportar PDF:", err);
                setExportingPDF(false);
            });
        } else {
           setExportingPDF(false); 
        }
    }, 500); // Aumentado o tempo de espera para garantir que o render esteja estável
  };

  const handleExportCSV = () => {
    if (!resultado) return;

    const headers = ["Empresa", "Ano Referencia", "Faturamento", "Regime Recomendado", "Economia Estimada"];
    const summaryRow = [
      nomeEmpresa || "Empresa",
      anoReferencia,
      faturamento,
      resultado.recomendacao.melhorRegime,
      resultado.recomendacao.economiaEstimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    ];

    const detailHeaders = ["Regime", "Imposto Estimado (R$)", "Aliquota Efetiva (%)", "Detalhes"];
    const detailRows = resultado.analise.map(item => [
      item.regime,
      item.impostoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2, useGrouping: false }), // No grouping for easier Excel parsing sometimes
      (item.aliquotaEfetiva * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      `"${item.detalhes.replace(/"/g, '""')}"` // Escape quotes for CSV
    ]);

    // Add BOM for Excel UTF-8 compatibility
    let csvContent = "\uFEFF"; 
    csvContent += headers.join(";") + "\n";
    csvContent += summaryRow.join(";") + "\n\n";
    csvContent += detailHeaders.join(";") + "\n";
    detailRows.forEach(row => {
      csvContent += row.join(";") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `planejamento_${anoReferencia}_${nomeEmpresa || 'empresa'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportWhatsApp = () => {
    if (!resultado) return;

    const text = [
        `*Planejamento Tributário ${anoReferencia}*`,
        `🏢 *Empresa:* ${nomeEmpresa || 'Não informada'}`,
        ``,
        `🏆 *Recomendação:* ${resultado.recomendacao.melhorRegime}`,
        `💰 *Economia Estimada:* ${resultado.recomendacao.economiaEstimada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        `📝 *Justificativa:* ${resultado.recomendacao.justificativa}`,
        ``,
        `*Comparativo de Impostos Anuais:*`,
        ...resultado.analise.map(r => 
            `- ${r.regime}: ${r.impostoEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
        ),
        ``,
        `_Gerado por SP Assessoria Contábil_`
    ].join('\n');

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de envio
    alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
    setIsContactModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      {/* Modal de Lógica */}
      <CalculationLogicModal isOpen={isCalcModalOpen} onClose={() => setIsCalcModalOpen(false)} />

      <header className="bg-gray-800 dark:bg-gray-900 shadow-md p-4 sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden md:block text-xs text-gray-400 border-l border-gray-600 pl-4">
              Desenvolvido por SP Assessoria Contábil
            </span>
          </div>
          <button onClick={toggleTheme} className="text-gray-400 hover:text-white transition-colors p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white" aria-label="Toggle theme">
            {theme === 'light' ? <i className="fas fa-moon text-xl"></i> : <i className="fas fa-sun text-xl"></i>}
          </button>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 mt-6">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-indigo-600 dark:text-indigo-400">
              Analisador de Regime Tributário
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Utilize a inteligência artificial para descobrir o regime tributário mais econômico para sua empresa em {anoReferencia}.
            </p>
          </div>

           <div className="mb-8">
             <SavedAnalyses 
                analyses={savedAnalyses} 
                onLoad={loadAnalysis} 
                onEdit={loadAnalysis}
                onDelete={handleDeleteAnalysis} 
             />
           </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Seção 1: Informações Cadastrais */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-t-4 border-indigo-500 overflow-hidden">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-4 border-b border-indigo-100 dark:border-indigo-800">
                <h2 className="text-xl font-bold text-indigo-800 dark:text-indigo-300 flex items-center">
                  <span className="bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 w-8 h-8 flex items-center justify-center rounded-full text-sm mr-3">1</span>
                  Informações da Empresa
                </h2>
              </div>
              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nome da Empresa" iconClass="fa-solid fa-signature" id="nomeEmpresa" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} placeholder="Ex: Minha Empresa LTDA" />
                <Input label="E-mail" iconClass="fa-solid fa-envelope" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@empresa.com.br" type="email" />
                <Input label="CNPJ" iconClass="fa-solid fa-id-card" id="cnpj" value={cnpj} onChange={(e) => setCnpj(formatCnpj(e.target.value))} onBlur={handleCnpjBlur} error={cnpjError} placeholder="00.000.000/0000-00" />
                <div className="flex gap-4">
                    <div className="flex-grow">
                        <Select label="Período" iconClass="fa-solid fa-calendar-days" id="periodoAnalise" value={periodoAnalise} onChange={(e) => setPeriodoAnalise(e.target.value)}>
                            <option value="Anual">Anual</option>
                            <option value="Semestral">Semestral</option>
                            <option value="Trimestral">Trimestral</option>
                            <option value="Mensal">Mensal</option>
                        </Select>
                    </div>
                    <div className="w-1/3">
                        <Input label="Ano Ref." iconClass="fa-solid fa-calendar" id="anoReferencia" value={anoReferencia} onChange={(e) => setAnoReferencia(e.target.value)} placeholder="2026" type="number" />
                    </div>
                </div>
                 <Select label="Tipo de Empresa" iconClass="fa-solid fa-briefcase" id="tipoEmpresa" value={tipoEmpresa} onChange={(e) => setTipoEmpresa(e.target.value)} required>
                    <option value="">Selecione o tipo</option>
                    <option value="Serviços">Serviços</option>
                    <option value="Comércio">Comércio</option>
                    <option value="Indústria">Indústria</option>
                    <option value="Misto (Comércio e Serviços)">Misto (Comércio e Serviços)</option>
                </Select>
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        CNAE(s) da Empresa (Principal primeiro)
                        <span className="text-red-500 ml-1">*</span>
                    </label>
                    {cnaes.map((cnae, index) => (
                        <div key={cnae.id} className="flex items-start gap-2 mb-3">
                            <div className="flex-grow">
                                <div className="relative">
                                    <Input 
                                        label="" 
                                        iconClass="fa-solid fa-barcode" 
                                        id={`cnae-${cnae.id}`} 
                                        value={cnae.value} 
                                        onChange={(e) => handleCnaeChange(cnae.id, e.target.value)}
                                        onBlur={() => handleCnaeBlur(cnae.id)}
                                        error={cnae.error} 
                                        placeholder="0000-0/00"
                                        tooltip={cnaeTooltipText}
                                    />
                                     {cnae.loading && <i className="fa-solid fa-spinner fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500"></i>}
                                </div>
                                {cnae.description && !cnae.error && <p className="mt-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-md">{cnae.description}</p>}
                            </div>
                            {cnaes.length > 1 && (
                                <button type="button" onClick={() => handleRemoveCnae(cnae.id)} className="mt-1 flex-shrink-0 h-10 w-10 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                                    <i className="fa-solid fa-trash-can"></i>
                                </button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={handleAddCnae} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                        <i className="fa-solid fa-plus mr-1"></i> Adicionar CNAE Secundário
                    </button>
                </div>
              </div>
            </section>
            
             {/* Seção 2: Dados Financeiros */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-t-4 border-green-500 overflow-hidden">
                <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b border-green-100 dark:border-green-800">
                    <h2 className="text-xl font-bold text-green-800 dark:text-green-300 flex items-center">
                         <span className="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 w-8 h-8 flex items-center justify-center rounded-full text-sm mr-3">2</span>
                        Dados Financeiros ({periodoAnalise})
                    </h2>
                </div>
                <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                        label="Faturamento Total" 
                        iconClass="fa-solid fa-chart-line" 
                        id="faturamento" 
                        value={faturamento} 
                        onChange={(e) => setFaturamento(e.target.value)} 
                        isCurrency 
                        required 
                        tooltip="Informe a receita bruta total da empresa (vendas de produtos + serviços) antes de descontar impostos ou custos. É a base principal de cálculo." 
                    />
                    <Input 
                        label="Faturamento Monofásico (Opcional)" 
                        iconClass="fa-solid fa-tags" 
                        id="faturamentoMonofasico" 
                        value={faturamentoMonofasico} 
                        onChange={(e) => setFaturamentoMonofasico(e.target.value)} 
                        isCurrency 
                        tooltip="Produtos como bebidas frias (cerveja, água, refrigerante), autopeças e medicamentos já têm PIS/COFINS recolhidos na indústria. Se você revende esses itens, informe o valor aqui para reduzir seu imposto (PIS/COFINS zero na revenda)." 
                    />
                    <Input 
                        label="Folha de Pagamento" 
                        iconClass="fa-solid fa-users" 
                        id="folhaPagamento" 
                        value={folhaPagamento} 
                        onChange={(e) => setFolhaPagamento(e.target.value)} 
                        isCurrency 
                        tooltip="Soma dos salários brutos dos funcionários + encargos (FGTS, INSS patronal). Não inclua o Pró-Labore aqui. Um valor alto pode reduzir a alíquota do Simples Nacional (Fator R)." 
                    />
                    <Input 
                        label="Pró-Labore Anual (Opcional)" 
                        iconClass="fa-solid fa-user-tie" 
                        id="proLabore" 
                        value={proLabore} 
                        onChange={(e) => setProLabore(e.target.value)} 
                        isCurrency 
                        tooltip="O 'salário' do dono/sócio. Este valor conta para o cálculo do Fator R no Simples Nacional e é considerado uma despesa dedutível no Lucro Real, ajudando a pagar menos imposto." 
                    />
                    <div className="md:col-span-2">
                         <Input 
                            label="Prejuízo Fiscal Acumulado (Opcional)" 
                            iconClass="fa-solid fa-arrow-trend-down" 
                            id="prejuizoFiscal" 
                            value={prejuizoFiscal} 
                            onChange={(e) => setPrejuizoFiscal(e.target.value)} 
                            isCurrency 
                            tooltip="Se a empresa possui prejuízos de anos anteriores, informe aqui. No Lucro Real, é possível abater esse prejuízo da base de cálculo do imposto, limitado a 30% do lucro do período." 
                        />
                    </div>
                </div>
            </section>

             {/* Seção 3: Despesas Detalhadas */}
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-t-4 border-orange-500 overflow-hidden">
                <div className="bg-orange-50 dark:bg-orange-900/20 px-6 py-4 border-b border-orange-100 dark:border-orange-800">
                    <h2 className="text-xl font-bold text-orange-800 dark:text-orange-300 flex items-center">
                        <span className="bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 w-8 h-8 flex items-center justify-center rounded-full text-sm mr-3">3</span>
                        Despesas Operacionais ({periodoAnalise})
                    </h2>
                </div>
                <div className="p-6 sm:p-8 space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Detalhar despesas ajuda a calcular corretamente o <strong>Lucro Real</strong>, onde o imposto é pago apenas sobre o lucro líquido (Receita - Despesas).
                    </p>
                    {dynamicExpenses.map((expense, index) => (
                         <div key={expense.id} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-12 sm:col-span-1">
                                <IconPicker value={expense.icon} onChange={(icon) => handleExpenseChange(expense.id, 'icon', icon)} />
                            </div>
                            <div className="col-span-12 sm:col-span-5">
                                <Input label={index === 0 ? "Nome da Despesa" : ""} id={`exp-name-${expense.id}`} value={expense.name} onChange={(e) => handleExpenseChange(expense.id, 'name', e.target.value)} placeholder="Ex: Aluguel do Escritório" iconClass="fa-solid fa-tag" />
                            </div>
                            <div className="col-span-12 sm:col-span-3">
                                <Input label={index === 0 ? "Valor" : ""} id={`exp-value-${expense.id}`} value={expense.value} onChange={(e) => handleExpenseChange(expense.id, 'value', e.target.value)} isCurrency placeholder="R$ 0,00" iconClass="fa-solid fa-brazilian-real-sign" />
                            </div>
                            <div className="col-span-10 sm:col-span-2 flex items-center justify-center h-10 mb-0 sm:mb-1">
                                <label htmlFor={`exp-deduct-${expense.id}`} className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 select-none">
                                    <input id={`exp-deduct-${expense.id}`} type="checkbox" checked={expense.isDeductible} onChange={(e) => handleExpenseChange(expense.id, 'isDeductible', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <span>Dedutível?</span>
                                </label>
                            </div>
                             <div className="col-span-2 sm:col-span-1 flex items-center h-10">
                                {dynamicExpenses.length > 1 && (
                                    <button type="button" onClick={() => handleRemoveExpense(expense.id)} className="h-10 w-10 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                                        <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddExpense} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center">
                        <i className="fa-solid fa-plus mr-2 bg-indigo-100 p-1 rounded-full"></i> Adicionar Outra Despesa
                    </button>
                </div>
            </section>

            <div className="text-center pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex justify-center items-center px-12 py-4 border border-transparent text-lg font-bold rounded-full shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-3"></i> Analisando com IA...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-wand-magic-sparkles mr-3"></i> Gerar Análise Completa
                  </>
                )}
              </button>
              {error && <p className="mt-4 text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/30 p-3 rounded-lg inline-block">{error}</p>}
            </div>
          </form>

         {/* Seção de Resultados */}
        {resultado && !loading && (
          <section id="resultado" className="mt-16">
            <div id="resultado-imprimivel">
                
                {/* Header Exclusivo para PDF (Oculto em tela) */}
                <div id="pdf-header" className="hidden mb-4 border-b-2 border-indigo-600 pb-2">
                   <div className="flex justify-between items-end">
                       <div>
                           <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Desenvolvido BY - SP ASSESSORIA CONTÁBIL</h2>
                           <p className="text-xs text-gray-500">Direitos Reservados • Uso Exclusivo</p>
                       </div>
                       <div className="text-right text-xs text-gray-500">
                           {new Date().toLocaleDateString('pt-BR')} • {new Date().toLocaleTimeString('pt-BR')}
                       </div>
                   </div>
                </div>

                {/* Cabeçalho do Relatório com Resumo dos Dados (Exibido no PDF) */}
                <div className="mb-6 bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg border-b-4 border-indigo-600">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Relatório de Planejamento Tributário</h1>
                           <p className="text-sm text-gray-500">Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-indigo-600 text-xl">{anoReferencia}</p>
                            <p className="text-xs text-gray-400">Ano de Referência</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 pb-1 mb-2">Dados da Empresa</h3>
                            <p className="mb-1"><span className="font-semibold text-gray-600 dark:text-gray-400">Razão Social:</span> {nomeEmpresa || 'Não informado'}</p>
                            <p className="mb-1"><span className="font-semibold text-gray-600 dark:text-gray-400">CNPJ:</span> {cnpj || 'Não informado'}</p>
                            <p className="mb-1"><span className="font-semibold text-gray-600 dark:text-gray-400">Tipo:</span> {tipoEmpresa}</p>
                            <p className="mb-1"><span className="font-semibold text-gray-600 dark:text-gray-400">E-mail:</span> {email || 'N/A'}</p>
                            <div className="mt-2">
                                <p className="font-semibold text-gray-600 dark:text-gray-400">Atividades (CNAE):</p>
                                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 pl-1 mt-1">
                                    {cnaes.map(c => <li key={c.id} className="truncate">{c.value} {c.description ? `- ${c.description}` : ''}</li>)}
                                </ul>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 pb-1 mb-2">Dados Financeiros ({periodoAnalise})</h3>
                            <p className="mb-1"><span className="font-semibold text-gray-600 dark:text-gray-400">Faturamento Total:</span> {parseFloat(faturamento).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                            {faturamentoMonofasico && parseFloat(faturamentoMonofasico) > 0 && (
                                 <p className="mb-1"><span className="font-semibold text-gray-600 dark:text-gray-400">Fat. Monofásico:</span> {parseFloat(faturamentoMonofasico).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                            )}
                            <p className="mb-1"><span className="font-semibold text-gray-600 dark:text-gray-400">Folha de Pagamento:</span> {parseFloat(folhaPagamento || '0').toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                            <p className="mb-1"><span className="font-semibold text-gray-600 dark:text-gray-400">Pró-Labore:</span> {parseFloat(proLabore || '0').toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                            {prejuizoFiscal && parseFloat(prejuizoFiscal) > 0 && (
                                 <p className="mb-1"><span className="font-semibold text-gray-600 dark:text-gray-400 text-red-500">Prejuízo Fiscal Acum.:</span> {parseFloat(prejuizoFiscal).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                            )}
                            
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 pb-1 mb-2 mt-4">Despesas Operacionais</h3>
                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 pl-1 mt-1 max-h-40 overflow-hidden">
                                {dynamicExpenses.filter(e => e.name && e.value).map(e => (
                                    <li key={e.id} className="truncate">
                                        {e.name}: {parseFloat(e.value).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} 
                                        {e.isDeductible ? <span className="text-xs text-green-600 ml-1">(Dedutível)</span> : ''}
                                    </li>
                                ))}
                                {dynamicExpenses.filter(e => e.name && e.value).length === 0 && <li>Nenhuma despesa informada.</li>}
                            </ul>
                        </div>
                     </div>
                  </div>

                <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg relative">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">Resultado da Análise</h2>
                        <button 
                            onClick={() => setIsCalcModalOpen(true)}
                            className="mt-2 sm:mt-0 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 text-sm font-semibold flex items-center no-print"
                        >
                            <i className="fa-regular fa-circle-question mr-2 text-lg"></i>
                            Como calculamos?
                        </button>
                    </div>
                    
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-8">Com base nos dados fornecidos para <strong>{nomeEmpresa || 'sua empresa'}</strong> (Ref: {anoReferencia}), este é o resultado:</p>
                    
                    {/* Card de Recomendação */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-lg mb-8 shadow-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <i className="fa-solid fa-trophy text-6xl text-green-700"></i>
                        </div>
                        <h3 className="text-xl font-bold text-green-800 dark:text-green-300 flex items-center relative z-10">
                            <i className="fa-solid fa-star mr-3 text-yellow-500"></i>Recomendação para {anoReferencia}
                        </h3>
                        <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400 relative z-10">
                            {resultado.recomendacao.melhorRegime}
                        </p>
                        <p className="mt-3 text-gray-700 dark:text-gray-300 relative z-10">
                            <strong className="font-semibold">Justificativa:</strong> {resultado.recomendacao.justificativa}
                        </p>
                        <p className="mt-2 text-gray-700 dark:text-gray-300 relative z-10">
                            <strong className="font-semibold">Economia Anual Estimada:</strong> <span className="text-green-700 dark:text-green-300 font-bold text-lg">{resultado.recomendacao.economiaEstimada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </p>
                    </div>

                    {/* Cards de Detalhes dos Regimes */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {resultado.analise.map((regime, index) => (
                             <div key={regime.regime} className="card-enter-animation" style={{ animationDelay: `${index * 150}ms` }}>
                                <ResultCard
                                    data={regime}
                                    isRecommended={regime.regime === resultado.recomendacao.melhorRegime}
                                />
                            </div>
                        ))}
                    </div>
                     <div className="mt-8">
                        <ComparisonChart data={resultado.analise} isExporting={exportingPDF} theme={theme} />
                    </div>
                </div>
             </div>
            <Disclaimer />
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 no-print">
              <button onClick={() => setIsSaveModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm">
                <i className="fa-solid fa-save mr-2"></i> Salvar Análise
              </button>
              <button onClick={handleExportPDF} disabled={exportingPDF} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors disabled:bg-red-400 shadow-sm">
                {exportingPDF ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Exportando...</> : <><i className="fa-solid fa-file-pdf mr-2"></i> PDF</>}
              </button>
              <button onClick={handleExportCSV} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
                <i className="fa-solid fa-file-excel mr-2"></i> Exportar CSV (Excel)
              </button>
              <button onClick={handleExportWhatsApp} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-500 hover:bg-green-600 transition-colors shadow-sm">
                <i className="fa-brands fa-whatsapp mr-2 text-xl"></i> Compartilhar
              </button>
            </div>
          </section>
        )}
        </div>
      </main>

      <footer className="bg-gray-800 dark:bg-gray-900 text-center p-4 mt-12 border-t border-gray-700">
        <p className="text-sm text-gray-400">
          Todos os direitos de uso reservados para SP Assessoria Contábil © {new Date().getFullYear()}
        </p>
        <button 
            onClick={() => setIsContactModalOpen(true)} 
            className="text-indigo-400 hover:text-indigo-300 underline text-sm mt-2 transition-colors focus:outline-none"
        >
            Fale Conosco
        </button>
      </footer>
      
      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl w-full max-w-md card-enter-animation opacity-100">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Salvar Análise</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Dê um nome para esta análise para poder carregá-la mais tarde.</p>
            <Input label="Nome da Análise" iconClass="fa-solid fa-tag" id="saveName" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Ex: Análise Final de Ano" autoFocus />
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
              <button onClick={handleSaveAnalysis} disabled={!saveName.trim()} className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl w-full max-w-lg card-enter-animation opacity-100">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Fale Conosco</h3>
                <button onClick={() => setIsContactModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i className="fa-solid fa-times text-xl"></i>
                </button>
             </div>
            <form onSubmit={handleContactSubmit} className="space-y-4">
                <Input label="Seu Nome" iconClass="fa-solid fa-user" id="contactName" placeholder="Digite seu nome" required />
                <Input label="Seu E-mail" iconClass="fa-solid fa-envelope" id="contactEmail" placeholder="seu@email.com" type="email" required />
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem</label>
                    <textarea 
                        id="message" 
                        rows={4} 
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Como podemos ajudar?"
                        required
                    ></textarea>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsContactModalOpen(false)} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Enviar Mensagem</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
