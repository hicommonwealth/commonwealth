import { Actor, type Command, InvalidActor } from '@hicommonwealth/core';
import { UserInstance } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { deserializeCanvas, WalletId } from '@hicommonwealth/shared';
import { User as PrivyUser } from '@privy-io/server-auth';
import crypto from 'crypto';
import { getVerifiedUserInfo } from 'model/src/utils/oauth/getVerifiedUserInfo';
import { VerifiedUserInfo } from 'model/src/utils/oauth/types';
import { z } from 'zod';
import { config } from '../../../config';
import { models } from '../../../database';
import { mustExist } from '../../../middleware/guards';
import { AddressAttributes } from '../../../models/address';
import {
  type VerifiedAddress,
  verifyAddress,
  verifySessionSignature,
} from '../../../services/session';
import { mapPrivyTypeToWalletSso, privyClient } from './privy';
import { addressUpdatesAndEmitEvents, signInUser } from './utils';

async function signInPrivy(
  payload: z.infer<(typeof schemas.SignIn)['input']>,
  verificationData: {
    verification_token: string;
    verification_token_expires: Date;
  },
  actor: Actor,
): Promise<{
  newUser: boolean;
  newAddress: boolean;
  firstCommunity: boolean;
  user: UserInstance;
}> {
  if (payload.wallet_id !== WalletId.Privy) throw new Error('Invalid wallet');

  if (!payload.privyIdentityToken)
    throw new InvalidActor(actor, 'Privy ID token is required');

  let privyUser: PrivyUser;
  try {
    privyUser = await privyClient.getUser({
      idToken: payload.privyIdentityToken,
    });
    console.log('Full privy user:', privyUser);
  } catch (e) {
    throw new InvalidActor(actor, 'Invalid Privy identity token');
  }

  const user = await models.User.findOne({
    where: {
      privy_id: privyUser.id,
    },
    include: [
      {
        model: models.Address,
        required: false,
        where: {
          address: payload.address,
        },
      },
    ],
  });

  // First time signing in with Privy (existing or new user)
  // Over time, only new users will go down this path
  if (!user) {
    let verifiedSsoInfo: VerifiedUserInfo | undefined;
    if (privyUser.wallet?.walletClientType === 'privy') {
      const fullPrivyUser = await privyClient.getUserById(privyUser.id);
      const linkedAccount = fullPrivyUser.linkedAccounts.find(
        (a) => a.type === 'wallet' && a.address === payload.address,
      );
      if (!linkedAccount) throw new Error('No linked account found');
      verifiedSsoInfo = await getVerifiedUserInfo({
        privyUser: fullPrivyUser,
        walletSsoSource: mapPrivyTypeToWalletSso(linkedAccount.type),
        token: '', // TODO: how to get token from Privy?
      });
    }
    return await signInUser(
      payload,
      verificationData,
      privyUser,
      verifiedSsoInfo,
    );
  }
  // User has signed in with Privy before
  else {
    let addressData:
      | Awaited<ReturnType<typeof addressUpdatesAndEmitEvents>>
      | undefined;
    await models.sequelize.transaction(async (transaction) => {
      addressData = await addressUpdatesAndEmitEvents(
        payload,
        verificationData,
        {
          newUser: false,
          user,
          addresses: ((user.Addresses as AddressAttributes[]) || []).map((a) =>
            models.Address.build(a),
          ),
        },
        transaction,
      );
    });
    if (!addressData) throw new Error('Address not found');
    return {
      newAddress: addressData.newAddress,
      newUser: false,
      firstCommunity:
        (user.Addresses as AddressAttributes[])?.filter(
          (a) => a.address === payload.address,
        ).length === 0,
      user,
    };
  }
}

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
      const { base, encodedAddress, ss58Prefix } = actor.user
        .auth as VerifiedAddress;

      const was_signed_in = actor.user.id > 0;

      await verifySessionSignature(
        deserializeCanvas(session),
        encodedAddress,
        ss58Prefix,
      );

      const verification_token = crypto.randomBytes(18).toString('hex');
      const verification_token_expires = new Date(
        +new Date() + config.AUTH.ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000,
      );

      let res: {
        newUser: boolean;
        newAddress: boolean;
        firstCommunity: boolean;
        user: UserInstance;
      };
      if (wallet_id === WalletId.Privy) {
        res = await signInPrivy(
          payload,
          {
            verification_token,
            verification_token_expires,
          },
          actor,
        );
        return;
      } else {
        res = await signInUser(
          {
            ...payload,
            address: encodedAddress,
          },
          {
            verification_token,
            verification_token_expires,
          },
        );
      }

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
        first_community: res.firstCommunity,
      };
    },
  };
}
