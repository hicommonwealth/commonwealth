import type { DB } from '../models';
import type { Request, Response } from 'express';

export const Errors = {};

const bulkTopics = async (models: DB, req: Request, res: Response) => {
  const chain = req.chain;

  const topics = await models.Topic.findAll({
    where: { chain_id: chain.id },
  });

  return res.json({ status: 'Success', result: topics.map((c) => c.toJSON()) });
};

export default bulkTopics;
