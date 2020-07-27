'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    // data will be populated later, via `yarn migrate-identities`.
    return queryInterface.addColumn(
      'OffchainProfiles',
      'identity',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'OffchainProfiles',
      'identity',
    );
  }
};
