import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
// eslint-disable-next-line import/no-cycle
import { models } from '../database';

export function CreateThreadSubscription(): Command<
  typeof schemas.CreateThreadSubscription
> {
  return {
    ...schemas.CreateThreadSubscription,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const { 0: subscription } = await models.ThreadSubscription.findOrCreate({
        where: {
          user_id: actor.user.id!,
          thread_id: payload.thread_id,
        },
      });
      return subscription.get({ plain: true });
    },
  };
}
