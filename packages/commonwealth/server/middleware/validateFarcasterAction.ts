import { config } from '@hicommonwealth/model';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

export function validateFarcasterAction() {
  return async (req, _, next) => {
    const sig = req.body.trustedData?.messageBytes || null;
    if (!sig) {
      throw new Error('Neynar signature missing from request headers');
    }
    const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
    const result = await client.validateFrameAction(sig);
    if (!result.valid) {
      next(new Error('Farcaster action signature validation failed'));
      return;
    }
    req.body = result.action; // override body with validated payload
    // console.log('req.body: ', JSON.stringify(req.body, null, 2));
    next();
  };
}
