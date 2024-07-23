import type { DB } from '@hicommonwealth/model';
import {
  Image,
  UpdateNewProfileReq,
  User,
  UserProfile,
} from '@hicommonwealth/schemas';
import { DEFAULT_NAME } from '@hicommonwealth/shared';
import { sanitizeQuillText } from 'server/util/sanitizeQuillText';
import { updateTags } from 'server/util/updateTags';
import { z } from 'zod';
import type { TypedRequestBody, TypedResponse } from '../types';
import { failure, success } from '../types';

export const Errors = {
  NotAuthorized: 'Not authorized',
  NoProfileFound: 'No profile found',
  UsernameAlreadyExists: 'Username already exists',
  NoProfileIdProvided: 'No profile id provided in query',
  InvalidTagIds: 'Some tag ids are invalid',
};

const updateNewProfile = async (
  models: DB,
  req: TypedRequestBody<z.infer<typeof UpdateNewProfileReq>>,
  res: TypedResponse<z.infer<typeof UserProfile>>,
) => {
  const user = req.user!;
  const {
    email,
    slug,
    name,
    website,
    avatar_url,
    socials,
    bio: rawBio,
    backgroundImage,
    promotionalEmailsEnabled,
    tag_ids,
  } = req.body;

  const new_name =
    name &&
    name !== DEFAULT_NAME &&
    (!user.profile.name || user.profile.name === DEFAULT_NAME);
  const is_welcome_onboard_flow_complete =
    !!new_name && !user.is_welcome_onboard_flow_complete;
  const promotional_emails_enabled =
    typeof promotionalEmailsEnabled === 'boolean' && promotionalEmailsEnabled;
  const user_delta: Partial<z.infer<typeof User>> = {
    ...(is_welcome_onboard_flow_complete !==
      user.is_welcome_onboard_flow_complete && {
      is_welcome_onboard_flow_complete,
    }),
    ...(promotional_emails_enabled !== user.promotional_emails_enabled && {
      promotional_emails_enabled,
    }),
  };

  const bio = rawBio && sanitizeQuillText(rawBio);
  const background_image: z.infer<typeof Image> | undefined =
    backgroundImage && JSON.parse(backgroundImage);
  const profile_delta: z.infer<typeof UserProfile> = {
    ...(email && email !== user.profile.email && { email }),
    ...(slug && slug !== user.profile.slug && { slug }),
    ...(new_name && name !== user.profile.name && { name }),
    ...(bio && bio !== user.profile.bio && { bio }),
    ...(website && website !== user.profile.website && { website }),
    ...(avatar_url && avatar_url !== user.profile.avatar_url && { avatar_url }),
    ...(socials &&
      JSON.stringify(socials) !== JSON.stringify(user.profile.socials) && {
        socials,
      }),
    ...(background_image &&
      JSON.stringify(background_image) !==
        JSON.stringify(user.profile.background_image) && { background_image }),
  };

  const update =
    Object.keys(user_delta).length || Object.keys(profile_delta).length;
  if (update || tag_ids) {
    const updated = await models.sequelize.transaction(async (transaction) => {
      if (tag_ids)
        await updateTags(tag_ids, models, user.id!, 'user_id', transaction);
      if (update) {
        console.log({ user_delta, profile_delta }); // TODO: remove this
        const profile = { ...user.profile, ...profile_delta };
        const [, rows] = await models.User.update(
          { ...user_delta, profile },
          {
            where: { id: user.id },
            returning: true,
            transaction,
          },
        );
        return rows.at(0);
      } else return user;
    });

    if (!updated) return failure(res.status(400), {});
    return success(res, updated.profile);
  }

  // nothing changed
  return success(res, user.profile);
};

export default updateNewProfile;
