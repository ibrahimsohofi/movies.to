import db from '../config/database.js';
import * as stripeService from '../services/stripeService.js';

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const payload = req.rawBody || req.body;

  try {
    // Verify webhook signature
    const event = stripeService.verifyWebhookSignature(payload, signature);

    console.log(`📨 Received Stripe webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook handler failed' });
  }
};

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session) {
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  console.log(`✅ Checkout completed for customer: ${customerId}`);

  // Get customer metadata to find user ID
  const userId = session.client_reference_id || session.metadata?.userId;

  if (!userId) {
    console.error('No user ID found in checkout session');
    return;
  }

  // Update or create subscription record
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1); // Default to 1 month

  db.prepare(`
    INSERT INTO subscriptions (
      user_id, plan, status, stripe_customer_id, stripe_subscription_id, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      plan = excluded.plan,
      status = excluded.status,
      stripe_customer_id = excluded.stripe_customer_id,
      stripe_subscription_id = excluded.stripe_subscription_id,
      expires_at = excluded.expires_at,
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, 'premium', 'active', customerId, subscriptionId, expiresAt.toISOString());

  // Update user premium status
  db.prepare(`
    UPDATE users
    SET is_premium = 1, premium_since = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(userId);
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  console.log(`✅ Subscription created: ${subscriptionId}`);

  // Find user by Stripe customer ID
  const userSub = db.prepare(`
    SELECT user_id FROM subscriptions
    WHERE stripe_customer_id = ?
  `).get(customerId);

  if (!userSub) {
    console.error('No user found for customer:', customerId);
    return;
  }

  const expiresAt = new Date(subscription.current_period_end * 1000);

  db.prepare(`
    UPDATE subscriptions
    SET status = ?, stripe_subscription_id = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(status, subscriptionId, expiresAt.toISOString(), userSub.user_id);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const expiresAt = new Date(subscription.current_period_end * 1000);

  console.log(`🔄 Subscription updated: ${subscriptionId}, status: ${status}`);

  const userSub = db.prepare(`
    SELECT user_id FROM subscriptions
    WHERE stripe_subscription_id = ?
  `).get(subscriptionId);

  if (!userSub) {
    console.error('No subscription found for:', subscriptionId);
    return;
  }

  db.prepare(`
    UPDATE subscriptions
    SET status = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE stripe_subscription_id = ?
  `).run(status, expiresAt.toISOString(), subscriptionId);

  // Update user premium status based on subscription status
  const isPremium = ['active', 'trialing'].includes(status) ? 1 : 0;
  db.prepare(`
    UPDATE users
    SET is_premium = ?
    WHERE id = ?
  `).run(isPremium, userSub.user_id);
}

/**
 * Handle subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(subscription) {
  const subscriptionId = subscription.id;

  console.log(`❌ Subscription deleted: ${subscriptionId}`);

  const userSub = db.prepare(`
    SELECT user_id FROM subscriptions
    WHERE stripe_subscription_id = ?
  `).get(subscriptionId);

  if (!userSub) {
    console.error('No subscription found for:', subscriptionId);
    return;
  }

  db.prepare(`
    UPDATE subscriptions
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE stripe_subscription_id = ?
  `).run(subscriptionId);

  db.prepare(`
    UPDATE users
    SET is_premium = 0
    WHERE id = ?
  `).run(userSub.user_id);

  // TODO: Send cancellation email
}

/**
 * Handle trial ending soon
 */
async function handleTrialWillEnd(subscription) {
  const subscriptionId = subscription.id;

  console.log(`⚠️  Trial will end soon: ${subscriptionId}`);

  const userSub = db.prepare(`
    SELECT user_id FROM subscriptions
    WHERE stripe_subscription_id = ?
  `).get(subscriptionId);

  if (!userSub) {
    return;
  }

  // TODO: Send trial ending email reminder
  console.log(`Sending trial ending reminder to user ${userSub.user_id}`);
}

/**
 * Handle successful payment
 */
async function handleInvoicePaid(invoice) {
  const subscriptionId = invoice.subscription;

  console.log(`✅ Invoice paid for subscription: ${subscriptionId}`);

  // Subscription will be updated via subscription.updated event
  // This is mainly for logging/analytics
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;

  console.log(`❌ Payment failed for subscription: ${subscriptionId}`);

  const userSub = db.prepare(`
    SELECT user_id FROM subscriptions
    WHERE stripe_subscription_id = ?
  `).get(subscriptionId);

  if (!userSub) {
    return;
  }

  // TODO: Send payment failed email
  // TODO: Update subscription status to 'past_due'
  console.log(`Sending payment failed notification to user ${userSub.user_id}`);
}

export default {
  handleStripeWebhook,
};
