'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // add event_id to xp_logs
    await queryInterface.addColumn('XpLogs', 'event_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    // remove event_id from xp_logs
    await queryInterface.removeColumn('XpLogs', 'event_id');
  },
};
