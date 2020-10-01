'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'stafi',
        symbol: 'FIS',
        name: 'StaFi',
        icon_url: '/static/img/protocols/fis.png',
        type: 'chain',
        network: 'stafi',
        active: true,
        description: 'An open-source DeFi protocol built to unlock the liquidity of staked assets',
        telegram: 'https://t.me/stafi_protocol',
        website: 'https://www.stafi.io/',
        chat: 'https://discord.com/invite/jB77etn',
        github: 'https://github.com/stafiprotocol/stafi-node',
      }], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'stafi',
        url: 'wss://scan-rpc.stafi.io/',
      }], { transaction: t });

      // TODO: add stafi event types
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainNodes', { chain: 'stafi' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['stafi'] }, { transaction: t });
    });
  }
};
