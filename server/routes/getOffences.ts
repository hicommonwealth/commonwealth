import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));
const Op = Sequelize.Op;

export const Errors = {
  InvalidChain: 'Invalid chain',
  ChainIdNotFound: 'Cannot find chain id',
  NoRecordsFound: 'No records found',
  InvalidStashID: 'Provide a valid stash id'
};

interface IEventData {
  kind: string;
  opaqueTimeSlot: string;
  applied: boolean;
  offenders: Array<string>;
}

export async function getOffencesFunc(models, req: Request, next: NextFunction) {
  const { chain, stash } = req.query;
  const { startDate, endDate } = req.query;
  const validators: { [key: string]: { [block: string]: any } } = {};

  if (!chain) return next(new Error(Errors.ChainIdNotFound));

  const chainInfo = await models.Chain.findOne({
    where: { id: chain }
  });
  if (!chainInfo) {
    return next(new Error(Errors.InvalidChain));
  }


  let where: any = {
    chain_event_type_id: `${chain}-offences-offence`
  };

  if (stash) {
    const stashCheck = { [Op.and]: Sequelize.literal(`event_data->>'offenders' LIKE '%${stash}%'`) };
    where = Object.assign(where, stashCheck);
  }

  if (startDate && endDate) {
    where.created_at = {
      [Op.between]: [startDate, endDate]
    };
  }
  const offences = await models.ChainEvent.findAll({
    where
  });

  offences.forEach((ofc) => {
    const event_data: IEventData = ofc.dataValues.event_data;
    event_data.offenders.forEach((offender) => {
      const key = offender.toString();
      if (!Object.prototype.hasOwnProperty.call(validators, key)) { validators[key] = {}; }
      validators[key][ofc.block_number.toString()] = event_data.kind;
    });
  });

  return { status: 'Success', result: validators || {} };
}


const getOffences = async (models, req: Request, res: Response, next: NextFunction) => {
  return res.json(await getOffencesFunc(models, req, next));
};

export default getOffences;
