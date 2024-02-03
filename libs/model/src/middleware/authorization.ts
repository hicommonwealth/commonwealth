import { Actor, ActorMiddleware } from '@hicommonwealth/core';
import { Op } from 'sequelize';
import { AddressAttributes, Role, models } from '..';

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
const findAddress = async (
  actor: Actor,
  roles: Role[],
): Promise<AddressAttributes | null> => {
  // TODO: cache
  return await models.Address.findOne({
    where: {
      user_id: actor.user.id,
      address: actor.address_id,
      community_id: actor.aggregate_id,
      verified: { [Op.not]: undefined },
      role: { [Op.in]: roles },
    },
    order: ['role', 'DESC'],
  });
};

/**
 * Community admin middleware
 */
export const isCommunityAdmin: ActorMiddleware = async (actor) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return actor;
  if (!actor.address_id) return 'Must provide an address';
  if (!actor.aggregate_id) return 'Must provide a community id';
  const addr = await findAddress(actor, ['admin']);
  if (!addr) return 'User is not the administrator of the community';
  return { ...actor, author: true };
};

/**
 * Community moderator middleware
 */
export const isCommunityModerator: ActorMiddleware = async (actor) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return actor;
  if (!actor.address_id) return 'Must provide an address';
  if (!actor.aggregate_id) return 'Must provide a community id';
  const addr = await findAddress(actor, ['moderator']);
  if (!addr) return 'User is not a moderator in the community';
  return { ...actor, author: false };
};

/**
 * Community admin or moderator middleware
 */
export const isCommunityAdminOrModerator: ActorMiddleware = async (actor) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return actor;
  if (!actor.address_id) return 'Must provide an address';
  if (!actor.aggregate_id) return 'Must provide a community id';
  const addr = await findAddress(actor, ['admin', 'moderator']);
  if (!addr) return 'User is not an admin or moderator in the community';
  return { ...actor, author: addr.role === 'admin' };
};

/**
 * Thread author middleware
 */
export const isThreadAuthor: ActorMiddleware = async (actor) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return actor;
  if (!actor.address_id) return 'Must provide an address';
  if (!actor.aggregate_id) return 'Must provide a thread id';
  const thread = await models.Thread.findOne({
    where: {
      id: actor.aggregate_id,
      address_id: actor.address_id,
    },
  });
  if (!thread) return 'User not the author of the thread';
  //TODO: include loaded entity in actor?
  return { ...actor, author: true };
};

/**
 * Comment author middleware
 */
export const isCommentAuthor: ActorMiddleware = async (actor) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return actor;
  if (!actor.address_id) return 'Must provide an address';
  if (!actor.aggregate_id) return 'Must provide a comment id';
  const comment = await models.Comment.findOne({
    where: {
      id: actor.aggregate_id,
      address_id: actor.address_id,
    },
  });
  if (!comment) return 'User not the author of the comment';
  //TODO: include loaded entity in actor?
  return { ...actor, author: true };
};
