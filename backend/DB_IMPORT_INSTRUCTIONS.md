# Database Import Instructions

This file explains how to import the `db.sql` file into your MySQL database.

## Prerequisites

- MySQL installed and running
- MySQL credentials (username and password)

## Import Methods

### Method 1: Using MySQL Command Line

1. **Open Command Prompt** (Windows) or Terminal (Mac/Linux)

2. **Navigate to backend folder:**
   ```bash
   cd C:\Users\ibso\movies.to\backend
   ```

3. **Import the SQL file:**
   ```bash
   mysql -u root -p < db.sql
   ```

4. **Enter your MySQL password** when prompted

5. **Verify the import:**
   ```bash
   mysql -u root -p
   ```
   
   Then in MySQL:
   ```sql
   USE movies_to;
   SHOW TABLES;
   ```
   
   You should see 9 tables:
   - comments
   - genres
   - movie_genres
   - movies
   - reviews
   - torrents_cache
   - users
   - view_history
   - watchlist

### Method 2: Using MySQL Workbench

1. **Open MySQL Workbench**

2. **Connect to your MySQL server**

3. **Click** `Server` → `Data Import`

4. **Select** "Import from Self-Contained File"

5. **Browse** to `C:\Users\ibso\movies.to\backend\db.sql`

6. **Click** "Start Import"

7. **Verify** by expanding the database tree and checking for tables

### Method 3: Using phpMyAdmin

1. **Open phpMyAdmin** in your browser

2. **Click** "Import" tab

3. **Click** "Choose File" and select `db.sql`

4. **Click** "Go" at the bottom

5. **Verify** the `movies_to` database appears with all tables

### Method 4: Using HeidiSQL (Windows)

1. **Open HeidiSQL**

2. **Connect** to your MySQL server

3. **Click** `File` → `Run SQL file...`

4. **Select** `db.sql`

5. **Click** "Execute"

## What the Import Does

 Drops existing `movies_to` database (if exists)
 Creates fresh `movies_to` database with UTF-8 encoding
 Creates 9 tables:
   - `users` - User accounts and authentication
   - `genres` - Movie genres
   - `movies` - Movie information
   - `movie_genres` - Many-to-many relationship
   - `watchlist` - User watchlists
   - `reviews` - Movie reviews and ratings
   - `comments` - Movie comments with threading
   - `view_history` - User viewing history
   - `torrents_cache` - Cached torrent data
   
 No mockup data is inserted

## After Import

1. **Configure backend `.env` file:**
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=movies_to
   DB_PORT=3306
   ```

2. **Start the backend server:**
   ```bash
   cd C:\Users\ibso\movies.to\backend
   bun run dev
   ```

3. **You should see:**
   ```
   ✅ MySQL database connected successfully
   🚀 Server started successfully
   📡 API running on: http://localhost:5001
   ```

## Troubleshooting

### Error: Access denied for user 'root'@'localhost'

**Solution:** Check your MySQL password
```bash
mysql -u root -p
```

### Error: Can't connect to MySQL server

**Solution:** Make sure MySQL service is running
- Windows: Services app → MySQL80 → Start
- Mac: `brew services start mysql`
- Linux: `sudo systemctl start mysql`

### Error: Unknown database 'movies_to'

**Solution:** The import didn't complete. Re-run the import command.

## Next Steps

After successful import:

1. ✅ Database is ready
2. 🔄 Configure backend `.env`
3. 🔄 Start backend server
4. 🔄 Test API endpoints
5. 🔄 Register users through the frontend

## Database Schema Diagram

```
users (1) ----< (N) watchlist (N) >---- (1) movies
  |                                           |
  |                                           |
  +---------< (N) reviews (N) >--------------+
  |                                           |
  |                                           |
  +---------< (N) comments (N) >-------------+
  |                                           |
  |                                           |
  +---------< (N) view_history (N) >---------+
                                              |
                                              |
                                    movie_genres (junction)
                                              |
                                              |
                                          genres
```

## Support

If you encounter any issues:
1. Check MySQL is running
2. Verify credentials in `.env`
3. Check backend logs for detailed errors
4. Ensure MySQL port 3306 is not blocked
