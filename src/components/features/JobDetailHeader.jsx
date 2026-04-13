import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const JobDetailHeader = ({
  job,
  jobId,
  isPublicView,
  togglingPublic,
  handleTogglePublic,
  handleShare,
  showShareMenu,
  setShowShareMenu,
  onInquireClick
}) => {
  const navigate = useNavigate();

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showShareMenu && !event.target.closest('.share-menu-container')) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showShareMenu, setShowShareMenu]);

  return (
    <header className="sticky top-0 z-[100] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
      <div className="flex items-center h-16 px-6 gap-4">
        {!isPublicView && (
          <button 
            onClick={() => navigate(-1)}
            className="material-symbols-outlined text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 -ml-2 rounded-full transition-colors"
          >
            arrow_back
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">Detections</h1>
        </div>
        <div className="flex items-center gap-2">
          {isPublicView && (
            <button
              onClick={onInquireClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
              title="Request a demo and schedule installation"
            >
              <span className="text-sm">Contact Us</span>
            </button>
          )}
          {job && !isPublicView && (
            <>
              <button
                onClick={handleTogglePublic}
                disabled={togglingPublic}
                className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm font-medium transition-colors ${
                  job.isPublic
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                } ${togglingPublic ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={`Click to make ${job.isPublic ? 'private' : 'public'}`}
              >
                <span className="material-symbols-outlined text-base">
                  {job.isPublic ? 'public' : 'lock'}
                </span>
              </button>
              <div className="relative share-menu-container">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  disabled={!job.isPublic}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm font-medium transition-colors ${
                    job.isPublic
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                  title={job.isPublic ? 'Share this job' : 'Make job public to share'}
                >
                  <span className="material-symbols-outlined text-base">share</span>
                </button>
              
              {/* Share Menu */}
              {showShareMenu && job.isPublic && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 share-menu-container">
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">chat</span> WhatsApp
                  </button>
                  <button
                    onClick={() => handleShare('telegram')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">send</span> Telegram
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">language</span> Twitter/X
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">groups</span> Facebook
                  </button>
                  <button
                    onClick={() => handleShare('email')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">mail</span> Email
                  </button>
                  <button
                    onClick={() => handleShare('copy')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">content_copy</span> Copy Link
                  </button>
                </div>
              )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default JobDetailHeader;
