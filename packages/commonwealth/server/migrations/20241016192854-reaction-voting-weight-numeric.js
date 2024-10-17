'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'Reactions',
        'calculated_voting_weight',
        {
          type: Sequelize.NUMERIC(78, 0), // up to 78 digits with no decimal places
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.changeColumn(
        'Threads',
        'reaction_weights_sum',
        {
          type: Sequelize.NUMERIC(78, 0), // up to 78 digits with no decimal places
          allowNull: false,
        },
        { transaction },
      );
      await queryInterface.changeColumn(
        'Comments',
        'reaction_weights_sum',
        {
          type: Sequelize.NUMERIC(78, 0), // up to 78 digits with no decimal places
          allowNull: false,
        },
        { transaction },
      );
      await queryInterface.changeColumn(
        'Topics',
        'vote_weight_multiplier',
        {
          type: Sequelize.FLOAT,
          allowNull: true,
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
