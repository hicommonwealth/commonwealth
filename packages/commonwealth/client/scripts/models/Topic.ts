import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod';

export type TopicAttributes = z.infer<typeof schemas.ExtendedTopic>;

function Topic({
  name,
  id,
  description,
  telegram,
  community_id,
  featured_in_new_post,
  featured_in_sidebar,
  order,
  default_offchain_template,
  total_threads,
  channel_id,
  active_contest_managers,
  chain_node_id,
  group_ids,
  default_offchain_template_backup,
  weighted_voting,
  token_address,
  token_symbol,
  vote_weight_multiplier,
}: TopicAttributes) {
  return {
    name,
    id,
    description,
    telegram,
    communityId: community_id,
    featuredInSidebar: featured_in_sidebar,
    featuredInNewPost: featured_in_new_post,
    order,
    defaultOffchainTemplate: default_offchain_template,
    totalThreads: total_threads || 0,
    channelId: channel_id,
    activeContestManagers: active_contest_managers || [],
    chainNodeId: chain_node_id,
    groupIds: group_ids,
    defaultOffchainTemplateBackup: default_offchain_template_backup,
    weightedVoting: weighted_voting,
    tokenAddress: token_address,
    tokenSymbol: token_symbol,
    voteWeightMultiplier: vote_weight_multiplier,
  };
}

export default Topic;
