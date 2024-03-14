'use strict';

const tables = ['Threads', 'Comments', 'Reactions'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const table of tables) {
        await queryInterface.removeColumn(table, 'canvas_action', {
          transaction,
        });
        await queryInterface.removeColumn(table, 'canvas_session', {
          transaction,
        });

        await queryInterface.addColumn(
          table,
          'canvas_signed_data',
          {
            type: Sequelize.JSONB,
            allowNull: true,
          },
          { transaction },
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const table of tables) {
        await queryInterface.removeColumn(table, 'canvas_signed_data', {
          transaction,
        });

        await queryInterface.addColumn(
          table,
          'canvas_action',
          {
            type: Sequelize.JSONB,
          },
          { transaction },
        );
        await queryInterface.addColumn(
          table,
          'canvas_session',
          {
            type: Sequelize.JSONB,
          },
          { transaction },
        );
      }
    });
  },
};
