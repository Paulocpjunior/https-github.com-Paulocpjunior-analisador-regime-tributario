import { GoogleGenAI, Type } from "@google/genai";
import { AnaliseTributaria, DynamicExpense } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `
Você é um Auditor Fiscal e Especialista Tributário Sênior no Brasil. Sua função é calcular com EXATIDÃO MATEMÁTICA os impostos devidos por uma empresa em três cenários: Simples Nacional, Lucro Presumido e Lucro Real.

**REGRAS ESTRITAS DE CÁLCULO (LEGISLAÇÃO VIGENTE):**

1.  **SIMPLES NACIONAL (LC 123/2006):**
    *   **Base de Cálculo:** RBT12 (Faturamento Total).
    *   **Fórmula:** ((RBT12 x Alíquota Nominal) - Parcela a Deduzir) / RBT12.
    *   **Monofásico:** Reduzir a parcela de PIS/COFINS do DAS proporcionalmente à receita monofásica.
    *   **Impostos Locais (ISS/ICMS):** Já estão inclusos na alíquota do DAS. Não separar.

2.  **LUCRO PRESUMIDO:**
    *   **Federais (PIS/COFINS/IRPJ/CSLL):** Seguir as regras de presunção (Serviços 32%, Comércio 8%).
    *   **Estaduais/Municipais (ESTIMATIVA):**
        *   Se Comércio/Indústria: Estimar ICMS (médio 18% mas com crédito, considere efetivo médio de 4% a 7% dependendo do estado ou use alíquota padrão se não informado).
        *   Se Serviços: Estimar ISS (fixo entre 2% e 5%, use média de 3.5% se não especificado).
        *   **IMPORTANTE:** O campo 'impostoEstimado' deve ser a SOMA TOTAL (Federais + ISS/ICMS). O campo 'issIcmsEstimado' deve conter apenas a parte do ISS e ICMS.

3.  **LUCRO REAL:**
    *   **PIS/COFINS (Não-Cumulativo):** 9.25% sobre faturamento.
        *   **CRÉDITOS:** Calcule 9.25% sobre as despesas marcadas como DEDUTÍVEIS que geram crédito (Insumos, Energia, Aluguel PJ). Abata isso do débito.
    *   **IRPJ/CSLL:** Base é o (Lucro Líquido Real).
        *   Lucro Líquido = Faturamento - (Folha + Pró-Labore + Todas Despesas Operacionais).
        *   Se houver Prejuízo Fiscal acumulado, abater até 30% do Lucro Líquido antes de aplicar as alíquotas (15% + 10% + 9%).

**FORMATO DE RESPOSTA (JSON):**
*   \`issIcmsEstimado\`: Valor estimado de impostos locais (fora os federais). No Simples, pode ser 0 ou a parcela correspondente. No Presumido/Real, calcule separadamente.
*   \`valorCreditoPisCofins\`: Para Lucro Real, o valor economizado com créditos de PIS/COFINS sobre despesas.
*   \`detalhes\`: Explique a lógica, incluindo base de cálculo, alíquotas de ISS/ICMS usadas e créditos abatidos.
`;


