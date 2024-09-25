'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // for non-general topics that are in a staked community, make those topics staked
    await queryInterface.sequelize.query(`
    WITH topics_to_update AS (
      SELECT t.id
      FROM "Topics" t
      JOIN "Communities" c ON t.community_id = c.id
      JOIN "CommunityStakes" cs ON cs.community_id = c.id
      WHERE t.name != 'General'
    )
    UPDATE "Topics"
    SET weighted_voting = 'stake'
    WHERE id IN (SELECT id FROM topics_to_update);
    `);
  },

  async down(queryInterface, Sequelize) {
    // cannot revert
  },
};
