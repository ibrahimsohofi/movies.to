import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Bookmark, User, Search } from 'lucide-react';
import { useAuthStore } from '@/store/useStore';

export default function BottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/browse', label: 'Browse', icon: Compass },
    { path: '/search', label: 'Search', icon: Search },
    { path: '/watchlist', label: 'Watchlist', icon: Bookmark, auth: true },
    { path: isAuthenticated ? '/dashboard' : '/login', label: isAuthenticated ? 'Profile' : 'Login', icon: User },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/40 shadow-2xl shadow-black/20 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          // Skip watchlist if not authenticated
          if (item.auth && !isAuthenticated) return null;

          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-300 relative group ${
                active ? 'text-red-600' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {/* Active indicator */}
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-full shadow-lg shadow-red-500/50" />
              )}

              {/* Icon with bounce animation on active */}
              <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                <Icon className={`h-5 w-5 ${active ? 'fill-red-600/20' : ''}`} strokeWidth={active ? 2.5 : 2} />
              </div>

              {/* Label */}
              <span className={`text-[10px] font-medium transition-all duration-300 ${active ? 'opacity-100 translate-y-0' : 'opacity-70'}`}>
                {item.label}
              </span>

              {/* Glow effect on hover */}
              {active && (
                <div className="absolute inset-0 bg-gradient-to-t from-red-600/10 to-transparent rounded-t-xl pointer-events-none" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
