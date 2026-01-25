import Stripe from 'stripe';

// Initialize Stripe (falls back gracefully if key not provided)
const stripeKey = process.env.STRIPE_SECRET_KEY;
let stripe = null;
let isStripeAvailable = false;

if (stripeKey && stripeKey !== 'your_stripe_secret_key_here') {
  try {
    stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
    isStripeAvailable = true;
    console.log('✅ Stripe initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Stripe:', error.message);
  }
} else {
  console.log('⚠️  Stripe not configured. Running in trial mode.');
}

/**
 * Create a Stripe customer
 */
export async function createCustomer(email, name, metadata = {}) {
  if (!isStripeAvailable) {
    throw new Error('Stripe not configured');
  }

  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });
    return customer;
  } catch (error) {
    console.error('Stripe createCustomer error:', error);
    throw error;
  }
}

/**
 * Create a subscription
 */
export async function createSubscription(customerId, priceId, trialDays = 14) {
  if (!isStripeAvailable) {
    throw new Error('Stripe not configured');
  }

  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: trialDays,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
    return subscription;
  } catch (error) {
    console.error('Stripe createSubscription error:', error);
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
  if (!isStripeAvailable) {
    throw new Error('Stripe not configured');
  }

  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });
    return subscription;
  } catch (error) {
    console.error('Stripe cancelSubscription error:', error);
    throw error;
  }
}

/**
 * Resume a cancelled subscription
 */
export async function resumeSubscription(subscriptionId) {
  if (!isStripeAvailable) {
    throw new Error('Stripe not configured');
  }

  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    return subscription;
  } catch (error) {
    console.error('Stripe resumeSubscription error:', error);
    throw error;
  }
}

/**
 * Create a checkout session
 */
export async function createCheckoutSession(customerId, priceId, successUrl, cancelUrl) {
  if (!isStripeAvailable) {
    throw new Error('Stripe not configured');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 14,
      },
    });
    return session;
  } catch (error) {
    console.error('Stripe createCheckoutSession error:', error);
    throw error;
  }
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(customerId, returnUrl) {
  if (!isStripeAvailable) {
    throw new Error('Stripe not configured');
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session;
  } catch (error) {
    console.error('Stripe createBillingPortalSession error:', error);
    throw error;
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId) {
  if (!isStripeAvailable) {
    throw new Error('Stripe not configured');
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Stripe getSubscription error:', error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload, signature) {
  if (!isStripeAvailable) {
    throw new Error('Stripe not configured');
  }

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Stripe webhook verification error:', error);
    throw error;
  }
}

/**
 * Get customer by email
 */
export async function getCustomerByEmail(email) {
  if (!isStripeAvailable) {
    throw new Error('Stripe not configured');
  }

  try {
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });
    return customers.data[0] || null;
  } catch (error) {
    console.error('Stripe getCustomerByEmail error:', error);
    throw error;
  }
}

/**
 * Check if Stripe is available
 */
export function isStripeConfigured() {
  return isStripeAvailable;
}

/**
 * Price IDs for different plans
 */
export const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly',
  yearly: process.env.STRIPE_PRICE_YEARLY || 'price_yearly',
};

export default {
  createCustomer,
  createSubscription,
  cancelSubscription,
  resumeSubscription,
  createCheckoutSession,
  createBillingPortalSession,
  getSubscription,
  verifyWebhookSignature,
  getCustomerByEmail,
  isStripeConfigured,
  PRICE_IDS,
};
