'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        -- create "artificial" system quest to award xp points on referral and address linking events
        INSERT INTO "Quests" (
          "id",
          "name",
          "description",
          "image_url",
          "start_date",
          "end_date",
          "created_at",
          "updated_at")
        VALUES (
          -1,
          'System Quest',
          'Referrals and address linking system-level quest',
          '',
          NOW(), NOW(), NOW(), NOW());

        -- create "artificial" system quest action metas for quest above
        INSERT INTO "QuestActionMetas" (
          "id",
          "quest_id",
          "event_name",
          "reward_amount",
          "creator_reward_weight",
          "participation_limit",
          "created_at",
          "updated_at")
        VALUES (-1, -1, 'SignUpFlowCompleted', 20, .2, 
        'once_per_quest', NOW(), NOW());
        INSERT INTO "QuestActionMetas" (
          "id",
          "quest_id",
          "event_name",
          "reward_amount",
          "creator_reward_weight",
          "participation_limit",
          "created_at",
          "updated_at")
        VALUES (-2, -1, 'WalletLinked', 10, 0, 
        'once_per_quest', NOW(), NOW());
        INSERT INTO "QuestActionMetas" (
          "id",
          "quest_id",
          "event_name",
          "reward_amount",
          "creator_reward_weight",
          "participation_limit",
          "created_at",
          "updated_at")
        VALUES (-3, -1, 'SSOLinked', 10, 0,
        'once_per_quest', NOW(), NOW());

        -- update existing XpLogs to use the new system quest action metas
        UPDATE "XpLogs" SET "action_meta_id" = -1 WHERE "event_name" = 'SignUpFlowCompleted';
        UPDATE "XpLogs" SET "action_meta_id" = -2 WHERE "event_name" = 'WalletLinked';
        UPDATE "XpLogs" SET "action_meta_id" = -3 WHERE "event_name" = 'SSOLinked';

        -- add action_meta_id to the PK of XpLog
        -- and remove event_name from the table since it's already in action_metas
        ALTER TABLE "XpLogs" DROP CONSTRAINT "XpLogs_pkey";
        ALTER TABLE "XpLogs" DROP COLUMN "event_name";
        ALTER TABLE "XpLogs" ADD CONSTRAINT "XpLogs_pkey"
        PRIMARY KEY ("user_id", "action_meta_id", "event_created_at");

        -- remove QuestAction table (not being used)
        DROP TABLE "QuestActions";
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `
      -- Revert the changes

      -- Restore event_name column
      ALTER TABLE "XpLogs" ADD COLUMN "event_name" TEXT;

      -- Drop the new primary key
      ALTER TABLE "XpLogs" DROP CONSTRAINT "XpLogs_pkey";

      -- Restore original primary key 
      ALTER TABLE "XpLogs" ADD CONSTRAINT "XpLogs_pkey" 
      PRIMARY KEY ("event_name", "user_id", "event_created_at");

      -- Remove the inserted system quest and quest action metas
      DELETE FROM "QuestActionMetas" WHERE "quest_id" = -1;
      DELETE FROM "Quests" WHERE "id" = -1;
      `,
      { transaction },
    );
  },
};
