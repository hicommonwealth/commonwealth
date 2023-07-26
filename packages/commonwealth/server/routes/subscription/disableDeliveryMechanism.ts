import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';

const Errors = {
  NotLoggedIn: 'Thread not found',
  InvalidInput: 'Invalid permissions',
  InvalidDeliveryMechanism: 'Invalid delivery mechanism',
  NoMechanismFound: 'No mechanism found for user',
};

export const disableDeliveryMechanism = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  const { type } = req.body;

  if (!type) {
    return next(new AppError(Errors.InvalidInput));
  }

  const mechanism = await models.DeliveryMechanism.findOne({
    where: { type: type, user_id: req.user.id },
  });

  if (!mechanism) {
    return next(new AppError(Errors.NoMechanismFound));
  }

  mechanism.enabled = false;

  const disabledMechanism = await mechanism.save();

  return res.json({ status: 'Success', result: disabledMechanism });
};

export default disableDeliveryMechanism;
