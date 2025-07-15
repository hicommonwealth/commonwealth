'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const communityIds = await queryInterface.sequelize.query(
      'SELECT id FROM "OffchainCommunities"'
    );
    const chainIds = await queryInterface.sequelize.query(
      'SELECT id FROM "Chains"'
    );

    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'OffchainTopics',
        chainIds[0].map((chain) => ({
          name: 'General',
          chain_id: chain.id,
          created_at: new Date(),
          updated_at: new Date(),
        })),
        { transaction: t }
      );
      await queryInterface.bulkInsert(
        'OffchainTopics',
        communityIds[0].map((community) => ({
          name: 'General',
          community_id: community.id,
          created_at: new Date(),
          updated_at: new Date(),
        })),
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(
      'DELETE FROM "OffchainTopics" WHERE name=\'General\''
    );
  },
};
