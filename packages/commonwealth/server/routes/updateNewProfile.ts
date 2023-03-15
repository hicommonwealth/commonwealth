import type { NextFunction } from 'express';
import type { TypedRequestBody, TypedResponse } from '../types';
import { failure, success } from '../types';
import type { DB } from '../models';

export const Errors = {
  NotAuthorized: 'Not authorized',
  InvalidUpdate: 'Invalid update',
  NoProfileFound: 'No profile found',
  UsernameAlreadyExists: 'Username already exists',
  NoProfileIdProvided: 'No profile id provided in query',
};

type UpdateNewProfileReq = {
  email: string;
  slug: string;
  name: string;
  bio: string;
  website: string;
  avatarUrl: string;
  socials: string;
  backgroundImage: string;
};
type UpdateNewProfileResp = {
  status: string;
};

const updateNewProfile = async (
  models: DB,
  req: TypedRequestBody<UpdateNewProfileReq>,
  res: TypedResponse<UpdateNewProfileResp>,
  next: NextFunction
) => {
  const profile = await models.Profile.findOne({
    where: {
      user_id: req.user.id,
    },
  });

  if (!profile) return next(new Error(Errors.NoProfileFound));

  if (
    !req.body.email &&
    !req.body.slug &&
    !req.body.name &&
    !req.body.bio &&
    !req.body.website &&
    !req.body.avatarUrl &&
    !req.body.socials &&
    !req.body.backgroundImage
  ) {
    return next(new Error(Errors.InvalidUpdate));
  }

  const {
    email,
    slug,
    name,
    bio,
    website,
    avatarUrl,
    socials,
    backgroundImage,
  } = req.body;

  if (profile.user_id !== req.user.id) {
    return next(new Error(Errors.NotAuthorized));
  }

  const updateStatus = await models.Profile.update(
    {
      ...(email && { email }),
      ...(slug && { slug }),
      ...(name && { profile_name: name }),
      ...(bio && { bio }),
      ...(website && { website }),
      ...(avatarUrl && { avatar_url: avatarUrl }),
      ...(socials && { socials: JSON.parse(socials) }),
      ...(backgroundImage && { background_image: JSON.parse(backgroundImage) }),
    },
    {
      where: {
        user_id: req.user.id,
      },
    }
  );

  if (!updateStatus) {
    return failure(res.status(400), {
      status: 'Failed',
    });
  }
  return success(res, {
    status: 'Success',
  });
};

export default updateNewProfile;
