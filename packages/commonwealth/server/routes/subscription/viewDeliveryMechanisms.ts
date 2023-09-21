import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';

const Errors = {
  NotLoggedIn: 'Thread not found',
};

export const viewDeliveryMechanisms = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }

  const mechanisms = await models.DeliveryMechanism.findAll({
    where: { user_id: req.user.id },
  });

  return res.json({ status: 'Success', result: mechanisms });
};

export default viewDeliveryMechanisms;
