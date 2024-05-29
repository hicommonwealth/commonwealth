import {
  ChainBase,
  ChainNetwork,
  ChainType,
  DefaultPage,
} from '@hicommonwealth/shared';
import { z } from 'zod';
import { PG_INT } from '../utils';
import { ContestManager } from './contest-manager.schemas';
import { Group } from './group.schemas';
import { CommunityStake } from './stake.schemas';
import { Tag as CommunityTag } from './tag.schemas';
import { Topic } from './topic.schemas';
import { Address } from './user.schemas';

export const Community = z.object({
  name: z.string(),
  chain_node_id: PG_INT,
  default_symbol: z.string().default(''),
  network: z.nativeEnum(ChainNetwork).default(ChainNetwork.Ethereum),
  base: z.nativeEnum(ChainBase),
  icon_url: z.string(),
  active: z.boolean(),
  type: z.nativeEnum(ChainType).default(ChainType.Chain),
  id: z.string().optional(),
  description: z.string().optional(),
  social_links: z.array(z.string()).optional(),
  ss58_prefix: PG_INT.optional(),
  stages_enabled: z.boolean().optional(),
  custom_stages: z.array(z.string()).optional(),
  custom_domain: z.string().optional(),
  block_explorer_ids: z.string().optional(),
  collapsed_on_homepage: z.boolean().optional(),
  substrate_spec: z.string().optional(),
  has_chain_events_listener: z.boolean().optional(),
  default_summary_view: z.boolean().optional(),
  default_page: z.nativeEnum(DefaultPage).optional(),
  has_homepage: z.enum(['true', 'false']).optional().default('false').nullish(),
  terms: z.string().optional(),
  admin_only_polling: z.boolean().optional(),
  bech32_prefix: z.string().optional(),
  hide_projects: z.boolean().optional(),
  token_name: z.string().optional(),
  ce_verbose: z.boolean().optional(),
  discord_config_id: PG_INT.optional().nullish(),
  category: z.unknown().optional(), // Assuming category can be any type
  discord_bot_webhooks_enabled: z.boolean().optional(),
  directory_page_enabled: z.boolean().optional(),
  directory_page_chain_node_id: PG_INT.optional(),
  namespace: z.string().optional(),
  namespace_address: z.string().optional(),
  redirect: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  Addresses: z.array(Address).optional(),
  CommunityStakes: z.array(CommunityStake).optional(),
  CommunityTags: z.array(CommunityTag).optional(),
  topics: z.array(Topic).optional(),
  groups: z.array(Group).optional(),
  contest_managers: z.array(ContestManager).optional(),
  snapshot_spaces: z.array(z.string().max(255)).default([]).optional(),
});
