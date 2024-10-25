import { createHmac } from 'crypto';

export function validateNeynarWebhook(
  webhookSecret: string | null | undefined,
) {
  return (req, _, next) => {
    if (!webhookSecret) {
      throw new Error('Neynar webhook secret not set');
    }

    const sig = req.headers['X-Neynar-Signature'];
    if (!sig) {
      throw new Error('Neynar signature missing from request headers');
    }

    const hmac = createHmac('sha512', webhookSecret);
    hmac.update(JSON.stringify(req.body));

    const generatedSignature = hmac.digest('hex');

    const isValid = generatedSignature === sig;
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }
    next();
  };
}
