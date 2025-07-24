import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authTopic, mustExist } from '../../middleware';
import { emitEvent } from '../../utils';

const Errors = {
  RefreshInProgress:
    'A vote recalculation is already in progress for this topic',
  RefreshTooRecent:
    'Vote recalculation can only be performed once every 5 minutes',
};

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
        attributes: [
          'id',
          'community_id',
          'name',
          'recalculated_votes_start',
          'recalculated_votes_finish',
        ],
      });
      mustExist('Topic', topic);

      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Check if a recalculation is currently in progress (start timestamp exists but no finish timestamp)
      if (topic.recalculated_votes_start && !topic.recalculated_votes_finish) {
        throw new InvalidState(Errors.RefreshInProgress);
      }

      // Check if the last recalculation was less than 5 minutes ago
      if (
        topic.recalculated_votes_start &&
        topic.recalculated_votes_start > fiveMinutesAgo
      ) {
        throw new InvalidState(Errors.RefreshTooRecent);
      }

      // Set the start timestamp and clear the finish timestamp
      await topic.update({
        recalculated_votes_start: now,
        recalculated_votes_finish: null,
      });

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
