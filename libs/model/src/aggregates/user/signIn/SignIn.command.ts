import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { deserializeCanvas, WalletId } from '@hicommonwealth/shared';
import crypto from 'crypto';
import { config } from '../../../config';
import { models } from '../../../database';
import { mustExist } from '../../../middleware/guards';
import { UserAttributes } from '../../../models/user';
import {
  type VerifiedAddress,
  verifyAddress,
  verifySessionSignature,
} from '../../../services/session';
import { signInPrivy } from './privy';
import { signInUser } from './utils';

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
      if (!actor.user.id || !actor.user.auth) throw Error('Invalid address');

      const { wallet_id, session } = payload;
      const {
        base,
        encodedAddress,
        ss58Prefix,
        hex,
        existingHexUserId,
        eth_chain_id: ethChainId,
      } = actor.user.auth as VerifiedAddress;

      const was_signed_in = actor.user.id > 0;
      const user_id = was_signed_in
        ? actor.user.id
        : (existingHexUserId ?? null);
      let user: UserAttributes | undefined | null;
      if (user_id) {
        user = await models.User.findOne({
          where: {
            id: user_id,
          },
        });
      }

      await verifySessionSignature(
        deserializeCanvas(session),
        encodedAddress,
        ss58Prefix,
      );

      const verification_token = crypto.randomBytes(18).toString('hex');
      const verification_token_expires = new Date(
        +new Date() + config.AUTH.ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000,
      );

      const args = {
        payload: {
          ...payload,
          address: encodedAddress,
          hex,
        },
        verificationData: {
          verification_token,
          verification_token_expires,
        },
        signedInUser: user,
        ethChainId: ethChainId ?? undefined,
      };

      console.log('wallet_id signInPrivy', wallet_id);
      const res =
        wallet_id === WalletId.Privy
          ? await signInPrivy(args)
          : await signInUser(args);

      const addr = await models.Address.scope('withPrivateData').findOne({
        where: {
          community_id: payload.community_id,
          address: encodedAddress,
          user_id: res.user.id!,
        },
        include: [
          {
            model: models.User,
            required: true,
            attributes: ['id', 'email', 'profile', 'tier'],
          },
        ],
      });
      mustExist('Address', addr);

      return {
        ...addr.toJSON(),
        community_base: base,
        community_ss58_prefix: ss58Prefix,
        was_signed_in,
        user_created: res.newUser,
        address_created: res.newAddress,
        // TODO: this does not seem to be used on client?
        first_community: !(user_id || res.addressCount > 1),
      };
    },
  };
}
