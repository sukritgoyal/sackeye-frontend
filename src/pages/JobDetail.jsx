import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import DetectionGallery from '../components/features/DetectionGallery';
import VideoPlayer from '../components/features/VideoPlayer';
import MarkedDetectionsBar from '../components/features/MarkedDetectionsBar';
import DetectionImageCarousel from '../components/features/DetectionImageCarousel';
import Loader from '../components/common/Loader';

const JobDetail = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [loading, setLoading] = useState(true);
  const [detections, setDetections] = useState([]);
  const [job, setJob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [markedDetections, setMarkedDetections] = useState([]);
  const [selectedCarouselDetectionId, setSelectedCarouselDetectionId] = useState(null);

  // Fetch job details and detections
  useEffect(() => {
    const fetchJobData = async () => {
      if (!jobId) {
        console.error('[JobDetail] No jobId available');
        setError('Job ID not found');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch job details
        // const jobResponse = await api.get(`/api/jobs/${jobId}`);

        // Fetch video signed URL
        try {
          const videoResponse = await api.get(`/api/jobs/video/${jobId}`);
          console.log('[JobDetail] Video URL fetched:', videoResponse.data.link);
          setVideoUrl(videoResponse.data.link);
        } catch (videoErr) {
          console.warn('[JobDetail] Failed to fetch video URL:', videoErr.message);
          setVideoUrl(null);
        }

        // Fetch detections
        const detectionsResponse = await api.get(`/api/jobs/${jobId}/detections`);
        const fetchedDetections = detectionsResponse.data || [];
        // console.log(fetchedDetections)
        console.log('[JobDetail] JOB ID fetched:', fetchedDetections?.[0]?.job_id);
        setDetections(fetchedDetections);
        setError(null);
      } catch (err) {
        console.error('[JobDetail] Failed to fetch data:', err.response?.data?.msg || err.message);
        setError('Failed to fetch job details');
        setDetections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [jobId]);

  const handleMarkDetectionForDeletion = (detection) => {
    // Check if already marked
    const isAlreadyMarked = markedDetections.some(d => d._id === detection._id);
    if (!isAlreadyMarked) {
      setMarkedDetections([...markedDetections, detection]);
    }
  };

  const handleUnmarkDetection = (detectionId) => {
    setMarkedDetections(markedDetections.filter(d => d._id !== detectionId));
  };

  const handleSelectMarkedDetection = (detection) => {
    // Open the carousel with the marked detection
    setSelectedCarouselDetectionId(detection._id);
  };

  const handleCloseCarousel = () => {
    setSelectedCarouselDetectionId(null);
  };

  const handleDetectionChange = (detection) => {
    setSelectedCarouselDetectionId(detection._id);
  };

  const handleDetectionDeleted = (detectionId) => {
    // Remove from detections
    setDetections(detections.filter(d => d._id !== detectionId));
    // Remove from marked detections if present
    setMarkedDetections(markedDetections.filter(d => d._id !== detectionId));
  };

  const handleCreateDetection = async (detectionData) => {
    try {
      // Call the API to create a detection
      const response = await api.post('/api/jobs/detection/create', {
        jobId,
        frame_number: detectionData.frame_number,
        duration_at: detectionData.duration_at
      });

      const newDetection = response.data;

      console.log('[JobDetail] Detection created successfully:', {
        id: newDetection._id,
        duration: newDetection.duration_at,
        frameNumber: newDetection.frame_number
      });

      // Add the new detection to the detections array
      setDetections([...detections, newDetection]);
    } catch (err) {
      console.error('[JobDetail] Failed to create detection:', err.response?.data?.msg || err.message);
    }
  };

  const getSequenceNumbers = () => {
    const sequenceMap = {};
    const sorted = [...detections].sort((a, b) => a.duration_at - b.duration_at);
    sorted.forEach((detection, index) => {
      sequenceMap[detection._id] = index + 1;
    });
    return sequenceMap;
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
      
      {/* Header */}
      <header className="sticky top-0 z-[100] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
        <div className="flex items-center h-16 px-6 gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="material-symbols-outlined text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 -ml-2 rounded-full transition-colors"
          >
            arrow_back
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">Detections</h1>
          </div>
        </div>
      </header>

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
                detections={detections}
                jobId={jobId}
                onMarkDetectionForDeletion={handleMarkDetectionForDeletion}
                onCreateDetection={handleCreateDetection}
              />
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && detections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">image_not_supported</span>
              <p className="text-slate-400 font-medium">No detections found for this job</p>
            </div>
          )}

          {/* Detections Grid */}
          {!loading && !error && detections.length > 0 && (
            <div>
              <MarkedDetectionsBar 
                markedDetections={markedDetections}
                sequenceNumbers={getSequenceNumbers()}
                onUnmark={handleUnmarkDetection}
                onSelect={handleSelectMarkedDetection}
              />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">
                  {detections.length} Detections
                </h2>
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors p-2 -mr-2"
                  title={`Sort by duration (${sortOrder === 'desc' ? 'descending' : 'ascending'})`}
                >
                  <span className="material-symbols-outlined text-lg">{sortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward'}</span>
                </button>
              </div>
              <DetectionGallery 
                detections={detections} 
                sortOrder={sortOrder}
                selectedDetectionId={selectedCarouselDetectionId}
                onDetectionSelect={setSelectedCarouselDetectionId}
              />
            </div>
          )}
        </main>
      </div>

      {/* Image Carousel Modal */}
      {selectedCarouselDetectionId && (
        <DetectionImageCarousel
          detections={detections}
          selectedDetectionId={selectedCarouselDetectionId}
          sequenceNumbers={getSequenceNumbers()}
          onClose={handleCloseCarousel}
          onDetectionChange={handleDetectionChange}
          onDetectionDeleted={handleDetectionDeleted}
        />
      )}
    </div>
  );
};

export default JobDetail;
