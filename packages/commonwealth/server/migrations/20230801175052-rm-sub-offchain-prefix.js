'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameColumn(
        'Subscriptions',
        'offchain_thread_id',
        'thread_id',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'Subscriptions',
        'offchain_comment_id',
        'comment_id',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "subscriptions_offchain_thread_id" RENAME TO "subscriptions_thread_id";
      `,
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameColumn(
        'Subscriptions',
        'thread_id',
        'offchain_thread_id',
        { transaction: t }
      );
      await queryInterface.renameColumn(
        'Subscriptions',
        'comment_id',
        'offchain_comment_id',
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        ALTER INDEX IF EXISTS "subscriptions_thread_id" RENAME TO "subscriptions_offchain_thread_id";
      `,
        { transaction: t }
      );
    });
  },
};
