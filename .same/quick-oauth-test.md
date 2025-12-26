# Quick OAuth Test Guide

## 🎯 Want to Test OAuth Right Now?

You can use a test OAuth provider to see how it works before setting up all three providers.

### Recommended: Start with GitHub OAuth (Easiest & Fastest)

GitHub OAuth is the quickest to set up - takes only 2 minutes!

#### Quick Steps:

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/developers
   - Click "OAuth Apps" → "New OAuth App"

2. **Fill in the form:**
   ```
   Application name: Movies.to (Test)
   Homepage URL: http://localhost:5173
   Authorization callback URL: http://localhost:5000/api/auth/github/callback
   ```

3. **Get your credentials:**
   - After creating, you'll see your **Client ID**
   - Click "Generate a new client secret" and copy it

4. **Add to your backend/.env:**
   ```env
   GITHUB_CLIENT_ID=paste_your_client_id_here
   GITHUB_CLIENT_SECRET=paste_your_client_secret_here
   ```

5. **Restart the backend server:**
   - Stop it (Ctrl+C) and run `bun run dev` again

6. **Test it:**
   - Go to http://localhost:5173/login
   - Click "Continue with GitHub"
   - Sign in with your GitHub account
   - You'll be redirected back and logged in! ✅

---

## 📊 OAuth Setup Status

Track your progress:

- [ ] **GitHub OAuth** - Recommended first (2 min setup)
- [ ] **Google OAuth** - Most popular (5 min setup)
- [ ] **Facebook OAuth** - Wide reach (10 min setup)

You don't need all three! Even one OAuth provider greatly improves user experience.

---

## 🧪 Testing Without OAuth

If you want to skip OAuth for now, that's fine! Your app works perfectly with email/password authentication. OAuth is an optional enhancement for user convenience.

---

## 💡 Pro Tips

1. **GitHub is fastest** - Perfect for testing the OAuth flow
2. **Google has most users** - Set this up for production
3. **Facebook requires app review** - Only if you need 100+ users
4. **Test with different browsers** - Clear cookies between tests
5. **Check backend logs** - They show helpful OAuth debug info

---

## 🔍 Verify OAuth is Working

After adding credentials and restarting, check:

1. **Backend startup logs** - Should show which OAuth providers are configured
2. **Login page** - OAuth buttons should be visible (not in demo mode)
3. **Click OAuth button** - Should redirect to provider
4. **After login** - Should redirect back to app with user logged in

---

## ❓ Need Help?

Check `oauth-setup-guide.md` for detailed step-by-step instructions for all three providers.
