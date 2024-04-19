import { schemas, type Command } from '@hicommonwealth/core';
import { models } from '../database';

export const CreateCommunityAlert: Command<
  typeof schemas.commands.CreateCommunityAlert
> = () => ({
  ...schemas.commands.CreateCommunityAlert,
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
