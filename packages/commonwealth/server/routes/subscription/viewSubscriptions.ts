import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';

export const Errors = {
  NotLoggedIn: 'Not logged in',
};

export default async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }

  const associationParams: any = [
    {
      model: models.Thread,
      as: 'Thread',
    }, {
      model: models.Comment,
      as: 'Comment',
    }, {
    // TODO: this doesn't mean what we think it does anymore i.e. this only returns id's
      model: models.ChainEventType,
      as: 'ChainEventType',
    }];

  const searchParams: any[] = [
    { subscriber_id: req.user.id },
  ];

  const subscriptions = await models.Subscription.findAll({
    where: {
      [Op.and]: searchParams
    },
    include: [ ...associationParams ],
  });

  return res.json({ status: 'Success', result: subscriptions.map((s) => s.toJSON()) });
};
