import { schemas, type Command } from '@hicommonwealth/core';
import { models } from '../database';

export const DeleteThreadSubscription: Command<
  typeof schemas.commands.DeleteThreadSubscription
> = () => ({
  ...schemas.commands.DeleteThreadSubscription,
  auth: [],
  secure: true,
  body: async ({ payload, actor }) => {
    return await models.ThreadSubscription.destroy({
      where: {
        user_id: actor.user.id!,
        thread_id: payload.thread_ids,
      },
    });
  },
});
