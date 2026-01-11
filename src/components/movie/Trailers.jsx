import { useState, useCallback, useEffect } from 'react';
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useEmblaCarousel from 'embla-carousel-react';
import { useTranslation } from 'react-i18next';

export default function Trailers({ videos }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    direction: isRTL ? 'rtl' : 'ltr',
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 },
    }
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  // Reinitialize carousel when language direction changes
  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit();
    }
  }, [emblaApi, isRTL]);

  if (!videos || !videos.results || videos.results.length === 0) {
    return null;
  }

  // Filter for YouTube trailers and teasers
  const trailers = videos.results.filter(
    (video) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
  );

  if (trailers.length === 0) {
    return null;
  }

  const handleTrailerClick = (trailer) => {
    setSelectedTrailer(trailer);
  };

  const closeModal = () => {
    setSelectedTrailer(null);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('movieDetail.trailersVideos')}</h2>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{trailers.length} {t('movieDetail.trailersVideos')}</Badge>
          {trailers.length > 1 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="h-8 w-8 rounded-full"
              >
                {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="h-8 w-8 rounded-full"
              >
                {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {trailers.map((trailer, index) => (
            <div
              key={trailer.id}
              className="flex-[0_0_100%] md:flex-[0_0_calc(50%-0.5rem)] lg:flex-[0_0_calc(33.333%-0.667rem)] min-w-0"
            >
              <Card
                className="overflow-hidden group cursor-pointer hover:shadow-2xl transition-all hover:scale-[1.02] duration-300"
                onClick={() => handleTrailerClick(trailer)}
              >
                <div className="relative bg-black aspect-video">
                  <img
                    src={`https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`}
                    alt={trailer.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => {
                      e.target.src = `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-600 rounded-full w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-2xl group-hover:bg-red-700">
                      <Play className="text-white fill-white h-8 w-8 ml-1" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold mb-2 line-clamp-2 text-sm">
                      {trailer.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="bg-red-600 hover:bg-red-600 text-xs">
                        {trailer.type}
                      </Badge>
                      {trailer.official && (
                        <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-xs">
                          {t('movieDetail.official')}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Featured Badge for first trailer */}
                  {index === 0 && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-red-600 to-red-700 border-0">
                        {t('movieDetail.featured')}
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal */}
      {selectedTrailer && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={closeModal}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={closeModal}
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <h3 className="text-white text-2xl font-bold mb-2">{selectedTrailer.name}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-red-600 hover:bg-red-600">
                  {selectedTrailer.type}
                </Badge>
                {selectedTrailer.official && (
                  <Badge variant="secondary">{t('movieDetail.official')}</Badge>
                )}
                {selectedTrailer.published_at && (
                  <span className="text-white/60 text-sm">
                    {new Date(selectedTrailer.published_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${selectedTrailer.key}?autoplay=1&rel=0`}
                title={selectedTrailer.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
