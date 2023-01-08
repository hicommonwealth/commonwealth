import { factory, formatFilename } from 'common-common/src/logging';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {};

const bulkTopics = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;

  const topics = await models.Topic.findAll({
    where: { chain_id: chain.id },
  });

  return res.json({ status: 'Success', result: topics.map((c) => c.toJSON()) });
};

export default bulkTopics;
