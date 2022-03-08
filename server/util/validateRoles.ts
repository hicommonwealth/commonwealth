import { Request, Express } from 'express';

interface IAllowedRoles {
  siteAdmin?: boolean;
  chainAdmin?: boolean;
  chainMod?: boolean;
  chainMember?: boolean;
}

// Roles hierarchically encompass the roles below them.
// siteAdmins are granted permission to perform all actions allowed of chainAdmins, chainMods, and chainMembers.
// chainAdmins are granted permission to perform all actions allowed of chainMods and chainMembers.
// chainMods are granted permission to perform all actions allowed of chainMembers.

// In theory, this helper can therefore be called only by passing 'true' for the
// lowest-ranking permitted role.

const validateRoles = async (
  models,
  req: Request,
  allowed_roles: IAllowedRoles,
  chain_id: string
): Promise<boolean> => {
  const { chainMod, chainMember } = allowed_roles;
  const user = req.user as any;

  if (!user) return false;

  if (user.isAdmin) return true;

  const userOwnedAddressIds = (await user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);

  const userRole = await models.Role.findOne({
    where: {
      address_id: userOwnedAddressIds,
      chain_id,
      permission: chainMember
        ? ['member', 'moderator', 'admin']
        : chainMod
        ? ['moderator', 'admin']
        : ['admin'],
    },
  });

  return !!userRole;
};

export default validateRoles;
