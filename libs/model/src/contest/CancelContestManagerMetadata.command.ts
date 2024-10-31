import { logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { config } from '../config';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { mustExist } from '../middleware/guards';

const log = logger(import.meta);

export function CancelContestManagerMetadata(): Command<
  typeof schemas.CancelContestManagerMetadata,
  AuthContext
> {
  return {
    ...schemas.CancelContestManagerMetadata,
    auth: [isAuthorized({ roles: ['admin'] })],
    body: async ({ payload }) => {
      const contestManager = await models.ContestManager.findOne({
        where: {
          community_id: payload.id,
          contest_address: payload.contest_address,
        },
      });
      mustExist('Contest Manager', contestManager);

      if (contestManager.neynar_webhook_id) {
        const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
        try {
          await client.deleteWebhook(contestManager.neynar_webhook_id);
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
