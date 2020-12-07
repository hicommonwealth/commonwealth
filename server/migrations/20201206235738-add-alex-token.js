'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'ALEX',
        url: 'wss://mainnet.infura.io/ws',
        address: '0x8BA6DcC667d3FF64C1A2123cE72FF5F0199E5315',
      }], { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainNodes', {
        chain: 'ALEX',
      }, { transaction: t });
    });
  }
};
