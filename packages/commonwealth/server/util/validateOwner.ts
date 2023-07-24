import { UserInstance } from 'server/models/user';
import { findAllRoles } from './roles';
import { Op } from 'sequelize';
import { DB } from 'server/models';
import { ThreadAttributes } from 'server/models/thread';
import { CommentAttributes } from 'server/models/comment';
import { Role } from 'server/models/role';

type ValidateOwnerOptions = {
  models: DB;
  user: UserInstance;
  chainId: string;
  entity?: ThreadAttributes | CommentAttributes;
  allowMod?: boolean;
  allowAdmin?: boolean;
  allowGodMode?: boolean;
};

export const validateOwner = async ({
  models,
  user,
  chainId,
  entity,
  allowMod,
  allowAdmin,
  allowGodMode,
}: ValidateOwnerOptions): Promise<boolean> => {
  // god mode
  if (allowGodMode && user.isAdmin) {
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

  // check if user is mod or admin of chain
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
    chainId,
    requiredRoles
  );
  const role = roles.find((r) => {
    return r.chain_id === chainId && requiredRoles.includes(r.permission);
  });
  if (role) {
    return true;
  }

  return false;
};
