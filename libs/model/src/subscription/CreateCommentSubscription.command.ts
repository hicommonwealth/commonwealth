import { schemas, type Command } from '@hicommonwealth/core';
import { models } from '../database';

export const CreateCommentSubscription: Command<
  typeof schemas.commands.CreateCommentSubscription
> = () => ({
  ...schemas.commands.CreateCommentSubscription,
  auth: [],
  secure: true,
  body: async ({ payload, actor }) => {
    const { 0: subscription } = await models.CommentSubscription.findOrCreate({
      where: {
        user_id: actor.user.id!,
        ...payload,
      },
    });
    return subscription.get({ plain: true });
  },
});
