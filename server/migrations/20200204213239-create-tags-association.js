'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('TaggedThreads', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        tag_id: { type: DataTypes.INTEGER, allowNull: false },
        thread_id: { type: DataTypes.INTEGER, allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false },
        updated_at: { type: DataTypes.DATE, allowNull: false },
      });
      await queryInterface.addColumn(
        'OffchainTags',
        'chain_id',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'OffchainTags',
        'community_id',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t },
      );
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('TaggedThreads');
      await queryInterface.removeColumn(
        'OffchainTags',
        'chain_id',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t },
      );
      await queryInterface.removeColumn(
        'OffchainTags',
        'community_id',
        {
          type: DataTypes.STRING,
          allowNull: false,
        },
        { transaction: t },
      );
    });
  },
};
