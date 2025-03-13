import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';

export function GetAllowTokenizedThreads(): Query<
  typeof schemas.GetAllowTokenizedThreads
> {
  return {
    ...schemas.GetAllowTokenizedThreads,
    auth: [],
    body: async ({ payload }) => {
      const { community_id, topic_id } = payload;

      const communityAllowed = await models.Community.findOne({
        where: { id: community_id },
        attributes: ['allow_tokenized_threads'],
      });

      mustExist('Community', communityAllowed);

      const topicAllowed = await models.Topic.findOne({
        where: { id: topic_id },
        attributes: ['allow_tokenized_threads'],
      });

      mustExist('Topic', topicAllowed);

      // CommunityAllowed takes precedence. If not allowed,
      // check if specific topic is allowed
      return {
        tokenized_threads_enabled: communityAllowed.allow_tokenized_threads
          ? true
          : topicAllowed.allow_tokenized_threads,
      };
    },
  };
}
