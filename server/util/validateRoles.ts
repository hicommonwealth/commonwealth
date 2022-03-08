import { Request, Express } from 'express';

// Roles hierarchically encompass the roles below them.
// siteAdmins are granted permission to perform all actions allowed of chainAdmins, chainMods, and chainMembers.
// chainAdmins are granted permission to perform all actions allowed of chainMods and chainMembers.
// chainMods are granted permission to perform all actions allowed of chainMembers.

// The minimum_role param species the lowest-ranking role that has permission to
// perform a given action being validated against.

const validateRoles = async (
  models,
  req: Request,
  minimum_role: 'admin' | 'moderator' | 'member',
  chain_id: string
): Promise<boolean> => {
  const user = req.user as any;

  if (!user) return false;

  if (user.isAdmin) return true;

  const userOwnedAddressIds = (await user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);

  let allowedRoles;
  if (minimum_role === 'member') {
    allowedRoles = ['admin, moderator, member'];
  } else if (minimum_role === 'moderator') {
    allowedRoles = ['admin', 'moderator'];
  } else {
    allowedRoles = ['admin'];
  }

  const userRole = await models.Role.findOne({
    where: {
      address_id: userOwnedAddressIds,
      chain_id,
      permission: allowedRoles,
    },
  });

  return !!userRole;
};

export default validateRoles;
