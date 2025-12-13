import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Film, Menu, X, User, LogOut, Bookmark, Search } from 'lucide-react';
import { useAuthStore, useThemeStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchAutocomplete from '@/components/common/SearchAutocomplete';

export default function Navbar() {
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
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-2xl font-bold group">
            <Film className="h-8 w-8 text-red-600 group-hover:rotate-12 transition-transform duration-300" />
            <span className="hidden sm:inline bg-gradient-to-r from-red-600 via-pink-600 to-red-600 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:via-red-600 group-hover:to-pink-600 transition-all duration-500">
              Movies.to
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="relative font-medium hover:text-red-600 transition-colors duration-300 group">
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/browse" className="relative font-medium hover:text-red-600 transition-colors duration-300 group">
              Browse
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/genres" className="relative font-medium hover:text-red-600 transition-colors duration-300 group">
              Genres
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            {isAuthenticated && (
              <Link to="/watchlist" className="relative font-medium hover:text-red-600 transition-colors duration-300 group">
                Watchlist
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-red-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <SearchAutocomplete />
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full hover:bg-muted/80 transition-all duration-300 hover:scale-110"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </Button>

            {isAuthenticated ? (
              <>
                <Link to="/watchlist">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/80 transition-all duration-300 hover:scale-110">
                    <Bookmark className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/80 transition-all duration-300 hover:scale-110">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:bg-red-100 dark:hover:bg-red-950 hover:text-red-600 transition-all duration-300 hover:scale-110">
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="hover:bg-muted/80">Login</Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105">
                    Sign Up
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
          <div className="md:hidden py-4 space-y-4">
            <div className="mb-4">
              <SearchAutocomplete />
            </div>

            <Link
              to="/"
              className="block py-2 hover:text-red-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/browse"
              className="block py-2 hover:text-red-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Browse
            </Link>
            <Link
              to="/genres"
              className="block py-2 hover:text-red-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Genres
            </Link>
            {isAuthenticated && (
              <Link
                to="/watchlist"
                className="block py-2 hover:text-red-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Watchlist
              </Link>
            )}

            <div className="pt-4 border-t space-y-2">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full" variant="outline">
                      Profile
                    </Button>
                  </Link>
                  <Button className="w-full" variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full" variant="outline">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
