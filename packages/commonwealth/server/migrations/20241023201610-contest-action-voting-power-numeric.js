'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'ContestActions',
        'voting_power',
        {
          type: Sequelize.NUMERIC(78, 0), // up to 78 digits with no decimal places
          allowNull: false,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    // irreversible because converting back to integer
    // may result in overflow
  },
};
