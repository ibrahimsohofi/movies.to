import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { authAPI } from '@/services/api';
import { useTranslation } from 'react-i18next';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);
      setEmailSent(true);
      // In development, we get the token in response
      if (response.resetToken) {
        setResetToken(response.resetToken);
      }
      toast.success(t('forgotPassword.resetInstructionsSent'));
    } catch (error) {
      toast.error(error.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl">{t('forgotPassword.checkYourEmail')}</CardTitle>
            <CardDescription>
              {t('forgotPassword.emailSentTo')}{' '}
              <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {t('forgotPassword.clickLinkInEmail')}
              </p>
            </div>

            {resetToken && (
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  {t('forgotPassword.developmentMode')}
                </p>
                <Link
                  to={`/reset-password?token=${resetToken}`}
                  className="text-xs text-yellow-700 dark:text-yellow-300 hover:underline break-all"
                >
                  {t('forgotPassword.clickHereToReset')}
                </Link>
              </div>
            )}

            <div className="text-center text-sm">
              <p className="text-muted-foreground mb-3">
                {t('forgotPassword.didntReceiveEmail')}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setEmailSent(false);
                  toast.info(t('forgotPassword.resendEmailInfo'));
                }}
              >
                {t('forgotPassword.resendEmail')}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button asChild variant="ghost" className="w-full">
                <Link to="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('forgotPassword.backToLogin')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Film className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl">{t('forgotPassword.title')}</CardTitle>
          <CardDescription>
            {t('forgotPassword.enterEmailDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t('forgotPassword.emailLabel')}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t('forgotPassword.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? t('forgotPassword.sending') : t('forgotPassword.sendResetLink')}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <Button asChild variant="ghost" className="w-full">
              <Link to="/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('forgotPassword.backToLogin')}
              </Link>
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            <p className="text-muted-foreground">
              {t('forgotPassword.noAccount')}{' '}
              <Link to="/register" className="text-red-600 hover:underline font-medium">
                {t('forgotPassword.signUp')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
