import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/services/api';
import { watchlistAPI } from '@/services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      login: async (email, password, rememberMe = false) => {
        try {
          set({ loading: true });
          const response = await authAPI.login({ email, password, rememberMe });
          const { user, token } = response;
          set({ user, token, isAuthenticated: true, loading: false });

          // Save remember me preference
          if (rememberMe) {
            localStorage.setItem('remember_me', 'true');
          } else {
            localStorage.removeItem('remember_me');
          }

          return { success: true, user };
        } catch (error) {
          set({ loading: false });
          return {
            success: false,
            error: error.response?.data?.error || 'Login failed. Please try again.'
          };
        }
      },

      register: async (username, email, password) => {
        try {
          set({ loading: true });
          const response = await authAPI.register({ username, email, password });
          const { user, token } = response;
          set({ user, token, isAuthenticated: true, loading: false });
          return { success: true, user };
        } catch (error) {
          set({ loading: false });
          return {
            success: false,
            error: error.response?.data?.message || 'Registration failed. Please try again.'
          };
        }
      },

      logout: () => {
        authAPI.logout();
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user, isAuthenticated: true }),

      updateUser: (user) => set({ user }),

      updateProfile: async (profileData) => {
        try {
          set({ loading: true });
          const response = await authAPI.updateProfile(profileData);
          set({ user: response.user, loading: false });
          return { success: true };
        } catch (error) {
          set({ loading: false });
          throw new Error(error.response?.data?.message || 'Failed to update profile');
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        try {
          set({ loading: true });
          await authAPI.changePassword({ currentPassword, newPassword });
          set({ loading: false });
          return { success: true };
        } catch (error) {
          set({ loading: false });
          throw new Error(error.response?.data?.message || 'Failed to change password');
        }
      },

      deleteAccount: async () => {
        try {
          set({ loading: true });
          await authAPI.deleteAccount();
          authAPI.logout();
          set({ user: null, token: null, isAuthenticated: false, loading: false });
          return { success: true };
        } catch (error) {
          set({ loading: false });
          throw new Error(error.response?.data?.message || 'Failed to delete account');
        }
      },

      // Try to restore session from token
      restoreSession: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        try {
          const response = await authAPI.me();
          set({
            user: response.user,
            token,
            isAuthenticated: true
          });
        } catch (error) {
          // Token invalid, clear it
          authAPI.logout();
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useWatchlistStore = create(
  persist(
    (set, get) => ({
      watchlist: [],

      addToWatchlist: async (movie, metadata = {}) => {
        const { isAuthenticated, user } = useAuthStore.getState();
        const watchlistItem = {
          ...movie,
          userRating: metadata.userRating || null,
          personalNotes: metadata.personalNotes || '',
          priority: metadata.priority || 'medium', // low, medium, high
          addedAt: new Date().toISOString(),
        };

        if (isAuthenticated) {
          try {
            await watchlistAPI.addToWatchlist({
              tmdb_id: movie.id,
              title: movie.title,
              overview: movie.overview,
              release_date: movie.release_date,
              runtime: movie.runtime,
              vote_average: movie.vote_average,
              vote_count: movie.vote_count,
              popularity: movie.popularity,
              poster_path: movie.poster_path,
              backdrop_path: movie.backdrop_path,
              original_language: movie.original_language,
              status: movie.status,
              tagline: movie.tagline,
              imdb_id: movie.imdb_id,
              user_rating: metadata.userRating,
              personal_notes: metadata.personalNotes,
              priority: metadata.priority,
            });
            set((state) => ({ watchlist: [...state.watchlist, watchlistItem] }));
          } catch (error) {
            console.error('Failed to add to backend watchlist, falling back to local', error);
            set((state) => ({ watchlist: [...state.watchlist, watchlistItem] }));
          }
        } else {
          set((state) => ({ watchlist: [...state.watchlist, watchlistItem] }));
        }
      },

      updateWatchlistItem: async (movieId, metadata) => {
        set((state) => ({
          watchlist: state.watchlist.map((item) =>
            item.id === movieId
              ? {
                  ...item,
                  userRating: metadata.userRating !== undefined ? metadata.userRating : item.userRating,
                  personalNotes: metadata.personalNotes !== undefined ? metadata.personalNotes : item.personalNotes,
                  priority: metadata.priority !== undefined ? metadata.priority : item.priority,
                }
              : item
          ),
        }));
      },

      removeFromWatchlist: async (movieId) => {
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          try {
            await watchlistAPI.removeFromWatchlist(movieId);
            // Also update local mirror if present
            set((state) => ({ watchlist: state.watchlist.filter((m) => m.id !== movieId) }));
          } catch (error) {
            console.error('Failed to remove from backend watchlist, removing locally', error);
            set((state) => ({ watchlist: state.watchlist.filter((m) => m.id !== movieId) }));
          }
        } else {
          set((state) => ({ watchlist: state.watchlist.filter((m) => m.id !== movieId) }));
        }
      },

      isInWatchlist: (movieId) => (state) =>
        state.watchlist.some((m) => m.id === movieId),

      // Optional: load backend watchlist into local store after login
      loadBackendWatchlist: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;
        try {
          const data = await watchlistAPI.getWatchlist();
          const movies = (data.watchlist || []).map((row) => ({
            id: row.tmdb_id,
            title: row.title,
            overview: row.overview,
            release_date: row.release_date,
            runtime: row.runtime,
            vote_average: row.vote_average,
            vote_count: row.vote_count,
            popularity: row.popularity,
            poster_path: row.poster_path,
            backdrop_path: row.backdrop_path,
            original_language: row.original_language,
            status: row.status,
            tagline: row.tagline,
            imdb_id: row.imdb_id,
          }));
          set({ watchlist: movies });
        } catch (error) {
          console.error('Failed to load backend watchlist', error);
        }
      },
    }),
    {
      name: 'watchlist-storage',
    }
  )
);

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'theme-storage',
    }
  )
);

