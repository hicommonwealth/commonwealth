import { Request, Response, NextFunction } from 'express';
import { DB } from '../models';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidUpdate: 'Invalid update',
  NoProfileProvided: 'No profile provided in query',
};

const deleteProfile = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }

  if (!req.body.profileId) {
    return next(new Error(Errors.NoProfileProvided));
  }

  const { profileId } = req.body;

  const existingProfiles = await req.user.getProfiles();
  const existingAddresses = await req.user.getAddresses();

  const newProfiles = existingProfiles.filter((p) => p.id !== parseInt(profileId, 10));
  const newAddresses = existingAddresses.filter((a) => a.profile_id !== parseInt(profileId, 10));

  const updateAddressesStatus = await models.Address.update(
    {
      user_id: null
    },
    {
      where: {
        profile_id: profileId,
      }
    }
  );

  const updateProfileStatus = await models.Profile.update(
    {
      user_id: 0, // TODO: user_id cannot be null
    },
    {
      where: {
        id: profileId,
      }
    }
  );

  const updateUserStatus = await models.User.update(
    {
      Profiles: newProfiles,
      Addresses: newAddresses,
    },
    {
      where: {
        id: req.user.id,
      },
    }
  );

  if (!updateProfileStatus && !updateUserStatus && !updateAddressesStatus) {
    return res.json({
      status: 'Failed',
    });
  }

  return res.json({
    status: 'Success',
    response: req.user
  });
};

export default deleteProfile;
