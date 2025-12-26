import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import db from './database.js';

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser((id, done) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Helper function to find or create OAuth user
const findOrCreateOAuthUser = (profile, provider) => {
  try {
    // Check if user exists with this OAuth ID
    let user = db
      .prepare(`SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?`)
      .get(provider, profile.id);

    if (user) {
      return user;
    }

    // Check if user exists with this email
    const email = profile.emails?.[0]?.value;
    if (email) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

      // If user exists with email, link OAuth account
      if (user) {
        db.prepare(`UPDATE users SET oauth_provider = ?, oauth_id = ? WHERE id = ?`)
          .run(provider, profile.id, user.id);
        return db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      }
    }

    // Create new user
    const username = profile.displayName || profile.username || `${provider}_user_${Date.now()}`;
    const avatarUrl = profile.photos?.[0]?.value || null;

    const result = db
      .prepare(
        `INSERT INTO users (username, email, oauth_provider, oauth_id, avatar_url, email_verified)
         VALUES (?, ?, ?, ?, ?, 1)`
      )
      .run(username, email, provider, profile.id, avatarUrl);

    return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  } catch (error) {
    console.error('Error in findOrCreateOAuthUser:', error);
    throw error;
  }
};

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      (accessToken, refreshToken, profile, done) => {
        try {
          const user = findOrCreateOAuthUser(profile, 'google');
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/auth/github/callback`,
        scope: ['user:email'],
      },
      (accessToken, refreshToken, profile, done) => {
        try {
          const user = findOrCreateOAuthUser(profile, 'github');
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'photos', 'email'],
      },
      (accessToken, refreshToken, profile, done) => {
        try {
          const user = findOrCreateOAuthUser(profile, 'facebook');
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

export default passport;
