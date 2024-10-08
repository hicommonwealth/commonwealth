import { ChainBase } from '@hicommonwealth/shared';
import { z } from 'zod';
import { Token } from '../entities';
import { PG_INT } from '../utils';

export const CreateToken = {
  input: z.object({
    name: z.string(),
    symbol: z.string(),
    icon_url: z.string().nullish(),
    description: z.string().nullish(),
    chain_node_id: PG_INT,
    base: z.nativeEnum(ChainBase),
    community_id: z.string(),
    launchpad_contract_address: z.string(),
  }),
  output: Token,
};
