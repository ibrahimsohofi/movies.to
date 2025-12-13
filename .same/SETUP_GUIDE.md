# Movies.to - Quick Setup Guide

## 🚀 Running the Application

### Step 1: Install Dependencies

```bash
# Frontend dependencies
cd movies.to
bun install

# Backend dependencies
cd backend
bun install
```

### Step 2: Configure Environment Variables

**Frontend (.env)** - Already configured ✅
```env
VITE_TMDB_API_KEY=0f22aa77cc9fc284b4d3b9445375f0a2
VITE_API_BASE_URL=http://localhost:5000/api
```

**Backend (backend/.env)** - Created from template ✅
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
FRONTEND_URL=http://localhost:5173
```

### Step 3: Initialize Database

```bash
cd movies.to/backend
bun run db:setup
```

This will create the SQLite database and all necessary tables.

### Step 4: Start Servers

**Terminal 1 - Backend:**
```bash
cd movies.to/backend
bun run dev
# Should start on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd movies.to
bun run dev
# Should start on http://localhost:5173
```

### Step 5: Access the Application

Open your browser to: **http://localhost:5173**

---

## 🧪 Testing Reviews & Comments

### Test Flow
1. **Browse movies** on home page
2. **Click on any movie** to see details
3. **Scroll down** to Reviews and Comments sections
4. **Create an account** (or use fallback mode)
5. **Post reviews** with ratings
6. **Add comments** and replies
7. **Like/Vote** on content
8. **Try sorting** and filtering

### Without Backend (Fallback Mode)
The app works without backend using localStorage:
- All reviews/comments saved locally
- Full CRUD operations available
- Like/vote tracking works
- Data persists in browser

### With Backend (Full Features)
- Multi-user support
- Real-time updates
- Persistent storage
- Like status tracking
- Threaded conversations

---

## 🎯 Key Features Implemented

### Reviews ⭐
- ✅ 1-10 star rating system
- ✅ Written reviews
- ✅ Edit/delete own reviews
- ✅ Vote helpful/not helpful
- ✅ Sort by: Recent, Helpful, Highest, Lowest
- ✅ Average rating display

### Comments 💬
- ✅ Post comments
- ✅ Reply to comments (threaded)
- ✅ Like/unlike comments
- ✅ Edit/delete own comments
- ✅ Sort by: Newest, Oldest, Most Liked
- ✅ Visual nesting for replies

---

## 🔍 What to Look For

### UI Features
- Gradient avatar circles
- Filled hearts when liked
- Indented reply threads
- Inline reply forms
- Sort dropdowns
- Loading states
- Empty states
- Toast notifications

### Functionality
- Authentication required for actions
- Can only edit/delete own content
- Confirmation before delete
- Optimistic UI updates
- Form validation
- Error handling

---

## 📚 API Documentation

See `.same/REVIEWS_COMMENTS_IMPLEMENTATION.md` for:
- Complete endpoint list
- Database schema
- Technical details
- Testing scenarios

---

## ⚡ Quick Commands

```bash
# Start everything (from movies.to directory)
# Terminal 1:
cd backend && bun run dev

# Terminal 2:
bun run dev

# Setup database
cd backend && bun run db:setup

# Run tests
bun run test

# Build for production
bun run build
```

---

## 🐛 Troubleshooting

**Backend won't start:**
- Check if port 5000 is available
- Run `bun run db:setup` first
- Check `.env` file exists in backend folder

**Frontend won't connect to backend:**
- Verify backend is running on port 5000
- Check VITE_API_BASE_URL in frontend .env
- Check CORS settings in backend

**Database errors:**
- Delete `backend/database.sqlite`
- Run `bun run db:setup` again

**Comments/Reviews not showing:**
- Check browser console for errors
- Verify you're on a movie detail page
- Try fallback mode (will work without backend)

---

## 📋 Next Steps

1. Start the servers
2. Create a user account
3. Browse and select a movie
4. Test posting reviews and comments
5. Test all interactive features
6. Review the implementation report

For detailed technical information, see:
- `.same/REVIEWS_COMMENTS_IMPLEMENTATION.md`
- `.same/todos.md`
