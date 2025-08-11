'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // First, check if Quest -2 already exists
      const [existingQuest] = await queryInterface.sequelize.query(
        `SELECT id FROM "Quests" WHERE "id" = -2;`,
        { transaction },
      );

      if (existingQuest.length === 0) {
        // Create Quest -2 (System Quest for manual awards and general XP events)
        await queryInterface.sequelize.query(
          `
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
            -2,                                     -- id
            'System Quest - Manual Awards',         -- name
            'System quest for manual XP awards and other system-level XP events',  -- description
            'common',                               -- quest_type
            'https://assets.commonwealth.im/fab3f073-9bf1-4ac3-8625-8b2ee258b5a8.png', -- image_url
            '2020-01-01 00:00:00+00',               -- start_date (far in the past to always be active)
            '2100-01-01 00:00:00+00',               -- end_date (far in the future to always be active)
            0,                                      -- xp_awarded
            999999999,                              -- max_xp_to_end (very high limit)
            now(),                                  -- created_at
            now()                                   -- updated_at
          );
          `,
          { transaction },
        );
      }

      // Check if the action meta -100 already exists
      const [existingActionMeta] = await queryInterface.sequelize.query(
        `SELECT id FROM "QuestActionMetas" WHERE "id" = -100;`,
        { transaction },
      );

      if (existingActionMeta.length === 0) {
        // Create Action Meta -100 for manual XP awards
        await queryInterface.sequelize.query(
          `
          INSERT INTO "QuestActionMetas" (
            "id",
            "quest_id",
            "event_name",
            "reward_amount",
            "creator_reward_weight",
            "participation_limit",
            "participation_period",
            "created_at",
            "updated_at"
          )
          VALUES (
            -100,                   -- id
            -2,                     -- quest_id (link to system quest -2)
            'XpAwarded',            -- event_name
            0,                      -- reward_amount (amount comes from the event payload)
            0,                      -- creator_reward_weight
            'once_per_period',      -- participation_limit
            'daily',                -- participation_period
            now(),                  -- created_at
            now()                   -- updated_at
          );
          `,
          { transaction },
        );
      } else {
        // Update existing action meta to point to quest -2 if it's pointing to the wrong quest
        await queryInterface.sequelize.query(
          `
          UPDATE "QuestActionMetas" 
          SET "quest_id" = -2, "updated_at" = now()
          WHERE "id" = -100 AND "quest_id" != -2;
          `,
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Remove the action meta first due to foreign key constraint
      await queryInterface.sequelize.query(
        `DELETE FROM "QuestActionMetas" WHERE "id" = -100;`,
        { transaction },
      );

      // Remove the quest
      await queryInterface.sequelize.query(
        `DELETE FROM "Quests" WHERE "id" = -2;`,
        { transaction },
      );
    });
  },
};
