import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';

export function GetTokenizedThreadsAllowed(): Query<
  typeof schemas.GetTokenizedThreadsAllowed
> {
  return {
    ...schemas.GetTokenizedThreadsAllowed,
    auth: [],
    body: async ({ payload }) => {
      const { community_id, topic_id } = payload;

      const result = await models.Community.findOne({
        where: { id: community_id },
        attributes: ['allow_tokenized_threads'],
        include: [
          {
            model: models.Topic,
            as: 'topics',
            where: { id: topic_id },
            attributes: ['allow_tokenized_threads'],
            required: true,
          },
        ],
      });

      mustExist('Community', result);
      mustExist('Topics', result!.topics![0]);

      const communityAllowed = result!.allow_tokenized_threads;
      const topicAllowed = result!.topics![0].allow_tokenized_threads ?? false;

      return {
        tokenized_threads_enabled: communityAllowed || topicAllowed,
      };
    },
  };
}
