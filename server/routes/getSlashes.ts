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

const getSlashes = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, stash } = req.query;
  let { startDate, endDate } = req.query;
  let validators: { [key: string]: { [block: string]: any } } = {};

  if (!chain) return next(new Error(Errors.ChainIdNotFound));
  const chainInfo = await models.Chain.findOne({ where: { id: chain } });
  if (!chainInfo) return next(new Error(Errors.InvalidChain));

  // if date isn't defined we get for last 30 days
  if (typeof startDate === 'undefined' || typeof endDate === 'undefined') {
    endDate = new Date();
    startDate = new Date();
    endDate = endDate.toISOString(); // 2020-08-08T12:46:32.276Z FORMAT // today's date
    startDate.setDate(startDate.getDate() - 30);
    startDate = startDate.toISOString(); // 2020-08-08T12:46:32.276Z FORMAT // 30 days ago date
  }

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

  return res.json({ status: 'Success', result: validators || {}, denom: 'EDG' });
};

export default getSlashes;
