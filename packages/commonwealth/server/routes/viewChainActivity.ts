import { Request, Response, NextFunction } from 'express';
import { DB } from '../models';

const viewChainActivity = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const query = `
    SELECT ce.*, cet.chain, cet.event_network, c.icon_url FROM "ChainEvents" ce
    INNER JOIN "ChainEventTypes" cet ON ce.chain_event_type_id = cet.id 
    INNER JOIN "Chains" c ON c.id = cet.chain 
    ORDER BY ce.created_at DESC 
    LIMIT 50;
  `;

  const notifications = await models.sequelize.query(query, {
    type: 'SELECT',
    raw: true,
  });

  return res.json({ status: 'Success', result: notifications });
};

export default viewChainActivity;
