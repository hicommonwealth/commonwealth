'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // add new tables
      await queryInterface.createTable('ChainBases', {
        id: {
          primaryKey: true,
          type: Sequelize.STRING,
        },
      }, { transaction });
      await queryInterface.createTable('Wallets', {
        id: {
          primaryKey: true,
          type: Sequelize.STRING,
        },
        base_id: {
          type: Sequelize.STRING,
          allowNull: true,
          references: { model: 'ChainBases', key: 'id' },
        }
      }, { transaction });

      // populate new tables
      await queryInterface.bulkInsert('ChainBases', [
        { id: 'cosmos' },
        { id: 'substrate' },
        { id: 'ethereum' },
        { id: 'near' },
        { id: 'solana' },
      ], { transaction });
      await queryInterface.bulkInsert('Wallets', [
        { id: 'polkadot', base_id: 'substrate' },
        { id: 'metamask', base_id: 'ethereum' },
        { id: 'walletconnect', base_id: 'ethereum' },
        { id: 'keplr', base_id: 'cosmos' },
        { id: 'near', base_id: 'near' },
        { id: 'phantom', base_id: 'solana' },
        { id: 'terrastation' },
        { id: 'ronin' },
      ], { transaction })

      // modify chain

      // modify address
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
