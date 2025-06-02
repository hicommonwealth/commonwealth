'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'ContestManagers',
        'namespace_judge_token_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          transaction,
        },
      );
      await queryInterface.addColumn('ContestManagers', 'namespace_judges', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(
        'ContestManagers',
        'namespace_judge_token_id',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn('ContestManagers', 'namespace_judges', {
        transaction,
      });
    });
  },
};
