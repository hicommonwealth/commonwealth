'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        -- reset logs for system quest -1
        UPDATE "XpLogs" SET "xp_points" = 10, "creator_xp_points" = 2 WHERE "action_meta_id" = -1 and "xp_points" = 20;
        UPDATE "XpLogs" SET "xp_points" = 5,  "creator_xp_points" = 0 WHERE "action_meta_id" = -2 and "xp_points" = 10;
        UPDATE "XpLogs" SET "xp_points" = 5,  "creator_xp_points" = 0 WHERE "action_meta_id" = -3 and "xp_points" = 10;

        -- reset action metas for system quest -1
        UPDATE "QuestActionMetas" SET "reward_amount" = 10 WHERE "id" = -1;
        UPDATE "QuestActionMetas" SET "reward_amount" = 5 WHERE "id" = -2;
        UPDATE "QuestActionMetas" SET "reward_amount" = 5 WHERE "id" = -3;

        -- reset awards, cap, and end system quest -1
        UPDATE "Quests" 
        SET "xp_awarded" = (SELECT SUM(xp_points + COALESCE(creator_xp_points, 0))
          FROM "XpLogs" WHERE "action_meta_id" IN (-1, -2, -3)),
        "end_date" = now(),
        "max_xp_to_end" = 2000000
        WHERE "id" = -1;

        -- ====================

        -- create  system quest -2
        INSERT INTO "Quests" (
          "id",
          "name",
          "description",
          "quest_type",
          "image_url",
          "start_date",
          "end_date",
          "xp_awarded",
          "max_xp_to_end",
          "created_at",
          "updated_at"
        )
        VALUES (
          -2,
          'Welcome to Common',
          'Onboard to Common and gain XP',
          'common',
          'https://assets.commonwealth.im/fab3f073-9bf1-4ac3-8625-8b2ee258b5a8.png',
          now(),
          '2100-03-04 20:12:54.738725+05',
          0,
          2000000,
          now(),
          now()
        );

        INSERT INTO "QuestActionMetas" (
          "id",
          "quest_id",
          "event_name",
          "reward_amount",
          "creator_reward_weight",
          "participation_limit",
          "created_at",
          "updated_at"
        )
        VALUES (-4, -2, 'SignUpFlowCompleted', 10, 0.2, 'once_per_quest', now(), now());

        INSERT INTO "QuestActionMetas" (
          "id",
          "quest_id",
          "event_name",
          "reward_amount",
          "creator_reward_weight",
          "participation_limit",
          "created_at",
          "updated_at"
        )
        VALUES (-5, -2, 'WalletLinked', 5, 0, 'once_per_quest', now(), now());

        INSERT INTO "QuestActionMetas" (
          "id",
          "quest_id",
          "event_name",
          "reward_amount",
          "creator_reward_weight",
          "participation_limit",
          "created_at",
          "updated_at"
        )
        VALUES (-6, -2, 'SSOLinked', 5, 0, 'once_per_quest', now(), now());
        `,
        { transaction },
      );
    });
  },

  async down() {},
};
