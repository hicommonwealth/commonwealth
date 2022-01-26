import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const Op = Sequelize.Op;
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NotifyUserNonExist: 'Notification account not found.'
};

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }

  // get the fake user's data from the User model
  const notifyUser = await models.User.findOne({
    where: 
      {
        email: 'notifications@commonwealth.im'
      },
  });

  if(!notifyUser){
    return next(new Error(Errors.NotifyUserNonExist));
  }

  // locate active subscriptions, filter by category if specified
  const userSearchParams: any[] = [{ subscriber_id: req.user.id }];
  if (req.body.active_only) {
    userSearchParams.push({ is_active: true });
  }
  if (req.body.categories && req.body.categories.length) {
    userSearchParams.push({
      category_id: {
        [Op.contained]: req.body.categories,
      },
    });
  }

  // locate active subscriptions, filter by communityIds if specified
  const communitySearchParams = {
    subscriber_id: notifyUser.id,
    [Op.or]: [
      {
        chain_id:
        {
          [Op.in]: req.body.communityIds ? req.body.communityIds.split(',') : []
        }
      },
      {
        community_id:
        {
          [Op.in]: req.body.communityIds ? req.body.communityIds.split(',') : []
        }
      }
    ]
  };

  // only locate unread notifications if specified
  const notificationParams: any = {
    model: models.Notification,
    as: 'Notifications',
    include: [
      {
        model: models.ChainEvent,
        required: false,
        as: 'ChainEvent',
        include: [
          {
            model: models.ChainEventType,
            required: false,
            as: 'ChainEventType',
          },
        ],
      },
    ],
  };
  if (req.body.unread_only) {
    notificationParams.where = { is_read: false };
  }

  // perform the query
  const subscriptions = await models.Subscription.findAll({
    where: {
      [Op.or]: [
        { [Op.and]: userSearchParams },
        communitySearchParams
      ]
    },
    include: [notificationParams]
  });

  if (req.body.include_latest_activity_data) {
    for (let i = 0; i < subscriptions.length; i++) {
      const subscriptionJSON = subscriptions[i];
      for (let j = 0; j < subscriptionJSON.Notifications.length; j++) {
        const notificationJSON = subscriptionJSON.Notifications[j];
        const obj = JSON.parse(notificationJSON.notification_data);

        const { root_id, root_type, comment_id, chain_id, community_id } = obj;

        const comment_count = await models.OffchainComment.count({
          where: {
            root_id: `${root_type}_${root_id}`,
          },
        });
        const like_count = await models.OffchainReaction.count({
          where:
            comment_id !== undefined
              ? {
                reaction: 'like',
                comment_id,
              }
              : {
                reaction: 'like',
                thread_id: root_id,
              },
        });
        const views = await models.OffchainViewCount.findOne({
          where: community_id
            ? {
              object_id: `${root_id}`,
            }
            : {
              chain: chain_id,
              object_id: `${root_id}`,
            },
        });

        subscriptions[i].Notifications[j].notification_data = JSON.stringify({
          ...obj,
          view_count: views ? views.view_count : 0,
          like_count,
          comment_count,
        });
      }
    }
  }

  // TODO: flatten? sort by date?
  return res.json({
    status: 'Success',
    result: subscriptions.map((s) => s.toJSON()),
  });
};
