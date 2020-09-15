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

interface ISomeOfflineEventData {
  kind: string;
  sessionIndex: number;
  validators: Array<string>;
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
  const where: any = {
    chain_event_type_id: `${chain}-some-offline`
  };

  if (stash) {
    where.event_data = {
      [Op.like]: `%${stash}%`
    }
  }

  if (startDate && endDate) {
    where.created_at = {
      [Op.between]: [startDate, endDate]
    };
  }
  const offences = await models.ChainEvent.findAll({
    where
  });

  const validators: { [key: string]: any[] } = {};

  offences.forEach((ofc) => {
    const event_data: ISomeOfflineEventData = ofc.dataValues.event_data;

    const keys = event_data.validators || chain;
    keys.array.forEach(key => {
      if (key in validators) {
        if (validators.hasOwnProperty(key)) {
          validators[key].push(ofc.block_number);
        }
      } else {
        validators[key] = [ofc.block_number];
      }
    });
  });

  return res.json({ status: 'Success', result: { validatorOffences: validators || [] } });
};

export default getOffences;
