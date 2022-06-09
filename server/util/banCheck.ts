// Helper function to look up a scope, i.e. a chain XOR community.
// If a community is found, also check that the user is allowed to see it.

import { DB } from '../database';

export const BanErrors = {
  Banned: 'User owns a banned address',
};

// sequelize 5.0 does not accept undefined key in where clause
const banCheck = async (
  models: DB,
  params: { chain?: string; chain_id?: string; address: string },
): Promise<[boolean, string?]> => {
  const chain_id = params.chain || params.chain_id;
  const { address } = params;

  // TODO: more complex checks if address owner owns any address that's banned

  const ban = await models.Ban.findOne({
    where: {
      chain_id,
      address,
    },
  });

  // searching for chain that doesn't exist
  if (ban) return [false, BanErrors.Banned];
  return [true];
};

export default banCheck;
