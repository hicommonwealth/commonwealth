import { logger } from '@hicommonwealth/core';
import { config } from '@hicommonwealth/model';

const log = logger(import.meta);

export function buildFarcasterManifest() {
  if (!config.CONTESTS.FARCASTER_MANIFEST_HEADER) {
    log.warn('env FARCASTER_MANIFEST_HEADER is missing');
  }
  if (!config.CONTESTS.FARCASTER_MANIFEST_PAYLOAD) {
    log.warn('env FARCASTER_MANIFEST_PAYLOAD is missing');
  }
  if (!config.CONTESTS.FARCASTER_MANIFEST_SIGNATURE) {
    log.warn('env FARCASTER_MANIFEST_SIGNATURE is missing');
  }
  if (!config.CONTESTS.FARCASTER_MANIFEST_DOMAIN) {
    log.warn('env FARCASTER_MANIFEST_DOMAIN is missing');
  }
  return {
    accountAssociation: {
      header: config.CONTESTS.FARCASTER_MANIFEST_HEADER,
      payload: config.CONTESTS.FARCASTER_MANIFEST_PAYLOAD,
      signature: config.CONTESTS.FARCASTER_MANIFEST_SIGNATURE,
    },
    frame: {
      version: `1`,
      name: `Commonwealth`,
      iconUrl: `https://${config.CONTESTS.FARCASTER_MANIFEST_DOMAIN}/public/brand_assets/common-white.png`,
      homeUrl: `https://${config.CONTESTS.FARCASTER_MANIFEST_DOMAIN}`,
      imageUrl: `https://${config.CONTESTS.FARCASTER_MANIFEST_DOMAIN}/public/brand_assets/common-white.png`,
      buttonTitle: `Check out Commonwealth`,
      splashImageUrl: `https://${config.CONTESTS.FARCASTER_MANIFEST_DOMAIN}/public/brand_assets/common-white.png`,
      splashBackgroundColor: `#ffffff`,
      // eslint-disable-next-line max-len
      webhookUrl: `https://${config.CONTESTS.FARCASTER_MANIFEST_DOMAIN}/api/integration/farcaster/contests/NotificationsWebhook`,
    },
  };
}
