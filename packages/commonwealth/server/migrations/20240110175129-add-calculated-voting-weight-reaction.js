'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Reactions', 'calculated_voting_weight', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // data loss
    await queryInterface.removeColumn('Reactions', 'calculated_voting_weight');
  },
};
