import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod';

const ActiveContestManagers = z.object({
  content: z.array(schemas.ContestAction),
  contest_manager: schemas.ContestManager,
});

type TopicAttributesBase = z.infer<typeof schemas.Topic>;

type TopicAttributesExtended = TopicAttributesBase & {
  active_contest_managers: Array<z.infer<typeof ActiveContestManagers>>;
  total_threads: number;
};

export type TopicAttributes = TopicAttributesExtended;

class Topic {
  public readonly name: TopicAttributes['name'];
  public readonly id: TopicAttributes['id'];
  public readonly description: TopicAttributes['description'];
  public readonly telegram: TopicAttributes['telegram'];
  public readonly communityId: TopicAttributes['community_id'];
  public readonly channelId: TopicAttributes['channel_id'];
  public readonly featuredInSidebar: TopicAttributes['featured_in_sidebar'];
  public readonly featuredInNewPost: TopicAttributes['featured_in_new_post'];
  public order: TopicAttributes['order'];
  public readonly defaultOffchainTemplate: TopicAttributes['default_offchain_template'];
  public totalThreads: TopicAttributes['total_threads'];
  public readonly activeContestManagers: TopicAttributes['active_contest_managers'];
  public readonly chainNodeId: TopicAttributes['chain_node_id'];
  public readonly groupIds: TopicAttributes['group_ids'];
  public readonly defaultOffchainTemplateBackup: TopicAttributes['default_offchain_template_backup'];
  public readonly weightedVoting: TopicAttributes['weighted_voting'];
  public readonly tokenAddress: TopicAttributes['token_address'];
  public readonly tokenSymbol: TopicAttributes['token_symbol'];
  public readonly voteWeightMultiplier: TopicAttributes['vote_weight_multiplier'];

  constructor({
    name,
    id,
    description,
    telegram,
    community_id,
    featured_in_sidebar,
    featured_in_new_post,
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
    this.name = name;
    this.id = id;
    this.description = description;
    this.telegram = telegram;
    this.communityId = community_id;
    this.featuredInSidebar = featured_in_sidebar;
    this.featuredInNewPost = featured_in_new_post;
    this.order = order;
    this.defaultOffchainTemplate = default_offchain_template;
    this.totalThreads = total_threads || 0;
    this.channelId = channel_id;
    this.activeContestManagers = active_contest_managers || [];
    this.chainNodeId = chain_node_id;
    this.groupIds = group_ids;
    this.defaultOffchainTemplateBackup = default_offchain_template_backup;
    this.weightedVoting = weighted_voting;
    this.tokenAddress = token_address;
    this.tokenSymbol = token_symbol;
    this.voteWeightMultiplier = vote_weight_multiplier;
  }
}

export default Topic;
