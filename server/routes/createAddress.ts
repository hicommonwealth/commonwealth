import { NextFunction } from 'express';
import { bech32 } from 'bech32';
import crypto from 'crypto';
import Web3 from 'web3';
import { PublicKey } from '@solana/web3.js';

import AddressSwapper from '../util/addressSwapper';
import { DB } from '../database';
import { TypedRequestBody, TypedResponse, success } from '../types';
import { ChainBase, WalletId } from '../../shared/types';
import { factory, formatFilename } from '../../shared/logging';
import { ADDRESS_TOKEN_EXPIRES_IN } from '../config';
import { AddressAttributes } from '../models/address';
import { mixpanelTrack } from '../util/mixpanelUtil';
import { MixpanelUserSignupEvent } from '../../shared/analytics/types';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedChain: 'Must provide chain',
  NeedWallet: 'Must provide valid walletId',
  InvalidChain: 'Invalid chain',
  InvalidAddress: 'Invalid address',
};

type CreateAddressReq = {
  address: string;
  chain: string;
  wallet_id: WalletId;
  community?: string;
  keytype?: string;
};

type CreateAddressResp = AddressAttributes;

const createAddress = async (
  models: DB,
  req: TypedRequestBody<CreateAddressReq>,
  res: TypedResponse<CreateAddressResp>,
  next: NextFunction
) => {
  // start the process of creating a new address. this may be called
  // when logged in to link a new address for an existing user, or
  // when logged out to create a new user by showing proof of an address.
  if (!req.body.address) {
    return next(new Error(Errors.NeedAddress));
  }
  if (!req.body.chain) {
    return next(new Error(Errors.NeedChain));
  }
  if (
    !req.body.wallet_id ||
    !Object.values(WalletId).includes(req.body.wallet_id)
  ) {
    return next(new Error(Errors.NeedWallet));
  }

  const chain = await models.Chain.findOne({
    where: { id: req.body.chain },
  });

  if (!chain) {
    return next(new Error(Errors.InvalidChain));
  }

  // test / convert address as needed
  let encodedAddress = (req.body.address as string).trim();
  try {
    if (chain.base === ChainBase.Substrate) {
      encodedAddress = AddressSwapper({
        address: req.body.address,
        currentPrefix: chain.ss58_prefix,
      });
    } else if (chain.bech32_prefix) {
      // cosmos or injective
      const { words } = bech32.decode(req.body.address, 50);
      encodedAddress = bech32.encode(chain.bech32_prefix, words);
    } else if (chain.base === ChainBase.Ethereum) {
      if (!Web3.utils.isAddress(encodedAddress)) {
        throw new Error('Eth address is not valid');
      }
    } else if (chain.base === ChainBase.NEAR) {
      const nearRegex = /^[a-z0-9_\-.]*$/;
      if (!nearRegex.test(encodedAddress)) {
        throw new Error('NEAR address is not valid');
      }
    } else if (chain.base === ChainBase.Solana) {
      const key = new PublicKey(encodedAddress);
      if (key.toBase58() !== encodedAddress) {
        throw new Error(`Solana address is not valid: ${key.toBase58()}`);
      }
    }
  } catch (e) {
    log.info(`Invalid address passed: ${encodedAddress}: ${e.message}`);
    return next(new Error(Errors.InvalidAddress));
  }

  const existingAddress = await models.Address.scope('withPrivateData').findOne(
    {
      where: { chain: req.body.chain, address: encodedAddress },
    }
  );

  if (existingAddress) {
    // address already exists on another user, only take ownership if
    // unverified and expired
    const expiration = existingAddress.verification_token_expires;
    const isExpired = expiration && +expiration <= +new Date();
    const isDisowned = existingAddress.user_id == null;
    const isCurrUser = req.user && existingAddress.user_id === req.user.id;
    // if owned by someone else, generate a token but don't replace user until verification
    // if you own it, or if it's unverified, associate with address immediately
    const updatedId =
      req.user &&
      ((!existingAddress.verified && isExpired) || isDisowned || isCurrUser)
        ? req.user.id
        : null;

    // Address.updateWithToken
    const verification_token = crypto.randomBytes(18).toString('hex');
    const verification_token_expires = new Date(
      +new Date() + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000
    );
    if (updatedId) {
      existingAddress.user_id = updatedId;
    }
    existingAddress.keytype = req.body.keytype;
    existingAddress.verification_token = verification_token;
    existingAddress.verification_token_expires = verification_token_expires;
    existingAddress.last_active = new Date();

    // we update addresses with the wallet used to sign in
    existingAddress.wallet_id = req.body.wallet_id;

    const updatedObj = await existingAddress.save();

    // even if this is the existing address, there is a case to login to community through this address's chain
    // if req.body.community is valid, then we should create a role between this community vs address
    if (req.body.community) {
      const role = await models.Role.findOne({
        where: { address_id: updatedObj.id, chain_id: req.body.community },
      });
      if (!role) {
        await models.Role.create({
          address_id: updatedObj.id,
          chain_id: req.body.community,
          permission: 'member',
        });
      }
    }
    return success(res, updatedObj.toJSON());
  } else {
    // address doesn't exist, add it to the database
    try {
      // Address.createWithToken
      const verification_token = crypto.randomBytes(18).toString('hex');
      const verification_token_expires = new Date(
        +new Date() + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000
      );
      const last_active = new Date();
      let profile_id: number;
      const user_id = req.user ? req.user.id : null;
      if (user_id) {
        const profile = await models.Profile.findOne({
          attributes: ['id'],
          where: { is_default: true, user_id },
        });
        profile_id = profile?.id;
      }
      const newObj = await models.Address.create({
        user_id,
        profile_id,
        chain: req.body.chain,
        address: encodedAddress,
        verification_token,
        verification_token_expires,
        keytype: req.body.keytype,
        last_active,
        wallet_id: req.body.wallet_id,
      });

      // if req.user.id is undefined, the address is being used to create a new user,
      // and we should automatically give it a Role in its native chain (or community)
      if (!req.user) {
        await models.Role.create({
          address_id: newObj.id,
          chain_id: req.body.chain,
          permission: 'member',
        });
      }

      if (process.env.NODE_ENV === 'production') {
        mixpanelTrack({
          event: MixpanelUserSignupEvent.NEW_USER_SIGNUP,
          chain: req.body.chain,
          isCustomDomain: null,
        });
      }

      return success(res, newObj.toJSON());
    } catch (e) {
      return next(e);
    }
  }
};

export default createAddress;
