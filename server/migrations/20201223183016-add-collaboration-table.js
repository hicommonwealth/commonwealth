'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('Collaborations', {
      offchain_thread_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'OffchainThreads',
          key: 'id'
        }
      },
      address_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Addresses',
          key: 'id'
        }
      },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('Collaborations');
  }
};
