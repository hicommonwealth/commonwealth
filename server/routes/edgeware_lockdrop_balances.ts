import { Request, Response, NextFunction } from 'express';
import log from '../../shared/logging';
import { DB } from '../database';

const edgewareLockdropBalances = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const filters : any = {};
  // eslint-disable-next-line max-len
  if (req.query.address) filters.address = models.Sequelize.where(models.Sequelize.fn('LOWER', models.Sequelize.col('address')),
    'LIKE', `%${req.query.address.toLowerCase()}%`);

  const balances = await models.EdgewareLockdropBalance.findAll({ where: filters });
  res.json({ balances });
};

export default edgewareLockdropBalances;
