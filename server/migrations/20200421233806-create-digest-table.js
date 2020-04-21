'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('DigestFlags', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      offchain_thread_id: { type: DataTypes.INTEGER, allowNull: false },
      offchain_thread_title: { type: DataTypes.TEXT, allowNull: false },
      url: { type: DataTypes.STRING, allowNull: false },
      author_id: { type: DataTypes.INTEGER, allowNull: false },
      admin_id: { type: DataTypes.INTEGER, allowNull: false },
      community_id: { type: DataTypes.STRING, allowNull: true },
      default_chain: { type: DataTypes.STRING, allowNull: true },
      votes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      active: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
      selected: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    }, {
      underscored: true,
      paranoid: true,
      indexes: [
        { fields: ['id'], unique: true },
        { fields: ['author_id'] },
        // { fields: ['offchain_thread_id'] },
      ],
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('DigestFlags');
  }
};
