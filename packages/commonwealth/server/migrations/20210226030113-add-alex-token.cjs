'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'alex',
            network: 'alex',
            symbol: 'ALEX',
            name: '$ALEX',
            icon_url: '/static/img/protocols/alex.png',
            active: true,
            type: 'token',
            base: 'ethereum',
          },
        ],
        { transaction: t }
      );
      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'alex',
            url: 'wss://mainnet.infura.io/ws',
            address: '0x8BA6DcC667d3FF64C1A2123cE72FF5F0199E5315',
          },
        ],
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Remove addresses made in testing
      await queryInterface.bulkDelete(
        'Addresses',
        {
          chain: 'alex',
        },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Roles',
        {
          chain_id: 'alex',
        },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        {
          chain: 'alex',
        },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        {
          id: 'alex',
        },
        { transaction: t }
      );
    });
  },
};
