import express from 'express';
import * as subscriptionController from '../controllers/subscriptionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get current subscription
router.get('/', subscriptionController.getSubscription);

// Create checkout session (Stripe)
router.post('/checkout', subscriptionController.createCheckoutSession);

// Create billing portal session (Stripe)
router.post('/billing-portal', subscriptionController.createBillingPortal);

// Cancel subscription
router.delete('/', subscriptionController.cancelSubscription);

// Check feature access
router.get('/feature/:feature', subscriptionController.checkFeatureAccess);

// Admin: Get subscription statistics
router.get('/stats', subscriptionController.getSubscriptionStats);

export default router;
