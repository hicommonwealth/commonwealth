/* eslint-disable max-len */
import { IEventHandler, CWEvent, IChainEventData, SubstrateTypes } from '@commonwealth/chain-events';
import BN from 'bn.js';
import { computeEventStats, getAPR } from './computeStats';


export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: string
  ) {
    super();
  }

  /**
    Event handler to store reward information of validators details in DB.

    NOTES: Since New version of Edgeware events will be available soon, so modifying reward event handler accordingly.
            As each Reward event will have it's respective validator AccountID.
  */
  public async handle(event: CWEvent < IChainEventData >, dbEvent) {
    // 1) if other event type ignore and do nothing.
    if (event.data.kind !== SubstrateTypes.EventKind.Reward) {
      return dbEvent;
    }
    // 2) Get relevant data from DB for processing.
    /*
      For rewards calculation of the validators, latest new-session event da  ta needs to be present in the ChainEvents table.
      This query will return the latest new-session event data, as Rewards event will only be triggered after the new-session event.
    */
    const chainEventNewSession = await this._models.ChainEvent.findOne({
      where: { chain_event_type_id: `${this._chain}-new-session` },
      order: [
        ['created_at', 'DESC']
      ],
      attributes: ['event_data']
    });

    if (!chainEventNewSession) { // if no new-session data, do nothing
      return dbEvent;
    }

    const newSessionEventData = chainEventNewSession.event_data;
    const newRewardEventData = event.data;

    // Get last created validator's record from 'HistoricalValidatorStatistic' table. as new reward event will contain validator's AccountID.
    const latestValidatorStat = await this._models.HistoricalValidatorStatistic.findOne({
      where: {
        stash: newRewardEventData.validator
      },
      order: [
        ['created_at', 'DESC']
      ]
    });
    if (!latestValidatorStat) {
      return dbEvent;
    }

    const validator = JSON.parse(JSON.stringify(latestValidatorStat));

    // Added Last 30 days Rewards count and averages for a validator.
    const [rewardsStatsSum, rewardsStatsAvg, rewardsStatsCount] = await computeEventStats(this._chain, newRewardEventData.kind, validator.stash, 30);
    validator.rewardsStats = { count: rewardsStatsCount, sum: rewardsStatsSum, avg: rewardsStatsAvg };

    // 3) Modify exposures for validators based of reward amount.
    // Getting updated validator info from the new-session event data related to rewards calculation (e.g. exposure(s) for each validator, commissionPer, eraPoints, rewardDestination)
    const activeValidatorsInfo = newSessionEventData.validatorInfo[validator.stash];
    const newExposure = newSessionEventData.activeExposures[validator.stash];
    const ownStake = new BN(newExposure.own.toLocaleString().replace(/,/g, ''))  || new BN(1);
    const totalStake = new BN(newExposure.total.toLocaleString().replace(/,/g, '')) || new BN(1);
    const rewardAmount =  new BN(newRewardEventData.amount.toLocaleString().replace(/,/g, ''));
    // Check from the validator preferences whether the reward will be added to the own's exposure or not.
    if (activeValidatorsInfo.rewardDestination === 'Staked') {
      // Rewards amount calculation for the current validator. Reference: https://github.com/hicommonwealth/commonwealth/blob/staking-ui/client/scripts/controllers/chain/substrate/staking.ts#L468-L472
      const firstReward = rewardAmount.muln(Number(activeValidatorsInfo.commissionPer)).divn(100);
      const secondReward = ownStake.mul(rewardAmount.sub(firstReward)).div(totalStake);
      const totalReward = firstReward.add(secondReward);
      newExposure.own = (ownStake.add(totalReward)).toString();
      newExposure.total = (totalStake.add(totalReward)).toString();
      validator.exposure = newExposure;
    }
    validator.block = event.blockNumber.toString();
    validator.eventType = newRewardEventData.kind;
    validator.commissionPer = activeValidatorsInfo.commissionPer;
    validator.eraPoints = activeValidatorsInfo.eraPoints;
    validator.apr = await getAPR(this._chain, event.data.kind, validator.stash.toString(), 30);
    validator.created_at = new Date().toISOString();
    validator.updated_at = new Date().toISOString();
    delete validator.id;

    // 4) create/update event data in database.
    await this._models.HistoricalValidatorStatistic.create(validator);
    return dbEvent;
  }
}
