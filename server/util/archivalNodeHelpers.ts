import Sequelize from 'sequelize';
import { dependencies } from '../../package.json';
const Op = Sequelize.Op;
const CHAIN_EVENTS_VERSION = dependencies['@commonwealth/chain-events'];


export const archivalNodeDbEntry = async (models: any, startBlock: number, chain: string) => {
  console.log(`Checking if database entry exists for chain-events version ${CHAIN_EVENTS_VERSION}`);
  const archivalNodeData = await models.ArchivalNodeExecutionEntries.findOne({
    where: {
      [Op.and]: [{ chain_event_version: CHAIN_EVENTS_VERSION }, { start_block: startBlock }]
    },
  });

  if (!archivalNodeData) {
    try {
      const dbEntry = await models.ArchivalNodeExecutionEntries.create({
        start_block: startBlock,
        chain_name: chain,
        chain_event_version: CHAIN_EVENTS_VERSION
      });
      console.log(` DB entry created for chain-events version ${CHAIN_EVENTS_VERSION} with starting block number ${startBlock}`);
    } catch (err) {
      console.error(`Unable to create database entry for archival node execution: ${err.message}`);
      return true;
    }
  } else {
    console.log(`DB entry exists for chain-events version ${CHAIN_EVENTS_VERSION} with starting block number ${startBlock}`);
    return true;
  }
  return false;
};

export const updateChainEventStatus = async (models: any, startBlock: number, chain: string, eventsList: any, status: string) => {
  let chainEventStatusUpdated = false;
  if (status != "inactive" || eventsList.length === 0 || !startBlock) {
    console.error('Invalid status provided || eventsList is empty || startBlock is missing for ChainEvents');
    return chainEventStatusUpdated;
  }
  const chainEventsList = eventsList.map(event => `${chain}-${event}`)

  try {
    const updateChainEventStatus = await models.ChainEvent.update(
      { active: false }, 
      { 
        where: {
          [Op.and]: [ { chain_event_type_id: { [Op.in]: chainEventsList } },
                      { block_number: { [Op.gte]: startBlock } }
                    ],
        }
      }
    );
    chainEventStatusUpdated = true;
    console.log(`All ChainEvents records marked as inactive for ${chain} after the starting block number ${startBlock}`);
  } catch (err) {
    console.error(`Unable to update ChainEvents records as inactive after starting block number ${startBlock}:\n ${err.message}`);
  }

  return chainEventStatusUpdated;
};

export const deleteOldHistoricalValidatorsStats = async (models: any, startBlock: number, chain: string) => {
  let historicalValidatorsStatsDeleted = false;
  if (!startBlock || !chain) {
    console.error('startBlock or chain is missing for HistoricalValidatorsStats');
    return historicalValidatorsStatsDeleted;
  }

  try {
    const deleteHistoricalValidatorsStatsStatus = await models.HistoricalValidatorStatistic.destroy( 
      { 
        where: {
          [Op.and]: [ { chain_name: chain },
                      { block: { [Op.gt]: startBlock.toString() } }
                    ],
        }
      }
    );
    historicalValidatorsStatsDeleted = true;
    console.log(`All HistoricalValidatorsStats records deleted for ${chain} after the starting block number ${startBlock}`);
  } catch (err) {
    console.error(`Unable to delete HistoricalValidatorsStats records after starting block number ${startBlock}:\n ${err.message}`);
  }

  return historicalValidatorsStatsDeleted;
};
