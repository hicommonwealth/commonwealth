import { AppError } from '@hicommonwealth/adapters';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';
import type ViewCountCache from '../util/viewCountCache';

export const Errors = {
  NoObjectId: 'Must provide object ID',
  NoChainOrComm: 'Must provide chain or community',
  InvalidChainOrComm: 'Invalid chain or community',
  InvalidThread: 'Invalid thread',
};

const viewCount = async (
  models: DB,
  cache: ViewCountCache,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.body.object_id) {
    return next(new AppError(Errors.NoObjectId));
  }
  if (!req.body.chain) {
    return next(new AppError(Errors.NoChainOrComm));
  }
  const chain = await models.Community.findOne({
    where: { id: req.body.chain || null },
  });
  if (!chain) {
    return next(new AppError(Errors.InvalidChainOrComm));
  }

  // verify count exists before querying
  let count = await models.Thread.findOne({
    where: {
      community_id: req.body.chain,
      id: req.body.object_id,
    },
  });
  if (!count) {
    return next(new AppError(Errors.InvalidThread));
  }

  // hit cache to decide whether to add to count
  const isNewView = await cache.view(req.ip, req.body.object_id);

  // add one to view count if not in cache and not newly created
  if (isNewView) {
    count = await count.update({
      view_count: count.view_count + 1,
    });
  }

  return res.json({ status: 'Success', result: count.toJSON() });
};

export default viewCount;
