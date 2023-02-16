import type { Request, Response, NextFunction } from 'express';
import type { DB } from '../models';

export const Errors = {
  NotAuthorized: 'Not authorized',
  InvalidUpdate: 'Invalid update',
  NoProfileFound: 'No profile found',
  UsernameAlreadyExists: 'Username already exists',
  NoProfileIdProvided: 'No profile id provided in query',
};

const updateNewProfile = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.profileId) {
    return next(new Error(Errors.NoProfileIdProvided));
  }

  if (
    !req.body.username &&
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
    profileId,
    username,
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

  if (username && username !== profile.username) {
    const existingProfile = await models.Profile.findOne({
      where: {
        username,
      },
    });

    if (existingProfile) {
      return next(new Error(Errors.UsernameAlreadyExists));
    }
  }

  const updateStatus = await models.Profile.update(
    {
      ...(username && { username }),
      ...(email && { email }),
      ...(slug && { slug }),
      ...(name && { profile_name: name }),
      ...(bio && { bio }),
      ...(website && { website }),
      ...(avatarUrl && { avatar_url: avatarUrl }),
      ...(socials && { socials: JSON.parse(socials) }),
      ...(coverImage && { cover_image: JSON.parse(coverImage) }),
      ...(backgroundImage && { background_image: JSON.parse(backgroundImage) }),
    },
    {
      where: {
        id: profileId,
      },
    }
  );

  if (!updateStatus) {
    return res.json({
      status: 'Failed',
    });
  }

  return res.json({
    status: 'Success',
  });
};

export default updateNewProfile;