export async function analisarRegimeTributario(
  faturamento: number,
  faturamentoMonofasico: number,
  despesas: DynamicExpense[],
  folhaPagamento: number,
  prejuizoFiscal: number,
  tipoEmpresa: string,
  nomeEmpresa: string,
  periodoAnalise: string,
  cnaes: string[],
  anoReferencia: string
): Promise<AnaliseTributaria | null> {

  const despesasDutiveis = despesas.filter(d => d.isDeductible);
  const totalDespesasDutiveis = despesasDutiveis.reduce((acc, expense) => acc + Number(expense.value || 0), 0);
  
  const despesasDutiveisFormatadas = despesasDutiveis.length > 0
    ? despesasDutiveis.map(d => `- ${d.name}: R$ ${Number(d.value).toLocaleString('pt-BR')} (Dedutível IRPJ e potencial crédito PIS/COFINS)`).join('\n')
    : 'Nenhuma outra despesa dedutível informada.';

  const primaryCnae = cnaes[0] || 'N/A';
  const secondaryCnaes = cnaes.slice(1);

  const faturamentoMonofasicoFormatado = faturamentoMonofasico > 0
    ? `- Deste total, Faturamento com Produtos Monofásicos: R$ ${faturamentoMonofasico.toLocaleString('pt-BR')}`
    : '';

  const prejuizoFiscalFormatado = prejuizoFiscal > 0
    ? `- Prejuízo Fiscal Acumulado: R$ ${prejuizoFiscal.toLocaleString('pt-BR')}`
    : '- Sem prejuízo fiscal acumulado.';

  const prompt = `
    Analise os seguintes dados financeiros da empresa "${nomeEmpresa}" para o ano de ${anoReferencia}.

    **DADOS DA EMPRESA:**
    - CNAE Principal: ${primaryCnae}
    - Outros CNAEs: ${secondaryCnaes.join(', ')}
    - Atividade Predominante: ${tipoEmpresa}

    **DADOS FINANCEIROS ANUAIS:**
    1. Faturamento Bruto Total: R$ ${faturamento.toLocaleString('pt-BR')}
    ${faturamentoMonofasicoFormatado}
    
    2. Custos e Despesas:
    - Folha de Pagamento Total: R$ ${folhaPagamento.toLocaleString('pt-BR')}
    - Despesas Operacionais Dedutíveis:
    ${despesasDutiveisFormatadas}
    - Total Despesas Operacionais: R$ ${totalDespesasDutiveis.toLocaleString('pt-BR')}
    
    3. Histórico:
    ${prejuizoFiscalFormatado}

    **INSTRUÇÕES DE CÁLCULO:**
    1. Calcule os impostos Federais e adicione uma estimativa de ISS (para Serviços) ou ICMS (para Comércio/Indústria).
    2. No Lucro Real, identifique explicitamente quanto de crédito de PIS/COFINS foi gerado pelas despesas operacionais.
    3. Separe o valor estimado de ISS/ICMS no campo específico do JSON.
  `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    analise: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                regime: { type: Type.STRING },
                                impostoEstimado: { type: Type.NUMBER, description: "Total final (Federais + Estaduais/Municipais)" },
                                issIcmsEstimado: { type: Type.NUMBER, description: "Apenas a parcela de ISS e ICMS estimada" },
                                aliquotaEfetiva: { type: Type.NUMBER },
                                valorCreditoPisCofins: { type: Type.NUMBER, description: "Valor do crédito abatido (apenas Lucro Real)" },
                                detalhes: { type: Type.STRING }
                            },
                             required: ["regime", "impostoEstimado", "aliquotaEfetiva", "detalhes"]
                        }
                    },
                    recomendacao: {
                        type: Type.OBJECT,
                        properties: {
                            melhorRegime: { type: Type.STRING },
                            economiaEstimada: { type: Type.NUMBER },
                            justificativa: { type: Type.STRING }
                        },
                        required: ["melhorRegime", "economiaEstimada", "justificativa"]
                    }
                },
                required: ["analise", "recomendacao"]
            },
        },
    });
    
    const text = response.text.trim();
    const parsedJson = JSON.parse(text);
    return parsedJson as AnaliseTributaria;

  } catch (error) {
    console.error("Erro ao chamar a API Gemini:", error);
    throw new Error("Não foi possível obter a análise. Verifique os dados e tente novamente.");
  }
}

export async function sugerirCnae(descricao: string): Promise<{ code: string; description: string }> {
  // Mantida a mesma implementação existente
  const prompt = `Identifique o código CNAE 7 dígitos para: "${descricao}". JSON apenas {code, description}`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text.trim());
  } catch (e) { throw new Error("Erro CNAE"); }
}
