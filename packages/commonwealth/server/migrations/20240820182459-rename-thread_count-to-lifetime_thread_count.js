'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(
      'Communities',
      'thread_count',
      'lifetime_thread_count',
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn(
      'Communities',
      'lifetime_thread_count',
      'thread_count',
    );
  },
};
