import { BalanceSourceType, WalletSsoSource } from '@hicommonwealth/shared';
import { z } from 'zod';
import { PG_INT } from '../utils';
import { GroupGatedAction } from './group-permission.schemas';
import { Address, USER_TIER } from './user.schemas';

const ContractSource = z.object({
  source_type: z.enum([
    BalanceSourceType.ERC20,
    BalanceSourceType.ERC721,
    BalanceSourceType.ERC1155,
    BalanceSourceType.SPL,
  ]),
  evm_chain_id: PG_INT,
  contract_address: z.string().regex(/^[a-zA-Z0-9]{32,44}$/),
  token_id: z
    .string()
    .regex(/^[0-9]+$/)
    .nullish(),
});

const SolanaSource = z.object({
  source_type: z.enum([BalanceSourceType.SPL, BalanceSourceType.SOLNFT]),
  solana_network: z.string(),
  contract_address: z.string().regex(/^[a-zA-Z0-9]{32,44}$/),
});

const SuiSource = z.object({
  source_type: z.enum([BalanceSourceType.SuiNative]),
  sui_network: z.string(),
  object_id: z
    .string()
    .regex(/^0x[a-zA-F0-9]+$/)
    .nullish(),
});

const SuiTokenSource = z.object({
  source_type: z.enum([BalanceSourceType.SuiToken]),
  sui_network: z.string(),
  coin_type: z.string(),
});

const SuiNFTSource = z.object({
  source_type: z.enum([BalanceSourceType.SuiNFT]),
  sui_network: z.string(),
  collection_id: z.string(),
  token_standard: z.string().optional(),
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

export const ThresholdData = z.object({
  threshold: z.string().regex(/^[0-9]+$/),
  source: z.union([
    ContractSource,
    NativeSource,
    CosmosSource,
    CosmosContractSource,
    SolanaSource,
    SuiSource,
    SuiTokenSource,
    SuiNFTSource,
  ]),
});

export const AllowlistData = z.object({
  allow: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)),
});

export const TrustLevelData = z.object({
  minimum_trust_level: USER_TIER,
  sso_required: z.array(z.nativeEnum(WalletSsoSource)).optional(),
});

export const Requirement = z.union([
  z.object({
    rule: z.literal('threshold'),
    data: ThresholdData,
  }),
  z.object({
    rule: z.literal('allow'),
    data: AllowlistData,
  }),
  z.object({
    rule: z.literal('trust-level'),
    data: TrustLevelData,
  }),
]);

export const GroupMetadata = z.object({
  name: z.string(),
  description: z.string(),
  required_requirements: PG_INT.nullish(),
  membership_ttl: z.number().nullish(), // NOT USED
  groupImageUrl: z.string().nullish(),
});

export const Group = z.object({
  id: PG_INT.optional(),
  community_id: z.string(),
  metadata: GroupMetadata,
  requirements: z.array(Requirement),
  is_system_managed: z.boolean().optional(),

  // associations
  GroupGatedActions: z.array(GroupGatedAction).optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const MembershipRejectReason = z
  .object({
    message: z.string(),
    requirement: z.object({
      data: z.any().optional(),
      rule: z.string(),
    }),
  })
  .array()
  .optional();

export type MembershipRejectReason = z.infer<typeof MembershipRejectReason>;

export const Membership = z.object({
  group_id: z.number(),
  address_id: z.number(),
  reject_reason: MembershipRejectReason,
  last_checked: z.coerce.date(),

  // associations
  group: Group.optional(),
  address: Address.optional(),
});
