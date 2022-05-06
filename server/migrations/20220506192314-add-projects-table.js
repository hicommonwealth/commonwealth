'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Projects', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      chain_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: { model: 'Chains', key: 'id' }
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ChainEntities', key: 'id' }
      },
      creator: { type: Sequelize.STRING, allowNull: false, },
      ipfs_hash_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'IpfsPins', key: 'id' }
      },

      token: { type: Sequelize.STRING, allowNull: false, },
      curator_fee: { type: Sequelize.STRING, allowNull: false, },
      threshold: { type: Sequelize.STRING, allowNull: false, },
      deadline: { type: Sequelize.INTEGER, allowNull: false, },
      funding_amount: { type: Sequelize.STRING, allowNull: false, },

      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Projects');
  }
};
