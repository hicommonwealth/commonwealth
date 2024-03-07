import type { CommandMetadata } from '@hicommonwealth/core';
import { community } from '@hicommonwealth/core';
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';

export const CreateCommunity = (): CommandMetadata<
  typeof community.CreateCommunity
> => ({
  schemas: community.CreateCommunity,
  auth: [],
  body: async ({ id, payload }) => {
    console.log(payload); // TODO: remove
    const community = await models.Community.findOne({ where: { id } });

    mustNotExist('Community', community);

    //await models.Community.create(payload)
    return community?.get({ plain: true });
  },
});
