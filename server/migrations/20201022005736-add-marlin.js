'use strict';
const SequelizeLib = require('sequelize');
const Op = SequelizeLib.Op;

// TODO: if we can use typescript in migrations, we can simply get these
//   from the shared/events/edgeware/types file.

const MarlinEventKinds = {
  // Comp Events
  Approval = 'approval',
  DelegateChanged = 'delegate-changed',
  DelegateVotesChanged = 'delegate-votes-changed',
  Transfer = 'transfer',
  // GovernorAlpha Events
  ProposalExecuted = 'proposal-executed',
  ProposalCreated = 'proposal-created',
  ProposalCanceled = 'proposal-canceled',
  ProposalQueued = 'proposal-queued',
  VoteCast = 'vote-cast',
  // Timelock Events
  CancelTransaction = 'cancel-transaction',
  ExecuteTransaction = 'execute-transactions',
  NewAdmin = 'new-admin',
  NewDelay = 'new-delay',
  NewPendingAdmin = 'new-pending-admin',
  QueueTransaction = 'queue-transaction',
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    // add chain_event and chain_event_type tables
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'marlin',
        url: 'wss://mainnet.infura.io/ws',
        address: '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1', // COMP Contract Address
      }], { transaction: t });

      const buildObject = (event_name, chain) => ({
        id: `${chain}-${event_name}`,
        chain,
        event_name,
      });
      const marlinObjs = Object.values(MarlinEventKinds).map((s) => buildObject(s, 'marlin'));

      // TODO: somehow switch this on for testing purposes?
      return queryInterface.bulkInsert(
        'ChainEventTypes',
        [
          ...marlinObjs,
        ],
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainEventTypes', {
        chain: 'marlin',
      }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', {
        chain: 'marlin'
      }, { transaction: t });
    });
  }
};
