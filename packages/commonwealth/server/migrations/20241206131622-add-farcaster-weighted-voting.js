'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'ContestManagers',
        'vote_weight_multiplier',
        {
          type: Sequelize.DOUBLE,
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'ContestActions',
        'calculated_voting_weight',
        {
          type: Sequelize.DECIMAL(78, 0),
          allowNull: true,
          defaultValue: null,
        },
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(
        'ContestManagers',
        'vote_weight_multiplier',
        { transaction },
      );
      await queryInterface.removeColumn(
        'ContestActions',
        'calculated_voting_weight',
        { transaction },
      );
    });
  },
};
