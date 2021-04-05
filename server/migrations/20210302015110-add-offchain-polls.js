'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('OffchainVotes', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        poll_id: { type: Sequelize.INTEGER, allowNull: false },
        choice: { type: Sequelize.STRING, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      }, { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('OffchainVotes', { transaction: t });
    });
  }
};
