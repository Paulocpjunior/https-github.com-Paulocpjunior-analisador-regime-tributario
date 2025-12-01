
export interface CnaeDetails {
    id: number;
    descricao: string;
}

const CNAE_API_URL = 'https://servicodados.ibge.gov.br/api/v2/cnae/classes/';

/**
 * Fetches the description for a given CNAE code from the IBGE API.
 * @param cnae The CNAE code (can be formatted or just numbers).
 * @returns The description of the CNAE activity.
 * @throws An error if the CNAE is not found or the API call fails.
 */
export async function fetchCnaeDescription(cnae: string): Promise<string> {
    const cleanedCnae = cnae.replace(/\D/g, '');
    if (cleanedCnae.length !== 7) {
        throw new Error('Formato de CNAE inválido para a busca.');
    }

    try {
        const response = await fetch(`${CNAE_API_URL}${cleanedCnae}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('CNAE não encontrado ou inválido.');
            }
            throw new Error(`Erro ao contatar o serviço de validação. Status: ${response.status}`);
        }
        
        const data: CnaeDetails[] = await response.json();
        
        if (data && data.length > 0 && data[0].descricao) {
            return data[0].descricao;
        } else {
            throw new Error('CNAE não encontrado ou inválido.');
        }

    } catch (error) {
        console.error('Falha ao buscar descrição do CNAE:', error);
        if (error instanceof Error && (error.message.includes('CNAE não encontrado') || error.message.includes('Erro ao contatar'))) {
             throw error;
        }
        throw new Error('Não foi possível validar o CNAE. Verifique sua conexão com a internet.');
    }
}
