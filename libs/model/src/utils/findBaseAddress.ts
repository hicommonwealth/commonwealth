import { Actor, InvalidInput } from '@hicommonwealth/core';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { models } from '../database';

// TODO: refactor after addresses are normalized

/**
 * Finds the base address for the given actor and chain base/type.
 * Base addresses are created when users authenticate with a wallet for the first time.
 *
 * @param actor user actor with address
 * @param base base chain
 * @param type chain type
 * @returns base address for the given actor
 */
export async function findBaseAddress(
  actor: Actor,
  base: ChainBase,
  type: ChainType,
) {
  const found = await models.Address.scope('withPrivateData').findOne({
    where: {
      user_id: actor.user.id,
      address: actor.address,
    },
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

  if (base === ChainBase.Ethereum)
    return await models.Address.scope('withPrivateData').findOne({
      where: {
        user_id: actor.user.id,
        address: { [Op.startsWith]: '0x' },
      },
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
        user_id: actor.user.id,
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

  // Onchain community can be created by Admin only,
  // but we allow offchain cmty to have any creator as admin:
  // if signed in with Keplr or Magic:
  if (base === ChainBase.CosmosSDK && type === ChainType.Offchain)
    return await models.Address.scope('withPrivateData').findOne({
      where: { user_id: actor.user.id },
      include: [
        {
          model: models.Community,
          where: { base },
          required: true,
        },
      ],
    });
}
