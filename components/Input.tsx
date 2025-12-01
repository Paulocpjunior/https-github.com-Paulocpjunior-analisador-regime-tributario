
import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  iconClass: string;
  error?: string | null;
  isCurrency?: boolean;
  tooltip?: string;
}

const Input: React.FC<InputProps> = ({ label, iconClass, error, isCurrency, tooltip, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  const errorInputClasses = "border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500";
  const defaultInputClasses = "border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-indigo-500";

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isCurrency) setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isCurrency) setIsFocused(false);
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!props.onChange) return;
    
    const rawValue = e.target.value;
    
    // Clean the value, allowing only digits and one separator (comma or period)
    const cleanedValue = rawValue.replace(/[^0-9,.]/g, '');
    let numericString = cleanedValue.replace(',', '.'); // Use dot as separator internally

    const parts = numericString.split('.');
    
    // If there are multiple dots, consolidate them
    if (parts.length > 2) {
        numericString = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to two decimal places
    const decimalParts = numericString.split('.');
    if (decimalParts[1] && decimalParts[1].length > 2) {
        numericString = decimalParts[0] + '.' + decimalParts[1].substring(0, 2);
    }
    
    // Create a new event-like object to pass the raw numeric string to the parent
    const newEvent = { ...e, target: { ...e.target, value: numericString } };
    props.onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
  };

  const value = props.value as string;
  let displayValue = value;

  if (isCurrency) {
    if (isFocused) {
      // On focus, show the raw value but with a comma for easier pt-BR editing
      displayValue = value ? value.replace('.', ',') : '';
    } else {
      // On blur, if there's a value, format it as BRL currency
      const number = parseFloat(value);
      if (!isNaN(number) && value) {
        displayValue = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(number);
      } else {
        displayValue = ''; // Show nothing if the value is empty or invalid
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
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
      <div className="relative rounded-md shadow-sm flex-grow">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <i className={`${iconClass} ${error ? 'text-red-500' : 'text-gray-400'}`} aria-hidden="true"></i>
        </div>
        <input
          {...props}
          type={isCurrency ? 'text' : props.type} // Use 'text' for currency to allow formatting
          value={displayValue}
          onChange={isCurrency ? handleChange : props.onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`block w-full h-full rounded-md bg-white dark:bg-gray-700 pl-10 pr-4 py-2 sm:text-sm ${error ? errorInputClasses : defaultInputClasses}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
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