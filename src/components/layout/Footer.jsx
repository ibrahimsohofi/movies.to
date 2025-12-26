import { Link } from 'react-router-dom';
import { Film, Github } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// X (Twitter) Icon Component
const XIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-background border-t mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
              <Film className="h-6 w-6 text-red-600" />
              <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                Movies.to
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-red-600 transition-colors">
                  {t('footer.home')}
                </Link>
              </li>
              <li>
                <Link to="/browse" className="hover:text-red-600 transition-colors">
                  {t('footer.browseMovies')}
                </Link>
              </li>
              <li>
                <Link to="/genres" className="hover:text-red-600 transition-colors">
                  {t('nav.genres')}
                </Link>
              </li>
              <li>
                <Link to="/watchlist" className="hover:text-red-600 transition-colors">
                  {t('footer.myWatchlist')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-red-600 transition-colors">
                  {t('nav.about')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.categories')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/genre/28" className="hover:text-red-600 transition-colors">
                  {t('footer.action')}
                </Link>
              </li>
              <li>
                <Link to="/genre/35" className="hover:text-red-600 transition-colors">
                  {t('footer.comedy')}
                </Link>
              </li>
              <li>
                <Link to="/genre/18" className="hover:text-red-600 transition-colors">
                  {t('footer.drama')}
                </Link>
              </li>
              <li>
                <Link to="/genre/27" className="hover:text-red-600 transition-colors">
                  {t('footer.horror')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/faq" className="hover:text-red-600 transition-colors">
                  {t('footer.faq')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-red-600 transition-colors">
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-red-600 transition-colors">
                  {t('footer.termsOfService')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-red-600 transition-colors">
                  {t('footer.contactUs')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.connect')}</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com/ibrahimsohofi"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-600 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/ibrahimsohofi"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-600 transition-colors"
                aria-label="X (Twitter)"
              >
                <XIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>
            {t('footer.copyright', { year: new Date().getFullYear() })} {t('footer.dataBy')}{' '}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:underline"
            >
              TMDB
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
