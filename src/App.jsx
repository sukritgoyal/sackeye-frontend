import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CameraList from './pages/CameraList';
import History from './pages/History';
import LiveMonitor from './pages/LiveMonitor';
import JobDetail from './pages/JobDetail';

function App() {
  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  const defaultRoute = isAuthenticated() ? '/cameras' : '/login';

  return (
    
    <Router>
      <Routes>
        {/* Default Route: Shows Login Page or Cameras based on auth */}
        <Route path="/login" element={<Login />} />

        {/* Camera Management Routes */}
        <Route path="/cameras" element={<CameraList />} />
        <Route path="/history/:cameraId" element={<History />} />
        <Route path="/live/:cameraId" element={<LiveMonitor />} />
        <Route path="/job/:jobId" element={<JobDetail />} />

        {/* Redirect any unknown path or root to appropriate default route */}
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </Router>
  );
}

export default App;