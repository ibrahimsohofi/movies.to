import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Calendar, MapPin, Film, TrendingUp, ImageIcon, ExternalLink, Instagram, Twitter, Facebook } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tmdbAPI, getImageUrl } from '@/services/tmdb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import MovieCard from '@/components/movie/MovieCard';
import MetaTags from '@/components/common/MetaTags';

export default function PersonDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to translate department names
  const translateDepartment = (department) => {
    if (!department) return '';
    // Try to get translation from person.departments, fallback to original
    const translationKey = `person.departments.${department}`;
    const translated = t(translationKey);
    // If translation key is returned as-is, it means no translation exists
    return translated === translationKey ? department : translated;
  };

  useEffect(() => {
    const fetchPersonDetails = async () => {
      try {
        setLoading(true);
        const response = await tmdbAPI.getPersonDetails(id);
        setPerson(response);
      } catch (error) {
        console.error('Error fetching person details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="h-[50vh] bg-muted animate-pulse" />
        <div className="container mx-auto px-4 -mt-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="h-[450px] bg-muted animate-pulse rounded-xl" />
            </div>
            <div className="lg:col-span-3 space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
              <div className="h-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Person Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The person you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Get filmography organized by department
  const movieCredits = person.movie_credits || {};
  const cast = (movieCredits.cast || []).sort((a, b) => {
    const dateA = a.release_date || '';
    const dateB = b.release_date || '';
    return dateB.localeCompare(dateA);
  });

  const crew = (movieCredits.crew || []).sort((a, b) => {
    const dateA = a.release_date || '';
    const dateB = b.release_date || '';
    return dateB.localeCompare(dateA);
  });

  // Group crew by department
  const crewByDepartment = crew.reduce((acc, credit) => {
    const dept = credit.department || 'Other';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(credit);
    return acc;
  }, {});

  // Get photos
  const photos = person.images?.profiles || [];

  // Calculate age if birthday is available
  const calculateAge = (birthday, deathday) => {
    if (!birthday) return null;
    const birth = new Date(birthday);
    const end = deathday ? new Date(deathday) : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const age = calculateAge(person.birthday, person.deathday);

  return (
    <>
      <MetaTags
        title={`${person.name} - Movies.to`}
        description={person.biography?.substring(0, 155) || `View ${person.name}'s filmography, biography, and photos.`}
        image={person.profile_path ? getImageUrl(person.profile_path, 'w500') : null}
      />

      <div className="min-h-screen">
        {/* Hero Section with Person Photo as Background */}
        <div className="relative h-[40vh] md:h-[45vh] -mt-16 overflow-hidden">
          {person.profile_path ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${getImageUrl(person.profile_path, 'original')})`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/60" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/50 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-background to-background" />
          )}

          {/* Person Name Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="container mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-2 text-white drop-shadow-2xl">
                {person.name}
              </h1>
              {person.known_for_department && (
                <p className="text-xl md:text-2xl text-white/90 drop-shadow-lg">
                  {translateDepartment(person.known_for_department)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Left Column - Profile Info (Sticky) */}
            <div className="lg:sticky lg:top-20 lg:self-start space-y-4 lg:space-y-6">
              {/* Profile Image */}
              <Card className="overflow-hidden border-2 shadow-xl">
                <div className="aspect-[2/3] relative bg-muted">
                  {person.profile_path ? (
                    <img
                      src={getImageUrl(person.profile_path, 'w500')}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                      <User className="h-32 w-32 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold text-lg">{t('person.personalInfo')}</h3>

                  {person.known_for_department && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('person.knownFor')}</p>
                      <Badge variant="secondary" className="bg-red-600/10 text-red-600 border-red-600/20">
                        {translateDepartment(person.known_for_department)}
                      </Badge>
                    </div>
                  )}

                  {person.gender && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('person.gender')}</p>
                      <p className="font-medium">
                        {person.gender === 1 ? t('person.female') : person.gender === 2 ? t('person.male') : t('person.nonbinary')}
                      </p>
                    </div>
                  )}

                  {person.birthday && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('person.birthday')}</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-red-600" />
                        <p className="font-medium text-sm">
                          {new Date(person.birthday).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                          {age && ` (${person.deathday ? t('person.diedAt') + ' ' : ''}${age})`}
                        </p>
                      </div>
                    </div>
                  )}

                  {person.deathday && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('person.dayOfDeath')}</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-red-600" />
                        <p className="font-medium text-sm">
                          {new Date(person.deathday).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {person.place_of_birth && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('person.placeOfBirth')}</p>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="font-medium text-sm">{person.place_of_birth}</p>
                      </div>
                    </div>
                  )}

                  {person.popularity && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('person.popularity')}</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-red-600" />
                        <p className="font-medium">{person.popularity.toFixed(1)}</p>
                      </div>
                    </div>
                  )}

                  {person.also_known_as && person.also_known_as.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t('person.alsoKnownAs')}</p>
                      <div className="space-y-1">
                        {person.also_known_as.slice(0, 3).map((name, index) => (
                          <p key={index} className="text-sm font-medium">{name}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* External Links - Icon Based */}
              {person.external_ids && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-base mb-4">{t('person.links')}</h3>
                    <div className="flex gap-3">
                      {person.external_ids.imdb_id && (
                        <a
                          href={`https://www.imdb.com/name/${person.external_ids.imdb_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 hover:border-yellow-500/50 transition-all group"
                          title="IMDb"
                        >
                          <span className="text-yellow-600 font-bold text-sm group-hover:scale-110 transition-transform">
                            IMDb
                          </span>
                        </a>
                      )}
                      {person.external_ids.instagram_id && (
                        <a
                          href={`https://www.instagram.com/${person.external_ids.instagram_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 hover:border-pink-500/50 transition-all group"
                          title="Instagram"
                        >
                          <Instagram className="h-5 w-5 text-pink-600 group-hover:scale-110 transition-transform" />
                        </a>
                      )}
                      {person.external_ids.twitter_id && (
                        <a
                          href={`https://twitter.com/${person.external_ids.twitter_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 transition-all group"
                          title="Twitter/X"
                        >
                          <Twitter className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                        </a>
                      )}
                      {person.external_ids.facebook_id && (
                        <a
                          href={`https://www.facebook.com/${person.external_ids.facebook_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 hover:border-blue-600/50 transition-all group"
                          title="Facebook"
                        >
                          <Facebook className="h-5 w-5 text-blue-700 group-hover:scale-110 transition-transform" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Biography */}
              {person.biography && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-4">{t('person.biography')}</h2>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      {person.biography.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="mb-4 text-foreground/90 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Filmography with Grid Layout */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">{t('person.filmography')}</h2>

                  <Tabs defaultValue="acting" className="w-full">
                    <TabsList className="mb-6">
                      {cast.length > 0 && (
                        <TabsTrigger value="acting" className="flex items-center gap-2">
                          <Film className="h-4 w-4" />
                          {t('person.acting')} ({cast.length})
                        </TabsTrigger>
                      )}
                      {Object.keys(crewByDepartment).map((dept) => (
                        <TabsTrigger key={dept} value={dept.toLowerCase()} className="flex items-center gap-2">
                          {translateDepartment(dept)} ({crewByDepartment[dept].length})
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {/* Acting Credits - Grid Layout */}
                    {cast.length > 0 && (
                      <TabsContent value="acting">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {cast.map((movie) => (
                            <Link
                              key={`${movie.id}-${movie.credit_id}`}
                              to={`/movie/${movie.id}`}
                              className="group"
                            >
                              <div className="relative overflow-hidden rounded-lg bg-muted hover:shadow-xl transition-all hover:scale-105">
                                <div className="aspect-[2/3] relative">
                                  {movie.poster_path ? (
                                    <img
                                      src={getImageUrl(movie.poster_path, 'w342')}
                                      alt={movie.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                                      <Film className="h-12 w-12 text-muted-foreground/40" />
                                    </div>
                                  )}
                                  {movie.vote_average > 0 && (
                                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                                      <span className="text-yellow-500 text-xs">★</span>
                                      <span className="text-white text-xs font-bold">
                                        {movie.vote_average.toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="p-2">
                                  <p className="font-semibold text-sm line-clamp-2 group-hover:text-red-600 transition-colors">
                                    {movie.title}
                                  </p>
                                  {movie.character && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                      {movie.character}
                                    </p>
                                  )}
                                  {movie.release_date && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(movie.release_date).getFullYear()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </TabsContent>
                    )}

                    {/* Crew Credits by Department - Grid Layout */}
                    {Object.entries(crewByDepartment).map(([dept, credits]) => (
                      <TabsContent key={dept} value={dept.toLowerCase()}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {credits.map((movie) => (
                            <Link
                              key={`${movie.id}-${movie.credit_id}`}
                              to={`/movie/${movie.id}`}
                              className="group"
                            >
                              <div className="relative overflow-hidden rounded-lg bg-muted hover:shadow-xl transition-all hover:scale-105">
                                <div className="aspect-[2/3] relative">
                                  {movie.poster_path ? (
                                    <img
                                      src={getImageUrl(movie.poster_path, 'w342')}
                                      alt={movie.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                                      <Film className="h-12 w-12 text-muted-foreground/40" />
                                    </div>
                                  )}
                                  {movie.vote_average > 0 && (
                                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                                      <span className="text-yellow-500 text-xs">★</span>
                                      <span className="text-white text-xs font-bold">
                                        {movie.vote_average.toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="p-2">
                                  <p className="font-semibold text-sm line-clamp-2 group-hover:text-red-600 transition-colors">
                                    {movie.title}
                                  </p>
                                  {movie.job && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                      {movie.job}
                                    </p>
                                  )}
                                  {movie.release_date && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(movie.release_date).getFullYear()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              {/* Photos Gallery */}
              {photos.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ImageIcon className="h-5 w-5 text-red-600" />
                      <h2 className="text-2xl font-bold">{t('person.photos')}</h2>
                      <span className="text-muted-foreground">({photos.length})</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {photos.slice(0, 12).map((photo, index) => (
                        <div
                          key={index}
                          className="aspect-[2/3] rounded-lg overflow-hidden bg-muted group cursor-pointer hover:shadow-xl transition-all"
                        >
                          <img
                            src={getImageUrl(photo.file_path, 'w300')}
                            alt={`${person.name} photo ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                    {photos.length > 12 && (
                      <p className="text-center text-sm text-muted-foreground mt-4">
                        {t('person.showingPhotos', { count: 12, total: photos.length })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
