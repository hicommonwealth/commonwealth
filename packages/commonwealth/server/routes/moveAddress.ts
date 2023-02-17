import type { Request, Response, NextFunction } from 'express';
import type { DB } from '../models';

export const Errors = {
  NotAuthorized: 'Not authorized',
  InvalidUpdate: 'Invalid update',
  NoAddressProvided: 'No address provided in query',
  NoOldProfileProvided: 'No old profile provided in query',
  NoNewProfileProvided: 'No new profile provided in query',
};

const moveAddress = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.address) {
    return next(new Error(Errors.NoAddressProvided));
  }

  if (!req.body.oldProfileId) {
    return next(new Error(Errors.NoOldProfileProvided));
  }

  if (!req.body.newProfileId) {
    return next(new Error(Errors.NoNewProfileProvided));
  }

  const { address, oldProfileId, newProfileId } = req.body;

  const addressToMove = await models.Address.findOne({
    where: {
      address: address,
    },
  });

  const oldProfile = await models.Profile.findOne({
    where: {
      id: oldProfileId,
    },
  });

  const newProfile = await models.Profile.findOne({
    where: {
      id: newProfileId,
    },
  });

  if (
    req.user.id !== oldProfile.user_id ||
    req.user.id !== newProfile.user_id
  ) {
    return next(new Error(Errors.NotAuthorized));
  }

  const oldProfilesAddresses = await oldProfile.getAddresses();
  const newProfilesAddresses = await newProfile.getAddresses();

  const addressUpdate = await addressToMove.update({
    profile_id: newProfileId,
  });

  const oldProfileUpdate = await oldProfile.update({
    user_id: req.user.id,
    Addresses: oldProfilesAddresses.filter((a) => a.address !== address),
  });

  const newProfileUpdate = await newProfile.update({
    Addresses: [...newProfilesAddresses, addressToMove],
  });

  if (!addressUpdate && !oldProfileUpdate && !newProfileUpdate) {
    return res.json({
      status: 'Failed',
    });
  }

  return res.json({
    status: 'Success',
  });
};

export default moveAddress;
