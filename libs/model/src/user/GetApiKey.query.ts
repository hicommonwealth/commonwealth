import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function GetApiKey(): Query<typeof schemas.GetApiKey> {
  return {
    ...schemas.GetApiKey,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      const apiKey = await models.ApiKey.findOne({
        where: {
          user_id: actor.user.id,
        },
      });

      return {
        hashed_api_key: apiKey?.hashed_api_key,
        created_at: apiKey?.created_at?.toISOString(),
      };
    },
  };
}
