import { AppError } from '@hicommonwealth/core';
import { TopicAttributes, UserInstance } from '@hicommonwealth/model';
import { sanitizeQuillText } from 'server/util/sanitizeQuillText';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { validateOwner } from '../../util/validateOwner';
import { TrackOptions } from '../server_analytics_controller';
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
  body: Partial<TopicAttributes>;
};

export type UpdateTopicResult = [TopicAttributes, TrackOptions];

export async function __updateTopic(
  this: ServerTopicsController,
  { user, body }: UpdateTopicOptions,
): Promise<UpdateTopicResult> {
  const { id } = body;
  if (!body.id) {
    throw new AppError(Errors.NoTopicId);
  }
  const topic = await this.models.Topic.findByPk(id);
  if (!topic) {
    throw new AppError(Errors.TopicNotFound);
  }

  const isAdmin = await validateOwner({
    models: this.models,
    user: user,
    communityId: topic.community_id,
    allowMod: true,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  const {
    name,
    description,
    telegram,
    group_ids,
    featured_in_sidebar,
    featured_in_new_post,
  } = body;

  let default_community_template = body.default_offchain_template?.trim();
  if (featured_in_new_post && !default_community_template) {
    throw new AppError(Errors.DefaultTemplateRequired);
  }
  // sanitize text
  default_community_template = sanitizeQuillText(default_community_template);

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
    community: topic.community_id,
    userId: user.id,
  };

  return [topic.toJSON(), analyticsOptions];
}
