import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { AppError, ServerError } from 'common-common/src/errors';

export const Errors = {
  NotLoggedIn: 'Not logged in',
};

export default async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }

  const associationParams: any = [
    {
      model: models.Thread,
      as: 'Thread',
      include: [
        {
          model: models.Address,
          as: 'Address',
        },
      ],
    },
    {
      model: models.Comment,
      as: 'Comment',
      include: [models.Address],
    },
    {
      model: models.ChainEventType,
      as: 'ChainEventType',
    },
    {
      model: models.Chain,
      as: 'Chain',
      required: true,
      where: { active: true },
    },
  ];

  const searchParams: any[] = [{ subscriber_id: req.user.id }];

  const subscriptions = await models.Subscription.findAll({
    where: {
      [Op.and]: searchParams,
    },
    include: [...associationParams],
  });

  return res.json({
    status: 'Success',
    result: subscriptions.map((s) => s.toJSON()),
  });
};
