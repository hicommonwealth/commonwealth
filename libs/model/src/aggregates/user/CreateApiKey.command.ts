import { type Command } from '@hicommonwealth/core';
import { getSaltedApiKeyHash } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { UserTierMap } from '@hicommonwealth/shared';
import { randomBytes } from 'crypto';
import { models } from '../../database';
import { authVerified, tiered } from '../../middleware';

export function CreateApiKey(): Command<typeof schemas.CreateApiKey> {
  return {
    ...schemas.CreateApiKey,
    auth: [authVerified(), tiered({ minTier: UserTierMap.SocialVerified })],
    secure: true,
    body: async ({ actor }) => {
      const apiKey = randomBytes(32).toString('base64url');
      const salt = randomBytes(16).toString('hex');

      const hash = getSaltedApiKeyHash(apiKey, salt);
      await models.ApiKey.create({
        user_id: actor.user.id,
        hashed_api_key: hash,
        premium_tier: false,
        salt,
      });

      return {
        api_key: apiKey,
      };
    },
  };
}
