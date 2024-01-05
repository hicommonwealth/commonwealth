export type TopicAttributes = {
  name: string;
  id: number;
  description: string;
  telegram?: string;
  community_id?: string;
  featured_in_sidebar?: boolean;
  featured_in_new_post?: boolean;
  order?: number;
  default_offchain_template?: string;
  total_threads: number;
  channel_id?: string;
};

class Topic {
  public readonly name: string;
  public readonly id: number;
  public readonly description: string;
  public readonly telegram?: string;
  public readonly communityId: string;
  public readonly channelId?: string;
  public readonly featuredInSidebar?: boolean;
  public readonly featuredInNewPost?: boolean;
  public order?: number;
  public readonly defaultOffchainTemplate?: string;
  public totalThreads?: number;

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
  }
}

export default Topic;
