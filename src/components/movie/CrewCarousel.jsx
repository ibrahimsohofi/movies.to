import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, User, Award } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { getImageUrl } from '@/services/tmdb';
import { useTranslation } from 'react-i18next';

export default function CrewCarousel({ crew = [] }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    dragFree: true,
    direction: isRTL ? 'rtl' : 'ltr',
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Reinitialize carousel when language direction changes
  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit();
    }
  }, [emblaApi, isRTL]);

  // Filter important crew members (directors, writers, producers, etc.)
  const importantJobs = ['Director', 'Writer', 'Screenplay', 'Producer', 'Executive Producer', 'Director of Photography', 'Original Music Composer'];
  const importantCrew = crew.filter(person => importantJobs.includes(person.job));

  if (!importantCrew || importantCrew.length === 0) return null;

  // Get department color
  const getDepartmentColor = (job) => {
    if (job === 'Director') return 'from-amber-500 to-orange-500';
    if (job === 'Writer' || job === 'Screenplay') return 'from-blue-500 to-cyan-500';
    if (job.includes('Producer')) return 'from-green-500 to-emerald-500';
    if (job === 'Director of Photography') return 'from-purple-500 to-pink-500';
    if (job === 'Original Music Composer') return 'from-red-500 to-rose-500';
    return 'from-gray-500 to-slate-500';
  };

  return (
    <div className="relative group">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {importantCrew.map((person, index) => (
            <Link
              key={`${person.id}-${index}`}
              to={`/person/${person.id}`}
              className="flex-[0_0_auto] w-[140px] md:w-[160px] group/card"
            >
              <div className="relative overflow-hidden rounded-xl bg-card border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-amber-500/30 h-full flex flex-col">
                {/* Image */}
                <div className="aspect-[2/3] relative overflow-hidden bg-muted flex-shrink-0">
                  {person.profile_path ? (
                    <>
                      <img
                        src={getImageUrl(person.profile_path, 'w200')}
                        alt={person.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                      />
                      {/* Gradient Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                      <User className="h-16 w-16 text-muted-foreground/40" />
                    </div>
                  )}

                  {/* Job Badge */}
                  <div className={`absolute top-2 left-2 bg-gradient-to-r ${getDepartmentColor(person.job)} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1`}>
                    <Award className="h-3 w-3" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 space-y-1 flex-1 flex flex-col justify-between min-h-[100px]">
                  <div className="space-y-1">
                    <p className="font-bold text-sm leading-tight line-clamp-2 text-foreground group-hover/card:text-amber-600 transition-colors">
                      {person.name}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1 leading-tight font-semibold">
                      {person.job}
                    </p>
                  </div>
                  {person.department && (
                    <p className="text-xs text-muted-foreground/70 italic mt-auto">
                      {person.department}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {prevBtnEnabled && (
        <button
          onClick={scrollPrev}
          className={`absolute ${isRTL ? 'right-0 translate-x-2' : 'left-0 -translate-x-2'} top-1/2 -translate-y-1/2 z-10 bg-background/95 hover:bg-background backdrop-blur-md border border-border shadow-xl text-foreground p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 hover:border-amber-500/50`}
          aria-label={t('movieDetail.previousCrew')}
        >
          {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      )}

      {nextBtnEnabled && (
        <button
          onClick={scrollNext}
          className={`absolute ${isRTL ? 'left-0 -translate-x-2' : 'right-0 translate-x-2'} top-1/2 -translate-y-1/2 z-10 bg-background/95 hover:bg-background backdrop-blur-md border border-border shadow-xl text-foreground p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 hover:border-amber-500/50`}
          aria-label={t('movieDetail.nextCrew')}
        >
          {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      )}
    </div>
  );
}
