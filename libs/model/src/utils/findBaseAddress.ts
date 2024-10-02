import { InvalidInput } from '@hicommonwealth/core';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { models } from '../database';

/**
 * Finds a compatible base address for the given user and chain base/type.
 * Addresses are created when users authenticate with a wallet for the first time, or when
 * users join a community.
 *
 * @param user_id id of user account
 * @param address current address
 * @param base base chain
 * @param type chain type
 * @returns compatible base address for the given actor
 */
export async function findCompatibleAddress(
  user_id: number,
  address: string,
  base: ChainBase,
  type: ChainType = ChainType.Offchain, // when joining we don't need to check the type
) {
  // First try to find if the current actor's address is compatible with the given base,
  // and use it to create or join the community
  const found = await models.Address.scope('withPrivateData').findOne({
    where: { user_id, address },
    include: [
      {
        model: models.Community,
        where: { base },
        required: true,
      },
    ],
  });
  if (found) return found;

  if (base === ChainBase.NEAR) throw new InvalidInput('Invalid Base');

  // --------------------------------------------------------------------------------
  // When current address not found, try to find any other compatible address for this user,
  // (from other communities with same base)
  // --------------------------------------------------------------------------------

  if (base === ChainBase.Ethereum)
    return await models.Address.scope('withPrivateData').findOne({
      where: { user_id, address: { [Op.startsWith]: '0x' } },
      include: [
        {
          model: models.Community,
          where: { base },
          required: true,
        },
      ],
    });

  if (base === ChainBase.Solana)
    return await models.Address.scope('withPrivateData').findOne({
      where: {
        user_id,
        address: {
          // This is the regex formatting for solana addresses per their website
          [Op.regexp]: '[1-9A-HJ-NP-Za-km-z]{32,44}',
        },
      },
      include: [
        {
          model: models.Community,
          where: { base },
          required: true,
        },
      ],
    });

  // Onchain community can be created by Admin only, but we allow Offchain to have any creator
  // if signed in with Keplr or Magic
  if (base === ChainBase.CosmosSDK && type === ChainType.Offchain)
    return await models.Address.scope('withPrivateData').findOne({
      where: { user_id },
      include: [
        {
          model: models.Community,
          where: { base },
          required: true,
        },
      ],
    });
}
