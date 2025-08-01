import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function DeleteTopicSubscription(): Command<
  typeof schemas.DeleteTopicSubscription
> {
  return {
    ...schemas.DeleteTopicSubscription,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      return await models.TopicSubscription.destroy({
        where: {
          user_id: actor.user.id,
          topic_id: payload.topic_ids,
        },
      });
    },
  };
}
