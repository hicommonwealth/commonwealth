'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ContestActions', 'fid', {
      type: Sequelize.INTEGER,
      allowNull: true, // adjust based on whether this column should allow null values
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ContestActions', 'fid');
  },
};
