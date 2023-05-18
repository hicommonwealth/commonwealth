'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE TEMPORARY TABLE "ChainEventsTemp" AS
          SELECT *
          FROM "ChainEvents"
          WHERE entity_id IS NOT NULL;
      `,
        { raw: true, transaction }
      );

      await queryInterface.sequelize.query(
        `
        TRUNCATE "ChainEvents";
      `,
        { raw: true, transaction }
      );

      await queryInterface.sequelize.query(
        `
        INSERT INTO "ChainEvents"
        SELECT * FROM "ChainEventsTemp";
      `,
        { raw: true, transaction }
      );

      await queryInterface.sequelize.query(
        `
        DROP TABLE "ChainEventsTemp";
      `,
        { raw: true, transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    // no go chief
  },
};
