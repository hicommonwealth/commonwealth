'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Tokens',
        'chain_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        'ChainNodes',
        'eth_chain_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction }
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          eth_chain_id: 1,
        },
        {
          url: 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr',
        },
        { transaction }
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          eth_chain_id: 3,
        },
        {
          url: 'wss://eth-ropsten.alchemyapi.io/v2/2xXT2xx5AvA3GFTev3j_nB9LzWdmxPk7',
        },
        { transaction }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('ChainNodes', 'eth_chain_id', {
        transaction,
      });
      await queryInterface.removeColumn('Tokens', 'chain_id', { transaction });
    });
  },
};
