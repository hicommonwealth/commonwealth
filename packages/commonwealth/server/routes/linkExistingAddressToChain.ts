import { AppError } from 'common-common/src/errors';
import { ChainBase } from 'common-common/src/types';
import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import Sequelize from 'sequelize';
import { addressSwapper } from '../../shared/utils';
import { ADDRESS_TOKEN_EXPIRES_IN } from '../config';
import type { DB } from '../models';
import { createRole, findOneRole } from '../util/roles';
import { factory, formatFilename } from 'common-common/src/logging';
import assertAddressOwnership from '../util/assertAddressOwnership';

const log = factory.getLogger(formatFilename(__filename));

const { Op } = Sequelize;

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedChain: 'Must provide chain',
  NeedOriginChain: 'Must provide original chain',
  NeedLoggedIn: 'Must be logged in',
  NotVerifiedAddressOrUser: 'Not verified address or user',
  InvalidChain: 'Invalid chain',
};

const linkExistingAddressToChain = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.address) {
    return next(new AppError(Errors.NeedAddress));
  }
  if (!req.body.chain) {
    return next(new AppError(Errors.NeedChain));
  }
  if (!req.body.originChain) {
    return next(new AppError(Errors.NeedOriginChain));
  }
  if (!req.user?.id) {
    return next(new AppError(Errors.NeedLoggedIn));
  }
  const userId = req.user.id;

  const chain = await models.Chain.findOne({
    where: { id: req.body.chain },
  });

  if (!chain) {
    return next(new AppError(Errors.InvalidChain));
  }

  // check if the original address is verified and is owned by the user
  const originalAddress = await models.Address.scope('withPrivateData').findOne(
    {
      where: {
        address: req.body.address,
        user_id: userId,
        verified: { [Op.ne]: null },
      },
    }
  );

  if (!originalAddress) {
    return next(new AppError(Errors.NotVerifiedAddressOrUser));
  }

  // check if the original address's token is expired. refer edge case 1)
  let verificationToken = originalAddress.verification_token;
  let verificationTokenExpires = originalAddress.verification_token_expires;
  const isOriginalTokenValid =
    verificationTokenExpires && +verificationTokenExpires <= +new Date();

  if (!isOriginalTokenValid) {
    const chains = await models.Chain.findAll({
      where: { base: chain.base },
    });

    verificationToken = crypto.randomBytes(18).toString('hex');
    verificationTokenExpires = new Date(
      +new Date() + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000
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
          chain: { [Op.in]: chains.map((ch) => ch.id) },
        },
      }
    );
  }

  try {
    const encodedAddress =
      chain.base === ChainBase.Substrate
        ? addressSwapper({
            address: req.body.address,
            currentPrefix: chain.ss58_prefix,
          })
        : req.body.address;

    const existingAddress = await models.Address.scope(
      'withPrivateData'
    ).findOne({
      where: { chain: req.body.chain, address: encodedAddress },
    });

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
      existingAddress.name = originalAddress.name;
      const updatedObj = await existingAddress.save();
      addressId = updatedObj.id;
    } else {
      const newObj = await models.Address.create({
        user_id: originalAddress.user_id,
        profile_id: originalAddress.profile_id,
        address: encodedAddress,
        chain: req.body.chain,
        verification_token: verificationToken,
        verification_token_expires: verificationTokenExpires,
        verified: originalAddress.verified,
        keytype: originalAddress.keytype,
        name: originalAddress.name,
        wallet_id: originalAddress.wallet_id,
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
      req.body.chain
    );

    if (!role) {
      await createRole(models, addressId, req.body.chain, 'member');
    }

    return res.json({
      status: 'Success',
      result: {
        verification_token: verificationToken,
        addressId,
        addresses: ownedAddresses.map((a) => a.toJSON()),
        encodedAddress,
      },
    });
  } catch (e) {
    log.error(e.message);
    return next(e);
  }
};

export default linkExistingAddressToChain;
