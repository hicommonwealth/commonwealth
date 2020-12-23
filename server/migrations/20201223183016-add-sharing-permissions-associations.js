'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('SharingPermissions', {
      thread_id: { type: DataTypes.INTEGER, allowNull: false },
      address_id: { type: DataTypes.INTEGER, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('SharingPermissions');
  }
};
