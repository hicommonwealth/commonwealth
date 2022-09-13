import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { AppError, ServerError } from '../../util/errors';

export const Errors = {
  NotLoggedIn: 'Not logged in',
};

export default async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }

  const associationParams: any = [
    {
      model: models.Thread,
      as: 'Thread',
    }, {
      model: models.Comment,
      as: 'Comment',
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
