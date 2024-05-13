import { BalanceSourceType } from '@hicommonwealth/shared';
import { z } from 'zod';
import { PG_INT } from '../utils';

const ContractSource = z.object({
  source_type: z.enum([
    BalanceSourceType.ERC20,
    BalanceSourceType.ERC721,
    BalanceSourceType.ERC1155,
    BalanceSourceType.SPL,
  ]),
  evm_chain_id: PG_INT,
  contract_address: z.string(),
  token_id: z
    .string()
    .regex(/^[0-9]+$/)
    .optional(),
});

const NativeSource = z.object({
  source_type: z.enum([BalanceSourceType.ETHNative]),
  evm_chain_id: PG_INT,
});

const CosmosSource = z.object({
  source_type: z.enum([BalanceSourceType.CosmosNative]),
  cosmos_chain_id: z.string(),
  token_symbol: z.string(),
});

const CosmosContractSource = z.object({
  source_type: z.enum([BalanceSourceType.CW721, BalanceSourceType.CW20]),
  cosmos_chain_id: z.string(),
  contract_address: z.string(),
});
const ThresholdData = z.object({
  threshold: z.string().regex(/^[0-9]+$/),
  source: z.union([
    ContractSource,
    NativeSource,
    CosmosSource,
    CosmosContractSource,
  ]),
});

const AllowlistData = z.object({
  allow: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)),
});

export const Requirement = z.union([
  z.object({
    rule: z.enum(['threshold']),
    data: ThresholdData,
  }),
  z.object({
    rule: z.enum(['allow']),
    data: AllowlistData,
  }),
]);

export const GroupMetadata = z.object({
  name: z.string(),
  description: z.string(),
  required_requirements: PG_INT.optional(),
  membership_ttl: z.number().optional(), // NOT USED
});

export const Group = z.object({
  id: PG_INT,
  community_id: z.string(),
  metadata: GroupMetadata,
  requirements: z.array(Requirement),
  is_system_managed: z.boolean().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});
