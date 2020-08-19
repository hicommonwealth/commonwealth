'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn(
      'OffchainCommunities',
      'visible',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    );
    const query = 'UPDATE "OffchainCommunities" SET visible=true;';
    return queryInterface.sequelize.query(query);
  },

  down: async (queryInterface, DataTypes) => {
    return queryInterface.removeColumn(
      'OffchainCommunities',
      'visible',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    );
  }
};
