import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export const CreateThreadSubscription: Command<
  typeof schemas.CreateThreadSubscription
> = () => ({
  ...schemas.CreateThreadSubscription,
  auth: [],
  secure: true,
  body: async ({ payload, actor }) => {
    const { 0: subscription } = await models.ThreadSubscription.findOrCreate({
      where: {
        user_id: actor.user.id!,
        ...payload,
      },
    });
    return subscription.get({ plain: true });
  },
});
