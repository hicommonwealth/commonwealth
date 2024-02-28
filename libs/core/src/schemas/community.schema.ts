import { z } from 'zod';
import { ChainBase, ChainNetwork, ChainType, DefaultPage } from '../types';

export const CommunityStake = z.object({
  id: z.number().optional(),
  community_id: z.string().optional(),
  stake_id: z.number().optional(),
  stake_token: z.string().optional(),
  vote_weight: z.number().optional(),
  stake_enabled: z.boolean().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const Community = z.object({
  name: z.string(),
  chain_node_id: z.number(),
  default_symbol: z.string(),
  network: z.nativeEnum(ChainNetwork),
  base: z.nativeEnum(ChainBase),
  icon_url: z.string(),
  active: z.boolean(),
  type: z.nativeEnum(ChainType),
  id: z.string().optional(),
  description: z.string().optional(),
  social_links: z.array(z.string()).optional(),
  ss58_prefix: z.number().optional(),
  stages_enabled: z.boolean().optional(),
  custom_stages: z.array(z.string()).optional(),
  custom_domain: z.string().optional(),
  block_explorer_ids: z.string().optional(),
  collapsed_on_homepage: z.boolean().optional(),
  substrate_spec: z.string().optional(),
  has_chain_events_listener: z.boolean().optional(),
  default_summary_view: z.boolean().optional(),
  default_page: z.nativeEnum(DefaultPage).optional(),
  has_homepage: z.boolean().optional(),
  terms: z.string().optional(),
  admin_only_polling: z.boolean().optional(),
  bech32_prefix: z.string().optional(),
  hide_projects: z.boolean().optional(),
  token_name: z.string().optional(),
  ce_verbose: z.boolean().optional(),
  discord_config_id: z.number().optional(),
  category: z.unknown().optional(), // Assuming category can be any type
  discord_bot_webhooks_enabled: z.boolean().optional(),
  directory_page_enabled: z.boolean().optional(),
  directory_page_chain_node_id: z.number().optional(),
  namespace: z.string().optional(),
  redirect: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const GetCommunityStakeSchema = {
  input: z.object({
    community_id: z.string(),
    stake_id: z.coerce
      .number()
      .int()
      .optional()
      .describe('The stake id or all stakes when undefined'),
  }),
  output: CommunityStake,
};

export const SetCommunityStakeSchema = {
  input: z.object({
    stake_id: z.coerce.number().int(),
    stake_token: z.string().default(''),
    vote_weight: z.coerce.number().default(1),
    stake_enabled: z.coerce.boolean().default(true),
  }),
  output: Community.merge(
    z.object({
      CommunityStakes: CommunityStake,
    }),
  ),
};
