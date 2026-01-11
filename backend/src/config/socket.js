import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import watchPartyService from '../services/watchPartyService.js';

let io;
let watchPartyNamespace;

// Store active watch party rooms
const activeParties = new Map();

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket authentication middleware
  const authMiddleware = (socket, next) => {
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
  };

  // Apply auth middleware to main namespace
  io.use(authMiddleware);

  // Main namespace connection handler
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

  // =====================================================
  // WATCH PARTY NAMESPACE - Real-time synchronized viewing
  // =====================================================
  watchPartyNamespace = io.of('/watch-party');

  // Apply auth middleware to watch party namespace
  watchPartyNamespace.use(authMiddleware);

  watchPartyNamespace.on('connection', (socket) => {
    console.log(`[Watch Party] User connected: ${socket.username} (${socket.userId})`);

    // Join a watch party
    socket.on('party:join', async (data) => {
      const { partyId, userId, username, avatar } = data;
      const roomName = `party:${partyId}`;

      try {
        // Join the socket room
        socket.join(roomName);
        socket.partyId = partyId;

        // Track user in active parties
        if (!activeParties.has(partyId)) {
          activeParties.set(partyId, new Map());
        }
        activeParties.get(partyId).set(socket.userId, {
          socketId: socket.id,
          username: socket.username,
          avatar,
          status: 'watching',
          joinedAt: new Date(),
        });

        // Notify others in the party
        socket.to(roomName).emit('user:joined', {
          userId: socket.userId,
          username: socket.username,
          avatar,
          participantCount: activeParties.get(partyId).size,
        });

        // Send current participants to the joining user
        const participants = Array.from(activeParties.get(partyId).entries()).map(
          ([id, user]) => ({ id, ...user })
        );
        socket.emit('party:participants', { participants });

        console.log(`[Watch Party] ${socket.username} joined party ${partyId}`);
      } catch (error) {
        console.error('[Watch Party] Error joining party:', error);
        socket.emit('error', { message: 'Failed to join party' });
      }
    });

    // Leave a watch party
    socket.on('party:leave', (data) => {
      const { partyId } = data;
      const roomName = `party:${partyId}`;

      handleLeaveParty(socket, partyId, roomName);
    });

    // Sync playback state (host broadcasts to all participants)
    socket.on('playback:sync', (data) => {
      const { partyId, currentTime, isPlaying, playbackRate = 1 } = data;
      const roomName = `party:${partyId}`;

      // Broadcast to all other participants
      socket.to(roomName).emit('playback:sync', {
        currentTime,
        isPlaying,
        playbackRate,
        syncedBy: socket.userId,
        syncedAt: Date.now(),
      });

      console.log(`[Watch Party] Playback sync in party ${partyId}: time=${currentTime}, playing=${isPlaying}`);
    });

    // Request playback state from host
    socket.on('playback:request', (data) => {
      const { partyId } = data;
      const roomName = `party:${partyId}`;

      // Request goes to the host
      socket.to(roomName).emit('playback:request', {
        requestedBy: socket.userId,
        username: socket.username,
      });
    });

    // Chat message in watch party
    socket.on('chat:message', async (data) => {
      const { partyId, message, messageType = 'text' } = data;
      const roomName = `party:${partyId}`;

      const chatMessage = {
        id: `${Date.now()}-${socket.userId}`,
        userId: socket.userId,
        username: socket.username,
        message,
        messageType,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to all participants including sender
      watchPartyNamespace.to(roomName).emit('chat:message', chatMessage);

      // Optionally save to database
      try {
        await watchPartyService.sendMessage(partyId, socket.userId, message, messageType);
      } catch (error) {
        console.error('[Watch Party] Error saving message:', error);
      }
    });

    // Reaction (emoji) in watch party
    socket.on('reaction:send', (data) => {
      const { partyId, reaction } = data;
      const roomName = `party:${partyId}`;

      // Broadcast reaction to all participants
      watchPartyNamespace.to(roomName).emit('reaction:received', {
        userId: socket.userId,
        username: socket.username,
        reaction,
        timestamp: Date.now(),
      });
    });

    // Update user status (watching, away, buffering)
    socket.on('user:status', (data) => {
      const { partyId, status } = data;
      const roomName = `party:${partyId}`;

      // Update in active parties
      if (activeParties.has(partyId) && activeParties.get(partyId).has(socket.userId)) {
        activeParties.get(partyId).get(socket.userId).status = status;
      }

      // Broadcast status update
      socket.to(roomName).emit('user:status', {
        userId: socket.userId,
        username: socket.username,
        status,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[Watch Party] User disconnected: ${socket.username} (${socket.userId})`);

      if (socket.partyId) {
        const roomName = `party:${socket.partyId}`;
        handleLeaveParty(socket, socket.partyId, roomName);
      }
    });
  });

  // Helper function to handle leaving a party
  function handleLeaveParty(socket, partyId, roomName) {
    socket.leave(roomName);

    // Remove from active parties
    if (activeParties.has(partyId)) {
      activeParties.get(partyId).delete(socket.userId);

      const remainingCount = activeParties.get(partyId).size;

      // Notify others
      socket.to(roomName).emit('user:left', {
        userId: socket.userId,
        username: socket.username,
        participantCount: remainingCount,
      });

      // Clean up empty parties
      if (remainingCount === 0) {
        activeParties.delete(partyId);
        console.log(`[Watch Party] Party ${partyId} is now empty, cleaned up`);
      }
    }

    console.log(`[Watch Party] ${socket.username} left party ${partyId}`);
  }

  console.log('Socket.IO initialized successfully with Watch Party namespace');
  return io;
};

// Helper functions to emit events from other parts of the app
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export const getWatchPartyNamespace = () => {
  if (!watchPartyNamespace) {
    throw new Error('Watch Party namespace not initialized');
  }
  return watchPartyNamespace;
};

// Emit notification to specific user
export const emitNotification = (userId, notification) => {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification:new', notification);
};

// Emit event to a specific room
export const emitToRoom = (room, event, data) => {
  if (!io) return;
  io.to(room).emit(event, data);
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

// Watch Party specific emitters
export const emitPartyEnded = (partyId, reason = 'host_ended') => {
  if (!watchPartyNamespace) return;
  watchPartyNamespace.to(`party:${partyId}`).emit('party:ended', { reason });

  // Clean up active party
  if (activeParties.has(partyId)) {
    activeParties.delete(partyId);
  }
};

export const emitPartyUpdate = (partyId, updateData) => {
  if (!watchPartyNamespace) return;
  watchPartyNamespace.to(`party:${partyId}`).emit('party:update', updateData);
};

export const getActivePartyParticipants = (partyId) => {
  if (!activeParties.has(partyId)) return [];
  return Array.from(activeParties.get(partyId).entries()).map(
    ([id, user]) => ({ id, ...user })
  );
};
