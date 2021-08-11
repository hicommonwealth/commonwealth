import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));
const edgewareLockdropEvents = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const filters : any = {};
  if (req.query.origin) filters.origin = models.Sequelize.where(models.Sequelize.fn('LOWER', models.Sequelize.col('origin')),
    'LIKE', `%${String(req.query.origin).toLowerCase()}%`);
  if (req.query.name) filters.name = req.query.name;

  const events = await models.EdgewareLockdropEvent.findAll({ where: filters, order: ['timestamp'] });
  res.json({ events });
};

export default edgewareLockdropEvents;
