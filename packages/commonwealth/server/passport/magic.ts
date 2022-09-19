import passport from 'passport';
import request from 'superagent';

import { encodeAddress } from '@polkadot/util-crypto';

import { Magic, MagicUserMetadata } from '@magic-sdk/admin';
import { Strategy as MagicStrategy } from 'passport-magic';

import '../types';
import { sequelize, DB } from '../database';
import { ChainBase, NotificationCategories, WalletId } from 'common-common/src/types';
import { MAGIC_API_KEY, MAGIC_SUPPORTED_BASES } from '../config';
import validateChain from '../util/validateChain';
import { ProfileAttributes } from '../models/profile';

import { factory, formatFilename } from 'common-common/src/logging';
import { AddressInstance } from '../models/address';
import { AppError, ServerError } from 'common-common/src/errors';
const log = factory.getLogger(formatFilename(__filename));

export function useMagicAuth(models: DB) {
  // allow magic login if configured with key
  if (MAGIC_API_KEY) {
    // TODO: verify we are in a community that supports magic login
    const magic = new Magic(MAGIC_API_KEY);
    passport.use(new MagicStrategy({ passReqToCallback: true }, async (req, user, cb) => {
      // determine login location
      let chain, error;
      if (req.body.chain || req.body.community) {
        [ chain, error ] = await validateChain(models, req.body);
        if (error) return cb(error);
      }
      const registrationChain = chain;

      // fetch user data from magic backend
      let userMetadata: MagicUserMetadata;
      try {
        userMetadata = await magic.users.getMetadataByIssuer(user.issuer);
      } catch (e) {
        return cb(new ServerError(`Magic fetch failed: ${e.message} - ${JSON.stringify(e.data)}`));
      }

      // check if this is a new signup or a login
      const existingUser = await models.User.scope('withPrivateData').findOne({
        where: {
          email: userMetadata.email,
        },
        include: [{
          model: models.Address,
          where: { wallet_id: WalletId.Magic },
          required: false,
        }]
      });

      // if not on root URL and we don't support the chain base for magic don't allow users to sign up
      if (!existingUser && registrationChain?.base && !MAGIC_SUPPORTED_BASES.includes(registrationChain.base)) {
        // unsupported chain -- client should send through old email flow
        return cb(new AppError('Unsupported magic chain.'));
      }

      // if on root URL, no chain base, we allow users to sign up and generate a Substrate + Ethereum Address
      if (!existingUser && !registrationChain?.base) {
        const ethAddress = userMetadata.publicAddress;
        let polkadotAddress

        try {
          const polkadotResp = await request
            // eslint-disable-next-line max-len
            .get(`https://api.magic.link/v1/admin/auth/user/public/address/get?issuer=did:ethr:${userMetadata.publicAddress}`)
            .set('X-Magic-Secret-key', MAGIC_API_KEY)
            .accept('json');
          if (polkadotResp.body?.status !== 'ok') {
            throw new Error(polkadotResp.body?.message || 'Failed to fetch polkadot address');
          }
          const polkadotRespAddress = polkadotResp.body?.data?.public_address;

          // convert to chain-specific address based on ss58 prefix, if we are on a specific
          // polkadot chain. otherwise, encode to edgeware.
          if (registrationChain?.base && registrationChain.ss58_prefix) {
            polkadotAddress = encodeAddress(polkadotRespAddress, registrationChain.ss58_prefix); // edgeware SS58 prefix
          } else {
            polkadotAddress = encodeAddress(polkadotRespAddress, 7); // edgeware SS58 prefix
          }
        } catch (err) {
          return cb(new ServerError(err.message));
        }

        const result = await sequelize.transaction(async (t) => {
          // create new user and unverified address if doesn't exist
          const newUser = await models.User.createWithProfile(models, {
            email: userMetadata.email,
            emailVerified: true,
          }, { transaction: t });

          // create an address on their selected chain
          let newAddress: AddressInstance;
          newAddress = await models.Address.create({
            address: ethAddress,
            chain: 'ethereum',
            verification_token: 'MAGIC',
            verification_token_expires: null,
            verified: new Date(), // trust addresses from magic
            last_active: new Date(),
            user_id: newUser.id,
            profile_id: (newUser.Profiles[0] as ProfileAttributes).id,
            wallet_id: WalletId.Magic,
          }, { transaction: t });

          const edgewareAddressInstance = await models.Address.create({
            address: polkadotAddress,
            chain: 'edgeware',
            verification_token: 'MAGIC',
            verification_token_expires: null,
            verified: new Date(), // trust addresses from magic
            last_active: new Date(),
            user_id: newUser.id,
            profile_id: (newUser.Profiles[0] as ProfileAttributes).id,
            wallet_id: WalletId.Magic,
          }, { transaction: t });

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

          // create token with provided user/address
          await models.SsoToken.create({
            issuer: userMetadata.issuer,
            issued_at: user.claim.iat,
            address_id: newAddress.id, // always ethereum address
            created_at: new Date(),
            updated_at: new Date(),
          }, { transaction: t });

          return newUser;
        });

        // re-fetch user to include address object
        const newUser = await models.User.findOne({
          where: {
            id: result.id,
          },
          include: [ models.Address ],
        });
        return cb(null, newUser);
      } else if (!existingUser && registrationChain?.base && MAGIC_SUPPORTED_BASES.includes(registrationChain.base)) {
        const ethAddress = userMetadata.publicAddress;
        let polkadotAddress

        /* This just uses the ETH Address to encode a Substrate Address, which I'm not sure is the right approach.
           We may want to derive / generate various Magic Chain Addresses on the front end then create / store them via the `createAddress` route
           We will have to:
            1. validate the signature + pass the address back +
            2. have some specific logic for generating / loading various Magic Extensions as necessary
        */

        // always retrieve the polkadot address for the user regardless of chain
        try {
          const polkadotResp = await request
            // eslint-disable-next-line max-len
            .get(`https://api.magic.link/v1/admin/auth/user/public/address/get?issuer=did:ethr:${userMetadata.publicAddress}`)
            .set('X-Magic-Secret-key', MAGIC_API_KEY)
            .accept('json');
          if (polkadotResp.body?.status !== 'ok') {
            throw new ServerError(polkadotResp.body?.message || 'Failed to fetch polkadot address');
          }
          const polkadotRespAddress = polkadotResp.body?.data?.public_address;

          // convert to chain-specific address based on ss58 prefix, if we are on a specific
          // polkadot chain. otherwise, encode to edgeware.
          if (registrationChain?.base && registrationChain.ss58_prefix) {
            polkadotAddress = encodeAddress(polkadotRespAddress, registrationChain.ss58_prefix); // edgeware SS58 prefix
          } else {
            polkadotAddress = encodeAddress(polkadotRespAddress, 7); // edgeware SS58 prefix
          }
        } catch (err) {
          return cb(new ServerError(err.message));
        }

        const result = await sequelize.transaction(async (t) => {
          // create new user and unverified address if doesn't exist
          const newUser = await models.User.createWithProfile(models, {
            email: userMetadata.email,
            emailVerified: true,
          }, { transaction: t });

          // create an address on their selected chain
          let newAddress: AddressInstance;
          if (registrationChain?.base === ChainBase.Substrate) {
            // Swap "newAddress" with Ethereum as "existing User" SSO Token search expects ETH Address
            newAddress = await models.Address.create({
              address: ethAddress,
              chain: 'ethereum',
              verification_token: 'MAGIC',
              verification_token_expires: null,
              verified: new Date(), // trust addresses from magic
              last_active: new Date(),
              user_id: newUser.id,
              profile_id: (newUser.Profiles[0] as ProfileAttributes).id,
              wallet_id: WalletId.Magic
            }, { transaction: t });

            // if they selected a substrate chain, create an additional address on ethereum
            // and auto-add them to the eth forum
            const substrateAddressInstance = await models.Address.create({
              address: polkadotAddress,
              chain: registrationChain.id,
              verification_token: 'MAGIC',
              verification_token_expires: null,
              verified: new Date(), // trust addresses from magic
              last_active: new Date(),
              user_id: newUser.id,
              profile_id: (newUser.Profiles[0] as ProfileAttributes).id,
              wallet_id: WalletId.Magic,
            }, { transaction: t });

            await models.Role.create({
              address_id: newAddress.id,
              chain_id: 'ethereum',
              permission: 'member',
            });
          } else {
            newAddress = await models.Address.create({
              address: ethAddress,
              chain: registrationChain.id,
              verification_token: 'MAGIC',
              verification_token_expires: null,
              verified: new Date(), // trust addresses from magic
              last_active: new Date(),
              user_id: newUser.id,
              profile_id: (newUser.Profiles[0] as ProfileAttributes).id,
              wallet_id: WalletId.Magic,
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
              profile_id: (newUser.Profiles[0] as ProfileAttributes).id,
              wallet_id: WalletId.Magic,
            }, { transaction: t });

            await models.Role.create({
              address_id: edgewareAddressInstance.id,
              chain_id: 'edgeware',
              permission: 'member',
            }, { transaction: t });
          }

          if (req.body.chain) await models.Role.create({
            address_id: newAddress.id,
            chain_id: req.body.chain,
            permission: 'member',
          }, { transaction: t });

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

          // Automatically create subscription to chat mentions
          await models.Subscription.create({
            subscriber_id: newUser.id,
            category_id: NotificationCategories.NewChatMention,
            object_id: `user-${newUser.id}`,
            is_active: true,
          }, { transaction: t });

          // create token with provided user/address
          await models.SsoToken.create({
            issuer: userMetadata.issuer,
            issued_at: user.claim.iat,
            address_id: newAddress.id, // always ethereum address
            created_at: new Date(),
            updated_at: new Date(),
          }, { transaction: t });

          return newUser;
        });

        // re-fetch user to include address object
        const newUser = await models.User.findOne({
          where: {
            id: result.id,
          },
          include: [ models.Address ],
        });
        return cb(null, newUser);
      } else if (existingUser.Addresses?.length > 0) {
        // each user should only ever have one token issued by Magic
        const ssoToken = await models.SsoToken.findOne({
          where: {
            issuer: user.issuer
          },
          include: [{
            model: models.Address,
            where: { address: user.publicAddress }, // Assumes address is always Ethereum Address which it isn't
            required: true,
          }]
        });
        // login user if they registered via magic
        if (user.claim.iat <= ssoToken.issued_at) {
          console.log('Replay attack detected.');
          return cb(null, null, {
            message: `Replay attack detected for user ${user.publicAddress}}.`,
          });
        }
        ssoToken.issued_at = user.claim.iat;
        ssoToken.updated_at = new Date();
        await ssoToken.save();
        console.log(`Found existing user: ${JSON.stringify(existingUser)}`);
        return cb(null, existingUser);
      } else {
        // error if email exists but not registered with magic
        console.log('User already registered with old method.');
        return cb(null, null, {
          message: `Email for user ${user.issuer} already registered`
        });
      }
    }));
  }
}
