'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Votes',
        'calculated_voting_weight',
        {
          type: Sequelize.NUMERIC(78, 0), // up to 78 digits with no decimal places
          allowNull: true,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Votes', 'calculated_voting_weight', {
        transaction,
      });
    });
  },
};
