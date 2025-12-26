import { useEffect, useState } from 'react';
import { tmdbAPI, getImageUrl } from '@/services/tmdb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tv, Play, ShoppingCart, ExternalLink, AlertCircle, Star } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  generateAffiliateUrl,
  trackAffiliateClick,
  hasAffiliateSupport
} from '@/services/affiliateService';
import { useTranslation } from 'react-i18next';

export default function WhereToWatch({ movieId, movieTitle }) {
  const { t } = useTranslation();
  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await tmdbAPI.getWatchProviders(movieId);

        // Get US providers (you can change this to user's country)
        const usProviders = response.results?.US || null;
        setProviders(usProviders);
      } catch (err) {
        console.error('Error fetching watch providers:', err);
        setError('Unable to load streaming information');
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchProviders();
    }
  }, [movieId]);

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5 text-red-600" />
            {t('movieDetail.whereToWatch')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !providers) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5 text-red-600" />
            {t('movieDetail.whereToWatch')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('movieDetail.streamingNotAvailable')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { flatrate, buy, rent, link } = providers;
  const hasAnyProviders = flatrate || buy || rent;

  if (!hasAnyProviders) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5 text-red-600" />
            {t('movieDetail.whereToWatch')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('movieDetail.notAvailableRegion')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const handleProviderClick = (provider) => {
    // Track the click
    trackAffiliateClick(provider.provider_name, movieId);

    // Generate affiliate URL if available
    const affiliateUrl = generateAffiliateUrl(
      provider.provider_name,
      movieId,
      movieTitle
    );

    // Open affiliate URL or fallback to JustWatch link
    const targetUrl = affiliateUrl || link;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const ProviderLogo = ({ provider }) => {
    const hasAffiliate = hasAffiliateSupport(provider.provider_name);

    return (
      <button
        type="button"
        onClick={() => handleProviderClick(provider)}
        className="group relative flex flex-col items-center gap-2 cursor-pointer"
        title={`Watch on ${provider.provider_name}${hasAffiliate ? ' (Affiliate)' : ''}`}
      >
        <div className="relative w-16 h-16 rounded-xl overflow-hidden ring-2 ring-border group-hover:ring-red-500 transition-all duration-300 group-hover:scale-110">
          <img
            src={getImageUrl(provider.logo_path, 'original')}
            alt={provider.provider_name}
            className="w-full h-full object-cover"
          />
          {hasAffiliate && (
            <div className="absolute top-1 right-1 bg-yellow-500 rounded-full p-0.5">
              <Star className="h-3 w-3 text-white fill-white" />
            </div>
          )}
        </div>
        <span className="text-xs text-center font-medium max-w-[80px] line-clamp-2">
          {provider.provider_name}
        </span>
      </button>
    );
  };

  return (
    <Card className="border-border/50 hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5 text-red-600" />
            {t('movieDetail.whereToWatch')}
          </CardTitle>
          {link && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(link, '_blank')}
              className="hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('movieDetail.justWatch')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stream */}
        {flatrate && flatrate.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold text-sm flex items-center gap-2">
                {t('movieDetail.stream')}
                <Badge variant="secondary" className="bg-green-600/10 text-green-600">
                  {t('movieDetail.subscription')}
                </Badge>
              </h4>
            </div>
            <div className="flex flex-wrap gap-4">
              {flatrate.map((provider) => (
                <ProviderLogo key={provider.provider_id} provider={provider} />
              ))}
            </div>
          </div>
        )}

        {/* Buy */}
        {buy && buy.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-sm flex items-center gap-2">
                {t('movieDetail.buy')}
                <Badge variant="secondary" className="bg-blue-600/10 text-blue-600">
                  {t('movieDetail.ownForever')}
                </Badge>
              </h4>
            </div>
            <div className="flex flex-wrap gap-4">
              {buy.map((provider) => (
                <ProviderLogo key={provider.provider_id} provider={provider} />
              ))}
            </div>
          </div>
        )}

        {/* Rent */}
        {rent && rent.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-orange-600" />
              <h4 className="font-semibold text-sm flex items-center gap-2">
                {t('movieDetail.rent')}
                <Badge variant="secondary" className="bg-orange-600/10 text-orange-600">
                  {t('movieDetail.limitedTime')}
                </Badge>
              </h4>
            </div>
            <div className="flex flex-wrap gap-4">
              {rent.map((provider) => (
                <ProviderLogo key={provider.provider_id} provider={provider} />
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
          {t('movieDetail.availabilityNotice')}
        </p>
      </CardContent>
    </Card>
  );
}
