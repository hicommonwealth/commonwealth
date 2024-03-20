import { z } from 'zod';
import { BalanceSourceType } from '../types';

const ContractSource = z.object({
  source_type: z.enum([
    BalanceSourceType.ERC20,
    BalanceSourceType.ERC721,
    BalanceSourceType.ERC1155,
  ]),
  evm_chain_id: z.number(),
  contract_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  token_id: z
    .string()
    .regex(/^[0-9]+$/)
    .optional(),
});

const NativeSource = z.object({
  source_type: z.enum([BalanceSourceType.ETHNative]),
  evm_chain_id: z.number(),
});

const CosmosSource = z.object({
  source_type: z.enum([BalanceSourceType.CosmosNative]),
  cosmos_chain_id: z.string(),
  token_symbol: z.string(),
});

const CosmosContractSource = z.object({
  source_type: z.enum([BalanceSourceType.CW721]),
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
  required_requirements: z.number().optional(),
  membership_ttl: z.number().optional(), // NOT USED
});

export const Group = z.object({
  id: z.number().optional(),
  community_id: z.string(),
  metadata: GroupMetadata,
  requirements: z.array(Requirement),
  is_system_managed: z.boolean().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const CreateGroup = {
  input: z.object({
    metadata: z.object({
      name: z.string(),
      description: z.string(),
      required_requirements: z.number().optional(),
      membership_ttl: z.number().optional(),
    }),
    requirements: z.array(Requirement),
    topics: z.array(z.number()).optional(),
  }),
  output: z.object({ groups: z.array(Group).optional() }),
};
