'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE TABLE "Referrals" (
          "referrer_id" INTEGER NOT NULL,
          "referee_id" INTEGER NOT NULL,
          "event_name" VARCHAR(255) NOT NULL,
          "event_payload" JSONB NOT NULL,
          "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY ("referrer_id") REFERENCES "Users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY ("referee_id") REFERENCES "Users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          PRIMARY KEY ("referrer_id", "referee_id", "event_name", "created_at")
        );
        `,
        { transaction },
      );
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DROP TABLE "Referrals";
        `,
        { transaction },
      );
    });
  },
};
