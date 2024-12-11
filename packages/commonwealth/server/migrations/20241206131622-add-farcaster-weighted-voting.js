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

      await queryInterface.addConstraint('ContestActions', {
        fields: ['contest_address'],
        type: 'foreign key',
        name: 'fk_contest_actions_contest_address',
        references: {
          table: 'ContestManagers',
          field: 'contest_address',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction,
      });
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

      await queryInterface.removeConstraint(
        'ContestActions',
        'fk_contest_actions_contest_address',
        { transaction },
      );
    });
  },
};
