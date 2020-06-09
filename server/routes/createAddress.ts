import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const createAddress = async (models, req: Request, res: Response, next: NextFunction) => {
  // start the process of creating a new address. this may be called
  // when logged in to link a new address for an existing user, or
  // when logged out to create a new user by showing proof of an address.
  if (!req.body.address) {
    return next(new Error('Must provide address'));
  }
  if (!req.body.chain) {
    return next(new Error('Must provide chain'));
  }
  const chain = await models.Chain.findOne({
    where: { id: req.body.chain }
  });
  if (!chain) {
    return next(new Error('Invalid chain'));
  }

  const existingAddress = await models.Address.findOne({
    where: { chain: req.body.chain, address: req.body.address }
  });
  if (existingAddress) {
    // address already exists on another user, only take ownership if
    // unverified and expired
    const expiration = existingAddress.verification_token_expires;
    const isExpired = expiration && +expiration <= +(new Date());
    const isDisowned = existingAddress.user_id == null;
    const isCurrUser = req.user && (existingAddress.user_id === req.user.id);
    // if owned by someone else, generate a token but don't replace user until verification
    // if you own it, or if it's unverified, associate with address immediately
    const updatedId = (req.user && ((!existingAddress.verified && isExpired) || isDisowned || isCurrUser)) ?
      req.user.id : null;
    const updatedObj = await models.Address.updateWithToken(existingAddress, updatedId, req.body.keytype);
    return res.json({ status: 'Success', result: updatedObj.toJSON() });
  } else {
    // address doesn't exist, add it to the database
    try {
      const newObj = await models.Address.createWithToken(
        req.user ? req.user.id : null,
        req.body.chain,
        req.body.address,
        req.body.keytype
      );
      return res.json({ status: 'Success', result: newObj.toJSON() });
    } catch (e) {
      return next(e);
    }
  }
};

export default createAddress;
