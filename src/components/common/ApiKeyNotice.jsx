import { AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ApiKeyNotice() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-2xl mx-auto border-yellow-500/50 bg-yellow-500/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            <CardTitle className="text-xl">TMDB API Key Required</CardTitle>
          </div>
          <CardDescription>
            This app needs a free TMDB API key to fetch movie data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="font-semibold">Quick Setup (2 minutes):</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Visit TMDB and create a free account</li>
              <li>Go to Settings → API</li>
              <li>Request an API key (v3 auth)</li>
              <li>Copy your API key</li>
              <li>Add it to the <code className="bg-muted px-2 py-1 rounded">.env</code> file</li>
              <li>Refresh this page</li>
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
                Get Free API Key
              </Button>
            </a>
          </div>

          <div className="text-xs bg-muted p-4 rounded-lg">
            <p className="font-semibold mb-2">Example .env file:</p>
            <pre className="text-xs">VITE_TMDB_API_KEY=your_api_key_here
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
