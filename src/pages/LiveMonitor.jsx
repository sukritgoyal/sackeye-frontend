import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';
import socket from '../socket';
import DetectionGallery from '../components/features/DetectionGallery';

const LiveMonitor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cameraId } = useParams();
  const job = location.state?.job;
  
  // State for real-time updates
  const [count, setCount] = useState(0);
  const [detections, setDetections] = useState([]);
  const [isRunning, setIsRunning] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stopLoading, setStopLoading] = useState(false);

  // Timer logic for session duration
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Fetch detections for this job
  const fetchDetections = async () => {
    if (!job?._id) {
      console.error('[LiveMonitor] No job._id available');
      return;
    }

    try {
    //   console.log('[LiveMonitor] Fetching detections for job:', job._id);
      const response = await api.get(`/api/jobs/${job._id}/detections`);
      const fetchedDetections = response.data || [];
      console.log('[LiveMonitor] Detections fetched successfully:', fetchedDetections);
      setDetections(fetchedDetections);
      setCount(fetchedDetections.length); // Update count based on fetched detections
    } catch (err) {
      console.error('[LiveMonitor] Failed to fetch detections:', err.response?.data?.msg || err.message);
    }
  };

  // Fetch detections on component mount
  useEffect(() => {
    fetchDetections();
  }, [job?._id]);


  // Socket.io Listeners for real-time detection updates
  useEffect(() => {
    if (!job?.job_id) {
      console.log('[LiveMonitor] No job.job_id available yet, waiting to connect socket');
      return;
    }

    console.log('[LiveMonitor] Joining job room:', job.job_id);
    socket.emit('join_job', job.job_id);

    // Listen for count updates from backend
    const handleCountUpdate = (data) => {
      console.log('[LiveMonitor] Received count update:', data);
      
      // Verify that the update is for the current job
      if (data.job_id !== job.job_id) {
        console.warn('[LiveMonitor] Received update for different job:', data.job_id, 'Expected:', job.job_id);
        return;
      }
      setCount(prev => prev + 1); // Increment count based on new detection
      // Fetch updated detections when new detection arrives
    };

    socket.on('new_detection_event', handleCountUpdate);

    // Cleanup on unmount or when jobId changes
    return () => {
      console.log('[LiveMonitor] Cleaning up socket listeners for job:', job.job_id);
      socket.off('new_detection_event', handleCountUpdate);
    };
  }, [job?.job_id]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopJob = async () => {
    if (!job?.job_id) {
      console.error('[LiveMonitor] No job.job_id available');
      alert('Job ID not found');
      return;
    }

    setStopLoading(true);
    try {
      console.log('[LiveMonitor] Stopping job:', job.job_id);
      const response = await api.post('/api/jobs/stop', { jobId: job.job_id });
      console.log('[LiveMonitor] Job stopped successfully:', response.data);
      
      setIsRunning(false);
      // Navigate back to history
    } catch (error) {
      console.error('[LiveMonitor] Failed to stop job:', error.response?.data?.msg || error.message);
    //   alert('Failed to stop analysis: ' + (error.response?.data?.msg || error.message));
      setStopLoading(false);
    }
    finally {
      navigate(`/history/${cameraId}`);
    }
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
            <h1 className="text-xl font-bold tracking-tight">Live Analysis</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8 pb-24">
        
        {/* Counter Section */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm">Total Detections</p>
          <div className="relative">
            <div className="text-9xl font-black text-blue-600 dark:text-blue-500 tracking-tighter tabular-nums leading-none">
              {count}
            </div>
          </div>
        </div>

        {/* Detection Gallery */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recent Detections ({detections.length})</h2>
            <button
              onClick={fetchDetections}
              className="material-symbols-outlined text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors"
              title="Refresh detections"
            >
              refresh
            </button>
          </div>
          {detections.length > 0 ? (
            <DetectionGallery detections={detections} />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">image_not_supported</span>
              <p className="text-slate-400 text-sm">No detections yet. Refresh to load detections.</p>
            </div>
          )}
        </div>

      </main>

      {/* Fixed Bottom Stop Button */}
      <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4">
        <button 
          onClick={handleStopJob}
          disabled={stopLoading}
          className="w-full h-12 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98] text-sm"
        >
          {stopLoading ? (
            <>
              Stopping...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">stop_circle</span>
              Stop Monitoring
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LiveMonitor;