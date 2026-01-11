# Movies.to Backend API

A Node.js/Express backend API for the Movies.to application with MySQL database, JWT authentication, and RESTful endpoints.

## Features

- User authentication (JWT-based)
- Watchlist management
- Movie reviews and ratings
- Comment system with nested replies
- View history tracking
- MySQL database with optimized schema
- Rate limiting and security middleware
- CORS enabled

## Prerequisites

- Node.js 18+ or Bun
- MySQL 8.0+ (for database features)

## Quick Start

### 1. Install Dependencies

```bash
cd backend
bun install
# or
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=movies_to
JWT_SECRET=your_secret_key_here
```

### 3. Install MySQL (if not installed)

#### macOS:
```bash
brew install mysql
brew services start mysql
```

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

#### Windows:
Download and install from [MySQL Downloads](https://dev.mysql.com/downloads/installer/)

### 4. Setup Database

Run the database setup script:

```bash
bun run db:setup
# or
npm run db:setup
```

This will:
- Drop existing `movies_to` database (if exists)
- Create a fresh `movies_to` database
- Create all tables (users, movies, genres, watchlist, reviews, comments, view_history, torrents_cache)
- Set up proper indexes and foreign keys

Note: No mockup data is inserted. You can register users through the API.

### 5. Start the Server

```bash
# Development mode with auto-reload
bun run dev
# or
npm run dev

# Production mode
bun start
# or
npm start
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /health
```
Check if the API is running.

### Authentication

#### Register
```
POST /api/auth/register
Body: { username, email, password }
```

#### Login
```
POST /api/auth/login
Body: { email, password }
Returns: { user, token }
```

#### Get Current User
```
GET /api/auth/me
Headers: { Authorization: Bearer <token> }
```

#### Update Profile
```
PUT /api/auth/profile
Headers: { Authorization: Bearer <token> }
Body: { username?, avatar_url? }
```

### Watchlist

#### Get Watchlist
```
GET /api/watchlist
Headers: { Authorization: Bearer <token> }
```

#### Add to Watchlist
```
POST /api/watchlist
Headers: { Authorization: Bearer <token> }
Body: { movieData: { tmdb_id, title, poster_path, ... } }
```

#### Remove from Watchlist
```
DELETE /api/watchlist/:tmdb_id
Headers: { Authorization: Bearer <token> }
```

#### Check if in Watchlist
```
GET /api/watchlist/check/:tmdb_id
Headers: { Authorization: Bearer <token> }
```

### Reviews

#### Get Movie Reviews
```
GET /api/reviews/movie/:tmdb_id
```

#### Add/Update Review
```
POST /api/reviews/movie/:tmdb_id
Headers: { Authorization: Bearer <token> }
Body: { rating: 1-10, review_text }
```

#### Get User's Review
```
GET /api/reviews/movie/:tmdb_id/user
Headers: { Authorization: Bearer <token> }
```

#### Get Movie Rating
```
GET /api/reviews/movie/:tmdb_id/rating
Returns: { averageRating, reviewCount }
```

#### Delete Review
```
DELETE /api/reviews/:reviewId
Headers: { Authorization: Bearer <token> }
```

### Comments

#### Get Movie Comments
```
GET /api/comments/movie/:tmdb_id
Returns: Comments with nested replies
```

#### Add Comment
```
POST /api/comments/movie/:tmdb_id
Headers: { Authorization: Bearer <token> }
Body: { comment_text, parent_id? }
```

#### Update Comment
```
PUT /api/comments/:commentId
Headers: { Authorization: Bearer <token> }
Body: { comment_text }
```

#### Delete Comment
```
DELETE /api/comments/:commentId
Headers: { Authorization: Bearer <token> }
```

## Database Schema

### Tables

- **users** - User accounts with authentication
- **movies** - Movie data synced from TMDB
- **genres** - Movie genres
- **movie_genres** - Many-to-many relationship
- **watchlist** - User's saved movies
- **reviews** - User movie reviews and ratings
- **comments** - Movie comments with threading
- **view_history** - User viewing history

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- Helmet.js for security headers
- CORS configured for frontend origin
- SQL injection prevention (parameterized queries)
- Input validation

## Testing the API

You can test the API using:

### cURL
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Postman/Insomnia
Import the API endpoints and test with the GUI.

## Troubleshooting

### Database Connection Failed

If you see "Database connection failed":

1. Make sure MySQL is running:
   ```bash
   # macOS
   brew services list

   # Linux
   sudo systemctl status mysql
   ```

2. Check your `.env` credentials:
   - Verify DB_HOST, DB_USER, DB_PASSWORD
   - Try connecting with: `mysql -u root -p`

3. Grant permissions if needed:
   ```sql
   CREATE USER 'your_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON movies_to.* TO 'your_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Port Already in Use

If port 5000 is busy:
1. Change PORT in `.env`
2. Or kill the process: `lsof -ti:5000 | xargs kill`

## Development

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # MySQL connection pool
│   │   ├── schema.sql        # Database schema
│   │   └── setupDatabase.js  # DB setup script
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── watchlistController.js
│   │   ├── reviewController.js
│   │   └── commentController.js
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   └── errorHandler.js  # Error handling
│   ├── routes/
│   │   ├── auth.js
│   │   ├── watchlist.js
│   │   ├── reviews.js
│   │   └── comments.js
│   └── server.js            # Express app
├── .env
├── .env.example
└── package.json
```

## License

MIT
