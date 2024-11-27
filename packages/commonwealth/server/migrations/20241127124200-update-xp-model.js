'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "XpLogs" ADD COLUMN "action_meta_id" integer;
        ALTER TABLE "XpLogs" ADD COLUMN "creator_user_id" integer;
        ALTER TABLE "XpLogs" ADD COLUMN "creator_xp_points" integer;
        ALTER TABLE "XpLogs" ADD COLUMN "event_created_at" TIMESTAMPTZ NOT NULL;

        ALTER TABLE "XpLogs" ADD CONSTRAINT "fk_xp_logs_action_meta_id"
        FOREIGN KEY ("action_meta_id") REFERENCES "QuestActionMetas" ("id");

        ALTER TABLE "XpLogs" ADD CONSTRAINT "fk_xp_logs_creator_user_id"
        FOREIGN KEY ("creator_user_id") REFERENCES "Users" ("id");

        ALTER TABLE "XpLogs" DROP CONSTRAINT "XpLogs_pkey";
        ALTER TABLE "XpLogs" ADD CONSTRAINT "XpLogs_pkey"
        PRIMARY KEY ("user_id", "event_name", "event_created_at");
        `,
        { transaction },
      );
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DROP FOREIGN KEY IF EXISTS "fk_xp_logs_action_meta_id";
        DROP FOREIGN KEY IF EXISTS "fk_xp_logs_creator_user_id";

        ALTER TABLE "XpLogs" DROP CONSTRAINT "XpLogs_pkey";
        ALTER TABLE "XpLogs" ADD CONSTRAINT "XpLogs_pkey" 
        PRIMARY KEY ("user_id", "event_name", "created_at");

        ALTER TABLE "XpLogs" DROP COLUMN "action_meta_id";
        ALTER TABLE "XpLogs" DROP COLUMN "creator_user_id";
        ALTER TABLE "XpLogs" DROP COLUMN "creator_xp_points";
        ALTER TABLE "XpLogs" DROP COLUMN "event_created_at";
        `,
        { transaction },
      );
    });
  },
};
