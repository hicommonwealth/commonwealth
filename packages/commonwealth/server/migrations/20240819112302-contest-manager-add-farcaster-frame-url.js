'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((transaction) => {
      queryInterface.addColumn(
        'ContestManagers',
        'farcaster_frame_url',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((transaction) => {
      queryInterface.removeColumn('ContestManagers', 'farcaster_frame_url', {
        transaction,
      });
    });
  },
};
