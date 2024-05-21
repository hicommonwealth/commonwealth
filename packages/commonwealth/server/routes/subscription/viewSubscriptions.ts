import { AppError } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';

export const Errors = {
  NotLoggedIn: 'Not signed in',
};

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }

  const associationParams = [
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
      model: models.Community,
      required: false,
      where: { active: true },
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
