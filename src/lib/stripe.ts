import Stripe from 'stripe';

export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key, {
    apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
  });
}

export const STRIPE_PLANS = {
  pro: {
    name: 'Pro',
    price: 2900, // cents
    interval: 'month' as const,
    features: [
      '20 scans per month',
      'Scan history & tracking',
      'Export reports as PDF',
      'Re-scan to track changes',
      'Compare ideas side-by-side',
    ],
  },
  teams: {
    name: 'Teams',
    price: 7900, // cents
    interval: 'month' as const,
    features: [
      'Unlimited scans',
      'Everything in Pro',
      'Team workspace',
      'Shared reports',
      'API access',
    ],
  },
};

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session.url || '';
}

export async function createOrGetCustomer(
  email: string,
  userId: string
): Promise<string> {
  const stripe = getStripeClient();

  // Check if customer exists
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  return customer.id;
}
