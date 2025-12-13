# Social Login Implementation Guide

## 📋 Overview

This guide provides step-by-step instructions to implement OAuth authentication for Google and GitHub login.

## ✅ Current Status

### What's Already Built:
- ✅ UI buttons for Google & GitHub login on Login/Register pages
- ✅ Backend auth system with JWT
- ✅ User database schema
- ✅ Frontend state management
- ⏳ OAuth handlers ("Coming soon" placeholders)

### What Needs Implementation:
- [ ] Google OAuth integration
- [ ] GitHub OAuth integration
- [ ] OAuth callback endpoints
- [ ] User account linking

---

## 🔵 Google OAuth Setup

### Step 1: Register Application in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** or **Google Identity Services**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - Application name: "Movies.to"
   - User support email: your email
   - Scopes: email, profile
   - Authorized domains: your domain
6. Create OAuth 2.0 Client:
   - Application type: Web application
   - Authorized JavaScript origins:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/google/callback`
     - `https://yourdomain.com/auth/google/callback`
7. Copy **Client ID** and **Client Secret**

### Step 2: Add Environment Variables

Add to `backend/.env`:
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5173/auth/google/callback
```

### Step 3: Install Dependencies

```bash
cd backend
bun add passport passport-google-oauth20
```

### Step 4: Create Google OAuth Backend Handler

Create `backend/src/config/passport.js`:
```javascript
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import db from './database.js';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(profile.id);

    if (!user) {
      // Check if email exists
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(profile.emails[0].value);

      if (user) {
        // Link Google account to existing user
        db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(profile.id, user.id);
      } else {
        // Create new user
        const result = db.prepare(`
          INSERT INTO users (username, email, google_id, avatar_url, email_verified)
          VALUES (?, ?, ?, ?, 1)
        `).run(
          profile.displayName,
          profile.emails[0].value,
          profile.id,
          profile.photos[0]?.value
        );

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      }
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

export default passport;
```

### Step 5: Add Google OAuth Routes

Add to `backend/src/routes/auth.js`:
```javascript
import passport from '../config/passport.js';

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    const token = generateToken(req.user);
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);
```

### Step 6: Update Frontend Login/Register Pages

Update `src/pages/Login.jsx`:
```javascript
const handleSocialLogin = (provider) => {
  if (provider === 'Google') {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  } else {
    toast.info(`${provider} login coming soon!`);
  }
};
```

### Step 7: Create OAuth Callback Handler

Create `src/pages/AuthCallback.jsx`:
```javascript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useStore';
import { toast } from 'sonner';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('auth_token', token);
      // Fetch user data
      authAPI.me().then(response => {
        setUser(response.user);
        toast.success('Logged in successfully!');
        navigate('/');
      }).catch(() => {
        toast.error('Login failed');
        navigate('/login');
      });
    } else {
      toast.error('Login failed');
      navigate('/login');
    }
  }, []);

  return <div>Processing login...</div>;
}
```

Add route to `src/App.jsx`:
```javascript
<Route path="/auth/callback" element={<AuthCallback />} />
```

### Step 8: Update Database Schema

Add Google ID column to users table:
```sql
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
```

---

## 🟣 GitHub OAuth Setup

### Step 1: Register OAuth App in GitHub

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in details:
   - Application name: "Movies.to"
   - Homepage URL: `http://localhost:5173` or your domain
   - Authorization callback URL: `http://localhost:5173/auth/github/callback`
4. Click **Register application**
5. Copy **Client ID**
6. Generate and copy **Client Secret**

### Step 2: Add Environment Variables

Add to `backend/.env`:
```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5173/auth/github/callback
```

### Step 3: Install Dependencies

```bash
cd backend
bun add passport-github2
```

### Step 4: Add GitHub Strategy to Passport

Add to `backend/src/config/passport.js`:
```javascript
import { Strategy as GitHubStrategy } from 'passport-github2';

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = db.prepare('SELECT * FROM users WHERE github_id = ?').get(profile.id);

    if (!user) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(profile.emails[0]?.value);

      if (user) {
        db.prepare('UPDATE users SET github_id = ? WHERE id = ?').run(profile.id, user.id);
      } else {
        const result = db.prepare(`
          INSERT INTO users (username, email, github_id, avatar_url, email_verified)
          VALUES (?, ?, ?, ?, 1)
        `).run(
          profile.username,
          profile.emails[0]?.value || `${profile.username}@github.user`,
          profile.id,
          profile.photos[0]?.value
        );

        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      }
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));
```

### Step 5: Add GitHub OAuth Routes

Add to `backend/src/routes/auth.js`:
```javascript
// GitHub OAuth
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  async (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);
```

### Step 6: Update Frontend

Update `src/pages/Login.jsx`:
```javascript
const handleSocialLogin = (provider) => {
  if (provider === 'Google') {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  } else if (provider === 'GitHub') {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/github`;
  }
};
```

### Step 7: Update Database Schema

Add GitHub ID column:
```sql
ALTER TABLE users ADD COLUMN github_id VARCHAR(255) UNIQUE;
```

---

## 🔒 Security Best Practices

1. **Never commit OAuth credentials** to version control
2. **Use HTTPS** in production
3. **Validate state parameter** to prevent CSRF
4. **Implement rate limiting** on OAuth endpoints
5. **Store tokens securely** (httpOnly cookies recommended)
6. **Verify email from OAuth providers**
7. **Handle account linking** carefully
8. **Log OAuth events** for security auditing

---

## 🧪 Testing

### Google OAuth Testing:
1. Click "Continue with Google" button
2. Should redirect to Google consent screen
3. Authorize the app
4. Should redirect back with token
5. Should auto-login to application

### GitHub OAuth Testing:
1. Click "Continue with GitHub" button
2. Should redirect to GitHub authorization
3. Authorize the app
4. Should redirect back with token
5. Should auto-login to application

---

## 📊 Implementation Checklist

### Google OAuth:
- [ ] Register app in Google Cloud Console
- [ ] Add environment variables
- [ ] Install passport & passport-google-oauth20
- [ ] Create passport configuration
- [ ] Add OAuth routes to backend
- [ ] Update database schema
- [ ] Create frontend callback handler
- [ ] Update login/register pages
- [ ] Test complete flow

### GitHub OAuth:
- [ ] Register OAuth app in GitHub
- [ ] Add environment variables
- [ ] Install passport-github2
- [ ] Add GitHub strategy to passport
- [ ] Add OAuth routes to backend
- [ ] Update database schema
- [ ] Update login/register pages
- [ ] Test complete flow

---

## 🚀 Quick Start (Simplified)

If you want to test quickly without full OAuth setup:

### Option 1: Mock OAuth (Development Only)
Add mock endpoints that simulate OAuth:
```javascript
router.post('/auth/mock-google', async (req, res) => {
  // Create/find test user
  // Return JWT token
});
```

### Option 2: Use Environment Variables
For testing, you can add test credentials to `.env` and enable OAuth without full setup.

---

## 📚 Additional Resources

- [Passport.js Documentation](http://www.passportjs.org/)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Guide](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## 🎯 Current Implementation Status

✅ **Core authentication system is 100% functional**

The following features work perfectly:
- Email/password registration
- Email/password login
- JWT token management
- Protected routes
- Session persistence
- Password reset
- Email verification
- Profile management

❌ **Social login requires OAuth setup**

Social login buttons exist in UI but need OAuth configuration as described above.
