import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useThemeStore, useAuthStore } from '@/store/useStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import NetworkStatus from '@/components/common/NetworkStatus';
import GlobalLoadingBar from '@/components/common/GlobalLoadingBar';
import ScrollToTop from '@/components/common/ScrollToTop';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Home from '@/pages/Home';
import Browse from '@/pages/Browse';
import MovieDetail from '@/pages/MovieDetail';
import Search from '@/pages/Search';
import Watchlist from '@/pages/Watchlist';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import VerifyEmail from '@/pages/VerifyEmail';
import OAuthCallback from '@/pages/OAuthCallback';
import Genre from '@/pages/Genre';
import Genres from '@/pages/Genres';
import Dashboard from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';

function AppContent() {
  // Enable keyboard shortcuts - must be inside Router
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalLoadingBar />
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/genres" element={<Genres />} />
          <Route path="/genre/:genreId" element={<Genre />} />
          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <Watchlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <BottomNav />
      <ScrollToTop />
      <NetworkStatus />
      <Toaster position="top-center" richColors />
    </div>
  );
}

function App() {
  const { theme } = useThemeStore();
  const { restoreSession } = useAuthStore();

  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Restore user session from token
    restoreSession();
  }, [theme, restoreSession]);

  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
