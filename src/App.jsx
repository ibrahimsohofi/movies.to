import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'sonner';
import { useThemeStore, useAuthStore } from '@/store/useStore';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';
import { analytics, trackPerformance } from '@/lib/analytics';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import NetworkStatus from '@/components/common/NetworkStatus';
import GlobalLoadingBar from '@/components/common/GlobalLoadingBar';
import ScrollToTop from '@/components/common/ScrollToTop';
import InstallPrompt from '@/components/common/InstallPrompt';
import LanguageNotification from '@/components/common/LanguageNotification';
import KeyboardShortcutsHelp from '@/components/common/KeyboardShortcutsHelp';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingIndicator from '@/components/common/LoadingIndicator';
import { useTranslation } from 'react-i18next';

// Lazy load all pages for code splitting
const Home = lazy(() => import('@/pages/Home'));
const Browse = lazy(() => import('@/pages/Browse'));
const MovieDetail = lazy(() => import('@/pages/MovieDetail'));
const PersonDetail = lazy(() => import('@/pages/PersonDetail'));
const Search = lazy(() => import('@/pages/Search'));
const Watchlist = lazy(() => import('@/pages/Watchlist'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const OAuthCallback = lazy(() => import('@/pages/OAuthCallback'));
const Genre = lazy(() => import('@/pages/Genre'));
const Genres = lazy(() => import('@/pages/Genres'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Admin = lazy(() => import('@/pages/Admin'));
const Profile = lazy(() => import('@/pages/Profile'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const Contact = lazy(() => import('@/pages/Contact'));
const About = lazy(() => import('@/pages/About'));
const Compare = lazy(() => import('@/pages/Compare'));
const Lists = lazy(() => import('@/pages/Lists'));
const ListDetail = lazy(() => import('@/pages/ListDetail'));
const DiscoverLists = lazy(() => import('@/pages/DiscoverLists'));
const Feed = lazy(() => import('@/pages/Feed'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Recommendations = lazy(() => import('@/pages/Recommendations'));
const Quizzes = lazy(() => import('@/pages/Quizzes'));
const QuizPlay = lazy(() => import('@/pages/QuizPlay'));
const QuizAchievements = lazy(() => import('@/pages/QuizAchievements'));
const Premium = lazy(() => import('@/pages/Premium'));
const Watch = lazy(() => import('@/pages/Watch'));
const History = lazy(() => import('@/pages/History'));
const MyRatings = lazy(() => import('@/pages/MyRatings'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function AppContent() {
  // Enable keyboard shortcuts - must be inside Router
  useKeyboardShortcuts();

  const location = useLocation();
  const { user } = useAuthStore();
  const { i18n } = useTranslation();

  // Track page views with analytics
  useEffect(() => {
    analytics.trackPageView({
      path: location.pathname + location.search,
      title: document.title,
      referrer: document.referrer,
      userId: user?.id,
    });
  }, [location, user]);

  // Set RTL/LTR direction based on language
  useEffect(() => {
    // Set RTL direction for Arabic, LTR for other languages
    if (i18n.language === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.classList.remove('rtl');
    }
  }, [i18n.language]);

  // Direction-aware class
  const isRTL = i18n.language === 'ar';

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-500 ${isRTL ? 'slide-in-rtl' : 'slide-in-ltr'}`}>
      <GlobalLoadingBar />
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-red-600 focus:text-white focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1 pb-20 md:pb-0" role="main">
        <Suspense fallback={<LoadingIndicator />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/person/:id" element={<PersonDetail />} />
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
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/compare" element={<Compare />} />
            <Route
              path="/lists"
              element={
                <ProtectedRoute>
                  <Lists />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lists/:id"
              element={
                <ProtectedRoute>
                  <ListDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/discover-lists" element={<DiscoverLists />} />
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations"
              element={
                <ProtectedRoute>
                  <Recommendations />
                </ProtectedRoute>
              }
            />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/quiz/:id" element={<QuizPlay />} />
            <Route
              path="/achievements"
              element={
                <ProtectedRoute>
                  <QuizAchievements />
                </ProtectedRoute>
              }
            />
            <Route path="/premium" element={<Premium />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/history" element={<History />} />
            <Route path="/my-ratings" element={<MyRatings />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <BottomNav />
      <ScrollToTop />
      <NetworkStatus />
      <InstallPrompt />
      <LanguageNotification />
      <KeyboardShortcutsHelp />
      <Toaster position="top-center" richColors />
    </div>
  );
}

function App() {
  const { theme } = useThemeStore();
  const { restoreSession } = useAuthStore();
  const { i18n } = useTranslation();

  // Restore session only once on mount
  useEffect(() => {
    restoreSession();
    trackPerformance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply theme and direction changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Set RTL direction for Arabic, LTR for other languages
    if (i18n.language === 'ar') {
      root.dir = 'rtl';
      root.classList.add('rtl');
    } else {
      root.dir = 'ltr';
      root.classList.remove('rtl');
    }
  }, [theme, i18n.language]);

  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
