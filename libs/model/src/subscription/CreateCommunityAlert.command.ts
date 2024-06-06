import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function CreateCommunityAlert(): Command<
  typeof schemas.CreateCommunityAlert
> {
  return {
    ...schemas.CreateCommunityAlert,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const where = {
        user_id: actor.user.id!,
        ...payload,
      };

      console.log('FIXME: where: ', JSON.stringify(where, null, '  '));

      const { 0: alert } = await models.CommunityAlert.findOrCreate({
        where: {
          user_id: actor.user.id!,
          ...payload,
        },
      });
      return alert.get({ plain: true });
    },
  };
}
