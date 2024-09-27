import { AppError } from '@hicommonwealth/core';
import type { AddressAttributes, DB } from '@hicommonwealth/model';
import { AddressInstance } from '@hicommonwealth/model';
import {
  ChainBase,
  WalletId,
  addressSwapper,
  bech32ToHex,
} from '@hicommonwealth/shared';
import { bech32 } from 'bech32';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { MixpanelUserSignupEvent } from '../../shared/analytics/types';
import { config } from '../config';
import { ServerAnalyticsController } from '../controllers/server_analytics_controller';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedCommunity: 'Must provide community',
  NeedWallet: 'Must provide valid walletId',
  InvalidCommunity: 'Invalid community',
  InvalidAddress: 'Invalid address',
};

export type CreateAddressReq = {
  address: string;
  community_id?: string;
  wallet_id: WalletId;
  block_info?: string;
};

type CreateAddressResp = AddressAttributes & {
  newly_created: boolean;
  joined_community: boolean;
};

const createAddress = async (
  models: DB,
  req: TypedRequestBody<CreateAddressReq>,
  res: TypedResponse<CreateAddressResp>,
) => {
  const user = req.user;

  // start the process of creating a new address. this may be called
  // when logged in to link a new address for an existing user, or
  // when logged out to create a new user by showing proof of an address.
  if (!req.body.address) {
    throw new AppError(Errors.NeedAddress);
  }
  if (!req.body.community_id) {
    throw new AppError(Errors.NeedCommunity);
  }
  if (
    !req.body.wallet_id ||
    !Object.values(WalletId).includes(req.body.wallet_id)
  ) {
    throw new AppError(Errors.NeedWallet);
  }
  if (req.body.community_id == 'injective') {
    if (req.body.address.slice(0, 3) !== 'inj')
      throw new AppError('Must join with Injective address');
  } else if (req.body.address.slice(0, 3) === 'inj') {
    throw new AppError('Cannot join with an injective address');
  }

  const serverAnalyticsController = new ServerAnalyticsController();

  const community = await models.Community.findOne({
    where: { id: req.body.community_id },
  });

  if (!community) {
    throw new AppError(Errors.InvalidCommunity);
  }

  // test / convert address as needed
  let encodedAddress = (req.body.address as string).trim();
  let addressHex: string | undefined;
  let existingAddressWithHex: AddressInstance;
  try {
    if (community.base === ChainBase.Substrate) {
      encodedAddress = addressSwapper({
        address: req.body.address,
        // @ts-expect-error StrictNullChecks
        currentPrefix: community.ss58_prefix,
      });
    } else if (community.bech32_prefix) {
      // cosmos or injective
      const { words } = bech32.decode(req.body.address, 50);
      encodedAddress = bech32.encode(community.bech32_prefix, words);
      addressHex = bech32ToHex(req.body.address);

      // check all addresses for matching hex
      const existingHexes = await models.Address.scope(
        'withPrivateData',
      ).findAll({
        where: { hex: addressHex, verified: { [Op.ne]: null } },
      });
      const existingHexesSorted = existingHexes.sort((a, b) => {
        // sort by latest last_active
        return +b.dataValues.last_active! - +a.dataValues.last_active!;
      });

      // use the latest active address with this hex to assign profile
      existingAddressWithHex = existingHexesSorted?.[0];
    } else if (community.base === ChainBase.Ethereum) {
      const { isAddress } = await import('web3-validator');
      if (!isAddress(encodedAddress)) {
        throw new AppError('Eth address is not valid');
      }
    } else if (community.base === ChainBase.NEAR) {
      throw new AppError('NEAR login not supported');
    } else if (community.base === ChainBase.Solana) {
      const { PublicKey } = await import('@solana/web3.js');
      const key = new PublicKey(encodedAddress);
      if (key.toBase58() !== encodedAddress) {
        throw new AppError(`Solana address is not valid: ${key.toBase58()}`);
      }
    }
  } catch (e) {
    throw new AppError(Errors.InvalidAddress);
  }
  const existingAddress = await models.Address.scope('withPrivateData').findOne(
    {
      where: { community_id: req.body.community_id, address: encodedAddress },
    },
  );

  const addressExistsOnOtherCommunity =
    // @ts-expect-error StrictNullChecks
    !!existingAddressWithHex ||
    (await models.Address.scope('withPrivateData').findOne({
      where: {
        community_id: { [Op.ne]: req.body.community_id },
        address: encodedAddress,
      },
    }));

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
      +new Date() + config.AUTH.ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000,
    );
    if (updatedId) {
      existingAddress.user_id = updatedId;
    }
    existingAddress.verification_token = verification_token;
    existingAddress.verification_token_expires = verification_token_expires;
    existingAddress.last_active = new Date();
    existingAddress.block_info = req.body.block_info;

    existingAddress.hex = addressHex;

    // we update addresses with the wallet used to sign in
    existingAddress.wallet_id = req.body.wallet_id;

    const updatedObj = await existingAddress.save();

    return success(res, {
      ...updatedObj.toJSON(),
      newly_created: false,
      joined_community: false,
    });
  } else {
    // address doesn't exist, add it to the database
    // Address.createWithToken
    const verification_token = crypto.randomBytes(18).toString('hex');
    const verification_token_expires = new Date(
      +new Date() + config.AUTH.ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000,
    );
    const last_active = new Date();
    let user_id = user ? user.id : null;

    // @ts-expect-error StrictNullChecks
    if (existingAddressWithHex) {
      user_id = existingAddressWithHex.user_id;
    }

    const newObj = await models.sequelize.transaction(async (transaction) => {
      return models.Address.create(
        {
          user_id,
          community_id: req.body.community_id!,
          address: encodedAddress,
          hex: addressHex,
          verification_token,
          verification_token_expires,
          block_info: req.body.block_info,
          last_active,
          wallet_id: req.body.wallet_id,
          role: 'member',
          is_user_default: false,
          ghost_address: false,
          is_banned: false,
        },
        { transaction },
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    serverAnalyticsController.track(
      {
        event: MixpanelUserSignupEvent.NEW_USER_SIGNUP,
        community_id: req.body.community_id,
      },
      req,
    );

    return success(res, {
      ...newObj.toJSON(),
      newly_created: !addressExistsOnOtherCommunity,
      joined_community: !!user,
    });
  }
};

export default createAddress;
