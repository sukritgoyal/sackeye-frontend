import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const CameraList = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cameraStatus, setCameraStatus] = useState({});
  const navigate = useNavigate();

  // 1. Fetch Cameras from API
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const res = await api.get('/api/cameras');
        console.log("Fetched cameras:", res.data);
        setCameras(res.data);
        
        // Fetch status for each camera
        res.data.forEach(cam => {
          fetchCameraStatus(cam._id);
        });
      } catch (err) {
        console.error("Failed to fetch cameras", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCameras();
  }, []);

  // Fetch camera status
  const fetchCameraStatus = async (cameraId) => {
    try {
      const res = await api.get(`/api/cameras/${cameraId}/status`);
      setCameraStatus(prev => ({
        ...prev,
        [cameraId]: res.data
      }));
    } catch (err) {
      console.error(`Failed to fetch status for camera ${cameraId}`, err);
      setCameraStatus(prev => ({
        ...prev,
        [cameraId]: { status: 'error' }
      }));
    }
  };

  // Get dot color based on status
  const getStatusColor = (camId) => {
    const status = cameraStatus[camId];
    if (!status) return 'bg-slate-300'; // grey while loading
    if (status.status === 'online') return 'bg-emerald-500'; // green
    if (status.status === 'offline') return 'bg-red-500'; // red
    return 'bg-slate-300'; // grey for error
  };

  // Get status text
  const getStatusText = (camId) => {
    const status = cameraStatus[camId];
    if (!status) return null;
    if (status.status === 'offline' && status.minutesAgo !== undefined) {
      if (status.minutesAgo < 60) {
        return `Last: ${Math.round(status.minutesAgo)}m ago`;
      } else {
        const hours = Math.round(status.minutesAgo / 60);
        return `Last: ${hours}h ago`;
      }
    }
    return null;
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
      
      {/* Header */}
      <header className="sticky top-0 z-[100] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
        <div className="flex items-center h-16 justify-between px-6">
          <h1 className="tracking-tight text-3xl font-bold leading-tight">Your Cameras</h1>
          <button 
            onClick={() => navigate('/profile')}
            className="flex items-center justify-center rounded-xl h-12 w-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Profile"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      <main className="flex-1">
        {/* List of Cameras */}
        <section className="p-6 space-y-4">
          <h3 className="text-lg font-bold leading-tight tracking-tight mb-4">Connected Devices</h3>
          
          {loading ? (
            <div className="text-center py-10 text-slate-400">Loading your devices...</div>
          ) : cameras.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
              No cameras found. Add your first one above.
            </div>
          ) : (
            cameras.map((cam) => (
              <div 
                key={cam._id}
                onClick={() => navigate(`/history/${cam._id}`)}
                className="group flex items-center justify-between gap-4 rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-200/60 hover:border-primary/30 transition-all cursor-pointer active:bg-slate-50"
              >
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${getStatusColor(cam._id)}`}></span>
                    <p className="text-base font-bold leading-tight">{cam.name}</p>
                  </div>
                  <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">
                    {cam.ip_address}:{cam.port}
                  </p>
                  {getStatusText(cam._id) && (
                    <p className="text-red-500 text-xs font-medium mt-1">
                      {getStatusText(cam._id)}
                    </p>
                  )}
                </div>
                <div className="w-20 h-14 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-700">
                  <span className="material-symbols-outlined text-slate-300">videocam</span>
                </div>
              </div>
            ))
          )}
        </section>
      </main>



      {/* Basic Add Modal (Simplified for now) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-t-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">New Camera</h2>
              <button onClick={() => setShowModal(false)} className="material-symbols-outlined text-slate-400">close</button>
            </div>
            <div className="space-y-4">
              <input placeholder="Camera Name" className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-primary" />
              <input placeholder="IP Address" className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-primary" />
              <button className="w-full h-12 bg-primary text-white font-bold rounded-xl mt-4">Save Camera</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraList;