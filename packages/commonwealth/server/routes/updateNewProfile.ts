import type { NextFunction } from 'express';
import type { TypedRequestBody, TypedResponse } from '../types';
import type { DB } from '../models';
import { success, failure } from '../types';

export const Errors = {
  NotAuthorized: 'Not authorized',
  InvalidUpdate: 'Invalid update',
  NoProfileFound: 'No profile found',
  NoProfileIdProvided: 'No profile id provided in query',
  ProfileNameInvalid: 'Profile name invalid',
};

type UpdateNewProfileReq = {
  profileId: string;
  email?: string;
  slug?: string;
  name?: string;
  bio?: string;
  website?: string;
  avatarUrl?: string;
  socials?: string;
  coverImage?: string;
  backgroundImage?: string;
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
  let profileId = req.body.profileId;
  if (!profileId) {
    const user = await models.User.findOne({
      where: {
        id: req.user.id,
      },
    });

    const userProfile = await models.Profile.findOne({
      where: {
        user_id: user.id,
      },
    });

    if (!userProfile) {
      return next(new Error(Errors.NoProfileFound));
    }
    profileId = userProfile.id.toString();
  }

  if (
    !req.body.email &&
    !req.body.slug &&
    !req.body.name &&
    !req.body.bio &&
    !req.body.website &&
    !req.body.avatarUrl &&
    !req.body.socials &&
    !req.body.coverImage &&
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
    coverImage,
    backgroundImage,
  } = req.body;

  const profile = await models.Profile.findOne({
    where: {
      id: profileId,
    },
  });
  if (!profile) return next(new Error(Errors.NoProfileFound));

  if (profile.user_id !== req.user.id) {
    return next(new Error(Errors.NotAuthorized));
  }

  if (name) {
    // eslint-disable-next-line no-useless-escape
    const regex = /^([a-zA-Z0-9 \_\-]+)$/;
    if (!regex.test(name)) {
      return next(new Error(Errors.ProfileNameInvalid));
    }
  }

  const updateStatus = await models.Profile.update(
    {
      // ...(email && { email }),
      // ...(slug && { slug }),
      ...(name && { profile_name: name }),
      // ...(bio && { bio }),
      // ...(website && { website }),
      // ...(avatarUrl && { avatar_url: avatarUrl }),
      // ...(socials && { socials: JSON.parse(socials) }),
      // ...(coverImage && { cover_image: JSON.parse(coverImage) }),
      // ...(backgroundImage && { background_image: JSON.parse(backgroundImage) }),
    },
    {
      where: {
        id: profileId,
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
