import { SubstrateTypes } from '@commonwealth/chain-events';
import { sequelize } from '../database';
import moment from 'moment';
import BN from 'bn.js';


export const computeEventStats = async(chain: String, event: String, stash: String, noOfDays: number) => {
  let eventStatsAvg = 0;
  let eventStatsCount = 0;

  const todayDate = moment();
  const startDate = todayDate.format("YYYY-MM-DD");
  const endDate = todayDate.subtract(noOfDays, 'days').format("YYYY-MM-DD");

  // If other event type ignore and do nothing.
  if (event !== SubstrateTypes.EventKind.Reward 
    && event !== SubstrateTypes.EventKind.Slash
    && event !== SubstrateTypes.EventKind.Offence ) {
    return [ eventStatsAvg, eventStatsCount ];
  }

  // Get ChainEvents based on event type and last 30 days interval per validator.
  let rawQuery = `
    SELECT event_data 
    FROM "ChainEvents" 
    WHERE chain_event_type_id  = '${chain}-${event}' AND 
    created_at >= '${startDate}' AND created_at <= '${endDate}'
  `
  switch (event) {
    case SubstrateTypes.EventKind.Reward:
    case  SubstrateTypes.EventKind.Slash: {
      rawQuery += ` AND event_data ->>  'validator' LIKE '%${stash}%'`
      const [validators, metadata] = await sequelize.query(rawQuery);

      eventStatsCount = validators.length;
      validators.map(validator =>{
        eventStatsAvg = Number(eventStatsAvg) + Number(validator.event_data.amount)
      })
      break;
    }
    case SubstrateTypes.EventKind.Offence: {
      rawQuery += ` AND event_data ->>  'offenders' LIKE '%${stash}%'`
      const [validators, metadata] = await sequelize.query(rawQuery);
      eventStatsCount = validators.length; 
      break;
    }
    default: {
      return [ eventStatsAvg, eventStatsCount ];
    }
  }
  return [ eventStatsAvg, eventStatsCount ];
}

const computeAPR = (commissionPer, rewardAmount, ownedAmount, totalStakeAmount, rewardsTimeIntervals) => {
  /*
    APR calculation for the current validator. Reference: https://github.com/hicommonwealth/commonwealth/blob/staking-ui/client/scripts/controllers/chain/substrate/staking.ts#L468-L472

    commissionPer: Percentage (commission percentage is set by the validator and it will be in percent like 20%, 25.7%)
    rewardAmount: Actual Reward amount awarded in the end of the session.
    ownedAmount: Actual amount owned by the validator itself.
    totalStakeAmount: Actual total stake amount which were staked during the session (It's is combination of Own Amount + nominator's staked amount).
    rewardsTimeIntervals: Total Reward time intervals in seconds.
  */
  const rewardCommissionAmount = new BN(rewardAmount.toString()).muln(Number(commissionPer)).divn(100);;
  const secondReward = ownedAmount.toBn().mul( (new BN(rewardAmount.toString())).sub(rewardCommissionAmount) ).div(totalStakeAmount.toBn() || new BN(1));
  const totalReward = rewardCommissionAmount.add(secondReward);

  const periodsInYear = (60 * 60 * 24 * 7 * 52) / rewardsTimeIntervals;
  const percentage = (new BN(totalReward)).div(totalStakeAmount || new BN(1)).toNumber();
  const apr = percentage * periodsInYear;
  return apr;
};

export const getAPR = async(chain: String, event: String, stash: String, noOfDays: number) => {
  let computedAPR = 0;

  const todayDate = moment();
  const startDate = todayDate.format("YYYY-MM-DD");
  const endDate = todayDate.subtract(noOfDays, 'days').format("YYYY-MM-DD");

  let rewardRawQuery = `
    SELECT  event_data, created_at
    FROM "ChainEvents"
    WHERE chain_event_type_id  = '${chain}-${event}'
    AND created_at >= '${startDate}' AND created_at <= '${endDate}'
    AND event_data ->>  'validator' LIKE '%${stash}%'
  `
  const [rewardEvents, rewardEventsMetadata] = await sequelize.query(rewardRawQuery);

  let rewardsTimeDiffs = rewardEvents.slice(1).map((reward, index) => {
    const currRewardTime = moment(reward.created_at);
    const preRewardTime = moment(rewardEvents[index].created_at);
    return currRewardTime.diff(preRewardTime, 'seconds');
  });
  const totalRewardTimeAvg = rewardsTimeDiffs.reduce((total, timeDiff) => Number(total) + Number(timeDiff), 0) / rewardsTimeDiffs.length
  const rewardAmountAvg = rewardEvents.reduce((total, reward) => Number(total) + Number(reward.event_data.amount), 0) / rewardEvents.length

  let sessionRawQuery = `
    SELECT  event_data, created_at 
    FROM "ChainEvents" 
    WHERE chain_event_type_id  = '${chain}-${event}' 
    AND created_at >= '${startDate}' AND created_at <= '${endDate}'
    AND event_data ->> 'data' LIKE '%${stash}%'
  `
  const [sessionEvents, sessionEventsMetadata] = await sequelize.query(sessionRawQuery);
  const commissionsAvg = sessionEvents.reduce((total, commission) => Number(total) + Number(commission.event_data.data.validatorInfo.stash.commissionPer), 0) / sessionEvents.length
  const ownAmountAvg = sessionEvents.reduce((total, ownAmount) => Number(total) + Number(ownAmount.event_data.data.activeExposures.stash.own), 0) / sessionEvents.length
  const totalStakeAmountAvg = sessionEvents.reduce((total, totalStake) => Number(total) + Number(totalStake.event_data.data.activeExposures.stash.total), 0) / sessionEvents.length

  computedAPR = computeAPR(commissionsAvg, rewardAmountAvg, ownAmountAvg, totalStakeAmountAvg, totalRewardTimeAvg)
  return computedAPR;
}
