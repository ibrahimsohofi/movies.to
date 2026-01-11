import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Film, Menu, X, User, LogOut, Bookmark, Search, Settings, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useThemeStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SearchAutocomplete from '@/components/common/SearchAutocomplete';
import NotificationBell from '@/components/layout/NotificationBell';
import LanguageSelector from '@/components/layout/LanguageSelector';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  // Direction detection
  const isRTL = i18n.language === 'ar';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 border-b border-border/40 shadow-lg shadow-black/5">
      <div className="max-w-full mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-2xl font-bold group">
            <Film className="h-8 w-8 text-red-600 group-hover:rotate-12 transition-transform duration-300" />
            <span className="hidden sm:inline bg-gradient-to-r from-red-600 via-pink-600 to-red-600 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:via-red-600 group-hover:to-pink-600 transition-all duration-500">
              Movies.to
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4 xl:space-x-6 ml-2 lg:ml-4 xl:ml-8 text-sm lg:text-base">
            <Link to="/" className={`relative font-medium hover:text-red-600 transition-colors duration-300 ${isRTL ? 'underline-rtl' : 'underline-ltr'}`}>
              {t('nav.home')}
            </Link>
            <Link to="/browse" className={`relative font-medium hover:text-red-600 transition-colors duration-300 ${isRTL ? 'underline-rtl' : 'underline-ltr'}`}>
              {t('nav.browse')}
            </Link>
            <Link to="/genres" className={`relative font-medium hover:text-red-600 transition-colors duration-300 ${isRTL ? 'underline-rtl' : 'underline-ltr'}`}>
              {t('nav.genres')}
            </Link>
            <Link to="/about" className={`relative font-medium hover:text-red-600 transition-colors duration-300 ${isRTL ? 'underline-rtl' : 'underline-ltr'}`}>
              {t('nav.about')}
            </Link>
            <Link to="/quizzes" className={`relative font-medium hover:text-red-600 transition-colors duration-300 ${isRTL ? 'underline-rtl' : 'underline-ltr'}`}>
              {t('nav.quizzes')}
            </Link>
            <Link to="/premium" className={`relative font-medium bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent hover:from-yellow-400 hover:to-orange-400 transition-all duration-300 ${isRTL ? 'underline-rtl' : 'underline-ltr'}`}>
              {t('nav.premium')}
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/watchlist" className={`relative font-medium hover:text-red-600 transition-colors duration-300 ${isRTL ? 'underline-rtl' : 'underline-ltr'}`}>
                  {t('nav.watchlist')}
                </Link>
                <Link to="/lists" className={`relative font-medium hover:text-red-600 transition-colors duration-300 ${isRTL ? 'underline-rtl' : 'underline-ltr'}`}>
                  {t('nav.lists')}
                </Link>
                <Link to="/feed" className={`relative font-medium hover:text-red-600 transition-colors duration-300 ${isRTL ? 'underline-rtl' : 'underline-ltr'}`}>
                  {t('nav.feed')}
                </Link>
              </>
            )}
          </div>

          {/* Expandable Search Icon */}
          <div className="hidden md:flex items-center overflow-hidden">
            <SearchAutocomplete />
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-2 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full hover:bg-muted/80 transition-all duration-300 hover:scale-110"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </Button>

            <LanguageSelector />

            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Link to="/watchlist">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/80 transition-all duration-300 hover:scale-110">
                    <Bookmark className="h-5 w-5" />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/80 transition-all duration-300 hover:scale-110">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>{t('nav.profile')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t('nav.dashboard')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/recommendations" className="cursor-pointer">
                        <Search className="mr-2 h-4 w-4" />
                        <span>{t('nav.recommendations')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-ratings" className="cursor-pointer">
                        <Star className="mr-2 h-4 w-4" />
                        <span>{t('nav.myRatings')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('nav.logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className={`hover:bg-muted/80 ${isRTL ? 'btn-hover-rtl' : 'btn-hover-ltr'}`}>{t('nav.login')}</Button>
                </Link>
                <Link to="/register">
                  <Button className={`bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 ${isRTL ? 'btn-hover-rtl' : 'btn-hover-ltr'}`}>
                    {t('nav.signup')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-border/40 animate-in slide-in-from-top-4 duration-300">
            <div className="mb-3 animate-in fade-in slide-in-from-top-2 duration-300 delay-75">
              <SearchAutocomplete variant="mobile" />
            </div>

            <Link
              to="/"
              className="block py-2.5 px-2 hover:text-red-600 hover:bg-muted/50 rounded-lg transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/browse"
              className="block py-2.5 px-2 hover:text-red-600 hover:bg-muted/50 rounded-lg transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.browse')}
            </Link>
            <Link
              to="/genres"
              className="block py-2.5 px-2 hover:text-red-600 hover:bg-muted/50 rounded-lg transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.genres')}
            </Link>
            <Link
              to="/about"
              className="block py-2.5 px-2 hover:text-red-600 hover:bg-muted/50 rounded-lg transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.about')}
            </Link>
            <Link
              to="/quizzes"
              className="block py-2.5 px-2 hover:text-red-600 hover:bg-muted/50 rounded-lg transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.quizzes')}
            </Link>
            {isAuthenticated && (
              <Link
                to="/watchlist"
                className="block py-2.5 px-2 hover:text-red-600 hover:bg-muted/50 rounded-lg transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.watchlist')}
              </Link>
            )}

            <div className="pt-3 border-t border-border/40 space-y-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="w-full justify-start hover:bg-muted/80 transition-all"
              >
                {theme === 'dark' ? '🌙' : '☀️'} {theme === 'dark' ? t('common.darkMode') : t('common.lightMode')}
              </Button>

              <LanguageSelector variant="full" />

              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full" variant="outline">
                      <User className="h-4 w-4 mr-2" />
                      {t('nav.profile')}
                    </Button>
                  </Link>
                  <Button className="w-full" variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('nav.logout')}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full">
                    <Button className="w-full" variant="outline">
                      {t('nav.login')}
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="w-full">
                    <Button className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg shadow-red-500/30">
                      {t('nav.signup')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
