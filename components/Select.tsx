import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  iconClass: string;
  children: React.ReactNode;
  tooltip?: string;
}

const Select: React.FC<SelectProps> = ({ label, iconClass, children, tooltip, ...props }) => {
  return (
    <div>
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
      <div className="relative rounded-md shadow-sm">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <i className={`${iconClass} text-gray-400`} aria-hidden="true"></i>
        </div>
        <select
          {...props}
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 pl-10 pr-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm appearance-none"
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
            <i className="fa-solid fa-chevron-down text-xs"></i>
        </div>
      </div>
    </div>
  );
};

export default Select;