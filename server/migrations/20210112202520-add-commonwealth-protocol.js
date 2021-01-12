'use strict';
const SequelizeLib = require('sequelize');
const Op = SequelizeLib.Op;

const CommonwealthEventKinds = {
  SubmitProposal: 'submit-proposal',
  // SubmitVote: 'submit-vote',
  // ProcessProposal: 'process-proposal',
  // Ragequit: 'ragequit',
  // Abort: 'abort',
  // UpdateDelegateKey: 'update-delegate-key',
  // SummonComplete: 'summon-complete',
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    // add chain_event and chain_event_type tables
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'commonwealth',
        name: 'Commonwealth',
        description: 'A protocol for funding public goods',
        symbol: 'CWT',
        network: 'commonwealth',
        icon_url: '/static/img/protocols/commonwealth.png',
        active: true,
        type: 'dao',
      }], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'commonwealth',
        url: 'wss://mainnet.infura.io/ws',
        address: '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1',
      }], { transaction: t });

      const buildObject = (event_name, chain) => ({
        id: `${chain}-${event_name}`,
        chain,
        event_name,
      });
      const commonwealthObjs = Object.values(CommonwealthEventKinds).map((s) => buildObject(s, 'commonwealth'));

      // TODO: somehow switch this on for testing purposes?
      return queryInterface.bulkInsert(
        'ChainEventTypes',
        [
          ...commonwealthObjs,
        ],
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainEventTypes', {
        chain: 'commonwealth',
      }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', {
        chain: 'commonwealth'
      }, { transaction: t });
      await queryInterface.bulkDelete('Chains', {
        id: 'commonwealth'
      }, { transaction: t });
    });
  }
};
