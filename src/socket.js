import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling'],
  upgrade: true,
  rememberUpgrade: true,
  withCredentials: true,
  path: '/socket.io/',
});

socket.on('connect', () => {
  console.log('[Socket] Connected to server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('[Socket] Disconnected from server');
});

socket.on('error', (error) => {
  console.error('[Socket] Error:', error);
});

socket.on('connect_error', (error) => {
  console.error('[Socket] Connection Error:', error);
});

export default socket;
