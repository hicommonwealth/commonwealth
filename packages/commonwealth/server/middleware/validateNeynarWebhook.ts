import { createHmac } from 'crypto';

export function validateNeynarWebhook(webhookSecret: string) {
  return async (req, _, next) => {
    const sig = req.headers['x-neynar-signature'];
    if (!sig) {
      console.log(req.headers);
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
