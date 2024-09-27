'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Communities',
        'banner_text',
        {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        `
          UPDATE "Communities" c
          SET banner_text = b.banner_text
          FROM "CommunityBanners" b
          WHERE c.id = b.community_id;
        `,
        {
          transaction,
        },
      );
      await queryInterface.dropTable('CommunityBanners', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'CommunityBanners',
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          banner_text: { type: Sequelize.TEXT, allowNull: false },
          chain_id: {
            type: Sequelize.STRING,
            allowNull: false,
            references: { model: 'Communities', key: 'id' },
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
          INSERT INTO "CommunityBanners" (banner_text, chain_id, created_at, updated_at)
          SELECT banner_text, id, NOW(), NOW()
          FROM "Communities" c
          WHERE c.banner_text IS NOT NULL;
       `,
        {
          transaction,
        },
      );
      await queryInterface.removeColumn('Communities', 'banner_text', {
        transaction,
      });
    });
  },
};
