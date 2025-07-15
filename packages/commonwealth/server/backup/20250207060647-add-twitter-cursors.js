'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('TwitterCursors', {
      bot_name: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      last_polled_timestamp: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.dropTable('TwitterCursors');
  },
};
