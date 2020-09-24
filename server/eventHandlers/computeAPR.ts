import { SubstrateTypes } from '@commonwealth/chain-events';
import { sequelize } from '../database';
import moment from 'moment';
import BN from 'bn.js';


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

  const n = 1000000000; // Don't know what "n" is here.
  const periodsInYear = (60 * 60 * 24 * 7 * 52) / rewardsTimeIntervals;
  const percentage = (new BN(totalReward)).mul(new BN(n)).div(totalStakeAmount || new BN(1)).toNumber() / n;
  const apr = percentage * periodsInYear;
  return apr;
};

const getLast30DaysAPR = async(chain: String, event: String, stash: String ) => {
  let last30DaysAPR = 0;

  const todayDate = moment();
  const startDate = todayDate.format("YYYY-MM-DD");
  const endDate = todayDate.subtract(30, 'days').format("YYYY-MM-DD");

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
  `
  // AND event_data ->>  'validator' LIKE '%${stash}%'
  const [sessionEvents, sessionEventsMetadata] = await sequelize.query(sessionRawQuery);
  const commissionsAvg = sessionEvents.reduce((total, commission) => Number(total) + Number(commission.event_data.data.validatorInfo.stash.commissionPer), 0) / sessionEvents.length
  const ownAmountAvg = sessionEvents.reduce((total, ownAmount) => Number(total) + Number(ownAmount.event_data.data.activeExposures.stash.own), 0) / sessionEvents.length
  const totalStakeAmountAvg = sessionEvents.reduce((total, totalStake) => Number(total) + Number(totalStake.event_data.data.activeExposures.stash.total), 0) / sessionEvents.length

  last30DaysAPR = computeAPR(commissionsAvg, rewardAmountAvg, ownAmountAvg, totalStakeAmountAvg, totalRewardTimeAvg)
  return last30DaysAPR;
}


export default getLast30DaysAPR;
