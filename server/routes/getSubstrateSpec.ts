import { Request, Response, NextFunction } from 'express';
import { AppError } from '../util/errors';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';
import { ChainBase } from '../../shared/types';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const getSubstrateSpec = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, , error] = await lookupCommunityIsVisibleToUser(
    models,
    req.query,
    req.user
  );
  console.log(error);
  if (error) throw new AppError(error);
  if (!chain) throw new AppError('Unknown chain.');
  if (chain.base !== ChainBase.Substrate)
    throw new AppError('Chain must be substrate');

  const spec = chain.substrate_spec;
  return res.json({ status: 'Success', result: spec || {} });
};

export default getSubstrateSpec;
