
import React, { useState, useRef, useEffect } from 'react';

// Predefined list of icons for expense categorization
const icons = [
  { name: 'fa-building-columns', label: 'Aluguel / Imóvel' },
  { name: 'fa-lightbulb', label: 'Contas (Luz, Água, etc.)' },
  { name: 'fa-cart-shopping', label: 'Compras / Mercadorias' },
  { name: 'fa-truck', label: 'Logística / Frete' },
  { name: 'fa-bullhorn', label: 'Marketing / Publicidade' },
  { name: 'fa-wrench', label: 'Manutenção / Reparos' },
  { name: 'fa-plane-departure', label: 'Transporte / Viagem' },
  { name: 'fa-file-invoice-dollar', label: 'Taxas / Impostos' },
  { name: 'fa-user-tie', label: 'Serviços Terceirizados' },
  { name: 'fa-box-archive', label: 'Material de Escritório' },
  { name: 'fa-phone', label: 'Telecomunicações' },
  { name: 'fa-dollar-sign', label: 'Outros' },
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Hook to handle clicks outside the component to close the popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);


  const handleIconSelect = (icon: string) => {
    onChange(icon);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <i className={`fa-solid ${value} text-lg`}></i>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-72 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none p-2"
             role="menu"
             aria-orientation="vertical"
             aria-labelledby="menu-button">
          <div className="grid grid-cols-4 gap-2" role="none">
            {icons.map(icon => (
              <button
                key={icon.name}
                type="button"
                onClick={() => handleIconSelect(icon.name)}
                className={`flex items-center justify-center p-3 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${value === icon.name ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}`}
                title={icon.label}
                role="menuitem"
              >
                <i className={`fa-solid ${icon.name} text-xl`}></i>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IconPicker;
