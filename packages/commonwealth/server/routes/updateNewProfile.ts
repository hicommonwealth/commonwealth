import type { NextFunction } from 'express';
import type { TypedRequestBody, TypedResponse } from '../types';
import type { DB } from '../models';
import { success, failure } from '../types';

export const Errors = {
  NotAuthorized: 'Not authorized',
  InvalidUpdate: 'Invalid update',
  NoProfileFound: 'No profile found',
  NoAddressFound: 'No address found',
  NoAddressProvided: 'No address provided in query',
};

type UpdateNewProfileReq = {
  address: string;
  email: string;
  slug: string;
  name: string;
  bio: string;
  website: string;
  avatarUrl: string;
  socials: string;
  coverImage: string;
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
  if (!req.body.address) {
    return next(new Error(Errors.NoAddressProvided));
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
    address,
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

  const addressModel = await models.Address.findOne({
    where: {
      address,
    },
    include: [models.OffchainProfile, models.Profile],
  });
  if (!addressModel) return next(new Error(Errors.NoAddressFound));

  if (addressModel.user_id !== req.user.id) {
    return next(new Error(Errors.NotAuthorized));
  }

  const profile = await addressModel.getProfile();
  if (!profile) return next(new Error(Errors.NoProfileFound));

  const updateStatus = await models.Profile.update(
    {
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
        id: profile.id,
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
