'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `UPDATE "Groups" SET "requirements" = jsonb_set(
        requirements::jsonb,
        '{0,data,threshold}',
        '"0"'
      ) WHERE "metadata"->>'name' = 'Community Nominated' AND is_system_managed = true`,
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `UPDATE "Groups" SET "requirements" = jsonb_set(
        requirements::jsonb,
        '{0,data,threshold}',
        '"4"'
      ) WHERE "metadata"->>'name' = 'Community Nominated' AND is_system_managed = true`,
    );
  },
};
