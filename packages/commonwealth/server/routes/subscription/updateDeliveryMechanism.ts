import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { DeliveryMechanismType } from 'commonwealth/shared/types';

const Errors = {
  NotLoggedIn: 'Thread not found',
  InvalidInput: 'Invalid permissions',
  InvalidDeliveryMechanism: 'Invalid delivery mechanism',
  NoMechanismFound: 'No mechanism found for user',
};

export const updateDeliveryMechanism = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  const { type, identifier, enabled } = req.body;

  if (!type || !identifier) {
    return next(new AppError(Errors.InvalidInput));
  }

  if (!DeliveryMechanismType === type) {
    return next(new AppError(Errors.InvalidDeliveryMechanism));
  }

  const mechanism = await models.DeliveryMechanism.findOne({
    where: { type: type, user_id: req.user.id },
  });

  if (!mechanism) {
    return next(new AppError(Errors.NoMechanismFound));
  }

  mechanism.type = type;
  mechanism.identifier = identifier;
  mechanism.enabled = enabled;

  const updatedMechanism = await mechanism.save();

  return res.json({ status: 'Success', result: updatedMechanism });
};

export default updateDeliveryMechanism;
