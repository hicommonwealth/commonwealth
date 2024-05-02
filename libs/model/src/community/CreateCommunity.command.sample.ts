import type { Command } from '@hicommonwealth/core';
import { commands } from '@hicommonwealth/schemas';
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';

export const CreateCommunity: Command<
  typeof commands.CreateCommunity
> = () => ({
  ...commands.CreateCommunity,
  auth: [],
  body: async ({ id, payload }) => {
    console.log(payload); // TODO: remove
    const community = await models.Community.findOne({ where: { id } });

    mustNotExist('Community', community);

    //await models.Community.create(payload)
    return community?.get({ plain: true });
  },
});
