import {
  BalanceType,
  CosmosGovernanceVersion,
  NodeHealth,
} from '@hicommonwealth/shared';
import z from 'zod';
import { PG_INT } from '../utils';
import { Community } from './community.schemas';
import { Contract } from './contract.schemas';

export const ChainNode = z.object({
  id: PG_INT.optional(),
  url: z.string().max(255),
  eth_chain_id: PG_INT.optional(),
  alt_wallet_url: z.string().max(255).optional(),
  private_url: z.string().max(255).optional(),
  balance_type: z.nativeEnum(BalanceType),
  name: z.string().max(255),
  description: z.string().max(255).optional(),
  ss58: PG_INT.optional(),
  bech32: z.string().max(255).optional(),
  slip44: PG_INT.optional(),
  created_at: z.any(),
  updated_at: z.any(),
  cosmos_chain_id: z
    .string()
    .regex(/[a-z0-9]+/)
    .optional(),
  cosmos_gov_version: z.nativeEnum(CosmosGovernanceVersion).optional(),
  health: z.nativeEnum(NodeHealth).default(NodeHealth.Healthy).optional(),
  contracts: z.array(Contract).optional(),
  block_explorer: z.string().optional(),
});

// aliases
export const Chain = Community;
