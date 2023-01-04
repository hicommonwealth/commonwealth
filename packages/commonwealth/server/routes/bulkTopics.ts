import { Request, Response, NextFunction } from 'express';
import { DB } from '../models';
import { factory, formatFilename } from 'common-common/src/logging';
import { AppError, ServerError } from 'common-common/src/errors';

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
