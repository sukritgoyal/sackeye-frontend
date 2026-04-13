import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';
import JobDetailHeader from '../components/features/JobDetailHeader';
import JobDetailContent from '../components/features/JobDetailContent';
import InquiryModal from '../components/features/InquiryModal';
import { useSearchParams } from 'react-router-dom';

// Simple UUID v4 generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Get or create unique device ID
const getDeviceId = () => {
  let deviceId = localStorage.getItem('unique_device_id');
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem('unique_device_id', deviceId);
  }
  return deviceId;
};

// Fetch user IP address
const fetchUserIp = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (err) {
    console.error('[JobDetail] IP fetch failed:', err);
    return 'unknown';
  }
};

const JobDetail = () => {
  const { jobId } = useParams();
  const location = useLocation();
  const isPublicView = location.pathname.startsWith('/public/');
  const [loading, setLoading] = useState(true);
  const [detections, setDetections] = useState([]);
  const [job, setJob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [markedDetections, setMarkedDetections] = useState([]);
  const [selectedCarouselDetectionId, setSelectedCarouselDetectionId] = useState(null);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [searchParams] = useSearchParams();
  const deviceId = getDeviceId();
  const group = searchParams.get('group');
  
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
        try {
          const jobResponse = await api.get(`/api/jobs/${jobId}?group=${group}&deviceId=${deviceId}`);
          setJob(jobResponse.data);
        } catch (jobErr) {
          console.warn('[JobDetail] Failed to fetch job details:', jobErr.message);
        }

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

  const handleTogglePublic = async () => {
    if (!job) return;
    
    setTogglingPublic(true);
    try {
      const response = await api.get(`/api/jobs/${jobId}/togglePublic`);
      setJob(response.data.job);
      console.log('[JobDetail] Job public status toggled successfully:', response.data.msg);
    } catch (err) {
      console.error('[JobDetail] Failed to toggle job public status:', err.response?.data?.msg || err.message);
      setError('Failed to toggle job public status');
    } finally {
      setTogglingPublic(false);
    }
  };

  const handleShare = (platform) => {
    const shareUrl = `${window.location.origin}/public/job/${jobId}`;
    const jobTitle = `Check out this job recording`;
    
    const shareLinks = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${jobTitle}: ${shareUrl}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(jobTitle)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(jobTitle)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      email: `mailto:?subject=${encodeURIComponent(jobTitle)}&body=${encodeURIComponent(`${jobTitle}: ${shareUrl}`)}`
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
      setShowShareMenu(false);
      return;
    }

    if (navigator.share && platform === 'native') {
      navigator.share({
        title: jobTitle,
        text: 'Check out this job recording',
        url: shareUrl
      }).catch(err => console.log('[JobDetail] Share cancelled:', err));
      setShowShareMenu(false);
      return;
    }

    if (shareLinks[platform]) {
      window.open(shareLinks[platform], '_blank', 'noopener,noreferrer');
      setShowShareMenu(false);
    }
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

  const handleInquirySubmit = async (formData) => {
    try {
      const ipAddress = await fetchUserIp();
      const inquiryData = {
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        ipAddress: ipAddress,
        deviceId: deviceId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        jobId: jobId
      };

      console.log('[JobDetail] Submitting inquiry:', inquiryData);
      
      // Send to backend API
      const response = await api.post('/api/jobs/inquiry', inquiryData);
      
      console.log('[JobDetail] Inquiry submitted successfully:', response.data);
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.message;
      console.error('[JobDetail] Failed to submit inquiry:', errorMsg);
      
      // If backend returned a validation error but saved the data, re-throw with the message
      if (err.response?.data?.saved) {
        const error = new Error(errorMsg);
        error.response = err.response;
        throw error;
      }
      
      throw err;
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
      
      {/* Header */}
      <JobDetailHeader
        job={job}
        jobId={jobId}
        isPublicView={isPublicView}
        togglingPublic={togglingPublic}
        handleTogglePublic={handleTogglePublic}
        handleShare={handleShare}
        showShareMenu={showShareMenu}
        setShowShareMenu={setShowShareMenu}
        onInquireClick={() => setShowInquiryModal(true)}
      />

      {/* Content */}
      <JobDetailContent
        loading={loading}
        error={error}
        videoUrl={videoUrl}
        detections={detections}
        markedDetections={markedDetections}
        selectedCarouselDetectionId={selectedCarouselDetectionId}
        sortOrder={sortOrder}
        jobId={jobId}
        isPublicView={isPublicView}
        handleMarkDetectionForDeletion={handleMarkDetectionForDeletion}
        handleUnmarkDetection={handleUnmarkDetection}
        handleSelectMarkedDetection={handleSelectMarkedDetection}
        handleCloseCarousel={handleCloseCarousel}
        handleDetectionChange={handleDetectionChange}
        handleDetectionDeleted={handleDetectionDeleted}
        handleCreateDetection={handleCreateDetection}
        getSequenceNumbers={getSequenceNumbers}
        setSortOrder={setSortOrder}
        setSelectedCarouselDetectionId={setSelectedCarouselDetectionId}
        setMarkedDetections={setMarkedDetections}
      />

      {/* Inquiry Modal */}
      <InquiryModal
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        onSubmit={handleInquirySubmit}
      />
    </div>
  );
};

export default JobDetail;
