import { IEventHandler, CWEvent, IChainEventData, SubstrateTypes } from '@commonwealth/chain-events';
import { computeEventStats } from './computeStats';
import { sequelize } from '../database';
import Sequelize from 'sequelize';
const Op = Sequelize.Op;

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: string
  ) {
    super();
  }

  public async handle(event: CWEvent < IChainEventData >, dbEvent) {
    // 1) if other event type ignore and do nothing.
    if (event.data.kind !== SubstrateTypes.EventKind.Offence) {
      return dbEvent;
    }
    const newOffenceEventData = event.data;

    // ignore validators who have committed offence but there records is not available in validators table.
    const existingValidators = await this._models.Validator.findAll({
      where: {
        stash: {
          [Op.in]: newOffenceEventData.offenders
        }
      }
    });
    if (!existingValidators || existingValidators.length === 0) return dbEvent;

    // 2) Get relevant data from DB for processing.
    // Get last created validator's record from 'HistoricalValidatorStatistic' table. as offence event contains offenders' AccountID.
    const rawQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER(PARTITION BY stash ORDER BY created_at DESC) 
        FROM public."HistoricalValidatorStatistic" 
        WHERE stash IN ('${newOffenceEventData.offenders.join("','")}')
      ) as q
      WHERE row_number = 1
    `;
    const [validators, metadata] = await sequelize.query(rawQuery);
    const validatorsList = JSON.parse(JSON.stringify(validators));

    // 3) Modify new offences related information for validators, create and update event details in db
    await Promise.all(validatorsList.map(async(validator: any) => {
      delete validator.id;
      delete validator.row_number;
      // Added Last 30 days Offences count for a validator.
      const [offenceStatsSum, offenceStatsAvg, offenceStatsCount] = await computeEventStats(this._chain, newOffenceEventData.kind, validator.stash, 30);
      validator.offencesStats = { count: offenceStatsCount };
      validator.block = event.blockNumber.toString();
      validator.eventType = newOffenceEventData.kind;
      validator.created_at = new Date().toISOString();
      validator.updated_at = new Date().toISOString();
      return this._models.HistoricalValidatorStatistic.create(validator);
    }));
    // await this._models.HistoricalValidatorStatistic.bulkCreate( validatorsList, {ignoreDuplicates: true} );
    return dbEvent;
  }
}
