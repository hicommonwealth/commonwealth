import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const edgewareLockdropEvents = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const filters : any = {};
  if (req.query.origin) filters.origin =
    models.sequelize.where(models.sequelize.fn('LOWER', models.sequelize.col('origin')),
                           'LIKE', `%${req.query.origin.toLowerCase()}%`);
  if (req.query.name) filters.name = req.query.name;

  const events = await models.EdgewareLockdropEvent.findAll({ where: filters, order: ['timestamp'] });
  res.json({ events });
};

export default edgewareLockdropEvents;
