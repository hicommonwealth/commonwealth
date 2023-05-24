// Roles hierarchically encompass the roles below them.
// siteAdmins are granted permission to perform all actions allowed of chainAdmins, chainMods, and chainMembers.
// chainAdmins are granted permission to perform all actions allowed of chainMods and chainMembers.
// chainMods are granted permission to perform all actions allowed of chainMembers.

// The minimum_role param species the lowest-ranking role that has permission to
// perform a given action being validated against.

import { Role } from 'common-common/src/roles';
import { Op } from 'sequelize';

const validateRoles = async (
  models,
  user: Express.User,
  minimum_role: 'admin' | 'moderator' | 'member',
  chain_id: string
): Promise<boolean> => {
  if (!user) return false;

  if (user.isAdmin) return true;

  const userOwnedAddressIds = (await user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);

  const allowedRoles: Role[] =
    minimum_role === 'member'
      ? ['admin', 'moderator', 'member']
      : minimum_role === 'moderator'
      ? ['admin', 'moderator']
      : ['admin'];

  const userRole = await models.Address.findOne({
    where: {
      chain: chain_id,
      id: { [Op.in]: userOwnedAddressIds },
      role: { [Op.in]: allowedRoles },
    },
    attributes: ['role'],
  });

  return !!userRole;
};

export default validateRoles;
