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
