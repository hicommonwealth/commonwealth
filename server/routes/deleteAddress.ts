import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const deleteAddress = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body.address) {
    return next(new Error('Must provide address'));
  }
  if (!req.body.chain) {
    return next(new Error('Must provide chain'));
  }

  const addressObj = await models.Address.findOne({
    where: { chain: req.body.chain, address: req.body.address }
  });
  if (!addressObj || addressObj.user_id !== req.user.id) {
    return next(new Error('Not found'));
  }

  if (req.body.chain) {
    const existingMemberships = await models.Membership.findAll({
      where: { chain: req.body.chain, user_id: req.user.id, active: true }
    });
    if (existingMemberships.length > 0) return next(new Error('Cannot delete last address'));
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
