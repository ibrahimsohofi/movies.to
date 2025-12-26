import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Github, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useStore';
import { isBackendEnabled } from '@/services/api';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreeToTerms) {
      toast.error(t('register.mustAgreeToTerms'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('register.passwordsDoNotMatch'));
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t('register.passwordMinLength'));
      return;
    }

    const result = await register(formData.username, formData.email, formData.password);

    if (result.success) {
      toast.success(t('register.welcomeMessage', { username: result.user.username }));
      navigate('/');
    } else {
      toast.error(result.error);
    }
  };

  const handleSocialLogin = (provider) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const providerLower = provider.toLowerCase();

    // Redirect to OAuth endpoint
    window.location.href = `${API_BASE_URL}/auth/${providerLower}`;
  };

  return (
    <div className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-red-500/10 animate-gradient-shift"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(236,72,153,0.1),transparent_50%)]"></div>

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-background/95 shadow-2xl border-pink-500/20 hover:border-pink-500/40 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-red-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <Film className="h-12 w-12 text-pink-600 relative z-10 drop-shadow-lg" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
              {t('register.title')}
            </CardTitle>
            <CardDescription className="text-base">{t('register.subtitle')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                {t('register.usernameLabel')}
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder={t('register.usernamePlaceholder')}
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t('register.emailLabel')}
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('register.emailPlaceholder')}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t('register.passwordLabel')}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('register.passwordPlaceholder')}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('register.passwordMinLengthHelper')}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                {t('register.confirmPasswordLabel')}
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('register.confirmPasswordPlaceholder')}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={setAgreeToTerms}
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                {t('register.agreeToTerms')}{' '}
                <Link to="/terms" className="text-red-600 hover:underline">
                  {t('register.termsAndConditions')}
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-300 hover:scale-[1.02]"
              size="lg"
              disabled={loading || !agreeToTerms}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('register.creatingAccount')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t('register.createAccount')}
                </div>
              )}
            </Button>
          </form>

          {!isBackendEnabled() && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">{t('register.demoModeTitle')}</p>
                  <p>
                    {t('register.demoModeDesc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isBackendEnabled() && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t('auth.orSignUpWith')}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  variant="outline"
                  className="w-full hover:bg-muted/50 hover:border-pink-500/30 transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => handleSocialLogin('Google')}
                  disabled={loading}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t('auth.continueWithGoogle')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full hover:bg-muted/50 hover:border-pink-500/30 transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => handleSocialLogin('GitHub')}
                  disabled={loading}
                >
                  <Github className="h-4 w-4 mr-2" />
                  {t('auth.continueWithGithub')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full hover:bg-muted/50 hover:border-pink-500/30 transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => handleSocialLogin('Facebook')}
                  disabled={loading}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  {t('auth.continueWithFacebook')}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              {t('register.hasAccount')}{' '}
              <Link to="/login" className="text-red-600 hover:underline font-medium">
                {t('register.signIn')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
