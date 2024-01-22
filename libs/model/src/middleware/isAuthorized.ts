import { ActorMiddleware, models } from '../';

/**
 * TODO: review rules
 * Seems like we have to consider these scenarios
 * - super admin: When the user is a super admin (god mode), allow all operations - no need to specify any flags
 * - community admin or moderator: Allow when user is admin of the community - only applies to community aggregates
 * - aggregate owner: Allow when the user is the owner of the aggregate (entity)
 */

/**
 * Community admin authorization middleware
 */
export const isCommunityAdmin: ActorMiddleware = async (actor) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return actor;

  if (!actor.address_id) return 'Must provide an address';

  if (!actor.community_id) return 'Must provide a community id';

  // TODO: query the role of this address in this community
  // TODO: cache
  const address = await models.Address.findOne({
    where: {
      user_id: actor.user.id,
      address: actor.address_id,
      community_id: actor.community_id,
    },
  });
  if (!address) return 'User is not a member of the community';
  if (!address.verified) return 'User is not verified';
  if (address.role !== 'admin')
    return 'User is not the administrator of the community';

  // authorized - TODO: include flags?
  return actor;
};

/**
 * Community moderator authorization middleware
 */
export const isCommunityModerator: ActorMiddleware = async (actor) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return actor;

  if (!actor.address_id) return 'Must provide an address';

  if (!actor.community_id) return 'Must provide a community id';

  // TODO: query the role of this address in this community
  // TODO: cache
  const address = await models.Address.findOne({
    where: {
      user_id: actor.user.id,
      address: actor.address_id,
      community_id: actor.community_id,
    },
  });
  if (!address) return 'User is not a member of the community';
  if (!address.verified) return 'User is not verified';
  if (address.role !== 'moderator')
    return 'User is not a moderator of the community';

  // authorized - TODO: include flags?
  return actor;
};

/**
 * TODO: Create one for each entity
 * Entity author authorization middleware
 */
export const isAuthor: ActorMiddleware = async (actor) => {
  // super admin is always allowed
  if (actor.user.isAdmin) return actor;

  if (!actor.address_id) return 'Must provide an address';

  // TODO: check if aggregate is owned by this actor (one address that belongs to this actor)
  // TODO: don't need to load aggregate here, better sql?
  // // get list of user address
  // const userOwnedAddressIds = (await actor.user.getAddresses())
  //   .filter((addr) => !!addr.verified)
  //   .map((addr) => addr.id);
  // // check if entity is owned be any user address
  // if (entity?.address_id && userOwnedAddressIds.includes(entity.address_id)) {
  //   return true;
  // }

  // authorized - TODO: include flags?
  return actor;
};
