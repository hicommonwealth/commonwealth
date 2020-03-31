'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('WaitlistRegistrations', {
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      chain_id: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.STRING, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('WaitlistRegistrations');
  }
};
