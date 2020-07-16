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

  const associationParams: any = [{
    model: models.Chain,
    required: false,
    as: 'Chain',
  }, {
    model: models.OffchainCommunity,
    required: false,
    as: 'OffchainCommunity',
  }, {
    model: models.OffchainThread,
    required: false,
    as: 'OffchainThread',
  }, {
    model: models.OffchainComment,
    required: false,
    as: 'OffchainComment',
  }, {
    model: models.ChainEventType,
    required: false,
    as: 'ChainEventType',
  }, {
    model: models.ChainEntity,
    required: false,
    as: 'ChainEntity',
  }];

  const subscriptions = await models.Subscription.findAll({
    where: { subscriber_id: req.user.id },
    include: [ ...associationParams ],
  });
  return res.json({ status: 'Success', result: subscriptions.map((s) => s.toJSON()) });
};
