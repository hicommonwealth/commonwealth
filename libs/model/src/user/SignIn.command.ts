import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { deserializeCanvas } from '@hicommonwealth/shared';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { config } from '../config';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import {
  transferOwnership,
  verifyAddress,
  verifySessionSignature,
  type VerifiedAddress,
} from '../services/session';
import { emitEvent } from '../utils/utils';

/**
 * SignIn command for signing in to a community
 *
 * Before executing the body, it validates that the address is
 * compatible with the community and has a valid signature.
 *
 * - When address-community link found in database:
 *   - Verifies existing address
 *     - same wallet?
 *     - session signature
 *   - Transfers ownership of unverified address links to user
 *
 *  - When address-community link not found in database:
 *   - Creates a new link to the community with session/address verification (JoinCommunity is a secured route)
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
      userResolver: async (payload, signedInUser) => {
        const { community_id, address } = payload;
        // TODO: SECURITY TEAM: we should stop many attacks here!
        const auth = await verifyAddress(community_id, address.trim());
        // return the signed in user or a dummy placeholder
        return {
          id: signedInUser?.id ?? -1,
          email: signedInUser?.email ?? '',
          auth,
        };
      },
    },
    body: async ({ actor, payload }) => {
      if (!actor.user.auth) throw Error('Invalid address');

      const { community_id, wallet_id, referrer_address, session, block_info } =
        payload;
      const { base, encodedAddress, ss58Prefix, hex, existingHexUserId } = actor
        .user.auth as VerifiedAddress;

      let user_id =
        (actor.user?.id ?? 0) > 0 ? actor.user.id : (existingHexUserId ?? null);

      await verifySessionSignature(
        deserializeCanvas(session),
        encodedAddress,
        ss58Prefix,
      );

      const verification_token = crypto.randomBytes(18).toString('hex');
      const verification_token_expires = new Date(
        +new Date() + config.AUTH.ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000,
      );

      // upsert address, passing user_id if signed in
      const { user_created, address_created, first_community } =
        await models.sequelize.transaction(async (transaction) => {
          // is same address found in a different community?
          const is_first_community = !(
            user_id ||
            (await models.Address.findOne({
              where: {
                community_id: { [Op.ne]: community_id },
                address: encodedAddress,
              },
              attributes: ['community_id'],
              transaction,
            }))
          );

          /* If address doesn't have an associated user, create one!
          - NOTE: magic strategy is the other place (when using email)
          */
          let new_user = false;
          if (!user_id) {
            const existing = await models.Address.findOne({
              where: { address: encodedAddress, user_id: { [Op.ne]: null } },
            });
            if (!existing) {
              const user = await models.User.create(
                { email: null, profile: {} },
                { transaction },
              );
              if (!user) throw new Error('Failed to create user');
              user_id = user.id!;
              new_user = true;
            } else user_id = existing.user_id!;
          }

          const [addr, new_address] = await models.Address.findOrCreate({
            where: { community_id, address: encodedAddress },
            defaults: {
              community_id,
              address: encodedAddress,
              user_id,
              hex,
              wallet_id,
              verification_token,
              verification_token_expires,
              block_info,
              last_active: new Date(),
              verified: new Date(),
              role: 'member',
              is_user_default: false,
              ghost_address: false,
              is_banned: false,
            },
            transaction,
          });
          if (!new_address) {
            addr.user_id = user_id;
            addr.wallet_id = wallet_id;
            addr.verification_token = verification_token;
            addr.verification_token_expires = verification_token_expires;
            addr.block_info = block_info;
            addr.last_active = new Date();
            addr.verified = new Date();
            await addr.save({ transaction });
          }

          const transferredUser = await transferOwnership(addr, transaction);

          const events: schemas.EventPairs[] = [];
          new_address &&
            events.push({
              event_name: schemas.EventNames.CommunityJoined,
              event_payload: {
                community_id,
                user_id: addr.user_id!,
                created_at: addr.created_at!,
                referrer_address,
              },
            });
          new_user &&
            events.push({
              event_name: schemas.EventNames.UserCreated,
              event_payload: {
                community_id,
                address: addr.address,
                user_id,
                created_at: addr.created_at!,
                referrer_address,
              },
            });
          transferredUser &&
            events.push({
              event_name: schemas.EventNames.AddressOwnershipTransferred,
              event_payload: {
                community_id,
                address: addr.address,
                user_id: addr.user_id!,
                old_user_id: transferredUser.id!,
                old_user_email: transferredUser.email,
                created_at: new Date(),
              },
            });
          await emitEvent(models.Outbox, events, transaction);

          return {
            user_created: new_user,
            address_created: !!new_address,
            first_community: is_first_community,
          };
        });

      const addr = await models.Address.scope('withPrivateData').findOne({
        where: { community_id, address: encodedAddress, user_id },
        include: [
          {
            model: models.User,
            required: true,
            attributes: ['id', 'email', 'profile'],
          },
        ],
      });
      mustExist('Address', addr);
      return {
        ...addr.toJSON(),
        community_base: base,
        community_ss58_prefix: ss58Prefix,
        user_created,
        address_created,
        first_community,
      };
    },
  };
}
