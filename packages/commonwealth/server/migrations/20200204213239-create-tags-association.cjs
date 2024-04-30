'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('TaggedThreads', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        tag_id: { type: Sequelize.INTEGER, allowNull: false },
        thread_id: { type: Sequelize.INTEGER, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      });
      await queryInterface.addColumn(
        'OffchainTags',
        'chain_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'OffchainTags',
        'community_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('TaggedThreads');
      await queryInterface.removeColumn(
        'OffchainTags',
        'chain_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.removeColumn(
        'OffchainTags',
        'community_id',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction: t }
      );
    });
  },
};
