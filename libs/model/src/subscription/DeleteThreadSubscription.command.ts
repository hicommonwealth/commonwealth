import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export const DeleteThreadSubscription: Command<
  typeof schemas.DeleteThreadSubscription
> = () => ({
  ...schemas.DeleteThreadSubscription,
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
