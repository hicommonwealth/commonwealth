import { AppError, ChainBase } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import Sequelize from 'sequelize';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';
import { addressSwapper, bech32ToHex } from '../../shared/utils';
import { ADDRESS_TOKEN_EXPIRES_IN } from '../config';
import { ServerAnalyticsController } from '../controllers/server_analytics_controller';
import assertAddressOwnership from '../util/assertAddressOwnership';
import { createRole, findOneRole } from '../util/roles';

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
      where: { base: community.base },
    });

    verificationToken = crypto.randomBytes(18).toString('hex');
    verificationTokenExpires = new Date(
      +new Date() + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000,
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
    community.base === ChainBase.Substrate
      ? addressSwapper({
          address: req.body.address,
          currentPrefix: community.ss58_prefix,
        })
      : req.body.address;

  const existingAddress = await models.Address.scope('withPrivateData').findOne(
    {
      where: { community_id: community.id, address: encodedAddress },
    },
  );

  let hex;
  if (community.base === ChainBase.CosmosSDK) {
    hex = await bech32ToHex(req.body.address);
  }

  let addressId: number;
  if (existingAddress) {
    // refer edge case 2)
    // either if the existing address is owned by someone else or this user,
    //   we can just update with userId. this covers both edge case (1) & (2)
    // Address.updateWithTokenProvided
    existingAddress.user_id = userId;
    const profileId = await models.Profile.findOne({
      where: { user_id: userId },
    });
    existingAddress.profile_id = profileId?.id;
    existingAddress.keytype = req.body.keytype;
    existingAddress.verification_token = verificationToken;
    existingAddress.verification_token_expires = verificationTokenExpires;
    existingAddress.last_active = new Date();
    existingAddress.verified = originalAddress.verified;
    existingAddress.hex = hex;
    const updatedObj = await existingAddress.save();
    addressId = updatedObj.id;
  } else {
    const newObj = await models.Address.create({
      user_id: originalAddress.user_id,
      profile_id: originalAddress.profile_id,
      address: encodedAddress,
      community_id: community.id,
      hex,
      verification_token: verificationToken,
      verification_token_expires: verificationTokenExpires,
      verified: originalAddress.verified,
      keytype: originalAddress.keytype,
      wallet_id: originalAddress.wallet_id,
      wallet_sso_source: originalAddress.wallet_sso_source,
      last_active: new Date(),
    });

    addressId = newObj.id;
  }

  // assertion check
  await assertAddressOwnership(models, encodedAddress);

  const ownedAddresses = await models.Address.findAll({
    where: { user_id: originalAddress.user_id },
  });

  const role = await findOneRole(
    models,
    { where: { address_id: addressId } },
    community.id,
  );

  if (!role) {
    await createRole(models, addressId, community.id, 'member');
  }

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
      addresses: ownedAddresses.map((a) => a.toJSON()),
      encodedAddress,
    },
  });
};

export default linkExistingAddressToCommunity;
