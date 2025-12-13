import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Info, TrendingUp, Star, Calendar, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { getImageUrl } from '@/services/tmdb';
import { Button } from '@/components/ui/button';

export default function HeroSlider({ movies = [] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      duration: 30,
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi, onSelect]);

  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative h-[70vh] md:h-[85vh] -mt-16 overflow-hidden group">
      <div className="embla overflow-hidden h-full" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {movies.slice(0, 8).map((movie) => (
            <div key={movie.id} className="embla__slide flex-[0_0_100%] min-w-0 relative">
              {/* Background Image with Parallax Effect */}
              <div className="absolute inset-0">
                <img
                  src={getImageUrl(movie.backdrop_path, 'w1280')}
                  alt={movie.title}
                  className="w-full h-full object-cover scale-110 transition-transform duration-[8000ms] ease-out"
                  referrerPolicy="no-referrer"
                  onLoad={(e) => {
                    e.target.style.transform = 'scale(1)';
                  }}
                  onError={(e) => {
                    console.error('Hero image failed to load:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(220,38,38,0.15),transparent_70%)]" />
              </div>

              {/* Content */}
              <div className="relative container mx-auto px-4 h-full flex items-center z-10">
                <div className="max-w-3xl space-y-6 pt-16 animate-slide-in-up">
                  {/* Trending Badge */}
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600/95 to-pink-600/95 backdrop-blur-md px-5 py-2.5 rounded-full shadow-2xl shadow-red-500/40 animate-pulse-subtle border border-red-400/20">
                    <TrendingUp className="h-4 w-4 text-white animate-bounce-subtle" />
                    <span className="text-white font-bold text-sm tracking-wide">TRENDING NOW</span>
                  </div>

                  {/* Movie Title */}
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                    <span className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent drop-shadow-2xl">
                      {movie.title}
                    </span>
                  </h1>

                  {/* Meta Information */}
                  <div className="flex items-center flex-wrap gap-3 text-sm">
                    {movie.vote_average > 0 && (
                      <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-yellow-500/40 shadow-lg shadow-yellow-500/20">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-bold text-white text-base">{movie.vote_average.toFixed(1)}</span>
                      </div>
                    )}
                    {movie.release_date && (
                      <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2 rounded-full border border-white/25 shadow-lg">
                        <Calendar className="h-4 w-4 text-white" />
                        <span className="text-white font-semibold">{new Date(movie.release_date).getFullYear()}</span>
                      </div>
                    )}
                    {movie.original_language && (
                      <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-full border border-white/25 shadow-lg">
                        <span className="text-white font-bold uppercase text-xs tracking-wider">{movie.original_language}</span>
                      </div>
                    )}
                  </div>

                  {/* Overview */}
                  <p className="text-base md:text-lg text-white/95 line-clamp-3 md:line-clamp-4 leading-relaxed drop-shadow-lg max-w-2xl font-medium">
                    {movie.overview}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4 pt-2">
                    <Link to={`/movie/${movie.id}`}>
                      <Button
                        size="lg"
                        className="gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-2xl shadow-red-500/40 hover:shadow-red-500/60 transition-all duration-300 hover:scale-105 text-base font-bold px-8 py-6 rounded-xl border border-red-400/20"
                      >
                        <Info className="h-5 w-5" />
                        More Info
                      </Button>
                    </Link>
                    <Link to={`/movie/${movie.id}`}>
                      <Button
                        size="lg"
                        variant="outline"
                        className="gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/30 text-white hover:text-white shadow-xl transition-all duration-300 hover:scale-105 text-base font-bold px-8 py-6 rounded-xl"
                      >
                        <Play className="h-5 w-5" />
                        Watch Trailer
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Bottom Fade */}
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/70 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 border border-white/20 shadow-xl"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/70 backdrop-blur-md text-white p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 border border-white/20 shadow-xl"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center gap-2">
        {movies.slice(0, 8).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`transition-all duration-300 rounded-full ${
              index === selectedIndex
                ? 'w-10 h-2 bg-gradient-to-r from-red-600 to-pink-600 shadow-lg shadow-red-500/50'
                : 'w-2 h-2 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
