import Sequelize from 'sequelize';
import { dependencies } from '../../package.json';
const Op = Sequelize.Op;
const CHAIN_EVENTS_VERSION = dependencies['@commonwealth/chain-events'];


export const archivalNodeDbEntry = async (models) => {
  console.log(`Checking if database entry exists for chain-events version ${CHAIN_EVENTS_VERSION}`);
  const archivalNodeData = await models.ArchivalNodeExecutionEntries.findOne({
    where: {
      [Op.and]: [{ chain_event_version: CHAIN_EVENTS_VERSION }, { start_block: process.env.START_BLOCK }]
    },
  });

  if (!archivalNodeData) {
    try {
      const dbEntry = await models.ArchivalNodeExecutionEntries.create({
        start_block: process.env.START_BLOCK,
        chain_event_version: CHAIN_EVENTS_VERSION
      });
      console.log(` DB entry created for chain-events version ${CHAIN_EVENTS_VERSION} with starting block number ${process.env.START_BLOCK}`);
    } catch (err) {
      console.error(`Unable to create database entry for archival node execution: ${err.message}`);
      return true;
    }
  } else {
    console.log(`DB entry exists for chain-events version ${CHAIN_EVENTS_VERSION} with starting block number ${process.env.START_BLOCK}`);
    return true;
  }
  return false;
};
