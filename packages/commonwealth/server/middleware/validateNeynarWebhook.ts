import { models } from '@hicommonwealth/model';
import { createHmac } from 'crypto';
import { Op } from 'sequelize';

export function validateNeynarWebhook(
  webhookSecret: string | null | undefined,
) {
  return async (req, _, next) => {
    console.log(req.body);
    if (!webhookSecret) {
      const { parent_hash } = req.body.data;
      if (!parent_hash) {
        throw new Error('Parent hash not found in body');
      }
      const contestManager = await models.ContestManager.findOne({
        where: {
          farcaster_frame_hashes: {
            [Op.contains]: [parent_hash],
          },
        },
      });
      if (contestManager) {
        webhookSecret = contestManager.neynar_webhook_secret;
      }
      if (!webhookSecret) {
        throw new Error('Neynar webhook secret not set');
      }
    }

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
