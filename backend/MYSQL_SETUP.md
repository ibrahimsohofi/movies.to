# MySQL Database Setup Guide

This application now uses **MySQL** as its database. Follow these steps to set up the database for production.

## Prerequisites

- MySQL Server 8.0 or higher (or MariaDB 10.5+)
- MySQL client tools
- Access to a MySQL server with database creation privileges

## Configuration

### 1. Update Environment Variables

Edit `backend/.env` file with your MySQL credentials:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=movies_to
DB_PORT=3306
```

### 2. Create the Database

You have two options:

#### Option A: Automatic Setup (Recommended)

Run the setup script which will:
- Connect to MySQL
- Create the database
- Create all tables
- Insert default data (genres and achievements)

```bash
cd backend
bun run db:setup
```

#### Option B: Manual Setup

1. Connect to MySQL:
```bash
mysql -u your_username -p
```

2. Create the database:
```sql
CREATE DATABASE movies_to CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE movies_to;
```

3. Import the schema:
```bash
mysql -u your_username -p movies_to < src/config/schema.sql
```

## Database Tables

The application creates the following tables:

### Core Tables
- `users` - User accounts and authentication
- `movies` - Movie information from TMDB
- `genres` - Movie genres
- `movie_genres` - Junction table for movies and genres

### User Features
- `watchlist` - User's saved movies
- `reviews` - User reviews with ratings
- `comments` - Movie comments and replies
- `view_history` - Track watched movies

### Social Features
- `user_follows` - User following relationships
- `lists` - User-created movie lists
- `list_items` - Movies in lists
- `notifications` - User notifications
- `activity_feed` - User activity tracking

### Advanced Features
- `quizzes` - Movie quizzes
- `quiz_questions` - Quiz questions
- `quiz_answers` - Quiz answer options
- `quiz_results` - User quiz results
- `achievements` - Achievement definitions
- `user_achievements` - User achievement progress
- `recommendations_cache` - Cached movie recommendations
- `subscriptions` - Premium user subscriptions
- `torrents_cache` - Cached torrent information

## Production Considerations

### 1. Database Optimization

Configure MySQL for production in `my.cnf` or `my.ini`:

```ini
[mysqld]
# Performance
innodb_buffer_pool_size = 1G
max_connections = 200
query_cache_size = 32M

# Character Set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Timezone
default-time-zone = '+00:00'
```

### 2. Security

- **Never** use root user for the application
- Create a dedicated MySQL user:

```sql
CREATE USER 'movies_to_app'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON movies_to.* TO 'movies_to_app'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Backups

Set up regular backups:

```bash
# Daily backup script
mysqldump -u movies_to_app -p movies_to > backup_$(date +%Y%m%d).sql

# With compression
mysqldump -u movies_to_app -p movies_to | gzip > backup_$(date +%Y%m%d).sql.gz
```

### 4. Monitoring

Monitor these metrics:
- Connection pool usage
- Query performance
- Slow query log
- Disk space
- Memory usage

## Troubleshooting

### Connection Errors

**Error**: `ER_ACCESS_DENIED_ERROR`
- Check username and password in `.env`
- Verify user has correct privileges

**Error**: `ECONNREFUSED`
- Ensure MySQL server is running
- Check `DB_HOST` and `DB_PORT` in `.env`

**Error**: `ER_BAD_DB_ERROR`
- Database doesn't exist
- Run `bun run db:setup` to create it

### Character Set Issues

If you see garbled characters:

```sql
ALTER DATABASE movies_to CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Performance Issues

- Enable slow query log to identify bottlenecks
- Add appropriate indexes
- Increase `innodb_buffer_pool_size`
- Optimize queries with EXPLAIN

## Support

For database-related issues:
1. Check MySQL error logs
2. Review application logs
3. Verify `.env` configuration
4. Ensure MySQL version compatibility
