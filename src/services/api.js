import axios from 'axios';
import { toast } from 'sonner';
import i18n from '@/i18n/config';

// Check if backend is enabled (production may not have backend deployed)
export const isBackendEnabled = () => {
  // Backend is now enabled and configured for full authentication
  return true;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Create axios instance with defaults
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip toasts for backend-only API calls (backend may not be running in production)
    // These features gracefully degrade when backend is unavailable
    const backendOnlyEndpoints = ['/torrents', '/sync', '/quiz', '/notifications',
                                   '/lists', '/recommendations', '/activities',
                                   '/reviews', '/comments', '/follows'];
    const skipToast = backendOnlyEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));

    // Network error (no response)
    if (!error.response) {
      if (!skipToast) {
        toast.error(i18n.t('errors.networkErrorDesc'));
      }
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        if (!skipToast) {
          toast.error(data?.message || i18n.t('errors.badRequest', 'Bad request. Please check your input.'));
        }
        break;

      case 401:
        // Unauthorized - clear auth and redirect to login
        if (!originalRequest._retry && !skipToast) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          toast.error(i18n.t('errors.sessionExpired', 'Session expired. Please login again.'));
          // Optionally redirect to login
          if (window.location.pathname !== '/login') {
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          }
        }
        break;

      case 403:
        if (!skipToast) {
          toast.error(i18n.t('errors.accessDenied', 'Access denied. You don\'t have permission to perform this action.'));
        }
        break;

      case 404:
        // Don't show toast for 404s, let components handle it
        console.log('Resource not found:', originalRequest.url);
        break;

      case 409:
        if (!skipToast) {
          toast.error(data?.message || i18n.t('errors.conflict', 'Conflict. Resource already exists.'));
        }
        break;

      case 422:
        if (!skipToast) {
          toast.error(data?.message || i18n.t('errors.validationError', 'Validation error. Please check your input.'));
        }
        break;

      case 429:
        if (!skipToast) {
          toast.error(i18n.t('errors.tooManyRequests', 'Too many requests. Please slow down and try again later.'));
        }
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Retry logic for server errors
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

          if (originalRequest._retryCount <= 2) {
            // Wait before retrying (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, originalRequest._retryCount - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));

            try {
              return apiClient(originalRequest);
            } catch (retryError) {
              // If retry fails, show error
              if (originalRequest._retryCount >= 2 && !skipToast) {
                toast.error(i18n.t('errors.serverErrorDesc'));
              }
              return Promise.reject(retryError);
            }
          }
        }
        if (!skipToast) {
          toast.error(i18n.t('errors.serverErrorDesc'));
        }
        break;

      default:
        if (!skipToast) {
          toast.error(data?.message || i18n.t('errors.unexpectedError'));
        }
    }

    return Promise.reject(error);
  }
);

