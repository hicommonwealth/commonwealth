import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ChainBase, addressSwapper, bech32ToHex } from '@hicommonwealth/shared';
import { bech32 } from 'bech32';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { config } from '../config';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { AddressInstance, CommunityInstance } from '../models';
import { verifyAddress } from '../session/verifyAddress';
import { emitEvent } from '../utils/utils';

export const CreateAddressErrors = {
  InvalidCommunity: 'Invalid community',
  InvalidAddress: 'Invalid address',
};

async function validateAddress(
  community: CommunityInstance,
  address: string,
): Promise<{
  encodedAddress: string;
  addressHex?: string;
  existingWithHex?: AddressInstance;
}> {
  try {
    if (community.base === ChainBase.Substrate)
      return {
        encodedAddress: addressSwapper({
          address,
          currentPrefix: community.ss58_prefix!,
        }),
      };

    // cosmos or injective
    if (community.bech32_prefix) {
      const { words } = bech32.decode(address, 50);
      const encodedAddress = bech32.encode(community.bech32_prefix, words);
      const addressHex = bech32ToHex(address);
      // check all addresses for matching hex
      const existingHexes = await models.Address.scope(
        'withPrivateData',
      ).findAll({ where: { hex: addressHex, verified: { [Op.ne]: null } } });
      const existingHexesSorted = existingHexes.sort((a, b) => {
        // sort by latest last_active
        return +b.dataValues.last_active! - +a.dataValues.last_active!;
      });
      // use the latest active address with this hex to assign profile
      return {
        encodedAddress,
        addressHex,
        existingWithHex: existingHexesSorted.at(0),
      };
    }

    if (community.base === ChainBase.Ethereum) {
      const { isAddress } = await import('web3-validator');
      if (!isAddress(address))
        throw new InvalidInput('Eth address is not valid');
      return { encodedAddress: address };
    }

    if (community.base === ChainBase.NEAR) {
      throw new InvalidInput('NEAR login not supported');
    }

    if (community.base === ChainBase.Solana) {
      const { PublicKey } = await import('@solana/web3.js');
      const key = new PublicKey(address);
      if (key.toBase58() !== address)
        throw new InvalidInput(
          `Solana address is not valid: ${key.toBase58()}`,
        );
      return { encodedAddress: address };
    }

    throw new InvalidInput(CreateAddressErrors.InvalidAddress);
  } catch (e) {
    throw new InvalidInput(CreateAddressErrors.InvalidAddress);
  }
}

/**
This may be called when:
- When logged in, to link a new address for an existing user 
  - TODO: isn't this the same as JoinCommunity?
- When logged out, to create a new user by showing proof of an address 
*/
export function CreateAddress(): Command<typeof schemas.CreateAddress> {
  return {
    ...schemas.CreateAddress,
    secure: true,
    auth: [],
    authStrategy: {
      name: 'custom',
      userResolver: async (input) => {
        // creates new user if not found
        return await verifyAddress(
          input.community_id,
          input.address,
          input.wallet_id,
          input.session,
        );
      },
    },
    body: async ({ actor, payload }) => {
      const user_id = actor.user.id;
      const { community_id, address, wallet_id, block_info } = payload;

      // Injective special validation
      if (community_id === 'injective') {
        if (address.slice(0, 3) !== 'inj')
          throw new InvalidInput('Must join with Injective address');
      } else if (address.slice(0, 3) === 'inj')
        throw new InvalidInput('Cannot join with an injective address');

      const community = await models.Community.findOne({
        where: { id: community_id },
      });
      mustExist('Community', community);

      const { encodedAddress, addressHex, existingWithHex } =
        await validateAddress(community, address.trim());

      // Generate a random expiring verification token
      const verification_token = crypto.randomBytes(18).toString('hex');
      const verification_token_expires = new Date(
        +new Date() + config.AUTH.ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000,
      );

      const existing = await models.Address.scope('withPrivateData').findOne({
        where: { community_id, address: encodedAddress },
      });
      if (existing) {
        const expiration = existing.verification_token_expires;
        const isExpired = expiration && +expiration <= +new Date();
        const isDisowned = existing.user_id === null;
        const isCurrUser = existing.user_id === user_id;

        // if owned by someone else, unverified and expired, or disowned, generate a token but don't replace user until verification
        // if owned by actor, or unverified, associate with address immediately
        ((!existing.verified && isExpired) || isDisowned || isCurrUser) &&
          (existing.user_id = user_id);
        existing.verification_token = verification_token;
        existing.verification_token_expires = verification_token_expires;
        existing.last_active = new Date();
        existing.block_info = block_info;
        existing.hex = addressHex;
        existing.wallet_id = wallet_id;

        const updated = await existing.save();
        return {
          ...updated.toJSON(),
          community_base: community.base,
          community_ss58_prefix: community.ss58_prefix,
          newly_created: false,
          joined_community: false,
        };
      }

      // create new address
      const { created, newly_created } = await models.sequelize.transaction(
        async (transaction) => {
          const created = await models.Address.create(
            {
              user_id: existingWithHex?.user_id ?? user_id,
              community_id,
              address: encodedAddress,
              hex: addressHex,
              verification_token,
              verification_token_expires,
              block_info,
              last_active: new Date(),
              wallet_id,
              role: 'member',
              is_user_default: false,
              ghost_address: false,
              is_banned: false,
            },
            { transaction },
          );

          const newly_created = !(
            !!existingWithHex ||
            (await models.Address.findOne({
              where: {
                community_id: { [Op.ne]: community_id },
                address: encodedAddress,
              },
              attributes: ['community_id'],
              transaction,
            }))
          );

          // this was missing in legacy
          const events: schemas.EventPairs[] = [];
          await models.Community.increment('profile_count', {
            by: 1,
            where: { id: community_id },
            transaction,
          });
          events.push({
            event_name: schemas.EventNames.CommunityJoined,
            event_payload: {
              community_id,
              user_id: created.user_id!,
              created_at: created.created_at!,
            },
          });
          // TODO: emit event signaling a new address was created
          // newly_created && events.push({
          //   event_name: schemas.EventNames.AddressCreated,
          //   event_payload: {
          //     community_id,
          //     user_id: created.user_id,
          //     address
          //   }
          // })
          await emitEvent(models.Outbox, events);

          return { created, newly_created };
        },
      );

      return {
        ...created.toJSON(),
        community_base: community!.base,
        community_ss58_prefix: community!.ss58_prefix,
        newly_created,
        joined_community: true,
      };
    },
  };
}
