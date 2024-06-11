'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate(
        'Threads',
        { reaction_weights_sum: 0 },
        { reaction_weights_sum: null },
        { transaction },
      );
      await queryInterface.bulkUpdate(
        'Comments',
        { reaction_weights_sum: 0 },
        { reaction_weights_sum: null },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Threads',
        'reaction_weights_sum',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
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
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'Threads',
        'reaction_weights_sum',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'Comments',
        'reaction_weights_sum',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );
    });
  },
};
