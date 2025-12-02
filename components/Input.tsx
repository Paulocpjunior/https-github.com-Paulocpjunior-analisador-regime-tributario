
import React, { useState, useEffect } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  iconClass: string;
  error?: string | null;
  isCurrency?: boolean;
  tooltip?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input: React.FC<InputProps> = ({ label, iconClass, error, isCurrency, tooltip, value, onChange, ...props }) => {
  const [displayValue, setDisplayValue] = useState('');

  const errorInputClasses = "border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500";
  const defaultInputClasses = "border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-indigo-500";

  // Formata valor numérico (string ou number) para BRL
  const formatBRL = (val: string | number) => {
    // Se for undefined, null ou string vazia, retorna vazio
    if (val === '' || val === undefined || val === null) return '';
    
    const numberVal = typeof val === 'string' ? parseFloat(val) : val;
    
    // Se não for um número válido, retorna vazio
    if (isNaN(numberVal)) return '';
    
    return numberVal.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Sincroniza o valor de exibição quando o valor externo muda
  useEffect(() => {
    if (isCurrency) {
      // Se o valor for 0 numérico, queremos exibir "R$ 0,00"
      // Se for string vazia, exibimos vazio.
      if (value === 0 || value === '0') {
         setDisplayValue('R$ 0,00');
      } else if (!value) {
         setDisplayValue('');
      } else {
         setDisplayValue(formatBRL(value as string));
      }
    } else {
      setDisplayValue(value as string);
    }
  }, [value, isCurrency]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (isCurrency) {
      // Remove tudo que não é dígito
      const onlyDigits = newValue.replace(/\D/g, '');

      if (onlyDigits === '') {
        setDisplayValue('');
        // Envia vazio para o pai
        const syntheticEvent = { ...e, target: { ...e.target, value: '' } };
        onChange(syntheticEvent);
        return;
      }

      // Converte para float (ex: 1234 -> 12.34)
      // Tratamento para garantir que zero seja zero
      const numericValue = parseInt(onlyDigits, 10) / 100;
      
      // Atualiza o display visualmente formatado
      setDisplayValue(numericValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }));

      // Envia o valor float puro (string '12.34') para o pai processar cálculos
      const syntheticEvent = { ...e, target: { ...e.target, value: numericValue.toFixed(2) } };
      onChange(syntheticEvent);
    } else {
      setDisplayValue(newValue);
      onChange(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {label && (
        <div className="flex items-center mb-1">
            <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            </label>
            {tooltip && (
                <div className="ml-1.5 relative group flex items-center">
                    <i className="fa-solid fa-circle-info text-gray-400 cursor-help text-xs"></i>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs font-normal text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                        {tooltip}
                    </span>
                </div>
            )}
        </div>
      )}
      <div className="relative rounded-md shadow-sm flex-grow">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <i className={`${iconClass} ${error ? 'text-red-500' : 'text-gray-400'}`} aria-hidden="true"></i>
        </div>
        <input
          {...props}
          type="text" // Sempre text para controlar a máscara manualmente
          value={displayValue}
          onChange={handleChange}
          className={`block w-full h-full rounded-md bg-white dark:bg-gray-700 pl-10 pr-4 py-2 sm:text-sm ${error ? errorInputClasses : defaultInputClasses}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
          autoComplete="off"
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400" id={`${props.id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
