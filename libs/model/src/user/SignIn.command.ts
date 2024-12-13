import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  ChainBase,
  addressSwapper,
  bech32ToHex,
  deserializeCanvas,
} from '@hicommonwealth/shared';
import { bech32 } from 'bech32';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { config } from '../config';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { AddressInstance, CommunityInstance } from '../models';
import { verifySessionSignature } from '../services/session';
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
 * TODO: Describe signin flows here
 * - When logged in:
 *   - to link a new address for an existing user  - TODO: isn't this the same as JoinCommunity?
 *   - to verify an existing address (refresh token)
 * - When logged out
 *   - to create a new user by showing proof of an address (verification and optional creation of new user and address)
 *   - transferring ownership of an address to a new user
 */
export function SignIn(): Command<typeof schemas.SignIn> {
  return {
    ...schemas.SignIn,
    secure: true,
    auth: [],
    authStrategy: {
      name: 'custom',
      userResolver: async (req) => {
        // TODO: session/address verification step should be in auth strategy
        // - verify session signature
        // - verify address format and ownership
        // - SECURITY TEAM: this endpoint is only secured by this strategy, so we should stop attacks here

        // TODO: some of this should be in the auth strategy (verifyAddress removed from client)
        // await verifyAddress(
        //   community_id,
        //   address,
        //   wallet_id,
        //   session,
        //   req.user as User,
        // );

        // TODO: this should be called here
        const user = { id: -1, email: '' };
        return await new Promise((resolve, reject) => {
          // passport login flow
          req.login(user, (err) => {
            if (err) {
              // serverAnalyticsController.track(
              //   {
              //     event: MixpanelLoginEvent.LOGIN_FAILED,
              //   },
              //   req,
              // );
              reject(err);
            } else {
              // serverAnalyticsController.track(
              //   {
              //     event: MixpanelLoginEvent.LOGIN_COMPLETED,
              //     userId: user.id,
              //   },
              //   req,
              // );
              resolve(user);
            }
          });
        });
      },
    },
    body: async ({ payload }) => {
      const { community_id, address, wallet_id, block_info, session } = payload;

      // TODO: Create abstraction to validate community rules
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

      // TODO: this should be in the auth strategy
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
      // update address if not disowed
      if (existing && existing.user_id) {
        // TODO: should we verify session here again?
        // TODO: should we refresh the token all the time?
        // TODO: how to handle replay attacks on this open endpoint?
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
          const new_address = await models.Address.create(
            {
              user_id: existingWithHex?.user_id ?? null,
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

          // TODO: this should be in the auth strategy
          // verify the session signature and create a new user
          const updated = await verifySessionSignature(
            deserializeCanvas(session),
            new_address,
            transaction,
          );

          const is_new = !(
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

          // TODO: we should also emit events for
          // - user creation
          // - address creation (community joined)
          // - address transfer (community joined) -> to be used by email notifications
          // this was missing in legacy
          await emitEvent(
            models.Outbox,
            [
              {
                event_name: schemas.EventNames.CommunityJoined,
                event_payload: {
                  community_id,
                  user_id: updated.user_id!,
                  created_at: new_address.created_at!,
                },
              },
            ],
            transaction,
          );

          return { created: updated, newly_created: is_new };
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
