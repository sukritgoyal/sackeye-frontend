import React, { useState, useEffect } from 'react';
import Loader from '../common/Loader';
import AlertDialog from '../common/AlertDialog';
import ImagePointMarker from './ImagePointMarker';

const PlaybackModal = ({ isOpen, onClose, onSubmitMarkPoints, onSubmitPlayback, isLoading, imageUrl = '' }) => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [showDurationAlert, setShowDurationAlert] = useState(false);
  const [showPointMarker, setShowPointMarker] = useState(false);
  const [points, setPoints] = useState([]);
  const [strict, setStrict] = useState(false);

  // Check duration when times change
  useEffect(() => {
    if (startTime && endTime && startTime < endTime) {
      const [startHours, startMins] = startTime.split(':').map(Number);
      const [endHours, endMins] = endTime.split(':').map(Number);
      const startTotalMins = startHours * 60 + startMins;
      const endTotalMins = endHours * 60 + endMins;
      const durationMins = endTotalMins - startTotalMins;

      if (durationMins > 60) {
        setShowDurationAlert(true);
      } else {
        setShowDurationAlert(false);
      }
    }
  }, [startTime, endTime, date]);

  const handleMarkPoints = () => {
    setError('');

    if (!date || !startTime || !endTime) {
      setError('Please fill in all fields');
      return;
    }

    if (startTime >= endTime) {
      setError('Start time must be before end time');
      return;
    }

    // Clear previous points and open point marker
    setPoints([]);
    setShowPointMarker(true);

    // Call the generate playback function to get the image
    onSubmitMarkPoints(date, startTime, endTime);
  };

  const handleFinalSubmit = () => {
    setError('');

    if (!date || !startTime || !endTime) {
      setError('Please fill in all fields');
      return;
    }

    if (startTime >= endTime) {
      setError('Start time must be before end time');
      return;
    }

    // Submit with marked points (or empty array if no points marked) and strict flag
    onSubmitPlayback(date, startTime, endTime, points, strict);
  };

  const handlePointsSubmit = (markedPoints) => {
    // Set the marked points and close the point marker
    setPoints(markedPoints);
    setShowPointMarker(false);
  };

  const handleBackFromPointMarker = () => {
    // Close the point marker modal
    setShowPointMarker(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setDate('');
      setStartTime('');
      setEndTime('');
      setError('');
      setShowDurationAlert(false);
      setShowPointMarker(false);
      setPoints([]);
      setStrict(false);
      setIsClosing(false);
      onClose();
    }, 300);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex items-end transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`w-full bg-black/50 backdrop-blur-sm absolute inset-0 cursor-pointer`} onClick={handleClose}></div>
      
      <div className={`w-full bg-white dark:bg-slate-900 rounded-t-3xl p-6 relative transition-transform duration-300 ${isClosing ? 'translate-y-full' : 'translate-y-0'} max-h-[90vh] overflow-y-auto flex flex-col`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {showPointMarker && (
              <button
                onClick={handleBackFromPointMarker}
                disabled={isLoading}
                className="material-symbols-outlined text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors disabled:opacity-50"
                title="Back"
              >
                arrow_back
              </button>
            )}
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {showPointMarker ? 'Mark Detection Points' : 'Playback Recording'}
            </h2>
          </div>
        </div>

        {/* Content */}
        {!showPointMarker ? (
          // Time Input Stage
          <div className="space-y-4 mb-6">
          {/* Date Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Time Interval */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Toggle and Draw Button Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Strict
              </label>
              <button
                onClick={() => setStrict(!strict)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  strict
                    ? 'bg-blue-600'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
                title="Toggle strict mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    strict ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={handleMarkPoints}
              disabled={isLoading}
              className="material-symbols-outlined text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors disabled:opacity-50"
              title="Mark detection points (optional)"
            >
              draw
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}
          </div>
        ) : (
          // Point Marking Stage
          <div className="flex-1 flex flex-col mb-6">
            <ImagePointMarker
              imageUrl={imageUrl}
              onPointsSubmit={handlePointsSubmit}
              isLoading={isLoading}
              points={points}
              onRefresh={handleMarkPoints}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!showPointMarker ? (
            <>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 rounded-xl font-semibold text-white transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader size="sm" showText={false} />
                ) : (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    Submit
                  </>
                )}
              </button>
            </>
          ) : null}
        </div>

        {/* Duration Alert */}
        <AlertDialog
          isOpen={showDurationAlert}
          onClose={() => {
            setShowDurationAlert(false);
            setStartTime('');
            setEndTime('');
          }}
          onConfirm={() => {
            setShowDurationAlert(false);
          }}
          title="Long Recording Duration"
          message="The selected time range is longer than 1 hour. This may take a while to process. Do you want to continue?"
          cancelText="Cancel"
          confirmText="Confirm"
          isLoading={isLoading}
          icon="warning"
          variant="amber"
        />
      </div>
    </div>
  );
};

export default PlaybackModal;
