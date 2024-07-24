'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      // Find tags ids for `DAO` and `DeFi`
      const tags = await queryInterface.sequelize.query(
        `SELECT id, name FROM "Tags" WHERE name IN ('DAO', 'DeFi');`,
        { transaction: t },
      );
      const DAO = tags[0].find((tag) => tag.name === 'DAO');
      const DeFi = tags[0].find((tag) => tag.name === 'DeFi');

      // Find all communities which have a category
      const communities = await queryInterface.sequelize.query(
        `SELECT id, category FROM "Communities" WHERE category IS NOT NULL;`,
      );

      // Insert each category ('DAO' or 'DeFi') into CommunityTags
      await Promise.all(
        communities[0].map(async (community) => {
          const { id, category } = community;

          if (category) {
            if (category.includes('DAO')) {
              await queryInterface.sequelize.query(
                `INSERT INTO "CommunityTags" 
                (community_id, tag_id, created_at, updated_at) 
                VALUES 
                ($1, $2, NOW(), NOW());`,
                {
                  bind: [id, DAO.id],
                },
              );
            }
            if (category.includes('DeFi')) {
              await queryInterface.sequelize.query(
                `INSERT INTO "CommunityTags" 
                (community_id, tag_id, created_at, updated_at) 
                VALUES 
                ($1, $2, NOW(), NOW());`,
                {
                  bind: [id, DeFi.id],
                },
              );
            }
          }
        }),
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      // Find tags ids for `DAO` and `DeFi`
      const tags = await queryInterface.sequelize.query(
        `SELECT id, name FROM "Tags" WHERE name IN ('DAO', 'DeFi');`,
        { transaction: t },
      );
      const DAO = tags.find((tag) => tag.name === 'DAO');
      const DeFi = tags.find((tag) => tag.name === 'DeFi');

      // Delete all 'DAO' or 'DeFi' tags from CommunityTags
      await queryInterface.sequelize.query(
        `DELETE FROM "CommunityTags" WHERE tag_id IN ($1, $2);`,
        { transaction: t, bind: [DAO.id, DeFi.id] },
      );
    });
  },
};
