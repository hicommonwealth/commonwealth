import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';

export const Errors = {
  NotLoggedIn: 'Not signed in',
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
      model: models.Chain,
      as: 'Chain',
      required: false,
      where: { active: true },
    },
    {
      model: models.SubscriptionDelivery,
      as: 'SubscriptionDelivery',
      include: [
        // Add this include array
        {
          model: models.DeliveryMechanism,
          as: 'DeliveryMechanism',
        },
      ],
    },
  ];

  const subscriptions = await models.Subscription.findAll({
    where: {
      subscriber_id: req.user.id,
    },
    include: [...associationParams],
  });

  return res.json({
    status: 'Success',
    result: subscriptions.map((s) => s.toJSON()),
  });
};