// Recently Viewed Store
export const useRecentlyViewedStore = create(
  persist(
    (set, get) => ({
      recentlyViewed: [],
      maxItems: 10,

      addToRecentlyViewed: (movie) => {
        const { recentlyViewed, maxItems } = get();

        // Remove if already exists to avoid duplicates
        const filtered = recentlyViewed.filter(m => m.id !== movie.id);

        // Add to beginning and limit to maxItems
        const updated = [
          {
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            backdrop_path: movie.backdrop_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average,
            viewedAt: new Date().toISOString(),
          },
          ...filtered
        ].slice(0, maxItems);

        set({ recentlyViewed: updated });
      },

      clearRecentlyViewed: () => {
        set({ recentlyViewed: [] });
      },
    }),
    {
      name: 'recently-viewed-storage',
    }
  )
);

// Watch History Store - Track what users have watched
export const useWatchHistoryStore = create(
  persist(
    (set, get) => ({
      watchHistory: [],
      maxItems: 50, // Keep more items for history

      addToWatchHistory: (content, metadata = {}) => {
        const { watchHistory, maxItems } = get();

        // Content type detection
        const contentType = metadata.type || 'movie';
        const contentId = `${contentType}-${content.id}`;

        // Remove if already exists to update position
        const filtered = watchHistory.filter(item => item.contentId !== contentId);

        // Create history item with all necessary details
        const historyItem = {
          contentId,
          id: content.id,
          type: contentType,
          title: content.title || content.name,
          poster_path: content.poster_path,
          backdrop_path: content.backdrop_path,
          release_date: content.release_date || content.first_air_date,
          vote_average: content.vote_average,
          overview: content.overview,
          // Watch metadata
          watchedAt: new Date().toISOString(),
          lastWatchedAt: new Date().toISOString(),
          progress: metadata.progress || 0, // 0-100 percentage
          duration: metadata.duration || 0, // in minutes
          watchCount: (filtered.find(item => item.contentId === contentId)?.watchCount || 0) + 1,
          // TV show specific
          season: metadata.season || null,
          episode: metadata.episode || null,
          episodeTitle: metadata.episodeTitle || null,
          // Provider used
          provider: metadata.provider || null,
        };

        // Add to beginning and limit to maxItems
        const updated = [historyItem, ...filtered].slice(0, maxItems);
        set({ watchHistory: updated });
      },

      updateWatchProgress: (contentId, progress, duration = null) => {
        set((state) => ({
          watchHistory: state.watchHistory.map((item) =>
            item.contentId === contentId
              ? {
                  ...item,
                  progress: Math.min(100, Math.max(0, progress)),
                  duration: duration !== null ? duration : item.duration,
                  lastWatchedAt: new Date().toISOString(),
                }
              : item
          ),
        }));
      },

      getRecentlyWatched: (limit = 10) => {
        const { watchHistory } = get();
        return watchHistory.slice(0, limit);
      },

      getContinueWatching: (limit = 10) => {
        const { watchHistory } = get();
        // Return items with progress < 90% (not finished)
        return watchHistory
          .filter(item => item.progress < 90)
          .slice(0, limit);
      },

      getWatchedContent: (limit = 20) => {
        const { watchHistory } = get();
        // Return items with progress >= 90% (finished)
        return watchHistory
          .filter(item => item.progress >= 90)
          .slice(0, limit);
      },

      isInWatchHistory: (contentId) => {
        const { watchHistory } = get();
        return watchHistory.some(item => item.contentId === contentId);
      },

      getWatchHistoryItem: (contentId) => {
        const { watchHistory } = get();
        return watchHistory.find(item => item.contentId === contentId);
      },

      getWatchHistory: () => {
        const { watchHistory } = get();
        return watchHistory;
      },

      removeFromWatchHistory: (contentId) => {
        set((state) => ({
          watchHistory: state.watchHistory.filter(item => item.contentId !== contentId),
        }));
      },

      clearWatchHistory: () => {
        set({ watchHistory: [] });
      },

      // Get statistics
      getWatchStats: () => {
        const { watchHistory } = get();
        const totalWatched = watchHistory.length;
        const moviesWatched = watchHistory.filter(item => item.type === 'movie').length;
        const tvWatched = watchHistory.filter(item => item.type === 'tv').length;
        const totalWatchTime = watchHistory.reduce((acc, item) => acc + (item.duration || 0), 0);

        return {
          totalWatched,
          moviesWatched,
          tvWatched,
          totalWatchTime,
          averageRating: watchHistory.length > 0
            ? watchHistory.reduce((acc, item) => acc + (item.vote_average || 0), 0) / watchHistory.length
            : 0,
        };
      },
    }),
    {
      name: 'watch-history-storage',
    }
  )
);

