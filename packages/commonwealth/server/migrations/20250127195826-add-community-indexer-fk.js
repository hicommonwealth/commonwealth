'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('Communities', {
      fields: ['indexer'],
      type: 'foreign key',
      name: 'fk_communities_indexer',
      references: {
        table: 'CommunityIndexers',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('Communities', ['indexer'], {
      name: 'idx_communities_indexer',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Communities', 'idx_communities_indexer');

    await queryInterface.removeConstraint(
      'Communities',
      'fk_communities_indexer',
    );
  },
};
