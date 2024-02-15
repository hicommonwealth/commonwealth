import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';
import type ViewCountCache from '../util/viewCountCache';

export const Errors = {
  NoObjectId: 'Must provide object ID',
  NoCommunity: 'Must provide community',
  CommunityNotFound: 'Community not found',
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
  if (!req.body.community_id) {
    return next(new AppError(Errors.NoCommunity));
  }
  const community = await models.Community.findOne({
    where: { id: req.body.community_id || null },
  });
  if (!community) {
    return next(new AppError(Errors.CommunityNotFound));
  }

  // verify count exists before querying
  let count = await models.Thread.findOne({
    where: {
      community_id: req.body.community_id,
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
      new_view_count: count.new_view_count + 1, // TODO: Delete this after view count recovery is run
    });
  }

  return res.json({ status: 'Success', result: count.toJSON() });
};

export default viewCount;
