import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
};

export default async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }

  const notificationParams: any = {
    model: models.Notification,
    as: 'Notifications',
    include: [{
      model: models.ChainEvent,
      required: false,
      as: 'ChainEvent',
      include: [{
        model: models.ChainEventType,
        required: false,
        as: 'ChainEventType',
      }, ],
    },]
  };

  const associationParams: any = [
    notificationParams,
    {
      model: models.Chain,
      as: 'Chain',
    }, {
      model: models.OffchainCommunity,
      as: 'OffchainCommunity',
    }, {
      model: models.OffchainThread,
      as: 'OffchainThread',
    }, {
      model: models.OffchainComment,
      as: 'OffchainComment',
    }, {
      model: models.ChainEventType,
      as: 'ChainEventType',
    // // }, {
    // //   model: models.ChainEntity,
    // //   as: 'ChainEntity',
    }];

  const subscriptions = await models.Subscription.findAll({
    where: { subscriber_id: req.user.id },
    include: [ ...associationParams ],
  });
  return res.json({ status: 'Success', result: subscriptions.map((s) => s.toJSON()) });
};
