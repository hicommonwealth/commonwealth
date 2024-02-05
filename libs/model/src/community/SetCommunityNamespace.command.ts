import type { CommandMetadata } from '@hicommonwealth/core';
import { InvalidInput } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import type { CommunityAttributes, CommunityInstance } from '../models';

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
  load: [isCommunityAdmin],
  body: async ({ id, actor, payload }) => {
    const community = await models.Community.findOne({ where: { id } });
    if (!community) throw new InvalidInput('Community not found');

    // TODO: validate contract
    // call protocol api and resolve if tbc should be a singleton

    //await validateNamespace(TokenBalanceCache, payload.namespace, payload.txHash, payload.address, community)
    community.namespace = payload.namespace;

    return { id, actor, payload, state: community };
  },
  save: async (context) => {
    await (context.state! as CommunityInstance).save();
    return context;
  },
};
