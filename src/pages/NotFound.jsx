import { Link } from 'react-router-dom';
import { Home, Search, Film, ArrowLeft, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <Card className={`max-w-2xl w-full text-center shadow-2xl border-2 transition-all duration-700 ${
        mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <CardContent className="pt-16 pb-16 space-y-8">
          {/* Animated 404 */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="text-[150px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 leading-none animate-pulse">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative animate-float">
                  <Film className="h-20 w-20 md:h-24 md:w-24 text-primary drop-shadow-lg" strokeWidth={1.5} />
                  <div className="absolute inset-0 blur-xl bg-primary/30 rounded-full scale-150 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 max-w-md mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {t('notFound.title')}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {t('notFound.message')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="group shadow-lg hover:shadow-xl transition-all duration-300">
              <Link to="/">
                <Home className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                {t('notFound.backHome')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="group shadow-md hover:shadow-lg transition-all duration-300">
              <Link to="/search">
                <Search className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                {t('nav.search')}
              </Link>
            </Button>
          </div>

          {/* Quick Links */}
          <div className="pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-4 font-medium">
              Or explore these popular sections:
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 transition-colors">
                <Link to="/browse">
                  <TrendingUp className="h-4 w-4 mr-1.5" />
                  {t('nav.browse')}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 transition-colors">
                <Link to="/genres">
                  <Film className="h-4 w-4 mr-1.5" />
                  {t('nav.genres')}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hover:bg-primary/10 transition-colors">
                <Link to="/watchlist">
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  {t('nav.watchlist')}
                </Link>
              </Button>
            </div>
          </div>

          {/* Fun Message */}
          <div className="pt-4">
            <p className="text-xs text-muted-foreground/70 italic">
              "This page is like a deleted scene - it never made the final cut."
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
