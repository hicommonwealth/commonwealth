'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addConstraint(
        'Communities',
        {
          fields: ['community_indexer_id'],
          type: 'foreign key',
          name: 'fk_communities_indexer',
          references: {
            table: 'CommunityIndexers',
            field: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'Communities',
        ['community_indexer_id'],
        {
          name: 'idx_communities_indexer',
        },
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'Communities',
        'idx_communities_indexer',
        { transaction },
      );
      await queryInterface.removeConstraint(
        'Communities',
        'fk_communities_indexer',
        { transaction },
      );
    });
  },
};
