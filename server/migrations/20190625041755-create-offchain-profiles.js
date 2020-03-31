'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('OffchainProfiles', {
      address_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true,
                    references: { model: 'Addresses', key: 'id' }  },
      data: { type: DataTypes.TEXT, allowNull: true },
    }, {
      underscored: true,
      indexes: [
        { fields: ['address_id'] },
      ],
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('OffchainProfiles');
  }
};
