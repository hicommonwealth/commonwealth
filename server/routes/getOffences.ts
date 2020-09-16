import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));
const Op = Sequelize.Op;

export const Errors = {
  InvalidChain: 'Invalid chain',
  ChainIdNotFound: 'Cannot find chain id',
  NoRecordsFound: 'No records found',
};

interface IEventData {
  kind: string;
  opaqueTimeSlot: string;
  applied: boolean;
  offenders: Array<string>;
}

const getOffences = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, stash } = req.query;
  let { startDate, endDate } = req.query;

  if (!chain) return next(new Error(Errors.ChainIdNotFound));

  const chainInfo = await models.Chain.findOne({
    where: { id: chain }
  });
  if (!chainInfo) {
    return next(new Error(Errors.InvalidChain));
  }

  // if start and end date isn't given, we set it for 30 days for now
  if (typeof startDate === 'undefined' || typeof endDate === 'undefined') {
    endDate = new Date();
    startDate = new Date();
    endDate = endDate.toISOString(); // 2020-08-08T12:46:32.276Z FORMAT // today's date
    startDate.setDate(startDate.getDate() - 30);
    startDate = startDate.toISOString(); // 2020-08-08T12:46:32.276Z FORMAT // 30 days ago date
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

  let validators: { [key: string]: { [block: string]: any } } = {};

  offences.forEach((ofc) => {
    const event_data: IEventData = ofc.dataValues;
    validators = {};
    event_data.offenders.forEach((offender) => {
      let key = offender;
      if (validators.hasOwnProperty(key)) {
        validators[key][ofc.block_number.toString()] = event_data.kind;
      } else {
        validators[key] = {};
        validators[key][ofc.block_number.toString()] = event_data.kind;
      }
    })
  });

  return res.json({ status: 'Success', result: { validators: validators || [] } });
};

export default getOffences;
