import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Film, Menu, X, User, LogOut, Bookmark, Search, Settings } from 'lucide-react';
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
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 border-b border-border/40 shadow-lg shadow-black/5">
      <div className="max-w-full mx-auto pl-3 pr-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2 text-xl sm:text-2xl font-bold group flex-shrink-0">
            <Film className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 group-hover:rotate-12 transition-transform duration-300" />
            <span className="hidden xs:inline sm:inline bg-gradient-to-r from-red-600 via-pink-600 to-red-600 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:via-red-600 group-hover:to-pink-600 transition-all duration-500">
              Movies.to
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4 xl:space-x-6 ml-2 lg:ml-4 xl:ml-8 text-sm lg:text-base">
            <Link to="/" className="relative font-medium hover:text-red-600 transition-colors duration-300 group">
              {t('nav.home')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/browse" className="relative font-medium hover:text-red-600 transition-colors duration-300 group">
              {t('nav.browse')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/genres" className="relative font-medium hover:text-red-600 transition-colors duration-300 group">
              {t('nav.genres')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/about" className="relative font-medium hover:text-red-600 transition-colors duration-300 group">
              {t('nav.about')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/quizzes" className="relative font-medium hover:text-red-600 transition-colors duration-300 group">
              {t('nav.quizzes')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/premium" className="relative font-medium bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent hover:from-yellow-400 hover:to-orange-400 transition-all duration-300 group">
              {t('nav.premium')}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/watchlist" className="relative font-medium hover:text-red-600 transition-colors duration-300 group">
                  {t('nav.watchlist')}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link to="/lists" className="relative font-medium hover:text-red-600 transition-colors duration-300 group">
                  {t('nav.lists')}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link to="/feed" className="relative font-medium hover:text-red-600 transition-colors duration-300 group">
                  {t('nav.feed')}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
              </>
            )}
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
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
                  <Button variant="ghost" className="hover:bg-muted/80">{t('nav.login')}</Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105">
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
            className="md:hidden flex-shrink-0"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 pl-2 pr-0 space-y-3 border-t border-border/40 animate-in slide-in-from-top-4 duration-300">
            <div className="mb-3 animate-in fade-in slide-in-from-top-2 duration-300 delay-75 pr-2">
              <SearchAutocomplete />
            </div>

            <Link
              to="/"
              className="block py-2.5 pl-3 pr-2 text-center hover:text-red-600 hover:bg-muted/50 rounded-lg transition-all font-medium mr-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/browse"
              className="block py-2.5 pl-3 pr-2 text-center hover:text-red-600 hover:bg-muted/50 rounded-lg transition-all font-medium mr-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.browse')}
            </Link>
            <Link
              to="/genres"
              className="block py-2.5 pl-3 pr-2 text-center hover:text-red-600 hover:bg-muted/50 rounded-lg transition-all font-medium mr-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.genres')}
            </Link>
            <Link
              to="/about"
              className="block py-2.5 pl-3 pr-2 text-center hover:text-red-600 hover:bg-muted/50 rounded-lg transition-all font-medium mr-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.about')}
            </Link>
            <Link
              to="/quizzes"
              className="block py-2.5 pl-3 pr-2 text-center hover:text-red-600 hover:bg-muted/50 rounded-lg transition-all font-medium mr-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.quizzes')}
            </Link>
            {isAuthenticated && (
              <Link
                to="/watchlist"
                className="block py-2.5 pl-3 pr-2 text-center hover:text-red-600 hover:bg-muted/50 rounded-lg transition-all font-medium mr-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.watchlist')}
              </Link>
            )}

            <div className="pt-3 border-t border-border/40 space-y-3 pr-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="w-full justify-center hover:bg-muted/80 transition-all text-base"
              >
                {theme === 'dark' ? '🌙' : '☀️'} {theme === 'dark' ? t('common.darkMode') : t('common.lightMode')}
              </Button>

              <div className="flex justify-center">
                <LanguageSelector variant="full" />
              </div>

              {isAuthenticated ? (
                <div className="space-y-3">
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block">
                    <Button className="w-full justify-center text-base" variant="outline">
                      <User className="h-4 w-4 mr-2" />
                      {t('nav.profile')}
                    </Button>
                  </Link>
                  <Button className="w-full justify-center text-base" variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('nav.logout')}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pr-2">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full block">
                    <Button className="w-full justify-center text-base font-medium" variant="outline">
                      {t('nav.login')}
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="w-full block">
                    <Button className="w-full justify-center text-base font-medium bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg shadow-red-500/30">
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
