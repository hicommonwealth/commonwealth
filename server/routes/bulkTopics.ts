import { Request, Response, NextFunction } from 'express';
import validateChain from '../util/validateChain';
import { DB } from '../database';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = { };

const bulkTopics = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [community, error] = await validateChain(models, req.query);
  if (error) return next(new Error(error));

  const topics = await models.Topic.findAll({
    where: { community_id: community.id },
  });

  return res.json({ status: 'Success', result: topics.map((c) => c.toJSON()) });
};

export default bulkTopics;
