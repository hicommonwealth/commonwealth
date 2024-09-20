import { AppError } from '@hicommonwealth/core';
import { DB, incrementProfileCount } from '@hicommonwealth/model';
import { ChainBase, addressSwapper } from '@hicommonwealth/shared';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import Sequelize from 'sequelize';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';
import { bech32ToHex } from '../../shared/utils';
import { config } from '../config';
import { ServerAnalyticsController } from '../controllers/server_analytics_controller';
import assertAddressOwnership from '../util/assertAddressOwnership';
import { ExtendedAddessInstance } from './getNewProfile';

const { Op } = Sequelize;

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedLoggedIn: 'Must be signed in',
  NotVerifiedAddressOrUser: 'Not verified address or user',
};

const linkExistingAddressToCommunity = async (
  models: DB,
  req: Request,
  res: Response,
) => {
  // @ts-expect-error StrictNullChecks
  const userId = req.user.id;
  const { community_id } = req.body;

  if (!req.body.address) {
    throw new AppError(Errors.NeedAddress);
  }
  if (!req.user?.id) {
    throw new AppError(Errors.NeedLoggedIn);
  }
  if (community_id == 'injective') {
    if (req.body.address.slice(0, 3) !== 'inj')
      throw new AppError('Must join with Injective address');
  } else if (req.body.address.slice(0, 3) === 'inj') {
    throw new AppError('Cannot join with an injective address');
  }

  const community = await models.Community.findOne({
    where: { id: req.body.community_id },
  });

  // check if the original address is verified and is owned by the user
  const originalAddress = await models.Address.scope('withPrivateData').findOne(
    {
      where: {
        address: req.body.address,
        user_id: userId,
        verified: { [Op.ne]: null },
      },
    },
  );

  if (!originalAddress) {
    throw new AppError(Errors.NotVerifiedAddressOrUser);
  }

  // check if the original address's token is expired. refer edge case 1)
  let verificationToken = originalAddress.verification_token;
  let verificationTokenExpires = originalAddress.verification_token_expires;
  const isOriginalTokenValid =
    verificationTokenExpires && +verificationTokenExpires <= +new Date();

  if (!isOriginalTokenValid) {
    const communities = await models.Community.findAll({
      // @ts-expect-error StrictNullChecks
      where: { base: community.base },
    });

    verificationToken = crypto.randomBytes(18).toString('hex');
    verificationTokenExpires = new Date(
      +new Date() + config.AUTH.ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000,
    );

    await models.Address.update(
      {
        verification_token: verificationToken,
        verification_token_expires: verificationTokenExpires,
      },
      {
        where: {
          user_id: originalAddress.user_id,
          address: req.body.address,
          community_id: { [Op.in]: communities.map((ch) => ch.id) },
        },
      },
    );
  }

  const encodedAddress =
    // @ts-expect-error StrictNullChecks
    community.base === ChainBase.Substrate
      ? addressSwapper({
          address: req.body.address,
          // @ts-expect-error StrictNullChecks
          currentPrefix: community.ss58_prefix,
        })
      : req.body.address;

  const existingAddress = await models.Address.scope('withPrivateData').findOne(
    {
      // @ts-expect-error StrictNullChecks
      where: { community_id: community.id, address: encodedAddress },
    },
  );

  let hex;
  // @ts-expect-error StrictNullChecks
  if (community.base === ChainBase.CosmosSDK) {
    hex = await bech32ToHex(req.body.address);
  }

  let addressId = -1;
  if (existingAddress) {
    // refer edge case 2)
    // either if the existing address is owned by someone else or this user,
    //   we can just update with userId. this covers both edge case (1) & (2)
    // Address.updateWithTokenProvided
    await models.sequelize.transaction(async (transaction) => {
      if (!existingAddress.verified) {
        await incrementProfileCount(
          models,
          community!.id!,
          originalAddress.user_id!,
          transaction,
        );
      }

      const updatedObj = await models.Address.update(
        {
          user_id: userId,
          verification_token: verificationToken,
          verification_token_expires: verificationTokenExpires,
          last_active: new Date(),
          verified: originalAddress.verified,
          hex,
        },
        { where: { id: existingAddress.id }, transaction, returning: true },
      );
      addressId = updatedObj[1][0].id!;
    });
  } else {
    const newObj = await models.sequelize.transaction(async (transaction) => {
      await incrementProfileCount(
        models,
        community!.id!,
        originalAddress.user_id!,
        transaction,
      );

      return await models.Address.create(
        {
          user_id: originalAddress.user_id!,
          address: encodedAddress,
          community_id: community!.id!,
          hex,
          verification_token: verificationToken,
          verification_token_expires: verificationTokenExpires,
          verified: originalAddress.verified,
          wallet_id: originalAddress.wallet_id,
          last_active: new Date(),
          role: 'member',
          is_user_default: false,
          ghost_address: false,
          is_banned: false,
        },
        { transaction },
      );
    });

    // @ts-expect-error StrictNullChecks
    addressId = newObj.id;
  }

  // assertion check
  await assertAddressOwnership(models, encodedAddress);

  const ownedAddresses = await models.Address.findAll({
    where: { user_id: originalAddress.user_id },
    include: {
      model: models.Community,
      attributes: ['id', 'base', 'ss58_prefix'],
    },
  });

  const serverAnalyticsController = new ServerAnalyticsController();
  serverAnalyticsController.track(
    {
      community: community,
      userId: req.user.id,
      event: MixpanelCommunityInteractionEvent.JOIN_COMMUNITY,
    },
    req,
  );

  return res.json({
    status: 'Success',
    result: {
      verification_token: verificationToken,
      addressId,
      addresses: ownedAddresses.map(
        (a) => a.toJSON() as ExtendedAddessInstance,
      ),
      encodedAddress,
    },
  });
};

export default linkExistingAddressToCommunity;
