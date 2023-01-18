import { Request, Response, NextFunction } from 'express';
import { DB } from '../models';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoUsernameProvided: 'No username provided in query',
  UsernameAlreadyExists: 'Username already exists',
};

const createProfile = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }

  if (!req.body.username) {
    return next(new Error(Errors.NoUsernameProvided));
  }

  const { username, email, slug, name, bio, website, avatarUrl, socials, coverImage } = req.body;

  const existingProfile = await models.Profile.findOne({
    where: {
      username,
    },
  });

  if (existingProfile) {
    return next(new Error(Errors.UsernameAlreadyExists));
  }

  const userProfiles = await req.user.getProfiles();

  const profile = await models.Profile.create(
    {
      user_id: req.user.id,
      username,
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
  const newProfiles = [...userProfiles, profile];

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
