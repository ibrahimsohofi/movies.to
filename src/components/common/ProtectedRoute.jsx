import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useStore';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, restoreSession, loading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Try to restore session on mount
    restoreSession();
  }, [restoreSession]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
