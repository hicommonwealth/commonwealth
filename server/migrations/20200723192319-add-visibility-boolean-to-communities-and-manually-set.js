'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('OffchainCommunities', 'visible', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    const query = 'UPDATE "OffchainCommunities" SET visible=true;';
    return queryInterface.sequelize.query(query);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OffchainCommunities', 'visible', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
};
