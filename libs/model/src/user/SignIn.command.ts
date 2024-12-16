import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { deserializeCanvas } from '@hicommonwealth/shared';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { config } from '../config';
import { models } from '../database';
import {
  transferOwnership,
  verifyAddress,
  verifySessionSignature,
  type VerifiedAddress,
} from '../services/session';
import { emitEvent } from '../utils/utils';

export const SignInErrors = {
  InvalidCommunity: 'Invalid community',
  WrongWallet: 'Verified with different wallet than created',
  ExpiredToken: 'Token has expired, please re-register',
};

/**
 * SignIn command for signing in to a community
 *
 * Before executing the body, it validates that the address is
 * compatible with the community and has a valid signature.
 *
 * - When address-community link found in database:
 *   - Verifies existing address
 *     - same wallet
 *     - token is valid (not expired) TODO: refresh token
 *     - session signature
 *   - Transfers ownership of unverified address links to user
 *
 *  - When address-community link not found in database:
 *   - Creates a new link to the community
 *     - TODO: same as JoinCommunity? redundant command?
 *   - Verifies session signature (proof of address)
 *     - Creates a new user if none exists for this address
 */
export function SignIn(): Command<typeof schemas.SignIn> {
  return {
    ...schemas.SignIn,
    secure: true,
    auth: [],
    authStrategy: {
      type: 'custom',
      name: 'SignIn',
      userResolver: async (payload) => {
        const { community_id, address } = payload;
        // TODO: SECURITY TEAM: we should stop many attacks here!
        const auth = await verifyAddress(community_id, address.trim());
        // await assertAddressOwnership(address); // TODO: remove this maintenance policy
        return { id: -1, email: '', auth };
      },
    },
    body: async ({ actor, payload }) => {
      if (!actor.user.auth) throw Error('Invalid address');

      const { community_id, wallet_id, block_info, session, referral_link } =
        payload;
      const { base, encodedAddress, ss58Prefix, hex, existingHexUserId } = actor
        .user.auth as VerifiedAddress;

      const verification_token = crypto.randomBytes(18).toString('hex');
      const verification_token_expires = new Date(
        +new Date() + config.AUTH.ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000,
      );

      // update or create address
      const { addr, user_created, address_created, first_community } =
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
            // verify existing is equivalent to signing in
            if (existing.wallet_id !== wallet_id)
              throw new InvalidInput(SignInErrors.WrongWallet);

            const { addr: verified } = await verifySessionSignature(
              deserializeCanvas(session),
              existing,
              transaction,
            );

            // transfer ownership on unverified addresses
            const transferredUser = await transferOwnership(
              verified,
              transaction,
            );

            // TODO: should we only update when token expired?
            // check whether the token has expired
            // (certain login methods e.g. jwt have no expiration token, so we skip the check in that case)
            // const expiration = existing.verification_token_expires;
            // if (expiration && +expiration <= +new Date())
            //  throw new InvalidInput(SignInErrors.ExpiredToken);

            verified.verification_token = verification_token;
            verified.verification_token_expires = verification_token_expires;
            verified.last_active = new Date();
            verified.block_info = block_info;
            verified.hex = hex;
            verified.wallet_id = wallet_id;
            const updated = await verified.save({ transaction });

            transferredUser &&
              (await emitEvent(
                models.Outbox,
                [
                  {
                    event_name: schemas.EventNames.AddressOwnershipTransferred,
                    event_payload: {
                      community_id,
                      address: updated.address,
                      user_id: updated.user_id!,
                      old_user_id: transferredUser.id!,
                      old_user_email: transferredUser.email,
                      created_at: new Date(),
                    },
                  },
                ],
                transaction,
              ));

            return {
              addr: updated.toJSON(),
              user_created: false,
              address_created: false,
              first_community: false,
            };
          }

          // create new address
          const new_address = await models.Address.create(
            {
              user_id: existingHexUserId ?? null,
              community_id,
              address: encodedAddress,
              hex,
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

          const { addr: verified, user } = await verifySessionSignature(
            deserializeCanvas(session),
            new_address,
            transaction,
          );

          // is same address found in a different community?
          const is_first_community = !(
            !!existingHexUserId ||
            (await models.Address.findOne({
              where: {
                community_id: { [Op.ne]: community_id },
                address: encodedAddress,
              },
              attributes: ['community_id'],
              transaction,
            }))
          );

          // emit link and user creation events
          const events: schemas.EventPairs[] = [
            {
              event_name: schemas.EventNames.CommunityJoined,
              event_payload: {
                community_id,
                user_id: verified.user_id!,
                created_at: new_address.created_at!,
                referral_link,
              },
            },
          ];
          user &&
            events.push({
              event_name: schemas.EventNames.UserCreated,
              event_payload: {
                community_id,
                address: verified.address,
                user_id: user.id!,
                created_at: user.created_at!,
                referral_link,
              },
            });
          await emitEvent(models.Outbox, events, transaction);

          return {
            addr: {
              ...verified.toJSON(),
              User: verified.User ?? user?.toJSON(),
            },
            user_created: user ? true : false,
            address_created: true,
            first_community: is_first_community,
          };
        });

      return {
        ...addr,
        community_base: base,
        community_ss58_prefix: ss58Prefix,
        user_created,
        address_created,
        first_community,
      };
    },
  };
}
