// Fonte de validação de CNPJ: https://www.geradorcnpj.com/javascript-validar-cnpj.htm
export const validateCnpj = (cnpjValue: string): string | null => {
  const cnpj = cnpjValue.replace(/[^\d]+/g, '');

  if (cnpj === '') return 'O CNPJ não pode estar vazio.';
  if (cnpj.length !== 14) return 'CNPJ deve ter 14 dígitos.';

  // Elimina CNPJs invalidos conhecidos
  if (
    cnpj === '00000000000000' ||
    cnpj === '11111111111111' ||
    cnpj === '22222222222222' ||
    cnpj === '33333333333333' ||
    cnpj === '44444444444444' ||
    cnpj === '55555555555555' ||
    cnpj === '66666666666666' ||
    cnpj === '77777777777777' ||
    cnpj === '88888888888888' ||
    cnpj === '99999999999999'
  ) {
    return 'CNPJ inválido.';
  }

  // Valida DVs
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) return 'CNPJ inválido.';

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1), 10)) return 'CNPJ inválido.';

  return null; // CNPJ é válido
};

export const validateCnae = (cnaeValue: string): string | null => {
  const cnae = cnaeValue.replace(/[^\d]+/g, '');

  if (cnae === '') return 'O CNAE não pode estar vazio.';
  if (cnae.length !== 7) return 'CNAE inválido. Formato correto: 0000-0/00';

  return null; // Formato do CNAE é válido
};