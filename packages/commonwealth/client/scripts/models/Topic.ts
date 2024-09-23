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
  public readonly community_id: string;
  public readonly channel_id?: string;
  public readonly feature_in_sidebar?: boolean;
  public readonly featured_in_new_post?: boolean;
  public order?: number;
  public readonly default_offchain_template?: string;
  public total_threads?: number;
  public readonly active_contest_managers: Array<
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
    this.community_id = community_id;
    this.feature_in_sidebar = featured_in_sidebar;
    this.featured_in_new_post = featured_in_new_post;
    this.order = order;
    this.default_offchain_template = default_offchain_template;
    this.total_threads = total_threads || 0;
    this.channel_id = channel_id;
    this.active_contest_managers = active_contest_managers || [];
  }
}

export default Topic;
