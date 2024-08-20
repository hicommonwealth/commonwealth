'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('ContestManagers', 'farcaster_frame_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    queryInterface.removeColumn('ContestManagers', 'farcaster_frame_url');
  },
};
