import { BalanceType, type CommandMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { mustNotExist } from '../middleware/guards';
import type { ChainNodeAttributes } from '../models';

const schema = z.object({
  url: z.string(),
  name: z.string(),
  balance_type: z.nativeEnum(BalanceType),
  bech32: z.string().optional(),
  eth_chain_id: z.coerce.number().int().optional(),
});

export const CreateNode: CommandMetadata<ChainNodeAttributes, typeof schema> = {
  schema,
  auth: [],
  body: async ({ id, payload }) => {
    const node = await models.ChainNode.findOne({ where: { url: id } });

    mustNotExist('Node', node);

    await models.ChainNode.create(payload);
    return payload as ChainNodeAttributes;
  },
};
