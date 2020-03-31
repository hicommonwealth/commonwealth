'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.changeColumn('Roles', 'offchain_community_id', { type: DataTypes.STRING, allowNull: true });
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.bulkDelete('Roles', { offchain_community_id: null });
    await queryInterface.changeColumn('Roles', 'offchain_community_id', { type: DataTypes.STRING, allowNull: false });
    return;
  }
};
