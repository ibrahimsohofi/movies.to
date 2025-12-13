import { Link } from 'react-router-dom';
import { Film, Github, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-background border-t mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
              <Film className="h-6 w-6 text-red-600" />
              <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                Movies.to
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your ultimate destination for discovering amazing movies.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-red-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/browse" className="hover:text-red-600 transition-colors">
                  Browse Movies
                </Link>
              </li>
              <li>
                <Link to="/genres" className="hover:text-red-600 transition-colors">
                  Genres
                </Link>
              </li>
              <li>
                <Link to="/watchlist" className="hover:text-red-600 transition-colors">
                  My Watchlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/genre/28" className="hover:text-red-600 transition-colors">
                  Action
                </Link>
              </li>
              <li>
                <Link to="/genre/35" className="hover:text-red-600 transition-colors">
                  Comedy
                </Link>
              </li>
              <li>
                <Link to="/genre/18" className="hover:text-red-600 transition-colors">
                  Drama
                </Link>
              </li>
              <li>
                <Link to="/genre/27" className="hover:text-red-600 transition-colors">
                  Horror
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-600 transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-red-600 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Movies.to. All rights reserved. Data provided by{' '}
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
