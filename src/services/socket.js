import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.watchPartySocket = null;
    this.isConnected = false;
    this.isWatchPartyConnected = false;
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
    this.disconnectWatchParty();
  }

  // =====================================================
  // WATCH PARTY NAMESPACE - Real-time synchronized viewing
  // =====================================================

  /**
   * Connect to the watch party namespace
   * @param {string} token - Auth token
   * @returns {Socket} Watch party socket instance
   */
  connectWatchParty(token) {
    if (this.watchPartySocket?.connected) {
      console.log('Watch party socket already connected');
      return this.watchPartySocket;
    }

    console.log('Connecting to watch party namespace...');

    this.watchPartySocket = io(`${SOCKET_URL}/watch-party`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.watchPartySocket.on('connect', () => {
      console.log('✅ Watch party socket connected');
      this.isWatchPartyConnected = true;
    });

    this.watchPartySocket.on('disconnect', (reason) => {
      console.log('❌ Watch party socket disconnected:', reason);
      this.isWatchPartyConnected = false;
    });

    this.watchPartySocket.on('connect_error', (error) => {
      console.error('Watch party socket connection error:', error.message);
    });

    return this.watchPartySocket;
  }

  /**
   * Disconnect from watch party namespace
   */
  disconnectWatchParty() {
    if (this.watchPartySocket) {
      this.watchPartySocket.disconnect();
      this.watchPartySocket = null;
      this.isWatchPartyConnected = false;
      console.log('Watch party socket disconnected');
    }
  }

  /**
   * Join a watch party room
   * @param {string} partyId - The party ID to join
   * @param {Object} userData - User data (id, username, avatar)
   */
  joinWatchParty(partyId, userData) {
    if (!this.watchPartySocket) {
      console.error('Watch party socket not connected');
      return;
    }
    this.watchPartySocket.emit('party:join', { partyId, ...userData });
  }

  /**
   * Leave a watch party room
   * @param {string} partyId - The party ID to leave
   */
  leaveWatchParty(partyId) {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.emit('party:leave', { partyId });
  }

  /**
   * Sync playback state (host only)
   * @param {string} partyId - The party ID
   * @param {Object} playbackState - { currentTime, isPlaying, playbackRate }
   */
  syncPlayback(partyId, playbackState) {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.emit('playback:sync', { partyId, ...playbackState });
  }

  /**
   * Request current playback state from host
   * @param {string} partyId - The party ID
   */
  requestPlaybackState(partyId) {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.emit('playback:request', { partyId });
  }

  /**
   * Send a chat message in watch party
   * @param {string} partyId - The party ID
   * @param {string} message - The message content
   * @param {string} messageType - 'text', 'reaction', 'system'
   */
  sendWatchPartyMessage(partyId, message, messageType = 'text') {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.emit('chat:message', { partyId, message, messageType });
  }

  /**
   * Send a reaction (emoji) in watch party
   * @param {string} partyId - The party ID
   * @param {string} reaction - The emoji reaction
   */
  sendReaction(partyId, reaction) {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.emit('reaction:send', { partyId, reaction });
  }

  /**
   * Update user status in watch party
   * @param {string} partyId - The party ID
   * @param {string} status - 'watching', 'away', 'buffering'
   */
  updateWatchPartyStatus(partyId, status) {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.emit('user:status', { partyId, status });
  }

  // Watch Party Event Listeners
  onUserJoinedParty(callback) {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.on('user:joined', callback);
  }

  offUserJoinedParty() {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.off('user:joined');
  }

  onUserLeftParty(callback) {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.on('user:left', callback);
  }

  offUserLeftParty() {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.off('user:left');
  }

  onPlaybackSync(callback) {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.on('playback:sync', callback);
  }

  offPlaybackSync() {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.off('playback:sync');
  }

  onPlaybackRequest(callback) {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.on('playback:request', callback);
  }

  offPlaybackRequest() {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.off('playback:request');
  }

  onWatchPartyMessage(callback) {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.on('chat:message', callback);
  }

  offWatchPartyMessage() {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.off('chat:message');
  }

  onReaction(callback) {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.on('reaction:received', callback);
  }

  offReaction() {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.off('reaction:received');
  }

  onUserStatusUpdate(callback) {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.on('user:status', callback);
  }

  offUserStatusUpdate() {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.off('user:status');
  }

  onPartyEnded(callback) {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.on('party:ended', callback);
  }

  offPartyEnded() {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.off('party:ended');
  }

  onPartyError(callback) {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.on('error', callback);
  }

  offPartyError() {
    if (!this.watchPartySocket) return;
    this.watchPartySocket.off('error');
  }

  getWatchPartySocket() {
    return this.watchPartySocket;
  }

  // =====================================================
  // MAIN SOCKET - Notifications, Comments, etc.
  // =====================================================

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
