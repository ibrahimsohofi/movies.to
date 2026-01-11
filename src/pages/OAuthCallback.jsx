import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useStore';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function OAuthCallback() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuthState = useAuthStore(state => state.setAuthState);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        toast.error(t('oauth.failed'));
        navigate('/login', { replace: true });
        return;
      }

      if (!token) {
        toast.error(t('oauth.noToken'));
        navigate('/login', { replace: true });
        return;
      }

      try {
        // Store the token
        localStorage.setItem('auth_token', token);

        // Fetch user data
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        const user = data.user;

        // Update auth store
        setAuthState(user, token);

        toast.success(t('oauth.welcome', { username: user.username }));
        navigate('/', { replace: true });
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error(t('oauth.authError'));
        localStorage.removeItem('auth_token');
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuthState]);

  return (
    <div className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-red-600 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('oauth.signingIn')}</h2>
        <p className="text-muted-foreground">{t('oauth.pleaseWait')}</p>
      </div>
    </div>
  );
}
