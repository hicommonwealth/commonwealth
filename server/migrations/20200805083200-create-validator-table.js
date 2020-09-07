'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('Validators', {
      stash: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      name: { type: DataTypes.STRING },
      controller: { type: DataTypes.STRING, allowNull: false },
      sessionKeys: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false },
      state: {
        type: DataTypes.ENUM,
        values: ['active', 'waiting', 'inactive'],
        defaultValue: 'inactive',
        allowNull: false,
      },
      preferences: {
        type: DataTypes.ENUM,
        values: ['stash-staked', 'stash-unstaked', 'controller'],
        defaultValue: 'stash-staked',
        allowNull: false,
      },
      lastUpdate: { type: DataTypes.BIGINT, allowNull: false },
      createdAt: { type: DataTypes.DATE },
      updatedAt: { type: DataTypes.DATE },
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('Validators');
  }
};
