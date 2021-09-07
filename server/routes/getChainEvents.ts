import { Request, Response, NextFunction } from 'express';
import { sequelize, DB } from '../database';

const getChainEvents = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const type = req.query.type;
  if (!type) {
    return res.json({ status: 'Failure', message: 'Must provide user address' });
  }
  const events = await models.ChainEvent.findAll({ where: { chain_event_type_id: type} });
  return res.json({ status: 'Success', events });
};

export default getChainEvents;
