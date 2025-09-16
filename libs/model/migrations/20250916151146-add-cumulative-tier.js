'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Update Users.tier: bump tier 6->7, 7->8
      await queryInterface.sequelize.query(
        `UPDATE "Users" 
         SET tier = CASE 
           WHEN tier = 6 THEN 7
           WHEN tier = 7 THEN 8
           ELSE tier
         END 
         WHERE tier IN (6, 7);`,
        { transaction },
      );

      // Update Threads.user_tier_at_creation: bump tier 6->7, 7->8
      await queryInterface.sequelize.query(
        `UPDATE "Threads" 
         SET user_tier_at_creation = CASE 
           WHEN user_tier_at_creation = 6 THEN 7
           WHEN user_tier_at_creation = 7 THEN 8
           ELSE user_tier_at_creation
         END 
         WHERE user_tier_at_creation IN (6, 7);`,
        { transaction },
      );

      // Update Reactions.user_tier_at_creation: bump tier 6->7, 7->8
      await queryInterface.sequelize.query(
        `UPDATE "Reactions" 
         SET user_tier_at_creation = CASE 
           WHEN user_tier_at_creation = 6 THEN 7
           WHEN user_tier_at_creation = 7 THEN 8
           ELSE user_tier_at_creation
         END 
         WHERE user_tier_at_creation IN (6, 7);`,
        { transaction },
      );

      // Update Comments.user_tier_at_creation: bump tier 6->7, 7->8
      await queryInterface.sequelize.query(
        `UPDATE "Comments" 
         SET user_tier_at_creation = CASE 
           WHEN user_tier_at_creation = 6 THEN 7
           WHEN user_tier_at_creation = 7 THEN 8
           ELSE user_tier_at_creation
         END 
         WHERE user_tier_at_creation IN (6, 7);`,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Revert Users.tier: bump tier 7->6, 8->7
      await queryInterface.sequelize.query(
        `UPDATE "Users" 
         SET tier = CASE 
           WHEN tier = 7 THEN 6
           WHEN tier = 8 THEN 7
           ELSE tier
         END 
         WHERE tier IN (7, 8);`,
        { transaction },
      );

      // Revert Threads.user_tier_at_creation: bump tier 7->6, 8->7
      await queryInterface.sequelize.query(
        `UPDATE "Threads" 
         SET user_tier_at_creation = CASE 
           WHEN user_tier_at_creation = 7 THEN 6
           WHEN user_tier_at_creation = 8 THEN 7
           ELSE user_tier_at_creation
         END 
         WHERE user_tier_at_creation IN (7, 8);`,
        { transaction },
      );

      // Revert Reactions.user_tier_at_creation: bump tier 7->6, 8->7
      await queryInterface.sequelize.query(
        `UPDATE "Reactions" 
         SET user_tier_at_creation = CASE 
           WHEN user_tier_at_creation = 7 THEN 6
           WHEN user_tier_at_creation = 8 THEN 7
           ELSE user_tier_at_creation
         END 
         WHERE user_tier_at_creation IN (7, 8);`,
        { transaction },
      );

      // Revert Comments.user_tier_at_creation: bump tier 7->6, 8->7
      await queryInterface.sequelize.query(
        `UPDATE "Comments" 
         SET user_tier_at_creation = CASE 
           WHEN user_tier_at_creation = 7 THEN 6
           WHEN user_tier_at_creation = 8 THEN 7
           ELSE user_tier_at_creation
         END 
         WHERE user_tier_at_creation IN (7, 8);`,
        { transaction },
      );
    });
  },
};
