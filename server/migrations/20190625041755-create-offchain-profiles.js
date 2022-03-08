'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'OffchainProfiles',
      {
        address_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: { model: 'Addresses', key: 'id' },
        },
        data: { type: Sequelize.TEXT, allowNull: true },
      },
      {
        underscored: true,
        indexes: [{ fields: ['address_id'] }],
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('OffchainProfiles');
  },
};
