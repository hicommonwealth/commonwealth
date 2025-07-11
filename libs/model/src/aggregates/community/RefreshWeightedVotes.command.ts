import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authTopic, mustExist } from '../../middleware';
import { emitEvent } from '../../utils';

export function RefreshWeightedVotes(): Command<
  typeof schemas.RefreshWeightedVotes
> {
  return {
    ...schemas.RefreshWeightedVotes,
    auth: [authTopic({ roles: ['admin'] })],
    body: async ({ payload, actor }) => {
      const { topic_id, community_id } = payload;

      const topic = await models.Topic.findOne({
        where: { id: topic_id, community_id },
        attributes: ['id', 'community_id', 'name'],
      });
      mustExist('Topic', topic);

      // emit event to refresh async
      await emitEvent(models.Outbox, [
        {
          event_name: 'RefreshWeightedVotesRequested',
          event_payload: {
            topic_id,
            community_id,
          },
        },
      ]);

      return {
        topic_id,
        community_id,
      };
    },
  };
}
