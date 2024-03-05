import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';

export const Errors = {
  NotLoggedIn: 'Not signed in',
  NoCommunity: 'Must provide community',
  CommunityNF: 'Community not found',
};

const selectCommunity = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  if (!req.body.community_id) {
    return next(new AppError(Errors.NoCommunity));
  }

  const community = await models.Community.findOne({
    where: { id: req.body.community_id },
  });
  if (!community) {
    return next(new AppError(Errors.CommunityNF));
  }
  req.user.setSelectedCommunity(community);
  await req.user.save();
  return res.json({ status: 'Success' });
};

export default selectCommunity;
