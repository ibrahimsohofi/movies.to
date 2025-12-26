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

// Convenience export for auth (backwards compatibility)
export const useStore = useAuthStore;
