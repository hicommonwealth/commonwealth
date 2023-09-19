import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { DeliveryMechanismType } from 'commonwealth/shared/types';

const Errors = {
  NotLoggedIn: 'Thread not found',
  InvalidInput: 'Invalid permissions',
  InvalidDeliveryMechanism: 'Invalid delivery mechanism',
  NoMechanismFound: 'No mechanism found for user',
  MechanismExists: 'Mechanism already exists for user',
};

export const addDeliveryMechanism = async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  const { type, identifier, enabled } = req.body;

  if (!type || !identifier || !enabled) {
    return next(new AppError(Errors.InvalidInput));
  }

  if (!DeliveryMechanismType === type) {
    return next(new AppError(Errors.InvalidDeliveryMechanism));
  }

  const existingMechanism = await models.DeliveryMechanism.findOne({
    where: {
      type,
      identifier,
      user_id: req.user.id,
    },
  });

  if (existingMechanism) {
    return res.json({ status: 'Mechanism Exists', result: existingMechanism });
  }

  const newMechanism = {
    type,
    identifier,
    user_id: req.user.id,
    enabled: enabled,
  };

  const createdMechanism = await models.DeliveryMechanism.create(newMechanism);

  return res.json({ status: 'Success', result: createdMechanism });
};

export default addDeliveryMechanism;
