import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    console.log('Connecting to WebSocket server...', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket disconnected');
    }
  }

  // Notification events
  onNotification(callback) {
    if (!this.socket) return;
    this.socket.on('notification:new', callback);
  }

  offNotification() {
    if (!this.socket) return;
    this.socket.off('notification:new');
  }

  // Comment events
  onNewComment(callback) {
    if (!this.socket) return;
    this.socket.on('comment:new', callback);
  }

  offNewComment() {
    if (!this.socket) return;
    this.socket.off('comment:new');
  }

  onCommentTyping(callback) {
    if (!this.socket) return;
    this.socket.on('comment:typing', callback);
  }

  offCommentTyping() {
    if (!this.socket) return;
    this.socket.off('comment:typing');
  }

  onCommentTypingStop(callback) {
    if (!this.socket) return;
    this.socket.on('comment:typing:stop', callback);
  }

  offCommentTypingStop() {
    if (!this.socket) return;
    this.socket.off('comment:typing:stop');
  }

  // Emit typing events
  emitTypingStart(movieId) {
    if (!this.socket) return;
    this.socket.emit('comment:typing:start', { movieId });
  }

  emitTypingStop(movieId) {
    if (!this.socket) return;
    this.socket.emit('comment:typing:stop', { movieId });
  }

  // Join/leave movie rooms
  joinMovieRoom(movieId) {
    if (!this.socket) return;
    this.socket.emit('join:movie', movieId);
  }

  leaveMovieRoom(movieId) {
    if (!this.socket) return;
    this.socket.emit('leave:movie', movieId);
  }

  // Follower events
  onNewFollower(callback) {
    if (!this.socket) return;
    this.socket.on('follower:new', callback);
  }

  offNewFollower() {
    if (!this.socket) return;
    this.socket.off('follower:new');
  }

  // List events
  onListLike(callback) {
    if (!this.socket) return;
    this.socket.on('list:like', callback);
  }

  offListLike() {
    if (!this.socket) return;
    this.socket.off('list:like');
  }

  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
