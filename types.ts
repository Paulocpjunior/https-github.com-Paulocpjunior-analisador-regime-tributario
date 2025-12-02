
export interface RegimeResultado {
  regime: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'MEI';
  impostoEstimado: number;
  aliquotaEfetiva: number;
  detalhes: string;
}

export interface Recomendacao {
  melhorRegime: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'MEI';
  economiaEstimada: number;
  justificativa: string;
}

export interface AnaliseTributaria {
  analise: RegimeResultado[];
  recomendacao: Recomendacao;
}

export interface DynamicExpense {
    name: string;
    value: string;
    icon: string;
    isDeductible?: boolean;
}

export interface AnalysisInputs {
    nomeEmpresa: string;
    email?: string;
    cnpj: string;
    periodoAnalise: string;
    anoReferencia?: string; 
    faturamento: string;
    faturamentoMonofasico?: string;
    folhaPagamento: string;
    proLabore?: string;
    prejuizoFiscal?: string; // Novo campo para Lucro Real
    tipoEmpresa: string;
    dynamicExpenses?: DynamicExpense[];
    
    // For backward compatibility, will be migrated on load
    cnae?: string; 
    // New property for multiple CNAEs
    cnaes?: string[];

    // Campos antigos mantidos como opcionais para retrocompatibilidade
    despesasMercadorias?: string;
    despesasAdministrativas?: string;
    despesasAluguelContas?: string;
    outrasDespesas?: string;
}

export interface SavedAnalysis {
    id: string;
    name: string;
    date: string;
    inputs: AnalysisInputs;
    result: AnaliseTributaria;
}