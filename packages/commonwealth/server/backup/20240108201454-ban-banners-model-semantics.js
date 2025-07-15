'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Bans
      await queryInterface.renameColumn('Bans', 'chain_id', 'community_id', {
        transaction,
      });
      await queryInterface.addIndex('Bans', {
        fields: ['community_id'],
        name: 'bans_community_id',
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Bans"
        RENAME CONSTRAINT "Bans_chain_id_fkey" TO "Bans_community_id_fkey"
      `,
        { transaction },
      );

      // CommunityBanners
      await queryInterface.renameColumn(
        'CommunityBanners',
        'chain_id',
        'community_id',
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "CommunityBanners"
        RENAME CONSTRAINT "CommunityBanners_chain_id_fkey" TO "CommunityBanners_community_id_fkey"
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Bans
      await queryInterface.renameColumn('Bans', 'community_id', 'chain_id', {
        transaction,
      });
      await queryInterface.removeIndex('Bans', 'bans_community_id', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Bans"
        RENAME CONSTRAINT "Bans_community_id_fkey" TO "Bans_chain_id_fkey"
      `,
        { transaction },
      );

      // CommunityBanners
      await queryInterface.renameColumn(
        'CommunityBanners',
        'community_id',
        'chain_id',
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "CommunityBanners"
        RENAME CONSTRAINT "CommunityBanners_community_id_fkey" TO "CommunityBanners_chain_id_fkey"
      `,
        { transaction },
      );
    });
  },
};
