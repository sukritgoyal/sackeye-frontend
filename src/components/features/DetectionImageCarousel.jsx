import React, { useState, useRef } from 'react';
import api from '../../api/axiosConfig';

const DetectionImageCarousel = ({ 
  detections, 
  selectedDetectionId,
  sequenceNumbers,
  isPublicView = false,
  onClose,
  onDetectionChange,
  onDetectionDeleted
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showBbox, setShowBbox] = useState(false);
  const [imgDimensions, setImgDimensions] = useState(null);
  const imgRef = useRef(null);
  
  // Sort detections by sequence number (duration_at order)
  const sortedDetections = [...detections].sort((a, b) => {
    const seqA = sequenceNumbers ? sequenceNumbers[a._id] : 0;
    const seqB = sequenceNumbers ? sequenceNumbers[b._id] : 0;
    return seqA - seqB;
  });
  const currentIndex = sortedDetections.findIndex(d => d._id === selectedDetectionId);
  const selectedDetection = sortedDetections[currentIndex];
  const sequenceNumber = sequenceNumbers ? sequenceNumbers[selectedDetectionId] : null;

  const handleImageLoad = (e) => {
    setImgDimensions({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight
    });
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setDeleteError(null);
      onDetectionChange(sortedDetections[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < sortedDetections.length - 1) {
      setDeleteError(null);
      onDetectionChange(sortedDetections[currentIndex + 1]);
    }
  };

  const handleDeleteDetection = async () => {
    if (!selectedDetection._id) {
      setDeleteError('Detection ID not found');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await api.delete(`/api/jobs/detection/${selectedDetection._id}`);
      
      // Notify parent about deletion
      if (onDetectionDeleted) {
        onDetectionDeleted(selectedDetection._id);
      }
      
      // Move to next or previous detection after deletion
      if (currentIndex < detections.length - 1) {
        onDetectionChange(detections[currentIndex + 1]);
      } else if (currentIndex > 0) {
        onDetectionChange(detections[currentIndex - 1]);
      } else {
        // If it's the last detection, close the modal
        onClose();
      }
    } catch (err) {
      setDeleteError(err.response?.data?.msg || 'Failed to delete detection');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!selectedDetection) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      onClick={onClose}
    >
      <div 
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Buttons */}
        <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteDetection}
              disabled={isDeleting || isPublicView}
              className="text-red-500 hover:text-red-600 disabled:text-red-400 disabled:cursor-not-allowed p-2 -ml-2 transition-colors"
              title={isPublicView ? "Cannot delete detections in public view" : "Delete detection"}
            >
              <span className="material-symbols-outlined text-2xl">delete</span>
            </button>
            <button
              onClick={() => setShowBbox(!showBbox)}
              className={`p-2 -ml-1 transition-colors ${
                showBbox
                  ? 'text-blue-500 hover:text-blue-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title={`${showBbox ? 'Hide' : 'Show'} bounding box`}
            >
              <span className="material-symbols-outlined text-2xl">rectangle</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 -mr-1 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Image Container */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative">
          {deleteError && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm font-medium z-10 w-96">
              {deleteError}
            </div>
          )}
          
          {selectedDetection.image_url ? (
            <div className="relative inline-block max-w-full max-h-full">
              <img
                ref={imgRef}
                src={selectedDetection.image_url}
                alt="Detection Full Image"
                className="w-full h-auto object-contain rounded-lg"
                onLoad={handleImageLoad}
              />
              {showBbox && imgDimensions && selectedDetection.bbox && imgRef.current && (
                <svg
                  className="absolute top-0 left-0 rounded-lg pointer-events-none"
                  width={imgRef.current.offsetWidth}
                  height={imgRef.current.offsetHeight}
                  viewBox={`0 0 ${imgDimensions.width} ${imgDimensions.height}`}
                  preserveAspectRatio="none"
                >
                  <rect
                    x={selectedDetection.bbox[0]}
                    y={selectedDetection.bbox[1]}
                    width={selectedDetection.bbox[2] - selectedDetection.bbox[0]}
                    height={selectedDetection.bbox[3] - selectedDetection.bbox[1]}
                    fill="none"
                    stroke="red"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-20 flex-col gap-4 text-slate-400">
              <span className="material-symbols-outlined text-6xl">image_not_supported</span>
              <p>Image not available</p>
            </div>
          )}
        </div>

        {/* Carousel Controls */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            title="Previous detection"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              {currentIndex + 1} / {sortedDetections.length}
            </div>
          </div>
          
          <button
            onClick={handleNext}
            disabled={currentIndex === sortedDetections.length - 1}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            title="Next detection"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetectionImageCarousel;
