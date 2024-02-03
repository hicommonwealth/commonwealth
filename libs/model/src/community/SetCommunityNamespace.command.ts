import type { CommandMetadata } from '@hicommonwealth/core';
import { InvalidInput } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import type { CommunityAttributes } from '../models';

export const schema = z.object({
  namespace: z.string(),
});

export const SetCommunityNamespace: CommandMetadata<
  CommunityAttributes,
  typeof schema,
  CommunityAttributes
> = {
  schema,
  middleware: [isCommunityAdmin],
  fn: async (id, payload) => {
    const community = await models.Community.findOne({ where: { id } });
    if (!community) throw new InvalidInput('Community not found');

    // TODO: validate contract
    // call protocol api

    // payload is validated by message validation middleware
    // TODO: set to namespace instead of name
    community.name = payload.namespace;

    await community.save();

    return community;
  },
};
