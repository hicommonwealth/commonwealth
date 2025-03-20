import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authVerified } from '../../middleware/auth';

export function DeleteThreadSubscription(): Command<
  typeof schemas.DeleteThreadSubscription
> {
  return {
    ...schemas.DeleteThreadSubscription,
    auth: [authVerified()],
    secure: true,
    body: async ({ payload, actor }) => {
      return await models.ThreadSubscription.destroy({
        where: {
          user_id: actor.user.id!,
          thread_id: payload.thread_ids,
        },
      });
    },
  };
}
