'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Threads',
        'reaction_weights_sum',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Comments',
        'reaction_weights_sum',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    // data loss
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Threads', 'reaction_weights_sum', {
        transaction,
      });
      await queryInterface.removeColumn('Comments', 'reaction_weights_sum', {
        transaction,
      });
    });
  },
};
