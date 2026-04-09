import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import JobCard from '../components/features/JobCard';
import PlaybackModal from '../components/features/PlaybackModal';

const History = () => {
  const navigate = useNavigate();
  const { cameraId } = useParams(); // Get camera ID from URL
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyJobs, setHistoryJobs] = useState([]);
  const [error, setError] = useState(null);
  const [isPlaybackModalOpen, setIsPlaybackModalOpen] = useState(false);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackImageUrl, setPlaybackImageUrl] = useState('');

  // Fetch jobs for this camera on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      if (!cameraId) {
        console.error('[History] No cameraId available');
        setError('Camera ID not found');
        setHistoryLoading(false);
        return;
      }

      setHistoryLoading(true);
      try {
        console.log('[History] Fetching jobs for camera:', cameraId);
        const response = await api.post('/api/jobs', { cameraId });
        // console.log('[History] Jobs fetched successfully:', response.data);
        const sortedJobs = (response.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHistoryJobs(sortedJobs);
        setError(null);
      } catch (err) {
        console.error('[History] Failed to fetch jobs:', err.response?.data?.msg || err.message);
        setError('Failed to fetch job history');
        setHistoryJobs([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchJobs();
  }, [cameraId]);

  const handleStartJob = async () => {
    if (!cameraId) {
      console.error('[History] No cameraId available');
      alert('Camera ID not found');
      return;
    }

    setLoading(true);
    try {
      console.log('[History] Starting job for camera:', cameraId);
      const response = await api.post('/api/jobs/start', { cameraId });
      console.log('[History] Job started successfully:', response.data);
      const job = response.data;

      console.log('[History] Job ID received:', job);
      // Navigate to the Live Monitor screen with jobId
      navigate(`/live/${cameraId}`, { state: { job } });
    } catch (error) {
      console.error('[History] Failed to start job:', error.response?.data?.msg || error.message);
      alert('Failed to start analysis: ' + (error.response?.data?.msg || error.message));
      setLoading(false);
    }
  };

  // First submit: Generate playback image from time range
  const handleGeneratePlayback = async (date, startTime, endTime) => {
    if (!cameraId) {
      console.error('[History] No cameraId available');
      alert('Camera ID not found');
      return;
    }

    setPlaybackLoading(true);
    try {
      const startDateTime = `${date} ${startTime}:00`;
      const endDateTime = `${date} ${endTime}:00`;
      console.log('[History] Requesting playback image:', { startTime: startDateTime, endTime: endDateTime });
      const response = await api.post('/api/cameras/get-image', {
        cameraId,
        startTime: startDateTime,
        endTime: endDateTime,
      });
      console.log('[History] Playback image received:', response.data);
      // Set imageUrl to update modal and trigger point-marking stage
      setPlaybackImageUrl(response.data.imageUrl);
    } catch (error) {
      console.error('[History] Failed to generate playback:', error.response?.data?.msg || error.message);
      alert('Failed to generate playback image: ' + (error.response?.data?.msg || error.message));
    }
    finally {
      setPlaybackLoading(false);
    }
  };

  // Second submit: Submit playback with marked points
  const handleSubmitPlayback = async (date, startTime, endTime, points, strict) => {
    if (!cameraId) {
      console.error('[History] No cameraId available');
      alert('Camera ID not found');
      return;
    }

    setPlaybackLoading(true);
    try {
      const startDateTime = `${date} ${startTime}:00`;
      const endDateTime = `${date} ${endTime}:00`;
      console.log('[History] Submitting playback with points:', { startTime: startDateTime, endTime: endDateTime, points, strict });
      const payload = {
        cameraId,
        startTime: startDateTime,
        endTime: endDateTime,
        strict,
      };
      if (points && points.length > 0) {
        payload.points = points;
      }
      const response = await api.post('/api/jobs/playback', payload);
      console.log('[History] Playback with points processed:', response.data);
      setIsPlaybackModalOpen(false);
      setPlaybackImageUrl('');
      
      // Refresh the jobs list
      const jobsResponse = await api.post('/api/jobs', { cameraId });
      const sortedJobs = (jobsResponse.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistoryJobs(sortedJobs);
    } catch (error) {
      console.error('[History] Failed to submit playback:', error.response?.data?.msg || error.message);
      alert('Failed to submit playback: ' + (error.response?.data?.msg || error.message));
    } finally {
      setPlaybackLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
      
      {/* Header */}
      <header className="sticky top-0 z-[100] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
        <div className="flex items-center h-16 px-6 gap-4">
          <button 
            onClick={() => navigate('/cameras')}
            className="material-symbols-outlined text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 -ml-2 rounded-full transition-colors"
          >
            arrow_back
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">Camera Activity</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Quick Action Start Button */}
        <div className="p-6 pb-4 space-y-3">
          <button 
            onClick={handleStartJob}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold h-14 rounded-2xl flex items-center justify-center gap-3 transition-colors active:scale-[0.98] text-base"
          >
            {loading ? (
              <>
                <span>Starting Analysis...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">play_arrow</span>
                Start New Analysis
              </>
            )}
          </button>

          <button 
            onClick={() => setIsPlaybackModalOpen(true)}
            className="w-full bg-black hover:bg-zinc-800 active:bg-zinc-900 text-white font-bold h-14 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-base"          >
            <span className="material-symbols-outlined">history</span>
            Generate Playback
          </button>
        </div>

        <main className="flex-1 p-6 pt-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">Recent Sessions</h2>
          <span className="material-symbols-outlined text-slate-400">filter_list</span>
        </div>

        {/* Loading State */}
        {historyLoading && (
          <div className="space-y-4 py-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!historyLoading && error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* List of Past Jobs */}
        {!historyLoading && !error && historyJobs.length > 0 && (
          <div className="space-y-4">
            {historyJobs.map((job) => (
              <JobCard 
                key={job._id} 
                job={job} 
                onClick={() =>
                  navigate(`/job/${job._id}`, {
                    state: { jobId: job.job_id, cameraId },
                  })
                }
              />
            ))}
          </div>
        )}

        {/* Empty State Illustration provision */}
        {!historyLoading && !error && historyJobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">history</span>
            <p className="text-slate-400 font-medium">No past analysis found for this camera.</p>
          </div>
        )}
        </main>
      </div>

      {/* Playback Modal */}
      <PlaybackModal
        isOpen={isPlaybackModalOpen}
        onClose={() => {
          setIsPlaybackModalOpen(false);
          setPlaybackImageUrl('');
        }}
        onSubmitMarkPoints={handleGeneratePlayback}
        onSubmitPlayback={handleSubmitPlayback}
        isLoading={playbackLoading}
        imageUrl={playbackImageUrl}
      />
    </div>
  );
};

export default History;