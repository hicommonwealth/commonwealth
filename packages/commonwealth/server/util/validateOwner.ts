import {
  CommentAttributes,
  DB,
  Role,
  ThreadAttributes,
  UserInstance,
} from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { findAllRoles } from './roles';

type ValidateOwnerOptions = {
  models: DB;
  user: UserInstance;
  communityId: string;
  entity?: ThreadAttributes | CommentAttributes;
  allowMod?: boolean;
  allowAdmin?: boolean;
  allowSuperAdmin?: boolean;
};

export const validateOwner = async ({
  models,
  user,
  communityId,
  entity,
  allowMod,
  allowAdmin,
  allowSuperAdmin,
}: ValidateOwnerOptions): Promise<boolean> => {
  // super admin mode
  if (allowSuperAdmin && user.isAdmin) {
    return true;
  }

  // get list of user address
  const userOwnedAddressIds = (await user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);

  // check if entity is owned be any user address
  if (entity?.address_id && userOwnedAddressIds.includes(entity.address_id)) {
    return true;
  }

  // check if user is mod or admin of community
  const requiredRoles: Role[] = [];
  if (allowMod) {
    requiredRoles.push('moderator');
  }
  if (allowAdmin) {
    requiredRoles.push('admin');
  }
  const roles = await findAllRoles(
    models,
    { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
    communityId,
    requiredRoles,
  );
  const role = roles.find((r) => {
    return (
      r.community_id === communityId && requiredRoles.includes(r.permission)
    );
  });
  if (role) {
    return true;
  }

  return false;
};
