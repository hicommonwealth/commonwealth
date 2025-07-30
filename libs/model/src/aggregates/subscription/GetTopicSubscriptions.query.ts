import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function GetTopicSubscriptions(): Query<
  typeof schemas.GetTopicSubscriptions
> {
  return {
    ...schemas.GetTopicSubscriptions,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      return (
        await models.TopicSubscription.findAll({
          where: { user_id: actor.user.id },
          include: [
            {
              model: models.Topic,
              required: true,
              attributes: ['id', 'name'],
            },
          ],
        })
      ).map((subscription) => subscription.get({ plain: true }));
    },
  };
}
