import { Actor, ActorMiddleware, InvalidActor } from '@hicommonwealth/core';
import { Op } from 'sequelize';
import {
  AddressAttributes,
  CommentAttributes,
  CommunityAttributes,
  Role,
  ThreadAttributes,
  models,
} from '..';

/**
 * TODO: review rules
 * We have to consider these scenarios
 * - super admin: When the user is a super admin (god mode), allow all operations - no need to specify any flags
 * - community admin or moderator: Allow when user is admin of the community - only applies to community aggregates
 * - aggregate owner: Allow when the user is the owner of the aggregate (entity)
 */

/**
 * Finds one active community address that meets the arguments
 * @param actor actor context
 * @param roles roles filter
 * @returns found or undefined
 */
const authorizeAddress = async <T>(
  actor: Actor<T>,
  roles: Role[],
): Promise<AddressAttributes> => {
  if (!actor.address_id)
    throw new InvalidActor(actor, 'Must provide an address');
  if (!actor.aggregate_id)
    throw new InvalidActor(actor, 'Must provide a community id');
  // TODO: cache
  const addr = await models.Address.findOne({
    where: {
      user_id: actor.user.id,
      address: actor.address_id,
      community_id: actor.aggregate_id,
      verified: { [Op.not]: undefined },
      role: { [Op.in]: roles },
    },
    order: ['role', 'DESC'],
  });
  if (!addr)
    throw new InvalidActor(actor, `User is not ${roles} in the community`);
  return addr;
};

/**
 * Community middleware
 */
export const isCommunityAdmin: ActorMiddleware<CommunityAttributes> = async (
  actor,
) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return actor;
  await authorizeAddress(actor, ['admin']);
  return { ...actor, author: true };
};

export const isCommunityModerator: ActorMiddleware<
  CommunityAttributes
> = async (actor) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return actor;
  await authorizeAddress(actor, ['moderator']);
  return { ...actor, author: false };
};

export const isCommunityAdminOrModerator: ActorMiddleware<
  CommunityAttributes
> = async (actor) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return actor;
  const addr = await authorizeAddress(actor, ['admin', 'moderator']);
  return { ...actor, author: addr.role === 'admin' };
};

/**
 * Thread middleware
 */
export const isThreadAuthor: ActorMiddleware<ThreadAttributes> = async (
  actor,
) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return actor;
  if (!actor.address_id)
    throw new InvalidActor(actor, 'Must provide an address');
  if (!actor.aggregate_id)
    throw new InvalidActor(actor, 'Must provide a thread id');
  actor.aggregate = await models.Thread.findOne({
    where: {
      id: actor.aggregate_id,
      address_id: actor.address_id,
    },
  });
  if (!actor.aggregate)
    throw new InvalidActor(actor, 'User is not the author of the thread');
  //TODO: include loaded entity in actor?
  return { ...actor, author: true };
};

/**
 * Comment middleware
 */
export const isCommentAuthor: ActorMiddleware<CommentAttributes> = async (
  actor,
) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return actor;
  if (!actor.address_id)
    throw new InvalidActor(actor, 'Must provide an address');
  if (!actor.aggregate_id)
    throw new InvalidActor(actor, 'Must provide a comment id');
  actor.aggregate = await models.Comment.findOne({
    where: {
      id: actor.aggregate_id,
      address_id: actor.address_id,
    },
  });
  if (!actor.aggregate)
    throw new InvalidActor(actor, 'User is not the author of the comment');
  return { ...actor, author: true };
};
