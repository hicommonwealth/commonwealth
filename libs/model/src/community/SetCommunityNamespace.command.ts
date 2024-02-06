import type { CommandMetadata } from '@hicommonwealth/core';
import { InvalidInput } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import type { CommunityAttributes } from '../models';

export const schema = z.object({
  namespace: z.string(),
  txHash: z.string(),
  address: z.string(),
});

export const SetCommunityNamespace: CommandMetadata<
  CommunityAttributes,
  typeof schema
> = {
  schema,
  auth: [isCommunityAdmin],
  body: async ({ id, payload }) => {
    const community = await models.Community.findOne({ where: { id } });
    if (!community) throw new InvalidInput('Community not found');

    // TODO: validate contract
    // call protocol api and resolve if tbc should be a singleton

    //await validateNamespace(TokenBalanceCache, payload.namespace, payload.txHash, payload.address, community)
    community.namespace = payload.namespace;
    return (await community.save()).get({ plain: true });
  },
};
