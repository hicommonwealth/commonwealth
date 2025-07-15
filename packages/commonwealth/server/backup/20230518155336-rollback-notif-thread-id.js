'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `ALTER TABLE "Notifications" DROP COLUMN IF EXISTS "thread_id";`
    );
  },

  down: async (queryInterface, Sequelize) => {},
};
