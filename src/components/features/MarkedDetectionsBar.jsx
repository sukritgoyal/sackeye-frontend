import React from 'react';

const MarkedDetectionsBar = ({ 
  markedDetections = [], 
  sequenceNumbers = {},
  onUnmark,
  onSelect 
}) => {
  // If no marked detections, render nothing
  if (!markedDetections || markedDetections.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-b border-slate-200 px-3 py-2 mb-6">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
          Marked ({markedDetections.length})
        </span>
        
        <div 
          className="flex gap-2 overflow-x-auto"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style>{`
            .marked-scroll::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {markedDetections.map((detection) => {
            const eventNumber = sequenceNumbers[detection._id] || '?';
            
            return (
              <div
                key={detection._id}
                className="flex-shrink-0 relative group"
              >
                <button
                  onClick={() => onSelect(detection)}
                  className="flex items-center justify-center px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors"
                  title={`Event ${eventNumber} - Click to view`}
                >
                  <span className="text-sm font-bold text-blue-600">
                    #{eventNumber}
                  </span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnmark(detection._id);
                  }}
                  className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 bg-slate-600 hover:bg-slate-700 rounded-full text-white transition-colors shadow-md"
                  title="Unmark for deletion"
                >
                  <span className="text-xs font-bold leading-none">×</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MarkedDetectionsBar;
