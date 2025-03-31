import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { DEFAULT_NAME } from '@hicommonwealth/shared';
import { models } from '../../database';
import { authVerified } from '../../middleware/auth';
import { mustExist } from '../../middleware/guards';
import { decodeContent, emitEvent, getDelta, updateTags } from '../../utils';

export function UpdateUser(): Command<typeof schemas.UpdateUser> {
  return {
    ...schemas.UpdateUser,
    auth: [authVerified()],
    body: async ({ actor, payload }) => {
      console.log('UUB1: updateUser command started with user id', payload.id);
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
      } = profile || {};

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
      console.log(
        'UUB2: Checking for updates - user:',
        update_user,
        'tags:',
        update_tags,
      );

      if (update_user || update_tags) {
        console.log('UUB3: Updates detected, starting transaction');
        const updated = await models.sequelize.transaction(
          async (transaction) => {
            if (update_tags) {
              console.log('UUB4: Updating tags');
              await updateTags(tag_ids!, user.id!, 'user_id', transaction);
            }

            if (update_user) {
              console.log('UUB5: Updating user profile');
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
              console.log('UUB6: Applying updates to user');
              const [, rows] = await models.User.update(updates, {
                where: { id: user.id },
                returning: true,
                transaction,
              });
              const updated_user = rows.at(0);

              // emit sign-up flow completed event when:
              if (updated_user && user_delta.is_welcome_onboard_flow_complete) {
                console.log(
                  'UUB7: Welcome onboard flow completed, emitting event',
                );
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
                  ],
                  transaction,
                );
              }
              console.log('UUB8: User update completed');
              return updated_user;
            } else {
              console.log('UUB9: No user updates, returning original user');
              return user;
            }
          },
        );

        console.log('UUB10: Transaction completed successfully');
        return updated;
      }

      // nothing changed
      console.log('UUB11: No changes detected, returning original user');
      return user;
    },
  };
}
