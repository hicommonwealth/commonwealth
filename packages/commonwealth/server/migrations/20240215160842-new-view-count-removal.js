'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Threads', 'view_count', {
        transaction: t,
      });
      await queryInterface.renameColumn(
        'Threads',
        'new_view_count',
        'view_count',
        { transaction: t },
      );
      await queryInterface.removeColumn('Threads', 'view_count_recovered', {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Threads',
        'new_view_count',
        {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false,
        },
        { transaction: t },
      );

      await queryInterface.sequelize.query(
        `UPDATE "Threads" SET new_view_count = view_count;`,
        { transaction: t },
      );
    });
  },
};
