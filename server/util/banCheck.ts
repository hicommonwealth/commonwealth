// Helper function to look up a scope, i.e. a chain XOR community.
// If a community is found, also check that the user is allowed to see it.
import { Op } from 'sequelize';
import { DB } from '../database';

export const BanErrors = {
  NoAddress: 'Address not found',
  Banned: 'User owns a banned address',
};

// sequelize 5.0 does not accept undefined key in where clause
const banCheck = async (
  models: DB,
  params: { chain?: string; chain_id?: string; address: string },
): Promise<[boolean, string?]> => {
  const chain_id = params.chain || params.chain_id;
  const { address } = params;

  const addressInstance = await models.Address.findOne({
    where: {
      chain: chain_id, address
    }
  });
  if (!addressInstance?.user_id) {
    // TODO: is this the correct behavior when address is not found?
    return [false, BanErrors.NoAddress];
  }

  const allAddressesOwnedByUser = await models.Address.findAll({
    where: {
      user_id: addressInstance.user_id,
      chain: chain_id,
    }
  });

  const ban = await models.Ban.findOne({
    where: {
      chain_id,
      address: {
        [Op.in]: allAddressesOwnedByUser.map((a) => a.address),
      }
    },
  });

  // searching for chain that doesn't exist
  if (ban) return [false, BanErrors.Banned];
  return [true];
};

export default banCheck;
