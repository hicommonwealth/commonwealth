import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const edgewareLockdropBalances = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const filters : any = {};
  if (req.query.address) filters.address =
    models.sequelize.where(models.sequelize.fn('LOWER', models.sequelize.col('address')),
                           'LIKE', `%${req.query.address.toLowerCase()}%`);

  const balances = await models.EdgewareLockdropBalance.findAll({ where: filters });
  res.json({ balances });
};

export default edgewareLockdropBalances;
