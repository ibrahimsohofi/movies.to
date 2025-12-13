import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerification
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter, passwordResetLimiter } from '../middleware/security.js';
import {
  validateRegister,
  validateLogin,
  validateEmail,
  validatePasswordReset
} from '../middleware/validation.js';

const router = express.Router();

// OAuth callback handler helper
const handleOAuthCallback = (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
    }

    // Generate JWT token for the OAuth user
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_error`);
  }
};

// Public routes with validation
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/forgot-password', passwordResetLimiter, validateEmail, requestPasswordReset);
router.post('/reset-password', validatePasswordReset, resetPassword);
router.post('/verify-email', verifyEmail);

// OAuth Routes - Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  handleOAuthCallback
);

// OAuth Routes - GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  handleOAuthCallback
);

// OAuth Routes - Facebook
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  handleOAuthCallback
);

// Protected routes
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);
router.post('/resend-verification', authenticateToken, resendVerification);

export default router;
