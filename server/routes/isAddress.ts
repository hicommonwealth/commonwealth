import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));
import { DB } from '../database';

export const Errors = {
  NoAddress: 'No address provided in query',
};

const isAddress = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const { chain, address } = req.query;
  if (!address) return next(new Error(Errors.NoAddress));

  const addressModel = await models.Address.findOne({
    where: {
      address,
      chain,
    },
  });
  if (!addressModel) return res.json({ status: 'false' });
  return res.json({
    status: 'true',
  });
};

export default isAddress;
