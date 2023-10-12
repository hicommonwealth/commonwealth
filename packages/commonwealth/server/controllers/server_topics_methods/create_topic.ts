import { Op } from 'sequelize';
import { TopicAttributes } from '../../models/topic';
import { ChainInstance } from '../../models/chain';
import { ServerTopicsController } from '../server_topics_controller';
import { UserInstance } from '../../models/user';
import { AppError } from '../../../../common-common/src/errors';
import { findAllRoles } from '../../util/roles';

export const Errors = {
  NotLoggedIn: 'Not signed in',
  TopicRequired: 'Topic name required',
  MustBeAdmin: 'Must be an admin',
  InvalidTokenThreshold: 'Invalid token threshold',
  DefaultTemplateRequired: 'Default Template required',
  InvalidTopicName: 'Topic uses disallowed special characters',
};

export type CreateTopicOptions = {
  user: UserInstance;
  chain: ChainInstance;
  body: Partial<TopicAttributes>;
};

export type CreateTopicResult = TopicAttributes;

export async function __createTopic(
  this: ServerTopicsController,
  { user, chain, body }: CreateTopicOptions
): Promise<CreateTopicResult> {
  if (!user) {
    throw new AppError(Errors.NotLoggedIn);
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

  const userAddressIds = (await user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  const adminRoles = await findAllRoles(
    this.models,
    { where: { address_id: { [Op.in]: userAddressIds } } },
    chain.id,
    ['admin', 'moderator']
  );
  if (!user.isAdmin && adminRoles.length === 0) {
    throw new AppError(Errors.MustBeAdmin);
  }

  const isNumber = /^\d+$/.test(body.token_threshold);
  if (!isNumber) {
    throw new AppError(Errors.InvalidTokenThreshold);
  }

  const options = {
    name,
    description: body.description || '',
    token_threshold: body.token_threshold,
    featured_in_sidebar,
    featured_in_new_post,
    default_offchain_template: default_offchain_template || '',
    chain_id: chain.id,
  };

  const [newTopic] = await this.models.Topic.findOrCreate({
    where: {
      name,
      chain_id: chain.id,
    },
    defaults: options,
  });

  return newTopic.toJSON();
}
