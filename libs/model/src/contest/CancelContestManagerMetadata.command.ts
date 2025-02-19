import { logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { config } from '../config';
import { models } from '../database';
import { authRoles } from '../middleware';
import { mustExist } from '../middleware/guards';

const log = logger(import.meta);

export function CancelContestManagerMetadata(): Command<
  typeof schemas.CancelContestManagerMetadata
> {
  return {
    ...schemas.CancelContestManagerMetadata,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const contestManager = await models.ContestManager.findOne({
        where: {
          community_id: payload.community_id,
          contest_address: payload.contest_address,
        },
      });
      mustExist('Contest Manager', contestManager);

      // only delete webhooks in prod, otherwise non-prod environments may delete a prod contest webhook
      if (config.APP_ENV === 'production' && contestManager.neynar_webhook_id) {
        const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
        try {
          await client.deleteWebhook(contestManager.neynar_webhook_id);
          contestManager.neynar_webhook_id = null;
          contestManager.neynar_webhook_secret = null;
        } catch (err) {
          log.warn(
            `failed to delete neynar webhook: ${contestManager.neynar_webhook_id}`,
          );
        }
      }

      contestManager.cancelled = true;
      await contestManager.save();
      return {
        contest_managers: [contestManager.get({ plain: true })],
      };
    },
  };
}
