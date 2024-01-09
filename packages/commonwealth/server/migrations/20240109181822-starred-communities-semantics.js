'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'StarredCommunities',
        'chain',
        'community_id',
        {
          transaction,
        },
      );

      // remove duplicates
      await queryInterface.sequelize.query(
        `
        DELETE FROM "StarredCommunities"
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM "StarredCommunities"
            GROUP BY community_id, user_id
        );
      `,
        { transaction },
      );

      await queryInterface.addIndex('StarredCommunities', {
        fields: ['community_id', 'user_id'],
        unique: true,
        name: 'starred_communities_community_id_user_id',
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'StarredCommunities',
        'community_id',
        'chain',
        {
          transaction,
        },
      );
      await queryInterface.removeIndex(
        'StarredCommunities',
        'starred_communities_community_id_user_id',
        {
          transaction,
        },
      );
    });
  },
};
