'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
      await queryInterface.addColumn(
        'Threads',
        'view_count_recovered',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
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

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Threads', 'new_view_counts');
    await queryInterface.removeColumn('Threads', 'view_count_recovered');
  },
};
