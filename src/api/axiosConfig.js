import axios from 'axios';

// Create an instance with your backend URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('[Axios Request] URL:', config.url);
    console.log('[Axios Request] Token from localStorage:', token ? 'EXISTS' : 'UNDEFINED');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[Axios Request] Authorization header set:', config.headers.Authorization);
    } else {
      console.log('[Axios Request] WARNING: No token found in localStorage');
    }
    console.log('[Axios Request] All headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('[Axios Request Error]:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    console.log('[Axios Response] Status:', response.status, 'URL:', response.config.url);
    return response;
  },
  (error) => {
    console.error('[Axios Response Error] Status:', error.response?.status);
    console.error('[Axios Response Error] Message:', error.response?.data?.msg || error.message);
    console.error('[Axios Response Error] URL:', error.config?.url);
    if (error.response && error.response.status === 401) {
      console.log('[Axios Response] 401 Detected - Removing token and redirecting to login');
      // If token is expired or invalid, boot user to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
