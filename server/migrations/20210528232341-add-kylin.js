'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'kylin',
        symbol: 'KYLIN',
        name: 'Kylin',
        icon_url: '/static/img/protocols/dot.png', // @TODO: Add Kylin
        type: 'chain',
        network: 'kylin',
        base: 'substrate',
        active: true,
        description: 'The Data Infrastructure for DeFi and Web3.0',
        telegram: 'https://t.me/KylinOfficial',
        website: 'https://kylin.network',
        discord: 'https://discord.gg/PwYCssr',
        github: 'https://github.com/Kylin-Network',
      }], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'kylin',
        url: '', // @TODO: Get their node
      }], { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('OffchainReactions', { chain: 'kylin' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { chain: 'kylin' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainThreads', { chain: 'kylin' }, { transaction: t });
      await queryInterface.bulkDelete('Addresses', { chain: 'kylin' }, { transaction: t });
      await queryInterface.bulkDelete('ChainEventTypes', { chain: 'kylin' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'kylin' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['kylin'] }, { transaction: t });
    });
  }
};
