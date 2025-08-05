import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function CreateTopicSubscription(): Command<
  typeof schemas.CreateTopicSubscription
> {
  return {
    ...schemas.CreateTopicSubscription,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const [subscription] = await models.TopicSubscription.findOrCreate({
        where: {
          user_id: actor.user.id!,
          topic_id: payload.topic_id,
        },
      });
      return subscription.get({ plain: true });
    },
  };
}
