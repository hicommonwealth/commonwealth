import { EventNames, InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
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
      // map FC CastCreated to CW ThreadCreated
      const contestManager = await models.ContestManager.findOne({
        where: {
          farcaster_frame_url: payload.data.root_parent_url,
        },
      });
      if (!contestManager) {
        throw new InvalidState(
          `contest manager not found for frame: ${payload.data.root_parent_url}`,
        );
      }
      // assuming farcaster contest only has 1 topic
      const contestTopic = await models.ContestTopic.findOne({
        where: {
          contest_address: contestManager.contest_address,
        },
      });
      if (!contestTopic) {
        throw new InvalidState(
          `contest manager ${contestManager.contest_address} not associated with any topics`,
        );
      }
      await emitEvent(models.Outbox, [
        {
          event_name: EventNames.ThreadCreated,
          event_payload: {
            address: payload.data.author.custody_address,
            address_id: 0,
            community_id: contestManager.community_id,
            topic_id: contestTopic.topic_id,
            title: 'Farcaster Contest Reply',
            kind: 'discussion',
            stage: 'active',
            view_count: 0,
            reaction_count: 0,
            reaction_weights_sum: 0,
            comment_count: 0,
            max_notif_id: 0,
            contestManagers: [contestManager.toJSON()],
          },
        },
      ]);
    },
  };
}