// User Ratings Store - Track user's movie ratings
export const useUserRatingsStore = create(
  persist(
    (set, get) => ({
      ratings: {}, // { [movieId]: { rating: 1-5, ratedAt: ISO string, movie: {...} } }

      rateMovie: (movie, rating) => {
        if (rating < 1 || rating > 5) return;

        set((state) => ({
          ratings: {
            ...state.ratings,
            [movie.id]: {
              rating,
              ratedAt: new Date().toISOString(),
              movie: {
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                release_date: movie.release_date,
                vote_average: movie.vote_average,
                genre_ids: movie.genre_ids || movie.genres?.map(g => g.id) || [],
                overview: movie.overview,
              },
            },
          },
        }));
      },

      removeRating: (movieId) => {
        set((state) => {
          const { [movieId]: removed, ...rest } = state.ratings;
          return { ratings: rest };
        });
      },

      getRating: (movieId) => {
        const { ratings } = get();
        return ratings[movieId]?.rating || null;
      },

      getAllRatings: () => {
        const { ratings } = get();
        return Object.values(ratings).sort(
          (a, b) => new Date(b.ratedAt) - new Date(a.ratedAt)
        );
      },

      getHighlyRatedMovies: (minRating = 4) => {
        const { ratings } = get();
        return Object.values(ratings)
          .filter((r) => r.rating >= minRating)
          .map((r) => r.movie);
      },

      getFavoriteGenres: () => {
        const { ratings } = get();
        const genreScores = {};

        Object.values(ratings).forEach(({ rating, movie }) => {
          const genreIds = movie.genre_ids || [];
          genreIds.forEach((genreId) => {
            if (!genreScores[genreId]) {
              genreScores[genreId] = { total: 0, count: 0 };
            }
            genreScores[genreId].total += rating;
            genreScores[genreId].count += 1;
          });
        });

        return Object.entries(genreScores)
          .map(([genreId, { total, count }]) => ({
            genreId: parseInt(genreId),
            averageRating: total / count,
            count,
          }))
          .sort((a, b) => b.averageRating - a.averageRating);
      },

      getStats: () => {
        const { ratings } = get();
        const allRatings = Object.values(ratings);
        const totalRatings = allRatings.length;

        if (totalRatings === 0) {
          return { totalRatings: 0, averageRating: 0, distribution: {} };
        }

        const sum = allRatings.reduce((acc, r) => acc + r.rating, 0);
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        allRatings.forEach((r) => {
          distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        });

        return {
          totalRatings,
          averageRating: sum / totalRatings,
          distribution,
        };
      },

      clearAllRatings: () => {
        set({ ratings: {} });
      },
    }),
    {
      name: 'user-ratings-storage',
    }
  )
);

// Convenience export for auth (backwards compatibility)
export const useStore = useAuthStore;
