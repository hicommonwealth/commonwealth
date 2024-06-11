'use strict';

/**
 * We need to perform the following actions in this migration to add offchain communities:
 * 1. Add the OffchainCommunities model
 * 2. Add community column to OffchainComment, OffchainThread, and OffchainReaction
 * 3. Add the default OffchainCommunities
 */

const newOffchainCommunitiesRecord = [
  {
    id: 'meta',
    name: 'Commonwealth Meta',
    creator_id: 1,
    description: 'All things Commonwealth',
    default_chain: 'edgeware',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // 1.
      await queryInterface.createTable(
        'OffchainCommunities',
        {
          id: { type: Sequelize.STRING, primaryKey: true },
          name: { type: Sequelize.STRING, allowNull: false },
          creator_id: { type: Sequelize.INTEGER, allowNull: false },
          default_chain: { type: Sequelize.STRING, allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
          deleted_at: { type: Sequelize.DATE },
        },
        {
          underscored: true,
          paranoid: true,
          indexes: [
            { fields: ['id'], unique: true },
            { fields: ['creator_id'] },
          ],
        },
        { transaction: t }
      );

      // 2.
      await queryInterface.addColumn(
        'OffchainComments',
        'community',
        {
          type: Sequelize.STRING,
          references: { model: 'OffchainCommunities', key: 'id' },
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        'OffchainThreads',
        'community',
        {
          type: Sequelize.STRING,
          references: { model: 'OffchainCommunities', key: 'id' },
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        'OffchainReactions',
        'community',
        {
          type: Sequelize.STRING,
          references: { model: 'OffchainCommunities', key: 'id' },
        },
        { transaction: t }
      );

      // 3. Add the default offchain communities
      await queryInterface.bulkInsert(
        'OffchainCommunities',
        newOffchainCommunitiesRecord,
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // 1. Remove association columns
      await queryInterface.removeColumn('OffchainComments', 'community', {
        transaction: t,
      });
      await queryInterface.removeColumn('OffchainThreads', 'community', {
        transaction: t,
      });
      await queryInterface.removeColumn('OffchainReactions', 'community', {
        transaction: t,
      });

      // 2. Remove communities table
      await queryInterface.dropTable('OffchainCommunities', { transaction: t });
    });
  },
};
