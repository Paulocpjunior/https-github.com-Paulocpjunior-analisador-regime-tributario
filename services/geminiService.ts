import { GoogleGenAI, Type } from "@google/genai";
import { AnaliseTributaria, DynamicExpense } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `
Você é um especialista em contabilidade e tributação no Brasil. Sua tarefa é analisar dados financeiros de uma empresa e determinar o regime tributário mais vantajoso (Simples Nacional, Lucro Presumido, Lucro Real, MEI). A empresa pode ter múltiplas atividades (CNAEs), e os códigos fornecidos já foram validados como existentes.

Siga estas regras CRÍTICAS em TODAS as análises:
1.  **Análise de Elegibilidade (com base nos CNAEs):** Use o CNAE Principal para verificar a elegibilidade para CADA regime (se a atividade é permitida e se o faturamento anual está dentro do limite). Esta é a etapa mais importante. Considere os CNAEs secundários para identificar atividades impeditivas que possam desqualificar a empresa de um regime, mesmo que a atividade principal seja permitida.
2.  **Tratamento de Inelegibilidade:** Se um regime for inelegível (por CNAE impeditivo - principal ou secundário - ou faturamento), o campo 'impostoEstimado' DEVE ser 0, e a seção 'detalhes' deve explicar claramente o motivo (ex: "Não elegível: Atividade secundária [CNAE] é impeditiva para este regime." ou "Não elegível: Faturamento excede o limite."). Um regime inelegível NUNCA pode ser o recomendado.
3.  **Cálculos Apenas para Elegíveis:** Realize cálculos de impostos detalhados APENAS para os regimes em que a empresa é elegível.
4.  **Análise Específica do Simples Nacional:** Ao analisar o Simples Nacional, é MANDATÓRIO que você use o CNAE PRINCIPAL para determinar o Anexo correto (I, II, III, IV ou V). A sua resposta no campo 'detalhes' DEVE OBRIGATORIAMENTE incluir o Anexo principal identificado (ex: "Enquadrado no Anexo III com base na atividade principal."). Se houver CNAEs secundários que se enquadrem em outros Anexos, mencione a complexidade e a necessidade de cálculo proporcional, mas baseie a estimativa principal no Anexo da atividade primária para simplificação.
5.  **Recomendação Final:** Baseie a recomendação SOMENTE nas opções elegíveis, escolhendo a mais econômica. Se nenhum regime for elegível, informe isso na recomendação.
6.  **Cálculo com Produtos Monofásicos (PIS/COFINS):** Se for informado um "Faturamento com Produtos Monofásicos", você DEVE ajustar os cálculos para os regimes elegíveis da seguinte forma:
    - **Simples Nacional:** Segregue esta receita. Ao calcular o imposto, APLIQUE a alíquota do Anexo correspondente, mas EXCLUA o percentual referente a PIS/COFINS sobre a parcela da receita monofásica. Deixe isso explícito no campo 'detalhes'.
    - **Lucro Presumido e Lucro Real:** Para a receita vinda de produtos monofásicos, a alíquota de PIS e COFINS é ZERO. Calcule o IRPJ e CSLL normalmente sobre a presunção de lucro (Presumido) ou lucro real (Real), mas zere PIS e COFINS sobre essa parte do faturamento. Deixe claro no campo 'detalhes' que a isenção foi aplicada.
    - **MEI:** A tributação monofásica não se aplica, pois o MEI paga um valor fixo mensal.
7.  **Cálculo para Lucro Real e Prejuízos Fiscais:** Para o Lucro Real, o lucro base é (Faturamento - Folha - Despesas Dedutíveis). Se houver "Prejuízo Fiscal Acumulado" informado, você DEVE deduzi-lo da base de cálculo do IRPJ e CSLL, mas LIMITADO a 30% do lucro real do período analisado. Mencione explicitamente nos detalhes se houve abatimento de prejuízo fiscal anterior.
8.  **Limites de Faturamento:** Use os seguintes limites anuais: Simples Nacional (R$ 4.800.000), Lucro Presumido (R$ 78.000.000), MEI (R$ 81.000), e Lucro Real (obrigatório acima de R$ 78.000.000).
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
    ? despesasDutiveis.map(d => `- ${d.name}: R$ ${Number(d.value).toLocaleString('pt-BR')}`).join('\n')
    : 'Nenhuma outra despesa dedutível informada.';

  const primaryCnae = cnaes[0] || 'N/A';
  const secondaryCnaes = cnaes.slice(1);

  const cnaesFormatados = `
    - CNAE Principal: ${primaryCnae}
    ${secondaryCnaes.length > 0 ? `- CNAEs Secundários: ${secondaryCnaes.join(', ')}` : ''}
  `.trim();

  const faturamentoMonofasicoFormatado = faturamentoMonofasico > 0
    ? `- Deste total, Faturamento com Produtos Monofásicos (revenda com isenção de PIS/COFINS): R$ ${faturamentoMonofasico.toLocaleString('pt-BR')}`
    : '';

  const prejuizoFiscalFormatado = prejuizoFiscal > 0
    ? `- Prejuízo Fiscal Acumulado de períodos anteriores: R$ ${prejuizoFiscal.toLocaleString('pt-BR')} (Usar regra da trava de 30% para o Lucro Real)`
    : '- Sem prejuízo fiscal acumulado.';

  const prompt = `
    Analise os seguintes dados para a empresa e gere a resposta em JSON, seguindo o schema fornecido.

    **Contexto:** Planejamento Tributário para o ano de **${anoReferencia}**.
    
    **Dados da Empresa:**
    - Empresa: ${nomeEmpresa}
    - Período de Análise: ${periodoAnalise}
    - Tipo de Empresa: ${tipoEmpresa}
    ${cnaesFormatados}

    **Dados Financeiros Anuais:**
    - Faturamento Total: R$ ${faturamento.toLocaleString('pt-BR')}
    ${faturamentoMonofasicoFormatado}
    - Folha de Pagamento (dedutível para Lucro Real): R$ ${folhaPagamento.toLocaleString('pt-BR')}
    - Detalhe de Outras Despesas Dedutíveis (para Lucro Real):
    ${despesasDutiveisFormatadas}
    - Total de Outras Despesas Dedutíveis: R$ ${totalDespesasDutiveis.toLocaleString('pt-BR')}
    ${prejuizoFiscalFormatado}

    **Premissas para Cálculo:**
    - **Simples Nacional:** Calcule com base no anexo determinado pelo CNAE principal. Considere o impacto de atividades secundárias se elas forem impeditivas.
    - **MEI:** Considere um DAS mensal médio de R$ 75. Verifique a elegibilidade de TODAS as atividades.
    - **Lucro Presumido:** Use presunções de lucro padrão para '${tipoEmpresa}' (e.g., 8% para comércio, 32% para serviços).
    - **Lucro Real:** Calcule o lucro antes dos impostos como (Faturamento - Folha de Pagamento - Total de Outras Despesas Dedutíveis). Se houver Prejuízo Fiscal informado, abata da base de cálculo respeitando o limite legal de 30% do lucro do período.
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
                        description: "Análise detalhada de cada regime tributário.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                regime: {
                                    type: Type.STRING,
                                    description: "Nome do regime tributário (Simples Nacional, Lucro Presumido, Lucro Real, MEI)."
                                },
                                impostoEstimado: {
                                    type: Type.NUMBER,
                                    description: "Valor total estimado de impostos anuais. Deve ser 0 se o regime for inelegível."
                                },
                                aliquotaEfetiva: {
                                    type: Type.NUMBER,
                                    description: "A alíquota efetiva de imposto sobre o faturamento."
                                },
                                detalhes: {
                                    type: Type.STRING,
                                    description: "Uma breve explicação sobre o cálculo ou considerações. Para o Simples Nacional, DEVE OBRIGATORIAMENTE incluir o Anexo (I, II, III, IV ou V) em que o CNAE se enquadra. Deve também justificar a elegibilidade (ou inelegibilidade), considerando atividades secundárias se relevantes."
                                }
                            },
                             required: ["regime", "impostoEstimado", "aliquotaEfetiva", "detalhes"]
                        }
                    },
                    recomendacao: {
                        type: Type.OBJECT,
                        description: "A recomendação final baseada na análise.",
                        properties: {
                            melhorRegime: {
                                type: Type.STRING,
                                description: "O nome do regime tributário recomendado (deve ser uma das opções elegíveis)."
                            },
                            economiaEstimada: {
                                type: Type.NUMBER,
                                description: "A economia anual estimada em comparação com a segunda melhor opção elegível."
                            },
                            justificativa: {
                                type: Type.STRING,
                                description: "Uma explicação clara e concisa do porquê este regime foi recomendado."
                            }
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
  const prompt = `
    Identifique o código CNAE (Classificação Nacional de Atividades Econômicas) de 7 dígitos mais adequado para a seguinte descrição de atividade empresarial:
    "${descricao}"

    Retorne APENAS um objeto JSON com o código formatado (ex: 0000-0/00) e a descrição oficial do IBGE.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING, description: "Código CNAE formatado (0000-0/00)" },
            description: { type: Type.STRING, description: "Descrição oficial da atividade" }
          },
          required: ["code", "description"]
        }
      }
    });

    const text = response.text.trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Erro ao sugerir CNAE:", error);
    throw new Error("Não foi possível sugerir um CNAE no momento.");
  }
}
