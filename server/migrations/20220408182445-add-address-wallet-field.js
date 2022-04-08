'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // add column
      await queryInterface.addColumn('Addresses', 'wallet_id', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });

      // TODO
      // populate column for all but default eth addresses
      // 1. all is_magic = magic
      // 2. all AxieInfinity = ronin, all Injective = inj-metamask, all Terra = terrastation
      // 3. all solana base = phantom, all near base = near, all substrate = polkadot

      // drop is_magic field (use magic wallet instead)
      await queryInterface.removeColumn('Addresses', 'is_magic', { transaction });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Addresses', 'is_magic', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }, { transaction });

      // TODO
      // repopulate is_magic based on wallet_id === 'magic'

      await queryInterface.removeColumn('Addresses', 'wallet_id', { transaction });
    });
  }
};
