import { Command } from '@hicommonwealth/core';
import { config, models } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import _ from 'lodash';
import { Op } from 'sequelize';
import { mustExist } from '../middleware/guards';

// NOTE: this is NOT concurrency safe

export function UpdateContestManagerFrameHashes(): Command<
  typeof schemas.UpdateContestManagerFrameHashes
> {
  return {
    ...schemas.UpdateContestManagerFrameHashes,
    auth: [],
    body: async ({ payload }) => {
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
      });
      mustExist('Contest Manager', contestManager);

      // find webhook by ID
      const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
      const { webhook: existingCastWebhook } = await client.lookupWebhook(
        config.CONTESTS.NEYNAR_CAST_WEBHOOK_ID!,
      );
      mustExist('Neynar Webhook', existingCastWebhook);

      // remove and add hashes to subscription
      const parent_hashes = _.uniq([
        ...(existingCastWebhook?.subscription?.filters['cast.created']
          ?.parent_hashes || []),
        ...(existingCastWebhook?.subscription?.filters['cast.deleted']
          ?.parent_hashes || []),
      ])
        .filter((hash) => {
          return (payload.frames_to_remove || []).includes(hash);
        })
        .concat(payload.frames_to_add || []);

      const subscription = {
        ...(existingCastWebhook.subscription?.filters || {}),
        // reply cast created on parent
        'cast.created': {
          ...(existingCastWebhook.subscription?.filters['cast.created'] || {}),
          parent_hashes,
        },
        // reply cast deleted on parent
        'cast.deleted': {
          ...(existingCastWebhook.subscription?.filters['cast.deleted'] || {}),
          parent_hashes,
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

      // update contest manager frame hashes
      contestManager.farcaster_frame_hashes = parent_hashes;
      await contestManager.save();
    },
  };
}
