import {
  BalanceType,
  CosmosGovernanceVersion,
  NodeHealth,
} from '@hicommonwealth/shared';
import z from 'zod';
import { PG_INT } from '../utils';

export const ChainNode = z.object({
  id: PG_INT.optional().nullish(),
  url: z.string().max(255),
  eth_chain_id: PG_INT.nullish(),
  alt_wallet_url: z.string().max(255).nullish(),
  private_url: z.string().max(255).nullish(),
  balance_type: z.nativeEnum(BalanceType),
  name: z.string().max(255),
  description: z.string().max(255).nullish(),
  ss58: PG_INT.nullish(),
  bech32: z.string().max(255).nullish(),
  slip44: PG_INT.nullish(),
  cosmos_chain_id: z
    .string()
    .regex(/[a-z0-9]+/)
    .nullish(),
  cosmos_gov_version: z.nativeEnum(CosmosGovernanceVersion).nullish(),
  health: z.nativeEnum(NodeHealth).default(NodeHealth.Healthy).nullish(),
  block_explorer: z.string().nullish(),
  max_ce_block_range: z.number().gte(-1).nullish(),
  alchemy_metadata: z
    .object({
      network_id: z.string(),
      price_api_supported: z.boolean(),
      transfer_api_supported: z.boolean(),
    })
    .nullish(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
