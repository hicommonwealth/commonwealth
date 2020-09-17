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
    Event handler to store reward information of validators details in DB.
  */
  public async handle(event: CWEvent < IChainEventData >, dbEvent) {
    // 1) if other event type ignore and do nothing.
    if (event.data.kind !== SubstrateTypes.EventKind.Reward) {
      return dbEvent;
    }

    // 2) Get relevant data from DB for processing.
    /*
      For rewards calculation of the validators, latest new-session event data needs to be present in the ChainEvents table.
      This query will return the latest new-session event data, as Rewards event will only be triggered after the new-session event.
    */
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

    if (!chainEventNewSession) { // if no new-session data, do nothing
      return dbEvent;
    }

    const newRewardEventData = event.data;
    const newSessionEventData = chainEventNewSession.event_data.data;
    /*
      This query will return the last created record for validators in 'HistoricalValidatorStatistic' table and return the data for each validator iff any.
      since all new and active validators records has been created by new-session event handler, it'll return the the last created records of them.
    */
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

    // 3) Modify exposures for validators.
    validatorsList.forEach((validator: any) => {
      // Getting updated validator info from the new-session event data related to rewards calculation (e.g. exposure(s) for each validator, commissionPer, eraPoints, rewardDestination)
      const activeValidatorsInfo = newSessionEventData.validatorInfo[validator.stash];
      const newExposure = newSessionEventData.activeExposures[validator.stash];

      // Check from the validator preferences whether the reward will be added to the own's exposure or not.
      if (activeValidatorsInfo.rewardDestination === 'Staked') {
        // Rewards amount calculation for the current validator. Reference: https://github.com/hicommonwealth/commonwealth/blob/staking-ui/client/scripts/controllers/chain/substrate/staking.ts#L468-L472
        const commission = ( Number(activeValidatorsInfo.commissionPer) / 10_000_000 ) / 100; // Calculate commission percentage value
        const firstReward = new BN(newRewardEventData.amount.toString()).muln(Number(commission)).divn(100);
        const secondReward = newExposure.own.toBn().mul( (new BN(newRewardEventData.amount.toString())).sub(firstReward) ).div(newExposure.total.toBn() || new BN(1));
        const totalReward = firstReward.add(secondReward);

        newExposure.own = (newExposure.own + totalReward).toString();
        newExposure.total = (newExposure.total + totalReward).toString();
      }

      validator.exposure = newExposure;
      validator.block = event.blockNumber.toString();
      validator.eventType = newRewardEventData.kind;
      validator.commissionPer = activeValidatorsInfo.commissionPer;
      validator.eraPoints = activeValidatorsInfo.eraPoints;
      validator.apr = 0; // TODO: APR to be computed over here
      validator.created_at = new Date().toISOString();
      validator.updated_at = new Date().toISOString();
      delete validator.id;
      delete validator.row_number;
    });

    // 4) create/update event data in database.
    // await this._models.HistoricalValidatorStatistic.bulkCreate( validatorsList, {ignoreDuplicates: true} );
    await Promise.all(validatorsList.map( (row: any) => {
      return this._models.HistoricalValidatorStatistic.create( row );
    }));

    return dbEvent;
  }
}

