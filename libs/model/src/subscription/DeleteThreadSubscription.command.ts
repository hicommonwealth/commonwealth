import { type Command } from '@hicommonwealth/core';
import { commands } from '@hicommonwealth/schemas';
import { models } from '../database';

export const DeleteThreadSubscription: Command<
  typeof commands.DeleteThreadSubscription
> = () => ({
  ...commands.DeleteThreadSubscription,
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
