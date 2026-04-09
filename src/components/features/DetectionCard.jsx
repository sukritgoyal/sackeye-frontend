import React from 'react';
import { formatDuration } from '../../utils/formatDuration';

const DetectionCard = ({ detection, index, sequenceNumber, onClick }) => {
//   console.log(`[DetectionCard] Rendering detection #${index + 1}:`, detection);
  const [x1, y1, x2, y2] = detection.bbox ? detection.bbox : [0, 0, 100, 100];
  
  const width = x2 - x1;
  const height = y2 - y1;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
      onClick={onClick}
    >
      <div className="aspect-square bg-slate-100 dark:bg-slate-900 overflow-hidden relative flex items-center justify-center">
        {sequenceNumber && (
          <div className="absolute top-2 left-2 text-slate-900 dark:text-slate-100 text-xs font-semibold z-10">
            #{sequenceNumber}
          </div>
        )}
        {detection.image_url ? (
          <div 
            style={{
              backgroundImage: `url(${detection.image_url})`,
              backgroundPosition: `-${x1}px -${y1}px`,
              backgroundRepeat: 'no-repeat',
              width: `${width}px`,
              height: `${height}px`,
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center flex-col gap-2 text-slate-400">
             <span className="material-symbols-outlined text-4xl">image_not_supported</span>
             <p className="text-xs">No image</p>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {detection.duration_at
            ? formatDuration(detection.duration_at)
            : 'Unknown duration'}
        </p>
      </div>
    </div>
  );
};

export default DetectionCard;
