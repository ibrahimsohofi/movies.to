import { AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export default function ApiKeyNotice() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-2xl mx-auto border-yellow-500/50 bg-yellow-500/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            <CardTitle className="text-xl">{t('apiKeyNotice.title')}</CardTitle>
          </div>
          <CardDescription>
            {t('apiKeyNotice.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="font-semibold">{t('apiKeyNotice.quickSetup')}</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>{t('apiKeyNotice.step1')}</li>
              <li>{t('apiKeyNotice.step2')}</li>
              <li>{t('apiKeyNotice.step3')}</li>
              <li>{t('apiKeyNotice.step4')}</li>
              <li>{t('apiKeyNotice.step5')} <code className="bg-muted px-2 py-1 rounded">.env</code></li>
              <li>{t('apiKeyNotice.step6')}</li>
            </ol>
          </div>

          <div className="pt-2">
            <a
              href="https://www.themoviedb.org/signup"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="gap-2">
                <ExternalLink className="h-4 w-4" />
                {t('apiKeyNotice.getFreeApiKey')}
              </Button>
            </a>
          </div>

          <div className="text-xs bg-muted p-4 rounded-lg">
            <p className="font-semibold mb-2">{t('apiKeyNotice.exampleEnvFile')}</p>
            <pre className="text-xs">VITE_TMDB_API_KEY=your_api_key_here
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
