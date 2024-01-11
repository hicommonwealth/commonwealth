import { AppError } from '@hicommonwealth/adapters';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { CommunityInstance } from '../../models/community';
import { TopicAttributes } from '../../models/topic';
import { UserInstance } from '../../models/user';
import { validateOwner } from '../../util/validateOwner';
import { TrackOptions } from '../server_analytics_methods/track';
import { ServerTopicsController } from '../server_topics_controller';

export const Errors = {
  NotLoggedIn: 'Not signed in',
  NoTopicId: 'Must supply topic ID',
  NotAdmin: 'Must be an admin to edit or feature topics',
  NotVerified: 'Must have a verified address to edit or feature topics',
  TopicNotFound: 'Topic not found',
  TopicRequired: 'Topic name required',
  DefaultTemplateRequired: 'Default Template required',
  InvalidTopicName: 'Topic uses disallowed special characters',
};

export type UpdateTopicOptions = {
  user: UserInstance;
  community: CommunityInstance;
  body: Partial<TopicAttributes>;
};

export type UpdateTopicResult = [TopicAttributes, TrackOptions];

export async function __updateTopic(
  this: ServerTopicsController,
  { user, community, body }: UpdateTopicOptions,
): Promise<UpdateTopicResult> {
  if (!body.id) {
    throw new AppError(Errors.NoTopicId);
  }

  const isAdmin = await validateOwner({
    models: this.models,
    user: user,
    communityId: community.id,
    allowMod: true,
    allowAdmin: true,
    allowGodMode: true,
  });
  if (!isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  const {
    id,
    name,
    description,
    telegram,
    group_ids,
    featured_in_sidebar,
    featured_in_new_post,
  } = body;

  const default_community_template = body.default_offchain_template?.trim();
  if (featured_in_new_post && !default_community_template) {
    throw new AppError(Errors.DefaultTemplateRequired);
  }

  const topic = await this.models.Topic.findOne({ where: { id } });
  if (!topic) {
    throw new AppError(Errors.TopicNotFound);
  }
  if (typeof name !== 'undefined') {
    if (name.match(/["<>%{}|\\/^`]/g)) {
      throw new AppError(Errors.InvalidTopicName);
    }
    topic.name = name.trim() || '';
  }
  if (typeof description !== 'undefined') {
    topic.description = description || '';
  }
  if (typeof telegram !== 'undefined') {
    topic.telegram = telegram || '';
  }
  if (Array.isArray(group_ids)) {
    topic.group_ids = group_ids;
  }
  if (typeof featured_in_sidebar !== 'undefined') {
    topic.featured_in_sidebar = featured_in_sidebar || false;
  }
  if (typeof featured_in_new_post !== 'undefined') {
    topic.featured_in_new_post = featured_in_new_post || false;
  }
  if (typeof default_community_template !== 'undefined') {
    topic.default_offchain_template = default_community_template || '';
  }
  await topic.save();

  const analyticsOptions = {
    event: MixpanelCommunityInteractionEvent.UPDATE_TOPIC,
    community: community.id,
    userId: user.id,
  };

  return [topic.toJSON(), analyticsOptions];
}
