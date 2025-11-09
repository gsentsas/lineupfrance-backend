import client from './api';

export async function createStripeSetupIntent() {
  const { data } = await client.post('/api/payments/stripe/setup-intent');
  return data?.data ?? data;
}

export async function createStripePaymentIntent(params: {
  missionId?: string;
  amountCents?: number;
  currency?: string;
  description?: string;
}) {
  const { data } = await client.post('/api/payments/stripe/payment-intent', params);
  return data?.data ?? data;
}
