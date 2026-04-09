import React, { useState, useEffect } from 'react';
import DetectionCard from './DetectionCard';
import api from '../../api/axiosConfig';

const DetectionGallery = ({ 
  detections: initialDetections, 
  sortOrder = 'desc',
  selectedDetectionId,
  onDetectionSelect
}) => {
  const [detections, setDetections] = useState(initialDetections);
  const [sequenceNumbers, setSequenceNumbers] = useState({});
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  // Update local state when prop changes
  useEffect(() => {
    // Create sequence numbers based on duration_at (earliest = 1)
    const sortedByDuration = [...(initialDetections || [])].sort((a, b) => a.duration_at - b.duration_at);
    const sequences = {};
    sortedByDuration.forEach((detection, idx) => {
      sequences[detection._id] = idx + 1;
    });
    setSequenceNumbers(sequences);
    
    // Apply current sort order for display
    let sortedDetections = [...(initialDetections || [])];
    
    if (sortOrder === 'desc') {
      sortedDetections = sortedDetections.sort((a, b) => b.duration_at - a.duration_at);
    } else {
      sortedDetections = sortedDetections.sort((a, b) => a.duration_at - b.duration_at);
    }
    
    setDetections(sortedDetections);
  }, [initialDetections, sortOrder]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {detections.map((detection, idx) => (
          <DetectionCard 
            key={detection._id || idx} 
            detection={detection} 
            index={idx}
            sequenceNumber={sequenceNumbers[detection._id]}
            onClick={() => onDetectionSelect(detection._id)}
          />
        ))}
      </div>
    </div>
  );
};

export default DetectionGallery;
