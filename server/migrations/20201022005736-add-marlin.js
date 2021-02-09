'use strict';

const SequelizeLib = require('sequelize');
const Op = SequelizeLib.Op;

const MarlinEventKinds = {
  // MPond Events
  Approval: 'approval',
  DelegateChanged: 'delegate-changed',
  DelegateVotesChanged: 'delegate-votes-changed',
  Transfer: 'transfer',
  // GovernorAlpha Events
  ProposalExecuted: 'proposal-executed',
  ProposalCreated: 'proposal-created',
  ProposalCanceled: 'proposal-canceled',
  ProposalQueued: 'proposal-queued',
  VoteCast: 'vote-cast',
  // Timelock Events
  CancelTransaction: 'cancel-transaction',
  ExecuteTransaction: 'execute-transactions',
  NewAdmin: 'new-admin',
  NewDelay: 'new-delay',
  NewPendingAdmin: 'new-pending-admin',
  QueueTransaction: 'queue-transaction',
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'marlin',
        symbol: 'LIN',
        name: 'Marlin',
        icon_url: '/static/img/protocols/lin.png',
        type: 'dao',
        network: 'marlin',
        active: true,
      }, {
        id: 'marlin-testnet',
        symbol: 'TESTLIN',
        name: 'Marlin (Ropsten)',
        icon_url: '/static/img/protocols/lin.png',
        type: 'dao',
        network: 'marlin-testnet',
        active: false,
        collapsed_on_homepage: true,
      }
      ], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'marlin',
        url: 'wss://mainnet.infura.io/ws/v3/90de850aff68424ab8e7321017406586',
        address: '0xfda6d91cbc6f6f69c15bbd85fed4e3b84f6bccd4', // MPOND Contract Address
      },
      {
        chain: 'marlin-testnet',
        url: 'wss://ropsten.infura.io/ws/v3/90de850aff68424ab8e7321017406586',
        address: '0xEa2923b099b4B588FdFAD47201d747e3b9599A5f', // MPOND Contract Address (Not Valid)
      }
      ], { transaction: t });

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
      await queryInterface.bulkDelete('OffchainReactions', { chain: 'marlin' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { chain: 'marlin' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainThreads', { chain: 'marlin' }, { transaction: t });
      await queryInterface.bulkDelete('Addresses', { chain: 'marlin' }, { transaction: t });
      await queryInterface.bulkDelete('ChainEventTypes', { chain: 'marlin' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'marlin' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['marlin'] }, { transaction: t });

      await queryInterface.bulkDelete('OffchainReactions', { chain: 'marlin-testnet' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { chain: 'marlin-testnet' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainThreads', { chain: 'marlin-testnet' }, { transaction: t });
      await queryInterface.bulkDelete('Addresses', { chain: 'marlin-testnet' }, { transaction: t });
      await queryInterface.bulkDelete('ChainEventTypes', { chain: 'marlin-testnet' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'marlin-testnet' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['marlin-testnet'] }, { transaction: t });
    });
  }
};
