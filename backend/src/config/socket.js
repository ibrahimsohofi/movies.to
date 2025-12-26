import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username;

      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.username} (${socket.userId})`);

    // Join user's personal room for targeted notifications
    socket.join(`user:${socket.userId}`);

    // Handle comment typing events
    socket.on('comment:typing:start', (data) => {
      socket.to(`movie:${data.movieId}`).emit('comment:typing', {
        userId: socket.userId,
        username: socket.username,
        movieId: data.movieId,
      });
    });

    socket.on('comment:typing:stop', (data) => {
      socket.to(`movie:${data.movieId}`).emit('comment:typing:stop', {
        userId: socket.userId,
        movieId: data.movieId,
      });
    });

    // Join movie room for real-time comments
    socket.on('join:movie', (movieId) => {
      socket.join(`movie:${movieId}`);
      console.log(`User ${socket.username} joined movie room: ${movieId}`);
    });

    // Leave movie room
    socket.on('leave:movie', (movieId) => {
      socket.leave(`movie:${movieId}`);
      console.log(`User ${socket.username} left movie room: ${movieId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.username} (${socket.userId})`);
    });
  });

  console.log('Socket.IO initialized successfully');
  return io;
};

// Helper functions to emit events from other parts of the app
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Emit notification to specific user
export const emitNotification = (userId, notification) => {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification:new', notification);
};

// Emit new comment to all users in movie room
export const emitNewComment = (movieId, comment) => {
  if (!io) return;
  io.to(`movie:${movieId}`).emit('comment:new', comment);
};

// Emit new follower notification
export const emitNewFollower = (userId, followerData) => {
  if (!io) return;
  io.to(`user:${userId}`).emit('follower:new', followerData);
};

// Emit list like notification
export const emitListLike = (userId, likeData) => {
  if (!io) return;
  io.to(`user:${userId}`).emit('list:like', likeData);
};
