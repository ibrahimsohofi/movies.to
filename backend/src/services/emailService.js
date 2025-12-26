import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Fallback to console logging if no email service configured
const createTransporter = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

const transporter = createTransporter();

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetLink - Password reset link
 * @param {string} username - User's username
 */
export const sendPasswordResetEmail = async (to, resetLink, username) => {
  const subject = 'Reset Your Password - Movies.to';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${username},</p>
          <p>We received a request to reset your password for your Movies.to account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" class="button">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>Best regards,<br>The Movies.to Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hi ${username},

    We received a request to reset your password for your Movies.to account.

    Click the link below to reset your password:
    ${resetLink}

    This link will expire in 1 hour.

    If you didn't request a password reset, you can safely ignore this email.

    Best regards,
    The Movies.to Team
  `;

  return sendEmail(to, subject, text, html);
};

/**
 * Send email verification email
 * @param {string} to - Recipient email address
 * @param {string} verificationLink - Email verification link
 * @param {string} username - User's username
 */
export const sendVerificationEmail = async (to, verificationLink, username) => {
  const subject = 'Verify Your Email - Movies.to';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Movies.to!</h1>
        </div>
        <div class="content">
          <p>Hi ${username},</p>
          <p>Thanks for signing up! Please verify your email address to get started.</p>
          <a href="${verificationLink}" class="button">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create this account, you can safely ignore this email.</p>
          <p>Best regards,<br>The Movies.to Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hi ${username},

    Thanks for signing up! Please verify your email address to get started.

    Click the link below to verify your email:
    ${verificationLink}

    This link will expire in 24 hours.

    If you didn't create this account, you can safely ignore this email.

    Best regards,
    The Movies.to Team
  `;

  return sendEmail(to, subject, text, html);
};

/**
 * Send email using configured service (Resend or SMTP)
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    // Try Resend first
    if (resend) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Movies.to <noreply@movies.to>',
        to: [to],
        subject,
        html,
        text,
      });
      console.log(`Email sent to ${to} via Resend`);
      return { success: true };
    }

    // Fallback to SMTP
    if (transporter) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Movies.to <noreply@movies.to>',
        to,
        subject,
        text,
        html,
      });
      console.log(`Email sent to ${to} via SMTP`);
      return { success: true };
    }

    // Development mode - log to console
    console.log('\n========== EMAIL (Development Mode) ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${text}`);
    console.log('===============================================\n');

    return { success: true, mode: 'development' };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send contact form email
 * @param {string} name - Sender's name
 * @param {string} email - Sender's email
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 */
export const sendContactFormEmail = async (name, email, subject, message) => {
  const emailSubject = `Contact Form: ${subject}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .info { background: white; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Contact Form Submission</h1>
        </div>
        <div class="content">
          <div class="info">
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div class="info">
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
        <div class="footer">
          <p>This message was sent from the Movies.to contact form</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    New Contact Form Submission

    From: ${name}
    Email: ${email}
    Subject: ${subject}

    Message:
    ${message}
  `;

  // Send to admin/support email
  const adminEmail = process.env.ADMIN_EMAIL || 'support@movies.to';
  return sendEmail(adminEmail, emailSubject, text, html);
};

export default {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendContactFormEmail,
};
