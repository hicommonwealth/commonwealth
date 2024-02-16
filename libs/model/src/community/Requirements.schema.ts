import { z } from 'zod';

const ContractSource = z.object({
  source_type: z.enum(['erc20', 'erc721', 'erc1155']),
  evm_chain_id: z.number(),
  contract_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  token_id: z
    .string()
    .regex(/^[0-9]+$/)
    .optional(),
});

const NativeSource = z.object({
  source_type: z.enum(['eth_native']),
  evm_chain_id: z.number(),
});

const CosmosSource = z.object({
  source_type: z.enum(['cosmos_native']),
  cosmos_chain_id: z.string(),
  token_symbol: z.string(),
});

const CosmosContractSource = z.object({
  source_type: z.enum(['cw721']),
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

const RuleData = z.union([ThresholdData, AllowlistData]);

export const Requirement = z.object({
  rule: z.enum(['threshold', 'allow']),
  data: RuleData,
});
