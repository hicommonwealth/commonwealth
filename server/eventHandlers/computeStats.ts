import { SubstrateTypes } from '@commonwealth/chain-events';
import moment from 'moment';
import BN from 'bn.js';
import { sequelize } from '../database';

export const computeEventStats = async (chain: String, event: String, stash: String, noOfDays: number) => {
  let eventStatsSum = 0;
  let eventStatsAvg = 0;
  let eventStatsCount = 0;

  // If other event type ignore and do nothing.
  if (event !== SubstrateTypes.EventKind.Reward
    && event !== SubstrateTypes.EventKind.Slash
    && event !== SubstrateTypes.EventKind.Offence) {
    return [eventStatsSum, eventStatsAvg, eventStatsCount];
  }

  const todayDate = moment();
  const endDate = todayDate.add(1, 'days').format('YYYY-MM-DD');
  const startDate = todayDate.subtract(noOfDays, 'days').format('YYYY-MM-DD');

  // Get ChainEvents based on event type and last 30 days interval per validator.
  let rawQuery = `
    SELECT event_data 
    FROM "ChainEvents" 
    WHERE chain_event_type_id  = '${chain}-${event}' AND 
    active = true AND
    created_at >= '${startDate}' AND created_at <= '${endDate}'
  `;
  switch (event) {
    case SubstrateTypes.EventKind.Reward:
    case SubstrateTypes.EventKind.Slash: {
      rawQuery += ` AND event_data ->>  'validator' LIKE '%${stash}%'`;
      const [validators, metadata] = await sequelize.query(rawQuery);

      eventStatsCount = validators.length;
      eventStatsSum = validators.reduce((total, reward) => Number(total) + Number(reward.event_data.amount), 0);
      const avgStats = Number((eventStatsSum / eventStatsCount).toFixed(2));
      eventStatsAvg = Number.isNaN(avgStats) ? 0 : avgStats;
      break;
    }
    case SubstrateTypes.EventKind.Offence: {
      rawQuery += ` AND event_data ->>  'offenders' LIKE '%${stash}%'`;
      const [validators, metadata] = await sequelize.query(rawQuery);
      eventStatsCount = validators.length;
      break;
    }
    default: {
      return [eventStatsSum, eventStatsAvg, eventStatsCount];
    }
  }
  return [eventStatsSum, eventStatsAvg, eventStatsCount];
};

export const getAPR = async (chain: String, event: String, stash: string, noOfDays: number) => {

  const todayDate = moment();
  const endDate = todayDate.add(1, 'days').format('YYYY-MM-DD');
  const startDate = todayDate.subtract(noOfDays, 'days').format('YYYY-MM-DD');

  const sessionRawQuery = `
  SELECT  event_data, created_at 
  FROM "ChainEvents" 
  WHERE chain_event_type_id  = '${chain}-new-session' 
  AND active = true
  AND created_at >= '${startDate}' AND created_at <= '${endDate}'
  AND event_data ->> 'active' LIKE '%${stash}%'
  `;

  const [sessionEvents, sessionEventsMetadata] = await sequelize.query(sessionRawQuery);


  const rewardRawQuery = `
    SELECT  event_data, created_at
    FROM "ChainEvents"
    WHERE chain_event_type_id  = '${chain}-${event}'
    AND active = true
    AND created_at >= '${startDate}' AND created_at <= '${endDate}'
    AND event_data ->>  'validator' LIKE '%${stash}%'
    ORDER BY created_at ASC
  `;
  const [rewardEvents, rewardEventsMetadata] = await sequelize.query(rewardRawQuery);

  const rewardAmountAvg = rewardEvents.reduce(
    (total, reward) => Number(total) + Number(reward.event_data.amount), 0
  ) / rewardEvents.length;

  const commissionsAvg = sessionEvents.reduce(
    (total, commission) => Number(total) + Number(commission.event_data.validatorInfo[stash].commissionPer), 0
  ) / sessionEvents.length;

  const stakeAmountAvg = sessionEvents.reduce(
    (total, totalStake) => Number(total) + Number(totalStake.event_data.activeExposures[stash].total), 0
  ) / sessionEvents.length;

  const computedAPR = (1 - commissionsAvg / 100)
    * (rewardAmountAvg / (+stakeAmountAvg))
    * (365 * (24 / 6)) * 100; // number of periods in year
  return computedAPR;
};
