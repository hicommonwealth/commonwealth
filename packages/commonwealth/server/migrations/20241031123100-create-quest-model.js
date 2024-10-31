'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE TYPE "enum_QuestActionMetas_participation_limit" AS ENUM('once_per_quest', 'once_per_period');
        CREATE TYPE "enum_QuestActionMetas_participation_period" AS ENUM('daily', 'weekly', 'monthly');
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE TABLE "Quests" (
          "id" SERIAL PRIMARY KEY,
          "community_id" VARCHAR(255) NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "description" VARCHAR(255) NOT NULL,
          "start_date" TIMESTAMPTZ NOT NULL,
          "end_date" TIMESTAMPTZ NOT NULL,
          "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
          "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
          UNIQUE ("community_id", "name"),
          FOREIGN KEY ("community_id") REFERENCES "Communities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE TABLE "QuestActionMetas" (
          "id" SERIAL PRIMARY KEY,
          "quest_id" INTEGER NOT NULL,
          "event_name" VARCHAR(255) NOT NULL,
          "reward_amount" INTEGER NOT NULL,
          "creator_reward_weight" FLOAT NOT NULL DEFAULT 0,
          "participation_limit" "enum_QuestActionMetas_participation_limit",
          "participation_period" "enum_QuestActionMetas_participation_period",
          "participation_times_per_period" INTEGER,
          "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
          "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY ("quest_id") REFERENCES "Quests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE TABLE "QuestActions" (
          "user_id" INTEGER NOT NULL,
          "quest_action_meta_id" INTEGER NOT NULL,
          "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
          "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
          PRIMARY KEY ("user_id", "quest_action_meta_id"),
          FOREIGN KEY ("quest_action_meta_id") REFERENCES "QuestActionMetas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY ("user_id") REFERENCES "Users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        'DROP TABLE IF EXISTS "QuestActions";',
        { transaction },
      );
      await queryInterface.sequelize.query(
        'DROP TABLE IF EXISTS "QuestActionMetas";',
        { transaction },
      );
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Quests";', {
        transaction,
      });

      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_QuestActionMeta_participation_limit";',
        { transaction },
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_QuestActionMeta_participation_period";',
        { transaction },
      );
    });
  },
};
