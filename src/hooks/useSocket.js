import { useEffect, useState } from 'react';
import socketService from '../services/socket';
import { useAuthStore } from '../store/useStore';

/**
 * Custom hook for Socket.IO real-time features
 * @returns {Object} Socket service instance and connection status
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Only connect if user is logged in
    if (user?.token) {
      const socket = socketService.connect(user.token);

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      // Set initial state
      setIsConnected(socket.connected);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    } else {
      // Disconnect if user logs out
      socketService.disconnect();
      setIsConnected(false);
    }
  }, [user?.token]);

  return {
    socket: socketService,
    isConnected,
  };
}

/**
 * Hook for listening to real-time notifications
 * @param {Function} callback - Function to call when notification received
 */
export function useNotifications(callback) {
  const { socket } = useSocket();

  useEffect(() => {
    if (callback) {
      socket.onNotification(callback);
      return () => socket.offNotification();
    }
  }, [socket, callback]);
}

/**
 * Hook for movie comments real-time features
 * @param {number} movieId - Movie ID to join room for
 * @param {Object} callbacks - Object with onNewComment, onTyping, onTypingStop callbacks
 */
export function useMovieComments(movieId, callbacks = {}) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!movieId || !isConnected) return;

    // Join movie room
    socket.joinMovieRoom(movieId);

    // Setup event listeners
    if (callbacks.onNewComment) {
      socket.onNewComment(callbacks.onNewComment);
    }

    if (callbacks.onTyping) {
      socket.onCommentTyping(callbacks.onTyping);
    }

    if (callbacks.onTypingStop) {
      socket.onCommentTypingStop(callbacks.onTypingStop);
    }

    // Cleanup
    return () => {
      socket.leaveMovieRoom(movieId);
      socket.offNewComment();
      socket.offCommentTyping();
      socket.offCommentTypingStop();
    };
  }, [movieId, isConnected, socket, callbacks.onNewComment, callbacks.onTyping, callbacks.onTypingStop]);

  return {
    emitTypingStart: () => socket.emitTypingStart(movieId),
    emitTypingStop: () => socket.emitTypingStop(movieId),
  };
}

/**
 * Hook for follower notifications
 * @param {Function} callback - Function to call when someone follows you
 */
export function useFollowerNotifications(callback) {
  const { socket } = useSocket();

  useEffect(() => {
    if (callback) {
      socket.onNewFollower(callback);
      return () => socket.offNewFollower();
    }
  }, [socket, callback]);
}

/**
 * Hook for list like notifications
 * @param {Function} callback - Function to call when someone likes your list
 */
export function useListLikeNotifications(callback) {
  const { socket } = useSocket();

  useEffect(() => {
    if (callback) {
      socket.onListLike(callback);
      return () => socket.offListLike();
    }
  }, [socket, callback]);
}
