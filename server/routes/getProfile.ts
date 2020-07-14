import { Request, Response, NextFunction } from 'express';
import { } from '../../shared/types';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));


export const Errors = {
  NoChain: 'No Base Chain provided in query',
  NoAddress: 'No address provided in query',
  NoAddressFound: 'No address found',
};

const getProfile = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, address } = req.query;
  if (!chain) return next(new Error(Errors.NoChain));
  if (!address) return next(new Error(Errors.NoAddress));

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
    },
    include: [ models.Address, ],
  });

  const comments = await models.OffchainComment.findAll({
    where: {
      address_id: addressModel.id,
    },
  });

  return res.json({ status: 'Success', result: { account: addressModel, threads, comments } });
};

export default getProfile;
