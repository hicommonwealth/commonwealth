import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function CreateCommentSubscription(): Command<
  typeof schemas.CreateCommentSubscription
> {
  return {
    ...schemas.CreateCommentSubscription,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const { 0: subscription } = await models.CommentSubscription.findOrCreate(
        {
          where: {
            user_id: actor.user.id!,
            ...payload,
          },
        },
      );
      return subscription.get({ plain: true });
    },
  };
}
