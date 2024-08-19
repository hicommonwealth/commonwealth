'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      // Insert tag_id of each community category ('DAO' or 'DeFi') into CommunityTags
      await queryInterface.sequelize.query(
        `
          INSERT INTO "CommunityTags" (community_id, tag_id, created_at, updated_at)
          SELECT c.id, t.id, NOW(), NOW()
            FROM "Communities" c
            JOIN "Tags" t
            ON (t.name = 'DAO' AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements_text(c.category) AS elem
                WHERE elem::text LIKE '%DAO%'
              ) AND NOT EXISTS (
                  SELECT 1
                  FROM "CommunityTags" ct
                  WHERE ct.tag_id = t.id AND ct.community_id = c.id
              ))
            OR (t.name = 'DeFi' AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements_text(c.category) AS elem
                WHERE elem::text LIKE '%DeFi%'
              ) AND NOT EXISTS (
                    SELECT 1
                    FROM "CommunityTags" ct
                    WHERE ct.tag_id = t.id AND ct.community_id = c.id
              ))
            WHERE c.category IS NOT NULL;
        `,
        { transaction: t },
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
