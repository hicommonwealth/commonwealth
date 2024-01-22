import { Actor, ActorMiddleware, Role, models } from '..';

/**
 * TODO: review rules
 * We have to consider these scenarios
 * - super admin: When the user is a super admin (god mode), allow all operations - no need to specify any flags
 * - community admin or moderator: Allow when user is admin of the community - only applies to community aggregates
 * - aggregate owner: Allow when the user is the owner of the aggregate (entity)
 */

// TODO: query the role of a user/address in a community
const getCommunityRole = async (actor: Actor): Promise<Role | undefined> => {
  // TODO: cache
  const address = await models.Address.findOne({
    where: {
      user_id: actor.user.id,
      address: actor.address_id!,
      community_id: actor.aggregate_id,
      verified: true,
    },
  });
  return address?.role;
};

/**
 * Community admin middleware
 */
export const isCommunityAdmin: ActorMiddleware = async (actor) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return actor;
  if (!actor.address_id) return 'Must provide an address';
  if (!actor.aggregate_id) return 'Must provide a community id';
  const role = await getCommunityRole(actor);
  if (!role) return 'User is not a member of the community';
  if (role !== 'admin') return 'User is not the administrator of the community';
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
  const role = await getCommunityRole(actor);
  if (!role) return 'User is not a member of the community';
  if (role !== 'moderator') return 'User is not a moderator in the community';
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
  const role = await getCommunityRole(actor);
  if (!role) return 'User is not a member of the community';
  if (role !== 'admin' && role !== 'moderator')
    return 'User is not an admin or moderator in the community';
  return { ...actor, author: role === 'admin' };
};

/**
 * Thread author middleware
 */
export const isThreadAuthor: ActorMiddleware = async (actor) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return actor;
  if (!actor.address_id) return 'Must provide an address';
  if (!actor.aggregate_id) return 'Must provide a thread id';
  const address = await models.Thread.findOne({
    where: {
      id: actor.aggregate_id,
      address_id: actor.address_id,
    },
  });
  if (!address) return 'User not the author of the thread';
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
  const address = await models.Comment.findOne({
    where: {
      id: actor.aggregate_id,
      address_id: actor.address_id,
    },
  });
  if (!address) return 'User not the author of the comment';
  return { ...actor, author: true };
};
