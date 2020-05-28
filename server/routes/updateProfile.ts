import { Request, Response, NextFunction } from 'express';
import {
  PROFILE_BIO_MAX_CHARS,
  PROFILE_HEADLINE_MAX_CHARS,
  PROFILE_NAME_MAX_CHARS,
  PROFILE_NAME_MIN_CHARS
} from '../../shared/types';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const updateProfile = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.chain || !req.body.address || !req.body.data) {
    return next(new Error('Must specify chain, address, and data'));
  }

  let unpackedData;
  try {
    unpackedData = JSON.parse(req.body.data);
  } catch (e) {
    return next(new Error('Data must be a valid JSON blob'));
  }

  const address = await models.Address.find({
    where: {
      chain: req.body.chain,
      address: req.body.address,
    }
  });
  if (!address || !address.id) {
    return next(new Error('Invalid profile, or profile owned by someone else'));
  }
  if (address.user_id !== req.user.id) {
    return next(new Error('Invalid profile, or profile owned by someone else'));
  }

  // enforce required fields
  if (!unpackedData.name) {
    return next(new Error('A name is required.'));
  } else if (unpackedData.name.length < PROFILE_NAME_MIN_CHARS) {
    return next(new Error(`Your name must be at least ${PROFILE_NAME_MIN_CHARS} characters.`));
  }

  // enforce max chars
  if (unpackedData.name && unpackedData.name.length > PROFILE_NAME_MAX_CHARS) {
    return next(new Error(`Your name can't be over ${PROFILE_NAME_MAX_CHARS} characters.`));
  } else if (unpackedData.headline && unpackedData.headline.length > PROFILE_HEADLINE_MAX_CHARS) {
    return next(new Error(`Your headline can't be over ${PROFILE_HEADLINE_MAX_CHARS} characters.`));
  } else if (unpackedData.bio && unpackedData.bio.length > PROFILE_BIO_MAX_CHARS) {
    return next(new Error(`Your bio can't be over ${PROFILE_BIO_MAX_CHARS} characters.`));
  }

  // try to find existing profile
  let profile = await models.OffchainProfile.findOne({
    where: {
      address_id: address.id,
    }
  });

  if (unpackedData.name) {
    address.name = unpackedData.name;
    await address.save();
  }

  // create if exists, update otherwise
  if (profile) {
    profile = await profile.update({
      data: req.body.data,
    });
  } else {
    profile = await models.OffchainProfile.create({
      address_id: address.id,
      data: req.body.data,
    });
  }

  return res.json({ status: 'Success', result: profile.toJSON() });
};

export default updateProfile;
