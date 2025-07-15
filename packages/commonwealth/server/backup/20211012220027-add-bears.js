'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Add Bears
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'buzzed-bear-hideout',
            symbol: 'BEAR',
            name: 'Buzzed Bear Hideout',
            type: 'token',
            network: 'erc20',
            base: 'ethereum',
            snapshot: 'buzzedbears.eth',
            active: true,
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'buzzed-bear-hideout',
            url: 'wss://mainnet.infura.io/ws',
            address: '0x4923017F3B7fAC4e096b46e401c0662F0B7E393f',
          },
        ],
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'buzzed-bear-hideout' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['buzzed-bear-hideout'] },
        { transaction: t }
      );
    });
  },
};
