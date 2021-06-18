import { Magic, MagicUserMetadata } from '@magic-sdk/admin';
import { MagicUser } from 'passport-magic';

import request from 'superagent';
import { encodeAddress } from '@polkadot/util-crypto';

import { ChainInstance } from '../models/chain';
import { UserInstance } from '../models/user';
import { MAGIC_API_KEY, MAGIC_SUPPORTED_BASES } from '../config';
import { sequelize } from '../database';

import { NotificationCategories } from '../../shared/types';

export interface AuthenticateMagicLinkResults {
  user?: UserInstance;
  message?: string;
  isSignup?: boolean;
  error?: string;
}

export async function authenticateMagicLink(
  models,
  magic: Magic,
  user: MagicUser,
  chain: ChainInstance,
  roleInfo?: { chain?: string, community: string },
): Promise<AuthenticateMagicLinkResults> {
  // fetch user data from magic backend
  let userMetadata: MagicUserMetadata;
  try {
    userMetadata = await magic.users.getMetadataByIssuer(user.issuer);
  } catch (e) {
    return { error: 'Magic fetch failed.' };
  }

  // check if this is a new signup or a login
  const existingUser: UserInstance | undefined = await models.User.scope('withPrivateData').findOne({
    where: {
      email: userMetadata.email,
    },
    include: [{
      model: models.Address,
      where: { is_magic: true },
      required: false,
    }],
  });

  if (!existingUser) {
    // unsupported chain -- client should send through old email flow
    if (!chain?.base || !MAGIC_SUPPORTED_BASES.includes(chain.base)) {
      return { error: 'Unsupported magic chain.' };
    }

    const ethAddress = userMetadata.publicAddress;
    let polkadotAddress;

    // always retrieve the polkadot address for the user regardless of chain
    try {
      const polkadotResp = await request
        // eslint-disable-next-line max-len
        .get(`https://api.magic.link/v1/admin/auth/user/public/address/get?issuer=did:ethr:${userMetadata.publicAddress}`)
        .set('X-Magic-Secret-key', MAGIC_API_KEY)
        .accept('json');
      if (polkadotResp.body?.status !== 'ok') {
        return { error: polkadotResp.body?.message || 'Failed to fetch polkadot address' };
      }
      const polkadotRespAddress = polkadotResp.body?.data?.public_address;

      // convert to chain-specific address based on ss58 prefix, if we are on a specific
      // polkadot chain. otherwise, encode to edgeware.
      if (chain.ss58_prefix) {
        polkadotAddress = encodeAddress(polkadotRespAddress, chain.ss58_prefix);
      } else {
        polkadotAddress = encodeAddress(polkadotRespAddress, 7); // edgeware SS58 prefix
      }
    } catch (err) {
      return { error: err.message };
    }

    const result = await sequelize.transaction(async (t) => {
      // create new user and unverified address if doesn't exist
      const newUser = await models.User.create({
        email: userMetadata.email,
        emailVerified: true,
        magicIssuer: userMetadata.issuer,
        lastMagicLoginAt: user.claim.iat,
      }, { transaction: t });

      // create an address on their selected chain
      let newAddress;
      if (chain.base === 'substrate') {
        newAddress = await models.Address.create({
          address: polkadotAddress,
          chain: chain.id,
          verification_token: 'MAGIC',
          verification_token_expires: null,
          verified: new Date(), // trust addresses from magic
          last_active: new Date(),
          user_id: newUser.id,
          is_magic: true,
        }, { transaction: t });

        // if they selected a substrate chain, create an additional address on ethereum
        // and auto-add them to the eth forum
        const ethAddressInstance = await models.Address.create({
          address: ethAddress,
          chain: 'ethereum',
          verification_token: 'MAGIC',
          verification_token_expires: null,
          verified: new Date(), // trust addresses from magic
          last_active: new Date(),
          user_id: newUser.id,
          is_magic: true,
        }, { transaction: t });

        await models.Role.create({
          address_id: ethAddressInstance.id,
          chain_id: 'ethereum',
          permission: 'member',
        }, { transaction: t });
      } else {
        newAddress = await models.Address.create({
          address: ethAddress,
          chain: chain.id,
          verification_token: 'MAGIC',
          verification_token_expires: null,
          verified: new Date(), // trust addresses from magic
          last_active: new Date(),
          user_id: newUser.id,
          is_magic: true,
        }, { transaction: t });

        // if they selected an eth chain, create an additional address on edgeware
        // and auto-add them to the forum
        const edgewareAddressInstance = await models.Address.create({
          address: polkadotAddress,
          chain: 'edgeware',
          verification_token: 'MAGIC',
          verification_token_expires: null,
          verified: new Date(), // trust addresses from magic
          last_active: new Date(),
          user_id: newUser.id,
          is_magic: true,
        }, { transaction: t });

        await models.Role.create({
          address_id: edgewareAddressInstance.id,
          chain_id: 'edgeware',
          permission: 'member',
        }, { transaction: t });
      }

      if (roleInfo?.chain || roleInfo?.community) {
        await models.Role.create(roleInfo?.community ? {
          address_id: newAddress.id,
          offchain_community_id: roleInfo?.community,
          permission: 'member',
        } : {
          address_id: newAddress.id,
          chain_id: roleInfo?.chain,
          permission: 'member',
        }, { transaction: t });
      }

      // Automatically create subscription to their own mentions
      await models.Subscription.create({
        subscriber_id: newUser.id,
        category_id: NotificationCategories.NewMention,
        object_id: `user-${newUser.id}`,
        is_active: true,
      }, { transaction: t });

      // Automatically create a subscription to collaborations
      await models.Subscription.create({
        subscriber_id: newUser.id,
        category_id: NotificationCategories.NewCollaboration,
        object_id: `user-${newUser.id}`,
        is_active: true,
      }, { transaction: t });

      return newUser;
    });

    // re-fetch user to include address object
    // TODO: simplify this without doing a refetch
    const newUser: UserInstance = await models.User.findOne({
      where: {
        id: result.id,
      },
      include: [ models.Address ],
    });
    return { user: newUser, isSignup: true };
  } else if (existingUser.Addresses) {
    // login user if they registered via magic
    if (user.claim.iat <= existingUser.lastMagicLoginAt) {
      console.log('Replay attack detected.');
      return { message: `Replay attack detected for user ${user.issuer}}.` };
    }
    existingUser.lastMagicLoginAt = user.claim.iat;
    await existingUser.save();
    console.log(`Found existing user: ${JSON.stringify(existingUser)}`);
    return { user: existingUser, isSignup: false };
  } else {
    // error if email exists but not registered with magic
    console.log('User already registered with old method.');
    return { message: `Email for user ${user.issuer} already registered.` };
  }
}
