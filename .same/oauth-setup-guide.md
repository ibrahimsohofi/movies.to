# OAuth Setup Guide - Movies.to

This guide will walk you through setting up Google, GitHub, and Facebook OAuth for social login.

## 📋 Overview

Your app supports three OAuth providers:
- **Google OAuth 2.0** - Most popular, recommended
- **GitHub OAuth** - Great for developer audience
- **Facebook Login** - Wide user base

## 🚀 Quick Setup Steps

### 1. Google OAuth Setup

#### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `Movies.to` → Click "Create"

#### Step 2: Enable Google+ API
1. In the sidebar, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

#### Step 3: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: `Movies.to`
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue" through all steps
4. Back to "Create OAuth client ID":
   - Application type: **Web application**
   - Name: `Movies.to Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `http://localhost:5000` (for development)
     - Your production URL (when ready)
   - Authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback`
     - Your production URL + `/api/auth/google/callback` (when ready)
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

#### Step 4: Add to Environment Variables
Add these to `backend/.env`:
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

---

### 2. GitHub OAuth Setup

#### Step 1: Register a New OAuth App
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" → "New OAuth App"

#### Step 2: Fill in Application Details
- **Application name**: `Movies.to`
- **Homepage URL**: `http://localhost:5173` (for development)
- **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
- Click "Register application"

#### Step 3: Get Credentials
1. After registration, you'll see your **Client ID**
2. Click "Generate a new client secret"
3. Copy both the **Client ID** and **Client Secret** immediately

#### Step 4: Add to Environment Variables
Add these to `backend/.env`:
```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
```

---

### 3. Facebook OAuth Setup

#### Step 1: Create a Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Consumer" as the app type
4. Fill in:
   - **App Name**: `Movies.to`
   - **App Contact Email**: Your email
   - Click "Create App"

#### Step 2: Add Facebook Login Product
1. In the dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Select "Web" as the platform
4. Enter Site URL: `http://localhost:5173`

#### Step 3: Configure OAuth Settings
1. Go to "Facebook Login" → "Settings" in the left sidebar
2. Add these to **Valid OAuth Redirect URIs**:
   - `http://localhost:5000/api/auth/facebook/callback`
   - Your production URL + `/api/auth/facebook/callback` (when ready)
3. Click "Save Changes"

#### Step 4: Get App Credentials
1. Go to "Settings" → "Basic" in the left sidebar
2. Copy your **App ID** (this is your Client ID)
3. Click "Show" next to **App Secret** and copy it

#### Step 5: Add to Environment Variables
Add these to `backend/.env`:
```env
FACEBOOK_CLIENT_ID=your_app_id_here
FACEBOOK_CLIENT_SECRET=your_app_secret_here
```

---

## ✅ Final Steps

### 1. Update Your .env File
Your `backend/.env` should now have all OAuth credentials:

```env
# OAuth Configuration
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here

# GitHub OAuth
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=your_github_secret_here

# Facebook OAuth
FACEBOOK_CLIENT_ID=123456789012345
FACEBOOK_CLIENT_SECRET=your_facebook_secret_here
```

### 2. Restart Backend Server
After adding credentials, restart your backend server:
```bash
# Stop the current server (Ctrl+C)
# Then restart
cd movies.to && bun run dev
```

### 3. Test OAuth Login
1. Go to `http://localhost:5173/login`
2. Click on "Continue with Google", "Continue with GitHub", or "Continue with Facebook"
3. Complete the OAuth flow
4. You should be redirected back to the app and logged in!

---

## 🔧 Production Setup

When deploying to production, remember to:

1. **Update Redirect URIs** in each OAuth provider:
   - Replace `http://localhost:5000` with your production backend URL
   - Replace `http://localhost:5173` with your production frontend URL

2. **Update Environment Variables**:
   ```env
   FRONTEND_URL=https://your-frontend-domain.com
   API_BASE_URL=https://your-backend-domain.com
   ```

3. **For Google**: Set OAuth consent screen to "In Production"
4. **For Facebook**: Submit app for review if you need more than 100 test users

---

## 🎯 Testing Tips

- Use **different email addresses** for each provider to test properly
- Clear browser cookies between tests if needed
- Check browser console for any OAuth errors
- Check backend logs for detailed error messages

---

## 📝 Notes

- OAuth users have `email_verified` automatically set to `true`
- OAuth accounts can be linked to existing email-based accounts
- Users can use multiple OAuth providers with the same email
- Avatar URLs from OAuth providers are automatically saved

---

## ❓ Troubleshooting

### "Redirect URI mismatch"
- Check that callback URLs in OAuth provider settings exactly match your setup
- Ensure no trailing slashes in URLs

### "Invalid client"
- Verify Client ID and Secret are correctly copied to `.env`
- Restart backend server after adding credentials

### "Access blocked"
- For Google: Complete OAuth consent screen configuration
- For Facebook: Add your email as a test user in App Settings

---

## 🎉 You're All Set!

Once configured, users can sign in with:
- ✅ Email/Password (traditional)
- ✅ Google Account
- ✅ GitHub Account
- ✅ Facebook Account

All authentication methods work seamlessly together!
