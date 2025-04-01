import { Command, logger } from '@hicommonwealth/core';
import { config, models } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { Mutex } from 'async-mutex';
import _ from 'lodash';
import { Op } from 'sequelize';
import { mustExist } from '../../middleware/guards';

const log = logger(import.meta);

const Errors = {
  ContestEnded: 'Contest has ended',
};

const neynarMutex = new Mutex();

export function UpdateContestManagerFrameHashes(): Command<
  typeof schemas.UpdateContestManagerFrameHashes
> {
  return {
    ...schemas.UpdateContestManagerFrameHashes,
    auth: [],
    body: async ({ payload }) => {
      await neynarMutex.runExclusive(async () => {
        const contestManager = await models.ContestManager.findOne({
          where: {
            contest_address: payload.contest_address,
            cancelled: {
              [Op.not]: true,
            },
            ended: {
              [Op.not]: true,
            },
          },
          include: [
            {
              model: models.Contest,
              required: true,
            },
          ],
        });
        mustExist('Contest Manager', contestManager);
        if (new Date() > contestManager.contests![0]!.end_time) {
          log.warn(`${Errors.ContestEnded}: ${contestManager.contest_address}`);
          return;
        }

        // find webhook by ID
        const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
        const { webhook: existingCastWebhook } = await client.lookupWebhook(
          config.CONTESTS.NEYNAR_CAST_WEBHOOK_ID!,
        );
        mustExist('Neynar Webhook', existingCastWebhook);

        // remove and add hashes to subscription
        const allParentHashes = _.uniq([
          ...(existingCastWebhook?.subscription?.filters['cast.created']
            ?.parent_hashes || []),
          ...(existingCastWebhook?.subscription?.filters['cast.deleted']
            ?.parent_hashes || []),
        ])
          .filter((hash) => {
            return !(payload.frames_to_remove || []).includes(hash);
          })
          .concat(payload.frames_to_add || []);

        const subscription = {
          ...(existingCastWebhook.subscription?.filters || {}),
          // reply cast created on parent
          'cast.created': {
            ...(existingCastWebhook.subscription?.filters['cast.created'] ||
              {}),
            parent_hashes: allParentHashes,
          },
          // reply cast deleted on parent
          'cast.deleted': {
            ...(existingCastWebhook.subscription?.filters['cast.deleted'] ||
              {}),
            parent_hashes: allParentHashes,
          },
        };

        await client.updateWebhook(
          existingCastWebhook.webhook_id,
          existingCastWebhook.title,
          existingCastWebhook.target_url,
          {
            subscription,
          },
        );

        if (!payload.webhooks_only) {
          // update contest manager frame hashes
          contestManager.farcaster_frame_hashes = (
            contestManager.farcaster_frame_hashes || []
          )
            .filter((hash) => {
              return !(payload.frames_to_remove || []).includes(hash);
            })
            .concat(payload.frames_to_add || []);
          await contestManager.save();
        }
      });
    },
  };
}
