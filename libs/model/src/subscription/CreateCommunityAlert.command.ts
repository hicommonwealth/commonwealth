import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export const CreateCommunityAlert: Command<
  typeof schemas.CreateCommunityAlert
> = () => ({
  ...schemas.CreateCommunityAlert,
  auth: [],
  secure: true,
  body: async ({ payload, actor }) => {
    const { 0: alert } = await models.CommunityAlert.findOrCreate({
      where: {
        user_id: actor.user.id!,
        ...payload,
      },
    });
    return alert.get({ plain: true });
  },
});
