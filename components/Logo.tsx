import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Symbol / Icon */}
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
          {/* Background Shape - Hexagon representing structure/stability */}
          <path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" className="fill-indigo-600 dark:fill-indigo-500" />
          
          {/* Inner details representing analysis/tech */}
          <path d="M50 10V45" stroke="white" strokeWidth="6" strokeLinecap="round" className="opacity-30" />
          <path d="M50 55V90" stroke="white" strokeWidth="6" strokeLinecap="round" className="opacity-30" />
          <path d="M20 50H80" stroke="white" strokeWidth="6" strokeLinecap="round" className="opacity-30" />
          
          {/* Initials SP */}
          <text x="50" y="66" fontFamily="Arial, sans-serif" fontSize="40" fontWeight="bold" fill="white" textAnchor="middle">SP</text>
        </svg>
      </div>
      
      {/* Typography */}
      <div className="flex flex-col justify-center">
        <span className="text-lg sm:text-xl font-extrabold tracking-tight text-gray-800 dark:text-white leading-none">
          SP Assessoria
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold text-indigo-600 dark:text-indigo-400">
            Contábil
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-400"></span>
          <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
            Intelligence
          </span>
        </div>
      </div>
    </div>
  );
};

export default Logo;