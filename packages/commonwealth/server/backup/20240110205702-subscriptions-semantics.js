'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'Subscriptions',
        'chain_id',
        'community_id',
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Subscriptions"
        RENAME CONSTRAINT "chk_chain_id_on_chain_event" TO "chk_community_id_on_chain_event";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Subscriptions"
        RENAME CONSTRAINT "chk_chain_id_on_new_thread" TO "chk_community_id_on_new_thread";
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'Subscriptions',
        'community_id',
        'chain_id',
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Subscriptions"
        RENAME CONSTRAINT "chk_community_id_on_chain_event" TO "chk_chain_id_on_chain_event";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Subscriptions"
        RENAME CONSTRAINT "chk_community_id_on_new_thread" TO "chk_chain_id_on_new_thread";
      `,
        { transaction },
      );
    });
  },
};
