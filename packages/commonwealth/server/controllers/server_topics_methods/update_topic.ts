import { TopicAttributes } from 'server/models/topic';
import { ChainInstance } from 'server/models/chain';
import { ServerTopicsController } from '../server_topics_controller';
import { UserInstance } from 'server/models/user';
import { AppError } from '../../../../common-common/src/errors';
import { validateOwner } from 'server/util/validateOwner';

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
  chain: ChainInstance;
  body: Partial<TopicAttributes>;
};

export type UpdateTopicResult = TopicAttributes;

export async function __updateTopic(
  this: ServerTopicsController,
  { user, chain, body }: UpdateTopicOptions
): Promise<UpdateTopicResult> {
  if (!body.id) {
    throw new AppError(Errors.NoTopicId);
  }

  const name = body.name.trim();
  if (!name) {
    throw new AppError(Errors.TopicRequired);
  }
  if (body.name.match(/["<>%{}|\\/^`]/g)) {
    throw new AppError(Errors.InvalidTopicName);
  }

  const featured_in_sidebar = body.featured_in_sidebar;
  const featured_in_new_post = body.featured_in_new_post;
  const default_offchain_template = body.default_offchain_template?.trim();
  if (featured_in_new_post && !default_offchain_template) {
    throw new AppError(Errors.DefaultTemplateRequired);
  }

  const isAdmin = await validateOwner({
    models: this.models,
    user: user,
    chainId: chain.id,
    allowAdmin: true,
    allowGodMode: true,
  });
  if (!isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  const { id, description, telegram } = body;
  const topic = await this.models.Topic.findOne({ where: { id } });
  if (!topic) throw new AppError(Errors.TopicNotFound);
  if (name) topic.name = name;
  if (name || description) topic.description = description || '';
  if (name || telegram) topic.telegram = telegram || '';
  topic.featured_in_sidebar = featured_in_sidebar;
  topic.featured_in_new_post = featured_in_new_post;
  topic.default_offchain_template = default_offchain_template || '';
  await topic.save();

  return topic.toJSON();
}
