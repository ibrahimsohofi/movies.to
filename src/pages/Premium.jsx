import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Crown, Zap, Star, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MetaTags from '@/components/common/MetaTags';
import { useTranslation } from 'react-i18next';

export default function Premium() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription();
    }
  }, [isAuthenticated]);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      toast.error(t('premium.loginToUpgrade'));
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/subscription/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/premium/success`,
          cancelUrl: `${window.location.origin}/premium`,
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.url) {
          // Stripe configured - redirect to checkout
          window.location.href = data.url;
        } else if (data.isTrial) {
          // Trial mode (Stripe not configured)
          toast.success(data.message || t('toasts.premiumTrialStarted'));
          fetchSubscription();
        }
      } else {
        toast.error(data.error || t('toasts.upgradeFailed'));
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error(t('toasts.upgradeProcessFailed'));
    } finally {
      setLoading(false);
    }
  };

  const freeFeatures = [
    t('premium.featuresList.free.browse'),
    t('premium.featuresList.free.watchlist'),
    t('premium.featuresList.free.reviews'),
    t('premium.featuresList.free.follow'),
    t('premium.featuresList.free.lists'),
    t('premium.featuresList.free.recommendations'),
    t('premium.featuresList.free.community')
  ];

  const premiumFeatures = [
    t('premium.featuresList.premium.everythingInFree'),
    t('premium.featuresList.premium.unlimitedWatchlist'),
    t('premium.featuresList.premium.unlimitedLists'),
    t('premium.featuresList.premium.adFree'),
    t('premium.featuresList.premium.advancedStats'),
    t('premium.featuresList.premium.priorityRecommendations'),
    t('premium.featuresList.premium.earlyAccess'),
    t('premium.featuresList.premium.customThemes'),
    t('premium.featuresList.premium.exportData'),
    t('premium.featuresList.premium.prioritySupport'),
    t('premium.featuresList.premium.exclusiveBadges'),
    t('premium.featuresList.premium.advancedFilters')
  ];

  const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active';
  const isTrial = subscription?.status === 'trial';

  return (
    <>
      <MetaTags
        title={`${t('premium.title')} - Movies.to`}
        description={t('premium.description')}
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-4 py-2 rounded-full mb-4">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium">{t('premium.premiumPlan')}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t('premium.upgradeExperience')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('premium.getUnlimitedAccess')}
            </p>
          </div>

          {/* Current Status */}
          {isAuthenticated && subscription && (
            <Card className="p-6 mb-8 border-2 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{t('premium.currentPlan')}</h3>
                  <p className="text-muted-foreground">
                    {subscription.plan === 'premium' ? (
                      <span className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        {t('premium.premiumPlan')} {isTrial && `(${t('premium.trial')})`}
                      </span>
                    ) : (
                      t('premium.freePlan')
                    )}
                  </p>
                </div>
                {isPremium && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {isTrial ? t('premium.trialEnds') : t('premium.renews')}: {new Date(subscription.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Free Plan */}
            <Card className="p-8 relative">
              <h3 className="text-2xl font-bold mb-2">{t('premium.freePlan')}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">{t('premium.perMonth')}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full" disabled>
                {t('premium.currentPlanLabel')}
              </Button>
            </Card>

            {/* Premium Plan */}
            <Card className="p-8 relative border-2 border-primary shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {t('premium.mostPopular')}
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                {t('premium.premiumPlan')}
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$4.99</span>
                <span className="text-muted-foreground">{t('premium.perMonth')}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                onClick={handleUpgrade}
                disabled={loading || isPremium}
              >
                {loading ? t('premium.processing') : isPremium ? t('premium.active') : t('premium.startFreeTrial')}
              </Button>

              {!isPremium && (
                <p className="text-xs text-center text-muted-foreground mt-3">
                  {t('premium.noCreditCard')}
                </p>
              )}
            </Card>
          </div>

          {/* Features Highlight */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t('premium.highlights.lightningFast')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('premium.highlights.lightningFastDesc')}
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t('premium.highlights.adFree')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('premium.highlights.adFreeDesc')}
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t('premium.highlights.prioritySupport')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('premium.highlights.prioritySupportDesc')}
              </p>
            </Card>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">{t('premium.faq.title')}</h2>

            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">{t('premium.faq.canCancel')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('premium.faq.canCancelAnswer')}
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">{t('premium.faq.paymentMethods')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('premium.faq.paymentMethodsAnswer')}
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">{t('premium.faq.freeTrial')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('premium.faq.freeTrialAnswer')}
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
