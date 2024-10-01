import { EventNames, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { emitEvent } from '../utils';

// This webhook processes the "cast.created" event
// from a programmatic Neynar webhook for REPLIES to a cast:
// https://docs.neynar.com/docs/how-to-setup-webhooks-from-the-dashboard
export function FarcasterReplyCastCreatedWebhook(): Command<
  typeof schemas.FarcasterCastCreatedWebhook
> {
  return {
    ...schemas.FarcasterCastCreatedWebhook,
    auth: [],
    body: async ({ payload }) => {
      // console.log('REPLY: ', payload);

      mustExist('Parent Hash', payload.data.parent_hash);

      const contestManager = await models.ContestManager.findOne({
        where: {
          cancelled: false,
          ended: {
            [Op.not]: true,
          },
          farcaster_frame_hashes: {
            [Op.contains]: [payload.data.parent_hash!],
          },
        },
      });
      mustExist('Contest Manager', contestManager);

      console.log(contestManager);

      const contestTopic = await models.ContestTopic.findOne({
        where: {
          contest_address: contestManager.contest_address,
        },
      });
      mustExist('Contest Topic', contestTopic);

      await emitEvent(models.Outbox, [
        {
          event_name: EventNames.ThreadCreated,
          event_payload: {
            address: payload.data.author.custody_address,
            address_id: 0,
            community_id: contestManager.community_id,
            topic_id: contestTopic.topic_id,
            title: 'Farcaster Contest Reply',
            body: payload.data.text,
            kind: 'discussion',
            stage: 'active',
            view_count: 0,
            reaction_count: 0,
            reaction_weights_sum: 0,
            comment_count: 0,
            contestManagers: [
              {
                contest_address: contestManager.contest_address,
              },
            ],
          },
        },
      ]);
    },
  };
}
