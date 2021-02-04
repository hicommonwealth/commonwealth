import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NeedAddress: 'Must provide address',
  NeedChain: 'Must provide chain',
  AddressNotFound: 'Address not found',
  CannotDeleteMagic: 'Cannot delete Magic Link address',
};

const deleteAddress = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body.address) {
    return next(new Error(Errors.NeedAddress));
  }
  if (!req.body.chain) {
    return next(new Error(Errors.NeedChain));
  }

  const addressObj = await models.Address.findOne({
    where: { chain: req.body.chain, address: req.body.address }
  });
  if (!addressObj || addressObj.user_id !== req.user.id) {
    return next(new Error(Errors.AddressNotFound));
  }
  if (addressObj.is_magic) {
    return next(new Error(Errors.CannotDeleteMagic));
  }

  try {
    addressObj.user_id = null;
    addressObj.verified = null;
    const result = await addressObj.save();
    return res.json({ status: 'Success', response: 'Deleted address' });
  } catch (err) {
    return next(new Error(err));
  }
};

export default deleteAddress;
