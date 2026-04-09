import React, { useState, useRef, useEffect } from 'react';
import Loader from '../common/Loader';

const ImagePointMarker = ({ imageUrl, onPointsSubmit, onRefresh, isLoading = false, points: initialPoints = [] }) => {
  const [points, setPoints] = useState(initialPoints);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const imageContainerRef = useRef(null);
  const canvasRef = useRef(null);

  // Sync internal points state with initial points prop
  useEffect(() => {
    setPoints(initialPoints);
  }, [initialPoints]);

  // Draw points and lines on canvas overlay
  useEffect(() => {
    if (!canvasRef.current || !imageContainerRef.current) return;

    const canvas = canvasRef.current;
    const container = imageContainerRef.current;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw polygon outline
    if (points.length > 1) {
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)'; // purple with opacity
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(points[0].displayX, points[0].displayY);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].displayX, points[i].displayY);
      }
      // Close the polygon by drawing line back to first point
      ctx.lineTo(points[0].displayX, points[0].displayY);
      ctx.stroke();
    }

    // Draw points
    points.forEach((point) => {
      const isHovered = hoveredPoint === points.indexOf(point);
      const radius = isHovered ? 7 : 5;

      // Point filled circle
      ctx.fillStyle = isHovered ? 'rgba(139, 92, 246, 1)' : 'rgba(139, 92, 246, 0.9)'; // purple
      ctx.beginPath();
      ctx.arc(point.displayX, point.displayY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Point border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(point.displayX, point.displayY, radius, 0, Math.PI * 2);
      ctx.stroke();
    });
  }, [points, hoveredPoint]);

  const handleRefresh = () => {
    onRefresh();
  }
  const handleCanvasClick = (e) => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;

    // Calculate normalized coordinates (0-1)
    const normalizedX = displayX / rect.width;
    const normalizedY = displayY / rect.height;

    // Clamp values between 0 and 1
    const x = Math.max(0, Math.min(1, normalizedX));
    const y = Math.max(0, Math.min(1, normalizedY));

    setPoints([
      ...points,
      {
        id: Date.now(),
        x, // normalized coordinate
        y, // normalized coordinate
        displayX, // display coordinate
        displayY, // display coordinate
      },
    ]);
  };

  const handleCanvasMouseMove = (e) => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if mouse is hovering over any point
    let hovered = null;
    for (let i = 0; i < points.length; i++) {
      const distance = Math.hypot(
        mouseX - points[i].displayX,
        mouseY - points[i].displayY
      );
      if (distance < 10) {
        hovered = i;
        break;
      }
    }

    setHoveredPoint(hovered);
    canvasRef.current.style.cursor = hovered !== null ? 'pointer' : 'crosshair';
  };

  const handleSubmit = () => {
    const submittedPoints = points.map(({ x, y }) => ({ x, y }));
    onPointsSubmit(submittedPoints);
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Image Container - takes most of the space */}
      <div
        ref={imageContainerRef}
        className="relative flex-1 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700"
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Playback for point marking"
              className="w-full h-full object-contain"
              draggable={false}
            />
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={() => setHoveredPoint(null)}
              className="absolute inset-0 w-full h-full cursor-crosshair"
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500 dark:text-slate-400">Loading image...</p>
          </div>
        )}

        {/* Refresh Button - Top Right Corner */}
        <button
          onClick={handleRefresh}
          className="absolute top-3 right-3 p-2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg shadow-lg"
          title="Clear points"
        >
          <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">refresh</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={points.length === 0 || isLoading}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 rounded-lg font-semibold text-white transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader size="sm" showText={false} />
          ) : (
            <>
              <span className="material-symbols-outlined">check_circle</span>
              Confirm
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ImagePointMarker;
