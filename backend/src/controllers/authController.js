import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import db from '../config/database.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/emailService.js';
import logger from '../services/logger.js';

// Generate JWT token
const generateToken = (user, rememberMe = false) => {
  // If remember me is checked, token expires in 30 days, otherwise 24 hours
  const expiresIn = rememberMe ? '30d' : '24h';

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

// Register new user
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);

    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Create user
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash, email_verification_token, email_verification_expires) VALUES (?, ?, ?, ?, ?)'
    ).run(username, email, passwordHash, hashedToken, expiresAt.toISOString());

    // Get created user
    const user = db.prepare('SELECT id, username, email, role, avatar_url, email_verified, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

    try {
      await sendVerificationEmail(user.email, verificationLink, user.username);
      logger.info(`Verification email sent to ${user.email}`);
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
    }

    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user,
      token,
      ...(process.env.NODE_ENV === 'development' && { verificationLink })
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user signed up with OAuth
    if (user.oauth_provider && !user.password_hash) {
      return res.status(400).json({
        error: `This account was created using ${user.oauth_provider}. Please login with ${user.oauth_provider}.`,
        oauth_provider: user.oauth_provider
      });
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Remove password hash from response
    delete user.password_hash;

    const token = generateToken(user, rememberMe);

    res.json({
      message: 'Login successful',
      user,
      token,
      rememberMe
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get current user
export const getMe = async (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, role, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { username, avatar_url } = req.body;
    const userId = req.user.id;

    const updates = [];
    const values = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }

    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      values.push(avatar_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    // Get updated user
    const user = db.prepare('SELECT id, username, email, role, avatar_url, created_at FROM users WHERE id = ?').get(userId);

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get user with password
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, userId);

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Request password reset (generates reset token)
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = db.prepare('SELECT id, email, username FROM users WHERE email = ?').get(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        message: 'If an account exists with this email, you will receive password reset instructions.'
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store hashed token in database
    db.prepare('UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?')
      .run(hashedToken, expiresAt.toISOString(), user.id);

    // Create reset link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send email
    try {
      await sendPasswordResetEmail(user.email, resetLink, user.username);
      logger.info(`Password reset email sent to ${user.email}`);
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
      // Don't expose email sending failure to user
    }

    res.json({
      message: 'If an account exists with this email, you will receive password reset instructions.',
      // DEVELOPMENT ONLY - remove in production
      ...(process.env.NODE_ENV === 'development' && { resetLink })
    });
  } catch (error) {
    logger.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

// Reset password with token
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = db.prepare(
      'SELECT id FROM users WHERE password_reset_token = ? AND password_reset_expires > ?'
    ).get(hashedToken, new Date().toISOString());

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    db.prepare(
      'UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?'
    ).run(passwordHash, user.id);

    logger.info(`Password reset successful for user ID: ${user.id}`);

    res.json({
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Verify email with token
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid verification token
    const user = db.prepare(
      'SELECT id, email, username FROM users WHERE email_verification_token = ? AND email_verification_expires > ?'
    ).get(hashedToken, new Date().toISOString());

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired verification token' });
    }

    // Mark email as verified and clear token
    db.prepare(
      'UPDATE users SET email_verified = 1, email_verification_token = NULL, email_verification_expires = NULL WHERE id = ?'
    ).run(user.id);

    logger.info(`Email verified for user: ${user.email}`);

    res.json({
      message: 'Email verified successfully. You can now access all features.'
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
};

// Resend verification email
export const resendVerification = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user
    const user = db.prepare('SELECT id, email, username, email_verified FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Update token in database
    db.prepare(
      'UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE id = ?'
    ).run(hashedToken, expiresAt.toISOString(), user.id);

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

    try {
      await sendVerificationEmail(user.email, verificationLink, user.username);
      logger.info(`Verification email resent to ${user.email}`);
    } catch (emailError) {
      logger.error('Failed to resend verification email:', emailError);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.json({
      message: 'Verification email sent. Please check your inbox.',
      ...(process.env.NODE_ENV === 'development' && { verificationLink })
    });
  } catch (error) {
    logger.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
};
