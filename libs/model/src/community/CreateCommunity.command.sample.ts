import type { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';

export function CreateCommunity(): Command<typeof schemas.CreateCommunity> {
  return {
    ...schemas.CreateCommunity,
    auth: [],
    body: async ({ id, payload }) => {
      console.log(payload); // TODO: remove
      const community = await models.Community.findOne({ where: { id } });

      mustNotExist('Community', community);

      //await models.Community.create(payload)
      return community?.get({ plain: true });
    },
  };
}
