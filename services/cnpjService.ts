
interface BrasilApiCnae {
  codigo: number;
  descricao: string;
}

interface BrasilApiResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  cnae_fiscal_principal: {
    codigo: number;
    descricao: string;
  };
  cnaes_secundarios: BrasilApiCnae[];
  logradouro: string;
  numero: string;
  municipio: string;
  uf: string;
}

export async function fetchCompanyData(cnpj: string): Promise<{
  nome: string;
  cnaes: { code: string; description: string }[];
  tipoProvavel: string;
}> {
  // Remove caracteres não numéricos
  const cleanCnpj = cnpj.replace(/\D/g, '');

  if (cleanCnpj.length !== 14) {
    throw new Error('CNPJ inválido.');
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar CNPJ. Verifique se o número está correto.');
    }

    const data: BrasilApiResponse = await response.json();

    // Formata CNAE Principal
    const cnaePrincipalCode = data.cnae_fiscal_principal.codigo.toString().padStart(7, '0');
    const cnaePrincipalFormatted = `${cnaePrincipalCode.slice(0, 4)}-${cnaePrincipalCode.slice(4, 5)}/${cnaePrincipalCode.slice(5)}`;
    
    const cnaes = [
      {
        code: cnaePrincipalFormatted,
        description: data.cnae_fiscal_principal.descricao
      }
    ];

    // Adiciona CNAEs secundários (limitado aos 5 primeiros para não poluir demais)
    if (data.cnaes_secundarios && data.cnaes_secundarios.length > 0) {
      data.cnaes_secundarios.slice(0, 5).forEach(c => {
        const code = c.codigo.toString().padStart(7, '0');
        const formatted = `${code.slice(0, 4)}-${code.slice(4, 5)}/${code.slice(5)}`;
        cnaes.push({
          code: formatted,
          description: c.descricao
        });
      });
    }

    // Tenta inferir o tipo de empresa baseada no CNAE principal (lógica simples)
    let tipoProvavel = '';
    const codePrefix = parseInt(cnaePrincipalCode.slice(0, 2));
    
    // Faixas aproximadas da Tabela CNAE
    if ((codePrefix >= 45 && codePrefix <= 47)) {
        tipoProvavel = 'Comércio';
    } else if ((codePrefix >= 5 && codePrefix <= 39)) {
        tipoProvavel = 'Indústria';
    } else {
        tipoProvavel = 'Serviços';
    }

    return {
      nome: data.nome_fantasia || data.razao_social,
      cnaes,
      tipoProvavel
    };

  } catch (error) {
    console.error("Erro na busca de CNPJ:", error);
    throw error;
  }
}
