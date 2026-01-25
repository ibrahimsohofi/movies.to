import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { getImageUrl } from '@/services/tmdb';
import { useTranslation } from 'react-i18next';

export default function CastCarousel({ cast = [] }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    dragFree: true,
    direction: isRTL ? 'rtl' : 'ltr',
  });

  // Helper function to translate department names
  const translateDepartment = (department) => {
    if (!department) return '';
    const translationKey = `person.departments.${department}`;
    const translated = t(translationKey);
    return translated === translationKey ? department : translated;
  };

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

  if (!cast || cast.length === 0) return null;

  return (
    <div className="relative group">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {cast.map((person) => (
            <Link
              key={person.id}
              to={`/person/${person.id}`}
              className="flex-[0_0_auto] w-[140px] md:w-[160px] group/card"
            >
              <div className="relative overflow-hidden rounded-xl bg-card border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-red-500/30 h-full flex flex-col">
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

                  {/* Popular Badge */}
                  {person.popularity > 10 && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      ★
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-1 flex-1 flex flex-col justify-between min-h-[100px]">
                  <div className="space-y-1">
                    <p className="font-bold text-sm leading-tight line-clamp-2 text-foreground group-hover/card:text-red-600 transition-colors">
                      {person.name}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-tight">
                      {person.character}
                    </p>
                  </div>
                  {person.known_for_department && (
                    <p className="text-xs text-muted-foreground/70 italic mt-auto">
                      {translateDepartment(person.known_for_department)}
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
          className={`absolute ${isRTL ? 'right-0 translate-x-2' : 'left-0 -translate-x-2'} top-1/2 -translate-y-1/2 z-10 bg-background/95 hover:bg-background backdrop-blur-md border border-border shadow-xl text-foreground p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 hover:border-red-500/50 disabled:opacity-0`}
          aria-label={t('movieDetail.previousCast')}
        >
          {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      )}

      {nextBtnEnabled && (
        <button
          onClick={scrollNext}
          className={`absolute ${isRTL ? 'left-0 -translate-x-2' : 'right-0 translate-x-2'} top-1/2 -translate-y-1/2 z-10 bg-background/95 hover:bg-background backdrop-blur-md border border-border shadow-xl text-foreground p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 hover:border-red-500/50 disabled:opacity-0`}
          aria-label={t('movieDetail.nextCast')}
        >
          {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      )}
    </div>
  );
}
