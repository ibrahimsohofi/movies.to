import db from '../config/database.js';
import * as stripeService from '../services/stripeService.js';

/**
 * Get user's subscription status
 */
export const getSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = db.prepare(`
      SELECT * FROM subscriptions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId);

    if (!subscription) {
      return res.json({
        plan: 'free',
        status: 'active',
        features: getFreeFeatures(),
        stripeConfigured: stripeService.isStripeConfigured(),
      });
    }

    // Check if subscription expired
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      updateSubscriptionStatus(userId, 'expired');
      subscription.status = 'expired';
    }

    res.json({
      ...subscription,
      features: subscription.plan === 'premium' ? getPremiumFeatures() : getFreeFeatures(),
      stripeConfigured: stripeService.isStripeConfigured(),
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
};

/**
 * Create checkout session for subscription
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { priceId, successUrl, cancelUrl } = req.body;

    // Get user details
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has an active subscription
    const existing = db.prepare(`
      SELECT * FROM subscriptions
      WHERE user_id = ? AND (status = 'active' OR status = 'trial')
    `).get(userId);

    if (existing && existing.plan === 'premium') {
      return res.status(400).json({ error: 'Already have an active premium subscription' });
    }

    // If Stripe is configured, create a checkout session
    if (stripeService.isStripeConfigured()) {
      // Get or create Stripe customer
      let customer = await stripeService.getCustomerByEmail(user.email);

      if (!customer) {
        customer = await stripeService.createCustomer(
          user.email,
          user.username,
          { userId: userId.toString() }
        );
      }

      // Create checkout session
      const session = await stripeService.createCheckoutSession(
        customer.id,
        priceId || stripeService.PRICE_IDS.monthly,
        successUrl || `${process.env.FRONTEND_URL}/premium/success`,
        cancelUrl || `${process.env.FRONTEND_URL}/premium`
      );

      return res.json({
        success: true,
        sessionId: session.id,
        url: session.url,
      });
    }

    // Fallback: Create trial subscription if Stripe not configured
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days trial

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 days trial

    const result = db.prepare(`
      INSERT INTO subscriptions (
        user_id, plan, status, expires_at, trial_ends_at
      ) VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'premium', 'trial', expiresAt.toISOString(), trialEndsAt.toISOString());

    // Update user premium status
    db.prepare(`
      UPDATE users
      SET is_premium = 1, premium_since = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(userId);

    const subscription = db.prepare(`
      SELECT * FROM subscriptions WHERE id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      subscription,
      message: 'Premium trial started! Enjoy 14 days free.',
      isTrial: true,
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

/**
 * Create billing portal session
 */
export const createBillingPortal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { returnUrl } = req.body;

    if (!stripeService.isStripeConfigured()) {
      return res.status(503).json({ error: 'Billing portal not available' });
    }

    // Get user's Stripe customer ID
    const subscription = db.prepare(`
      SELECT stripe_customer_id FROM subscriptions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId);

    if (!subscription?.stripe_customer_id) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const session = await stripeService.createBillingPortalSession(
      subscription.stripe_customer_id,
      returnUrl || `${process.env.FRONTEND_URL}/profile`
    );

    res.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error('Create billing portal error:', error);
    res.status(500).json({ error: 'Failed to create billing portal session' });
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = db.prepare(`
      SELECT * FROM subscriptions
      WHERE user_id = ? AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId);

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Mark as cancelled but keep active until expiry
    db.prepare(`
      UPDATE subscriptions
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(subscription.id);

    res.json({
      success: true,
      message: 'Subscription cancelled. You will retain premium access until the end of your billing period.'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

/**
 * Check feature access for user
 */
export const checkFeatureAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    const { feature } = req.params;

    const hasAccess = await canAccessFeature(userId, feature);
    const usage = await getFeatureUsage(userId, feature);

    res.json({
      hasAccess,
      usage,
      limits: getFeatureLimits(feature)
    });
  } catch (error) {
    console.error('Check feature access error:', error);
    res.status(500).json({ error: 'Failed to check feature access' });
  }
};

/**
 * Get subscription statistics (admin)
 */
export const getSubscriptionStats = async (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        plan,
        status,
        COUNT(*) as count
      FROM subscriptions
      GROUP BY plan, status
    `).all();

    const totalRevenue = db.prepare(`
      SELECT COUNT(*) * 4.99 as estimated_mrr
      FROM subscriptions
      WHERE plan = 'premium' AND status = 'active'
    `).get();

    res.json({
      stats,
      totalRevenue
    });
  } catch (error) {
    console.error('Get subscription stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// Helper functions

function updateSubscriptionStatus(userId, status) {
  db.prepare(`
    UPDATE subscriptions
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(status, userId);

  if (status === 'expired' || status === 'cancelled') {
    db.prepare(`
      UPDATE users
      SET is_premium = 0
      WHERE id = ?
    `).run(userId);
  }
}

async function canAccessFeature(userId, feature) {
  const user = db.prepare(`
    SELECT is_premium FROM users WHERE id = ?
  `).get(userId);

  const premiumFeatures = ['unlimited_watchlist', 'unlimited_lists', 'advanced_stats', 'export_all'];

  if (premiumFeatures.includes(feature)) {
    return user.is_premium === 1;
  }

  return true; // Free features
}

async function getFeatureUsage(userId, feature) {
  const usage = db.prepare(`
    SELECT usage_count FROM feature_usage
    WHERE user_id = ? AND feature_type = ?
  `).get(userId, feature);

  return usage ? usage.usage_count : 0;
}

function getFeatureLimits(feature) {
  const limits = {
    watchlist: { free: 100, premium: -1 },
    lists: { free: 3, premium: -1 },
    export: { free: 1, premium: -1 }
  };

  return limits[feature] || { free: -1, premium: -1 };
}

function getFreeFeatures() {
  return [
    'Browse and search movies',
    'Create watchlist (max 100 movies)',
    'Write reviews and comments',
    'Follow up to 50 users',
    'Create up to 3 lists'
  ];
}

function getPremiumFeatures() {
  return [
    'All free features',
    'Unlimited watchlist',
    'Unlimited lists',
    'Ad-free experience',
    'Advanced statistics dashboard',
    'Early access to new features',
    'Custom profile themes',
    'Export data in all formats',
    'Priority support'
  ];
}
