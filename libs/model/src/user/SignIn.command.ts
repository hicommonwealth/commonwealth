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
import { z } from 'zod';
import { config } from '../config';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { verifySessionSignature } from '../services/session';
import { emitEvent } from '../utils/utils';

export const SignInErrors = {
  InvalidCommunity: 'Invalid community',
  InvalidAddress: 'Invalid address',
  WrongWallet: 'Verified with different wallet than created',
  ExpiredToken: 'Token has expired, please re-register',
};

async function validateAddress(
  community_id: string,
  address: string,
): Promise<{
  community: z.infer<typeof schemas.Community>;
  encodedAddress: string;
  addressHex?: string;
  existingWithHex?: z.infer<typeof schemas.Address>;
}> {
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

  if (community.base === ChainBase.Ethereum) {
    const { isAddress } = await import('web3-validator');
    if (!isAddress(address)) throw new InvalidInput('Eth address is not valid');
    return { community, encodedAddress: address };
  }

  if (community.base === ChainBase.Substrate)
    return {
      community,
      encodedAddress: addressSwapper({
        address,
        currentPrefix: community.ss58_prefix!,
      }),
    };

  if (community.base === ChainBase.NEAR)
    throw new InvalidInput('NEAR login not supported');

  if (community.base === ChainBase.Solana) {
    const { PublicKey } = await import('@solana/web3.js');
    const key = new PublicKey(address);
    if (key.toBase58() !== address)
      throw new InvalidInput(`Solana address is not valid: ${key.toBase58()}`);
    return { community, encodedAddress: address };
  }

  try {
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
        community,
        encodedAddress,
        addressHex,
        existingWithHex: existingHexesSorted.at(0)?.toJSON(),
      };
    }
    throw new InvalidInput(SignInErrors.InvalidAddress);
  } catch (e) {
    throw new InvalidInput(SignInErrors.InvalidAddress);
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
      type: 'custom',
      name: 'SignIn',
      // TODO: session/address verification step should be in auth strategy
      // - verify community rules
      // - verify session signature
      // - verify address format
      // - SECURITY TEAM: this endpoint is only secured by this strategy, so we should stop attacks here
      userResolver: async (payload) => {
        const { community_id, address } = payload;
        await validateAddress(community_id, address.trim());
        // assertion check (TODO: this might be redundant)
        // await assertAddressOwnership(address);
        return { id: -1, email: '' };
      },
    },
    body: async ({ payload }) => {
      const { community_id, address, wallet_id, block_info, session } = payload;

      // TODO: can we avoid validating the address twice?
      const { community, encodedAddress, addressHex, existingWithHex } =
        await validateAddress(community_id, address.trim());

      // Generate a random expiring verification token
      const verification_token = crypto.randomBytes(18).toString('hex');
      const verification_token_expires = new Date(
        +new Date() + config.AUTH.ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000,
      );

      // update or create address to sign it in
      const { addr, newly_created, joined_community } =
        await models.sequelize.transaction(async (transaction) => {
          const existing = await models.Address.scope(
            'withPrivateData',
          ).findOne({
            where: { community_id, address: encodedAddress },
            include: [
              {
                model: models.User,
                required: true,
                attributes: ['id', 'email', 'profile'],
              },
            ],
            transaction,
          });
          if (existing) {
            if (existing.wallet_id !== wallet_id)
              throw new InvalidInput(SignInErrors.WrongWallet);

            // TODO: review this
            // check whether the token has expired
            // (certain login methods e.g. jwt have no expiration token, so we skip the check in that case)
            // const expiration = existing.verification_token_expires;
            // if (expiration && +expiration <= +new Date())
            //  throw new InvalidInput(SignInErrors.ExpiredToken);

            const verified = await verifySessionSignature(
              deserializeCanvas(session),
              existing,
              transaction,
            );

            // TODO: review this
            // await transferOwnership(updated, community, transaction);

            verified.verification_token = verification_token;
            verified.verification_token_expires = verification_token_expires;
            verified.last_active = new Date();
            verified.block_info = block_info;
            verified.hex = addressHex;
            verified.wallet_id = wallet_id;
            const updated = await verified.save({ transaction });
            return {
              addr: updated.toJSON(),
              newly_created: false,
              joined_community: false,
            };
          }

          // create new address
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

          const verified = await verifySessionSignature(
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

          // TODO: emit events for
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
                  user_id: verified.user_id!,
                  created_at: new_address.created_at!,
                },
              },
            ],
            transaction,
          );

          return {
            addr: verified.toJSON(),
            newly_created: is_new,
            joined_community: true,
          };
        });

      return {
        ...addr,
        community_base: community!.base,
        community_ss58_prefix: community!.ss58_prefix,
        newly_created,
        joined_community,
      };
    },
  };
}
