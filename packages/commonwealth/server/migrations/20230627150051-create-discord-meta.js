'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Topics', 'channel_id', {
        type: Sequelize.STRING,
        allowNull: true,
        transaction,
      });

      await queryInterface.addColumn('Threads', 'discord_meta', {
        type: Sequelize.JSONB,
        allowNull: true,
        transaction,
      });

      await queryInterface.addColumn('Comments', 'discord_meta', {
        type: Sequelize.JSONB,
        allowNull: true,
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Threads', 'discord_meta', { transaction });
      await queryInterface.removeColumn('Comments', 'discord_meta', { transaction });
      await queryInterface.removeColumn('Topics', 'channel_id', { transaction });
    });
  },
};
