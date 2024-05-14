import type { DB } from '@hicommonwealth/model';
import { ProfileAttributes } from '@hicommonwealth/model';
import type { NextFunction } from 'express';
import { sanitizeQuillText } from 'server/util/sanitizeQuillText';
import { updateTags } from 'server/util/updateTags';
import type { TypedRequestBody, TypedResponse } from '../types';
import { failure, success } from '../types';

export const Errors = {
  NotAuthorized: 'Not authorized',
  NoProfileFound: 'No profile found',
  UsernameAlreadyExists: 'Username already exists',
  NoProfileIdProvided: 'No profile id provided in query',
  InvalidTagIds: 'Some tag ids are invalid',
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
  tag_ids?: number[];
};
type UpdateNewProfileResp = {
  status: string;
  profile: ProfileAttributes;
};

const updateNewProfile = async (
  models: DB,
  req: TypedRequestBody<UpdateNewProfileReq>,
  res: TypedResponse<UpdateNewProfileResp>,
  next: NextFunction,
) => {
  const profile = await models.Profile.findOne({
    where: {
      user_id: req.user.id,
    },
  });

  if (!profile) return next(new Error(Errors.NoProfileFound));

  const {
    email,
    slug,
    name,
    website,
    avatarUrl,
    socials,
    backgroundImage,
    tag_ids,
  } = req.body;

  let { bio } = req.body;
  bio = sanitizeQuillText(bio);

  if (profile.user_id !== req.user.id) {
    return next(new Error(Errors.NotAuthorized));
  }

  const [updateStatus, rows] = await models.Profile.update(
    {
      ...((email || email === '') && { email }),
      ...(slug && { slug }),
      ...(name && { profile_name: name }),
      ...((bio || bio === '') && { bio }),
      ...(website && { website }),
      ...(avatarUrl && { avatar_url: avatarUrl }),
      ...(socials && { socials: JSON.parse(socials) }),
      ...(backgroundImage && { background_image: JSON.parse(backgroundImage) }),
    },
    {
      where: {
        user_id: req.user.id,
      },
      returning: true,
    },
  );

  await updateTags(tag_ids, models, profile.id, 'profile_id');

  if (!updateStatus || !rows) {
    return failure(res.status(400), {
      status: 'Failed',
    });
  }
  return success(res, {
    status: 'Success',
    profile: rows[0].toJSON(),
  });
};

export default updateNewProfile;
