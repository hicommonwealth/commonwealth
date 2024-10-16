/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { CreateGroupResponseTopicsItemContestTopicsItem } from './CreateGroupResponseTopicsItemContestTopicsItem';
import { CreateGroupResponseTopicsItemWeightedVoting } from './CreateGroupResponseTopicsItemWeightedVoting';

export const CreateGroupResponseTopicsItem = core.serialization.object({
  id: core.serialization.number().optional(),
  name: core.serialization.string().optional(),
  communityId: core.serialization.property(
    'community_id',
    core.serialization.string(),
  ),
  description: core.serialization.string().optional(),
  telegram: core.serialization.string().optional(),
  featuredInSidebar: core.serialization.property(
    'featured_in_sidebar',
    core.serialization.boolean().optional(),
  ),
  featuredInNewPost: core.serialization.property(
    'featured_in_new_post',
    core.serialization.boolean().optional(),
  ),
  defaultOffchainTemplate: core.serialization.property(
    'default_offchain_template',
    core.serialization.string().optional(),
  ),
  order: core.serialization.number().optional(),
  channelId: core.serialization.property(
    'channel_id',
    core.serialization.string().optional(),
  ),
  groupIds: core.serialization.property(
    'group_ids',
    core.serialization.list(core.serialization.number()).optional(),
  ),
  defaultOffchainTemplateBackup: core.serialization.property(
    'default_offchain_template_backup',
    core.serialization.string().optional(),
  ),
  weightedVoting: core.serialization.property(
    'weighted_voting',
    CreateGroupResponseTopicsItemWeightedVoting.optional(),
  ),
  chainNodeId: core.serialization.property(
    'chain_node_id',
    core.serialization.number().optional(),
  ),
  tokenAddress: core.serialization.property(
    'token_address',
    core.serialization.string().optional(),
  ),
  tokenSymbol: core.serialization.property(
    'token_symbol',
    core.serialization.string().optional(),
  ),
  voteWeightMultiplier: core.serialization.property(
    'vote_weight_multiplier',
    core.serialization.number().optional(),
  ),
  createdAt: core.serialization.property(
    'created_at',
    core.serialization.date().optional(),
  ),
  updatedAt: core.serialization.property(
    'updated_at',
    core.serialization.date().optional(),
  ),
  deletedAt: core.serialization.property(
    'deleted_at',
    core.serialization.date().optional(),
  ),
  contestTopics: core.serialization.property(
    'contest_topics',
    core.serialization
      .list(CreateGroupResponseTopicsItemContestTopicsItem)
      .optional(),
  ),
});
