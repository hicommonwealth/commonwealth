import { NotificationCategories, Query, schemas } from '@hicommonwealth/core';
import { models } from '../database';

export const GetChainActivity: Query<
  typeof schemas.queries.ChainFeed
> = () => ({
  ...schemas.queries.ChainFeed,
  auth: [],
  body: async () => {
    const ceNotifs = await models.Notification.findAll({
      where: {
        category_id: NotificationCategories.ChainEvent,
      },
      limit: 50,
      order: [['created_at', 'DESC']],
    });

    return ceNotifs.map((n) =>
      JSON.parse(n.toJSON()['notification_data']),
    ) as any;
  },
});
