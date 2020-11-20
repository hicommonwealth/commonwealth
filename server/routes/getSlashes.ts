import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { Errors } from './getOffences';

const Op = Sequelize.Op;

interface IEventData {
  kind: string;
  amount: string;
  validator: string;
  block_number: number;
}


export async function getSlashesFunc(models, req, next: NextFunction) {
  const { chain, stash } = req.query;
  const { startDate, endDate } = req.query;
  const validators: { [key: string]: { [block: string]: any } } = {};

  if (!chain) return next(new Error(Errors.ChainIdNotFound));
  const chainInfo = await models.Chain.findOne({ where: { id: chain } });
  if (!chainInfo) return next(new Error(Errors.InvalidChain));


  let where: any = {
    chain_event_type_id: `${chain}-slash`
  };

  if (stash) {
    const stashCheck = { [Op.and]: Sequelize.literal(`event_data->>'validator' = '${stash}'`) };
    where = Object.assign(where, stashCheck);
  }

  if (startDate && endDate) {
    where.created_at = {
      [Op.between]: [startDate, endDate]
    };
  }

  const slashes = await models.ChainEvent.findAll({
    where,
    order: [
      ['created_at', 'ASC']
    ],
  });

  slashes.forEach((slash) => {
    const event_data: IEventData = slash.dataValues.event_data;
    const key = event_data.validator;
    if (!Object.prototype.hasOwnProperty.call(validators, key)) { validators[key] = {}; }
    validators[key][slash.dataValues.block_number.toString()] = event_data.amount;
  });

  return { status: 'Success', result: validators || {}, denom: 'EDG' };
}

const getSlashes = async (models, req: Request, res: Response, next: NextFunction) => {
  return res.json(await getSlashesFunc(models, req, next));
};

export default getSlashes;
