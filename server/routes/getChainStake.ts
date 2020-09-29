import { Op } from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { map, uniqBy } from 'lodash';
import { factory, formatFilename } from '../../shared/logging';
import { Errors as AddressErrors } from './createAddress';
const log = factory.getLogger(formatFilename(__filename));

const getChainStake = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.query.chain) {
    return next(new Error(AddressErrors.NeedChain));
  }
  const chain = await models.Chain.findOne({
    where: { id: req.query.chain }
  });
  if (!chain) {
    return next(new Error(AddressErrors.InvalidChain));
  }

  const stakes = await models.ChainEvent.findAll({
    where: {
      [Op.or] :[
        { chain_event_type_id: `${req.query.chain}-unbonded` },
        { chain_event_type_id: `${req.query.chain}-bonded` }
      ]
    }
  });
  const result = uniqBy(map(stakes, 'event_data'), 'stash');

  return res.json({ status: 'Success', result });
};

export default getChainStake;
