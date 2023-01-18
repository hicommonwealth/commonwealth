'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate(
      'ChainNodes',
      {
        url: 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr',
      },
      {
        url: 'wss://mainnet.infura.io/ws',
      }
    );
    await queryInterface.bulkUpdate(
      'ChainNodes',
      {
        url: 'wss://eth-ropsten.alchemyapi.io/v2/2xXT2xx5AvA3GFTev3j_nB9LzWdmxPk7',
      },
      {
        url: 'wss://ropsten.infura.io/ws',
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate(
      'ChainNodes',
      {
        url: 'wss://mainnet.infura.io/ws',
      },
      {
        url: 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr',
      }
    );
    await queryInterface.bulkUpdate(
      'ChainNodes',
      {
        url: 'wss://ropsten.infura.io/ws',
      },
      {
        url: 'wss://eth-ropsten.alchemyapi.io/v2/2xXT2xx5AvA3GFTev3j_nB9LzWdmxPk7',
      }
    );
  },
};
