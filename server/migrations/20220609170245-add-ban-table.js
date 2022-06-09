'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
     return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('Bans', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        address: { type: Sequelize.STRING, allowNull: false },
        chain_id: { type: Sequelize.STRING, allowNull: false, references: { model: 'Chains', key: 'id' } },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('Bans', { transaction } );
    });
  }
};
