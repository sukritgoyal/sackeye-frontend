import React, { useRef, useState } from 'react';

const VideoPlayer = ({ videoUrl, title = 'Video', detections = [], onMarkDetectionForDeletion, onCreateDetection, jobId, isPublicView = false }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [fps, setFps] = useState(30);
  const [activeDetection, setActiveDetection] = useState(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const [playOnlyGapsMode, setPlayOnlyGapsMode] = useState(false);
  const [detectionPeriods, setDetectionPeriods] = useState([]);
  const [gaps, setGaps] = useState([]);

  const findClosestLeftDetection = () => {
    if (!detections.length || !videoRef.current) return null;
    
    // Find the closest detection before current time
    const leftDetections = detections.filter(d => d.duration_at < currentTime);
    if (!leftDetections.length) return null;
    return leftDetections.reduce((prev, curr) =>
      curr.duration_at > prev.duration_at ? curr : prev
    );
  };

  const findClosestRightDetection = () => {
    if (!detections.length || !videoRef.current) return null;
    const rightDetections = detections.filter(d => d.duration_at > currentTime);
    if (!rightDetections.length) return null;
    return rightDetections.reduce((prev, curr) =>
      curr.duration_at < prev.duration_at ? curr : prev
    );
  };

  const getDetectionCountUpToCurrent = () => {
    return detections.filter(d => d.duration_at <= currentTime).length;
  };

  const jumpToDetection = (detection) => {
    if (detection && videoRef.current) {
      const jumpTime = Math.max(0, detection.duration_at - 1);
      videoRef.current.currentTime = jumpTime;
      setCurrentTime(jumpTime);
    }
  };

  const handleDetectionNavigation = (x, width) => {
    const threshold = width * 0.25;
    if (x < threshold) {
      jumpToDetection(findClosestLeftDetection());
    } else if (x > width - threshold) {
      jumpToDetection(findClosestRightDetection());
    } else {
      // Center area - mark the closest left detection for deletion
      const closestLeft = findClosestLeftDetection();
      if (closestLeft && onMarkDetectionForDeletion) {
        onMarkDetectionForDeletion(closestLeft);
        console.log('[VideoPlayer] Marked detection for deletion:', closestLeft._id);
      }
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length > 0) {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      touchStartRef.current = {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
  };

  const handleDoubleClick = (e) => {
    // Works for both mouse double-click and touch double-tap
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    e.preventDefault();
    e.stopPropagation();
    handleDetectionNavigation(x, width);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
    showControlsWithTimeout();
  };

  const showControlsWithTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleVideoContainerClick = (e) => {
    // Handle mobile controls visibility
    if (isMobile) {
      showControlsWithTimeout();
    }
  };

  const handleMouseMove = () => {
    if (!isMobile) {
      setShowControls(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setShowControls(false);
    }
  };

  // Handle window resize to detect mobile
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Handle fullscreen change (ESC key, back button, etc.)
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement || 
                                        document.webkitFullscreenElement || 
                                        document.msFullscreenElement);
      
      if (!isCurrentlyFullscreen && isFullscreen) {
        // Exited fullscreen
        setIsFullscreen(false);
        
        // Unlock orientation when exiting fullscreen
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  // Handle detection display based on current time
  React.useEffect(() => {
    if (!detections.length) {
      setActiveDetection(null);
      return;
    }

    const matchingDetection = detections.find(d => {
      const endTime = d.duration_at + 0.5; // Show for 0.5 seconds
      return currentTime >= d.duration_at && currentTime < endTime;
    });

    setActiveDetection(matchingDetection || null);
  }, [currentTime, detections]);

  // Calculate detection periods and gaps when detections or duration changes
  React.useEffect(() => {
    calculateDetectionPeriodsAndGaps();
  }, [detections, duration]);

  // Draw bounding boxes on canvas
  React.useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video display
    canvas.width = video.offsetWidth;
    canvas.height = video.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (activeDetection && video.videoWidth && video.videoHeight && activeDetection.bbox) {
      const [x1, y1, x2, y2] = activeDetection.bbox;

      // Scale bbox coordinates to canvas size
      const scaleX = canvas.width / video.videoWidth;
      const scaleY = canvas.height / video.videoHeight;

      const scaledX1 = x1 * scaleX;
      const scaledY1 = y1 * scaleY;
      const scaledX2 = x2 * scaleX;
      const scaledY2 = y2 * scaleY;

      // Draw red rectangle
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.strokeRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1);
    }
  }, [activeDetection]);



  const handleSpeedChange = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const handleToggleSpeed = () => {
    const speeds = [1, 2, 4, 8];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    handleSpeedChange(speeds[nextIndex]);
  };

  const handleCreateDetection = () => {
    if (!videoRef.current) return;
    
    // Calculate frame number (assuming 30 fps by default)
    const frameNumber = Math.round(currentTime * (fps || 30));
    
    console.log('[VideoPlayer] Requesting detection creation:', {
      duration: currentTime,
      frameNumber: frameNumber
    });
    
    if (onCreateDetection) {
      onCreateDetection({
        frame_number: frameNumber,
        duration_at: currentTime
      });
    }
  };

  const handleFullscreen = () => {
    const element = containerRef.current;
    if (!element) return;

    if (!isFullscreen) {
      // Enter fullscreen
      const requestFullscreen = element.requestFullscreen || 
                               element.webkitRequestFullscreen || 
                               element.msRequestFullscreen;
      if (requestFullscreen) {
        requestFullscreen.call(element);
      }
      
      // Lock to landscape orientation
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(err => {
          console.log('[VideoPlayer] Could not lock orientation:', err);
        });
      }
      
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      const exitFullscreen = document.exitFullscreen || 
                            document.webkitExitFullscreen || 
                            document.msExitFullscreen;
      if (exitFullscreen) {
        exitFullscreen.call(document);
      }
      
      // Unlock orientation to allow normal rotation
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
      
      setIsFullscreen(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime;
      setCurrentTime(newTime);

      // Auto-skip detection periods when in gaps-only mode
      if (playOnlyGapsMode && isPlaying && detectionPeriods.length > 0) {
        const inDetection = detectionPeriods.find(
          p => newTime >= p.first_seen && newTime < p.last_seen
        );
        if (inDetection) {
          // Skip to the end of this detection period
          videoRef.current.currentTime = inDetection.last_seen;
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      // Try to get FPS from video, default to 30
      const videoFps = videoRef.current.videoWidth ? 30 : 30;
      setFps(videoFps);
    }
  };

  const handleSliderChange = (e) => {
    if (videoRef.current) {
      videoRef.current.currentTime = parseFloat(e.target.value);
    }
    showControlsWithTimeout();
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Generate progress bar background gradient
  const getProgressBarGradient = () => {
    if (duration === 0) {
      return `linear-gradient(to right, rgb(239, 68, 68) 0%, rgb(239, 68, 68) ${
        duration > 0 ? (currentTime / duration) * 100 : 0
      }%, rgb(71, 85, 105) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgb(71, 85, 105) 100%)`;
    }

    // Build gradient stops for detections (red) and gaps (green)
    const stops = [];
    let lastPercent = 0;

    // Add detection periods (red)
    for (const period of detectionPeriods) {
      const startPercent = (period.first_seen / duration) * 100;
      const endPercent = (period.last_seen / duration) * 100;

      if (startPercent > lastPercent) {
        // Add gap before this detection (green)
        stops.push(`rgb(34, 197, 94) ${lastPercent}%`);
        stops.push(`rgb(34, 197, 94) ${startPercent}%`);
      }

      // Add detection (red)
      stops.push(`rgb(239, 68, 68) ${startPercent}%`);
      stops.push(`rgb(239, 68, 68) ${endPercent}%`);
      lastPercent = endPercent;
    }

    // Add final gap (green)
    if (lastPercent < 100) {
      stops.push(`rgb(34, 197, 94) ${lastPercent}%`);
      stops.push(`rgb(34, 197, 94) 100%`);
    }

    // Add current time indicator
    const currentPercent = (currentTime / duration) * 100;
    const gradientStr = `linear-gradient(to right, ${stops.join(', ')})`;

    return gradientStr;
  };

  // Calculate detection periods and gaps
  const calculateDetectionPeriodsAndGaps = () => {
    if (!detections.length || !duration) {
      setDetectionPeriods([]);
      setGaps([]);
      return;
    }

    // Sort detections by first_seen
    const sorted = [...detections].sort((a, b) => (a.first_seen || a.duration_at) - (b.first_seen || b.duration_at));

    // Merge overlapping detection periods
    const periods = [];
    for (const detection of sorted) {
      const detStart = detection.first_seen || detection.duration_at;
      const detEnd = detection.last_seen || detection.duration_at;

      if (periods.length && periods[periods.length - 1].last_seen >= detStart) {
        // Overlapping or adjacent - merge
        periods[periods.length - 1].last_seen = Math.max(periods[periods.length - 1].last_seen, detEnd);
      } else {
        periods.push({
          first_seen: detStart,
          last_seen: detEnd
        });
      }
    }

    // Calculate gaps (periods without detections)
    const calculatedGaps = [];

    // Gap before first detection
    if (periods.length > 0 && periods[0].first_seen > 0) {
      if (periods[0].first_seen >= 1) { // Only include gaps >= 1 second
        calculatedGaps.push({
          start: 0,
          end: periods[0].first_seen
        });
      }
    } else if (periods.length === 0) {
      // No detections at all, entire video is a gap
      calculatedGaps.push({
        start: 0,
        end: duration
      });
      setDetectionPeriods([]);
      setGaps(calculatedGaps);
      return;
    }

    // Gaps between detections
    for (let i = 0; i < periods.length - 1; i++) {
      const gapStart = periods[i].last_seen;
      const gapEnd = periods[i + 1].first_seen;
      if (gapEnd - gapStart >= 1) { // Only include gaps >= 1 second
        calculatedGaps.push({ start: gapStart, end: gapEnd });
      }
    }

    // Gap after last detection
    if (periods.length > 0 && periods[periods.length - 1].last_seen < duration) {
      const lastGapStart = periods[periods.length - 1].last_seen;
      if (duration - lastGapStart >= 1) { // Only include gaps >= 1 second
        calculatedGaps.push({
          start: lastGapStart,
          end: duration
        });
      }
    }

    setDetectionPeriods(periods);
    setGaps(calculatedGaps);
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-[999]' : 'w-full max-w-4xl mx-auto'
      }`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleVideoContainerClick}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Canvas overlay for bounding boxes */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-pointer pointer-events-none"
      />

      {/* Controls Overlay */}
      <div className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 bg-gradient-to-t from-black via-transparent to-transparent group ${
        isMobile || showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Top Control Bar */}
        <div className="p-4 flex justify-between items-center">
          <h3 className="text-white text-lg font-bold truncate">{title}</h3>
          <div className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold">
            Events: {getDetectionCountUpToCurrent()} / {detections.length}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 space-y-3">
          {/* Progress Slider */}
          <div className="flex items-center gap-3">
            <span className="text-white text-xs font-mono min-w-fit">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={Math.max(0, duration) || 0}
              value={currentTime}
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-red-500 hover:h-3 transition-all"
              style={{
                background: getProgressBarGradient()
              }}
            />
            <span className="text-white text-xs font-mono min-w-fit">{formatTime(duration)}</span>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                className="text-white hover:text-red-500 transition-colors p-2 hover:bg-white/10 rounded group"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                <span className="material-symbols-outlined text-xl">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              
              {/* Create Detection */}
              {!isPublicView && (
                <button
                  onClick={handleCreateDetection}
                  className="text-white hover:text-red-500 transition-colors p-2 hover:bg-white/10 rounded group"
                  title="Create manual detection"
                >
                  <span className="material-symbols-outlined text-xl">add</span>
                </button>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Play Gaps Only Toggle */}
              <button
                onClick={() => setPlayOnlyGapsMode(!playOnlyGapsMode)}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                  playOnlyGapsMode
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title="Toggle: Play only gaps (no detections)"
              >
                {playOnlyGapsMode ? '🟢 Gaps Only' : '⚫ All'}
              </button>

              {/* Speed Control */}
              <button
                onClick={handleToggleSpeed}
                className="px-3 py-1 text-xs font-bold rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Click to toggle playback speed"
              >
                {playbackSpeed}x
              </button>

              {/* Fullscreen */}
              <button
                onClick={handleFullscreen}
                className="text-white hover:text-red-500 transition-colors p-2 hover:bg-white/10 rounded group"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                <span className="material-symbols-outlined text-xl">
                  {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
