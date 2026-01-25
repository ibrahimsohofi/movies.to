import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Film, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { authAPI } from '@/services/api';
import { useTranslation } from 'react-i18next';

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage(t('verifyEmail.tokenMissing'));
        return;
      }

      try {
        await authAPI.verifyEmail(token);
        setStatus('success');
        toast.success(t('verifyEmail.emailVerified'));

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setErrorMessage(
          error.response?.data?.error ||
          t('verifyEmail.errorMessage')
        );
        toast.error(t('verifyEmail.failed'));
      }
    };

    verifyEmail();
  }, [token, navigate, t]);

  if (status === 'verifying') {
    return (
      <div className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-12 w-12 text-red-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl">{t('verifyEmail.verifying')}</CardTitle>
            <CardDescription>{t('verifyEmail.pleaseWait')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">{t('verifyEmail.success')}</CardTitle>
            <CardDescription>
              {t('verifyEmail.successMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200 text-center">
                {t('verifyEmail.redirecting')}
              </p>
            </div>

            <Button asChild className="w-full" size="lg">
              <Link to="/login">{t('verifyEmail.continueToLogin')}</Link>
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground hover:underline">
                {t('verifyEmail.goToHome')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">{t('verifyEmail.failed')}</CardTitle>
            <CardDescription>
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                {t('verifyEmail.linkExpired')}
              </p>
            </div>

            <Button asChild className="w-full" size="lg">
              <Link to="/register">{t('verifyEmail.createNewAccount')}</Link>
            </Button>

            <div className="text-center">
              <Button asChild variant="ghost">
                <Link to="/login">{t('verifyEmail.backToLogin')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
