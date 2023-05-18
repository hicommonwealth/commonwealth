import crypto from 'crypto';
import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { bech32 } from 'bech32';
import type { NextFunction } from 'express';
import { AppError } from 'common-common/src/errors';
import { ADDRESS_TOKEN_EXPIRES_IN } from '../config';
import { createRole, findOneRole } from './roles';
import { mixpanelTrack } from './mixpanelUtil';
import { MixpanelUserSignupEvent } from '../../shared/analytics/types';
import type { UserInstance } from '../models/user';
import type { DB } from '../models';
import { addressSwapper } from '../../shared/utils';
import { Errors } from '../routes/createAddress';

type CreateAddressReq = {
  address: string;
  chain: string;
  wallet_id: WalletId;
  community?: string;
  keytype?: string;
  block_info?: string;
};

// Creates address and performs all necessary checks
export async function createAddressHelper(
  req: CreateAddressReq,
  models: DB,
  user: Express.User & UserInstance,
  next: NextFunction
) {
  // start the process of creating a new address. this may be called
  // when logged in to link a new address for an existing user, or
  // when logged out to create a new user by showing proof of an address.
  if (!req.address) {
    return next(new AppError(Errors.NeedAddress));
  }
  if (!req.chain) {
    return next(new AppError(Errors.NeedChain));
  }
  if (!req.wallet_id || !Object.values(WalletId).includes(req.wallet_id)) {
    return next(new AppError(Errors.NeedWallet));
  }
  if (req.chain == 'injective') {
    if (req.address.slice(0, 3) !== 'inj')
      return next(new AppError('Must join with Injective address'));
  } else if (req.address.slice(0, 3) === 'inj') {
    return next(new AppError('Cannot join with an injective address'));
  }

  const chain = await models.Community.findOne({
    where: { id: req.chain },
  });

  if (!chain || chain.network === ChainNetwork.AxieInfinity) {
    return next(new AppError(Errors.InvalidChain));
  }

  // test / convert address as needed
  let encodedAddress = (req.address as string).trim();
  try {
    if (chain.base === ChainBase.Substrate) {
      encodedAddress = addressSwapper({
        address: req.address,
        currentPrefix: chain.ss58_prefix,
      });
    } else if (chain.bech32_prefix) {
      // cosmos or injective
      const { words } = bech32.decode(req.address, 50);
      encodedAddress = bech32.encode(chain.bech32_prefix, words);
    } else if (chain.base === ChainBase.Ethereum) {
      const Web3 = (await import('web3-utils')).default;
      if (!Web3.isAddress(encodedAddress)) {
        throw new AppError('Eth address is not valid');
      }
    } else if (chain.base === ChainBase.NEAR) {
      const nearRegex = /^[a-z0-9_\-.]*$/;
      if (!nearRegex.test(encodedAddress)) {
        throw new AppError('NEAR address is not valid');
      }
    } else if (chain.base === ChainBase.Solana) {
      const { PublicKey } = await import('@solana/web3.js');
      const key = new PublicKey(encodedAddress);
      if (key.toBase58() !== encodedAddress) {
        throw new AppError(`Solana address is not valid: ${key.toBase58()}`);
      }
    }
  } catch (e) {
    return next(new AppError(Errors.InvalidAddress));
  }

  const existingAddress = await models.Address.scope('withPrivateData').findOne(
    {
      where: { chain: req.chain, address: encodedAddress },
    }
  );

  if (existingAddress) {
    // address already exists on another user, only take ownership if
    // unverified and expired
    const expiration = existingAddress.verification_token_expires;
    const isExpired = expiration && +expiration <= +new Date();
    const isDisowned = existingAddress.user_id == null;
    const isCurrUser = user && existingAddress.user_id === user.id;
    // if owned by someone else, generate a token but don't replace user until verification
    // if you own it, or if it's unverified, associate with address immediately
    const updatedId =
      user &&
      ((!existingAddress.verified && isExpired) || isDisowned || isCurrUser)
        ? user.id
        : null;

    // Address.updateWithToken
    const verification_token = crypto.randomBytes(18).toString('hex');
    const verification_token_expires = new Date(
      +new Date() + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000
    );
    if (updatedId) {
      existingAddress.user_id = updatedId;
      const profileId = await models.Profile.findOne({
        where: { user_id: updatedId },
      });
      existingAddress.profile_id = profileId?.id;
    }
    existingAddress.keytype = req.keytype;
    existingAddress.verification_token = verification_token;
    existingAddress.verification_token_expires = verification_token_expires;
    existingAddress.last_active = new Date();
    existingAddress.block_info = req.block_info;

    // we update addresses with the wallet used to sign in
    existingAddress.wallet_id = req.wallet_id;

    const updatedObj = await existingAddress.save();

    // even if this is the existing address, there is a case to login to community through this address's chain
    // if community is valid, then we should create a role between this community vs address
    if (req.community) {
      const role = await findOneRole(
        models,
        { where: { address_id: updatedObj.id } },
        req.community
      );
      if (!role) {
        await createRole(models, updatedObj.id, req.community, 'member');
      }
    }
    return { ...updatedObj.toJSON(), newly_created: false };
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
      const user_id = user ? user.id : null;

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
        chain: req.chain,
        address: encodedAddress,
        verification_token,
        verification_token_expires,
        block_info: req.block_info,
        keytype: req.keytype,
        last_active,
        wallet_id: req.wallet_id,
      });

      // if user.id is undefined, the address is being used to create a new user,
      // and we should automatically give it a Role in its native chain (or community)
      if (!user) {
        await createRole(models, newObj.id, req.chain, 'member');
      }

      if (process.env.NODE_ENV !== 'test') {
        mixpanelTrack({
          event: MixpanelUserSignupEvent.NEW_USER_SIGNUP,
          chain: req.chain,
          isCustomDomain: null,
        });
      }
      return { ...newObj.toJSON(), newly_created: true };
    } catch (e) {
      return next(e);
    }
  }
}
