import type { NextFunction, Request, Response } from 'express';
import { AppError } from 'common-common/src/errors';
import { QueryTypes } from 'sequelize';

import type { DB } from '../../database/database';

export const Errors = {
  NeedLimit: 'Must provide limit to fetch events',
};

const eventActivity: any = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.query.limit) {
    return next(new AppError(Errors.NeedLimit));
  }

  const events = await models.sequelize.query(
    `
      SELECT ce.id,
             ce.chain_event_type_id,
             ce.block_number,
             ce.event_data,
             ce.created_at,
             ce.updated_at,
             ce.entity_id,
             cet.chain,
             cet.event_network
      FROM "ChainEvents" ce
               JOIN "ChainEventTypes" cet ON ce.chain_event_type_id = cet.id
      ORDER BY ce.created_at DESC
      LIMIT ?;
  `,
    { replacements: [req.query.limit], raw: true, type: QueryTypes.SELECT }
  );

  return res.json({ status: 'Success', result: events });
};

export default eventActivity;
