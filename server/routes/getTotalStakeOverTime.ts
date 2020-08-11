import Sequelize from 'sequelize';
import { Exposure, BlockNumber, AccountId, ValidatorPrefs} from '@polkadot/types/interfaces';
import { Request, Response, NextFunction } from 'express';
import { Errors } from './getOffences';
const Op = Sequelize.Op;

interface IEventData {
    stash_id: AccountId;
    exposure: Exposure;
    block_number: BlockNumber;
}

const getOwnStakeOverTime = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain, stash_id } = req.query;
  let { startDate, endDate } = req.query;
  const chainInfo = await models.Chain.findOne({
    where: { id: chain }
  });
  // Handling Errors
  if (!chain) return next(new Error(Errors.ChainIdNotFound));
  if (!chainInfo) {
    return next(new Error(Errors.InvalidChain));
  }
  // Handling undefined Dates
  if (typeof startDate === 'undefined' || typeof endDate === 'undefined') {
    startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate = new Date(startDate);
    endDate = new Date();
  }
  // Querying from DB
  const OwnStakeOverTime = await models.HistoricalValidatorStatistic.findAll({
    // To get all exposure of validator between a time period
    where: {
      '$ChainEventType.chain$': chain,
      '$HistoricalValidatorStatistic.stash_id': stash_id,
      created_at: {
        [Op.between]: [startDate, endDate]
      }
    },
    attributes: ['stash_id', 'exposure', 'block'],
    order: [
      ['created_at', 'ASC']
    ],
    include: [ { model: models.ChainEventType } ]
  });

  if (!OwnStakeOverTime.length)
    return next(new Error(Errors.NoRecordsFound));

  const totalStake = [];
  const block = [];
  OwnStakeOverTime.forEach((stake) => {
    const event_data: IEventData = stake.dataValues.event_data;
    totalStake.push(event_data.exposure.total);
    block.push(event_data.block_number);
  });
  // Please check the result return statement
  return res.json({ status: 'Success', result: { totalStake, block } });
};

export default getOwnStakeOverTime;
