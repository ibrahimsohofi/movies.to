import { useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Share2, Film, Clock, Calendar, Star, Trophy, Sparkles, Image, FileText } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import api from '@/services/api';
import ShareButton from '@/components/common/ShareButton';

export default function YearInReview() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef(null);
  const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());

  const { data: review, isLoading } = useQuery({
    queryKey: ['year-in-review', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/analytics/year-in-review/${selectedYear}`);
      return response.data.data;
    }
  });

  const handleExportImage = useCallback(async () => {
    if (!contentRef.current) return;

    setIsExporting(true);
    toast.info('Generating image...');

    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#09090b',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `year-in-review-${selectedYear}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Export image error:', error);
      toast.error('Failed to generate image');
    } finally {
      setIsExporting(false);
    }
  }, [selectedYear]);

  const handleExportPDF = useCallback(async () => {
    if (!contentRef.current) return;

    setIsExporting(true);
    toast.info('Generating PDF...');

    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#09090b',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`year-in-review-${selectedYear}.pdf`);

      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  }, [selectedYear]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const hasData = review?.movies_watched > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-amber-500" />
            Your {selectedYear} in Movies
          </h2>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <ShareButton
            contentType="year_review"
            contentId={selectedYear}
            title={`My ${selectedYear} Year in Movies`}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Download'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportImage} className="cursor-pointer">
                <Image className="w-4 h-4 mr-2" />
                Download as Image (PNG)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                <FileText className="w-4 h-4 mr-2" />
                Download as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No movies watched in {selectedYear}</h3>
            <p className="text-muted-foreground">
              Start watching movies to build your year in review!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Hero Stats Card */}
          <Card className="bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-black/20" />
            <CardContent className="pt-8 pb-8 relative">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="space-y-2">
                  <Film className="h-8 w-8 mx-auto opacity-80" />
                  <div className="text-4xl md:text-5xl font-bold">{review?.movies_watched}</div>
                  <div className="text-sm opacity-90">Movies Watched</div>
                </div>
                <div className="space-y-2">
                  <Clock className="h-8 w-8 mx-auto opacity-80" />
                  <div className="text-4xl md:text-5xl font-bold">{review?.total_hours}</div>
                  <div className="text-sm opacity-90">Hours Watched</div>
                </div>
                <div className="space-y-2">
                  <Calendar className="h-8 w-8 mx-auto opacity-80" />
                  <div className="text-4xl md:text-5xl font-bold">{review?.days_watched}</div>
                  <div className="text-sm opacity-90">Days Active</div>
                </div>
                <div className="space-y-2">
                  <Star className="h-8 w-8 mx-auto opacity-80" />
                  <div className="text-4xl md:text-5xl font-bold">{review?.avg_rating?.toFixed(1) || '0.0'}</div>
                  <div className="text-sm opacity-90">Avg Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Genres */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Your Top Genres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {review?.top_genres?.map((genre, index) => (
                    <div key={genre.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                          ${index === 0 ? 'bg-amber-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-amber-700 text-white' :
                            'bg-gray-200 dark:bg-gray-700'}
                        `}>
                          {index + 1}
                        </span>
                        <span className="font-medium">{genre.name}</span>
                      </div>
                      <span className="text-muted-foreground">{genre.count} movies</span>
                    </div>
                  ))}
                  {(!review?.top_genres || review.top_genres.length === 0) && (
                    <p className="text-muted-foreground text-center py-4">No genre data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Monthly Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthData = review?.monthly_breakdown?.find(m => m.month === i + 1);
                    const count = monthData?.movies_watched || 0;
                    const maxCount = Math.max(...(review?.monthly_breakdown?.map(m => m.movies_watched) || [1]));
                    const intensity = count > 0 ? Math.max(0.2, count / maxCount) : 0;

                    return (
                      <div
                        key={i}
                        className="aspect-square rounded-md flex flex-col items-center justify-center text-xs relative group cursor-pointer transition-transform hover:scale-105"
                        style={{
                          backgroundColor: count > 0
                            ? `rgba(239, 68, 68, ${intensity})`
                            : 'rgba(156, 163, 175, 0.1)'
                        }}
                      >
                        <span className="font-medium">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                        </span>
                        <span className="text-[10px] opacity-70">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Movies */}
          {review?.top_movies && review.top_movies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  Your Favorite Movies of {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {review.top_movies.map((movie, index) => (
                    <a
                      key={movie.tmdb_id}
                      href={`/movie/${movie.tmdb_id}`}
                      className="group relative"
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {index < 3 && (
                          <div className={`
                            absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                            ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'}
                          `}>
                            {index + 1}
                          </div>
                        )}
                        {movie.rating && (
                          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-500" />
                            {movie.rating}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-red-500 transition-colors">
                        {movie.title}
                      </p>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* New Genres Explored */}
          {review?.new_genres_explored && review.new_genres_explored.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  New Genres Explored in {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {review.new_genres_explored.map(genre => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews Summary */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-center gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-red-500">{review?.reviews_written || 0}</div>
                  <div className="text-sm text-muted-foreground">Reviews Written</div>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <div className="text-3xl font-bold text-amber-500">{review?.avg_rating?.toFixed(1) || '0.0'}</div>
                  <div className="text-sm text-muted-foreground">Average Rating Given</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
