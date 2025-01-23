import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function GetUser(): Query<typeof schemas.GetUser> {
  return {
    ...schemas.GetUser,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      return (
        (
          await models.User.findOne({
            where: {
              id: actor.user.id,
            },
          })
        )?.get({ plain: true }) || {}
      );
    },
  };
}
