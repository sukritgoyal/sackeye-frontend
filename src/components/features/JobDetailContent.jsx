import React from 'react';
import DetectionGallery from './DetectionGallery';
import VideoPlayer from './VideoPlayer';
import MarkedDetectionsBar from './MarkedDetectionsBar';
import DetectionImageCarousel from './DetectionImageCarousel';
import Loader from '../common/Loader';

const JobDetailContent = ({
  loading,
  error,
  videoUrl,
  detections,
  markedDetections,
  selectedCarouselDetectionId,
  sortOrder,
  jobId,
  isPublicView,
  handleMarkDetectionForDeletion,
  handleUnmarkDetection,
  handleSelectMarkedDetection,
  handleCloseCarousel,
  handleDetectionChange,
  handleDetectionDeleted,
  handleCreateDetection,
  getSequenceNumbers,
  setSortOrder,
  setSelectedCarouselDetectionId,
  setMarkedDetections
}) => {
  // Never show explicitly user-deleted detections, in either grid.
  const visibleDetections = detections.filter((d) => !d.isDeleted);

  // Split the remaining detections into two independent groups.
  const pendingDetections = visibleDetections.filter((d) => !d.auto_deleted);
  const autoDeletedDetections = visibleDetections.filter((d) => d.auto_deleted === true);

  const sequenceNumbers = getSequenceNumbers();

  // Figure out which group the currently-open carousel detection belongs to,
  // so next/prev navigation stays scoped to that group instead of jumping
  // across grids.
  const activeCarouselGroup = pendingDetections.some((d) => d._id === selectedCarouselDetectionId)
    ? pendingDetections
    : autoDeletedDetections;

  const renderGridSection = (title, sectionDetections, emptyMessage) => (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">
          {title} ({sectionDetections.length})
        </h2>
        {title === 'Detections' && (
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors p-2 -mr-2"
            title={`Sort by duration (${sortOrder === 'desc' ? 'descending' : 'ascending'})`}
          >
            <span className="material-symbols-outlined text-lg">
              {sortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward'}
            </span>
          </button>
        )}
      </div>

      {sectionDetections.length > 0 ? (
        <DetectionGallery
          detections={sectionDetections}
          sortOrder={sortOrder}
          selectedDetectionId={selectedCarouselDetectionId}
          onDetectionSelect={setSelectedCarouselDetectionId}
        />
      ) : (
        <p className="text-slate-400 text-sm py-6 text-center">{emptyMessage}</p>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <main className="flex-1 p-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader size="lg" text="Loading job details..." />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Video Player Section */}
        {!loading && !error && videoUrl && (
          <div className="mb-8">
            <VideoPlayer
              videoUrl={videoUrl}
              title={`Playback`}
              detections={pendingDetections}
              jobId={jobId}
              isPublicView={isPublicView}
              onMarkDetectionForDeletion={handleMarkDetectionForDeletion}
              onCreateDetection={handleCreateDetection}
            />
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">info</span>
              <span>
                <strong>Double-click:</strong> left side to jump to previous event, right side for next event, center to mark detection
              </span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && visibleDetections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">image_not_supported</span>
            <p className="text-slate-400 font-medium">No detections found for this job</p>
          </div>
        )}

        {/* Detections Grids */}
        {!loading && !error && visibleDetections.length > 0 && (
          <div>
            <MarkedDetectionsBar
              markedDetections={markedDetections}
              sequenceNumbers={sequenceNumbers}
              onUnmark={handleUnmarkDetection}
              onSelect={handleSelectMarkedDetection}
            />

            {renderGridSection('Detections', pendingDetections, 'No detections pending review.')}
            {renderGridSection('Auto-Deleted', autoDeletedDetections, 'No detections have been auto-deleted.')}
          </div>
        )}
      </main>

      {/* Image Carousel Modal */}
      {selectedCarouselDetectionId && (
        <DetectionImageCarousel
          detections={activeCarouselGroup}
          selectedDetectionId={selectedCarouselDetectionId}
          sequenceNumbers={sequenceNumbers}
          isPublicView={isPublicView}
          onClose={handleCloseCarousel}
          onDetectionChange={handleDetectionChange}
          onDetectionDeleted={handleDetectionDeleted}
        />
      )}
    </div>
  );
};

export default JobDetailContent;