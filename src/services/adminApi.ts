// Admin API Service
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface User {
  id: string;
  email: string;
  username?: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  lastLogin?: string;
  stats?: {
    reviews: number;
    comments: number;
    watchlistItems: number;
  };
}

export interface Review {
  id: string;
  userId: string;
  movieId: number;
  movieTitle: string;
  rating: number;
  content: string;
  status: 'pending' | 'approved' | 'flagged' | 'removed';
  createdAt: string;
  flags?: number;
  flagReasons?: string[];
}

export interface Comment {
  id: string;
  userId: string;
  movieId: number;
  movieTitle: string;
  content: string;
  status: 'pending' | 'approved' | 'flagged' | 'removed';
  createdAt: string;
  flags?: number;
  flagReasons?: string[];
}

export interface FeaturedMovie {
  id: string;
  movieId: number;
  title: string;
  position: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: string;
  activeUsers: number;
  apiCalls: number;
  errors: number;
  database: {
    status: 'connected' | 'disconnected';
    queryTime: number;
    activeConnections: number;
  };
  server: {
    responseTime: number;
    memory: number;
    cpu: number;
  };
}

// ==================== USER MANAGEMENT ====================

export const adminApi = {
  // Get all users with pagination
  async getUsers(page = 1, limit = 20, status?: string) {
    try {
      const response = await api.get('/admin/users', {
        params: { page, limit, status },
      });
      return response.data;
    } catch (error) {
      // Fallback to mock data if backend not available
      return getMockUsers();
    }
  },

  // Get user by ID
  async getUserById(userId: string) {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  },

  // Update user
  async updateUser(userId: string, updates: Partial<User>) {
    try {
      const response = await api.patch(`/admin/users/${userId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  },

  // Ban user
  async banUser(userId: string, reason: string) {
    try {
      const response = await api.post(`/admin/users/${userId}/ban`, { reason });
      return response.data;
    } catch (error) {
      console.error('Failed to ban user:', error);
      throw error;
    }
  },

  // Unban user
  async unbanUser(userId: string) {
    try {
      const response = await api.post(`/admin/users/${userId}/unban`);
      return response.data;
    } catch (error) {
      console.error('Failed to unban user:', error);
      throw error;
    }
  },

  // Suspend user
  async suspendUser(userId: string, reason: string, duration: number) {
    try {
      const response = await api.post(`/admin/users/${userId}/suspend`, {
        reason,
        duration,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to suspend user:', error);
      throw error;
    }
  },

  // Unsuspend user
  async unsuspendUser(userId: string) {
    try {
      const response = await api.post(`/admin/users/${userId}/unsuspend`);
      return response.data;
    } catch (error) {
      console.error('Failed to unsuspend user:', error);
      throw error;
    }
  },

  // Delete user
  async deleteUser(userId: string) {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  },

  // ==================== CONTENT MODERATION ====================

  // Get reviews for moderation
  async getReviewsForModeration(status?: string, page = 1, limit = 20) {
    try {
      const response = await api.get('/admin/reviews', {
        params: { status, page, limit },
      });
      return response.data;
    } catch (error) {
      return getMockReviews();
    }
  },

  // Approve review
  async approveReview(reviewId: string) {
    try {
      const response = await api.post(`/admin/reviews/${reviewId}/approve`);
      return response.data;
    } catch (error) {
      console.error('Failed to approve review:', error);
      throw error;
    }
  },

  // Remove review
  async removeReview(reviewId: string, reason: string) {
    try {
      const response = await api.post(`/admin/reviews/${reviewId}/remove`, {
        reason,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to remove review:', error);
      throw error;
    }
  },

  // Get comments for moderation
  async getCommentsForModeration(status?: string, page = 1, limit = 20) {
    try {
      const response = await api.get('/admin/comments', {
        params: { status, page, limit },
      });
      return response.data;
    } catch (error) {
      return getMockComments();
    }
  },

  // Approve comment
  async approveComment(commentId: string) {
    try {
      const response = await api.post(`/admin/comments/${commentId}/approve`);
      return response.data;
    } catch (error) {
      console.error('Failed to approve comment:', error);
      throw error;
    }
  },

  // Remove comment
  async removeComment(commentId: string, reason: string) {
    try {
      const response = await api.post(`/admin/comments/${commentId}/remove`, {
        reason,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to remove comment:', error);
      throw error;
    }
  },

  // Warn user
  async warnUser(userId: string, reason: string) {
    try {
      const response = await api.post(`/admin/users/${userId}/warn`, { reason });
      return response.data;
    } catch (error) {
      console.error('Failed to warn user:', error);
      throw error;
    }
  },

  // ==================== FEATURED MOVIES ====================

  // Get featured movies
  async getFeaturedMovies() {
    try {
      const response = await api.get('/admin/featured-movies');
      return response.data;
    } catch (error) {
      return getMockFeaturedMovies();
    }
  },

  // Add featured movie
  async addFeaturedMovie(movieId: number, position: number, startDate: string, endDate?: string) {
    try {
      const response = await api.post('/admin/featured-movies', {
        movieId,
        position,
        startDate,
        endDate,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to add featured movie:', error);
      throw error;
    }
  },

  // Update featured movie
  async updateFeaturedMovie(id: string, updates: Partial<FeaturedMovie>) {
    try {
      const response = await api.patch(`/admin/featured-movies/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update featured movie:', error);
      throw error;
    }
  },

  // Remove featured movie
  async removeFeaturedMovie(id: string) {
    try {
      const response = await api.delete(`/admin/featured-movies/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to remove featured movie:', error);
      throw error;
    }
  },

  // ==================== SYSTEM HEALTH ====================

  // Get system health
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await api.get('/admin/health');
      return response.data;
    } catch (error) {
      return getMockSystemHealth();
    }
  },

  // Get error logs
  async getErrorLogs(limit = 50) {
    try {
      const response = await api.get('/admin/logs/errors', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      return [];
    }
  },

  // ==================== BULK ACTIONS ====================

  // Bulk delete reviews
  async bulkDeleteReviews(reviewIds: string[]) {
    try {
      const response = await api.post('/admin/reviews/bulk-delete', {
        reviewIds,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to bulk delete reviews:', error);
      throw error;
    }
  },

  // Bulk delete comments
  async bulkDeleteComments(commentIds: string[]) {
    try {
      const response = await api.post('/admin/comments/bulk-delete', {
        commentIds,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to bulk delete comments:', error);
      throw error;
    }
  },

  // Bulk ban users
  async bulkBanUsers(userIds: string[], reason: string) {
    try {
      const response = await api.post('/admin/users/bulk-ban', {
        userIds,
        reason,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to bulk ban users:', error);
      throw error;
    }
  },
};

// ==================== MOCK DATA (Fallback) ====================

function getMockUsers(): { users: User[]; total: number } {
  return {
    users: [
      {
        id: '1',
        email: 'john.doe@example.com',
        username: 'johndoe',
        role: 'user',
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        lastLogin: '2025-12-13T10:00:00Z',
        stats: {
          reviews: 15,
          comments: 42,
          watchlistItems: 28,
        },
      },
      {
        id: '2',
        email: 'jane.smith@example.com',
        username: 'janesmith',
        role: 'user',
        status: 'suspended',
        createdAt: '2024-12-01T00:00:00Z',
        lastLogin: '2025-12-10T15:30:00Z',
        stats: {
          reviews: 5,
          comments: 12,
          watchlistItems: 10,
        },
      },
      {
        id: '3',
        email: 'admin@movies.to',
        username: 'admin',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2025-12-13T12:00:00Z',
        stats: {
          reviews: 0,
          comments: 0,
          watchlistItems: 0,
        },
      },
    ],
    total: 3,
  };
}

function getMockReviews(): { reviews: Review[]; total: number } {
  return {
    reviews: [
      {
        id: '1',
        userId: '1',
        movieId: 155,
        movieTitle: 'The Dark Knight',
        rating: 2,
        content: 'This movie was absolutely terrible...',
        status: 'flagged',
        createdAt: '2025-12-12T10:00:00Z',
        flags: 3,
        flagReasons: ['spam', 'inappropriate'],
      },
      {
        id: '2',
        userId: '2',
        movieId: 27205,
        movieTitle: 'Inception',
        rating: 9,
        content: 'Great movie! Loved the plot twists.',
        status: 'pending',
        createdAt: '2025-12-13T08:00:00Z',
        flags: 0,
      },
    ],
    total: 2,
  };
}

function getMockComments(): { comments: Comment[]; total: number } {
  return {
    comments: [
      {
        id: '1',
        userId: '1',
        movieId: 155,
        movieTitle: 'The Dark Knight',
        content: 'This is a test comment',
        status: 'approved',
        createdAt: '2025-12-12T10:00:00Z',
        flags: 0,
      },
    ],
    total: 1,
  };
}

function getMockFeaturedMovies(): FeaturedMovie[] {
  return [
    {
      id: '1',
      movieId: 155,
      title: 'The Dark Knight',
      position: 1,
      isActive: true,
      startDate: '2025-01-01T00:00:00Z',
      createdAt: '2025-01-01T00:00:00Z',
    },
  ];
}

function getMockSystemHealth(): SystemHealth {
  return {
    status: 'healthy',
    uptime: '99.8%',
    activeUsers: 1247,
    apiCalls: 45632,
    errors: 12,
    database: {
      status: 'connected',
      queryTime: 12,
      activeConnections: 23,
    },
    server: {
      responseTime: 42,
      memory: 65.5,
      cpu: 23.4,
    },
  };
}

export default adminApi;
