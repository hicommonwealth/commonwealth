import { Request, Response, NextFunction } from 'express';
import { DB } from '../models';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoProfileProvided: 'No profile provided in query',
  AddressesStillLinked: 'Cannot delete profile with addresses',
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

  const profileToDelete = await models.Profile.findOne({
    where: {
      id: profileId,
    },
  });

  const existingAddresses = await profileToDelete.getAddresses();

  if (existingAddresses.length > 0) {
    return next(new Error(Errors.AddressesStillLinked));
  }

  const existingProfiles = await req.user.getProfiles();
  const newProfiles = existingProfiles.filter(
    (p) => p.id !== parseInt(profileId, 10)
  );

  const updateProfileStatus = await models.Profile.destroy({
    where: {
      id: profileId,
    },
  });

  const updateUserStatus = await models.User.update(
    {
      Profiles: newProfiles,
    },
    {
      where: {
        id: req.user.id,
      },
    }
  );

  if (!updateProfileStatus && !updateUserStatus) {
    return res.json({
      status: 'Failed',
    });
  }

  return res.json({
    status: 'Success',
  });
};

export default deleteProfile;
