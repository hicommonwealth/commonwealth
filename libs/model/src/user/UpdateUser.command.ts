import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { DEFAULT_NAME } from '@hicommonwealth/shared';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { decodeContent, emitEvent, getDelta, updateTags } from '../utils';

export function UpdateUser(): Command<typeof schemas.UpdateUser> {
  return {
    ...schemas.UpdateUser,
    auth: [],
    body: async ({ actor, payload }) => {
      // comparing number to string since command convention requires string id
      if (actor.user.id != payload.id)
        throw new InvalidInput('Invalid user id');

      const { id, profile, tag_ids, referral_link } = payload;
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

      const user_delta = getDelta(user, {
        is_welcome_onboard_flow_complete,
        promotional_emails_enabled,
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
              // emit sign-up flow completed event when:
              if (user_delta.is_welcome_onboard_flow_complete && referral_link)
                await emitEvent(
                  models.Outbox,
                  [
                    {
                      event_name: schemas.EventNames.SignUpFlowCompleted,
                      event_payload: { user_id: id, referral_link },
                    },
                  ],
                  transaction,
                );

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
              const [, rows] = await models.User.update(updates, {
                where: { id: user.id },
                returning: true,
                transaction,
              });
              return rows.at(0);
            } else return user;
          },
        );

        return updated;
      }

      // nothing changed
      return user;
    },
  };
}
