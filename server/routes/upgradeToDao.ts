import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { sequelize, DB } from '../database';

import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotAdmin: 'Must be an admin to edit or feature topics',
  NotVerified: 'Must have a verified address to edit or feature topics',
  NoChainNode: 'Cannot find ChainNode',
  NoCommunity: 'Cannot convert offchain community into dao',
  NoChainFound: 'Cannot find Chain',
  NoContractAddress: 'Must provide governance contract address',
  NoTokenName: 'Must provide a valid token name',
  NoNetwork: 'Must provide a network/dao type (compound, aave, moloch, etc)',
};

const upgradeTokenToDao = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
  if (error) return next(new Error(error));
  if (community) return next(new Error(Errors.NoCommunity));
  if (!chain) return next(new Error(Errors.NoChainFound));
  if (!req.body.contractAddress) return next(new Error(Errors.NoContractAddress));
  if (!req.body.tokenName) return next(new Error(Errors.NoTokenName));
  if (!req.body.network) return next(new Error(Errors.NoNetwork));

  const adminAddress = await models.Address.findOne({
    where: {
      address: req.body.address,
      user_id: req.user.id,
    },
  });
  if (!adminAddress.verified) {
    return next(new Error(Errors.NotVerified));
  }

  const requesterIsAdminOrMod = await models.Role.findOne({
    where: {
      address_id: adminAddress.id,
      permission: 'admin',
      chain_id: chain.id,
    },
  });
  if (requesterIsAdminOrMod === null) {
    return next(new Error(Errors.NotAdmin));
  }

  // Find Chain && Find ChainNode
  const chainNode = await models.ChainNode.findOne({
    where: { chain: chain.id },
  });
  if (chainNode) {
    return next(new Error(Errors.NoChainNode));
  }

  // Update Chain and ChainNode
  chain.type = 'dao';
  chain.network = req.body.network;
  await chain.save();

  chainNode.address = req.body.contractAddress;
  chainNode.token_name = req.body.tokenName;
  await chainNode.save();

  return res.json({ status: 'Success', result: { chain: chain.toJSON(), node: chainNode.toJSON() } }); 
};

export default upgradeTokenToDao;
