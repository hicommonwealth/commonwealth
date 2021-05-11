import { Request, Response, NextFunction } from 'express';
import Sequelize from 'sequelize';
import crypto from 'crypto';
import TokenBalanceCache from '../util/tokenBalanceCache';
import { createChainForAddress } from '../util/createTokenChain';
import { ADDRESS_TOKEN_EXPIRES_IN } from '../config';
import { INewChainInfo } from '../../shared/types';

import { factory, formatFilename } from '../../shared/logging';
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
  models,
  tokenBalanceCache: TokenBalanceCache,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.address) {
    return next(new Error(Errors.NeedAddress));
  }
  if (!req.body.chain) {
    return next(new Error(Errors.NeedChain));
  }
  if (!req.body.originChain) {
    return next(new Error(Errors.NeedOriginChain));
  }
  if (!req.user?.id) {
    return next(new Error(Errors.NeedLoggedIn));
  }
  const userId = req.user.id;

  let chain, error;
  if (req.body.isNewChain) {
    const newChainInfo: INewChainInfo = {
      address: req.body['newChainInfo[address]'],
      iconUrl: req.body['newChainInfo[iconUrl]'],
      name: req.body['newChainInfo[name]'],
      symbol: req.body['newChainInfo[symbol]'],
    };
    [chain, error] = await createChainForAddress(models, tokenBalanceCache, newChainInfo);
  }

  if (!chain) {
    chain = await models.Chain.findOne({
      where: { id: req.body.chain }
    });
  }

  if (!chain) {
    return next(new Error(Errors.InvalidChain));
  }

  // check if the original address is verified and is owned by the user
  const originalAddress = await models.Address.scope('withPrivateData').findOne({
    where: { chain: req.body.originChain, address: req.body.address, user_id: userId, verified: { [Op.ne]: null } }
  });

  if (!originalAddress) {
    return next(new Error(Errors.NotVerifiedAddressOrUser));
  }

  // check if the original address's token is expired. refer edge case 1)
  let verificationToken = originalAddress.verification_token;
  let verificationTokenExpires = originalAddress.verification_token_expires;
  const isOriginalTokenValid = verificationTokenExpires && +verificationTokenExpires <= +(new Date());

  if (!isOriginalTokenValid) {
    const chains = await models.Chain.findAll({
      where: { base: chain.base }
    });

    verificationToken = crypto.randomBytes(18).toString('hex');
    verificationTokenExpires = new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000);

    await models.Address.update({
      verification_token: verificationToken,
      verification_token_expires: verificationTokenExpires
    }, {
      where: {
        user_id: originalAddress.user_id,
        address: req.body.address,
        chain: { [Op.in]: chains.map((ch) => ch.id) }
      }
    });
  }

  const existingAddress = await models.Address.scope('withPrivateData').findOne({
    where: { chain: chain.id, address: req.body.address }
  });

  try {
    let addressId;
    if (existingAddress) {
      // refer edge case 2)
      // either if the existing address is owned by someone else or this user,
      //   we can just update with userId. this covers both edge case (1) & (2)
      const updatedObj = await models.Address.updateWithTokenProvided(
        existingAddress,
        userId,
        req.body.keytype,
        verificationToken,
        verificationTokenExpires
      );
      addressId = updatedObj.id;
    } else {
      const newObj = await models.Address.create({
        user_id: originalAddress.user_id,
        address: originalAddress.address,
        chain: chain.id,
        verification_token: verificationToken,
        verification_token_expires: verificationTokenExpires,
        verified: originalAddress.verified,
        keytype: originalAddress.keytype,
        name: originalAddress.name,
        last_active: new Date(),
      });

      addressId = newObj.id;
    }

    const ownedAddresses = await models.Address.findAll({
      where: { user_id: originalAddress.user_id }
    });

    const role = await models.Role.findOne({
      where: {
        address_id: addressId,
        ...(req.body.community
          ? { offchain_community_id: req.body.community }
          : { chain_id: req.body.chain }),
      }
    });

    if (!role) {
      await models.Role.create(req.body.community ? {
        address_id: addressId,
        offchain_community_id: req.body.community,
        permission: 'member',
      } : {
        address_id: addressId,
        chain_id: (!req.body.isNewChain) ? req.body.chain : chain.id,
        permission: 'member',
      });
    }

    return res.json({
      status: 'Success',
      result: {
        verification_token: verificationToken,
        addressId,
        addresses: ownedAddresses.map((a) => a.toJSON()),
      }
    });
  } catch (e) {
    log.error(e.message);
    return next(e);
  }
};

export default linkExistingAddressToChain;
