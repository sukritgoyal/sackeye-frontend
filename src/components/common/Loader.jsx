import React from 'react';

const Loader = ({ size = 'lg', showText = true, text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} border-slate-300 dark:border-slate-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin`} />
      {showText && <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{text}</p>}
    </div>
  );
};

export default Loader;
