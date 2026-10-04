import React from 'react';

/** Bottom sheet used by the filter and selected-ranges panels. */
const BottomSheet = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[82vh] w-full max-w-md overflow-auto rounded-t-2xl bg-white px-4 pb-[calc(1.1rem+env(safe-area-inset-bottom))] pt-3.5 text-[#1b2330] dark:bg-[#1c222c] dark:text-[#e8ecf3]"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[17px] font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="material-symbols-outlined px-1.5 text-[#6a7485] dark:text-[#9aa4b5]">close</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
