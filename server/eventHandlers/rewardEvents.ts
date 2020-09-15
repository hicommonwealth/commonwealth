/* eslint-disable max-len */
import { IEventHandler, CWEvent, IChainEventData, SubstrateTypes } from '@commonwealth/chain-events';
import BN from 'bn.js';
import { sequelize } from '../database';


export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: string,
  ) {
    super();
  }

  /**
    * Event handler for reward information of validators details in DB.
  */
  public async handle(event: CWEvent < IChainEventData >, dbEvent) {
    // 1) if other event type ignore and do nothing.
    if (event.data.kind !== SubstrateTypes.EventKind.Reward) {
      return dbEvent;
    }

    // 2) check for the new-session event data from chain events db
    const chainEventNewSession = await this._models.ChainEvent.findOne({
      include: [
        {
          model: this._models.ChainEventType,
          where: {
            chain: this._chain,
            event_name: event.data.kind,
          }
        }
      ],
      order: [
        ['created_at', 'DESC']
      ],
      attributes: ['event_data']
    });

    if (!chainEventNewSession) { // Ignore unknown event types, if any.
      return dbEvent;
    }

    const newRewardEventData = event.data;
    const newSessionEventData = chainEventNewSession.event_data.data;

    // WHERE stash IN ('${Object.keys(newSessionEventData.activeExposures).join("','")}') and eventType = '${newRewardEventData.kind}'
    const rawQuery = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER(PARTITION BY stash ORDER BY created_at DESC) 
        FROM public."HistoricalValidatorStatistic" 
        WHERE stash IN ('${Object.keys(newSessionEventData.activeExposures).join("','")}')
      ) as q
      WHERE row_number = 1
    `;
    const [validators, metadata] = await sequelize.query(rawQuery);
    let validatorsList = JSON.parse(JSON.stringify(validators));

    // 3) Modify new exposures for validators
    validatorsList.forEach((validator: any) => {
      const activeValidatorsInfo = newSessionEventData.validatorInfo[validator.stash];
      const newExposure = newSessionEventData.activeExposures[validator.stash];

      const firstReward = new BN(newRewardEventData.amount.toString()).muln(Number(activeValidatorsInfo.commissionPer)).divn(100);
      const secondReward = newExposure.own.toBn().mul((new BN(newRewardEventData.amount.toString())).sub(firstReward)).div(newExposure.total.toBn() || new BN(1));
      const totalReward = firstReward.add(secondReward);

      if (activeValidatorsInfo.rewardDestination) {
        newExposure.own = totalReward.toString();
      }

      validator.exposure = newExposure;
      validator.block = event.blockNumber;
      validator.eventType = newRewardEventData.kind;
      validator.commissionPer = activeValidatorsInfo.commissionPer;
      validator.eraPoints = activeValidatorsInfo.eraPoints;
      validator.apr = 123; // To be computed over here.
      validator.created_at = new Date().toISOString();
      validator.updated_at = new Date().toISOString();
      delete validator.id;
      delete validator.row_number;
    });

    // 4) create and update event details in db
    // await models.HistoricalValidatorStatistic.bulkCreate( validatorsList, {ignoreDuplicates: true} );
    await Promise.all(validatorsList.map( (row: any) => {
      return this._models.HistoricalValidatorStatistic.create( row, {ignoreDuplicates: true} );
    }));

    return dbEvent;
  }
}