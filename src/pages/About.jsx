import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Film, Users, Target, Heart, Zap, Shield, TrendingUp, Award } from 'lucide-react';
import MetaTags from '@/components/common/MetaTags';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime = null;
          const startValue = 0;

          // Parse end value (e.g., "1M+" -> 1000000)
          let endValue = end;
          if (typeof end === 'string') {
            endValue = parseFloat(end.replace(/[^0-9.]/g, ''));
            if (end.includes('M')) endValue *= 1000000;
            if (end.includes('K')) endValue *= 1000;
          }

          const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentCount = Math.floor(easeOutQuart * (endValue - startValue) + startValue);

            setCount(currentCount);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => {
      if (countRef.current) {
        observer.unobserve(countRef.current);
      }
    };
  }, [end, duration, hasAnimated]);

  const formatCount = (num) => {
    if (typeof end === 'string' && end.includes('M')) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (typeof end === 'string' && end.includes('K')) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toLocaleString();
  };

  return (
    <span ref={countRef}>
      {formatCount(count)}{suffix}
    </span>
  );
};

export default function About() {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      icon: Film,
      title: t('about.features.extensive.title'),
      description: t('about.features.extensive.description'),
    },
    {
      icon: Zap,
      title: t('about.features.fast.title'),
      description: t('about.features.fast.description'),
    },
    {
      icon: Users,
      title: t('about.features.community.title'),
      description: t('about.features.community.description'),
    },
    {
      icon: Shield,
      title: t('about.features.privacy.title'),
      description: t('about.features.privacy.description'),
    },
  ];

  const stats = [
    { value: '800K+', label: t('about.stats.movies') },
    { value: '10K+', label: t('about.stats.users') },
    { value: '25K+', label: t('about.stats.reviews') },
    { value: '99.9%', label: t('about.stats.uptime') },
  ];

  const values = [
    {
      icon: Target,
      title: t('about.values.mission.title'),
      description: t('about.values.mission.description'),
    },
    {
      icon: Heart,
      title: t('about.values.passion.title'),
      description: t('about.values.passion.description'),
    },
    {
      icon: TrendingUp,
      title: t('about.values.vision.title'),
      description: t('about.values.vision.description'),
    },
  ];

  return (
    <>
      <MetaTags
        title={`${t('about.title')} - Movies.to`}
        description={t('about.description')}
      />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-500 mb-6">
            <Film className="h-5 w-5" />
            <span className="text-sm font-medium">{t('about.aboutMoviesTo')}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
            {t('about.tagline')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('about.description')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-red-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Our Story */}
        <Card className="mb-16 shadow-lg border-2">
          <CardContent className="pt-8 pb-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">{t('about.ourStory')}</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>{t('about.storyParagraph1')}</p>
                  <p>{t('about.storyParagraph2')}</p>
                  <p>{t('about.storyParagraph3')}</p>
                  <p>{t('about.storyParagraph4')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center">
                  <Film className="h-16 w-16 text-red-500" />
                </div>
                <div className="aspect-square rounded-lg bg-gradient-to-br from-red-600/20 to-red-700/20 flex items-center justify-center">
                  <Users className="h-16 w-16 text-red-600" />
                </div>
                <div className="aspect-square rounded-lg bg-gradient-to-br from-red-700/20 to-red-800/20 flex items-center justify-center">
                  <Heart className="h-16 w-16 text-red-700" />
                </div>
                <div className="aspect-square rounded-lg bg-gradient-to-br from-red-800/20 to-red-900/20 flex items-center justify-center">
                  <Award className="h-16 w-16 text-red-800" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mission, Passion, Vision */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">{t('about.whatDrivesUs')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-2">
                  <CardContent className="pt-6">
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 inline-block">
                      <Icon className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">{t('about.whyChooseUs')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-red-500/10 flex-shrink-0">
                        <Icon className="h-6 w-6 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">{t('about.meetTheTeam')}</h2>
          <div className="flex justify-center">
            <Card className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border-2 max-w-sm w-full">
              <CardContent className="pt-6 text-center">
                <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden border-4 border-red-500 shadow-lg">
                  <img
                    src="/team-photos/ibrahim-sohofi.jpg"
                    alt="Ibrahim Sohofi"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://avatars.githubusercontent.com/u/78817932?v=4";
                    }}
                  />
                </div>
                <h3 className="font-bold text-xl mb-1">Ibrahim Sohofi</h3>
                <p className="text-red-500 text-sm mb-3">{t('about.team.role')}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {t('about.team.bio')}
                </p>
                <div className="flex justify-center gap-3 flex-wrap">
                  <a
                    href="https://github.com/ibrahimsohofi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                  <a
                    href="https://www.linkedin.com/in/ibrahimsohofi/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                  <a
                    href="https://twitter.com/Ibrahimsohofi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    Twitter
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technology */}
        <Card className="mb-16 shadow-lg border-2">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-3xl font-bold mb-6 text-center">{t('about.builtWithTech')}</h2>
            <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-8">
              {t('about.techDescription')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['React', 'Vite', 'Tailwind CSS', 'Node.js', 'Express', 'MySQL', 'TMDB API'].map((tech) => (
                <div key={tech} className="px-4 py-2 rounded-full bg-red-500/10 text-red-500 font-medium">
                  {tech}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="shadow-lg bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <h2 className="text-3xl font-bold mb-4">{t('about.joinCommunity')}</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              {t('about.communityDescription')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register">
                <Button variant="secondary" size="lg" className="shadow-lg">
                  {t('about.createFreeAccount')}
                </Button>
              </Link>
              <Link to="/browse">
                <Button variant="outline" size="lg" className="bg-white/10 hover:bg-white/20 text-white border-white/30">
                  {t('about.exploreMovies')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            {t('about.haveQuestions')}
          </p>
          <Link to="/contact">
            <Button variant="outline">
              {t('about.contactUs')}
            </Button>
          </Link>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-red-500 hover:text-red-400 transition-colors inline-flex items-center gap-2"
          >
            {t('about.backToHome')}
          </Link>
        </div>
      </div>
    </>
  );
}
