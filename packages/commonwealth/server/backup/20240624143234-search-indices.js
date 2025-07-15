'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        CREATE INDEX profile_name_trgm_idx ON "Profiles" USING gin (profile_name gin_trgm_ops);
        CREATE INDEX address_trgm_idx ON "Addresses" USING gin (address gin_trgm_ops);
        `,
        { transaction: t },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        DROP INDEX IF EXISTS profile_name_trgm_idx;
        DROP INDEX IF EXISTS address_trgm_idx;
      `,
        { transaction: t },
      );
    });
  },
};
