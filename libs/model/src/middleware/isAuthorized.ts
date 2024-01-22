import { ActorMiddleware, CommentAttributes, ThreadAttributes } from '../';

// TODO: review rules
// Authorization options, this works like a waterfall
type AuthorizedOptions = {
  superAdmin?: boolean; // super admins are authorized (isn't this always the case?)
  owner?: boolean; // the owner of the aggregate is authorized
  communityAdmin?: boolean; // community admin is autorized (isn't this the same as owner?)
  communityModerator?: boolean; // community moderators are authorized
  entity?: ThreadAttributes | CommentAttributes; // TODO: make generic? or use enum and extract id from request.
};

/**
 * Factory that builds authorization middleware used to authorize actors to execute actions
 * @param options authorization options describing who's allowed to execute the action
 * @returns authorization middleware
 */
export function isAuthorized(auth: AuthorizedOptions): ActorMiddleware {
  return async (actor) => {
    if (actor.user.isAdmin && auth.superAdmin) return actor;

    // TODO: check if aggregate is owned by this actor (one address that belongs to this actor)
    // // get list of user address
    // const userOwnedAddressIds = (await actor.user.getAddresses())
    //   .filter((addr) => !!addr.verified)
    //   .map((addr) => addr.id);

    // // check if entity is owned be any user address
    // if (entity?.address_id && userOwnedAddressIds.includes(entity.address_id)) {
    //   return true;
    // }

    // TODO: check if user is moderator or admin of community
    // const requiredRoles: Role[] = [];
    // if (allowMod) {
    //   requiredRoles.push('moderator');
    // }
    // if (allowAdmin) {
    //   requiredRoles.push('admin');
    // }
    // const roles = await findAllRoles(
    //   models,
    //   { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
    //   communityId,
    //   requiredRoles,
    // );
    // const role = roles.find((r) => {
    //   return r.chain_id === communityId && requiredRoles.includes(r.permission);
    // });
    // if (role) {
    //   return true;
    // }

    // authorized - TODO: include flags?
    return actor;
  };
}