// Helper function for API calls with additional error handling
const apiCall = async (apiFunction, options = {}) => {
  const { showSuccessToast = false, successMessage = '', showErrorToast = true } = options;

  try {
    const response = await apiFunction();
    if (showSuccessToast && successMessage) {
      toast.success(successMessage);
    }
    return response.data;
  } catch (error) {
    if (showErrorToast && error.response?.data?.message) {
      toast.error(error.response.data.message);
    }
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Register new user
  register: (userData) =>
    apiCall(
      () => apiClient.post('/auth/register', userData),
      { showSuccessToast: true, successMessage: 'Account created successfully!' }
    ),

  // Login user
  login: (credentials) =>
    apiCall(
      () => apiClient.post('/auth/login', credentials),
      { showSuccessToast: true, successMessage: 'Welcome back!' }
    ),

  // Logout user
  logout: () =>
    apiCall(
      () => apiClient.post('/auth/logout'),
      { showSuccessToast: true, successMessage: 'Logged out successfully' }
    ),

  // Get current user
  me: () => apiCall(() => apiClient.get('/auth/me')),

  // Request password reset
  forgotPassword: (email) =>
    apiCall(
      () => apiClient.post('/auth/forgot-password', { email }),
      { showSuccessToast: true, successMessage: 'Password reset link sent to your email' }
    ),

  // Reset password with token
  resetPassword: (token, newPassword) =>
    apiCall(
      () => apiClient.post('/auth/reset-password', { token, newPassword }),
      { showSuccessToast: true, successMessage: 'Password reset successful!' }
    ),

  // Verify email
  verifyEmail: (token) =>
    apiCall(
      () => apiClient.post('/auth/verify-email', { token }),
      { showSuccessToast: true, successMessage: 'Email verified successfully!' }
    ),

  // Update user profile
  updateProfile: (userData) =>
    apiCall(
      () => apiClient.put('/auth/profile', userData),
      { showSuccessToast: true, successMessage: 'Profile updated successfully!' }
    ),

  // Change password
  changePassword: (passwordData) =>
    apiCall(
      () => apiClient.put('/auth/change-password', passwordData),
      { showSuccessToast: true, successMessage: 'Password changed successfully!' }
    ),

  // Delete account
  deleteAccount: () =>
    apiCall(
      () => apiClient.delete('/auth/account'),
      { showSuccessToast: true, successMessage: 'Account deleted successfully' }
    ),

  // Resend verification email
  resendVerification: () =>
    apiCall(
      () => apiClient.post('/auth/resend-verification'),
      { showSuccessToast: true, successMessage: 'Verification email sent!' }
    ),
};

// Watchlist API
export const watchlistAPI = {
  // Get user's watchlist
  getWatchlist: () => apiCall(() => apiClient.get('/watchlist')),

  // Add movie to watchlist
  addToWatchlist: (movieData) =>
    apiCall(
      () => apiClient.post('/watchlist', movieData),
      { showSuccessToast: true, successMessage: 'Added to watchlist!' }
    ),

  // Remove movie from watchlist
  removeFromWatchlist: (tmdbId) =>
    apiCall(
      () => apiClient.delete(`/watchlist/${tmdbId}`),
      { showSuccessToast: true, successMessage: 'Removed from watchlist' }
    ),

  // Check if movie is in watchlist
  isInWatchlist: (tmdbId) => apiCall(() => apiClient.get(`/watchlist/check/${tmdbId}`)),

  // Mark as watched
  markAsWatched: (tmdbId) =>
    apiCall(
      () => apiClient.patch(`/watchlist/${tmdbId}/watched`),
      { showSuccessToast: true, successMessage: 'Marked as watched!' }
    ),
};

// Reviews API
export const reviewsAPI = {
  // Get reviews for a movie
  getMovieReviews: (tmdbId, params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      search: params.search || '',
      minRating: params.minRating || 1,
      maxRating: params.maxRating || 10,
      startDate: params.startDate || '',
      endDate: params.endDate || '',
      sortBy: params.sortBy || 'recent'
    }).toString();
    return apiCall(() => apiClient.get(`/reviews/movie/${tmdbId}?${queryParams}`));
  },

  // Get user's reviews
  getUserReviews: () => apiCall(() => apiClient.get('/reviews/user')),

  // Get user's review for a specific movie
  getUserReview: (tmdbId) => apiCall(() => apiClient.get(`/reviews/movie/${tmdbId}/user`)),

  // Get movie average rating
  getMovieRating: (tmdbId) => apiCall(() => apiClient.get(`/reviews/movie/${tmdbId}/rating`)),

  // Create a review for a movie
  createReview: (tmdbId, reviewData) =>
    apiCall(
      () => apiClient.post(`/reviews/movie/${tmdbId}`, reviewData),
      { showSuccessToast: true, successMessage: 'Review posted!' }
    ),

  // Update a review
  updateReview: (reviewId, reviewData) =>
    apiCall(
      () => apiClient.put(`/reviews/${reviewId}`, reviewData),
      { showSuccessToast: true, successMessage: 'Review updated!' }
    ),

  // Delete a review
  deleteReview: (reviewId) =>
    apiCall(
      () => apiClient.delete(`/reviews/${reviewId}`),
      { showSuccessToast: true, successMessage: 'Review deleted' }
    ),

  // Vote on a review (helpful/not helpful)
  voteReview: (reviewId, voteType) =>
    apiCall(() => apiClient.post(`/reviews/${reviewId}/vote`, { voteType })),

  // Report a review
  reportReview: (reviewId, reportData) =>
    apiCall(
      () => apiClient.post(`/reviews/${reviewId}/report`, reportData),
      { showSuccessToast: true, successMessage: 'Review reported successfully' }
    ),

  // Get all review reports (admin)
  getAllReports: () => apiCall(() => apiClient.get('/reviews/reports')),

  // Update report status (admin)
  updateReportStatus: (reportId, status) =>
    apiCall(
      () => apiClient.put(`/reviews/reports/${reportId}`, { status }),
      { showSuccessToast: true, successMessage: 'Report status updated' }
    ),
};

