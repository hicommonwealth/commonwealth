import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));
import { DB } from '../database';

export const Errors = {
  NoChain: 'No base chain provided in query',
  NoAddress: 'No address provided in query',
  NoAddressFound: 'No address found',
};

const getProfile = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const { chain, address } = req.query;
  if (!chain) return next(new Error(Errors.NoChain));
  if (!address) return next(new Error(Errors.NoAddress));

  const chains = await models.Chain.findAll();
  const chainIds = chains.map((c) => c.id);

  const addressModel = await models.Address.findOne({
    where: {
      address,
      chain,
    },
    include: [ models.OffchainProfile, ],
  });
  if (!addressModel) return next(new Error(Errors.NoAddressFound));

  const threads = await models.OffchainThread.findAll({
    where: {
      address_id: addressModel.id,
      [Op.or]: [{
        chain: { [Op.in]: chainIds }
      }]
    },
    include: [ { model: models.Address, as: 'Address' } ],
  });

  const comments = await models.Comment.findAll({
    where: {
      address_id: addressModel.id,
      [Op.or]: [{
        chain: { [Op.in]: chainIds }
      }]
    },
  });

  return res.json({
    status: 'Success',
    result: {
      account: addressModel, threads: threads.map((t) => t.toJSON()), comments: comments.map((c) => c.toJSON())
    }
  });
};

export default getProfile;
