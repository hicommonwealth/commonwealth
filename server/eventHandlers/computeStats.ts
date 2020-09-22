import { SubstrateTypes } from '@commonwealth/chain-events';
import { sequelize } from '../database';
import moment from 'moment';


const getLast30DaysStats = async(chain: String, event: String, stash: String ) => {
  let thirtyDaysAvg = 0;
  let thirtyDaysCount = 0;

  const todayDate = moment();
  const startDate = todayDate.format("YYYY-MM-DD");
  const endDate = todayDate.subtract(30, 'days').format("YYYY-MM-DD");

  // If other event type ignore and do nothing.
  if (event !== SubstrateTypes.EventKind.Reward && event !== SubstrateTypes.EventKind.Slash && event !== SubstrateTypes.EventKind.Offence ) {
    return [ thirtyDaysAvg, thirtyDaysCount ];
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

      thirtyDaysCount = validators.length;
      validators.map(validator =>{
        thirtyDaysAvg = Number(thirtyDaysAvg) + Number(validator.event_data.amount)
      })
      break;
    }
    case SubstrateTypes.EventKind.Offence: {
      rawQuery += ` AND event_data ->>  'offenders' LIKE '%${stash}%'`
      const [validators, metadata] = await sequelize.query(rawQuery);
      thirtyDaysCount = validators.length; 
      break;
    }
    default: {
      return [ thirtyDaysAvg, thirtyDaysCount ];
    }
  }
  return [ thirtyDaysAvg, thirtyDaysCount ];
}

export default getLast30DaysStats;
