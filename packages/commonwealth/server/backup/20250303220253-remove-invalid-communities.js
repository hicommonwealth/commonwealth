'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const community_ids = await queryInterface.sequelize.query(
        `
          SELECT "id"
          FROM "Communities"
          WHERE "name" LIKE '%<%'
             OR "name" LIKE '%>%';
      `,
        { transaction, type: Sequelize.QueryTypes.SELECT },
      );

      const communityIdsToDelete = community_ids.map(
        (community) => community.id,
      );
      if (communityIdsToDelete.length === 0) return;

      // Fetch thread IDs to delete
      const threadIdsToDelete = (
        await queryInterface.sequelize.query(
          `
              SELECT "id"
              FROM "Threads"
              WHERE "community_id" IN (:communityIds);
          `,
          {
            transaction,
            replacements: { communityIds: communityIdsToDelete },
            type: Sequelize.QueryTypes.SELECT,
          },
        )
      ).map((thread) => thread.id);

      // Fetch comment IDs to delete
      const commentIdsToDelete = (
        await queryInterface.sequelize.query(
          `
              SELECT "id"
              FROM "Comments"
              WHERE "thread_id" IN (:threadIds);
          `,
          {
            transaction,
            replacements: { threadIds: threadIdsToDelete },
            type: Sequelize.QueryTypes.SELECT,
          },
        )
      ).map((comment) => comment.id);

      // Delete reactions referencing comments
      await queryInterface.sequelize.query(
        `
          DELETE
          FROM "Reactions"
          WHERE "comment_id" IN (:commentIds);
        `,
        {
          transaction,
          replacements: { commentIds: commentIdsToDelete },
        },
      );

      // Delete reactions referencing threads
      await queryInterface.sequelize.query(
        `
          DELETE
          FROM "Reactions"
          WHERE "thread_id" IN (:threadIds);
        `,
        {
          transaction,
          replacements: { threadIds: threadIdsToDelete },
        },
      );

      // Delete comment version histories
      await queryInterface.sequelize.query(
        `
          DELETE
          FROM "CommentVersionHistories"
          WHERE "comment_id" IN (:commentIds);
        `,
        {
          transaction,
          replacements: { commentIds: commentIdsToDelete },
        },
      );

      // Delete comments
      await queryInterface.sequelize.query(
        `
          DELETE
          FROM "Comments"
          WHERE "id" IN (:commentIds);
        `,
        {
          transaction,
          replacements: { commentIds: commentIdsToDelete },
        },
      );

      // Delete thread version histories
      await queryInterface.sequelize.query(
        `
          DELETE
          FROM "ThreadVersionHistories"
          WHERE "thread_id" IN (:threadIds);
        `,
        {
          transaction,
          replacements: { threadIds: threadIdsToDelete },
        },
      );

      // Delete threads
      await queryInterface.sequelize.query(
        `
          DELETE
          FROM "Threads"
          WHERE "id" IN (:threadIds);
        `,
        {
          transaction,
          replacements: { threadIds: threadIdsToDelete },
        },
      );

      // Select address IDs to delete
      const addressIdsToDelete = (
        await queryInterface.sequelize.query(
          `
      SELECT "id"
      FROM "Addresses"
      WHERE "community_id" IN (:communityIds);
    `,
          {
            transaction,
            replacements: { communityIds: communityIdsToDelete },
            type: Sequelize.QueryTypes.SELECT,
          },
        )
      ).map((address) => address.id);

      // Delete memberships referencing the selected addresses
      await queryInterface.sequelize.query(
        `
    DELETE
    FROM "Memberships"
    WHERE "address_id" IN (:addressIds);
  `,
        {
          transaction,
          replacements: { addressIds: addressIdsToDelete },
        },
      );

      // Delete SsoTokens referencing the selected addresses
      await queryInterface.sequelize.query(
        `
  DELETE
  FROM "SsoTokens"
  WHERE "address_id" IN (:addressIds);
  `,
        {
          transaction,
          replacements: { addressIds: addressIdsToDelete },
        },
      );

      // Delete addresses with matching community_id
      await queryInterface.sequelize.query(
        `
    DELETE
    FROM "Addresses"
    WHERE "id" IN (:addressIds);
  `,
        {
          transaction,
          replacements: { addressIds: addressIdsToDelete },
        },
      );

      // Delete threads with matching community_id
      await queryInterface.sequelize.query(
        `
          DELETE
          FROM "Threads"
          WHERE "community_id" IN (:communityIds);
        `,
        {
          transaction,
          replacements: { communityIds: communityIdsToDelete },
        },
      );

      // Delete groups referencing the selected community IDs
      await queryInterface.sequelize.query(
        `
          DELETE
          FROM "Groups"
          WHERE "community_id" IN (:communityIds);
        `,
        {
          transaction,
          replacements: { communityIds: communityIdsToDelete },
        },
      );

      // Clear the selected_community_id column in the Users table
      await queryInterface.sequelize.query(
        `
          UPDATE "Users"
          SET "selected_community_id" = NULL
          WHERE "selected_community_id" IN (:communityIds);
        `,
        {
          transaction,
          replacements: { communityIds: communityIdsToDelete },
        },
      );

      // Delete topics referencing the selected community IDs
      await queryInterface.sequelize.query(
        `
          DELETE
          FROM "Topics"
          WHERE "community_id" IN (:communityIds);
        `,
        {
          transaction,
          replacements: { communityIds: communityIdsToDelete },
        },
      );

      await queryInterface.sequelize.query(
        `
          DELETE
          FROM "Communities"
          WHERE id IN (:communityIds);
      `,
        { transaction, replacements: { communityIds: communityIdsToDelete } },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    // irreversible
  },
};
