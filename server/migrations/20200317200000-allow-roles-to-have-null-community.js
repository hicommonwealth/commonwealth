'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Roles', 'offchain_community_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Roles', { offchain_community_id: null });
    await queryInterface.changeColumn('Roles', 'offchain_community_id', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
