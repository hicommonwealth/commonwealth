import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';

const Op = Sequelize.Op;

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedChain: 'Must provide chain',
  InvalidChain: 'Invalid chain',
};

const getAddressStatus = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.address) {
    return next(new Error(Errors.NeedAddress));
  }
  if (!req.body.chain) {
    return next(new Error(Errors.NeedChain));
  }

  // TODO: this will not work for token forums
  const chainName = req.body.chain.startsWith('0x') ? 'ethereum' : req.body.chain;
  const chain = await models.Chain.findOne({
    where: { id: chainName }
  });
  if (!chain) {
    return next(new Error(Errors.InvalidChain));
  }

  const existingAddress = await models.Address.findOne({
    where: { chain: chainName, address: req.body.address, verified: { [Op.ne]: null } }
  });

  let result;
  if (existingAddress) {
    const belongsToUser = req.user && (existingAddress.user_id === req.user.id);
    result = {
      exists: true,
      belongsToUser
    };
  } else {
    result = {
      exists: false,
      belongsToUser: false,
    };
  }

  return res.json({ status: 'Success', result });
};

export default getAddressStatus;
