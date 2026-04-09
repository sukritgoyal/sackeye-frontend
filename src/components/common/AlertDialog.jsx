import React from 'react';

const AlertDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  cancelText = 'Cancel', 
  confirmText = 'Confirm',
  isLoading = false,
  icon = 'warning',
  variant = 'amber'
}) => {
  if (!isOpen) return null;

  const variantColors = {
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      icon: 'text-amber-600 dark:text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:bg-amber-400'
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      icon: 'text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-red-400'
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      icon: 'text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      icon: 'text-green-600 dark:text-green-400',
      button: 'bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-400'
    }
  };

  const colors = variantColors[variant] || variantColors.amber;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-11/12 shadow-xl">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${colors.bg}`}>
            <span className={`material-symbols-outlined ${colors.icon}`}>{icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              {title}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              {message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 px-4 py-2 ${colors.button} rounded-lg font-semibold text-white transition-colors text-sm disabled:cursor-not-allowed`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;
