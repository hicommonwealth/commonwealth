import { Query } from '@hicommonwealth/core';
import { NotificationCategories, queries } from '@hicommonwealth/shared';
import { models } from '../database';

export const GetChainActivity: Query<typeof queries.ChainFeed> = () => ({
  ...queries.ChainFeed,
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
