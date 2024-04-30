'use strict';
const SequelizeLib = require('sequelize');
const Op = SequelizeLib.Op;

// TODO: if we can use typescript in migrations, we can simply get these
//   from the shared/events/edgeware/types file.

const MolochEventKinds = {
  SubmitProposal: 'submit-proposal',
  SubmitVote: 'submit-vote',
  ProcessProposal: 'process-proposal',
  Ragequit: 'ragequit',
  Abort: 'abort',
  UpdateDelegateKey: 'update-delegate-key',
  SummonComplete: 'summon-complete',
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    // add chain_event and chain_event_type tables
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'moloch',
            url: 'wss://mainnet.infura.io/ws',
            address: '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1',
          },
        ],
        { transaction: t }
      );

      const buildObject = (event_name, chain) => ({
        id: `${chain}-${event_name}`,
        chain,
        event_name,
      });
      const molochObjs = Object.values(MolochEventKinds).map((s) =>
        buildObject(s, 'moloch')
      );

      // TODO: somehow switch this on for testing purposes?
      return queryInterface.bulkInsert('ChainEventTypes', [...molochObjs], {
        transaction: t,
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(
        'ChainEventTypes',
        {
          chain: 'moloch',
        },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        {
          chain: 'moloch',
        },
        { transaction: t }
      );
    });
  },
};