// Comments API
export const commentsAPI = {
  // Get comments for a movie
  getMovieComments: (tmdbId, params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      sortBy: params.sortBy || 'newest',
      search: params.search || '',
      startDate: params.startDate || '',
      endDate: params.endDate || ''
    }).toString();
    return apiCall(() => apiClient.get(`/comments/movie/${tmdbId}?${queryParams}`));
  },

  // Create a comment
  createComment: (tmdbId, commentData) =>
    apiCall(
      () => apiClient.post(`/comments/movie/${tmdbId}`, commentData),
      { showSuccessToast: true, successMessage: 'Comment posted!' }
    ),

  // Update a comment
  updateComment: (commentId, commentData) =>
    apiCall(
      () => apiClient.put(`/comments/${commentId}`, commentData),
      { showSuccessToast: true, successMessage: 'Comment updated!' }
    ),

  // Delete a comment
  deleteComment: (commentId) =>
    apiCall(
      () => apiClient.delete(`/comments/${commentId}`),
      { showSuccessToast: true, successMessage: 'Comment deleted' }
    ),

  // Like/unlike a comment
  likeComment: (commentId) =>
    apiCall(() => apiClient.post(`/comments/${commentId}/like`)),

  // Unlike a comment
  unlikeComment: (commentId) =>
    apiCall(() => apiClient.delete(`/comments/${commentId}/like`)),

  // Report a comment
  reportComment: (commentId, reportData) =>
    apiCall(
      () => apiClient.post(`/comments/${commentId}/report`, reportData),
      { showSuccessToast: true, successMessage: 'Comment reported successfully' }
    ),

  // Get all comment reports (admin)
  getAllCommentReports: () => apiCall(() => apiClient.get('/comments/reports')),

  // Update comment report status (admin)
  updateCommentReportStatus: (reportId, status) =>
    apiCall(
      () => apiClient.put(`/comments/reports/${reportId}`, { status }),
      { showSuccessToast: true, successMessage: 'Comment report status updated' }
    ),
};

// Torrents API
export const torrentsAPI = {
  // Get torrents for a movie
  getMovieTorrents: (imdbId) => apiCall(() => apiClient.get(`/torrents/imdb/${imdbId}`)),

  // Get torrents by IMDB ID with options (silently fails if backend not available)
  getByImdb: async (imdbId, options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.nocache) params.set('nocache', '1');
      if (options.provider) params.set('provider', options.provider);
      const queryString = params.toString();
      const url = `/torrents/imdb/${imdbId}${queryString ? `?${queryString}` : ''}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      // Silently fail - backend might not be running
      throw error;
    }
  },
};

// Movie Sync API (to sync TMDB data with backend)
export const syncAPI = {
  // Sync movie details to backend database
  syncMovie: (tmdbId) => apiCall(() => apiClient.post(`/sync/movie/${tmdbId}`)),

  // Get synced movie from backend
  getSyncedMovie: (tmdbId) => apiCall(() => apiClient.get(`/sync/movie/${tmdbId}`)),
};

// Notifications API
export const notificationsAPI = {
  // Get notifications
  getNotifications: (params = {}) => {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      unreadOnly: params.unreadOnly || false
    }).toString();
    return apiCall(() => apiClient.get(`/notifications?${queryParams}`));
  },

  // Mark notification as read
  markAsRead: (notificationId) =>
    apiCall(() => apiClient.put(`/notifications/${notificationId}/read`)),

  // Mark all as read
  markAllAsRead: () =>
    apiCall(
      () => apiClient.put('/notifications/mark-all-read'),
      { showSuccessToast: true, successMessage: 'All notifications marked as read' }
    ),

  // Delete notification
  deleteNotification: (notificationId) =>
    apiCall(() => apiClient.delete(`/notifications/${notificationId}`)),
};

// Users API
export const usersAPI = {
  // Search users
  searchUsers: (query, limit = 10) =>
    apiCall(() => apiClient.get(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`)),

  // Get user by username
  getUserByUsername: (username) =>
    apiCall(() => apiClient.get(`/users/${username}`)),
};

// Health check
export const healthCheck = () => apiCall(() => apiClient.get('/health', { baseURL: API_BASE_URL.replace('/api', '') }));

// Export as named export for compatibility
export const api = apiClient;

export default apiClient;
