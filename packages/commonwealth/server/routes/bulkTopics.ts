import type { Request, Response } from 'express';
import type { DB } from '../models';
import { QueryTypes } from 'sequelize';

export const Errors = {};

const bulkTopics = async (models: DB, req: Request, res: Response) => {
  const chain = req.chain;

  const topics = await models.sequelize.query(
    `SELECT
        *,
        (
          SELECT COUNT(*)::int FROM "Threads"
          WHERE community_id = :chain_id AND topic_id = t.id AND deleted_at IS NULL
        ) as total_threads
      FROM "Topics" t WHERE community_id = :chain_id AND deleted_at IS NULL`,
    {
      replacements: { chain_id: chain.id },
      type: QueryTypes.SELECT,
    }
  );

  return res.json({ status: 'Success', result: topics });
};

export default bulkTopics;
