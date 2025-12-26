import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * User registration validation
 */
export const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  handleValidationErrors
];

/**
 * User login validation
 */
export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

/**
 * Review validation
 */
export const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 10 })
    .withMessage('Rating must be between 1 and 10'),

  body('review_text')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Review text must not exceed 5000 characters'),

  param('tmdb_id')
    .isInt({ min: 1 })
    .withMessage('Invalid movie ID'),

  handleValidationErrors
];

/**
 * Comment validation
 */
export const validateComment = [
  body('comment_text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be between 1 and 2000 characters'),

  body('parent_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid parent comment ID'),

  param('tmdb_id')
    .isInt({ min: 1 })
    .withMessage('Invalid movie ID'),

  handleValidationErrors
];

/**
 * Watchlist validation
 */
export const validateWatchlist = [
  body('tmdb_id')
    .isInt({ min: 1 })
    .withMessage('Invalid movie ID'),

  body('title')
    .trim()
    .notEmpty()
    .withMessage('Movie title is required'),

  handleValidationErrors
];

/**
 * Movie ID parameter validation
 */
export const validateMovieId = [
  param('tmdb_id')
    .isInt({ min: 1 })
    .withMessage('Invalid movie ID'),

  handleValidationErrors
];

/**
 * IMDB ID parameter validation
 */
export const validateImdbId = [
  param('imdb_id')
    .matches(/^tt\d{7,}$/)
    .withMessage('Invalid IMDB ID format'),

  handleValidationErrors
];

/**
 * Pagination validation
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  handleValidationErrors
];

/**
 * Email validation
 */
export const validateEmail = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  handleValidationErrors
];

/**
 * Password reset validation
 */
export const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  handleValidationErrors
];

export default {
  validateRegister,
  validateLogin,
  validateReview,
  validateComment,
  validateWatchlist,
  validateMovieId,
  validateImdbId,
  validatePagination,
  validateEmail,
  validatePasswordReset,
  handleValidationErrors
};
