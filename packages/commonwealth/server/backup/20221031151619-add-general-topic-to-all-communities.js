'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const chains = await queryInterface.sequelize.query(
        `SELECT c.id FROM "Chains" c WHERE c.id NOT IN (SELECT DISTINCT(chain_id) FROM "Topics");`,
        { transaction }
      );
      const topics = chains[0].map((c) => {
        return {
          name: 'General',
          chain_id: c.id,
          featured_in_sidebar: true,
          created_at: new Date(),
          updated_at: new Date(),
        };
      });
      if (topics.length !== 0) {
        await queryInterface.bulkInsert('Topics', [...topics], { transaction });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Irreversible
  },
};
