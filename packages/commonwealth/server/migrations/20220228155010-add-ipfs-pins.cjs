'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('IpfsPins', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      address_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Addresses', key: 'id' },
      },
      ipfs_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('IpfsPins');
  },
};
