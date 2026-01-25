import express from 'express';
import { handleStripeWebhook } from '../controllers/webhookController.js';

const router = express.Router();

/**
 * Stripe webhook endpoint
 * Note: This endpoint should NOT use JSON body parser
 * Stripe requires the raw body for signature verification
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

export default router;
