'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Add Notional
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'vlmtodo',
            symbol: 'TODO',
            name: 'DemoTODO',
            type: 'dao',
            network: 'aave',
            base: 'ethereum',
            active: true,
            has_chain_events_listener: true,
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'vlmtodo',
            url: 'wss://eth-goerli.alchemyapi.io/v2/j4q_OFABLwfgV8b8Hel7JKLXH1y3G4_y',
            address: '0x0bc4B74a7E57fa5114C894429Aeb1A1cCcA9FD94',
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
        { chain: 'vlmtodo' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: 'vlmtodo' },
        { transaction: t }
      );
    });
  }
};
