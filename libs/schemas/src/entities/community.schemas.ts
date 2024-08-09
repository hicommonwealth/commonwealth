import {
  ChainBase,
  ChainNetwork,
  ChainType,
  DefaultPage,
} from '@hicommonwealth/shared';
import { z } from 'zod';
import { PG_INT } from '../utils';
import { ChainNode } from './chain.schemas';
import { ContestManager } from './contest-manager.schemas';
import { Group } from './group.schemas';
import { CommunityStake } from './stake.schemas';
import { CommunityTags } from './tag.schemas';
import { Topic } from './topic.schemas';
import { Address } from './user.schemas';

export const Community = z.object({
  // 1. Regular fields are nullish when nullable instead of optional
  id: z.string().optional(),
  name: z.string(),
  chain_node_id: PG_INT,
  default_symbol: z.string().default(''),
  network: z.nativeEnum(ChainNetwork).default(ChainNetwork.Ethereum),
  base: z.nativeEnum(ChainBase),
  icon_url: z.string().nullish(),
  active: z.boolean(),
  type: z.nativeEnum(ChainType).default(ChainType.Chain),
  description: z.string().nullish(),
  social_links: z.array(z.string()).default([]),
  ss58_prefix: PG_INT.nullish(),
  stages_enabled: z.boolean().default(true),
  custom_stages: z.array(z.string()).default([]),
  custom_domain: z.string().nullish(),
  block_explorer_ids: z.string().nullish(),
  collapsed_on_homepage: z.boolean().default(false),
  substrate_spec: z.string().nullish(),
  has_chain_events_listener: z.boolean().default(false),
  default_summary_view: z.boolean().nullish(),
  default_page: z.nativeEnum(DefaultPage).nullish(),
  has_homepage: z.enum(['true', 'false']).default('false').nullish(),
  terms: z.string().nullish(),
  admin_only_polling: z.boolean().nullish(),
  bech32_prefix: z.string().nullish(),
  hide_projects: z.boolean().nullish(),
  token_name: z.string().nullish(),
  ce_verbose: z.boolean().nullish(),
  discord_config_id: PG_INT.nullish(),
  category: z.unknown().nullish(), // Assuming category can be any type
  discord_bot_webhooks_enabled: z.boolean().nullish(),
  directory_page_enabled: z.boolean().default(false),
  directory_page_chain_node_id: PG_INT.nullish(),
  namespace: z.string().nullish(),
  namespace_address: z.string().nullish(),
  redirect: z.string().nullish(),
  snapshot_spaces: z.array(z.string().max(255)).default([]),
  include_in_digest_email: z.boolean().nullish(),

  // 2. Timestamps are managed by sequelize, thus optional
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),

  // 3. Associations are optional
  Addresses: z.array(Address).optional(),
  CommunityStakes: z.array(CommunityStake).nullish(),
  CommunityTags: z.array(CommunityTags).nullish(),
  ChainNode: ChainNode.optional(),
  topics: z.array(Topic).optional(),
  groups: z.array(Group).optional(),
  contest_managers: z.array(ContestManager).optional(),
});

// aliases
export const Chain = Community;
