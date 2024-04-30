'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'Notifications',
        'chain_id',
        'community_id',
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Notifications"
        RENAME CONSTRAINT "Notifications_chain_id_fkey" TO "Notifications_community_id_fkey";
      `,
        { transaction },
      );
      await queryInterface.removeIndex('Notifications', 'new_chain_event_id', {
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'Notifications',
        'community_id',
        'chain_id',
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Notifications"
        RENAME CONSTRAINT "Notifications_community_id_fkey" TO "Notifications_chain_id_fkey";
      `,
        { transaction },
      );
      await queryInterface.addIndex('Notifications', {
        fields: ['chain_event_id'],
        name: 'new_chain_event_id',
        transaction,
      });
    });
  },
};
