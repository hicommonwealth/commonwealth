import { EventNames, InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { emitEvent } from '../utils';

// This webhook processes the cast action event:
// https://docs.farcaster.xyz/reference/actions/spec#actions-specification
export function FarcasterActionWebhook(): Command<
  typeof schemas.FarcasterCastCreatedWebhook
> {
  return {
    ...schemas.FarcasterCastCreatedWebhook,
    auth: [],
    body: async ({ payload }) => {
      // map FC Action to CW ThreadUpvoted
      const contestManager = await models.ContestManager.findOne({
        where: {
          farcaster_frame_hashes: payload.cast_id.hash,
        },
      });
      if (!contestManager) {
        throw new InvalidState(
          `contest manager not found for frame: ${payload.cast_id.hash}`,
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
          event_name: EventNames.ThreadUpvoted,
          event_payload: {
            address: payload.address,
            address_id: 0,
            reaction: 'like',
            communityId: contestManager.community_id,
            topicId: contestTopic.topic_id,
            contestManagers: [contestManager.toJSON()],
          },
        },
      ]);
    },
  };
}
