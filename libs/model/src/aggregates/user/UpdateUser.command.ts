import { type Command, InvalidInput, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { DEFAULT_NAME } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';
import { authVerified } from '../../middleware/auth';
import { mustExist } from '../../middleware/guards';
import { decodeContent, emitEvent, getDelta, updateTags } from '../../utils';

export function UpdateUser(): Command<typeof schemas.UpdateUser> {
  return {
    ...schemas.UpdateUser,
    auth: [authVerified()],
    body: async ({ actor, payload }) => {
      // comparing number to string since command convention requires string id
      if (actor.user.id != payload.id)
        throw new InvalidInput('Invalid user id');

      const { id, profile, tag_ids } = payload;
      const {
        slug,
        name,
        email,
        website,
        avatar_url,
        socials,
        bio: rawBio,
        background_image,
      } = profile;

      const user = (
        await models.User.findOne({
          where: { id },
          include: {
            model: models.ProfileTags,
          },
        })
      )?.toJSON();
      mustExist('User', user);

      const is_welcome_onboard_flow_complete = !!(
        user.is_welcome_onboard_flow_complete ||
        (name && name !== DEFAULT_NAME)
      );

      const promotional_emails_enabled =
        payload.promotional_emails_enabled ??
        user.promotional_emails_enabled ??
        false;

      const notify_user_name_change =
        payload.notify_user_name_change ??
        user.notify_user_name_change ??
        false;

      const user_delta = getDelta(user, {
        is_welcome_onboard_flow_complete,
        promotional_emails_enabled,
        notify_user_name_change,
        profile: {
          email,
          slug,
          name,
          bio: rawBio && decodeContent(rawBio),
          website,
          avatar_url,
          socials,
          background_image,
        },
      });

      const tags_delta = tag_ids
        ? getDelta(
            { tag_ids: user.ProfileTags?.map((t) => t.tag_id) },
            {
              tag_ids,
            },
          )
        : {};

      const update_user = Object.keys(user_delta).length;
      const update_tags = Object.keys(tags_delta).length;

      if (update_user || update_tags) {
        const updated = await models.sequelize.transaction(
          async (transaction) => {
            if (update_tags)
              await updateTags(tag_ids!, user.id!, 'user_id', transaction);

            if (update_user) {
              // TODO: utility to deep merge deltas
              const updates = {
                ...user_delta,
                profile: {
                  ...user.profile,
                  ...user_delta.profile,
                  background_image: {
                    ...user.profile.background_image,
                    ...user_delta.profile?.background_image,
                  },
                },
              };
              if (updates.profile.bio === '') {
                updates.profile.bio = null;
              }

              if (
                updates?.profile?.name &&
                updates?.profile?.name !== 'Anonymous'
              ) {
                const [existingUsername] = await models.sequelize.query<{
                  id: number;
                }>(
                  `
                  SELECT id
                  FROM "Users"
                  WHERE id != :id
                    AND (profile ->> 'name') IS DISTINCT FROM 'Anonymous'
                    AND (profile ->> 'name') = :profile_name
                  LIMIT 1;
                `,
                  {
                    replacements: {
                      id,
                      profile_name: updates.profile.name,
                    },
                    type: QueryTypes.SELECT,
                  },
                );
                if (existingUsername) {
                  throw new InvalidState('Username already exists');
                }
              }

              const [, rows] = await models.User.update(updates, {
                where: { id: user.id },
                returning: true,
                transaction,
              });
              const updated_user = rows.at(0);

              // emit sign-up flow completed event when:
              if (updated_user && user_delta.is_welcome_onboard_flow_complete) {
                await emitEvent(
                  models.Outbox,
                  [
                    {
                      event_name: 'SignUpFlowCompleted',
                      event_payload: {
                        user_id: id,
                        address: actor.address!,
                        referred_by_address: user.referred_by_address,
                        created_at: updated_user.created_at!,
                      },
                    },
                    {
                      event_name: 'UserUpdated',
                      event_payload: {
                        old_user: user,
                        new_user: updated_user,
                      },
                    },
                  ],
                  transaction,
                );
              }
              return updated_user;
            } else return user;
          },
        );

        return updated!;
      }

      // nothing changed
      return user;
    },
  };
}
