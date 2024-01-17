import type { DB } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';

export const Errors = {
  NeedSecret: 'Must provide the secret to use this route',
  InvalidSecret: 'Must provide a valid secret to use this route',
};

export const getSubscribedCommunities = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const communities = await models.Community.findAll({
    where: { has_chain_events_listener: true },
  });

  return res.json({
    status: 'Success',
    result: communities.map((x) => x.toJSON()),
  });
};
