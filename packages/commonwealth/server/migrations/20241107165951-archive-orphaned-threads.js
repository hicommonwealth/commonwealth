'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'UPDATE "Threads" SET archived_at = CURRENT_TIMESTAMP WHERE topic_id IS NULL',
    );
  },

  async down(queryInterface, Sequelize) {},
};
