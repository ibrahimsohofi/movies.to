# 🎬 Movies.to - Movie Discovery Platform

A modern, feature-rich movie discovery platform built with React, Tailwind CSS, and MySQL.

## ✨ Features

### Frontend Features
- **Browse Movies**: Explore trending, popular, top-rated, and upcoming movies
- **Advanced Search**: Find movies with real-time search and filters
- **Movie Details**: View comprehensive information including cast, crew, ratings, trailers, and torrents
- **Watchlist**: Save and manage your personal watchlist
- **User Authentication**: Register and login with JWT authentication
- **Social Features**: Follow users, create lists, write reviews, and comment
- **Multi-language Support**: Available in 9 languages (EN, ES, FR, DE, IT, PT, JA, KO, AR)
- **Dark/Light Mode**: Toggle between themes
- **PWA Support**: Install as a Progressive Web App
- **Responsive Design**: Beautiful UI that works on all devices

### Backend Features
- **MySQL Database**: Production-ready relational database
- **RESTful API**: Complete API for all features
- **Authentication**: Secure JWT-based auth with bcrypt password hashing
- **Social Features**: User follows, activity feeds, notifications
- **Premium Subscriptions**: Stripe integration for premium tiers
- **Gamification**: Quizzes, achievements, and points system
- **Email Service**: Email verification and password reset
- **OAuth Support**: Google, GitHub, and Facebook login
- **Caching**: Redis support for performance optimization
- **Real-time Updates**: Socket.io for live notifications

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** or **Bun** (recommended)
- **MySQL 8.0+** (required for backend)
- **TMDB API Key** (free)

### 1. Get Your TMDB API Key

1. Visit [The Movie Database (TMDB)](https://www.themoviedb.org/)
2. Create a free account
3. Go to Settings → API
4. Request an API key (it's free!)
5. Copy your API Key (v3 auth)

### 2. Clone and Install

```bash
git clone https://github.com/ibrahimsohofi/movies.to.git
cd movies.to

# Install frontend dependencies
bun install
# or npm install

# Install backend dependencies
cd backend
bun install
# or npm install
```

### 3. Configure Environment Variables

#### Frontend Configuration

Create `.env` in the root directory:

```env
# TMDB API Configuration
VITE_TMDB_API_KEY=your_tmdb_api_key_here
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p

# Backend API
VITE_API_BASE_URL=http://localhost:5000/api
```

#### Backend Configuration

Create `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MySQL Database Configuration (REQUIRED)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=movies_to
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# TMDB API (for syncing movie data)
TMDB_API_KEY=your_tmdb_api_key_here
```

### 4. Set Up MySQL Database

**Important**: This application uses MySQL exclusively. SQLite has been removed.

```bash
cd backend
bun run db:setup
# or npm run db:setup
```

This will create the database and all necessary tables automatically.

For detailed MySQL setup instructions, see [backend/MYSQL_SETUP.md](backend/MYSQL_SETUP.md)

### 5. Run the Application

```bash
# From the root directory, run both frontend and backend:
bun run dev
# or npm run dev
```

This starts:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Zustand** for state management
- **React Router v6** for routing
- **Axios** for HTTP requests
- **Socket.io Client** for real-time features
- **i18next** for internationalization

### Backend
- **Node.js** / **Express**
- **MySQL** (production database)
- **JWT** for authentication
- **bcrypt** for password hashing
- **Passport.js** for OAuth
- **Socket.io** for real-time features
- **Stripe** for payments
- **Resend/Nodemailer** for emails
- **Redis** (optional caching)

## 📁 Project Structure

```
movies.to/
├── src/                      # Frontend source
│   ├── components/          # React components
│   │   ├── layout/         # Navbar, Footer, etc.
│   │   ├── movie/          # Movie-related components
│   │   ├── ui/             # shadcn UI components
│   │   └── common/         # Shared components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── store/              # State management
│   ├── i18n/               # Translations
│   └── App.jsx             # Main app
├── backend/                 # Backend source
│   ├── src/
│   │   ├── config/         # Database & config
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic
│   └── .env                # Backend environment
├── .env                     # Frontend environment
└── package.json
```

## 🎯 Available Features

### Authentication & Users
- ✅ Email/Password registration and login
- ✅ JWT token authentication
- ✅ Email verification
- ✅ Password reset
- ✅ OAuth (Google, GitHub, Facebook)
- ✅ User profiles with avatars
- ✅ Profile customization

### Movies & Content
- ✅ Browse movies (trending, popular, top-rated, upcoming)
- ✅ Advanced search with filters
- ✅ Movie details with cast, crew, and trailers
- ✅ Genre browsing
- ✅ Person (actor/director) pages
- ✅ Movie recommendations
- ✅ Torrent information (via YTS)
- ✅ "Where to Watch" providers

### User Features
- ✅ Personal watchlist
- ✅ View history tracking
- ✅ Custom movie lists
- ✅ Movie reviews and ratings
- ✅ Comments with threading
- ✅ User follows/followers
- ✅ Activity feed
- ✅ Notifications

### Gamification
- ✅ Movie quizzes
- ✅ Achievements system
- ✅ Points and levels
- ✅ Leaderboards

### Premium Features
- ✅ Subscription tiers
- ✅ Stripe payment integration
- ✅ Premium badges
- ✅ Ad-free experience

## 🗄️ Database

This application uses **MySQL only**. All SQLite code has been removed for production readiness.

### Tables Created:
- Users & Authentication
- Movies & Genres
- Watchlist & View History
- Reviews & Comments
- Lists & List Items
- Social (Follows, Activity, Notifications)
- Quizzes & Achievements
- Subscriptions & Payments
- Cache Tables

See [backend/MYSQL_SETUP.md](backend/MYSQL_SETUP.md) for detailed schema information.

## 🔧 Development

### Run Tests
```bash
# Frontend tests
bun test
# or npm test

# Backend tests
cd backend
bun test
```

### Linting & Formatting
```bash
bun run lint
bun run format
```

### Build for Production
```bash
# Frontend build
bun run build

# Backend (no build needed, runs with Node.js)
cd backend
bun start
```

## 📚 Documentation

- [Backend Setup & API](backend/README.md)
- [MySQL Setup Guide](backend/MYSQL_SETUP.md)
- [Database Import Instructions](backend/DB_IMPORT_INSTRUCTIONS.md)

## 🌐 Deployment

The application can be deployed to:
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Backend**: Any Node.js hosting (Railway, Render, DigitalOcean, AWS, etc.)
- **Database**: Managed MySQL (PlanetScale, AWS RDS, DigitalOcean Managed Databases)

Make sure to:
1. Set up MySQL database in production
2. Configure all environment variables
3. Update CORS settings for your domain
4. Set up SSL/HTTPS
5. Configure OAuth callbacks for production URLs

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT

## 🙏 Credits

- Movie data from [TMDB](https://www.themoviedb.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
# movies.to
# movies.to
# movies.to
# movies.to
# movies.to
# movies.to
