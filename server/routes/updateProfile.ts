import { Request, Response, NextFunction } from 'express';
import Sequelize from 'sequelize';
import {
  PROFILE_BIO_MAX_CHARS,
  PROFILE_HEADLINE_MAX_CHARS,
  PROFILE_NAME_MAX_CHARS,
  PROFILE_NAME_MIN_CHARS,
  ChainBase,
} from '../../shared/types';
import IdentityFetchCache from '../util/identityFetchCache';
import { DB } from '../database';
import validateChain from '../util/validateChain';

export const Errors = {
  MissingParams: 'Must specify chain, address, and data',
  NotBlob: 'Data must be a valid JSON blob',
  InvalidProfile: 'Invalid profile, or profile owned by someone else',
  NoName: 'Must provide a name',
  NameTooShort: `Name must be at least ${PROFILE_NAME_MIN_CHARS} characters`,
  NameTooLong: `Name must be less than ${PROFILE_NAME_MAX_CHARS} characters`,
  HeadlineTooLong: `Headline must be less than ${PROFILE_HEADLINE_MAX_CHARS} characters`,
  BioTooLong: `Bio must be less than ${PROFILE_BIO_MAX_CHARS} characters`,
};

const updateProfile = async (
  models: DB, identityFetchCache: IdentityFetchCache, req: Request, res: Response, next: NextFunction
) => {
  if (!req.body.chain || !req.body.address || !req.body.data) {
    return next(new Error(Errors.MissingParams));
  }
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));

  let unpackedData;
  try {
    unpackedData = JSON.parse(req.body.data);
  } catch (e) {
    return next(new Error(Errors.NotBlob));
  }
  const address = await models.Address.findOne({
    where: {
      chain: req.body.chain,
      address: req.body.address,
    },
  });

  if (!address || !address.id) {
    return next(new Error(Errors.InvalidProfile));
  }
  if (address.user_id !== req.user.id) {
    return next(new Error(Errors.InvalidProfile));
  }

  // enforce required fields
  if (!unpackedData.name) {
    return next(new Error(Errors.NoName));
  } else if (unpackedData.name.length < PROFILE_NAME_MIN_CHARS) {
    return next(new Error(Errors.NameTooShort));
  }

  // enforce max chars
  if (unpackedData.name && unpackedData.name.length > PROFILE_NAME_MAX_CHARS) {
    return next(new Error(Errors.NameTooLong));
  } else if (unpackedData.headline && unpackedData.headline.length > PROFILE_HEADLINE_MAX_CHARS) {
    return next(new Error(Errors.HeadlineTooLong));
  } else if (unpackedData.bio && unpackedData.bio.length > PROFILE_BIO_MAX_CHARS) {
    return next(new Error(Errors.BioTooLong));
  }

  // try to find existing profile
  let profile = await models.OffchainProfile.findOne({
    where: {
      address_id: address.id,
    }
  });

  if (!profile) {
    profile = await models.OffchainProfile.create({
      address_id: address.id,
      data: req.body.data,
    });
  } else {
    profile.data = req.body.data;
    profile.save();
  }

  if (unpackedData.name) {
    await models.Address.update({
      name: unpackedData.name
    }, {
      where: {
        id: address.id,
      }
    });
  }

  // new profiles on substrate chains get added to the identity cache
  // to be fetched by chain-event nodes or on a timer job
  if (!req.body.skipChainFetch && chain.base === ChainBase.Substrate) {
    await identityFetchCache.add(req.body.chain, req.body.address);
  }

  return res.json({ status: 'Success', result: { profile, updatedProfileAddress: address } });
};

export default updateProfile;
