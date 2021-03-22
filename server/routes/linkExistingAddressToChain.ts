import { Request, Response, NextFunction } from 'express';
import Sequelize from 'sequelize';

const { Op } = Sequelize;

export const Errors = {
  NeedAddress: 'Must provide address',
  NeedChain: 'Must provide chain',
  NeedOriginChain: 'Must provide original chain',
  NotVerifiedAddress: 'Not verified address',
  NotVerifiedUser: 'Not verified user',
  InvalidChain: 'Invalid chain',
};

const linkExistingAddressToChain = async (models, req: Request, res: Response, next: NextFunction) => {
  // TODO: need comments
  if (!req.body.address) {
    return next(new Error(Errors.NeedAddress));
  }
  if (!req.body.chain) {
    return next(new Error(Errors.NeedChain));
  }
  if (!req.body.originChain) {
    return next(new Error(Errors.NeedOriginChain));
  }
  const chain = await models.Chain.findOne({
    where: { id: req.body.chain }
  });
  if (!chain) {
    return next(new Error(Errors.InvalidChain));
  }

  const existingAddress = await models.Address.scope('withPrivateData').findOne({
    where: { chain: req.body.originChain, address: req.body.address, verified: { [Op.ne]: null } }
  });

  if (!existingAddress) {
    return next(new Error(Errors.NotVerifiedAddress));
  }

  if (req.user.id && req.user.id !== existingAddress.user_id) {
    return next(new Error(Errors.NotVerifiedUser));
  }

  try {
    const newObj = await models.Address.create({
      user_id: existingAddress.user_id,
      address: existingAddress.address,
      chain: req.body.chain,
      verification_token: existingAddress.verification_token,
      verification_token_expires: existingAddress.verification_token_expires, // Todo: expires should be updated
      verified: existingAddress.verified, // Todo: verified should be updated
      keytype: existingAddress.keytype,
      name: existingAddress.name,
      last_active: existingAddress.last_active, // Todo: last_active should be updated
    });

    const newRole = await models.Role.create(req.body.community ? {
      address_id: newObj.id,
      offchain_community_id: req.body.community,
      permission: 'member',
    } : {
      address_id: newObj.id,
      chain_id: req.body.chain,
      permission: 'member',
    });

    return res.json({ status: 'Success', result: newObj.toJSON() });
  } catch (e) {
    return next(e);
  }
};

export default linkExistingAddressToChain;
