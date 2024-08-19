import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod';

const ActiveContestManagers = z.object({
  content: z.array(schemas.ContestAction),
  contest_manager: schemas.ContestManager,
});

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
  active_contest_managers: Array<z.infer<typeof ActiveContestManagers>>;
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
  public readonly activeContestManagers: Array<
    z.infer<typeof ActiveContestManagers>
  >;

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
  }: TopicAttributes) {
    this.name = name;
    this.id = id;
    this.description = description;
    this.telegram = telegram;
    // @ts-expect-error StrictNullChecks
    this.communityId = community_id;
    this.featuredInSidebar = featured_in_sidebar;
    this.featuredInNewPost = featured_in_new_post;
    this.order = order;
    this.defaultOffchainTemplate = default_offchain_template;
    this.totalThreads = total_threads || 0;
    this.channelId = channel_id;
    this.activeContestManagers = active_contest_managers || [];
  }
}

export default Topic;
