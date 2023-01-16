import { Request, Response, NextFunction } from 'express';
import { DB } from '../models';

export const Errors = {
  NotAuthorized: 'Not authorized',
  InvalidUpdate: 'Invalid update',
  NoUsernameProvided: 'No username provided in query',
};

const createProfile = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.name) {
    return next(new Error(Errors.NoUsernameProvided));
  }

  if (
    !req.body.email &&
    !req.body.slug &&
    !req.body.name &&
    !req.body.bio &&
    !req.body.website &&
    !req.body.avatarUrl &&
    !req.body.socials &&
    !req.body.coverImage
  ) {
    return next(new Error(Errors.InvalidUpdate));
  }

  const { email, slug, name, bio, website, avatarUrl, socials, coverImage } = req.body;

  const existingProfiles = await req.user.getProfiles();

  const profile = await models.Profile.create(
    {
      user_id: req.user.id,
      ...(email && { email }),
      ...(slug && { slug }),
      ...(name && { profile_name: name }),
      ...(bio && { bio }),
      ...(website && { website }),
      ...(avatarUrl && { avatar_url: avatarUrl }),
      ...(socials && { socials: JSON.parse(socials) }),
      ...(coverImage && { cover_image: JSON.parse(coverImage) }),
    },
  );
  const newProfiles = [...existingProfiles, profile];

  const updateStatus = await models.User.update(
    {
      Profiles: newProfiles,
    },
    {
      where: {
        id: req.user.id,
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

export default createProfile;
